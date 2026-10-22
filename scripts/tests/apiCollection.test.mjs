import assert from "node:assert/strict";
import { test } from "node:test";
import { apiCollection, apiRecord } from "../../src/utils/apiCollection.ts";

test("assets and policies accept direct, wrapped and paginated lists", () => {
  const rows = [{ id: 1, title: "Handbook" }];
  for (const input of [rows, { data: rows }, { data: { data: rows } }, { data: { items: rows } }]) assert.deepEqual(apiCollection(input), rows);
});
test("policy category strings survive nested envelopes", () => assert.deepEqual(apiCollection({ data: { data: ["People", "Security"] } }), ["People", "Security"]));
test("missing, malformed, or empty lists never return a non-array", () => {
  for (const input of [null, undefined, {}, "invalid", { data: null }, { data: { data: [] } }]) assert.deepEqual(apiCollection(input), []);
});
test("policy details unwrap once or twice without returning the envelope", () => {
  const page = { id: 7, title: "Handbook", content: "Welcome" };
  assert.deepEqual(apiRecord({ data: { data: page } }), page);
  assert.equal(apiRecord({ data: null }), null);
});
