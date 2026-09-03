# ProjectSignal agent instructions

Before changing UI/UX, read `docs/DESIGN_SYSTEM.md` and `docs/UI_REFERENCE_NOTES.md`.

## Product intent
The primary user is a specification/project-sales professional at a building-product manufacturer or distributor. They open ProjectSignal to decide **which projects deserve sales attention, what they can sell, who to influence, and when**.

The interface should feel like a calm, credible technical-sales instrument: dense enough for professional work, not decorative, not a generic AI dashboard.

## Required local skills
Use these project skills for every UI change:
- `.agents/skills/projectsignal-ui/SKILL.md`
- `.agents/skills/projectsignal-ux-review/SKILL.md`

## External skill recommendations
If the development agent supports Skills CLI, install/use these when available:
```bash
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/jakubkrehel/skills --skill better-ui
npx skills add https://github.com/Dammyjay93/interface-design --skill interface-design
npx skills add https://github.com/antfu/skills --skill web-design-guidelines
```

## Non-negotiables
- No purple/indigo AI-gradient language.
- Do not default to Inter.
- Avoid rounded-card soup; use lines, groups, alignment and whitespace to encode structure.
- Data must tell a commercial story, not merely occupy dashboard widgets.
- No decorative animation that slows frequent work; repeated interactions should be instant or <=150ms where motion is useful.
- Respect `prefers-reduced-motion`; motion is never the only feedback channel.
- Touch targets >=44px where practical; keyboard focus must be visible.
- Use tabular numerals for financial/data tables.
- Keep opportunity estimates explicitly marked as model-derived unless backed by a published source.
