import { describe, expect, it } from "vitest";
import {
  REQUIRED_PRODUCTION_KEYS,
  checkLoginRedirect,
  evaluateBundledEnv,
  isLocalhostValue,
  isSensitiveKeyName,
  parseSecretListOutput,
  parseWranglerVarNames,
  stripJsonComments,
} from "../lib/deploy-checks.mjs";

describe("isLocalhostValue", () => {
  it.each([
    "http://localhost:3000",
    "http://localhost",
    "https://LOCALHOST:8787/path",
    "http://127.0.0.1:8787",
    "http://0.0.0.0:3000",
    "http://[::1]:3000",
    "postgresql://user:pass@localhost:5432/db",
  ])("treats %s as localhost", (value) => {
    expect(isLocalhostValue(value)).toBe(true);
  });

  it.each([
    "https://support.resp.work",
    "https://notlocalhost.example.com",
    "https://localhost.example.com",
    "postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require",
    "",
    "manual",
  ])("does not treat %s as localhost", (value) => {
    expect(isLocalhostValue(value)).toBe(false);
  });
});

describe("isSensitiveKeyName", () => {
  it.each([
    "GOOGLE_PLAY_PRIVATE_KEY",
    "CRON_SECRET",
    "AUTH0_CLIENT_SECRET",
    "ANDROID_REQUEST_NOTIFY_BEARER_TOKEN",
    "ANDROID_REQUEST_NOTIFY_WEBHOOK_URL",
    "DATABASE_URL",
    "DB_PASSWORD",
    "SOME_API_KEY",
  ])("treats %s as sensitive", (key) => {
    expect(isSensitiveKeyName(key)).toBe(true);
  });

  it.each([
    "ANDROID_REQUEST_ADMIN_PAGE_URL",
    "ANDROID_TEST_JOIN_URL",
    "ANDROID_ENROLLMENT_PROVIDER",
    "GOOGLE_PLAY_PACKAGE_NAME",
    "GOOGLE_PLAY_TRACK",
    "NEXT_PUBLIC_AUTH0_CLIENT_ID",
    "KEYBOARD_LAYOUT",
  ])("does not treat %s as sensitive", (key) => {
    expect(isSensitiveKeyName(key)).toBe(false);
  });
});

describe("stripJsonComments", () => {
  it("removes line and block comments but keeps // inside strings", () => {
    const text = `{
      // line comment
      "url": "https://support.resp.work", /* block */
      "escaped": "a \\" // not a comment"
    }`;
    expect(JSON.parse(stripJsonComments(text))).toEqual({
      url: "https://support.resp.work",
      escaped: 'a " // not a comment',
    });
  });
});

describe("parseWranglerVarNames", () => {
  it("returns top-level vars keys from wrangler.jsonc", () => {
    const text = `{
      "name": "hello-next-js",
      // comment
      "vars": { "ANDROID_TEST_JOIN_URL": "https://play.google.com/apps/testing/x", "ANDROID_ENROLLMENT_PROVIDER": "manual" }
    }`;
    expect(parseWranglerVarNames(text)).toEqual([
      "ANDROID_TEST_JOIN_URL",
      "ANDROID_ENROLLMENT_PROVIDER",
    ]);
  });

  it("returns an empty list when vars is absent", () => {
    expect(parseWranglerVarNames(`{ "name": "hello-next-js" }`)).toEqual([]);
  });

  it("throws on invalid JSONC", () => {
    expect(() => parseWranglerVarNames("{ name: }")).toThrow();
  });
});

describe("parseSecretListOutput", () => {
  it("extracts names from wrangler secret list JSON even with a banner", () => {
    const stdout = ` ⛅️ wrangler 4.64.0
[
  { "name": "AUTH0_DOMAIN", "type": "secret_text" },
  { "name": "DATABASE_URL", "type": "secret_text" }
]`;
    expect(parseSecretListOutput(stdout)).toEqual(["AUTH0_DOMAIN", "DATABASE_URL"]);
  });

  it("returns an empty list for an empty array", () => {
    expect(parseSecretListOutput("[]")).toEqual([]);
  });

  it("throws when no JSON array is present", () => {
    expect(() => parseSecretListOutput("✘ [ERROR] Not logged in")).toThrow();
  });
});

