import { jest } from "@jest/globals";

type CompareInput = { password: string; salt: string; hashedPassword: string };

export const generateSalt = jest.fn(() => "salt");
export const hashPassword = jest.fn(async () => "hashed-password");
export const comparePasswords = jest.fn(async () => true);
export const createSession = jest.fn(async () => undefined);
export const deleteSession = jest.fn(async () => undefined);
export const generateSessionId = jest.fn(() => "session-id");
export const getSessionExpirationSeconds = jest.fn(() => 3600);
export const getSession = jest.fn(async () => null as null | { userId: number });

export function resetAuthUtilsMocks() {
  generateSalt.mockReset().mockReturnValue("salt");
  hashPassword.mockReset().mockResolvedValue("hashed-password");
  comparePasswords.mockReset().mockResolvedValue(true);
  createSession.mockReset().mockResolvedValue(undefined);
  deleteSession.mockReset().mockResolvedValue(undefined);
  generateSessionId.mockReset().mockReturnValue("session-id");
  getSessionExpirationSeconds.mockReset().mockReturnValue(3600);
  getSession.mockReset().mockResolvedValue(null);
}

export default {
  generateSalt,
  hashPassword,
  comparePasswords,
  createSession,
  deleteSession,
  generateSessionId,
  getSessionExpirationSeconds,
  getSession,
};
