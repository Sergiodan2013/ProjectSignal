# ProjectSignal design system

## Design thesis
ProjectSignal is a **technical sales instrument**, not a marketing toy. Its visual world comes from project drawings, specification sheets, bid desks, construction-stage gates and signal prioritisation.

### Signature
**Signal Rail** — a vertical representation of project stage, current influence window and next commercial action. This is the one memorable interaction/visual motif; everything else stays restrained.

## Tokens
- Paper: `#F4F5F1`
- Paper 2: `#ECEEE9`
- Ink: `#171C20`
- Steel: `#687278`
- Signal orange: `#D7562D` — action / urgency / specification window
- Field green: `#187158` — strong/verified/positive signal
- Blueprint: `#315D7A` — analytical/market context only
- Sidebar: `#182025`

Color is semantic. Do not introduce extra accent colors without a defined meaning.

## Typography
- Primary: IBM Plex Sans
- Data / micro labels / figures: IBM Plex Mono
- Headlines use tight tracking and moderate weight, not oversized bold SaaS typography.
- Financial and score values use tabular numerals.

## Surfaces
- Default radius: 7px, often 3–5px for controls/tags.
- Prefer borders/dividers for structure and modest shadows only where actual elevation is needed.
- Avoid nesting many floating rounded cards.

## Density
This is a professional B2B application. Tables and project intelligence may be information-dense, but hierarchy must remain obvious.

## Motion
- Frequent work interactions: instant or <=150ms.
- General UI transitions: ideally 120–180ms and under 300ms.
- Animate only transform/opacity/filter where useful.
- No keyboard navigation animation.
- No decorative looping motion in the core app.
- Respect reduced-motion preferences.

## Accessibility
- Visible keyboard focus.
- Native semantic controls where possible.
- State is never expressed by animation alone.
- Primary text/background combinations should meet WCAG AA contrast.
- Touch targets ~44px minimum.

## Copy
Use concrete commercial language: `Engage now`, `Influence window open`, `Modelled opportunity`, `Target integrator`, `Not in CRM`.
Avoid vague AI copy such as `unlock insights`, `supercharge growth`, or `revolutionary intelligence`.
