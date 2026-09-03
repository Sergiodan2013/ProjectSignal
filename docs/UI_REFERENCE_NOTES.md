# UI reference notes

ProjectSignal-specific takeaways from the UI resources reviewed during the redesign. These are summarized principles, not copied library content.

## UI Skills — ui-skills.com
Use specialist skills instead of one generic “make it pretty” prompt. Relevant disciplines: frontend design, interface design, UI polish, accessibility and web-interface review. Apply accessible touch targets, balanced headings, tabular numerals, consistent nested radii and explicit focus/motion review.

## shadcn/ui — ui.shadcn.com
Adopt accessible, composable, source-owned primitives with thoughtful defaults. Components should be easy for agents to edit locally rather than hidden behind an opaque theme package. Introduce shadcn primitives as the interactive surface grows.

## coss ui — coss.com/ui
Reference for modern Base UI-style primitives such as command/search, combobox, field/form, dialog, drawer, meter and data-oriented controls. Useful when richer filtering and command-palette workflows are added.

## Design System Checklist — designsystemchecklist.com
Treat foundations as system-level decisions: color, typography and tokens propagate to every component. Maintain semantic colors, accessible pairings, documented usage rules and states rather than ad-hoc values.

## Beautiful UI — beautifului.dev
Useful patterns for AI-native surfaces: task rows, recommendation cards, context/source cards, records tables, filter tables, prompt bars and human approval. For ProjectSignal, prefer explicit AI states over placing a generic chatbot everywhere.

## beUI — beui.dev
Motion can improve polish, but selectively. Borrow compact state transitions, drawer/modal mechanics and data-table craft; avoid ornamental effects that compete with the sales task.

## Rare UI — rareui.com
Single-file animated components can provide a memorable marketing moment. Keep them out of high-frequency product workflows unless they communicate something functional.

## Transitions.dev — transitions.dev
Use motion as communication. Prefer compositor-friendly transform/opacity/filter, preserve keyboard/focus semantics, never depend on motion alone, and collapse motion under `prefers-reduced-motion`.

## Emil Kowalski — “You Don't Need Animations”
Frequency matters. Repeated work actions should generally not animate; keyboard-driven actions should feel immediate. When motion has a purpose, keep product UI transitions fast and generally below 300ms.

## ProjectSignal synthesis
Use **one expressive signature + disciplined product surfaces**. The signature is Signal Rail. Everything else should optimize scan speed, confidence, commercial context and next action.
