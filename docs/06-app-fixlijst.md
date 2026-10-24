# App-fixlijst (Desktop\Vakman)

Uitgangspunt: **elke knop doet iets echts**, en elke aanvraag komt bij ons
binnen. Elk blok = één Claude-sessie, één branch, één PR (Auto-fix aan).
Volg `AGENTS.md`. Verificatie per blok: lint, tests, build + klikproef.

## A — Vóór de eerste outreach (P0)

**A1. Demo-nummers bellen echte mensen.** In `src/data/tradesData.ts` staan
demo-nummers als `06 12 34 56 78`, `06 45 67 89 01`. Op de demosites bellen en
appen knoppen (sticky bar, spoedknop, contact, storingsformulier) díe nummers,
en dat kunnen echte personen zijn. Oplossing: op `/voorbeeld/...` alle
tel/WhatsApp naar het Klusbaas-nummer (env `VITE_DEMO_PHONE`) of een melding
"Dit is een demo — zo komt de klant bij jou binnen", met een knop naar de wizard.

**A2. Persoonlijke demo-link.** `/voorbeeld/:vak/:stijl?naam=&plaats=&tel=`
vult bedrijfsnaam en plaats in (zelfde fallback als de wizard), met een knop
"Maak dit mijn website" naar `/start/gegevens` met de velden vooringevuld.
Router-tests uitbreiden; geen persoonsgegevens loggen in analytics.

## B — Mail via Resend (P1)

**Testen zonder domein (besluit 24-10-2026):** er is nog geen eigen domein.
Resend-account op `thomascliphero@gmail.com`, afzender
`Klusbaas <onboarding@resend.dev>`. In die testmodus levert Resend **alleen
af op het accountadres**: alle lead-meldingen komen dus binnen op die Gmail.
Bevestigingsmails naar klanten worden pas echt verstuurd na
domeinverificatie; tot dan logt de server ze en toont de app de bevestiging
op het scherm. Zonder `RESEND_API_KEY` draait alles in previewmodus.

**B1. Offerte-mail afmaken.** In de projectmap staat ongecommit werk
(`src/server/sendQuote.ts`, `netlify/functions/send-quote.mts`,
`src/utils/quote*.ts`, `QuoteSummary.tsx`, `data/addons.ts`, vite-dev-middleware).
Dat is gebaseerd op een oudere `main`. Op een branch zetten, op de nieuwe
`main` rebasen, conflicten in `App.tsx`/`router.ts` oplossen, tests groen.
Zonder `RESEND_API_KEY` draait het in previewmodus (mail naar serverlog).

**B2. Eén lead-endpoint.** `POST /api/lead` (Netlify Function) voor: wizard
afronden/pakket, afspraak, contactformulier, storingsformulier, m²-offerte.
Mail naar `QUOTE_NOTIFY_EMAIL` + bevestiging aan de aanvrager. Spamfilter
(honeypot + tijdscheck), rate limit, validatie in `utils/` met tests.
Formulieren tonen echte status: versturen…, gelukt, fout + WhatsApp-fallback.

**B4. Offertebouwer (P1).** Uit wizardkeuze (vak, stijl, pakket, add-ons uit
`data/addons.ts`, diensten) een offerte maken met nummer (`KB-2026-0001`),
regels, subtotaal, btw 21 % en totaal, geldig 30 dagen. Offerte **opslaan**
(Netlify Blobs, store `quotes`; lokaal een JSON-map in dev), als **PDF**
genereren (server-side, bijv. `pdf-lib`) en als bijlage meesturen met de
bevestigingsmail naar **beide kanten**: klant én Klusbaas. Offerte ook
terug te zien via `/offerte/:id?token=` (onraadbaar token). Prijzen alleen
uit `src/data/plans.ts`/`addons.ts` en berekening in `utils/quote.ts` met tests.

**B3. Kanaalkeuze koppelen.** Wizard "WhatsApp / E-mail / Allebei" bepaalt
echt hoe de offerte gaat (staat nu als "not wired" in `AGENTS.md`).

## C — Privacy en nieuwsbrief

**C1. Privacy + afmelden (P1).** `/privacy` en `/afmelden?token=` routes;
link in elke mail en in de footer. Prerender meenemen.

**C2. Nieuwsbrief (P2).** Aanmeldveld in footer + `/nieuwsbrief`:
`POST /api/newsletter` → Resend Contacts (status *unsubscribed* tot
bevestiging) → bevestigingsmail → bevestigen zet de contact op *subscribed*.
Versturen via Resend Broadcasts (afmeldlink automatisch).

**C3. Logo en huisstijl (P1).** Eigen Klusbaas-logo (SVG woordmerk + beeldmerk),
favicon, app-icons, `og-image.png`, e-mailheader voor Resend-mails en de
offerte-PDF. Vervangt de huidige "K"-tegel in `Header`/`WizardView`.

## D — Elke knop werkt

**D1. Klikproef (P1).** Playwright-suite die op 360px en 1440px elke route
afloopt en elke `a`/`button` klikt: geen 404, geen lege `href`, geen
`06 12 34…`-nummers op demosites, formulieren tonen een resultaat.
Draait in CI (zie roadmap 5.1).

**D2. Bekende losse eindjes (P2).** Stap 1 van de wizard: "Volgende" zonder
gekozen vak. Liggende iPhone: safe-area links/rechts. Google Agenda-koppeling
alleen tonen als Firebase geconfigureerd is. Datumkiezer (wizard + `BookingCalendar`)
biedt weekenddagen aan (bijv. "zondag 25 oktober"): weekenden overslaan.
Demosite-aanvragen komen nu bij Klusbaas binnen, niet bij de vakman: voor
live klant-sites moet `QUOTE_NOTIFY_EMAIL` per site instelbaar zijn.

## Wat jij moet doen (kan Claude niet voor je doen)

1. Resend-account aanmaken en inloggen (Claude kan in Chrome meekijken en de
   stappen aanwijzen, maar maakt geen accounts aan en typt geen wachtwoorden).
2. Domein toevoegen in Resend en de DNS-records bij je registrar zetten.
3. API-key aanmaken en zelf in Netlify zetten (Site settings → Environment
   variables). **Niet in de chat plakken.**
