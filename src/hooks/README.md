# src/hooks — Custom React Hooks

Herbruikbare stateful logica voor routing, media queries, formulieren, en navigatie.

## Hooks

| Hook | Doel |
|------|------|
| `useRouter.ts` | Wrapper om `react-router` navigatie type-safe te maken; voorziet `navigate`, `useParams`, `useSearchParams` |
| `useRouteMeta.ts` | Haalt route metadata op (titel, beschrijving, OG image) voor SEO |
| `useMediaQuery.ts` | SSR-safe media query hook (hydration-safe: start met `false`, corrigeert in effect) |
| `useLeadForm.ts` | Volledige lead formulier state: validatie, honeypot, submit, error handling, loading state |

## Gebruik

```tsx
// Routing
const { navigate, params } = useRouter();
navigate(`/voorbeeld/${params.sector}/${params.stijl}`);

// Media query (SSR safe)
const isMobile = useMediaQuery('(max-width: 639px)');

// Lead formulier
const { register, handleSubmit, errors, isSubmitting } = useLeadForm({
  onSuccess: (lead) => track('lead_submitted', { sector: lead.sector }),
});
```

## Conventies

- Hooks zijn **pure** en testbaar zonder React context
- SSR-compatibel: geen `window`/`document` access tijdens eerste render
- Typescript types in `src/types.ts` of inline
- Tests in `src/utils/` (bijv. `router.test.ts` voor router logica)