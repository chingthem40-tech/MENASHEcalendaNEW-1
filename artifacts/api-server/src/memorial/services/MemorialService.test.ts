import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isMemorialInteractionAllowed,
  isMemorialVisibilityAllowed,
} from "./MemorialService";

describe("memorial privacy authorization", () => {
  it("keeps private and family memorials hidden from non-family viewers", () => {
    for (const level of ["private", "family"] as const) {
      assert.equal(isMemorialVisibilityAllowed(level, false, false), false);
      assert.equal(isMemorialVisibilityAllowed(level, true, false), false);
      assert.equal(isMemorialVisibilityAllowed(level, true, true), true);
    }
  });

  it("requires authentication for community memorials and permits public memorials", () => {
    assert.equal(isMemorialVisibilityAllowed("community", false, false), false);
    assert.equal(isMemorialVisibilityAllowed("community", true, false), true);
    assert.equal(isMemorialVisibilityAllowed("public", false, false), true);
  });

  it("enforces family, community, public, and nobody child permissions", () => {
    assert.equal(isMemorialInteractionAllowed("family", true, false), false);
    assert.equal(isMemorialInteractionAllowed("family", true, true), true);
    assert.equal(isMemorialInteractionAllowed("community", false, false), false);
    assert.equal(isMemorialInteractionAllowed("community", true, false), true);
    assert.equal(
      isMemorialInteractionAllowed("community", false, false, true),
      true,
    );
    assert.equal(isMemorialInteractionAllowed("public", false, false), true);
    assert.equal(isMemorialInteractionAllowed("nobody", true, true), false);
  });
});