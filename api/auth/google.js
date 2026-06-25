const { verifyGoogleToken, signJWT } = require('../_utils/auth');
const { readData, writeData } = require('../_utils/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Missing credential token" });
    }

    let googleProfile;
    if (typeof credential === 'string' && credential.startsWith('mock_google_credential_')) {
      try {
        const decodedPayload = Buffer.from(credential.replace('mock_google_credential_', ''), 'base64').toString('utf8');
        googleProfile = JSON.parse(decodedPayload);
      } catch (e) {
        console.error("Failed to parse mock Google token:", e);
        return res.status(400).json({ error: "Invalid mock Google token format" });
      }
    } else {
      // Verify token with Google API
      googleProfile = await verifyGoogleToken(credential);
      if (!googleProfile) {
        return res.status(401).json({ error: "Invalid Google credential token" });
      }
    }

    const { googleId, email, name, picture } = googleProfile;

    // Load database and query user
    const data = readData();
    let user = data.users.find(u => u.googleId === googleId || u.email.toLowerCase() === email.toLowerCase());

    const isFirstLogin = !user;
    const now = new Date().toISOString();

    if (isFirstLogin) {
      // Determine role: hardcoded admin email
      const role = email.toLowerCase() === 'avipro1122@gmail.com' ? 'ADMIN' : 'USER';
      
      user = {
        id: String(data.users.length + 1),
        googleId,
        name,
        email,
        profileImage: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        role,
        createdAt: now,
        updatedAt: now,
        lastLogin: now
      };

      data.users.push(user);
      
      // Log user creation
      data.logs.push({
        id: String(data.logs.length + 1),
        email,
        action: "USER_REGISTERED",
        details: `New account created via Google. Role: ${role}`,
        timestamp: now
      });
    } else {
      // Update existing profile details and last login
      user.name = name;
      user.profileImage = picture || user.profileImage;
      user.lastLogin = now;
      user.updatedAt = now;
      
      // Force admin role if their email is the configured admin email
      if (email.toLowerCase() === 'avipro1122@gmail.com' && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
      }

      // Log login activity
      data.logs.push({
        id: String(data.logs.length + 1),
        email,
        action: "USER_LOGIN",
        details: `Logged in via Google. Current Role: ${user.role}`,
        timestamp: now
      });
    }

    writeData(data);

    // Create session JWT
    const payload = {
      id: user.id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    };

    const secret = process.env.JWT_SECRET || 'uperai-super-cryptographic-signing-key-2026-xyz';
    const token = signJWT(payload, secret, 86400); // 24 Hours duration

    // Write HttpOnly secure cookie header
    res.setHeader('Set-Cookie', `uperai_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);

    return res.status(200).json({
      success: true,
      user: payload
    });

  } catch (error) {
    console.error("Google authentication error:", error);
    return res.status(500).json({ error: "Internal server authentication error" });
  }
};
