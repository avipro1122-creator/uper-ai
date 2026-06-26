import crypto from 'crypto';
import { cookies } from 'next/headers';

// Base64URL encoding helpers
const base64UrlEncode = (str: string): string => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
};

export interface JWTPayload {
  id: string;
  googleId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  profileImage: string;
  exp?: number;
}

// HS256 JWT implementation
export const signJWT = (payload: Omit<JWTPayload, 'exp'>, secret: string, expiresInSeconds = 86400): string => {
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

export const verifyJWT = (token: string, secret: string): JWTPayload | null => {
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
    
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (e) {
    return null;
  }
};

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

// Google ID token verification via Google tokeninfo API
export const verifyGoogleToken = async (idToken: string): Promise<GoogleProfile | null> => {
  try {
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

// Extract authenticated session user from cookie store
export const getSessionUser = async (): Promise<JWTPayload | null> => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('uperai_session')?.value;
    if (!sessionToken) return null;
    
    const secret = process.env.JWT_SECRET || 'uperai-super-cryptographic-signing-key-2026-xyz';
    return verifyJWT(sessionToken, secret);
  } catch (e) {
    return null;
  }
};
