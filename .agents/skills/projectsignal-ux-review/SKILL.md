---
name: projectsignal-ux-review
description: Audit ProjectSignal screens for commercial clarity, accessibility, motion restraint and anti-slop UI quality.
---

# ProjectSignal UX review skill

## Commercial clarity
- Can a sales user identify the top opportunity in <5 seconds?
- Is the recommended action visible without opening multiple panels?
- Are modelled values clearly distinguished from published/verified data?
- Does every score explain why it matters?

## Information architecture
- Does navigation reflect real work (opportunities, profile, market, ROI) rather than generic dashboard taxonomy?
- Are groups separated by hierarchy/alignment before adding containers?
- Are tables the default for comparable records instead of card grids?

## Visual system
- No purple/indigo AI gradient.
- No unexplained new token values.
- Radius nesting is optically/concentrically consistent.
- Icons come from one icon family and match adjacent text weight.
- Numbers align with tabular numerals.

## Interaction
- Focus states visible.
- 44px touch targets where practical.
- No `transition: all`.
- High-frequency actions <=150ms or instant.
- Reduced motion respected.
- Motion is never the only state signal.

## Copy
- Prefer concrete action language to hype.
- Avoid “unlock”, “revolutionize”, “AI-powered insights” unless technically necessary.
- Label uncertainty and model-derived estimates explicitly.
