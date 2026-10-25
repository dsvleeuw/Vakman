# docs — Project Documentatie

Algemene documentatie over de Klusbaas applicatie: architectuur, workflows, pricing, bekende beperkingen, en roadmap.

## Documenten

| Bestand | Onderwerp |
|---------|-----------|
| `architecture.md` | **Volledige architectuur** — stack, data flow, routing, deployment, security |
| `adding-a-sector.md` | Handleiding: nieuwe vak toevoegen (data, palette, tools, tests) |
| `adding-a-trade-tool.md` | Handleiding: nieuwe smart tool per vak maken |
| `contact-strategy.md` | Contact flows: WhatsApp, tel, email, quote delivery kanalen |
| `pricing-and-positioning.md` | Prijzen, abonnementen, positioning, `plans.ts` structuur |
| `known-limitations.md` | Huidige gaps, technische schulden, open issues |
| `ux-review.md` | UX/navigatie review + open aanbevelingen |
| `mobile-ux-plan.md` | Mobile/iOS werkplan (voorbeeld agent brief, shipped in PR #6) |
| `component-library.md` | Component catalogus documentatie & gebruik |
| `ROADMAP.md` | Langere termijn prioriteiten & visie |

## Submappen

- `klantwerving/` — Klantwerving specifieke docs (roadmap, kaart, website analyse)

## Leesvolgorde voor nieuwe teamleden

1. `architecture.md` — Begrip van het geheel
2. `AGENTS.md` (project root) — Werkwijze, regels, commands
3. `contact-strategy.md` — Hoe leads/quotes werken
4. `pricing-and-positioning.md` — Commerciele logica
5. `known-limitations.md` — Waar let je op
6. `ROADMAP.md` — Waarheen we gaan

## Conventies

- **Nederlands** voor alle documentatie
- Markdown met frontmatter waar relevant
- Diagrammen als Mermaid code blocks
- Code voorbeelden in TypeScript/React
- Links relatief (`./adding-a-sector.md`)