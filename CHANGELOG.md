# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **De tekst over het aantal vakken volgt de code.** De homepage, de footer
  en de sitemap noemden een vast aantal vakken en stijlen. Dat aantal komt
  nu uit de code, dus een nieuw vak staat er meteen in, met eigen tekst.
- **De documentatie vertelt de waarheid.** De README, de architectuur, de
  contactstrategie en de roadmap spraken nog over een product zonder
  backend, zonder accounts en zonder offertes. Ze beschrijven nu wat het
  product is: accounts, offertes, de opleverchecklist, de maandelijkse
  service en de routes die er zijn. De roadmap markeert de punten die klaar
  zijn en krijgt een fase 8 met wat er nog overblijft.

### Added

- **Een aanvraag blijft niet liggen.** Elke aanvraag heeft een status:
  nieuw, gebeld, offerte gestuurd, opdracht af of geen reactie. Klusbaas
  zet hem in `/klusbaas` en kan de lijst filteren op "nog open"; de vakman
  zet hem zelf voor de aanvragen op zijn eigen site.
- **De dakdekker is er, met een gratis dakcheck.** Het achtste vak: daken,
  goten en isolatie, met zijn eigen diensten, prijzen, foto's, reviews en
  offertegragen. Op zijn site staat een gratis dakcheck: de bezoeker geeft
  het type dak, de klacht en de urgentie door, en de check komt binnen als
  een aanvraag, net als de andere formulieren. Op een klantsite verdwijnen
  de beloften van de demosite ("gratis", "binnen één werkdag"), want daar
  schrijft de vakman zelf zijn tekst.
- **De stukadoor krijgt de oppervlaktecalculator.** Net als de schilder
  heeft hij nu een m²-calculator op zijn site: de bezoeker meet zijn muren,
  kiest een dienst met een prijs per m² en stuurt de schatting door. Het
  icoon en de naam van het werk volgen het vak.
