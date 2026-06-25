const crypto = require('crypto');

// Base64URL encoding helpers
const base64UrlEncode = (str) => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
};

// HS256 JWT implementation
const signJWT = (payload, secret, expiresInSeconds = 86400) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${signatureInput}.${signature}`;
};

const verifyJWT = (token, secret) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (e) {
    return null;
  }
};

// Google ID token verification via Google tokeninfo API
const verifyGoogleToken = async (idToken) => {
  try {
    // Official Google OAuth ID token verification endpoint
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Google token validation rejected:", errText);
      return null;
    }
    const info = await res.json();
    
    // Verify audience matches the Client ID
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "68415005948-vcoko4ampiq35q696j2n1tc7d5vl7b68.apps.googleusercontent.com";
    if (info.aud !== clientId) {
      console.error(`Audience mismatch. Token: ${info.aud}, Expected: ${clientId}`);
      return null;
    }
    
    return {
      googleId: info.sub,
      email: info.email,
      name: info.name,
      picture: info.picture
    };
  } catch (e) {
    console.error("Google verification request failed:", e);
    return null;
  }
};

// Extract authenticated session user from cookie header
const getSessionUser = (req) => {
  try {
    const cookies = req.headers.cookie || '';
    const sessionToken = cookies
      .split(';')
      .find(c => c.trim().startsWith('uperai_session='))
      ?.split('=')[1];
      
    if (!sessionToken) return null;
    
    const secret = process.env.JWT_SECRET || 'uperai-super-cryptographic-signing-key-2026-xyz';
    return verifyJWT(sessionToken, secret);
  } catch (e) {
    return null;
  }
};

module.exports = {
  signJWT,
  verifyJWT,
  verifyGoogleToken,
  getSessionUser
};
