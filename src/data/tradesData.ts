import type {
  SectorId,
  StyleId,
  StyleDef,
  SectorData,
  Palette,
  ActiveSiteData,
  WizardFormData,
} from '../types';
import { getOklchColor, generateDomainSlug, formatPhoneNumber } from '../utils/pricing';

export const ORDER: SectorId[] = [
  'timmerman',
  'hovenier',
  'schilder',
  'loodgieter',
  'elektricien',
  'stukadoor',
];

export const STYLES: StyleDef[] = [
  {
    id: 'klassiek',
    name: 'Vakwerk',
    layout: 'split',
    desc: 'Klassieke serif en warme tinten, met de foto naast de tekst. Rustig, ambachtelijk en betrouwbaar.',
    display: "'DM Serif Display', Georgia, serif",
    dw: 400,
    ls: 'normal',
  },
  {
    id: 'modern',
    name: 'Helder',
    layout: 'bleed',
    desc: 'Een grote foto over de hele breedte en royale ronde knoppen. Fris, open en modern.',
    display: "'Space Grotesk', system-ui, sans-serif",
    dw: 700,
    ls: '-0.015em',
  },
  {
    id: 'krachtig',
    name: 'Signaal',
    layout: 'bold',
    desc: 'Felle signaalkleur, zware vette letters en een bewegende kwaliteitsband. Valt direct op.',
    display: "'Archivo', system-ui, sans-serif",
    dw: 900,
    ls: '-0.015em',
  },
  {
    id: 'donker',
    name: 'Avond',
    layout: 'editorial',
    desc: 'Een donker thema met grote, elegante koppen en panoramaformaat. Voor high-end projecten.',
    display: "'Instrument Serif', Georgia, serif",
    dw: 400,
    ls: 'normal',
  },
  {
    id: 'minimaal',
    name: 'Puur',
    layout: 'mosaic',
    desc: 'Veel rustgevend wit en een rijk mozaïek van werkfoto’s. Je vakwerk spreekt voor zich.',
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    dw: 600,
    ls: '-0.01em',
  },
];

