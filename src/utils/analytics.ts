/**
 * Funnel measurement.
 *
 * The app ships no analytics vendor: `track()` forwards events to whatever the
 * page provides (`window.dataLayer` for GTM, `window.gtag` for GA4) and does
 * nothing when neither is present. That keeps the prototype privacy-friendly
 * while making the funnel measurable the moment a tag manager is added:
 *
 *   <script>
 *     window.dataLayer = window.dataLayer || [];
 *     window.dataLayer.push({ event: '…' })  // picked up automatically
 *   </script>
 *
 * Events follow the `snake_case` GA4 convention so they can be mapped 1:1.
 */

export type AnalyticsEventName =
  | 'page_view'
  | 'wizard_step_view'
  | 'wizard_step_complete'
  | 'wizard_validation_error'
  | 'preset_open'
  | 'plan_select'
  | 'whatsapp_click'
  | 'phone_click'
  | 'appointment_requested'
  | 'component_view'
  | 'lead_submit'
  | 'lead_success'
  | 'lead_error'
  | 'newsletter_signup'
  | 'newsletter_error'
  | 'offer_requested'
  | 'offer_request_error'
  | 'site_content_changed';

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

interface AnalyticsWindow {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
}

export function track(event: AnalyticsEventName, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;

  const target = window as unknown as AnalyticsWindow;
  const payload: Record<string, unknown> = { event, ...props };

  if (Array.isArray(target.dataLayer)) {
    target.dataLayer.push(payload);
  }
  if (typeof target.gtag === 'function') {
    target.gtag('event', event, props);
  }
  if (import.meta.env?.DEV) {
    // Helps while building the funnel: shows exactly what a tag manager gets.
    console.debug('[analytics]', event, props);
  }
}