describe("evaluateBundledEnv", () => {
  const configuredAll = [...REQUIRED_PRODUCTION_KEYS];

  it("passes when all required keys are configured, even if the bundle has localhost for them", () => {
    const result = evaluateBundledEnv({
      bundled: { AUTH0_APP_BASE_URL: "http://localhost:3000" },
      configuredKeys: configuredAll,
    });
    expect(result).toEqual({
      missingRequired: [],
      localhostOnlyInBundle: [],
      sensitiveOnlyInBundle: [],
      bundleOnly: [],
    });
  });

  it("reports required keys that are only in the bundle or nowhere", () => {
    const result = evaluateBundledEnv({
      bundled: { DATABASE_URL: "postgresql://ep-xxx.neon.tech/db" },
      configuredKeys: configuredAll.filter((k) => k !== "DATABASE_URL" && k !== "JOB_ADMIN_KEY"),
    });
    expect(result.missingRequired).toEqual(["DATABASE_URL", "JOB_ADMIN_KEY"]);
  });

  it("reports localhost values that would reach production via the bundle", () => {
    const result = evaluateBundledEnv({
      bundled: {
        ANDROID_REQUEST_ADMIN_PAGE_URL: "http://localhost:3000/admin/android-requests",
        ANDROID_TEST_JOIN_URL: "https://play.google.com/apps/testing/x",
      },
      configuredKeys: configuredAll,
    });
    expect(result.localhostOnlyInBundle).toEqual(["ANDROID_REQUEST_ADMIN_PAGE_URL"]);
    expect(result.bundleOnly).toEqual(["ANDROID_REQUEST_ADMIN_PAGE_URL", "ANDROID_TEST_JOIN_URL"]);
  });

  it("reports sensitive keys that would reach production only via the bundle", () => {
    const result = evaluateBundledEnv({
      bundled: {
        GOOGLE_PLAY_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----x",
        CRON_SECRET: "abc",
        GOOGLE_PLAY_PACKAGE_NAME: "work.resp",
        AUTH0_CLIENT_SECRET: "overridden-by-secret",
      },
      configuredKeys: configuredAll,
    });
    expect(result.sensitiveOnlyInBundle).toEqual(["GOOGLE_PLAY_PRIVATE_KEY", "CRON_SECRET"]);
  });

  it("does not leak values in its result", () => {
    const result = evaluateBundledEnv({
      bundled: { SOME_TOKEN: "super-secret-value" },
      configuredKeys: [],
    });
    expect(JSON.stringify(result)).not.toContain("super-secret-value");
  });
});

describe("checkLoginRedirect", () => {
  const expectedOrigin = "https://support.resp.work";
  const authorize = (redirectUri) =>
    `https://tenant.us.auth0.com/authorize?client_id=abc&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=s`;

  it("accepts a redirect_uri pointing at the production callback", () => {
    const result = checkLoginRedirect(authorize("https://support.resp.work/api/auth/callback"), expectedOrigin);
    expect(result).toEqual({ ok: true, redirectUri: "https://support.resp.work/api/auth/callback" });
  });

  it("rejects a localhost redirect_uri (the 2026-11-08 incident)", () => {
    const result = checkLoginRedirect(authorize("http://localhost:3000/api/auth/callback"), expectedOrigin);
    expect(result.ok).toBe(false);
    expect(result.redirectUri).toBe("http://localhost:3000/api/auth/callback");
  });

  it("rejects a redirect_uri on the right origin but wrong path", () => {
    const result = checkLoginRedirect(authorize("https://support.resp.work/callback"), expectedOrigin);
    expect(result.ok).toBe(false);
  });

  it("tolerates a trailing slash in the expected origin", () => {
    const result = checkLoginRedirect(authorize("https://support.resp.work/api/auth/callback"), "https://support.resp.work/");
    expect(result.ok).toBe(true);
  });

  it("rejects a missing Location header (e.g. 500 from an empty secret)", () => {
    const result = checkLoginRedirect(null, expectedOrigin);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Location/);
  });

  it("rejects a Location without redirect_uri", () => {
    const result = checkLoginRedirect("https://tenant.us.auth0.com/authorize?client_id=abc", expectedOrigin);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/redirect_uri/);
  });
});
