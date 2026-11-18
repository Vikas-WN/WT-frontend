import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LEAVE_ATTACHMENT_COPY,
  LEAVE_ATTACHMENT_MAX_BYTES,
  leaveAttachmentFileProblem,
  leaveAttachmentRequired,
} from "../../src/utils/leaveAttachmentRules.ts";

const onsite = { onsite: true, required_for: ["LEAVE", "OPTIONAL"] };
const offshore = { onsite: false, required_for: [] };

test("on-site employees must attach the client's email to leave and optional leave", () => {
  assert.equal(leaveAttachmentRequired(onsite, "LEAVE"), true);
  assert.equal(leaveAttachmentRequired(onsite, "leave"), true);
  assert.equal(leaveAttachmentRequired(onsite, "OPTIONAL"), true);
});

test("never for WFH or comp-off, and never for employees who aren't on-site", () => {
  for (const type of ["WFH", "WFH_EXCEPTION", "COMP_OFF"]) assert.equal(leaveAttachmentRequired(onsite, type), false);
  assert.equal(leaveAttachmentRequired(offshore, "LEAVE"), false);
  assert.equal(leaveAttachmentRequired(undefined, "LEAVE"), false);
});

test("screenshots and PDFs up to 5MB are accepted", () => {
  for (const [name, type] of [["mail.png", "image/png"], ["mail.JPG", "image/jpeg"], ["mail.webp", "image/webp"], ["mail.pdf", "application/pdf"], ["mail.png", ""]]) {
    assert.equal(leaveAttachmentFileProblem({ name, type, size: 1000 }), null, name);
  }
});

test("other files and oversized ones are refused with a clear reason", () => {
  assert.equal(leaveAttachmentFileProblem({ name: "mail.docx", type: "application/vnd.openxmlformats", size: 10 }), LEAVE_ATTACHMENT_COPY.wrongType);
  assert.equal(leaveAttachmentFileProblem({ name: "page.html", type: "text/html", size: 10 }), LEAVE_ATTACHMENT_COPY.wrongType);
  assert.equal(leaveAttachmentFileProblem({ name: "mail.png", type: "image/png", size: LEAVE_ATTACHMENT_MAX_BYTES + 1 }), LEAVE_ATTACHMENT_COPY.tooBig);
});
