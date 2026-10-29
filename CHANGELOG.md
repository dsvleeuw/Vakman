# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Een gepubliceerde klantsite toont alleen wat de vakman zelf heeft
  geschreven.** De pagina werd getekend uit de voorbeeldtekst van het vak:
  de drie voorbeeldreviews met een verzonnen cijfer ("4,9 uit 5, 128
  beoordelingen"), het Google-logo met die cijfers, de foto's van andermans
  werk, de voorbeeldprijzen en de keurmerken uit het voorbeeld. Op de site
  van de klant stonden dus dingen die niet van hem waren. Nu blijft daar
  alleen over wat hij zelf schreef of bevestigde:
  - tekst die nog op de voorbeeldtekst staat, wordt vervangen door een
    feitelijke regel uit zijn eigen gegevens ("Jansen Schilderwerken",
    "Schilder in Haarlem");
  - voorbeeldprijzen worden "Prijs op aanvraag";
  - reviews, de Google-badge, het "vakman sinds"-jaar, de keurmerken, de
    voorbeeld-faq en de voorbeeldfoto's verdwijnen;
  - een blok dat hij aanzet komt pas op de site als hij het bevestigt of
    verandert ("Dit is mijn eigen tekst"); de cijfers uit het voorbeeld
    gaan altijd mee;
  - de prijscalculator en de m²-calculator blijven weg zolang ze met
    voorbeeldprijzen werken;
  - knoppen en menu's wijzen niet langer naar onderdelen die er niet zijn.
  In de editor staat een checklijst van wat er nog ingevuld moet worden, en
  de preview laat zien wat een bezoeker straks ziet (met een knop om het
  volledige voorbeeld te bekijken).

### Added

- **De vakman ziet zijn aanvragen in `/mijn-account`.** Elke aanvraag via
  een contact-, afspraak-, storings- of offerteformulier op zijn eigen
  site staat nu in zijn account: naam, telefoonnummer, e-mailadres, zijn
  bericht, de datum en de referentie. De aanvraag komt daarnaast per mail
  binnen, maar de mail is niet meer de enige plek waar hij hem kan
  terugvinden. Klusbaas bewaart de aanvraag in naam van de vakman, zodat
  er niets verloren gaat als de mail niet aankomt; de privacyverklaring
  zegt dat precies.

- **De klant ziet zijn offerte in `/mijn-account`.** Een offerte die de klant
  aanvraagt (in de wizard of in de editor) hoort bij hem: in zijn account
  staat wat hij kost, wat de status is (openstaand, betaald of geannuleerd)
  en hoe hij betaalt. Is de klant aangelogd als hij de offerte aanvraagt,
  dan belandt hij automatisch in zijn account; anders kan hij de offertelink
  uit zijn mail in zijn account plakken. Er zit geen betaaldienst tussen de
  klant en zijn geld: hij maakt het bedrag over naar het IBAN van Klusbaas
  (`PAYMENT_IBAN`) met het offertenummer als omschrijving, en Klusbaas
  markeert de offerte als betaald.

### Changed

- **Een aanvraag op een klantsite gaat naar de vakman.** De contact-, afspraak-
  en storingsformulieren van een gepubliceerde site (`/site/<slug>`) sturen de
  aanvraag naar het e-mailadres dat de vakman zelf heeft ingevuld, in plaats
  van naar Klusbaas. De pagina zegt nu precies dat wat er gebeurt: op een
  klantsite "Je bericht gaat direct naar {naam}", op een demosite "Dit is een
  demosite: je bericht komt bij Klusbaas binnen". Het adres van de vakman
  komt uit de opgeslagen site, nooit uit het verzoek, en de bezoeker ziet het
  nooit. Lukt de mail naar de vakman niet, dan mailt het team hem en blijft
  de aanvraag bewaard: een aanvraag mag nooit stilletjes verdwijnen. De
  privacyverklaring is hierop aangepast.
- **Klantenaccount (`/mijn-account`)**: de klant beheert zijn site via een
  login in plaats van alleen via een beheerlink met token. Een account
  bestaat uit een e-mailadres en een wachtwoord; het wachtwoord wordt
  alleen als scrypt-hash met zout bewaard (`node:crypto`, dus zonder extra
  dependency) en de sessie zit in een `HttpOnly`-cookie (`SameSite=Lax`,
  30 dagen). De pagina toont "mijn sites": elke site met een link naar de
  editor en naar de publieke site, plus de mogelijkheid om een bestaande
  site (gepubliceerd met een beheerlink) aan het account te koppelen door
  die link te plakken. Een site die ingelogd gepubliceerd wordt, krijgt een
  eigenaar en is daarna zonder token te wijzigen. De beheerlink blijft
  werken: een link die werkt blijft werken.
- **Beoordeling van de zes Kun-tools** (`docs/kun-tools-review.md`): wat
  `no-mistakes`, `gh-axi`, `backpass`, `lavish-axi`, `vision` en `treehouse`
  doen, hoe ze in deze repo zouden passen en of ze de maatstaf "past in een
  repo zonder runtime-dependencies" halen. `gh-axi`, `lavish-axi` en
  `vision` zijn bruikbaar, `no-mistakes` niet (CI dekt lint, tests en build
  al), `backpass` en `treehouse` vooral voor de eigenaar.
- **`VISION.md`**: het accept-beleid van Klusbaas in tien principes, elk met
  bewijs uit de eigen PR-historie, plus acht stress-test-hypotheses met
  een verdict. Het bestand is de maatstaf voor wat wel en niet de moedere
  op.
- **Publiceren van een klantsite (`/site/<slug>`)**: een klant kan zijn site
  publiek zetten. De site krijgt een eigen adres (`/site/jansen-schilderwerken`)
  en een privé beheerlink (`/mijn-site/<slug>?token=…`) waarmee hij hem later
  kan bijwerken. De pagina wordt op de server gerenderd, zodat zoekmachines en
  een linkpreview in WhatsApp de site zien in plaats van een lege pagina.
  De site krijgt zijn eigen titel, beschrijving, canonieke link en
  `LocalBusiness`-structured data, en komt in de sitemap
  (`/sitemap-sites.xml`). Zonder telefoonnummer, bedrijfsnaam of plaats mag
  een site niet publiek: een openbare pagina mag geen nummer tonen dat niet
  van de klant is.
- **Eigen site-editor (`/mijn-site`)**: de klant vult zijn site zelf in.
  De editor toont de live site links en het invulpanel rechts: zijn gegevens,
  de tekst van de pagina en de blokken die hij op de site wil hebben. Per
  blok staan de teksten die hij kan herschrijven (vertrouwensbalk,
  garantielijst, review, vakman-kaart, projectcijfers, openingstijden,
  beschikbaarheid, actiebanner, werkgebied en contactbanner). Blokken gaan aan
  en uit en zijn te herordenen (slepen of met de pijltjes). Alles wordt
  direct opgeslagen in de browser van de klant; er is geen AI en geen
  modelkosten: de klant schrijft zijn eigen tekst.

- **Repo-studie met de ogen van Kun Chen** (`docs/kun-repo-study.md`): een
  onafhankelijke blik op Klusbaas via de `/kun`-skill, met gemeten cijfers
  (134 tests groen, 28 PR's, 18.366 regels applicatiecode). Benadrukt dat de
  gegenereerde site het commodity-deel is en de leadlijst + de persoonlijke
  demo-link de echte waarde; documenteert acht documentatie-claims die nu
  liegen, het openstaande `test.fixme` op de voorbeeldtelefoonnummers, het
  hardcoded KvK-nummer, de ontbrekende tests op de lead-/offerte-/PDF-pad en
  de twee componenten van 1.300+ regels, en de
  `commit-msg`-hook die agents als co-auteur opschrijft. Eindigt met tien geprioriteerde
  acties (S/M/L), een lijst van expliciete niet-doen, en zes open beslissingen
  voor de eigenaar. Alleen documentatie; geen applicatiecode gewijzigd.
- **Glassmorphism design system voor de GitHub-visualizer**
  (`github-visualizer/style.css`): alle vormgeving als CSS custom properties
  met licht en donker thema — glass-tokens (`--glass-bg`, `--glass-border`,
  `--glass-shadow`, `--glass-backdrop`), semantische surfaces (`--surface-1`
  tot `--surface-4`), fluid typografie (`--text-xs` tot `--text-4xl` via
  `clamp()`), motion-tokens, een z-index-schaal en focus-ringen via
  `--focus-ring`. `prefers-reduced-motion`, `prefers-reduced-transparency` en
  `forced-colors` vallen terug op veilige waarden; zonder
  `backdrop-filter`-ondersteuning worden de oppervlakken dicht. De
  heatmap-tooltip staat nu direct onder `<body>`, want `backdrop-filter` maakt
  een card tot containing block voor `position: fixed`.
- **Automatische bestandsgeschiedenis** (`docs/bestandenoverzicht.csv`): één
  regel per bestandswijziging met actuele vlag, branches, Git-commitbericht,
  auteur, datums, object-ID's, grootte en links. Historische regels blijven
  behouden; GitHub Actions vult nieuwe wijzigingen aan. Genegeerde bestanden
  blijven buiten beeld. Zie `docs/bestandenoverzicht.md` voor de details.
- **Code-gedreven src-audit** (`docs/arena_agent_src/`): acht onderzoeken
  (app/router/SEO, server/API, data/pricing, wizard/demosite, tools/extras,
  a11y, tests/tooling, docs-drift), een synthese met 58 punten en top 20, en
  vijf klaargezette bouwprompts. Elke bevinding met `pad:regel`; 34 doc-claims
  getoetst. Read-only: er is geen applicatiecode gewijzigd.
- **`bun run check`** draait lint, tests en build tegelijk
  (`scripts/check.mjs`, ~20 s in plaats van ~70 s na elkaar).
- **Agents mogen zelf mergen** zodra `bun run check` groen is en de PR
  schoon tegen `main` staat; gestapelde PR's eerst rebasen (`AGENTS.md`).
- **Arena-auditplan** (`docs/07-arena-audit-plan.md`) en de app-fixlijst
  (`docs/06-app-fixlijst.md`).
- **`MAIL_TEST_RECIPIENT`** stuurt klantbevestigingen tijdelijk naar één
  testinbox, met `[TEST → echt adres]` in het onderwerp en een gele balk in de
  mail, zolang Resend zonder geverifieerd domein alleen aan het accountadres
  levert. Leeg laten in productie. De offerte-PDF gaat nu mee als
  `application/pdf`.
- **Klusbaas-logo en huisstijl (C3).** Eigen beeldmerk: een K uit een steel
  en een winkelhaak met maatstreepjes, plus het woordmerk in Archivo 900 als
  outlines. `public/brand/` (logo, licht logo, beeldmerk, e-mail-PNG), nieuwe
  `favicon.svg`, `icon-192/512.png`, `apple-touch-icon.png`,
  `site.webmanifest` en `og-image.png` ("Jouw vak. Jouw website."). Het
  `Logo`-component vervangt de K-tegels in header, wizard, 404 en
  offertepagina; de offerte-PDF tekent het logo als vectorpaden en elke mail
  heeft een logo-header. Alles komt uit `scripts/generate-brand.mjs`.
- **Privacyverklaring `/privacy` (C1).** Per formulier: gegevens, doel,
  grondslag en bewaartermijn, plus verwerkers en rechten. Link in de footer,
  onder elk formulier, in elke mail (footer) en in de offerte-PDF.
- **Nieuwsbrief met dubbele opt-in (C2).** Aanmeldveld in de nieuwe footer
  en op `/nieuwsbrief`. `POST /api/newsletter` (honeypot, rate limit) slaat
  het adres op als `pending` met een onraadbaar token en mailt een
  bevestigingslink; `GET /api/newsletter/confirm` zet het op `subscribed`
  (en in de Resend Audience als `RESEND_AUDIENCE_ID` gezet is);
  `/afmelden?token=` zet het op `unsubscribed`. Pagina's tonen de status.

- **Eén lead-endpoint `POST /api/lead`.** Wizard-offerte, afspraak
  (`BookingCalendar`), contactformulier, storingsmelding en m²-offerte posten
  naar dezelfde Netlify Function (en in `vite dev` naar dezelfde handler via
  middleware). Validatie per formulier in `utils/lead.ts`, honeypot +
  tijdscheck, eenvoudige rate limit. Aanvragen worden opgeslagen (Netlify
  Blobs, lokaal `.data/`) en via Resend gemaild naar `QUOTE_NOTIFY_EMAIL`.
  Formulieren tonen echte status: versturen…, gelukt (met referentie) of een
  fout met WhatsApp-terugval.
- **Offertebouwer.** Stap 5 van de wizard kiest pakket en extra componenten
  (`data/addons.ts`) met live totaal. Bij versturen ontstaat offerte
  `KB-2026-0001` (oplopend) met regels, subtotaal, 21 % btw, totaal en 30 dagen
  geldigheid (`utils/quote.ts`, in centen), opgeslagen met een PDF (`pdf-lib`)
  die als bijlage naar Klusbaas en de klant gaat. Terug te zien via
  `/offerte/:id?token=…` en `GET /api/quote` (fout token → 403).
- **Kanaalkeuze werkt.** WhatsApp / E-mail / Allebei bepaalt nu hoe de offerte
  gaat: e-mail stuurt de PDF naar de klant, WhatsApp zet een kant-en-klare
  wa.me-link in de mail aan Klusbaas. Een geweigerde klantmail (Resend-
  testmodus) laat de aanvraag niet mislukken; de API meldt per ontvanger het
  resultaat.

- **Persoonlijke demo-link.** `/voorbeeld/:vak/:stijl?naam=&plaats=&tel=`
  vult bedrijfsnaam, plaats en (geldig) telefoonnummer in, met dezelfde
  terugval op sectordefaults als de wizard. De knop "Maak dit mijn website"
  opent `/start/gegevens` met die velden vooringevuld. De gegevens worden pas
  na hydration toegepast, zodat de geprerenderde HTML blijft kloppen, en gaan
  niet mee in `track()` (alleen het pad wordt gelogd).


- **Prerendering van alle indexeerbare routes.** `npm run build` rendert nu na
  `vite build` de homepage en alle 35 vakmanssites naar echte HTML
  (`dist/**/index.html`) met per route `<title>`, meta description, canonical
  en Open Graph/Twitter-tags. De client hydrateert die HTML in plaats van
  opnieuw te renderen (`src/entry-server.tsx`, `scripts/prerender.ts`,
  `src/main.tsx`). Daarbij horen `sitemap.xml`, `robots.txt` (met
  `Disallow: /start/`) en een 1200×630 `og-image.png`.
- **Funnelanalytics zonder vendor.** `utils/analytics.ts` stuurt
  `page_view`, `wizard_step_view`, `wizard_step_complete`,
  `wizard_validation_error`, `preset_open`, `plan_select`, `whatsapp_click`,
  `phone_click`, `appointment_requested` en `component_view` naar
  `window.dataLayer`/`window.gtag` zodra er een tag manager staat; zonder
  tag manager gebeurt er niets.
- **Toegankelijkheidscontract voor alle 35 paletten.** `utils/color.ts` rekent
  OKLCH→sRGB en WCAG-contrast; `withAccessibleContrast()` in `tradesData.ts`
  zorgt dat tekst op bg/card, accenttekst, inverted tekst en tekst op
  accent/highlight minimaal AA (4,5:1) halen. `paletteContrast.test.ts`
  controleert alle 7 vakken × 5 stijlen.
- **Scrollpositie per pagina.** Bij terug/vooruit herstelt de router de
  scroll-offset van dat history-item; nieuwe navigatie start bovenaan.
- **Mobiele previewbalk op de voorbeeldpagina** klapt in tot één regel met een
  "Aanpassen"-knop (vak-, stijlkeuze en CTA verschijnen pas op verzoek).
- **Kanaalkeuze werkt nu echt.** Na het aanvragen van een afspraak biedt het
  bevestigingsscherm een kant-en-klaar WhatsApp- of `mailto:`-bericht aan dat
  past bij het gekozen kanaal (WhatsApp / E-mail / Allebei).
- **Google Agenda is opt-in.** Inloggen gebeurt alleen als de bezoeker "zet de
  afspraak in mijn agenda" aanvinkt; de afspraak wordt anders lokaal genoteerd
  zonder popup.
- **Laadfeedback voor afbeeldingen:** placeholders pulseren tot de foto
  geladen is, zodat grids niet verspringen.

### Changed

- **Stap 5 draait om de oplevering, niet om het inplannen.** De primaire actie
  is nu "Bekijk je website" (ook in de actiebalk); de afspraak is een
  duidelijk gemarkeerd optioneel blok eronder.
- **Formulierranden** gebruiken `border-stone-500` in plaats van
  `border-stone-200`, zodat invoervelden 3:1 halen (WCAG 1.4.11).
- **Decoratieve sfeerfoto's** op de gegenereerde sites zijn `alt=""` +
  `aria-hidden` in plaats van een herhaling van de kop.
- **Interne navigatie zijn echte links.** Header, presets, de previewbalk van
  de gegenereerde site en de componentenbibliotheek gebruiken `RouteLink`
  (`<a href>`), zodat middenklik, "openen in nieuw tabblad" en crawlers werken.
- **Hoofd-CTA heet "Start je website"** en opent wizardstap 1, gelijk aan de
  hero. De eerdere "Plan een afspraak"-knop in de header suggereerde een
  andere actie dan hij deed; plannen gebeurt nu aan het einde van de flow.
- **Presetkaarten:** "Bekijk demo" / "Kies deze stijl" met duidelijke
  `aria-label`s in plaats van "Bekijk site" / "Kies deze".
- **Mobiel menu** sluit bij een klik buiten het menu en blokkeert
  achtergrondscrolling.
- **Componentenbibliotheek** heeft een URL per component
  (`/componenten/trust-bar`).
- **Wizard-stap 5 is een afspraak inplannen.** De laatste stap publiceert
  niet langer "direct", maar laat de gebruiker een datum + dagdeel kiezen,
  het gewenste kanaal (WhatsApp / E-mail / Allebei) bevestigen en de
  afspraak aanvragen. Bij inloggen met Google wordt de afspraak in de
  Google Agenda van de gebruiker gezet (optioneel, met lokale fallback).
- **Volledige live render in de wizard.** De rechterkolom toont de *hele*
  gegenereerde website live (ingebedde `SiteView`) in een scrollbaar kader,
  in plaats van de mini-mockup. `SiteView` kreeg een `embedded`-modus
  (geen preview-besturing, zwevende knoppen of mobiele balk).

### Fixed

- **Het beheertoken van een gepubliceerde site verandert nooit meer.** Een
  token dat meegestuurd wordt bij het bijwerken van een site is alleen een
  sleutel op de deur: het opgeslagen token blijft hetzelfde. Voorheen kon
  een verkeerd token het token van de site overschrijven, waardoor een
  werkende beheerlink kapotging.

- **Geen verzonnen KvK-nummer of voorbeeldnummer op een klantsite.** De
  footer noemde `KvK 12345678` en de vakken bevatten een made-up
  telefoonnummer. Een KvK-nummer is een openbare claim over een echt
  bedrijf en een telefoonnummer kan van iemand anders zijn: de footer
  toont nu alleen een KvK-nummer dat de klant zelf heeft ingevuld, en op
  een klantsite zonder eigen nummer verdwijnen de bel- en WhatsApp-knoppen
  in plaats van een nummer te tonen dat niet van de klant is. De
  demomelding ("dit is een demosite") blijft op de demosites van Klusbaas en
  komt niet op de site van een klant.
- **Klusbaas-homepage hersteld.** De zelfstandige GitHub-geschiedenispagina
  staat nu apart op `/github-history/index.html`, zonder link op de homepage.
  De prerender-build geeft een fout als het React-root-element ontbreekt.

- **Meta en routering.** Geprerenderde pagina's hebben nog maar één `og:image`
  en `twitter:image`; `robots.txt` sluit `/kaart` uit; bij client-navigatie
  worden canonical en `robots` (noindex op `/start/*`, `/offerte/*`, `/kaart`,
  `/afmelden` en 404) bijgewerkt; scrollherstel wacht tot de lazy view geladen
  is en een aliasrewrite wist de scrollpositie niet meer; aantallen vakken,
  stijlen en presets komen uit de data (7 × 5 = 35) in plaats van hardcoded;
  gecachete afbeeldingen verliezen hun placeholder direct na hydratie.
- **Toegankelijke formulieren en demo-dialoog.** Storingsformulier en
  m²-calculator: elk veld een gekoppeld label, foutmeldingen via
  `aria-describedby`/`aria-invalid`, randen 3:1 en leesbare WhatsApp-knoppen.
  De demo-contactdialoog houdt de focus vast, sluit met Escape en geeft de focus
  terug aan de knop die hem opende. De kaarten in de beeldstrip op de homepage
  zijn echte links naar `/voorbeeld/:vak/:stijl`.
- **Wizard-eindjes (D2).** `/start/vak` gaat niet verder zonder gekozen vak en
  toont een hint; afspraakdatums slaan zaterdag en zondag over (lokale datum, niet
  UTC); de pakketregel en -chip tonen ook het standaardpakket; 'Offerte
  aanvragen' met lege gegevens stuurt terug naar `/start/gegevens` met focus op
  het eerste lege veld; de Google Agenda-optie verschijnt alleen als Google echt
  geconfigureerd is (`isGoogleConfigured()`); 'Opnieuw proberen' werkt ook in
  `BookingCalendar` en de wizard; invoerranden halen 3:1.
- **WCAG AA-contrast in alle vijf stijlen.** WhatsApp-knoppen hebben donkere tekst
  op `#25D366` (was wit, 1,98:1); contact-, FAQ- en werkgebiedsecties lezen hun
  tekstkleur uit de paletttokens zodat de donker-presets leesbaar zijn; de
  focusring staat buiten `:where()`/`@layer` en verliest niet meer van
  `focus:outline-none`. Het mobiele menu van een voorbeeldsite sluit bij een
  tik erbuiten en vergrendelt het scrollen.
- **Geen stil verlies van leads meer.** Een tweede aanvraag na `reset()` werd als
  spam gezien en kreeg een nep-succes zonder opslag; `startedAt` blijft nu staan
  en `MIN_FILL_MS` is 800 ms. `submitLead` breekt na 12 s af met een Nederlandse
  fout, `LeadErrorNotice` biedt 'Opnieuw proberen' en een mailto-fallback, en
  previewlogs bevatten geen mailtekst of volledige e-mailadressen meer.
- **Demosites bellen of appen geen echte vreemden meer.** Tel- en
  WhatsApp-knoppen (sticky bar, header, footer, contact, spoedknop,
  storingsformulier, openingstijden, CTA-banner, m²-calculator) gebruiken
  `site.contactPhone`: het eigen nummer van de klant, anders het
  Klusbaas-nummer uit `VITE_DEMO_PHONE`. Zonder dat nummer toont de knop
  "Dit is een demo — zo komen klanten bij jou binnen" met een knop naar de
  wizard. De verzonnen voorbeeldnummers uit `tradesData.ts` staan nergens
  meer in een link.
- **Ook de wizard stuurt offertes niet meer naar een verzonnen nummer.**
  `PLATFORM_CONTACT.whatsapp` (`+31 6 12345678`) is vervangen door
  `getPlatformWhatsApp()`, dat hetzelfde `VITE_DEMO_PHONE` gebruikt. Zonder
  dat nummer toont het bevestigingsscherm alleen de e-mailknop.
- **Stijlfonts op de homepage terug.** Sinds `index.html` alleen Archivo en
  JetBrains Mono laadt, vielen de stijlkaarten in `PresetsSection` terug op
  Georgia/systeemfonts. De sectie laadt de stijlfonts nu via een
  `IntersectionObserver` kort voordat ze in beeld komt, zodat de eerste paint
  licht blijft.
- **Formuliervelden op mobiel minimaal 16px (`text-base`)** in `ContactSection`,
  `FaultReportForm`, `BookingCalendar`, `SurfaceCalculator`, de Google
  Agenda-checkbox in `WizardView` en de zoekinput in `ComponentGallery`, zodat
  iOS Safari niet automatisch inzoomt bij focus.
- **iOS safe-area-insets en `viewport-fit=cover`:** toegevoegd aan `index.html`,
  de vaste/sticky mobiele onderbalken (inclusief onderpadding van de pagina) en
  de sticky bovenbalken in `Header`, `SiteView` en `WizardView`.
- **Wizard vult stap 3 (`/start/gegevens`) niet langer vooraf met nepgegevens:**
  velden starten leeg (placeholders blijven zichtbaar), het live voorbeeld valt
  terug op sectordefaults, lege invoer wordt afgekeurd en getypte gegevens
  blijven behouden bij wisselen van vakgebied.
- **Wizard op mobiel/tablet:** richtingneutrale copy (geen verwijzing meer naar
  "rechts"), stapnaam direct in de kicker (`STAP 3 VAN 5 · GEGEVENS`), geen
  voorgeselecteerd vak op een verse `/start/vak` en alle interactieve knoppen/
  stappills op minimaal 40×40–44×44 px.
- **Tikvlakken in `SiteView` en `Header`:** `"← Alle presets"`, `"Aanpassen"`,
  navigatielinks en het telefoonnummer in de storingsmelder verhoogd naar
  minimaal 44 px hoogte.
- **Mobiele paginalengte gehalveerd (`< 8.000 px` op 360 px) met behoud van SSR-HTML:**
  lange lijsten en formulieren op de homepage en demosites (`#diensten`, `#werk`,
  beoordelingen, FAQ, afsprakenkalender, contactformulier, presets, pakketten en
  vaktools) klappen op `< sm` in achter `"Toon meer"`/`"Bekijk alle"`-knoppen.
- **Meeschuivende previewbalk en compactere mobiele hero's:** de previewbalk in
  `SiteView` schuift op mobiel weg bij omlaag scrollen en keert terug bij omhoog
  scrollen; dubbele mobiele bel-CTA's zijn verwijderd en alle vijf hero-stijlen
  tonen hun CTA's boven de vouw op 360×780.
- **Tablet-layout, leesbare kleine tekst en slimmer fontladen:** het
  wizard-formulier is gecentreerd op tablet (`768–1023 px`), alle tekst onder
  `12px` is verhoogd naar minimaal `text-xs`, en `index.html` laadt alleen
  `Archivo` + `JetBrains Mono` terwijl stijl-specifieke displayfonts pas op
  aanvraag (en per prerenderde demosite) worden geladen (`src/utils/fonts.ts`).
- `html lang` stond op `en` terwijl alle copy Nederlands is.
- FAQ-kicker "FAQ & HEBDEN" → "Goed om te weten".
- Contactformulierlabels waren niet gekoppeld aan hun inputs; nu wel, met
  foutmeldingen die door schermlezers worden aangekondigd.
- De dubbele marquee-slides werden twee keer voorgelezen; de kopie is nu
  `aria-hidden` en niet tabbaar.
- Ankerlinks op de gegenereerde site (`#prijs`, `#gebied`, `#contact`) werden
  bij terug/vooruit naar boven gereset; scroll-reset gebeurt nu alleen bij een
  echte paginawissel.

## [0.1.0] - 2026-10-24

First tracked release. This entry documents the complete product surface at
the time of release; items marked *(pre-existing)* were already in the
codebase before the 0.1.0 documentation effort.

### Added

#### Contact strategy (WhatsApp-first, option D from the market research)

- `ContactSection` on every demo site: a WhatsApp card as the primary,
  low-threshold channel plus a short contact form as fallback. Both compose
  a prefilled `wa.me` message, so no backend is required and every lead
  lands in one WhatsApp inbox.
- Sticky mobile bottom bar with **Bellen** and **WhatsApp** actions that
  stay on screen while scrolling (the mobile call button is a baseline
  expectation of competitors).
- Desktop floating action stack: WhatsApp button next to the existing
  "offerte in 1 minuut" quote CTA.
- Shared, unit-tested contact utilities in `src/utils/contact.ts`:
  `phoneToWaDigits`, `buildWhatsAppUrl`, `buildTelUrl`,
  `buildContactMessage`, `buildEmergencyMessage`, `buildFaultReportMessage`
  and `buildSurfaceQuoteMessage`.
- Google Bedrijfsprofiel review badge in the reviews section, linking to a
  Google Maps search for the business.

#### Smart, trade-specific conversion tools

- `EmergencyButton` (loodgieter): 24/7 spoedknop with problem chips that
  prefill an emergency WhatsApp message, plus a one-tap call action.
- `FaultReportForm` (elektricien): structured storingsmelding (fault type,
  timing, urgency, address, optional details) with validation and a
  composed WhatsApp notification.
- `SurfaceCalculator` (schilder): interactive m² calculator with per-m²
  service prices, dynamic wall rows and door/window deductions, backed by
  the pure helpers in `src/utils/surface.ts`.
- `ProjectTimeline` (timmerman): four-step timeline making the two-week
  delivery promise concrete.
- `TradeTool` switch component and the `TradeToolId` union / `tool` field
  on `SectorData`, so adding a tool is a data change plus one component.

#### Content

- Before/after project galleries for **all six sectors** (previously only
  the timmerman had one).
- Tool assignments: `timeline` (timmerman), `m2-calculator` (schilder),
  `emergency` (loodgieter), `fault-report` (elektricien).

#### Platform pricing and positioning

- `PricingSection` on the home page with three one-off packages —
  € 595 / € 995 / € 1.795, all explicitly **exclusief btw** — and the
  optional € 25/month service strip (monthly cancellable).
- Ownership banner: the craftsman keeps the website, code, domain and
  photos; no vendor lock-in.
- "Prijzen" navigation link in the home header.
- Expanded platform FAQ with pricing, ownership, two-week delivery and
  cancellation answers.

#### Engineering and documentation

- `test` npm script (`bun test src`) and ten new unit tests covering the
  contact and surface utilities; the suite now contains 17 tests.
- `README.md` with setup, architecture summary and extension instructions.
- `docs/` guides (architecture, adding a sector, adding a trade tool,
  contact strategy, pricing rationale, known limitations), `ROADMAP.md`
  and `AGENTS.md` for the next agent.
- `animate-fade-in` CSS utility used by confirmation states.

### Changed

- Demo-site footer reordered to WhatsApp-first and rebuilt on the shared
  `buildWhatsAppUrl` / `buildTelUrl` helpers instead of inline string
  concatenation.
- The single floating "offerte" badge was replaced by the desktop action
  stack and the mobile sticky contact bar; page root now reserves bottom
  padding on mobile so content is never hidden behind the bar.
- Platform FAQ answer on delivery time now distinguishes the 15-minute
  concept site from the two-week complete delivery.

### Initial platform baseline (pre-existing at first release)

- Six trades × five design styles = 30 presets with per-style OKLCH
  palettes, typography, layouts and Unsplash photo sets.
- Five-step onboarding wizard (`WizardView`) with a live browser mockup,
  service toggling and localStorage persistence of custom business data.
- Interactive per-trade price calculator with animated price tween.
- Postcode service-area checker, appointment booking calendar with
  optional Google Calendar/Google Drive sync (Firebase Auth),
  before/after image slider, reviews and per-sector FAQ accordion.
- Home page with header, hero, marquee strip, preset gallery and
  "how it works" section.

[0.1.0]: https://github.com/dsvleeuw/Vakman/releases
[Unreleased]: https://github.com/dsvleeuw/Vakman/pulls
