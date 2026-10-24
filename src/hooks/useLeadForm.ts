import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '../utils/analytics';
import { submitLead, type LeadResponse } from '../utils/leadClient';

export type LeadFormStatus = 'idle' | 'sending' | 'success' | 'error';

/**
 * Shared submit state for every form that posts to `/api/lead`: status,
 * honeypot value and the render timestamp the server uses as a bot check.
 * `startedAt` is set in an effect so prerendered markup stays stable.
 */
export function useLeadForm(source: string) {
  const startedAt = useRef(0);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<LeadFormStatus>('idle');
  const [result, setResult] = useState<LeadResponse | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = useCallback(
    async (payload: Record<string, unknown>) => {
      setStatus('sending');
      track('lead_submit', { source });
      const response = await submitLead({
        ...payload,
        startedAt: startedAt.current || Date.now() - 60_000,
        website: honeypot,
      });
      setResult(response);
      setStatus(response.ok ? 'success' : 'error');
      track(response.ok ? 'lead_success' : 'lead_error', { source, status: response.status });
      return response;
    },
    [honeypot, source]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
  }, []);

  return { status, result, submit, reset, honeypot, setHoneypot };
}
