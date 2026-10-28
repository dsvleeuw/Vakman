import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MailX, TriangleAlert } from 'lucide-react';
import { Logo } from './Logo';
import { NewsletterSignup } from './NewsletterSignup';
import { RouteLink } from './RouteLink';
import { SiteFooter } from './SiteFooter';
import { unsubscribeNewsletter } from '../utils/newsletterClient';
import type { NewsletterPageStatus } from '../utils/newsletterStatus';

/**
 * The plain information pages: /privacy, /nieuwsbrief and /afmelden.
 * Lazy-loaded as one chunk; all three are prerendered.
 */

/** Temporary contact address until klusbaas.nl mail is set up (see docs/known-limitations.md). */
export const PRIVACY_CONTACT_EMAIL = 'thomascliphero@gmail.com';
export const PRIVACY_UPDATED = '29 oktober 2026';

const InfoLayout: React.FC<{ children: React.ReactNode; showSignup?: boolean }> = ({ children, showSignup = true }) => (
  <div className="flex flex-col min-h-screen bg-stone-100 text-stone-900">
    <header className="px-4 sm:px-8 md:px-12 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 flex items-center justify-between gap-4 border-b border-stone-200/70">
      <RouteLink route={{ name: 'home' }} aria-label="Klusbaas homepage" className="min-h-11 inline-flex items-center">
        <Logo label={null} className="h-7 sm:h-8" />
      </RouteLink>
      <RouteLink
        route={{ name: 'wizard', step: 'vak' }}
        className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold inline-flex items-center whitespace-nowrap"
      >
        Start je website
      </RouteLink>
    </header>
    <main id="main-content" className="flex-1 px-4 sm:px-8 md:px-12 py-12 sm:py-16">
      {children}
    </main>
    <SiteFooter showSignup={showSignup} />
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 py-8 border-t border-stone-300/70">
    <h2 className="md:col-span-4 m-0 text-xl font-black tracking-tight leading-snug">{title}</h2>
    <div className="md:col-span-8 flex flex-col gap-3 text-base leading-relaxed text-stone-700 max-w-[68ch] [&_p]:m-0 [&_ul]:m-0 [&_ul]:pl-5 [&_li]:mt-1 [&_strong]:text-stone-900">
      {children}
    </div>
  </section>
);

interface DataRow {
  what: string;
  data: string;
  why: string;
  basis: string;
  keep: string;
}

const DATA_ROWS: DataRow[] = [
  {
    what: 'Offerte aanvragen (wizard)',
    data: 'Bedrijfsnaam, je naam, telefoonnummer, plaats, e-mailadres (als je dat invult), gekozen vak, stijl, pakket, diensten en voorkeursmoment.',
    why: 'Je offerte maken, naar je sturen en contact met je opnemen.',
    basis: 'Nodig om op jouw verzoek een offerte te maken (stappen vóór een overeenkomst).',
    keep: '2 jaar na het laatste contact. Word je klant, dan bewaren we offerte en factuur 7 jaar (wettelijke bewaarplicht).',
  },
  {
    what: 'Formulieren op de voorbeeldsites',
    data: 'Wat je invult: naam, telefoonnummer, e-mailadres, adres of postcode en je bericht.',
    why: 'Je vraag beantwoorden. De voorbeeldsites zijn demo’s: berichten komen bij Klusbaas binnen, niet bij een vakman.',
    basis: 'Gerechtvaardigd belang: reageren op een vraag die jij ons stelt.',
    keep: '12 maanden.',
  },
  {
    what: 'Nieuwsbrief',
    data: 'Je e-mailadres, wanneer je je aanmeldde en bevestigde, waar je je aanmeldde en de tekst waarmee je toestemming gaf.',
    why: 'Je af en toe de nieuwsbrief sturen.',
    basis: 'Jouw toestemming, die je met de bevestigingsmail geeft (dubbele opt-in). Intrekken kan altijd.',
    keep: 'Zolang je bent aangemeld. Onbevestigde aanmeldingen vervallen na 30 dagen. Na afmelden bewaren we alleen dat je bent afgemeld, zodat we je niet opnieuw mailen.',
  },
  {
    what: 'Klusbaas-account (mijn-account)',
    data: 'Je e-mailadres, een versleutelde hash van je wachtwoord, wanneer je account is aangemaakt en welke websites je aan je account hebt gekoppeld. Van een lopende sessie bewaren we alleen het sessie-id en de vervaldatum.',
    why: 'Je websites kunnen beheren: inloggen, je eigen sites terugvinden en ze aanpassen zonder beheerlink.',
    basis: 'Nodig om je account te laten werken: uitvoering van de overeenkomst die je met ons sluit.',
    keep: 'Zolang je account bestaat. Een sessie verloopt na 30 dagen. Verwijder je je account, dan gaan je gegevens en de koppeling met je sites mee.',
  },
  {
    what: 'Zakelijk contact met vakmensen',
    data: 'Bedrijfsnaam, vak, plaats, zakelijk telefoonnummer en of je toestemming gaf om te mailen.',
    why: 'Vakmensen in de regio bellen of bezoeken om onze websites aan te bieden.',
    basis: 'Gerechtvaardigd belang (zakelijke acquisitie). We mailen pas nadat je daar zelf ja op zei.',
    keep: 'Zeg je nee, dan verwijderen we je gegevens na 12 maanden. Wil je niet meer gebeld worden, dan bewaren we alleen dat, zodat we je niet opnieuw bellen.',
  },
];

