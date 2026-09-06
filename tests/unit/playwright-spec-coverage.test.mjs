import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const rootUrl = new URL("../../", import.meta.url);
const testsUrl = new URL("tests/", rootUrl);
const playwrightConfig = fs.readFileSync(new URL("playwright.config.mjs", rootUrl), "utf8");
const validationWorkflow = fs.readFileSync(new URL(".github/workflows/validate.yml", rootUrl), "utf8");

const specFiles = fs.readdirSync(testsUrl, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".spec.mjs"))
  .map(entry => entry.name)
  .sort();

test("every Playwright spec is assigned to at least one configured project", () => {
  const assignmentBlock = playwrightConfig.match(
    /const PLAYWRIGHT_SPEC_ASSIGNMENTS = Object\.freeze\(\{([\s\S]*?)\n\}\);/
  );
  assert.ok(assignmentBlock, "Playwright project assignments must remain explicit and inspectable");

  const assignedSpecs = [...assignmentBlock[1].matchAll(/["']([^"']+\.spec\.mjs)["']/g)]
    .map(match => match[1]);

  assert.deepEqual([...new Set(assignedSpecs)].sort(), specFiles);
});

test("CI syntax-checks the complete top-level Playwright spec set", () => {
  assert.match(
    validationWorkflow,
    /find tests -maxdepth 1 -type f -name '\*\.spec\.mjs' -print0 \| xargs -0 -n1 node --check/
  );
});
