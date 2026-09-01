import assert from "node:assert/strict";
import test from "node:test";
import { buildAllowedOrigins, isCorsOriginAllowed } from "../app";
import { isAdminUser } from "./authorization";
import { getWebPushReadiness } from "./webPush";

function withEnvironment(
  values: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("production CORS uses only the explicit origin allowlist", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://calendar.example, https://admin.example",
      REPLIT_DOMAINS: "ignored.replit.dev",
    },
    () => {
      assert.deepEqual(buildAllowedOrigins(), [
        "https://calendar.example",
        "https://admin.example",
      ]);
    },
  );
});

test("production CORS fails closed without configured origins", () => {
  withEnvironment(
    {
      NODE_ENV: "production",
      ALLOWED_ORIGINS: undefined,
      REPLIT_DOMAINS: undefined,
    },
    () => {
      assert.equal(buildAllowedOrigins(), false);
    },
  );
});

test("production CORS allows the forwarded public host as same-origin", () => {
  assert.equal(
    isCorsOriginAllowed(
      "https://calendar.example",
      false,
      "https://calendar.example",
    ),
    true,
  );
  assert.equal(
    isCorsOriginAllowed(
      "https://attacker.example",
      false,
      "https://calendar.example",
    ),
    false,
  );
});

test("production CORS still honors the explicit allowlist", () => {
  assert.equal(
    isCorsOriginAllowed(
      "https://admin.example",
      ["https://calendar.example", "https://admin.example"],
      "https://calendar.example",
    ),
    true,
  );
});

test("admin authorization accepts only authenticated application admins", () => {
  assert.equal(isAdminUser(null, "org:admin"), false);
  assert.equal(isAdminUser("user-member", "org:member"), false);
  assert.equal(isAdminUser("user-without-role", null), false);
  assert.equal(isAdminUser("user-admin", "org:admin"), true);
});

test("VAPID configuration is ready without exposing key material", () => {
  const readiness = getWebPushReadiness();
  assert.equal(readiness.ready, true, readiness.reason);
});