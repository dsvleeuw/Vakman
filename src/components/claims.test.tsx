import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME_INTRO, PACKAGE_DELIVERY_NOTE, WIZARD_TRADE_INTRO } from '../data/marketing';
import { SECTORS, STYLES } from '../data/tradesData';
import { SERVICE_FEATURES } from '../data/plans';
import { DEFAULT_FAQS } from './FaqSection';
import { STEPS } from './HowItWorks';

/**
 * The marketing pages are promises to a customer who has not paid yet.
 *
 * What Klusbaas does not build does not go on them (VISION principle 2):
 * there is no own `.nl` domain at the moment of publishing, the offers of
 * a craftsman live in his own account (not in his Google Drive), and the
 * photos and prices on a customer site are his own.
 */

const faqText = DEFAULT_FAQS.map((faq) => `${faq.q} ${faq.a}`).join(' ');
const stepsText = STEPS.map((step) => `${step.t} ${step.d}`).join(' ');
const serviceText = SERVICE_FEATURES.join(' ');

test('de marketingpagina\'s beloven geen dingen die niet gebouwd zijn', () => {
  // De offertes van de vakman staan in zijn account, niet in zijn Drive.
  assert.ok(
    !faqText.includes('Google Drive'),
    'de FAQ belooft geen offertes in Google Drive'
  );
  // Een .nl-domein wordt per opdracht geregistreerd, niet bij het publiceren.
  assert.ok(
    !faqText.includes('direct bereikbaar'),
    'de FAQ belooft geen eigen domein bij het publiceren'
  );
  assert.ok(
    !stepsText.includes('Je eigen .nl domeinnaam'),
    'hoe het werkt belooft geen eigen domein bij het publiceren'
  );
  assert.ok(
    !serviceText.includes('.nl-domein'),
    'de maandelijkse service bevat niet automatisch een domein'
  );
  // De foto\'s en de prijzen op een klantsite zijn die van de klant zelf.
  assert.ok(
    !HOME_INTRO.includes('professionele fotografie'),
    'de homepage belooft geen foto\'s van het voorbeeld'
  );
});

test('het aantal vakken en stijlen in de tekst klopt met de code', () => {
  const trades = Object.keys(SECTORS).length;
  const styles = STYLES.length;
  // "Zes vakken" terwijl er zeven zijn, is een belofte die niet klopt.
  assert.ok(
    stepsText.includes(`${trades} vakken`),
    `hoe het werkt noemt ${trades} vakken`
  );
  assert.ok(
    stepsText.includes(`${styles} stijlen`),
    `hoe het werkt noemt ${styles} stijlen`
  );
  assert.equal(stepsText.includes('Zes vakken'), false, 'de tekst noemt geen vast aantal vakken meer');
});

test('de prijzenpagina zegt wat een pakket is bovenop de gratis editor', () => {
  // De klant mag weten dat hij de site zelf kan invullen: een pakket is de
  // aflegging, niet de enige manier om een site te krijgen.
  assert.ok(
    faqText.includes('zonder pakket'),
    'de FAQ beantwoordt de vraag of je de site ook zelf kunt maken'
  );
  assert.ok(
    PACKAGE_DELIVERY_NOTE.includes('in je eigen editor'),
    'de prijzenpagina zegt dat de klant de site zelf invult'
  );
  assert.ok(
    PACKAGE_DELIVERY_NOTE.includes('twee weken'),
    'de prijzenpagina zegt wanneer de site opgeleverd wordt'
  );
  // Het .nl-domein zit alleen in Pro en Premium, dus de tekst zegt dat ook.
  assert.ok(
    PACKAGE_DELIVERY_NOTE.includes('Bij Pro en Premium'),
    'de prijzenpagina zegt in welke pakketten het domein zit'
  );
});

test('de marketingpagina\'s vertellen wat er werkelijk gebeurt', () => {
  assert.ok(faqText.includes('per opdracht'), 'de FAQ legt uit hoe het met een .nl-domein gaat');
  assert.ok(faqText.includes('Mijn offertes'), 'de FAQ wijst naar de offertes in het account');
  assert.ok(stepsText.includes('eigen adres'), 'hoe het werkt vertelt waar de site staat');
  assert.ok(HOME_INTRO.includes('eigen tekst'), 'de homepage zegt dat de tekst van de klant is');
});
