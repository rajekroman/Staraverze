import test from "node:test";
import assert from "node:assert/strict";
import { ScreenController } from "../../src/ui/ScreenController.js";

test("ScreenController.play releases focus owned by a closing screen", () => {
  let blurred = 0;
  const focusedButton = {
    closest(selector) {
      return selector === ".screen" ? { id: "digScreen" } : null;
    },
    blur() {
      blurred += 1;
    }
  };
  const controller = Object.create(ScreenController.prototype);
  controller.document = { activeElement: focusedButton };
  controller.show = (id, options) => ({ id, options });

  assert.deepEqual(controller.play(), { id: null, options: { playing: true } });
  assert.equal(blurred, 1);
});

test("ScreenController.play preserves focus outside modal screens", () => {
  let blurred = 0;
  const canvas = {
    closest() {
      return null;
    },
    blur() {
      blurred += 1;
    }
  };
  const controller = Object.create(ScreenController.prototype);
  controller.document = { activeElement: canvas };
  controller.show = () => null;

  controller.play();
  assert.equal(blurred, 0);
});
