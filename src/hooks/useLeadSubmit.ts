import { useCallback, useEffect, useRef, useState } from 'react';
import { postLead, type LeadSubmitSuccess } from '../utils/leadClient';

export type LeadStatus = 'idle' | 'sending' | 'success' | 'error';

/**
 * Shared state for every lead form: submits to `/api/lead` with the spam
 * fields (`startedAt` for the time check, `website` honeypot) and exposes
 * the real status so the UI can show versturen…, gelukt or a fout.
 */
export function useLeadSubmit() {
  const [status, setStatus] = useState<LeadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadSubmitSuccess | null>(null);
  // Set after mount, never during render, so prerendered HTML stays stable.
  const startedAt = useRef(0);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = useCallback(async (payload: Record<string, unknown>) => {
    setStatus('sending');
    setError(null);
    const outcome = await postLead({
      ...payload,
      startedAt: startedAt.current,
      website: honeypotRef.current?.value ?? '',
    });
    if (outcome.ok) {
      setResult(outcome);
      setStatus('success');
    } else {
      setError(outcome.error);
      setStatus('error');
    }
    return outcome;
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, submit, reset, honeypotRef, sending: status === 'sending' };
}
