import assert from "node:assert/strict";
import { test } from "node:test";

import { subscriptionBody, urlBase64ToUint8Array } from "../../src/lib/push.ts";

test("a VAPID public key (base64url) becomes the raw 65-byte point", () => {
  // 65 bytes: 0x04 then 64 bytes
  const raw = new Uint8Array([4, ...Array.from({ length: 64 }, (_, i) => i)]);
  const b64url = Buffer.from(raw).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const out = urlBase64ToUint8Array(b64url);
  assert.equal(out.length, 65);
  assert.deepEqual(Array.from(out), Array.from(raw));
});

test("padding is restored for lengths that need it", () => {
  assert.deepEqual(Array.from(urlBase64ToUint8Array("AQI")), [1, 2]);
  assert.deepEqual(Array.from(urlBase64ToUint8Array("AQ")), [1]);
});

test("a subscription is sent as endpoint plus base64url keys", () => {
  const key = (bytes) => new Uint8Array(bytes).buffer;
  const sub = { endpoint: "https://push.example/abc", getKey: (name) => (name === "p256dh" ? key([251, 255]) : key([1, 2, 3])) };
  const body = subscriptionBody(sub);
  assert.equal(body.endpoint, "https://push.example/abc");
  assert.equal(body.keys.p256dh, "-_8"); // 0xFB 0xFF -> "+/8=" -> url-safe, unpadded
  assert.equal(body.keys.auth, "AQID");
});
