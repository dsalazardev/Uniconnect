import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';

/**
 * PKCE Utilities for Auth0 Authorization Code Flow
 * Implements RFC 7636 - Proof Key for Code Exchange
 */

/**
 * Generate a random string suitable for use as a code_verifier
 * @returns A random string of 128 characters
 */
function generateRandomString(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Convert hex string to Base64URL format
 * @param hex - Hex string (from crypto hash)
 * @returns Base64URL encoded string
 */
function hexToBase64Url(hex: string): string {
  // Convert hex string to binary string
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }

  // Convert binary string to Base64
  const base64 = btoa(binary);

  // Convert to Base64URL (replace + with -, / with _, remove padding)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate the code_challenge from a code_verifier
 * Uses SHA256 hash and Base64URL encoding as per RFC 7636
 * @param codeVerifier - The code_verifier string
 * @returns Base64URL encoded SHA256 hash of the code_verifier
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Hash the code_verifier with SHA256
  const hash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    codeVerifier
  );

  // Convert hex to Base64URL
  const base64url = hexToBase64Url(hash);
  return base64url;
}

/**
 * Generate a complete PKCE pair (code_verifier and code_challenge)
 * @returns Object with code_verifier and code_challenge
 */
export async function generatePKCEPair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
  };
}
