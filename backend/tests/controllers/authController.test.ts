import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from "@jest/globals";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createMockRequest, createMockResponse } from "../utils/express";
import {
  mockDb,
  resetDbMocks,
  enqueueInsertOperation,
  enqueueUpdateOperation,
  enqueueDeleteOperation,
} from "../utils/drizzleMock";

const authUtilsMockModule = await import("../mocks/authUtils.mock");
const {
  generateSalt: generateSaltMock,
  hashPassword: hashPasswordMock,
  comparePasswords: comparePasswordsMock,
  createSession: createSessionMock,
  deleteSession: deleteSessionMock,
  generateSessionId: generateSessionIdMock,
  getSessionExpirationSeconds: getSessionExpirationSecondsMock,
  resetAuthUtilsMocks,
} = authUtilsMockModule;

const generateOtpMock = jest.fn(() => "123456");
const sendOtpEmailMock = jest.fn(async () => true);
const sendPasswordResetEmailMock = jest.fn(async () => true);

jest.unstable_mockModule("../../src/drizzle", () => ({
  db: mockDb,
}));

jest.unstable_mockModule("../../src/utils/authUtils", () => ({
  generateSalt: generateSaltMock,
  hashPassword: hashPasswordMock,
  comparePasswords: comparePasswordsMock,
  createSession: createSessionMock,
  deleteSession: deleteSessionMock,
  generateSessionId: generateSessionIdMock,
  getSessionExpirationSeconds: getSessionExpirationSecondsMock,
  getSession: authUtilsMockModule.getSession,
}));

jest.unstable_mockModule("../../src/mailer/authmailer", () => ({
  generateOTP: generateOtpMock,
  sendOtpEmail: sendOtpEmailMock,
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}));

const authControllerModule = await import("../../src/controller/authController");
const {
  registerController,
  loginController,
  logoutController,
  verifyEmailController,
  resendOtpController,
  forgotPasswordController,
  resetPasswordController,
} = authControllerModule;

const { users, userEmailVerification, passwordResetTokens } = await import("../../src/drizzle/schema");

function getMockedResponse() {
  return createMockResponse();
}

const asMock = (fn: unknown) => fn as jest.Mock;
const resolveMock = <T>(fn: unknown, value: T) => asMock(fn).mockImplementation(async () => value);
const resolveMockOnce = <T>(fn: unknown, value: T) =>
  asMock(fn).mockImplementationOnce(async () => value);

function expectStatus(res: Response, status: number) {
  expect(res.status).toHaveBeenCalledWith(status);
}

