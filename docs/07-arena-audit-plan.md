# Arena-auditplan: is alles geïmplementeerd, wat kan beter?

Opgesteld 24-10-2026 door de tech lead. Doel: voor elk document in `docs/`
vaststellen **wat gebouwd is, wat ontbreekt en waar de docs zelf
achterlopen**, plus concrete verbeteringen. Alle taken zijn **read-only
onderzoek** (`research`-modus, automatische feitencontrole); er wordt geen
code gewijzigd. Het resultaat is een prioriteitenlijst waar daarna
bouwtaken uit komen.

## Uitgangssituatie (door de tech lead geverifieerd)

| Onderdeel | Stand op `main` |
|---|---|
| PR #1–#8 | WhatsApp-first, tools, router, prerender, mobiele UX, fonts, demo-nummers + persoonlijke demo-link (A1, A2) |
| PR #10 (gemerged) | B1–B4: `POST /api/lead`, offertebouwer + PDF, opslag in Netlify Blobs, kanaalkeuze, `MAIL_TEST_RECIPIENT` |
| PR #12 (gemerged, gerebased) | C1–C3: logo/huisstijl, `/privacy`, `/afmelden`, nieuwsbrief met dubbele opt-in |
| PR #13 (gemerged) | mobiele agent-brief als referentie |
| Nog niet gebouwd | D1 (Playwright-klikproef in CI), D2 (losse eindjes), `.github/` CI |
| Open | PR #9: leadlijst Noord-Holland (229 bedrijven). Besluit nodig: hoort die lijst in de repo? |

Verificatie na de merges: `bun run check` groen (125 tests, 39 routes
geprerenderd).

## Taken (4 parallelle, onafhankelijke onderzoeken)

1. **audit-fixlijst**: `docs/06-app-fixlijst.md` item voor item (A1–D2):
   gebouwd / deels / ontbreekt, bewijs (bestand:regel), risico's. Met
   extra aandacht voor de nieuwe server-code (`src/server/`,
   `netlify/functions/`): validatie, spamfilter, rate limit (in-memory per
   functie-instantie), tokens, HTML-escaping, privacy van leadgegevens.
2. **audit-roadmap**: `ROADMAP.md`, `docs/known-limitations.md` en de
   gotchas in `AGENTS.md`: per fase-item gedaan/deels/open, en welke claims
   verouderd zijn (bv. "geen backend", "kanaalkeuze not wired"), met
   concrete tekstvoorstellen.
3. **audit-ux**: `docs/ux-review.md`, `docs/mobile-ux-plan.md` en
   `docs/contact-strategy.md`: elke ✅ en elk "klaar als"-criterium nalopen
   in de code, en nieuwe formulierstatussen (`LeadStatus`, `useLeadForm`)
   beoordelen op UX en toegankelijkheid.
4. **audit-product**: `docs/architecture.md`, `component-library.md`,
   `adding-a-sector.md`, `adding-a-trade-tool.md` en
   `pricing-and-positioning.md`: kloppen paden, stappen en prijzen met de
   code (`plans.ts`, `addons.ts`, `utils/quote.ts`)? Plus verbeterkansen in
   conversie, SEO en testdekking.

De scopes zijn disjunct, dus `parallel.conflicts` is leeg. Er zijn geen
`depends_on`.

## Definition of done

Elke taak levert: een tabel (item · status · bewijs · actie), een top-5
verbeteringen met geschatte omvang (S/M/L) en een lijst verouderde
docs-passages. De tech lead voegt die samen tot één prioriteitenlijst en
stelt bouwtaken voor (waarschijnlijk: D1 Playwright + CI, docs bijwerken,
D2 losse eindjes).
