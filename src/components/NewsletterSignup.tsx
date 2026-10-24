import React, { useId, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { track } from '../utils/analytics';
import { subscribeNewsletter } from '../utils/newsletterClient';
import { NEWSLETTER_CONSENT_TEXT } from '../utils/newsletterStatus';
import { PrivacyNote } from './PrivacyNote';

interface NewsletterSignupProps {
  source: 'footer' | 'nieuwsbrief';
  /** `dark` sits on the stone-900 footer, `light` on a stone page. */
  tone?: 'dark' | 'light';
}

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string };

/**
 * E-mail field for the newsletter. Step one of the double opt-in: the server
 * stores the address as `pending` and mails a confirmation link.
 */
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ source, tone = 'light' }) => {
  const id = useId();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const dark = tone === 'dark';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state.kind === 'sending') return;
    setState({ kind: 'sending' });
    const result = await subscribeNewsletter({ email, source, website });
    if (result.ok) {
      track('newsletter_signup', { source });
      setState({ kind: 'done', message: result.message ?? 'Check je inbox om je aanmelding te bevestigen.' });
    } else {
      track('newsletter_error', { source, status: result.status });
      setState({ kind: 'error', message: result.error ?? 'Aanmelden is niet gelukt.' });
    }
  };

  if (state.kind === 'done') {
    return (
      <div
        role="status"
        className={`flex gap-3 items-start rounded-2xl p-4 ${dark ? 'bg-stone-800 text-stone-100' : 'bg-white border border-stone-200 text-stone-900'}`}
      >
        <span className="w-8 h-8 shrink-0 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center">
          <Check className="w-4 h-4" aria-hidden="true" />
        </span>
        <p className="m-0 text-sm leading-relaxed">{state.message}</p>
      </div>
    );
  }

  const muted = dark ? 'text-stone-400' : 'text-stone-500';
  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor={`${id}-email`} className={`text-sm font-bold ${dark ? 'text-stone-100' : 'text-stone-900'}`}>
        Je e-mailadres
      </label>
      <div className="flex flex-col min-[420px]:flex-row gap-2">
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state.kind === 'error') setState({ kind: 'idle' });
          }}
          aria-invalid={state.kind === 'error'}
          aria-describedby={`${id}-consent${state.kind === 'error' ? ` ${id}-error` : ''}`}
          placeholder="naam@bedrijf.nl"
          className={`h-12 flex-1 min-w-0 rounded-full px-5 text-base outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            dark
              ? 'bg-stone-800 border border-stone-700 text-white placeholder:text-stone-500'
              : 'bg-white border border-stone-300 text-stone-900 placeholder:text-stone-400'
          }`}
        />
        {/* Honeypot: hidden from people, bots fill it in. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="absolute -left-[9999px] w-px h-px opacity-0"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={state.kind === 'sending'}
          className="h-12 px-6 rounded-full border-0 bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-sm cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {state.kind === 'sending' && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Aanmelden
        </button>
      </div>
      {state.kind === 'error' && (
        <p id={`${id}-error`} role="alert" className={`m-0 text-sm font-semibold ${dark ? 'text-amber-300' : 'text-red-700'}`}>
          {state.message}
        </p>
      )}
      <p id={`${id}-consent`} className={`m-0 text-xs leading-relaxed ${muted}`}>
        {NEWSLETTER_CONSENT_TEXT} Je krijgt eerst een mail om je aanmelding te bevestigen.
      </p>
      <PrivacyNote className={muted} />
    </form>
  );
};
