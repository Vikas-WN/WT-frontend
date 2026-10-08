import assert from "node:assert/strict";
import { test } from "node:test";

import { maskText, pushBounded, routeTemplate, safePageUrl } from "../../src/utils/diagnostics.ts";

test("e-mail addresses and long tokens are hidden, and text is cut to length", () => {
  const out = maskText(`failed for amy@webknot.in with ${"a".repeat(40)} at the end`);
  assert.equal(out.includes("amy@webknot.in"), false);
  assert.match(out, /\[email\]/);
  assert.match(out, /\[token\]/);
  assert.equal(maskText("x ".repeat(500), 50).length, 50);
});

test("API paths lose their query and their ids", () => {
  assert.equal(routeTemplate("/api/v1/leave/123/approve?x=1&token=abc"), "/api/v1/leave/:id/approve");
  assert.equal(routeTemplate("/api/v1/profile"), "/api/v1/profile");
  assert.equal(routeTemplate("/api/v1/doc/3f2b8c1e-1111-4222-8333-444455556666"), "/api/v1/doc/:id");
  assert.equal(routeTemplate(`/api/v1/calendar/feed/${"z".repeat(30)}.ics`), "/api/v1/calendar/feed/:token.ics".replace(":token.ics", `${"z".repeat(30)}.ics`));
});

test("a bounded list drops the oldest", () => {
  const list = [1, 2, 3];
  pushBounded(list, 4, 3);
  pushBounded(list, 5, 3);
  assert.deepEqual(list, [3, 4, 5]);
});

test("the page address keeps the path but hides query values", () => {
  assert.equal(safePageUrl("https://app.example.com/dashboard/leave?tab=my&token=SECRET#x"), "https://app.example.com/dashboard/leave?tab=…&token=…");
  assert.equal(safePageUrl("https://app.example.com/dashboard/home"), "https://app.example.com/dashboard/home");
});
