# Klusbaas - Websites voor Vakmensen (Platform, Seller Sales Engine & Workspace Sync)

Klusbaas is a specialized web platform and instant website generator designed for tradespeople (timmermannen, hoveniers, schilders, loodgieters, elektriciens, stukadoors, dakdekkers) and web sellers/agencies. It features 30 trade-style presets, real-time interactive website building, trade-specific smart tools, transparent pricing tiers (€595 / €995 / €1.795 excl. btw), WhatsApp + E-mail sales lead capture, and Google Calendar & Drive synchronization.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the sales/seller strategy based on Dutch market benchmarks:
> - **Primary Sales Channels**: WhatsApp as the primary high-conversion button + short E-mail contact form (NO phone call options for sales).
> - **Transparent Pricing Tiers**: €595 (Start / One-pager), €995 (Compleet / Meest gekozen), €1.795 (Maatwerk & Marketing) + €25/mnd all-in onderhoud (all prices excl. btw).
> - **Key Differentiators**:
>   1. **100% Eigenaar van je code & domein** (No lock-in).
>   2. **Eerst zien, dan beslissen**: Live demo test-drive before paying a single euro.
>   3. **Slimme vakspecifieke onderdelen**:
>      - Spoedknop & lekkage-alarm (Loodgieter)
>      - m²-calculator & kleurenkiezer (Schilder / Stukadoor)
>      - Storingsmelding & 3-fase check (Elektricien)
>      - Dakcheck-aanvraagformulier (Dakdekker)
>      - Houtsoort & trapberekening (Timmerman)
>      - Tuinonderhoudsabonnement (Hovenier)
> - **Best Practice Placement**: Prominent seller CTA below the hero + dedicated "Klusbaas voor Verkopers & Bureau's" pricing & comparison section before the footer.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Klusbaas Platform & Sales Engine**: Pitch page for tradespeople with transparent package pricing (€595 / €995 / €1.795), market comparison, 100% ownership guarantee, and WhatsApp / E-mail lead capture.
  2. **30 Presets & Trade-Specific Smart Tools**: Interactive calculators, emergency buttons, roof checks, and color pickers for 6 trade sectors.
  3. **Customer Appointment Booking & Workspace Sync**: Clients can book appointments that sync directly with the craftsman's Google Calendar (`calendar.events`) and export PDF quote summaries to Google Drive (`drive.file`).
  4. **15-Minute Builder Wizard**: Interactive 5-step website customization wizard with live side-by-side preview.

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - *Color Palette*: Warm, tactile neutrals (`oklch(0.965 0.008 80)`) with sector-specific brand accents (Amber for Carpenters, Forest Emerald for Gardeners, Ultramarine for Painters, Deep Navy for Plumbers, Electric Gold for Electricians, Soft Limestone for Plasterers).
  - *Typography*: `DM Serif Display` (Vakwerk), `Space Grotesk` (Helder), `Archivo 900` (Signaal), `Instrument Serif` (Avond), `Bricolage Grotesque` (Puur), and `JetBrains Mono` for data/pricing.

- **Seller Sales & Pricing Section (`src/components/SellerSalesSection.tsx`)**:
  - **Differentiator Badges**: "100% Eigenaar van je code", "Eerst zien, dan beslissen", "Live binnen 10-14 dagen".
  - **3 Package Cards**:
    - **Pakket 1: Start (One-pager)** - €595 excl. btw (+ €25/mnd)
    - **Pakket 2: Compleet (Meest Gekozen)** - €995 excl. btw (+ €25/mnd)
    - **Pakket 3: Pro & Marketing** - €1.795 excl. btw (+ €25/mnd)
  - **WhatsApp & E-mail Sales Modal**: Allows craftsmen to send their preferred trade & style choice directly to Klusbaas sales via WhatsApp or E-mail.

- **Trade-Specific Smart Tools Integration**:
  - **Loodgieter**: 24/7 Spoedknop + Lekkagedetectie formulier.
  - **Schilder / Stukadoor**: m²-oppervlakte calculator + Kleurenkiezer.
  - **Elektricien**: 3-fase & groepenkast check + Storingsmelding.
  - **Timmerman / Hovenier**: Inmeetverzoek & Tuinonderhoudsabonnement.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: WhatsApp Primary + E-mail Form (No Sales Phone Calls)**
  - *Approach*: Provide a prominent WhatsApp button (`https://wa.me/316...`) pre-filled with the craftsman's selected trade and package, alongside a clean E-mail contact modal. Exclude phone call links for sales.
  - *Why*: Directly aligns with user feedback—Dutch tradespeople communicate constantly via WhatsApp throughout the workday.
- **Decision 2: Transparent Pricing Comparison Grid**
  - *Approach*: Explicitly display €595 / €995 / €1.795 prices marked "excl. btw" with "Jij bent 100% eigenaar van je code & domein" guarantees.
  - *Why*: Positions Klusbaas competitively against traditional agencies while building trust with independent tradespeople.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Klusbaas Web Platform                           │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Enhanced Landing │  │  Craftsman Site  │  │  Seller Sales Engine │  │
│  │ (30 Style Grid)  │  │(5 Style Layouts) │  │(Packages €595/€995)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│           │                     │                       │              │
│           └─────────────────────┼───────────────────────┘              │
│                                 ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Active Site Data Engine                     │  │
│  │   (SECTORS data, STYLES definitions, oklch Palette Generator)    │  │
│  └───────┬──────────────────────┬────────────────────────┬──────────┘  │
│          │                      │                        │             │
│          ▼                      ▼                        ▼             │
│  ┌──────────────┐      ┌────────────────┐      ┌──────────────────┐    │
│  │ Smart Tools  │      │ WhatsApp &     │      │ Google Workspace │    │
│  │ (m², Spoed)  │      │ E-mail Sales   │      │ Calendar & Drive │    │
│  └──────────────┘      └────────────────┘      └──────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Data Models**:
  - `SalesPackage`: Name, price, monthlyFee, target, features, highlights.
  - `TradeSmartTool`: Tool type (`'spoed'` | `'m2'` | `'3fase'` | `'inmeten'`), label, action.
- **Google Workspace API Calls**:
  - `POST https://www.googleapis.com/calendar/v3/calendars/primary/events` (creates synced calendar event).
  - `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` (uploads quote PDF).
