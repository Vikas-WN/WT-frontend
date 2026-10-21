import assert from "node:assert/strict";
import { test } from "node:test";

import { documentHref } from "../../src/utils/documentLinks.ts";

test("an object-storage reference opens through the download endpoint", () => {
  assert.equal(documentHref("s3://employee-documents/pan/1/2026/a_b.pdf"), "/api/v1/documents/download?ref=s3%3A%2F%2Femployee-documents%2Fpan%2F1%2F2026%2Fa_b.pdf");
});

test("a web link opens as typed", () => {
  assert.equal(documentHref("https://drive.example.com/file/1"), "https://drive.example.com/file/1");
});

test("an old local reference, or nothing, has nothing to open", () => {
  assert.equal(documentHref("local://uploads/old.pdf"), null);
  assert.equal(documentHref(""), null);
  assert.equal(documentHref(undefined), null);
});