export const SECTORS: Record<SectorId, SectorData> = {
  timmerman: {
    id: 'timmerman',
    name: 'Timmerman',
    biz: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    city: 'Utrecht',
    phone: '06 12 34 56 78',
    near: ['34', '35', '37', '39'],
    pcExample: '3511 AB',
    hD: 50,
    hB: 62,
    cf: 1,
    since: '2009',
    rating: '4,9',
    reviewCount: 128,
    pool: [
      '1779031242515-205111711b23',
      '1769353086138-19ee65291a04',
      '1595844730298-b960ff98fee0',
      '1561297331-a9c00b9c2c44',
      '1497219055242-93359eeed651',
      '1788296817269-8df0458ab799',
      '1626081063434-79a2169791b1',
      '1773430272653-375174373c4f',
      '1544164560-adac3045edb2',
      '1759523121247-76be6b3490b2',
      '1499744349893-0c6de53516e6',
      '1626081062126-d3b192c1fcb0',
    ],
    kicker: 'TIMMERWERK OP MAAT',
    headline: 'Kozijnen, trappen en kasten op maat.',
    intro:
      'Vakwerk in hout, tot op de millimeter strak afgewerkt. Ik kom eerst kosteloos langs om in te meten en daarna krijg je een heldere, vaste prijs.',
    cta1: 'Bereken je prijs',
    cta2: 'Bekijk mijn werk',
    about:
      'Al 15 jaar werk ik dagelijks met hout, eerst als meubelmaker en sinds 2009 in mijn eigen werkplaats. Elke klus doe ik zelf: van het inmeten tot het laatste likje olie.',
    servicesTitle: 'Wat ik voor je maak',
    services: [
      {
        n: 'Kozijnen',
        d: 'Hardhouten of meranti kozijnen, inclusief HR++ glas, tochtwering en grondverf.',
        p: 'v.a. € 650 per stuk',
      },
      {
        n: 'Trappen',
        d: 'Open of dichte trappen en traprenovaties met eiken overzettreden.',
        p: 'v.a. € 2.400',
      },
      {
        n: 'Inbouwkasten',
        d: 'Kasten onder de trap, schuifdeurkasten en strakke nis-kasten met zachte sluiting.',
        p: 'v.a. € 900',
      },
      {
        n: 'Houten vloeren',
        d: 'Massief hout, visgraat PVC of kwaliteitslaminaat, strak gelegd inclusief hoge plinten.',
        p: '€ 28 per m²',
      },
    ],
    marks: ['SKH-gecertificeerd', 'KVT-kwaliteit', 'VCA Vol', 'Erkend leerbedrijf'],
    workNote: 'Gemaakt in eigen werkplaats in de regio Utrecht',
    work: [
      { t: 'Massief eiken eettafel', c: 'Zeist', y: '2026' },
      { t: 'Open trap met eiken treden', c: 'Utrecht-Oost', y: '2025' },
      { t: 'Hardhouten vlonder aan het water', c: 'Bunnik', y: '2025' },
    ],
    beforeAfter: [
      {
        title: 'Traprenovatie met eiken treden',
        location: 'Utrecht-Oost',
        beforeImg: getUnsplashUrl('1584622650111-993a426fbf0a', 1000),
        afterImg: getUnsplashUrl('1595844730298-b960ff98fee0', 1000),
        description: 'Van oude vloerbedekking naar krasvast overgezet massief eiken met zachte led-strip verlichting.',
      },
    ],
    flow: [
      {
        q: 'Wat wil je laten maken?',
        o: [
          { l: 'Kozijn vervangen', h: 'v.a. € 650', b: 650 },
          { l: 'Trap op maat', h: 'v.a. € 2.400', b: 2400 },
          { l: 'Inbouwkast', h: 'v.a. € 900', b: 900 },
          { l: 'Vloer leggen', h: '€ 28/m²', b: 840 },
        ],
      },
      {
        q: 'Hoe groot is de klus?',
        o: [
          { l: 'Klein project', h: '', a: 0 },
          { l: 'Gemiddeld (standaard woning)', h: '+ € 450', a: 450 },
          { l: 'Groot (gehele verdieping/woning)', h: '+ € 1.200', a: 1200 },
        ],
      },
      {
        q: 'Welke houtsoort heeft je voorkeur?',
        o: [
          { l: 'Vuren / grenen', h: 'Standaard', a: 0 },
          { l: 'Massief eikenhout', h: '+ € 600', a: 600 },
          { l: 'Weet ik nog niet (advies gewenst)', h: '', a: 0 },
        ],
      },
    ],
    estNote:
      'Dit is een realistische richtprijs inclusief btw en basismateriaal. Na inmeten ontvang je altijd een bindende offerte.',
    reviews: [
      {
        q: 'Prachtige eiken trap laten plaatsen. Binnen 2 dagen klaar en de gang lag er schoner bij dan ervoor!',
        who: 'Mirjam & Thomas, Zeist',
      },
      {
        q: 'De inbouwkast past tot op de millimeter onder onze schuine zolderkap. Aanrader.',
        who: 'Tom van Dijk, Utrecht',
      },
      {
        q: 'Afspraak is afspraak bij Jan. Prijsopgave klopte precies, geen cent meerwerk.',
        who: 'Familie Kok, Bunnik',
      },
    ],
  },
  hovenier: {
    id: 'hovenier',
    name: 'Hovenier',
    biz: 'Groen & Zo Tuinen',
    owner: 'Lotte Visser',
    city: 'Haarlem',
    phone: '06 23 45 67 89',
    near: ['20', '21', '19', '22'],
    pcExample: '2011 AB',
    hD: 150,
    hB: 135,
    cf: 1,
    since: '2012',
    rating: '4,8',
    reviewCount: 94,
    pool: [
      '1612806527197-42af2b64884a',
      '1700689807667-82630348b301',
      '1617576683096-00fc8eecb3af',
      '1597201278257-3687be27d954',
      '1621272156568-7306716648df',
      '1617850687395-620757feb1f3',
      '1734079692087-91bac04efcd1',
      '1668120089662-42642838cfef',
      '1622383563227-04401ab4e5ea',
      '1734303023491-db8037a21f09',
      '1585320806297-9794b3e4eeae',
      '1538307602205-80b5c2ff26ec',
    ],
    kicker: 'TUINONTWERP & AANLEG',
    headline: 'Een tuin waar je elk seizoen van geniet.',
    intro:
      'Ik ontwerp, leg aan en onderhoud sfeervolle tuinen. Van strakke terrassen tot bloemrijke borders die het hele jaar door bloeien.',
    cta1: 'Bereken je tuinprijs',
    cta2: 'Bekijk gerealiseerde tuinen',
    about:
      'Sinds 2012 werk ik met passie aan tuinen in Zuid-Kennemerland. Samen met mijn kleine team planten we wat bij jouw zand- of kleigrond past, zodat het groen gezond blijft.',
    servicesTitle: 'Alles voor je buitenruimte',
    services: [
      {
        n: 'Tuinonderhoud',
        d: 'Periodiek snoeien, hagen scheren, gazonverzorging en bemesting.',
        p: 'v.a. € 48 per uur',
      },
      {
        n: 'Sierbestrating',
        d: 'Terras, looppad of oprit vakkundig gelegd met keramische tegels of klinkers.',
        p: '€ 58 per m²',
      },
      {
        n: 'Beplantingsplan',
        d: 'Borders en wintergroene hagen die afgestemd zijn op licht, bodem en jouw smaak.',
        p: 'v.a. € 320',
      },
      {
        n: 'Tuinontwerp & 3D',
        d: 'Volledig doordacht tuinontwerp met materialenoverzicht en verlichtingsplan.',
        p: 'v.a. € 450',
      },
    ],
    marks: ['VHG-hovenier', 'Groenkeur erkend', 'VCA gecertificeerd', 'Bijenlint partner'],
    workNote: 'Foto’s van recente tuinprojecten in de regio',
    work: [
      { t: 'Klinkers & Cortenstaal border', c: 'Haarlem-Noord', y: '2026' },
      { t: 'Verhoogd zonneterras met overkapping', c: 'Bloemendaal', y: '2025' },
      { t: 'Onderhoudsvriendelijke stadstuin', c: 'Heemstede', y: '2025' },
    ],
    flow: [
      {
        q: 'Wat wil je laten doen?',
        o: [
          { l: 'Seizoensonderhoud', h: 'v.a. € 180', b: 180 },
          { l: 'Nieuwe bestrating', h: 'v.a. € 1.650', b: 1650 },
          { l: 'Bomen & hagen snoeien', h: 'v.a. € 220', b: 220 },
          { l: 'Compleet nieuw tuinontwerp', h: 'v.a. € 450', b: 450 },
        ],
      },
      {
        q: 'Hoe groot is de tuin?',
        o: [
          { l: 'Tot 50 m² (stadstuin)', h: '', a: 0 },
          { l: '50 tot 150 m² (rijtjeshuis)', h: '+ € 280', a: 280 },
          { l: 'Groter dan 150 m²', h: '+ € 650', a: 650 },
        ],
      },
      {
        q: 'Groenafval meteen afvoeren?',
        o: [
          { l: 'Ja, inclusief afvoeren & opruimen', h: '+ € 65', a: 65 },
          { l: 'Nee, gebruik eigen compostbak', h: '', a: 0 },
        ],
      },
    ],
    estNote:
      'Inclusief btw. Na een vrijblijvend bezoek aan je tuin ontvang je een gespecificeerde offerte.',
    reviews: [
      {
        q: 'Onze verwilderde tuin is omgetoverd tot een oase van rust. Heerlijk om naar buiten te kijken.',
        who: 'Ingrid & Marc, Heemstede',
      },
      {
        q: 'Elk voorjaar en najaar staat Lotte klaar. Heel betrouwbaar en kundig.',
        who: 'Peter, Haarlem',
      },
      {
        q: 'Creatief ontwerp met veel bloemen en toch weinig onderhoud. Heel blij mee!',
        who: 'Yara & Niels, Bloemendaal',
      },
    ],
  },
  schilder: {
    id: 'schilder',
    name: 'Schilder',
    biz: 'Verfwerk Bakker',
    owner: 'Sem Bakker',
    city: 'Amersfoort',
    phone: '06 34 56 78 90',
    near: ['38', '37', '39', '12'],
    pcExample: '3811 AB',
    hD: 255,
    hB: 245,
    cf: 1,
    since: '2014',
    rating: '4,9',
    reviewCount: 211,
    pool: [
      '1717281234297-3def5ae3eee1',
      '1562259949-e8e7689d7828',
      '1688372199140-cade7ae820fe',
      '1511822148790-e7b58ba14c72',
      '1529722155810-17303d209942',
      '1693985120993-e9b203ce7631',
      '1525909002-1b05e0c869d8',
      '1688372198189-de6a51777a81',
      '1652572036885-b5e9205dd847',
      '1460661419201-fd4cecdf8a8b',
      '1733426107854-ee00a25d72a7',
    ],
    kicker: 'BINNEN- & BUITENSCHILDER',
    headline: 'Strak geschilderd, op tijd klaar.',
    intro:
      'Professioneel schilderwerk voor particulieren en VvE’s. Wij werken met A-kwaliteit lakken van Sikkens en Sigma met standaard 5 jaar garantie.',
    cta1: 'Bereken je schilderprijs',
    cta2: 'Bekijk projecten',
    about:
      'Als derde generatie schilder in Amersfoort heb ik het vak in de vingers. We plakken alles secuur af, schuren stofarm en leveren je woning brandschoon op.',
    servicesTitle: 'Strakke wanden en kozijnen',
    services: [
      {
        n: 'Binnenschilderwerk',
        d: 'Muren sauzen, plafonds spuiten, deuren en trappen aflakken met krasvaste lak.',
        p: '€ 18 per m²',
      },
      {
        n: 'Buitenschilderwerk',
        d: 'Kozijnen, deuren, dakkapellen en dakranden beschermd tegen weer en wind.',
        p: '€ 27 per m²',
      },
      {
        n: 'Houtrotreparatie',
        d: 'Epoxy reparaties en deelvervanging van aangetaste kozijndelen met garantie.',
        p: 'op nacalculatie',
      },
      {
        n: 'Behang & Renovlies',
        d: 'Stootvast glasweefsel, vliesbehang of fotobehang naadloos aangebracht.',
        p: '€ 14 per m²',
      },
    ],
    marks: ['OnderhoudNL garantie', '5 jaar schriftelijke garantie', 'VCA gecertificeerd', 'Sikkens specialist'],
    workNote: 'Recent binnenschilderwerk in regio Amersfoort',
    work: [
      { t: 'Woonkamer & keuken in kalkverf', c: 'Amersfoort', y: '2026' },
      { t: 'Grachtenpand kozijnen buitenzijde', c: 'Leusden', y: '2025' },
      { t: 'Slaapkamer & trappenhuis', c: 'Soest', y: '2025' },
    ],
    flow: [
      {
        q: 'Wat moet er geschilderd worden?',
        o: [
          { l: 'Binnen (wanden en plafonds)', h: 'v.a. € 540', b: 540 },
          { l: 'Buiten (kozijnen en gevel)', h: 'v.a. € 1.350', b: 1350 },
          { l: 'Houtrot herstellen & aflakken', h: 'v.a. € 350', b: 350 },
          { l: 'Renovliesbehang + sauzen', h: 'v.a. € 480', b: 480 },
        ],
      },
      {
        q: 'Om hoeveel kamers of gevels gaat het?',
        o: [
          { l: '1 ruimte of enkele kozijnen', h: '', a: 0 },
          { l: '2 tot 3 kamers', h: '+ € 620', a: 620 },
          { l: 'Hele woning', h: '+ € 1.450', a: 1450 },
        ],
      },
      {
        q: 'Wil je kleuradvies aan huis?',
        o: [
          { l: 'Nee, ik weet de RAL-kleuren al', h: '', a: 0 },
          { l: 'Ja, inclusief stalen & advies', h: '+ € 75', a: 75 },
        ],
      },
    ],
    estNote:
      'Inclusief btw, afplakken en 5 jaar garantie. Na bezichtiging van de ondergrond ontvang je de definitieve prijs.',
    reviews: [
      {
        q: 'Binnen een week was het hele huis strak gesaust en gelakt. Geen spatje verf op onze houten vloer.',
        who: 'Anouk, Leusden',
      },
      {
        q: 'Prettige communicatie, kwam zijn afspraken stipt na en werkte erg stil en schoon.',
        who: 'Rob van Leeuwen, Amersfoort',
      },
      {
        q: 'Het houtrot in het erkerkozijn is onzichtbaar gerepareerd en alles glanst weer prachtig.',
        who: 'VvE De Linde, Soest',
      },
    ],
  },
  loodgieter: {
    id: 'loodgieter',
    name: 'Loodgieter',
    biz: 'Lekvrij Installaties',
    owner: 'Ahmed El Amrani',
    city: 'Amsterdam',
    phone: '06 45 67 89 01',
    near: ['10', '11', '15', '14'],
    pcExample: '1011 AB',
    hD: 240,
    hB: 215,
    cf: 1,
    since: '2013',
    rating: '4,9',
    reviewCount: 342,
    pool: [
      '1749532125405-70950966b0e5',
      '1676210134188-4c05dd172f89',
      '1631889993959-41b4e9c6e3c5',
      '1676210134190-3f2c0d5cf58d',
      '1733426107854-ee00a25d72a7',
      '1676210133055-eab6ef033ce3',
      '1587527901949-ab0341697c1e',
      '1761758674188-2b8e4c89c5e2',
      '1775359924006-557dba8c862b',
      '1650551182991-b07558247564',
      '1600488999585-e4364713b90a',
      '1772442198677-10c8e7b46a5f',
    ],
    kicker: '24/7 SPOED & ONDERHOUD',
    headline: 'Lekkage of storing? Binnen 45 minuten ter plaatse.',
    intro:
      'Erkend loodgieter en installateur in Amsterdam en omstreken. Wij lossen acute lekkages, verstoppingen en cv-storingen snel en transparant op.',
    cta1: 'Bereken de kosten',
    cta2: 'Direct bellen bij spoed',
    about:
      'Al meer dan 12 jaar help ik Amsterdammers bij water- en gasproblemen. Mijn servicebus is compleet uitgerust met persgereedschap en inspectiecamera’s.',
    servicesTitle: 'Snelle en betrouwbare hulp',
    services: [
      {
        n: 'Lekkagedetectie & herstel',
        d: 'Met thermografie en vochtmeting sporen we lekkages op zonder onnodig hak- en breekwerk.',
        p: 'voorrijden € 49',
      },
      {
        n: 'Ontstoppingsservice',
        d: 'Gootsteen, toilet of standleiding machinaal gereinigd en doorgespoten.',
        p: 'v.a. € 95',
      },
      {
        n: 'Cv-ketel onderhoud',
        d: 'Jaarlijkse inspectie, CO-meting en storingsdienst voor Remeha, Nefit en Vaillant.',
        p: 'onderhoud € 89',
      },
      {
        n: 'Sanitair & Badkamers',
        d: 'Complete renovatie van leidingwerk, inloopdouches en inbouwreservoirs.',
        p: 'vrijblijvende offerte',
      },
    ],
    marks: ['Techniek Nederland', 'Gaskeur gecertificeerd', 'VCA Vol', 'KvK geregistreerd'],
    workNote: 'Installaties en reparaties in Amsterdam',
    work: [
      { t: 'Koperen waterleidingen nieuwbouw', c: 'De Pijp', y: '2026' },
      { t: 'Vervanging standleiding & afvoer', c: 'Amsterdam-Oost', y: '2026' },
      { t: 'Inbouw sanitair & kranen', c: 'Diemen', y: '2025' },
    ],
    flow: [
      {
        q: 'Wat is het probleem?',
        o: [
          { l: 'Waterlekkage', h: 'v.a. € 49', b: 49 },
          { l: 'Verstopping in afvoer/wc', h: 'v.a. € 95', b: 95 },
          { l: 'Cv-ketel storing/onderhoud', h: '€ 89', b: 89 },
          { l: 'Sanitair / complete badkamer', h: 'v.a. € 5.800', b: 5800 },
        ],
      },
      {
        q: 'Waar bevindt zich de situatie?',
        o: [
          { l: 'Keuken', h: '', a: 0 },
          { l: 'Badkamer of toilet', h: '', a: 0 },
          { l: 'Kruipruimte of kelder', h: '+ € 45', a: 45 },
        ],
      },
      {
        q: 'Hoe snel moet de loodgieter er zijn?',
        o: [
          { l: 'Binnenkort (regulier tarief)', h: '', a: 0 },
          { l: 'Vandaag nog (spoedservice)', h: '+ € 75', a: 75 },
        ],
      },
    ],
    estNote:
      'Transparant basistarief inclusief btw. Eventueel meerwerk en materiaalkosten worden altijd vóór aanvang besproken.',
    reviews: [
      {
        q: 'Op zondagavond stroomde het water door het plafond. Binnen een half uur was Ahmed er en had hij de breuk gedicht.',
        who: 'Lisa & Bram, Amsterdam-Oost',
      },
      {
        q: 'Geen louche praktijken zoals je wel eens hoort, maar een echte vakman met een eerlijke factuur.',
        who: 'Jeroen, De Pijp',
      },
      {
        q: 'Nieuwe cv-ketel geïnstalleerd en netjes ingeregeld. Radiatoren worden nu veel sneller warm.',
        who: 'Fatima, Diemen',
      },
    ],
  },
  elektricien: {
    id: 'elektricien',
    name: 'Elektricien',
    biz: 'Stroomwerk Rotterdam',
    owner: 'Mark Jansen',
    city: 'Rotterdam',
    phone: '06 56 78 90 12',
    near: ['30', '31', '29', '26', '32'],
    pcExample: '3011 AB',
    hD: 262,
    hB: 95,
    cf: 1,
    vivid: 'oklch(0.86 0.17 95)',
    vividLight: true,
    since: '2011',
    rating: '5,0',
    reviewCount: 156,
    pool: [
      '1621905251189-08b45d6a269e',
      '1615774925655-a0e97fc85c14',
      '1758101755915-462eddc23f57',
      '1660330589693-99889d60181e',
      '1621905251918-48416bd8575a',
      '1544724569-5f546fd6f2b5',
      '1682345262055-8f95f3c513ea',
      '1555963966-b7ae5404b6ed',
      '1621905252507-b35492cc74b4',
      '1635335874521-7987db781153',
      '1646640381839-02748ae8ddf0',
      '1785682117029-86171f64c826',
    ],
    kicker: 'ERKEND INSTALLATEUR NEN 1010',
    headline: 'Laadpaal, groepenkast, zonnepanelen.',
    intro:
      'Gecertificeerd elektrotechnisch installateur in Groot-Rotterdam. Vaste pakketprijzen, professionele meetrapporten en gegarandeerd veilige oplevering.',
    cta1: 'Bereken je installatieprijs',
    cta2: 'Direct bellen bij storing',
    about:
      'Gediplomeerd elektromonteur met meer dan 14 jaar ervaring. Ik installeer conform de strenge NEN 1010 en NEN 3140 normen, zodat je verzekering altijd gedekt is.',
    servicesTitle: 'Veilige stroom in huis',
    services: [
      {
        n: 'Laadpaal installatie',
        d: 'Slimme 11kW/22kW thuislader inclusief kabeltraject, extra automaat en dynamic load balancing.',
        p: 'v.a. € 1.250',
      },
      {
        n: 'Groepenkast vervangen',
        d: 'ABB of Eaton groepenkast, 1-fase naar 3-fase voor kookgroep of warmtepomp.',
        p: 'v.a. € 795',
      },
      {
        n: 'Aansluiting zonnepanelen',
        d: 'Aparte kabel van omvormer naar meterkast inclusief overspanningsbeveiliging.',
        p: 'v.a. € 450',
      },
      {
        n: 'Elektra storing oplossen',
        d: 'Kortsluiting of aardlekstoring vakkundig uitmeten en herstellen.',
        p: 'voorrijden € 59',
      },
    ],
    marks: ['InstallQ erkend', 'NEN 1010 gecertificeerd', 'Techniek Nederland', 'VCA Vol'],
    workNote: 'Recente verdeelkasten en laadpalen in Rotterdam',
    work: [
      { t: '12-groeps ABB groepenkast met 3-fase', c: 'Kralingen', y: '2026' },
      { t: 'Alfen laadpaal met load balancing', c: 'Schiedam', y: '2026' },
      { t: 'Elektrische kookgroep + perilex', c: 'Capelle a/d IJssel', y: '2025' },
    ],
    flow: [
      {
        q: 'Welke installatie zoek je?',
        o: [
          { l: 'Laadpaal auto plaatsen', h: 'v.a. € 1.250', b: 1250 },
          { l: 'Groepenkast vernieuwen', h: 'v.a. € 795', b: 795 },
          { l: 'Zonnepanelen aansluiten', h: 'v.a. € 450', b: 450 },
          { l: 'Aardlek / kortsluiting verhelpen', h: '€ 59 + uurloon', b: 59 },
        ],
      },
      {
        q: 'Wat voor soort woning betreft het?',
        o: [
          { l: 'Appartement (korte leiding)', h: '', a: 0 },
          { l: 'Tussenwoning (standaard)', h: '', a: 0 },
          { l: 'Vrijstaande woning (langer tracé)', h: '+ € 190', a: 190 },
        ],
      },
      {
        q: 'Wanneer gewenst?',
        o: [
          { l: 'Regulier (binnen 2 weken)', h: '', a: 0 },
          { l: 'Vandaag / morgen (spoed)', h: '+ € 75', a: 75 },
        ],
      },
    ],
    estNote:
      'Vaste prijs inclusief kwaliteitsmaterialen en btw. Je ontvangt na oplevering altijd een NEN-keuringsrapport.',
    reviews: [
      {
        q: 'Onze Alfen laadpaal draait perfect met load balancing. Duidelijke uitleg en super strakke bekabeling.',
        who: 'Sanne & Wouter, Schiedam',
      },
      {
        q: 'Meterkast geüpgraded naar 3-fase voor de inductiekookplaat. Vaste prijs klopte exact.',
        who: 'Erik, Rotterdam-Noord',
      },
      {
        q: 'Zaterdagmiddag vloog de aardlek eruit. Mark kwam snel langs en vond de boosdoener in de tuin.',
        who: 'Familie Öztürk, Capelle',
      },
    ],
  },
  stukadoor: {
    id: 'stukadoor',
    name: 'Stukadoor',
    biz: 'Glad Gestuct',
    owner: 'Ruud Smit',
    city: 'Eindhoven',
    phone: '06 67 89 01 23',
    near: ['56', '55', '57', '52'],
    pcExample: '5611 AB',
    hD: 60,
    hB: 75,
    cf: 0.35,
    since: '2005',
    rating: '4,9',
    reviewCount: 87,
    pool: [
      '1768321918210-a775e4c88f08',
      '1785682118449-21da8825754d',
      '1661107259637-4e1c55462428',
      '1622542796254-5b9c46ab0d2f',
      '1552321554-5fefe8c9ef14',
      '1622542795953-5c26b9d8a135',
      '1529722155810-17303d209942',
      '1622542795979-1a7b6e74b46a',
      '1587582423116-ec07293f0395',
      '1696987007764-7f8b85dd3033',
      '1650894622076-e09ab837c502',
    ],
    kicker: 'STUCWERK & SIERPLEISTER',
    headline: 'Muren zo glad als een spiegel.',
    intro:
      'Gespecialiseerd in sausklaar glad stucwerk, beton ciré en spachtelputz. Wij schuren en werken stofarm dankzij professionele afzuiging.',
    cta1: 'Bereken je stucprijs',
    cta2: 'Bekijk afwerkingen',
    about:
      'Al ruim 20 jaar stukadoor in de regio Eindhoven. Strakke hoekprofielen, vlakke plafonds en zorgvuldig afgedekte vloeren zijn mijn handelsmerk.',
    servicesTitle: 'Ambachtelijke stucafwerkingen',
    services: [
      {
        n: 'Sausklaar stucwerk',
        d: 'Muren en plafonds spiegelglad gestuukt, direct klaar voor de verfroller.',
        p: '€ 17 per m²',
      },
      {
        n: 'Spachtelputz',
        d: 'Sterke, stootvaste korrelpleister in elke gewenste kleur, onderhoudsvrij.',
        p: '€ 20 per m²',
      },
      {
        n: 'Beton Ciré & Betonlook',
        d: 'Waterdichte en naadloze minerale stuc voor badkamers, keukens en toiletten.',
        p: '€ 68 per m²',
      },
      {
        n: 'Plafonds stucen',
        d: 'Bestaand spuitwerk gladtrekken en strak afwerken met hoeklijnen.',
        p: '€ 19 per m²',
      },
    ],
    marks: ['NOA-afbouwgarantie', 'Stofarm gecertificeerd', '10 jaar garantie', 'VCA gecertificeerd'],
    workNote: 'Gefotografeerd bij natuurlijk strijklicht',
    work: [
      { t: 'Beton ciré badkamer naadloos', c: 'Eindhoven', y: '2026' },
      { t: 'Sausklaar stucwerk nieuwbouw', c: 'Veldhoven', y: '2025' },
      { t: 'Woonkamer met fijn schuurwerk', c: 'Best', y: '2025' },
    ],
    flow: [
      {
        q: 'Welke stucafwerking zoek je?',
        o: [
          { l: 'Sausklaar glad stucwerk', h: 'v.a. € 510', b: 510 },
          { l: 'Spachtelputz / korrel', h: 'v.a. € 600', b: 600 },
          { l: 'Beton ciré (badkamer/keuken)', h: 'v.a. € 1.950', b: 1950 },
          { l: 'Alleen plafonds', h: 'v.a. € 570', b: 570 },
        ],
      },
      {
        q: 'Hoeveel vierkante meter (ongeveer)?',
        o: [
          { l: 'Tot 30 m²', h: '', a: 0 },
          { l: '30 tot 60 m²', h: '+ € 510', a: 510 },
          { l: 'Meer dan 60 m² (gehele woning)', h: '+ € 1.200', a: 1200 },
        ],
      },
      {
        q: 'Wat is de staat van de ondergrond?',
        o: [
          { l: 'Kaal metselwerk / gipsplaat', h: '', a: 0 },
          { l: 'Oude muur met scheuren/gaten', h: '+ € 120', a: 120 },
          { l: 'Er zit nog oud behang op', h: '+ € 180', a: 180 },
        ],
      },
    ],
    estNote:
      'Inclusief btw, voorstrijk, hoekprofielen en afdekken. Na inmeten op locatie ontvang je een vaste offerte.',
    reviews: [
      {
        q: 'De muren zijn zo strak dat de schilder meteen aan de slag kon. Geen stofje in huis achtergelaten.',
        who: 'Eva & Daan, Veldhoven',
      },
      {
        q: 'Beton ciré in de badkamer laten zetten. Ziet eruit als een luxe wellnessresort!',
        who: 'Bas de Groot, Eindhoven',
      },
      {
        q: 'Zeer betrouwbaar, dacht goed mee over de droogtijd en hield zich keurig aan de planning.',
        who: 'Marloes, Best',
      },
    ],
  },
};

