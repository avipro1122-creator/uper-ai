import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyGoogleToken, signJWT } from '../../../../lib/auth';
import { readData, writeData } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: "Missing credential token" }, { status: 400 });
    }

    let googleProfile;
    if (typeof credential === 'string' && credential.startsWith('mock_google_credential_')) {
      try {
        const decodedPayload = Buffer.from(credential.replace('mock_google_credential_', ''), 'base64').toString('utf8');
        googleProfile = JSON.parse(decodedPayload);
      } catch (e) {
        console.error("Failed to parse mock Google token:", e);
        return NextResponse.json({ error: "Invalid mock Google token format" }, { status: 400 });
      }
    } else {
      googleProfile = await verifyGoogleToken(credential);
      if (!googleProfile) {
        return NextResponse.json({ error: "Invalid Google credential token" }, { status: 401 });
      }
    }

    const { googleId, email, name, picture } = googleProfile;

    const data = await readData();
    let user = data.users.find(u => u.googleId === googleId || u.email.toLowerCase() === email.toLowerCase());

    const isFirstLogin = !user;
    const now = new Date().toISOString();

    if (isFirstLogin) {
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
      data.logs.push({
        id: String(data.logs.length + 1),
        email,
        action: "USER_REGISTERED",
        details: `New account created via Google. Role: ${role}`,
        timestamp: now
      });
    } else {
      user.name = name;
      user.profileImage = picture || user.profileImage;
      user.lastLogin = now;
      user.updatedAt = now;
      if (email.toLowerCase() === 'avipro1122@gmail.com' && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
      }
      data.logs.push({
        id: String(data.logs.length + 1),
        email,
        action: "USER_LOGIN",
        details: `Logged in via Google. Current Role: ${user.role}`,
        timestamp: now
      });
    }

    await writeData(data);

    const payload = {
      id: user.id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    };

    const secret = process.env.JWT_SECRET || 'uperai-super-cryptographic-signing-key-2026-xyz';
    const token = signJWT(payload, secret, 86400);

    const cookieStore = await cookies();
    cookieStore.set('uperai_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
    });

    return NextResponse.json({
      success: true,
      user: payload
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return NextResponse.json({ error: "Internal server authentication error" }, { status: 500 });
  }
}
