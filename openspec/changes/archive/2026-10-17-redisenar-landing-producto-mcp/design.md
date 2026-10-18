# Design

## Context

See `proposal.md` for the motivation. The landing currently places a seven-tile hero, a ten-row interactive demo, a mosaic of UI fragments, a time-labeled setup bar, a tool list and a second decorative close together. Several fragments use a 40px root font while `[data-ui]` rules size their descendants in `em`; the code block rule also overrides its small Tailwind font utility. The shared header uses 32–36px actions.

## Goals / Non-Goals

**Goals:**

- Give the page one clear reading order from product promise to proof, MCP setup and next action.
- Reuse the existing local demo, copy action, tool descriptions, authentication CTA and route behavior.
- Keep proof content legible and keep the layout usable at the three widths in the spec.

**Non-Goals:**

- Change the product palette, account flows, routes, task behavior, MCP contract or persisted data.
- Add testimonials, analytics, new dependencies or server calls to the demo.

## Decisions

1. **Use a short, product-led section sequence.** Make the hero state that the web app and MCP agents share one task list. Follow it with a compact version of the local demo, a numbered three-step MCP setup with the copyable configuration beside the relevant step, a concise tools list, and one closing CTA. Remove the repeated mosaic and oversized decorative fragments; keep only proof that helps explain a capability. This gives the visitor a single path through the story while retaining the existing interactive and MCP evidence. An alternative was to keep the mosaic and tune each tile; that would preserve the current density and require many independent crops to remain readable.

2. **Keep demo behavior, reduce its visual footprint.** Retain add and complete/reopen actions, local-only state, and the no-JavaScript explanation. Use a small set of representative sample rows and make longer descriptions available through the existing row interaction. This keeps the demo a real proof without letting its initial list dominate the page. Do not add network requests or persistence.

3. **Size UI fragments from a normal text baseline.** Remove the 40px root scaling where it makes controls and code overflow. Use explicit sizes for configuration text and fragment labels, and keep `em` sizing only where it scales a complete illustrative control intentionally. Give the config block enough width or wrapping behavior for its endpoint and Bearer header at mobile width. Avoid a broad `[data-ui]` font rule that overrides component-specific sizes.

4. **Use numbered actions instead of time estimates.** Describe account creation, token creation, and client configuration as ordered actions. Keep all claims tied to behavior shown in the product. This supports scanning while avoiding a promise about how long setup takes.

5. **Keep the existing palette and calm its distribution.** Use the dark surfaces for page structure and reserve the mint accent for the primary action, important status, and selected proof. Avoid making multiple large panels compete for attention. Keep contrast and focus treatments from the existing design tokens.

6. **Increase shared header hit areas without changing navigation.** Make visible header buttons and links at least 44 × 44 CSS pixels, keeping the same labels, modal actions, session state, and destinations. At narrow widths, preserve the current visibility rules and ensure the visible controls remain reachable and do not collide with the brand.

## Risks / Trade-offs

- [Fewer examples may hide useful product detail] → Keep the five MCP tool descriptions available in a compact disclosure list and retain the complete interactive demo behavior.
- [Readable config can widen a mobile section] → Test the exact config at 390px and allow wrapping or internal code scrolling without causing page-level horizontal overflow.
- [Larger header actions use more horizontal space] → Check anonymous and authenticated header states at mobile and desktop widths; preserve existing nav collapse behavior.
- [A visual reduction could remove context needed without JavaScript] → Keep the main promise, capability descriptions, static demo rows and setup instructions in server-rendered HTML.

## Migration Plan

No data or route migration is required. Replace the landing composition and adjust shared presentation styles in one release. Rollback consists of reverting those presentation changes; authentication and MCP behavior remain compatible.
