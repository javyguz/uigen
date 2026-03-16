import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

import { createSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("creates a JWT and sets an httpOnly cookie", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);

    const [name, token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(typeof token).toBe("string");

    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.expires).toBeInstanceOf(Date);
  });

  test("sets secure to false outside production", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.secure).toBe(false);
  });

  test("sets expiration to 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const options = mockCookieStore.set.mock.calls[0][2];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs);
  });

  test("embeds userId and email in the JWT payload", async () => {
    await createSession("abc-123", "hello@world.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("abc-123");
    expect(payload.email).toBe("hello@world.com");
  });
});