- **De klant kan zijn eigen gegevens downloaden.** In `/mijn-account` staat
  een knop "Download je gegevens": één bestand met zijn account, zijn sites
  (met tekst, prijzen en foto's), zijn aanvragen, zijn offertes en zijn
  service. Onder de AVG (art. 15) mag hij daarom vragen; hij hoeft er
  geen mail meer voor te sturen. Zijn wachtwoord en de beheersleutel van
  een site staan er niet in: dat zijn sleutels, geen gegevens.
- **Klusbaas ziet of de site klaar is om te verkopen.** Het overzicht in
  `/klusbaas` controleert de vier dingen die bepalen of een bestelling
  zonder handwerk rondkomt: het IBAN in de offertes, de gegevens op de
  factuur, de mail die echt de deur uit gaat en het wachtwoord op het
  overzicht. Wat er nog mis is, staat bovenin, met de reden.
- **De prijzenpagina zegt wat een pakket is.** De klant vult zijn site
  zelf in, in zijn eigen editor; een pakket is de aflegging: Klusbaas
  nakijkt de teksten, foto's en kleuren, controleert de vindbaarheid,
  levert binnen twee weken op en registreert bij Pro en Premium het
  `.nl`-domein. De prijzen zelf veranderen niet. Zo staat op de
  prijzenpagina wat de klant koopt.
- **De vragen en antwoorden staan in de pagina.** De FAQ is een native
  accordeon (`<details>`) geworden: elk antwoord staat in de HTML die de
  build schrijft. Een bezoeker zonder JavaScript en een zoekmachine lezen
  daardoor hetzelfde als een bezoeker met scripts.
- **De klant ziet wat Klusbaas voor zijn site doet.** Elke offerte
  krijgt een checklist van het pakket: wat Klusbaas doet voor de site, in
  de volgorde waarin hij het doet. Klusbaas vinkt de stappen af in
  `/klusbaas`; de klant ziet dezelfde lijst in zijn account en op de
  offertepagina, met de datum waarop iets klaar is en het moment waarop
  de site live moet staan. Zo hoeft niemand meer te vragen wat de status
  is, en de belofte "binnen twee weken opgeleverd" is een lijst in plaats
  van een zin.
- **De maandelijkse service is een echte bestelling.** De klant zet hem
  zelf aan in zijn eigen account (`/mijn-account`, onder "Service &
  hosting"): hij ziet wat erin zit, wat het kost en dat hij hem elk moment
  kan stoppen. Klusbaas ziet de aanvraag in `/klusbaas`, zet de service aan
  (de maanden die bij het Pro-pakket horen zijn gratis) en stuurt elke
  maand de factuur met het bedrag, de IBAN en de omschrijving. De prijs
  staat in de catalogus (`data/plans.ts`), dus de prijzenpagina, het
  account, de mail en de factuur kunnen niet uit elkaar lopen. De klant
  stopt de service zelf; Klusbaas levert dan de site en de code terug.
- **Elke belofte op de marketingpagina's is waar.** De FAQ beloofde dat je
  site "direct bereikbaar" is met een eigen `.nl`-domein en dat je offertes
  "automatisch" in je Google Drive landen. Geen van beide gebeurt: een
  domein wordt per opdracht geregistreerd (de kosten van de registrar komen
  er los bij) en je offertes staan in je eigen account, met prijs, status en
  betaalwijze. Ook "hoe het werkt" en de homepage beloven geen foto's of
  prijzen van het voorbeeld meer: op een klantsite staan je eigen foto's en
  je eigen prijzen. De maandelijkse service bevat geen domein dat nooit is
  geregistreerd. Een test houdt de oude beloften buiten de pagina's.
- **De klant vraagt zelf een offerte aan.** In de site-editor staat een
  tab "Offerte". De klant kiest zijn pakket en de extra componenten die hij
  wil, ziet meteen wat het kost en drukt op "Vraag je offerte aan". Hij
  krijgt een echte offerte met nummer, PDF, prijs en betaalwijze in zijn
  eigen account (`/mijn-account`) en per mail. De aanvraag zelf wordt
  opgeslagen, zodat Klusbaas in `/klusbaas` ziet wat de klant wil en welke
  offerte er al bij hoort. De prijzen komen uit dezelfde catalogus als de
  prijzenpagina: er wordt niets verzonnen.
- **De klant kan zeggen dat hij betaald heeft.** Op de offertepagina en in
  zijn account staat de knop "Ja, ik heb het bedrag overgemaakt". Klusbaas
  krijgt daarvan een mail en in het overzicht staat "De klant meldt dat hij
  heeft betaald". De klant kan zijn eigen offerte niet als betaald
  markeren: dat doet Klusbaas, nadat hij zijn bankrekening heeft
  gecontroleerd.
- **Een akkoord zonder betaling blijft niet stil liggen.** In `/klusbaas`
  staat bij een geaccepteerde offerte hoeveel dagen het wacht op het geld,
  en Klusbaas kan de klant nog een keer het bedrag en de IBAN sturen. De
  offertepagina en het account laten de betaalgegevens na het accepteren
  ook zien: de klant moet het bedrag nog overmaken.
- **De klant houdt het bewijs van zijn eigen "ja".** Zodra hij de offerte
  accepteert, krijgt hij een mail met het offertenummer, het bedrag, de
  diensten en de IBAN. Voorheen was de groene banner in de browser het
  enige bewijs, en die verdwijnt zodra hij het venster sluit. De klant kan
  nu ook accepteren vanuit zijn eigen account in `/mijn-account`, en daar
  staat na het accepteren wanneer hij het deed.
- **Een aanvraag en de offerte daarvoor zijn nu één ding.** De offerte
  onthoudt de aanvraag (`L-XXXXXX`) waarvoor hij gemaakt is. In
  `/klusbaas` staat bij de aanvraag welke offerte er al is, en in het
  formulier "Offerte maken" staat "al een offerte" — zo schrijft Klusbaas
  niet twee keer hetzelfde werk voor.
- **Een verlopen offerte lijkt niet meer op een belofte.** Een offerte is
  dertig dagen geldig. Op de offertepagina staat nu dat de offerte
  verlopen is, de knop "Ja, ik ga akkoord" verdwijnt en de klant wordt
  uitgenodigd contact op te nemen voor een actuele offerte. In
  `/klusbaas` staat "Verlopen", met een knop om de offerte met dertig
  dagen te verlengen als de prijs nog klopt.
- **Klusbaas kan een openstaande offerte opvolgen.** Bij een open
  offerte staat in `/klusbaas` een knop "Stuur een herinnering". De klant
  krijgt een mail met de link naar de offerte, het bedrag en de IBAN weer
  bij, zodat hij niets hoeft op te zoeken.
- **Verlopen offertes zijn zichtbaar.** Een offerte is dertig dagen
  geldig. In het overzicht staat daarna "Verlopen", zodat Klusbaas weet
  dat hij een nieuwe offerte moet schrijven in plaats van de oude prijs
  te beloven.
- **De klant krijgt een factuur als hij betaalt.** Zodra Klusbaas een
  offerte als "betaald" markeert, krijgt de klant een factuur als PDF
  (`F-2026-0001`, volgend op het offertenummer) in zijn mailbox, met de
  klantgegevens, het bedrag, de btw en de betaaldatum. Hij kan de factuur
  ook opnieuw downloaden vanaf de offertepagina en uit zijn account. De
  gegevens van Klusbaas op de factuur komen uit de omgeving
  (`INVOICE_NAME`, `INVOICE_ADDRESS`, `INVOICE_KVK`, `INVOICE_VAT`,
  `INVOICE_EMAIL`): wat niet is ingevuld, wordt niet afgedrukt. Er wordt
  dus geen KvK-nummer verzonnen.
- **De klant kan de offerte zelf accepteren.** Op de offertepagina staat een
  knop "Ja, ik ga akkoord". De klant vult zijn naam in, de offerte krijgt de
  status "Geaccepteerd" en Klusbaas krijgt daar een mail van. Voorheen
  moest de klant zelf een mail of WhatsApp-bericht sturen om akkoord te
  geven, en dat is de plek waar een verkoop het vaakst stukgaat.
- **Een aanvraag kan een offerte worden.** Iemand die alleen een aanvraag
  stuurde en nooit een account maakte staat nu in de lijst van "Offerte
  maken" in `/klusbaas`. Klusbaas kiest hem, de offerte neemt zijn naam,
  zijn telefoonnummer, zijn e-mailadres en zijn vak uit de aanvraag, en de
  klant krijgt hem per mail. Een aanvraag op een klantsite hoort bij die
  vakman en staat er dus niet bij.
- **De klant kan de offerte meteen betalen.** De IBAN, de naam van de
  rekeninghouder en het bedrag staan nu in de offerte-PDF en op de
  offertepagina. Een klant zonder account kon de offerte wel openen, maar
  wist niet waar hij het bedrag naartoe moest overmaken; nu wel.
- **Klusbaas schrijft zelf een offerte voor een klant.** In `/klusbaas` staat
  een formulier "Offerte maken": kies de klant (zijn site vult de naam, de
  telefoon, de plaats en het vak in), kies het pakket en de extra
  componenten, en de offerte wordt gemaakt. Het is een echte offerte met een
  nummer, een PDF en een prijs, hij komt in het account van de klant te
  staan en de klant krijgt hem per mail met de PDF erbij. Zo heeft ook een
  klant die zelf een account maakte en zijn site publiceerde een offerte,
  en dus een order en een factuur.
- **De foto-upload is niet meer misbruikbaar.** `POST /api/media` heeft een
  grens van 30 foto's per uur per IP: een script kan de fotostore niet meer
  vol zetten.
- **De vakman vult zijn diensten en zijn prijzen zelf in.** In de editor
  staat nu een lijst met diensten: naam, korte omschrijving, de vanaf-prijs
  en eventueel de eenheid ("per m²", "per uur"). De voorbeelddiensten van het
  vak staan er klaar, maar zonder prijs: een prijs die de vakman niet
  typt, is niet van hem en komt niet op zijn site.
- **De prijscalculator werkt met de prijzen van de vakman.** Op de
  gepubliceerde site rekent de calculator met zijn eigen diensten en zijn
  eigen prijzen ("vanaf € 45 per uur"). Zonder eigen prijzen blijft de
  calculator van de site af, want hij zou de voorbeeldprijzen tonen. De
  aanvraag die uit de calculator komt gaat echt naar de vakman: naam,
  telefoonnummer, de gekozen dienst en de prijsindicatie, opgeslagen bij
  Klusbaas en gemaild naar de vakman.
- **De postcodecheck werkt met het werkgebied van de vakman.** De vakman
  typt de postcodes waar hij werkt; de check zegt daarna of die postcode
  erbij past. Zonder eigen werkgebied blijft de check van de site af, in
  plaats van te antwoorden met het gebied van het voorbeeld. De postcode
  komt mee met de aanvraag, zodat een bezoeker die "ja" hoort ook echt
  gebeld wordt. De beloftes van het voorbeeld ("25 km om de stad", "geen
  extra voorrijkosten") staan niet meer op een klantsite.

### Added

- **De vakman uploadt zijn eigen foto's.** In de editor staat een tabblad
  "Foto's": een foto bovenin de site en een lijst met zijn eigen projecten
  (titel, soort werk, jaar en een foto per project). De foto wordt in de
  browser kleiner gemaakt voordat hij naar de server gaat, daarna bewaard in
  de Blobs-store `media` en opgehaald via `/api/media`. De voorbeeldfoto's
  van het vak horen bij het voorbeeld, niet bij de klant: zonder eigen
  foto's blijft het transparante placeholder-beeld staan.

### Changed

- **De pakketten vertellen de waarheid.** De prijzenlijst beloofde dingen
  die Klusbaas niet bouwt: een koppeling met het Google Bedrijfsprofiel,
  een eigen .nl-domein "inbegrepen", een reviewsectie met Google-badge,
  meerdere pagina's en een opslag van offertes in Google Drive. Die
  beloftes zijn weg (of herschreven tot wat er echt is: een eigen
  .nl-domein op aanvraag, door Klusbaas geregistreerd; offertes in het
  account van de vakman; een uitgelichte klantreactie met eigen tekst;
  onbeperkt diensten op één snelle pagina). De klant krijgt nu wat er
  staat: de prijscalculator met zijn eigen prijzen, de postcodecheck met
  zijn eigen werkgebied, de klantsite met zijn eigen tekst.

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

- **Klusbaas heeft nu een eigen overzicht (`/klusbaas`).** Op één plek
  staan de aanvragen, de offertes met hun status en de gepubliceerde sites.
  Klusbaas markeert een offerte als betaald zodra het geld binnen is, en
  zet haar terug op openstaand als dat niet zo is. De beheerlink van elke
  site staat erbij, voor het geval een klant zijn account kwijt is.
  Het overzicht zit achter een wachtwoord uit de omgeving
  (`ADMIN_PASSWORD`); zonder dat wachtwoord is het overzicht gesloten en
  is er geen standaardwachtwoord.

- **Een vakman die zijn wachtwoord kwijt is kan zelf een nieuw wachtwoord
  zetten.** Vroeger moest hij dan naar Klusbaas mailen. Nu vult hij zijn
  e-mailadres in bij "Wachtwoord vergeten?", krijgt hij een link en kiest
  hij een nieuw wachtwoord. Het antwoord is altijd hetzelfde, ook als er
  geen account is met dat adres, zodat niemand kan uitzoeken wie er een
  account heeft. De link werkt een uur en is daarna waardeloos.
- **Elk account moet zijn e-mailadres bevestigen.** Bij het aanmaken van een
  account gaat er een mail met een bevestigingslink. Het adres is pas
  bevestigd als die link is geklikt; in je account staat het, met de knop om
  de mail nog eens te sturen. Komt de mail niet aan, dan bevestigt Klusbaas
  het adres zelf vanuit het overzicht. Publiceren kan ook zonder bevestiging:
  een klant die vastloopt op zijn mailbox verliest daardoor niet zijn site.

- **Na het publiceren krijgt de vakman een mail.** In de mail staat zijn
  adres, wat er nu gebeurt als iemand zijn contactformulier invult, en wat
  hij nog even moet nakijken (de punten van de checklijst). Zo weet hij
  zonder te bellen wat er met zijn site aan de hand is. De mail gaat naar
  het e-mailadres van het account, of naar het adres dat bij zijn
  bedrijfsgegevens staat. Publiceren kan ook zonder mail; de mail is een
  extra, geen voorwaarde.

- **Elke klantsite heeft zijn eigen privacyverklaring.** Onder het
  contactformulayer van een gepubliceerde site stond een link naar de
  privacyverklaring van Klusbaas. Maar op de site van een vakman is de
  vakman degene die verantwoordelijk is voor de gegevens die een bezoeker
  achterlaat. Elke klantsite heeft nu een eigen verklaring
  (`/site/<adres>/privacy`): wie verantwoordelijk is, welke gegevens worden
  verzameld, waar ze terecht komen, hoe lang ze worden bewaard en welke
  rechten de bezoeker heeft. De tekst is opgebouwd uit wat de vakman zelf
  heeft ingevuld; er staat geen verzonnen KvK-nummer of adres in.

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
