# Verwerkersovereenkomst (DPA) — Sjabloon

**Versie**: 1.0
**Datum**: 2026
**Status**: Sjabloon — invullen per leverancier

---

## 1. Partijen

| Rol | Naam | Adres | Contactpersoon | E-mail |
|-----|------|-------|----------------|--------|
| **Verantwoordelijke** | Klusbaas | [Volledig adres] | [Naam CEO] | `privacy@klusbaas.nl` |
| **Verwerker** | [Leverancier naam] | [Volledig adres leverancier] | [Naam contact] | [E-mail leverancier] |

---

## 2. Verwerkingsactiviteiten

| Activiteit | Categorieën Betrokkenen | Categorieën Persoonsgegevens | Doel | Duur |
|------------|------------------------|------------------------------|------|------|
| [Bijv. Hosting website] | Website bezoekers | IP, user agent, cookies | Website beschikbaarheid | Contractduur + 30 dagen |
| [Bijv. E-mail verzending] | Klanten, leads | Naam, e-mail, offerte data | Transactionele mail | Contractduur + 7 jaar (factuur) |
| [Bijv. Authenticatie] | Klanten (opt-in) | Google account info, tokens | Google Calendar/Drive sync | Contractduur + sessie |

---

## 3. Verplichtingen Verwerker

De Verwerker garandeert en waarborgt:

### 3.1 Alleen op Instructies
- Verwerkt persoonsgegevens **enkel** op gedocumenteerde instructies van de Verantwoordelijke.
- Informeert de Verantwoordelijke als een instructie strijdt met AVG of andere wetgeving.

### 3.2 Vertrouwelijkheid
- Stelt verplichting tot vertrouwelijkheid op voor alle personen met toegang tot de data.
- Zorgt dat medewerkers op de hoogte zijn van hun verplichtingen.

### 3.3 Beveiligingsmaatregelen (Art. 32 AVG)
De Verwerker implementeert passende technische en organisatorische maatregelen:

| Maatregel | Implementatie |
|-----------|---------------|
| **Pseudonimisering/Versleuteling** | TLS 1.3 in transit, AES-256 at rest |
| **Vertrouwelijkheid, Integriteit, Beschikbaarheid** | [Beschrijving per leverancier] |
| **Herstel na incident** | Back-ups, disaster recovery plan, RTO/RPO |
| **Periodieke Testen** | Jaarlijkse pen test, vulnerability scans |

### 3.4 Sub-verwerkers
- Geen sub-verwerkers zonder **voorafgaande schriftelijke toestemming** van Verantwoordelijke.
- Actuele lijst sub-verwerkers: [Bijlage A]
- Sub-verwerkers zijn gebonden aan gelijke verplichtingen.

### 3.5 Rechten Betrokkenen
De Verwerker ondersteunt de Verantwoordelijke bij:
- Inzageverzoeken (Art. 15)
- Rectificatie (Art. 16)
- Verwijdering (Art. 17)
- Beperking (Art. 18)
- Draagbaarheid (Art. 20)
- Bezwaar (Art. 21)

**Reactietijd**: Binnen 5 werkdagen na verzoek Verantwoordelijke.

### 3.6 Datalekken (Art. 33/34 AVG)
- Melding aan Verantwoordelijke **binnen 24 uur** na ontdekking.
- Informatie: aard, omvang, categorieën, mogelijke gevolgen, maatregelen.
- Verwerker coöperaat bij melding aan AP en betrokkenen.

### 3.7 Audits & Controles
- Verantwoordelijke mag audits uitvoeren (of derde partij).
- Verwerker levert jaarlijks certificaattest (ISO 27001, SOC 2) of voltooid vragenlijst.
- Verwerker stemt toe aan on-site inspectie bij redelijke kennisgeving.

### 3.8 Internationale Overdracht
- Geen overdracht buiten EER zonder toestemming Verantwoordelijke.
- Bij overdracht: SCC, BCR, of adequaatheidsbesluit.
- Actuele overdrachten: [Bijlage B]

### 3.9 Teruggave & Vernietiging (Art. 28.3.g)
Na beëindiging:
- Alle persoonsgegevens verwijderen of retourneren (keuze Verantwoordelijke).
- Bestaande kopieën vernietigen tenzij wettelijke bewaartermijn.
- Schriftelijke bevestiging van vernietiging.

---

## 4. Verplichtingen Verantwoordelijke

- Zorgt voor wettige grondslag voor verwerking.
- Biedt accurate, actuele persoonsgegevens aan.
- Informeert betrokkenen via privacyverklaring.
- Coördineert AVG-rechten verzoeken.

---

## 5. Looptijd & Beëindiging

| Voorwaarde | Details |
|------------|---------|
| **Ingangsdatum** | [Datum] |
| **Duur** | Zolang dienstverlening loopt / [vaste termijn] |
| **Beëindiging** | Opgezegd = directe beëindiging DPA |
| **Effect beëindiging** | Art. 3.9 van toepassing |

---

## 6. Aansprakelijkheid & Schadevergoeding

- Verwerker aansprakelijk voor schade door schending DPA/AVG.
- Verantwoordelijke aansprakelijk voor instructies die strijden met wet.
- Geen beperking aansprakelijkheid voor opzet/bewuste roekeloosheid.

---

## 7. Toepasselijk Recht & Geschillen

- Nederlands recht.
- Bevoegde rechter: [Plaats vestiging Verantwoordelijke].
- Geschillenbeslechting: onderhandeling → bemiddeling → rechter.

---

## 8. Ondertekening

**Verantwoordelijke (Klusbaas)**

__________________________
Naam: [Naam CEO]
Functie: CEO
Datum: [Datum]
Handtekening: __________________________

**Verwerker ([Leverancier naam])**

__________________________
Naam: [Naam gemachtigde]
Functie: [Functie]
Datum: [Datum]
Handtekening: __________________________

---

## Bijlage A: Sub-verwerkers (Voorbeeld)

| Sub-verwerker | Dienst | Locatie | Beveiliging |
|---------------|--------|---------|-------------|
| AWS | Cloud infrastructure (via Netlify) | EU (Frankfurt) | ISO 27001, SOC 2 |
| Cloudflare | CDN, DDoS protection | Wereldwijd (EU edge) | ISO 27001 |
| Google Cloud | Firebase Auth (optioneel) | EU (opt-in) | ISO 27001, SOC 2/3 |

---

## Bijlage B: Internationale Overdrachten

| Leverancier | Land | Mechanism | Status |
|-------------|------|-----------|--------|
| Unsplash | VS | SCC | Actief |
| [Andere] | [Land] | [Mechanisme] | [Status] |

---

*DPA Sjabloon beheerd in `bedrijf/compliance/templates/dpa.md` — aanpassen per leverancier, juridische review verplicht.*