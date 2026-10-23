# Klusbaas - Websites voor Vakmensen (Enhanced Platform, Booking & Workspace Sync)

Klusbaas is a specialized web platform and instant website generator tailored for tradespeople (craftsmen) in the Netherlands—including Carpenters, Gardeners, Painters, Plumbers, Electricians, and Plasterers. It enables craftsmen to generate and launch a high-converting website in 15 minutes with 30 curated design style presets, a live price calculator, postal code service area validator, customer appointment booking synced with Google Calendar, and PDF quote exports saved to Google Drive.

## User Review & Critical Decisions

> [!IMPORTANT]
> The plan is updated to incorporate an interactive customer appointment booking calendar with Google Calendar sync, PDF quote export to Google Drive, and a hero landing page with live style comparison, ROI metrics, before/after showcases, and FAQ accordion.

- **Confirmed Decision 1 (Customer Appointment Booking & Calendar Sync)**: Customers can pick a service, select an available date and time slot, enter their contact info, and book a consultation directly on the craftsman's site. Appointments sync seamlessly to Google Calendar (`calendar.events`).
- **Confirmed Decision 2 (Google Drive Quote Sync & PDF Export)**: When a price estimate or appointment booking is completed, a formatted PDF summary is generated and saved directly to Google Drive (`drive.file`).
- **Confirmed Decision 3 (Enhanced Landing Page Experience)**:
  - High-impact hero with live trade stats banner (1.200+ vakmensen, 4.9★, 15 min. setup)
  - Interactive Style Comparison Carousel for all 30 trade-style presets
  - Before & After Project Comparison slider
  - Craftsman FAQ accordion answering questions regarding KvK, custom .nl domain, and WhatsApp notifications

---

## 1. Overview & Core Concept

- **What It Does**: Klusbaas offers a complete ecosystem:
  1. **Enhanced Landing Page**: High-converting showcase with live stats, style comparison slider, before/after project sliders, and FAQ.
  2. **Craftsman Website (30 Style Combinations)**: Live craftsman sites featuring 5 design personalities (Vakwerk, Helder, Signaal, Avond, Puur) with integrated appointment booking, price calculator, and postcode area checker.
  3. **15-Minute Builder Wizard**: Interactive 5-step website creator with real-time side-by-side preview and one-click publishing.
- **Target Audience**: Dutch tradespeople (timmermannen, hoveniers, schilders, loodgieters, elektriciens, stukadoors) and homeowners.

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - *Color Palette*: Warm, tactile neutrals (`oklch(0.965 0.008 80)`) with sector-specific brand accents (Amber for Carpenters, Forest Emerald for Gardeners, Ultramarine for Painters, Deep Navy for Plumbers, Electric Gold for Electricians, Soft Limestone for Plasterers).
  - *Typography*: `DM Serif Display` (Vakwerk), `Space Grotesk` (Helder), `Archivo 900` (Signaal), `Instrument Serif` (Avond), `Bricolage Grotesque` (Puur), and `JetBrains Mono` for data/pricing.
- **Landing Page Enhancements**:
  - **Live Stats Banner**: Highlights "1.280+ actieve vakmensen", "4,9/5 gemiddelde reviewscore", "15 minuten van start tot live".
  - **30 Style Preset Tester**: Interactive switcher to preview all 6 trades across all 5 design layouts in real time.
  - **Before & After Project Slider**: Interactive slider comparing raw renovation sites with finished craftsman results.
  - **FAQ Accordion**: Expandable answers addressing domain ownership, pricing, and WhatsApp quote notifications.

- **Interactive Customer Booking Module (`BookingCalendar`)**:
  - Calendar picker for dates + morning / afternoon / evening time slots.
  - Client detail form (Name, Phone, Address, Project Notes).
  - Syncs to Google Calendar via `calendar.events` API.
  - Generates downloadable PDF quote & booking summary with option to save to Google Drive.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Google Calendar Integration via Client OAuth Bearer Tokens**
  - *Approach*: Authenticate using `firebase/auth` popup (`signInWithPopup`), obtain OAuth access token in memory, and post directly to `https://www.googleapis.com/calendar/v3/calendars/primary/events`.
  - *Why*: Provides instant real-time booking confirmation into the craftsman's primary Google Calendar with zero server-side redirect bottlenecks.
- **Decision 2: Client-Side PDF Generation & Google Drive Export**
  - *Approach*: Format the quote summary and booking confirmation into a printable canvas/document, generating a Blob URL for download and uploading to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.
  - *Why*: Ensures instant downloads even without network connectivity, while archiving quotes in Google Drive when authenticated.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Klusbaas Web Platform                           │
├────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Enhanced Landing │  │  Craftsman Site  │  │   Builder Wizard     │  │
│  │ (Stats, FAQ, B&A)│  │(5 Style Layouts) │  │  (Live Side-Preview) │  │
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
│  │   Price      │      │   Customer     │      │ Google Workspace │    │
│  │ Calculator   │      │ Booking Calendar│     │ Calendar & Drive │    │
│  └──────────────┘      └────────────────┘      └──────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Data Models**:
  - `SectorData`: Sector metadata, Unsplash photos, pricing quiz questions, services, reviews, FAQ.
  - `ActiveSiteData`: Computed site configuration, oklch colors, fonts, customized business details.
  - `BookingSlot`: Date string, time slot (`'ochtend'` | `'middag'` | `'avond'`), customer contact info, booking status.
- **Google Workspace API Calls**:
  - `POST https://www.googleapis.com/calendar/v3/calendars/primary/events` (creates synced calendar event).
  - `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` (uploads quote PDF).
