# src/components/extras — Optionele Demo Site Componenten

Extra componenten die in demo sites kunnen worden ingeschakeld via de wizard (stap "Diensten"). Ze zijn niet standaard onderdeel van de core site maar verrijken de demo.

## Componenten

| Bestand | Beschrijving |
|---------|--------------|
| `TrustBar.tsx` | Vertrouwindicators (keurmerken, reviews, certificeringen) |
| `TestimonialCard.tsx` | Klantgetuigenissen met foto/naam/rol |
| `TeamMemberCard.tsx` | Teamlid profiel met foto, naam, functie |
| `ProjectStats.tsx` | Cijfermatige stats (projecten, klanten, jaar ervaring) |
| `ServiceAreaChips.tsx` | Dienstgebieden als filterbare chips |
| `OpeningHoursCard.tsx` | Openingstijden met vandaag highlight |
| `AvailabilityCard.tsx` | Beschikbaarheid indicator (nu open/gesloten, spoed) |
| `GuaranteeList.tsx` | Garanties/waarborgen lijst met iconen |
| `PromotionBanner.tsx` | Actie/promotie banner met countdown optie |
| `ContactCtaBanner.tsx` | Call-to-action banner voor contact/offertes |

## Index

`index.ts` exporteert alle componenten en een `ExtraComponentRegistry` voor dynamische rendering in `SiteView`.

## Styling

- Volgen dezelfde palette token regels als core componenten
- Gebruiken `site.accent`, `site.onAccent`, `site.card`, `site.radiusLg`, `site.fontHeading`, `site.fontBody`
- Responsive en accessible (focus states, contrast)

## Toevoegen nieuwe extra component

1. Maak `.tsx` in deze map
2. Exporteer in `index.ts`
3. Voeg toe aan `ExtraComponentRegistry` met unieke `id`
4. Update wizard stap "Diensten" in `WizardView.tsx` om de nieuwe optie te tonen
5. Schrijf test in `extras.test.tsx`