export function getUnsplashUrl(photoId: string, width = 1200): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=82`;
}

export function getPhotoSet(sector: SectorData, styleIndex: number) {
  const p = sector.pool;
  const n = p.length;
  const at = (j: number) => p[(styleIndex + j * 5) % n];
  return {
    hero: getUnsplashUrl(at(0), 1800),
    a: getUnsplashUrl(at(1), 1000),
    b: getUnsplashUrl(at(2), 1000),
    c: getUnsplashUrl(at(3), 1000),
    d: getUnsplashUrl(at(4), 1000),
    e: getUnsplashUrl(at(5), 1000),
  };
}

export function computePalette(sector: SectorData, style: StyleDef): Palette {
  const h = sector.hD;
  const b = sector.hB;
  const k = sector.cf;

  if (style.id === 'klassiek') {
    return {
      bg: getOklchColor(0.972, 0.012 * k, b),
      card: getOklchColor(0.99, 0.006 * k, b),
      fg: getOklchColor(0.23, 0.03 * k, h),
      muted: getOklchColor(0.45, 0.03 * k, h),
      line: getOklchColor(0.88, 0.016 * k, b),
      soft: getOklchColor(0.9, 0.03 * k, b),
      accent: getOklchColor(0.46, 0.11 * k, h),
      onAccent: '#ffffff',
      accentText: getOklchColor(0.46, 0.11 * k, h),
      invBg: getOklchColor(0.23, 0.03 * k, h),
      invFg: getOklchColor(0.97, 0.01, b),
      invMuted: getOklchColor(0.78, 0.02 * k, b),
      invLine: getOklchColor(0.4, 0.03 * k, h),
      hi: getOklchColor(0.84, 0.09 * k, b),
      onHi: getOklchColor(0.2, 0.03 * k, h),
      radius: '12px',
      radiusSm: '8px',
      radiusLg: '18px',
      hdrA: '0.88',
    };
  }

  if (style.id === 'modern') {
    return {
      bg: getOklchColor(0.995, 0.002, h),
      card: getOklchColor(0.97, 0.007, h),
      fg: getOklchColor(0.18, 0.02, h),
      muted: getOklchColor(0.45, 0.02, h),
      line: getOklchColor(0.92, 0.008, h),
      soft: getOklchColor(0.93, 0.025 * k, h),
      accent: getOklchColor(0.55, 0.16 * k, h),
      onAccent: '#ffffff',
      accentText: getOklchColor(0.5, 0.16 * k, h),
      invBg: getOklchColor(0.18, 0.02, h),
      invFg: getOklchColor(0.98, 0.004, h),
      invMuted: getOklchColor(0.75, 0.02, h),
      invLine: getOklchColor(0.34, 0.02, h),
      hi: getOklchColor(0.8, 0.12 * k, h),
      onHi: getOklchColor(0.18, 0.02, h),
      radius: '999px',
      radiusSm: '16px',
      radiusLg: '28px',
      hdrA: '0.82',
    };
  }

  if (style.id === 'krachtig') {
    const light = !!sector.vividLight;
    const acc = sector.vivid || getOklchColor(0.58, 0.17 * k, b);
    return {
      bg: getOklchColor(0.98, 0.006, b),
      card: '#ffffff',
      fg: getOklchColor(0.16, 0.01, b),
      muted: getOklchColor(0.42, 0.01, b),
      line: getOklchColor(0.88, 0.01, b),
      soft: getOklchColor(0.92, 0.04 * k, b),
      accent: acc,
      onAccent: light ? getOklchColor(0.16, 0.01, b) : '#ffffff',
      accentText: light ? getOklchColor(0.5, 0.12, b - 10) : acc,
      invBg: getOklchColor(0.16, 0.01, b),
      invFg: getOklchColor(0.98, 0.006, b),
      invMuted: getOklchColor(0.72, 0.01, b),
      invLine: getOklchColor(0.34, 0.01, b),
      hi: light ? acc : getOklchColor(0.8, 0.13 * k, b),
      onHi: getOklchColor(0.16, 0.01, b),
      radius: '4px',
      radiusSm: '4px',
      radiusLg: '8px',
      hdrA: '0.92',
    };
  }

  if (style.id === 'donker') {
    return {
      bg: getOklchColor(0.17, 0.012, h),
      card: getOklchColor(0.21, 0.015, h),
      fg: getOklchColor(0.95, 0.01, b),
      muted: getOklchColor(0.74, 0.015, b),
      line: getOklchColor(0.31, 0.015, h),
      soft: getOklchColor(0.27, 0.02, h),
      accent: getOklchColor(0.82, 0.11 * k, b),
      onAccent: getOklchColor(0.17, 0.012, h),
      accentText: getOklchColor(0.82, 0.11 * k, b),
      invBg: getOklchColor(0.95, 0.012, b),
      invFg: getOklchColor(0.17, 0.012, h),
      invMuted: getOklchColor(0.42, 0.012, h),
      invLine: getOklchColor(0.84, 0.012, b),
      hi: getOklchColor(0.42, 0.1 * k, h),
      onHi: '#ffffff',
      radius: '2px',
      radiusSm: '2px',
      radiusLg: '4px',
      hdrA: '0.8',
    };
  }

  // Minimaal
  return {
    bg: getOklchColor(0.965, 0.004, b),
    card: getOklchColor(0.985, 0.003, b),
    fg: getOklchColor(0.2, 0.006, h),
    muted: getOklchColor(0.5, 0.006, h),
    line: getOklchColor(0.88, 0.005, b),
    soft: getOklchColor(0.91, 0.01, b),
    accent: getOklchColor(0.2, 0.006, h),
    onAccent: getOklchColor(0.97, 0.004, b),
    accentText: getOklchColor(0.45, 0.1 * k, h),
    dot: getOklchColor(0.62, 0.15 * k, b),
    invBg: getOklchColor(0.91, 0.008, b),
    invFg: getOklchColor(0.2, 0.006, h),
    invMuted: getOklchColor(0.45, 0.006, h),
    invLine: getOklchColor(0.8, 0.006, b),
    hi: getOklchColor(0.2, 0.006, h),
    onHi: '#ffffff',
    radius: '999px',
    radiusSm: '12px',
    radiusLg: '14px',
    hdrA: '0.85',
  };
}

export function buildActiveSite(
  sectorId: SectorId,
  styleIndex: number,
  customForm?: WizardFormData,
  disabledServices?: Record<number, boolean>
): ActiveSiteData {
  const base = SECTORS[sectorId];
  const style = STYLES[Math.max(0, Math.min(STYLES.length - 1, styleIndex))];
  const palette = computePalette(base, style);
  const photos = getPhotoSet(base, styleIndex);

  const biz = customForm?.biz?.trim() ? customForm.biz.trim() : base.biz;
  const owner = customForm?.owner?.trim() ? customForm.owner.trim() : base.owner;
  const phone = customForm?.phone?.trim()
    ? formatPhoneNumber(customForm.phone.trim())
    : base.phone;
  const city = customForm?.city?.trim() ? customForm.city.trim() : base.city;

  const domain = generateDomainSlug(biz);
  const bizLetter = biz.charAt(0).toUpperCase() || 'K';
  const callLabel = `Bel ${phone}`;
  const ownerFirstUpper = owner.split(' ')[0].toUpperCase();
  const about = `Ik ben ${owner.split(' ')[0]}. ${base.about}`;
  const kicker = `${base.kicker} · ${city.toUpperCase()}`;

  const filteredServices = base.services
    .filter((_, idx) => !disabledServices || !disabledServices[idx])
    .map((s, idx) => ({
      ...s,
      nr: String(idx + 1).padStart(2, '0'),
    }));

  const work = base.work.map((w, idx) => ({
    ...w,
    img: [photos.a, photos.b, photos.c][idx] || photos.a,
  }));

  const hdrBg = palette.bg.replace(')', ` / ${palette.hdrA})`);
  const hiText = palette.hi;

  return {
    ...base,
    ...palette,
    biz,
    owner,
    phone,
    city,
    display: style.display,
    dw: style.dw,
    ls: style.ls,
    styleName: style.name,
    styleId: style.id,
    layout: style.layout,
    img: photos,
    nameLower: base.name.toLowerCase(),
    domain,
    bizLetter,
    callLabel,
    ownerFirstUpper,
    about,
    kicker,
    services: filteredServices,
    work,
    hdrBg,
    hiText,
  };
}
