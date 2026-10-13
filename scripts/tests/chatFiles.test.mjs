import assert from "node:assert/strict";
import test from "node:test";

import { applySlashCommand, chatFileKind, formatBytes, validateChatFile } from "../../src/utils/chatFiles.ts";

test("accepts documents, photos and video within their limits", () => {
  assert.equal(validateChatFile({ name: "Plan.PDF", size: 1000 }), null);
  assert.equal(validateChatFile({ name: "a.jpg", size: 9 * 1024 * 1024 }), null);
  assert.equal(validateChatFile({ name: "clip.mp4", size: 19 * 1024 * 1024 }), null);
});

test("refuses unknown types, empty files and oversized ones with a plain message", () => {
  assert.match(validateChatFile({ name: "x.exe", size: 10 }) ?? "", /can't be sent/);
  assert.match(validateChatFile({ name: "x.html", size: 10 }) ?? "", /can't be sent/);
  assert.match(validateChatFile({ name: "a.png", size: 0 }) ?? "", /empty/);
  assert.match(validateChatFile({ name: "a.png", size: 11 * 1024 * 1024 }) ?? "", /larger than 10MB/);
  assert.match(validateChatFile({ name: "v.mp4", size: 21 * 1024 * 1024 }) ?? "", /larger than 20MB/);
});

test("kind follows the extension", () => {
  assert.equal(chatFileKind("a.PNG"), "image");
  assert.equal(chatFileKind("a.mov"), "video");
  assert.equal(chatFileKind("a.mp3"), "audio");
  assert.equal(chatFileKind("a.docx"), "file");
});

test("sizes read naturally", () => {
  assert.equal(formatBytes(500), "500 B");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(formatBytes(3.5 * 1024 * 1024), "3.5 MB");
});

test("slash commands expand, other text is untouched", () => {
  assert.equal(applySlashCommand("/shrug"), "¯\\_(ツ)_/¯");
  assert.equal(applySlashCommand("no idea /shrug"), "no idea /shrug");
  assert.equal(applySlashCommand("/party"), "🎉🥳🎉");
  assert.equal(applySlashCommand("/shrug who knows"), "who knows ¯\\_(ツ)_/¯");
  assert.equal(applySlashCommand("/unknown thing"), "/unknown thing");
  assert.equal(applySlashCommand("hello"), "hello");
});
