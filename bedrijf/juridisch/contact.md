# Klusbaas — Contactkanalen

**Versie**: 1.0
**Datum**: 2026
**Laatste update**: 2026

---

## 1. Overzicht Contactkanalen

| Doel | Kanaal | Adres | Beschikbaarheid | Reactietijd |
|------|--------|-------|-----------------|-------------|
| **Algemeen / Sales** | E-mail | `hallo@klusbaas.nl` | Werkdagen 09-17 | < 24 uur |
| **Support (Basis)** | E-mail | `support@klusbaas.nl` | Werkdagen 09-17 | < 48 uur |
| **Support (Pro)** | E-mail + WhatsApp | `support@klusbaas.nl` / `+31 6 XXXX XXXX` | Werkdagen 09-17 | < 24 uur |
| **Support (Premium)** | E-mail + WhatsApp + Telefoon | `support@klusbaas.nl` / `+31 6 XXXX XXXX` / `+31 XX XXXX XXXX` | Werkdagen 09-17 | < 4 uur |
| **Facturatie** | E-mail | `facturatie@klusbaas.nl` | Werkdagen 09-17 | < 24 uur |
| **Privacy / AVG** | E-mail | `privacy@klusbaas.nl` | Werkdagen 09-17 | < 30 dagen (wettelijk) |
| **Compliance / Security** | E-mail | `security@klusbaas.nl` | Werkdagen 09-17 | < 24 uur |
| **Pers / Media** | E-mail | `pers@klusbaas.nl` | Werkdagen 09-17 | < 48 uur |
| **Partnerships** | E-mail | `partners@klusbaas.nl` | Werkdagen 09-17 | < 1 week |
| **Vacatures** | E-mail | `jobs@klusbaas.nl` | Werkdagen 09-17 | < 1 week |

---

## 2. Klantenservice per Pakket

### Basis (€ 595)
- **Kanalen**: E-mail only
- **Reactietijd**: 48 uur werkdagen
- **Onderhoud**: Geen (optioneel verlengen € 75/maand)

### Pro (€ 995) — *Meest populair*
- **Kanalen**: E-mail + WhatsApp
- **Reactietijd**: 24 uur werkdagen
- **Onderhoud**: 3 maanden gratis (waarde € 75), daarna € 75/maand

### Premium (€ 1.795)
- **Kanalen**: E-mail + WhatsApp + Telefoon
- **Reactietijd**: 4 uur (werkdagen 09-17)
- **Onderhoud**: 12 maanden gratis, daarna € 75/maand

---

## 3. Contactformulieren op Website

| Formulier | Locatie | Doel | Verwerking |
|-----------|---------|------|------------|
| **Wizard Offerte** | `/start/afspraak` | Offerte aanvragen | `POST /api/lead` → PDF → e-mail/WhatsApp |
| **Demo Site Contact** | `/voorbeeld/*/contact` | Algemeen contact | `POST /api/lead` → team e-mail |
| **Afspraakverzoek** | `/voorbeeld/*/afspraak` | Afspraak inplannen | `POST /api/lead` → team + Google Calendar (opt-in) |
| **Storingsmelding** | `/voorbeeld/*/storing` | Spoedstoring melden | `POST /api/lead` (type `fault`) → team + WhatsApp fallback |
| **m² Calculator** | `/voorbeeld/*/m2` | Oppervlakte prijs | `POST /api/lead` (type `surface`) → team |
| **Nieuwsbrief** | Footer, `/nieuwsbrief` | Marketing opt-in | `POST /api/newsletter` → double opt-in |

---

## 4. WhatsApp Business

- **Nummer**: `VITE_DEMO_PHONE` (configureerbaar via environment variable)
- **Gebruik**: Alle contactknoppen op demo sites en in wizard
- **Format**: `https://wa.me/<nummer>?text=<url-encoded>`
- **Fallback**: Als geen nummer geconfigureerd → knop "Dit is een demo — zo komen klanten bij jou binnen" met link naar wizard

---

## 5. Telefonie

- **Demo nummer**: `VITE_DEMO_PHONE` (alleen voor demo sites)
- **Echte klanten**: Eigen zakelijk nummer (ingevuld in wizard of via persoonlijke demo-link `?tel=`)
- **Format**: `tel:+316XXXXXXXX` (internationaal, zonder spaties)
- **Validatie**: `normalizeDutchPhone()` in `src/utils/contact.ts`

---

## 6. Fysiek Bezoek / Post

```
Klusbaas
[Straatnaam en huisnummer]
[Postcode] [Plaats]
Nederland
```

*Adres wordt ingevuld bij KVK-inschrijving (zie `bedrijfsgegevens.md`)*

---

## 7. Social Media

| Platform | Account | Doel |
|----------|---------|------|
| LinkedIn | `linkedin.com/company/klusbaas` | B2B, cases, vacatures |
| Instagram | `instagram.com/klusbaas.nl` | Portfolio, behind-the-scenes |
| YouTube | `youtube.com/@Klusbaas` | Tutorials, cases |
| TikTok | `tiktok.com/@klusbaas` | Tips, reach |

---

## 8. Noodcontact (Buiten kantooruren)

- **Alleen voor Premium klanten**: Telefoonnummer in SLA
- **Overige**: E-mail `support@klusbaas.nl` — wordt volgende werkdag opgepakt
- **Security incident**: `security@klusbaas.nl` — 24/7 monitoring via Netlify/Sentry alerts

---

## 9. Klachten & Escalatie

1. **Eerste contact**: `support@klusbaas.nl` (of jouw vaste contactpersoon)
2. **Onopgelost na 5 werkdagen**: Escalatie naar `hallo@klusbaas.nl` (CEO)
3. **Extern**: Geschillencommissie of bevoegde rechter (zie `algemene-voorwaarden.md`)

---

## 10. Niet-mailingindicator

Klusbaas respecteert de **niet-mailingindicator** uit het KVK-register. Bedrijven met deze indicator worden niet gebeld, bezocht of gemaild voor commerciële doeleinden zonder uitdrukkelijke toestemming.

---

*Contactkanalen beheerd in `bedrijf/juridisch/contact.md` — update bij wijziging kanalen of SLA's.*