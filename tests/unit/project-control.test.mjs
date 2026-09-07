import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const projectControl = fs.readFileSync(
  new URL("../../docs/PROJECT_CONTROL.md", import.meta.url),
  "utf8"
);

test("project control identifies the live Staraverze repository before imported history", () => {
  const liveHeader = projectControl.slice(0, projectControl.indexOf("## Importovaný historický registr"));

  assert.match(liveHeader, /Aktuální repozitář: \*\*`rajekroman\/Staraverze`\*\*/);
  assert.match(liveHeader, /Aktuální zdrojová verze: \*\*6\.2\.0\*\*/);
  assert.match(liveHeader, /https:\/\/rajekroman\.github\.io\/Staraverze\//);
  assert.match(liveHeader, /3e7eb4aa439de95cc7ef82a93c8e97141d1b0855/);
  assert.doesNotMatch(liveHeader, /Aktuální repozitář:.*rajekroman\/lovec-vltavinu/);
});

test("imported release history cannot be mistaken for the live Staraverze backlog", () => {
  assert.match(projectControl, /Importovaný historický registr původního repozitáře/);
  assert.match(projectControl, /Historický stav původního repozitáře při exportu: \*\*ACTIVE\*\*/);
  assert.match(projectControl, /nejde o otevřený issue #182 tohoto repozitáře/);
});
