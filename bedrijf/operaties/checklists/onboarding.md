# Onboarding Checklist — Nieuwe Medewerker

**Versie**: 1.0
**Datum**: 2026
**Status**: Checklist — invullen per nieuwe medewerker

---

## Medewerkergegevens

| Veld | Waarde |
|------|--------|
| **Naam** | [Volledige naam] |
| **Functie** | [Functietitel] |
| **Afdeling** | [Tech / Sales / Marketing / Operations / Support] |
| **Type** | [Vast / ZZP / Freelance / Stage] |
| **Startdatum** | [Datum] |
| **Manager** | [Naam manager] |
| **Buddy** | [Naam buddy] |
| **Contracttype** | [Onbepaalde tijd / Bepaalde tijd / ZZP-modelovereenkomst] |

---

## Voorbereiding (Voordag / Dag -1)

### HR / Admin
- [ ] Contract getekend en gearchiveerd (Google Drive / Notion / Personeelsdossier)
- [ ] Persoonsgegevens in Moneybird/Exact verwerkt (loonheffing, pensioen)
- [ ] KVK-nummer, BTW-nummer, bankrekening (indien ZZP) verzameld
- [ ] NDA / Vertrouwelijkheidsverklaring getekend
- [ ] ARBO: RI&E thuiswerk besproken, PAGO ondertekend
- [ ] Whistleblower regeling bekendgemaakt