beforeAll(() => {
  process.env.COOKIE_SESSION_KEY = "session_cookie_key";
});

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
  resetAuthUtilsMocks();
  generateOtpMock.mockReturnValue("123456");
  sendOtpEmailMock.mockResolvedValue(true);
  sendPasswordResetEmailMock.mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("registerController", () => {
  it("rejects when user already exists", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 5 });

    await registerController(req as Request, res as Response);

    expectStatus(res, StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "User already exists" }),
    );
    expect(asMock(mockDb.insert)).not.toHaveBeenCalledWith(users);
  });

  it("returns 500 when OTP email fails", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [{ id: 42, userName: "Jane" }] });
  resolveMockOnce(sendOtpEmailMock, false);

    await registerController(req as Request, res as Response);

    expectStatus(res, StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error sending verification email" }),
    );
    expect(asMock(mockDb.insert)).toHaveBeenCalledWith(users);
  });

  it("creates user and sends OTP", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [{ id: 21, userName: "Jane" }] });

    await registerController(req as Request, res as Response);

    expect(asMock(mockDb.insert)).toHaveBeenCalledWith(users);
    expect(asMock(sendOtpEmailMock)).toHaveBeenCalledWith("jane@example.com", "123456", "Jane");
    expectStatus(res, StatusCodes.CREATED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it("returns 500 when user creation fails", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [] }); // Simulate insert failure

    await registerController(req as Request, res as Response);

    expectStatus(res, StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error While creating user" }),
    );
    expect(asMock(mockDb.insert)).toHaveBeenCalledWith(users);
  });

  it("handles database exception during user insert", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, null);
    asMock(mockDb.insert).mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    await registerController(req as Request, res as Response);

    expectStatus(res, StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error" }),
    );
  });

  it("handles database exception during OTP insert", async () => {
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [{ id: 21, userName: "Jane" }] });
    asMock(mockDb.insert).mockImplementationOnce(() => {
      throw new Error("OTP insert failed");
    });

    await registerController(req as Request, res as Response);

    expectStatus(res, StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal server error" }),
    );
  });


  it("creates user with special characters in name", async () => {
    const req = createMockRequest({
      body: { user_name: "Jäne D'oe", user_email: "jane@example.com", user_password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [{ id: 21, userName: "Jäne D'oe" }] });

    await registerController(req as Request, res as Response);

    expect(asMock(mockDb.insert)).toHaveBeenCalledWith(users);
    expect(asMock(sendOtpEmailMock)).toHaveBeenCalledWith("jane@example.com", "123456", "Jäne D'oe");
    expectStatus(res, StatusCodes.CREATED);
  });

  it("creates user with long email", async () => {
    const longEmail = "a".repeat(200) + "@example.com";
    const req = createMockRequest({
      body: { user_name: "Jane", user_email: longEmail, user_password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, null);
    enqueueInsertOperation({ returning: [{ id: 21, userName: "Jane" }] });

    await registerController(req as Request, res as Response);

    expect(asMock(mockDb.insert)).toHaveBeenCalledWith(users);
    expect(asMock(sendOtpEmailMock)).toHaveBeenCalledWith(longEmail, "123456", "Jane");
    expectStatus(res, StatusCodes.CREATED);
  });
});

describe("loginController", () => {
  it("rejects invalid email", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com", password: "secret" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, null);

    await loginController(req as Request, res as Response);

    expectStatus(res, StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("requires verified user", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com", password: "secret" } });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, {
      userId: 1,
      userEmail: "a@example.com",
      isVerified: false,
      salt: "salt",
      password: "hashed",
    });

    await loginController(req as Request, res as Response);

    expectStatus(res, StatusCodes.UNAUTHORIZED);
    expect(comparePasswordsMock).not.toHaveBeenCalled();
  });

  it("requires password hash data", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com", password: "secret" } });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, {
      userId: 1,
      userEmail: "a@example.com",
      isVerified: true,
    });

    await loginController(req as Request, res as Response);

    expectStatus(res, StatusCodes.UNAUTHORIZED);
    expect(comparePasswordsMock).not.toHaveBeenCalled();
  });

  it("rejects invalid password", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com", password: "secret" } });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, {
      userId: 1,
      userEmail: "a@example.com",
      isVerified: true,
      salt: "salt",
      password: "hashed",
    });
    resolveMockOnce(comparePasswordsMock, false);

    await loginController(req as Request, res as Response);

    expectStatus(res, StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("logs in and sets cookie", async () => {
    const req = createMockRequest({
      body: { user_email: "a@example.com", password: "secret" },
    });
    const res = getMockedResponse();

    resolveMock(mockDb.query.users.findFirst, {
      userId: 1,
      userEmail: "a@example.com",
      isVerified: true,
      salt: "salt",
      password: "hashed",
    });
    resolveMockOnce(comparePasswordsMock, true);

    await loginController(req as Request, res as Response);

    expect(asMock(createSessionMock)).toHaveBeenCalledWith("session-id", 1);
    expect(res.cookie).toHaveBeenCalledWith(
      "session_cookie_key",
      "session-id",
      expect.objectContaining({ httpOnly: true }),
    );
    expectStatus(res, StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe("logoutController", () => {
  it("deletes session when cookie present", async () => {
    const req = createMockRequest({ cookies: { session_cookie_key: "session-id" } });
    const res = getMockedResponse();

    await logoutController(req as Request, res as Response);

  expect(asMock(deleteSessionMock)).toHaveBeenCalledWith("session-id");
    expect(res.clearCookie).toHaveBeenCalledWith("session_cookie_key");
    expectStatus(res, StatusCodes.OK);
  });

  it("handles missing cookie", async () => {
    const req = createMockRequest({ cookies: {} });
    const res = getMockedResponse();

    await logoutController(req as Request, res as Response);

    expect(deleteSessionMock).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith("session_cookie_key");
    expectStatus(res, StatusCodes.OK);
  });
});

describe("verifyEmailController", () => {
  it("rejects invalid otp", async () => {
    const req = createMockRequest({
      body: { user_email: "a@example.com", otp_code: "111111" },
    });
    const res = getMockedResponse();

  resolveMock(mockDb.query.userEmailVerification.findFirst, null);

    await verifyEmailController(req as Request, res as Response);

    expectStatus(res, StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("rejects expired otp", async () => {
    const req = createMockRequest({
      body: { user_email: "a@example.com", otp_code: "111111" },
    });
    const res = getMockedResponse();

    const reference = "2024-01-01T00:00:00";
    jest.useFakeTimers().setSystemTime(new Date("2024-01-01T00:20:00Z"));

    resolveMock(mockDb.query.userEmailVerification.findFirst, {
      verificationId: 1,
      userId: 2,
      userEmail: "a@example.com",
      otpCode: "111111",
      createdAt: reference,
      updatedAt: reference,
    });

    await verifyEmailController(req as Request, res as Response);

    expectStatus(res, StatusCodes.BAD_REQUEST);
  });

  it("verifies email and creates session", async () => {
    const req = createMockRequest({
      body: { user_email: "a@example.com", otp_code: "111111" },
    });
    const res = getMockedResponse();

    const now = new Date();
    resolveMock(mockDb.query.userEmailVerification.findFirst, {
      verificationId: 1,
      userId: 2,
      userEmail: "a@example.com",
      otpCode: "111111",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    resolveMock(mockDb.query.users.findFirst, {
      userId: 2,
      userName: "Alice",
      userEmail: "a@example.com",
    });
    enqueueUpdateOperation({ resolved: [] });
    enqueueDeleteOperation({ resolved: [] });

    await verifyEmailController(req as Request, res as Response);

  expect(asMock(createSessionMock)).toHaveBeenCalledWith("session-id", 2);
    expect(res.cookie).toHaveBeenCalled();
    expectStatus(res, StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe("resendOtpController", () => {
  it("returns 404 for missing user", async () => {
    const req = createMockRequest({ body: { user_email: "x@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, null);

    await resendOtpController(req as Request, res as Response);

    expectStatus(res, StatusCodes.NOT_FOUND);
  });

  it("rejects already verified users", async () => {
    const req = createMockRequest({ body: { user_email: "x@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 1, isVerified: true });

    await resendOtpController(req as Request, res as Response);

    expectStatus(res, StatusCodes.BAD_REQUEST);
  });

  it("updates existing otp record", async () => {
    const req = createMockRequest({ body: { user_email: "x@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 1, isVerified: false, userName: "Bob" });
  resolveMock(mockDb.query.userEmailVerification.findFirst, { verificationId: 10 });
    enqueueUpdateOperation({ resolved: [] });

    await resendOtpController(req as Request, res as Response);

  expect(asMock(mockDb.update)).toHaveBeenCalledWith(userEmailVerification);
  expect(asMock(sendOtpEmailMock)).toHaveBeenCalledWith("x@example.com", "123456", "Bob");
    expectStatus(res, StatusCodes.OK);
  });

  it("creates a new otp record when missing", async () => {
    const req = createMockRequest({ body: { user_email: "x@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 1, isVerified: false, userName: "Bob" });
  resolveMock(mockDb.query.userEmailVerification.findFirst, null);
    enqueueInsertOperation({ resolved: [] });

    await resendOtpController(req as Request, res as Response);

  expect(asMock(mockDb.insert)).toHaveBeenCalledWith(userEmailVerification);
  expect(asMock(sendOtpEmailMock)).toHaveBeenCalledWith("x@example.com", "123456", "Bob");
    expectStatus(res, StatusCodes.OK);
  });
});

describe("forgotPasswordController", () => {
  it("always returns ok for unknown user", async () => {
    const req = createMockRequest({ body: { user_email: "unknown@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, null);

    await forgotPasswordController(req as Request, res as Response);

    expectStatus(res, StatusCodes.OK);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("returns 500 when email fails", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 3, userName: "Jane" });
    enqueueDeleteOperation({ resolved: [] });
    enqueueInsertOperation({ resolved: [] });
  resolveMockOnce(sendPasswordResetEmailMock, false);

    await forgotPasswordController(req as Request, res as Response);

    expectStatus(res, StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("creates reset token and emails", async () => {
    const req = createMockRequest({ body: { user_email: "a@example.com" } });
    const res = getMockedResponse();

  resolveMock(mockDb.query.users.findFirst, { userId: 3, userName: "Jane" });
    enqueueDeleteOperation({ resolved: [] });
    enqueueInsertOperation({ resolved: [] });

    await forgotPasswordController(req as Request, res as Response);

  expect(asMock(mockDb.delete)).toHaveBeenCalledWith(passwordResetTokens);
  expect(asMock(mockDb.insert)).toHaveBeenCalledWith(passwordResetTokens);
  expect(asMock(sendPasswordResetEmailMock)).toHaveBeenCalled();
    expectStatus(res, StatusCodes.OK);
  });
});

describe("resetPasswordController", () => {
  it("rejects invalid token", async () => {
    const req = createMockRequest({
      body: { token: "bad", new_password: "secret" },
    });
    const res = getMockedResponse();

  resolveMock(mockDb.query.passwordResetTokens.findFirst, null);

    await resetPasswordController(req as Request, res as Response);

    expectStatus(res, StatusCodes.BAD_REQUEST);
  });

  it("updates password and marks token used", async () => {
    const req = createMockRequest({
      body: { token: "good", new_password: "secret" },
    });
    const res = getMockedResponse();

    const tokenRecord = { tokenId: 5, userId: 7 };
  resolveMock(mockDb.query.passwordResetTokens.findFirst, tokenRecord);
    enqueueUpdateOperation({ resolved: [] });
    enqueueUpdateOperation({ resolved: [] });

    await resetPasswordController(req as Request, res as Response);

  expect(asMock(mockDb.update)).toHaveBeenCalledWith(users);
  expect(asMock(mockDb.update)).toHaveBeenCalledWith(passwordResetTokens);
    expectStatus(res, StatusCodes.OK);
  });
});