export const PrivacyView: React.FC = () => (
  <InfoLayout>
    <article className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-4 pb-10 max-w-3xl">
        <h1 className="m-0 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] text-balance">
          Privacyverklaring
        </h1>
        <p className="m-0 text-lg text-stone-600 leading-relaxed text-pretty">
          Klusbaas maakt websites voor vakmensen. Hieronder staat welke gegevens we daarvoor gebruiken, waarom, hoe
          lang we ze bewaren en wat je rechten zijn. Zonder juridische omwegen.
        </p>
        <p className="m-0 text-sm text-stone-500">Laatst bijgewerkt: {PRIVACY_UPDATED}</p>
      </header>

      <Section title="Wie we zijn">
        <p>
          Klusbaas is verantwoordelijk voor de gegevens op deze site. Vragen over privacy stuur je naar{' '}
          <a className="font-semibold text-stone-900 underline underline-offset-2" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>KvK-nummer en vestigingsadres zetten we hier zodra de inschrijving rond is.</p>
      </Section>

      <Section title="Welke gegevens, waarvoor en hoe lang">
        <div className="flex flex-col gap-4">
          {DATA_ROWS.map((row) => (
            <div key={row.what} className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-3">
              <h3 className="m-0 text-lg font-extrabold text-stone-900">{row.what}</h3>
              <dl className="m-0 grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-bold text-stone-900">Gegevens</dt>
                <dd className="m-0">{row.data}</dd>
                <dt className="font-bold text-stone-900">Doel</dt>
                <dd className="m-0">{row.why}</dd>
                <dt className="font-bold text-stone-900">Grondslag</dt>
                <dd className="m-0">{row.basis}</dd>
                <dt className="font-bold text-stone-900">Bewaartermijn</dt>
                <dd className="m-0">{row.keep}</dd>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Wat we niet doen">
        <ul>
          <li>We verkopen je gegevens niet en delen ze niet voor reclame van anderen.</li>
          <li>We sturen geen reclamemail zonder dat je daar zelf toestemming voor gaf.</li>
          <li>Deze site plaatst geen tracking- of advertentiecookies.</li>
        </ul>
      </Section>

      <Section title="Wie ons helpt">
        <p>Voor een paar taken gebruiken we diensten van andere bedrijven. Zij verwerken gegevens alleen in onze opdracht:</p>
        <ul>
          <li>
            <strong>Netlify</strong> host de website en bewaart aanvragen, offertes en nieuwsbriefaanmeldingen.
          </li>
          <li>
            <strong>Resend</strong> verstuurt onze e-mails: offertes, bevestigingen en de nieuwsbrief.
          </li>
          <li>
            <strong>Google</strong> levert de lettertypes, en alleen als jij daarvoor kiest de koppeling met Google Agenda
            of Drive.
          </li>
        </ul>
        <p>
          Sommige van deze bedrijven zitten in de Verenigde Staten. Daarvoor gelden de standaardafspraken van de
          Europese Commissie, zodat je gegevens even goed beschermd zijn.
        </p>
      </Section>

      <Section title="Je rechten">
        <p>Je mag ons altijd vragen om:</p>
        <ul>
          <li>je gegevens in te zien of een kopie te krijgen;</li>
          <li>onjuiste gegevens te verbeteren;</li>
          <li>je gegevens te verwijderen;</li>
          <li>het gebruik te beperken of er bezwaar tegen te maken;</li>
          <li>je toestemming in te trekken, bijvoorbeeld voor de nieuwsbrief.</li>
        </ul>
        <p>
          Mail daarvoor naar{' '}
          <a className="font-semibold text-stone-900 underline underline-offset-2" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . We reageren binnen een maand. Afmelden voor de nieuwsbrief kan ook direct met de link onderaan elke mail.
          Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit
          Persoonsgegevens.
        </p>
      </Section>

      <Section title="Beveiliging">
        <p>
          De site werkt alleen via een beveiligde verbinding (https). Links naar offertes en de afmeldlinks bevatten
          een lange, willekeurige code, zodat anderen ze niet kunnen raden.
        </p>
      </Section>

      <Section title="Wijzigingen">
        <p>
          Passen we deze verklaring aan, dan zie je dat aan de datum bovenaan. Bij grote wijzigingen laten we het
          weten aan wie op de nieuwsbrief staat.
        </p>
      </Section>
    </article>
  </InfoLayout>
);

const STATUS_COPY: Record<NewsletterPageStatus, { tone: 'ok' | 'warn'; title: string; body: string }> = {
  bevestigd: {
    tone: 'ok',
    title: 'Je bent aangemeld',
    body: 'Dank je! Je aanmelding is bevestigd. Je krijgt de volgende nieuwsbrief in je inbox. Afmelden kan altijd met de link onderaan elke mail.',
  },
  'al-bevestigd': {
    tone: 'ok',
    title: 'Je was al aangemeld',
    body: 'Deze aanmelding was al bevestigd. Je hoeft niets meer te doen.',
  },
  verlopen: {
    tone: 'warn',
    title: 'Deze bevestigingslink is verlopen',
    body: 'Bevestigingslinks werken 30 dagen. Meld je hieronder opnieuw aan, dan sturen we een nieuwe link.',
  },
  ongeldig: {
    tone: 'warn',
    title: 'Deze link werkt niet',
    body: 'De bevestigingslink is onvolledig of al vervangen door een nieuwere. Meld je hieronder opnieuw aan.',
  },
};

const StatusBanner: React.FC<{ tone: 'ok' | 'warn'; title: string; children: React.ReactNode }> = ({ tone, title, children }) => (
  <div
    role="status"
    className={`flex gap-4 items-start rounded-2xl p-5 border ${
      tone === 'ok' ? 'bg-white border-emerald-200' : 'bg-amber-50 border-amber-300'
    }`}
  >
    {tone === 'ok' ? (
      <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
    ) : (
      <TriangleAlert className="w-6 h-6 text-amber-700 shrink-0" aria-hidden="true" />
    )}
    <div className="flex flex-col gap-1">
      <h2 className="m-0 text-lg font-extrabold">{title}</h2>
      <p className="m-0 text-stone-700 leading-relaxed">{children}</p>
    </div>
  </div>
);

export const NewsletterView: React.FC<{ status?: NewsletterPageStatus }> = ({ status }) => {
  const copy = status ? STATUS_COPY[status] : undefined;
  const showForm = !copy || copy.tone === 'warn';
  return (
    <InfoLayout showSignup={false}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="m-0 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] text-balance">
            De Klusbaas-nieuwsbrief
          </h1>
          <p className="m-0 text-lg text-stone-600 leading-relaxed text-pretty">
            Een paar keer per jaar: nieuwe stijlen en slimme tools voor je site, en wat bij vakmensen in de
            Haarlemmermeer werkt om meer aanvragen te krijgen. Geen spam, afmelden met één klik.
          </p>
        </div>
        {copy && (
          <StatusBanner tone={copy.tone} title={copy.title}>
            {copy.body}
          </StatusBanner>
        )}
        {showForm && (
          <div className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-8">
            <NewsletterSignup source="nieuwsbrief" />
          </div>
        )}
        <p className="m-0 text-sm text-stone-500">
          Zo werkt het: na het aanmelden krijg je een mail met een bevestigingslink. Pas als je daarop klikt, sta je op
          de lijst.
        </p>
      </div>
    </InfoLayout>
  );
};

type UnsubscribeState = 'idle' | 'busy' | 'afgemeld' | 'al-afgemeld' | 'ongeldig' | 'fout';

export const UnsubscribeView: React.FC<{ token?: string }> = ({ token }) => {
  const [state, setState] = useState<UnsubscribeState>(token ? 'busy' : 'idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setState('idle');
      return;
    }
    let cancelled = false;
    setState('busy');
    // Runs in the browser only, so link scanners in mail clients do not unsubscribe people.
    void unsubscribeNewsletter(token).then((result) => {
      if (cancelled) return;
      if (result.ok && (result.result === 'afgemeld' || result.result === 'al-afgemeld')) {
        setState(result.result);
      } else if (result.status === 400 || result.status === 404) {
        setState('ongeldig');
      } else {
        setError(result.error ?? '');
        setState('fout');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <InfoLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="m-0 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] text-balance">
          Afmelden voor de nieuwsbrief
        </h1>
        {state === 'busy' && (
          <p className="m-0 flex items-center gap-3 text-lg text-stone-700" role="status">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            Je wordt afgemeld…
          </p>
        )}
        {(state === 'afgemeld' || state === 'al-afgemeld') && (
          <StatusBanner tone="ok" title={state === 'afgemeld' ? 'Je bent afgemeld' : 'Je was al afgemeld'}>
            Je krijgt geen nieuwsbrief meer van ons. Toch weer meelezen? Meld je opnieuw aan op de{' '}
            <RouteLink route={{ name: 'newsletter' }} className="font-semibold underline underline-offset-2">
              nieuwsbriefpagina
            </RouteLink>
            .
          </StatusBanner>
        )}
        {state === 'ongeldig' && (
          <StatusBanner tone="warn" title="Deze afmeldlink werkt niet">
            De link is onvolledig. Gebruik de afmeldlink onderaan de laatste mail die je van ons kreeg, of mail naar{' '}
            {PRIVACY_CONTACT_EMAIL}, dan melden we je met de hand af.
          </StatusBanner>
        )}
        {state === 'fout' && (
          <StatusBanner tone="warn" title="Afmelden is niet gelukt">
            {error || 'Er ging iets mis.'} Probeer het later opnieuw of mail naar {PRIVACY_CONTACT_EMAIL}.
          </StatusBanner>
        )}
        {state === 'idle' && (
          <div className="flex gap-4 items-start rounded-2xl bg-white border border-stone-200 p-5">
            <MailX className="w-6 h-6 text-stone-700 shrink-0" aria-hidden="true" />
            <p className="m-0 text-stone-700 leading-relaxed">
              Onderaan elke nieuwsbrief staat een persoonlijke afmeldlink. Klik daarop en je bent direct afgemeld. Lukt
              dat niet? Mail naar{' '}
              <a className="font-semibold text-stone-900 underline underline-offset-2" href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=Afmelden%20nieuwsbrief`}>
                {PRIVACY_CONTACT_EMAIL}
              </a>{' '}
              en we melden je met de hand af.
            </p>
          </div>
        )}
      </div>
    </InfoLayout>
  );
};