### IT / Toegang
- [ ] MacBook Pro besteld/opgehaald + monitor + toetsenbord + muis
- [ ] GitHub organisatie: uitnodiging verstuurd, Rolle toegewezen (Read/Write/Admin)
- [ ] Netlify team: uitnodiging verstuurd, Rolle toegewezen (Collaborator/Admin)
- [ ] Slack workspace: uitnodiging verstuurd, kanalen toegevoegd (#general, #dev, #deploy, #incidents, afdelingskanaal)
- [ ] Notion workspace: uitnodiging verstuurd, rechten gezet
- [ ] Linear: uitnodiging verstuurd, team toegewezen
- [ ] 1Password / Bitwarden: team vault toegang gegeven
- [ ] Resend: API key alleen voor developers (server-side)
- [ ] Firebase: project toegang (indien relevant voor rol)
- [ ] Moneybird/Exact: toegang boekhouder/CEO only

### Communicatie
- [ ] Welkomstmail verstuurd met: startdatum, tijd, locatie, agenda dag 1, buddy intro
- [ ] Team bekendgemaakt via Slack #general + All Hands agenda

---

## Dag 1: Kennismaking & Setup

### 09:00 - 10:00 | Ontvangst & Kennismaking
- [ ] Manager: Persoonlijke ontvangst, kantoor/remote setup
- [ ] Manager: Missie, visie, kernwaarden, cultuur (15 min)
- [ ] Manager: Organisatiestructuur, rol in team, rapportagelijnen (15 min)
- [ ] Buddy: Praktische rondleiding (kantoor) of remote tools tour (15 min)
- [ ] Buddy: Koffie/lunch afspraak maken

### 10:00 - 12:00 | Tooling & Accounts
- [ ] GitHub: SSH key setup, 2FA check, repo klonen (`Vakman`), `bun install` draaiend
- [ ] Netlify: `bun run dev` lokaal draaiend op `http://localhost:3000`
- [ ] Slack: Notificaties ingesteld, status profiel, kanalen gemute/joined
- [ ] Linear: Project boards begrepen, eerste ticket toegewezen
- [ ] Notion: Documentatiestructuur begrepen (bedrijf/, docs/, specs/)
- [ ] 1Password: Vaults geopend, SSH keys, API keys opgeslagen

### 12:00 - 13:00 | Lunch met Buddy
- [ ] Informele kennismaking, vragen beantwoorden

### 13:00 - 15:00 | Codebase & Architectuur
- [ ] Manager/Tech Lead: Architectuur walkthrough (30 min) — `docs/architecture.md`
- [ ] Tech Lead: Belangrijkste mappen: `src/components`, `src/utils`, `src/data`, `src/server`, `src/hooks`
- [ ] Tech Lead: Routing, lazy loading, prerendering, hydration uitleg
- [ ] Tech Lead: Data flow: lead → quote → PDF → e-mail/WhatsApp
- [ ] Tech Lead: Styling systeem: palette tokens, Tailwind v4, 5 stijlen × 6 sectoren

### 15:00 - 17:00 | Eerste Kennismakingstaken
- [ ] `bun run check` lokaal draaien (lint + test + build) — moet groen zijn
- [ ] Eenvoudige wijziging: README typo fix of comment toevoegen → PR openen
- [ ] PR review proces ervaren: CI checks, review, merge
- [ ] Deploy preview bekijken op Netlify

---

## Dag 2-3: Diepere Duik

### Dag 2: Domein & Data
- [ ] `src/data/tradesData.ts` — sectoren, stijlen, paletten, tools begrepen
- [ ] `src/data/plans.ts` + `addons.ts` — pakketten, prijzen, add-ons
- [ ] `src/utils/contact.ts` — WhatsApp/tel helpers, message builders
- [ ] `src/utils/pricing.ts` + `quote.ts` — berekeningen in centen, BTW
- [ ] `src/utils/router.ts` — routes, legacy redirects, RouteLink
- [ ] `docs/adding-a-sector.md` + `adding-a-trade-tool.md` — extensie handleidingen

### Dag 3: Serverless & Deployment
- [ ] `src/server/leadHandler.ts` — lead/quote flow, validatie, delivery
- [ ] `src/server/storage.ts` — Netlify Blobs vs file storage abstractie
- [ ] `src/server/quotePdf.ts` — PDF generatie met pdfkit
- [ ] `netlify/functions/lead.mts` — ESM function, environment variables
- [ ] `scripts/prerender.ts` — 39 routes, sitemap, robots, OG tags
- [ ] `public/_redirects` + `_headers` — SPA fallback, legacy, CSP

---

## Dag 4-5: Eerste Echte Ticket

### Good First Issue Criteria
- [ ] Kleine, afgebakende scope (1-2 dagen)
- [ ] Geen breaking changes
- [ ] Bestaat tests voor of tests makkelijk toe te voegen
- [ ] Duidelike acceptatiecriteria
- [ ] Voorbeelden: typo fix, klein UI tweak, test toevoegen, docs update

### PR Proces
- [ ] Branch: `arena/<korte-beschrijving>` (geen nieuwe branch aanmaken)
- [ ] Commits: Conventional Commits (`fix:`, `feat:`, `docs:`, `test:`, `refactor:`)
- [ ] `bun run check` lokaal groen voordat push
- [ ] PR openen tegen `main`, beschrijving: wat, waarom, hoe getest
- [ ] Reviewer(s) toewijzen, labels zetten
- [ ] CI checks wachten (lint, test, build, e2e optioneel)
- [ ] Feedback verwerken, force-push naar session branch
- [ ] Merge: `gh pr merge <nr> --merge` als laatste commando

---

## Week 2: Domein Specialisatie

### Alle Rollen
- [ ] `docs/contact-strategy.md` — WhatsApp-first, lead flows, kanaalkeuze
- [ ] `docs/pricing-and-positioning.md` — marktpositionering, prijzen
- [ ] `docs/known-limitations.md` — eerlijke gap inventarisatie
- [ ] `docs/ux-review.md` — UX fixes, mobile/iOS verbeteringen
- [ ] `ROADMAP.md` — fasering, prioriteiten, beslissingen log

### Tech Specifiek
- [ ] `src/components/SiteView.tsx` — demo site rendering, 5 hero layouts
- [ ] `src/components/WizardView.tsx` — 6-stap wizard, live preview
- [ ] `src/components/tools/` — EmergencyButton, FaultReportForm, SurfaceCalculator, ProjectTimeline
- [ ] `src/components/extras/` — 10 herbruikbare componenten (TrustBar, TestimonialCard, etc.)
- [ ] `src/video/` — Remotion specificatie, scenes, composition
- [ ] `e2e/` — Playwright tests: routes, wizard flows

### Sales/Marketing Specifiek
- [ ] `docs/klantwerving/` — leadlijst, website-analyse, kaart, roadmap
- [ ] `bedrijf/marketing/seo/strategie.md` — SEO, structured data, keywords
- [ ] `bedrijf/marketing/social/content-kalender.md` — templates, schema
- [ ] `bedrijf/marketing/email/templates.md` — transactionele + marketing mails
- [ ] `bedrijf/marketing/cases/cases.md` — case template, demo cases

---

## Week 3: Eigen Feature End-to-End

### Feature Cyclus
- [ ] Spec lezen (Linear ticket + gekoppelde docs)
- [ ] Technische ontwerpbeslissing noteren (kort, in PR of Notion)
- [ ] Implementatie: utils → tests → component → integratie
- [ ] `bun run check` groen
- [ ] Handmatig testen: dev server, mobile viewport, edge cases
- [ ] PR openen, review, merge, deploy preview checken
- [ ] Retrospectief: wat ging goed, wat verbeteren?

### Pairing & Knowledge Transfer
- [ ] Minimaal 2 pairing sessies met senior teamlid
- [ ] Code review gegeven aan een PR van collega
- [ ] Code review ontvangen op eigen PR
- [ ] Incident response geoefend (tabletop of echte SEV-3/4)

---

## Week 4: Evaluatie & Doelstellingen

### Formele Check-in (Dag 30)
- [ ] Manager: 30-min evaluatiegesprek
- [ ] Vragen: "Hoe voel je je?", "Wat was onverwacht?", "Wat heb je nodig?"
- [ ] Doelstellingen ZZP/Probeijd (indien van toepassing) afgetekend
- [ ] Persoonlijke doelen Q1/Q2 vastgelegd (OKR input)

### Buddy Check-in (Wekelijks, Dag 7, 14, 21, 28)
- [ ] 15 min: "Hoe is je energie 1-10?", "Blokkers?", "Vragen?"

---

## Dag 60 / 90: Performance & Groei

### Dag 60
- [ ] Performance check-in met manager (30 min)
- [ ] Feedback van teamgenoten (360° licht)
- [ ] Groeipad bespreken: specialiseren / breedere verantwoordelijkheid / lead

### Dag 90 (Einde Probeijd / ZZP-evaluatie)
- [ ] Formele evaluatie (60-90 min)
- [ ] Prestatie: sprint goals, code kwaliteit, team bijdrage
- [ ] Competentie matrix: waar sta je, waar wil je heen?
- [ ] Contract: vast / verlenging ZZP / eindigen
- [ ] Salarisherziening (indien van toepassing)
- [ ] Volgende 6 maanden doelen (OKRs)

---

## Specifiek Per Rol

### Developer
- [ ] `bun run check` 100% groen op eigen machine
- [ ] Minimaal 1 feature deployed naar productie
- [ ] Minimaal 1 bug fix (SEV-3/4) opgelost
- [ ] Minimaal 1 test toegevoegd (unit of e2e)
- [ ] Code review standaarden begrepen en toegepast

### Sales/SDR
- [ ] CRM (Notion/Linear) 100% up-to-date
- [ ] Minimaal 5 discovery calls gevoerd
- [ ] Minimaal 2 demo's gegeven (wizard walkthrough)
- [ ] Minimaal 1 offerte gegenereerd via wizard
- [ ] Objection handling geoefend (prijs, tijd, neef, Werkspot)

### Marketing
- [ ] Content kalender begrepen, 1 blog concept geschreven
- [ ] Social media templates gebruikt, 1 post gepubliceerd
- [ ] SEO strategie begrepen, 1 keyword research gedaan
- [ ] E-mail template getest (Resend preview mode)
- [ ] Case study template ingevuld voor demo case

### Operations/Support
- [ ] Support runbooks gelezen (bedrijf/operaties/runbooks/)
- [ ] Minimaal 3 support tickets opgelost (meekijken → zelf)
- [ ] QA checklist (bedrijf/operaties/operaties.md §1.3) 1x afgelopen
- [ ] Onboarding checklist klant 1x meegelopen
- [ ] Incident runbook (SEV-1/2) geoefend

---

## Onderdelen Die Je Moet Hebben Gezien/Gelezen

### Documenten (Must Read)
- [ ] `AGENTS.md` — werkregels, commands, conventions
- [ ] `README.md` — project overzicht, quick start
- [ ] `docs/architecture.md` — volledige architectuur
- [ ] `docs/contact-strategy.md` — lead/quote flows
- [ ] `docs/known-limitations.md` — gaps, technical debt
- [ ] `bedrijf/juridisch/privacyverklaring.md` — AVG compliance
- [ ] `bedrijf/juridisch/algemene-voorwaarden.md` — contractuele basis
- [ ] `bedrijf/hr/hr.md` — rollen, onboarding, cultuur, vergoeding

### Tools (Must Use)
- [ ] `bun run dev` — development server
- [ ] `bun run check` — lint + test + build (voor elke commit/PR)
- [ ] `bun run build` — productie build + prerender
- [ ] `bun run build:spa` — debug build zonder prerender
- [ ] GitHub PR flow + Netlify Deploy Preview
- [ ] Linear voor ticket tracking
- [ ] Slack voor communicatie (#incidents voor SEV-1/2)

---

## Ondertekening

**Medewerker**

__________________________
Naam: [Naam]
Datum: [Datum]
Handtekening: __________________________

**Manager**

__________________________
Naam: [Naam manager]
Datum: [Datum]
Handtekening: __________________________

**Buddy**

__________________________
Naam: [Naam buddy]
Datum: [Datum]
Handtekening: __________________________

---

*Onboarding Checklist beheerd in `bedrijf/operaties/checklists/onboarding.md` — invullen per nieuwe medewerker, archiveren in personeelsdossier.*