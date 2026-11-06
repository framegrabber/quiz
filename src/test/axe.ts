import axe from "axe-core";
import { expect } from "vitest";

// happy-dom has no layout, so color-contrast cannot be computed; contrast is checked manually (docs/design.md).
const options: axe.RunOptions = {
  rules: { "color-contrast": { enabled: false } },
};

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, options);
  const summary = violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.length}×)`,
  );
  expect(summary).toEqual([]);
}
