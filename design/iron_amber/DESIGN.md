```markdown
# Design System Specification: The Precision Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Financial Architect"**
This design system moves away from generic "SaaS-blue" dashboards and into the realm of high-end, editorial precision. It is designed to feel like a bespoke financial instrument—authoritative, clean, and meticulously organized. We break the "template" look by utilizing intentional asymmetry, expansive negative space, and a rejection of traditional containment lines in favor of tonal depth.

The aesthetic combines the weight of **Manrope** headlines with the crystalline clarity of **Inter**, creating an environment where data isn't just displayed; it is curated.

---

## 2. Brand Identity: Cadence Trades
The logo is a typographic mark designed to convey rhythm and stability.

*   **Typeface:** Manrope (Extra Bold / 800)
*   **Styling:** 
    *   **Letter Spacing:** -0.04em (Tightening the kerning for a "block" feel).
    *   **The Geometric Accent:** A custom 2px horizontal bar (using the `primary` #F59E0B token) sits precisely beneath the "E" in Cadence and the "A" in Trades, representing a floor or support level in trading.
    *   **Case:** Sentence case for "Cadence" to provide height; Uppercase for "TRADES" to provide a solid base.

---

## 3. Colors & Tonal Surface Theory
We rely on solid, high-quality backgrounds to provide a sense of permanence.

### The Palette
*   **Action/Accent:** Amber (`#F59E0B`) | Token: `primary_container`
*   **Dark Mode Base:** Deep Navy/Slate (`#0B1326`) | Token: `surface`
*   **Light Mode Base:** Crisp White/Gray (`#F8FAFC`) | Token: `inverse_surface`

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are prohibited for sectioning. Structural boundaries must be defined solely through background color shifts or spacing.
*   *Example:* To separate a sidebar, use `surface_container_low` against a `surface` main area. The contrast is the container.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to create "nested" depth:
1.  **Lowest:** `surface_container_lowest` (#060E20) - Used for background "voids" or deep backgrounds.
2.  **Base:** `surface` (#0B1326) - The standard page background.
3.  **Raised:** `surface_container` (#171F33) - Primary content cards.
4.  **Highest:** `surface_container_highest` (#2D3449) - Modals or floating tooltips.

---

## 4. Typography
The hierarchy is designed to feel like a premium financial broadsheet.

*   **Display & Headlines (Manrope):** High-contrast and authoritative. Headlines should utilize a slightly tighter letter-spacing (-0.02em) to feel "custom-set."
*   **Body & Labels (Inter):** Maximum legibility. Body text uses a standard `1rem` base with generous line-height (1.6) to ensure the interface feels "airy" despite the dense data.

| Level | Token | Font | Size | Weight |
| :--- | :--- | :--- | :--- | :--- |
| Display | `display-lg` | Manrope | 3.5rem | 800 |
| Headline | `headline-md` | Manrope | 1.75rem | 700 |
| Title | `title-lg` | Inter | 1.375rem | 600 |
| Body | `body-md` | Inter | 0.875rem | 400 |
| Label | `label-md` | Inter | 0.75rem | 500 |

---

## 5. Elevation & Depth: The Layering Principle
We move beyond shadows to **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface_container_high` card on a `surface` background for a subtle, professional lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a dropdown), use a "tinted shadow." Use a large blur (24px-32px) with 6% opacity, using the `on_surface` color as the shadow base rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** For top navigation bars, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows content to bleed through softly, preventing the UI from feeling "boxed in."

---

## 6. Components

### Buttons
*   **Primary:** Solid `primary_container` (#F59E0B) with `on_primary_container` (#613B00) text. **Radius:** `0.5rem` (lg).
*   **Secondary:** Ghost style. No background. `outline` (#A08E7A) ghost border (20% opacity).
*   **Interaction:** On hover, primary buttons should shift 1 tonal step lighter; never use "glow" effects.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Separation:** Use a vertical space of `spacing-8` (2rem) or a subtle background shift to `surface_container_low`.
*   **Roundness:** Apply `ROUND_FOUR` (`0.5rem` / `lg`) to all cards to maintain a tool-like, professional feel.

### Input Fields
*   **Style:** Minimalist. Use a solid background of `surface_container_highest`. 
*   **Focus State:** A 2px bottom-border only of `primary` (#F59E0B). This mimics a "ledger" feel.

---

## 7. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wide left column for data and a narrow right column for actions).
*   **Do** leverage the `Amber` accent sparingly. It should be a "signal" color for money-moving actions.
*   **Do** use `body-sm` for legal or secondary metadata to maintain a clean visual hierarchy.

### Don't
*   **Don't** use 1px solid borders to wrap every card; let the background color do the work.
*   **Don't** use "odd" or vibrant gradients. If a gradient is used, it must be a subtle transition from `primary` to `primary_fixed_dim`.
*   **Don't** use pure black (#000000). Always use the Slate-based `surface` tokens for dark mode depth.
*   **Don't** crowd the interface. If in doubt, add more `spacing-12` (3rem).