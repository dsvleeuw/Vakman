import { redirectForTest, sendViaResend, type FetchLike } from './mailer';

/**
 * The mailer for the customer account: the reset link and the confirmation
 * of the e-mail address.
 *
 * Without an API key nothing is sent: the mail is only written to the log
 * (preview mode), exactly like the quotes and the requests.
 */

export interface AccountMailEnv {
  RESEND_API_KEY?: string;
  QUOTE_FROM_EMAIL?: string;
  MAIL_TEST_RECIPIENT?: string;
}

export interface AccountMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const DEFAULT_FROM = 'Klusbaas <onboarding@resend.dev>';

/**
 * A function that sends a mail and says what happened: `sent`, `preview`,
 * `failed` or `geen mailer`.
 */
export function createAccountMailer(
  env: AccountMailEnv,
  log: (message: string) => void = () => {},
  fetchImpl?: FetchLike
): (mail: AccountMail) => Promise<string> {
  const from = env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM;
  return async (mail) => {
    if (!env.RESEND_API_KEY) {
      log(`[account] PREVIEW mail: ${mail.subject}`);
      return 'preview';
    }
    const result = await sendViaResend(
      env.RESEND_API_KEY,
      redirectForTest(
        { from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html },
        env.MAIL_TEST_RECIPIENT
      ),
      fetchImpl
    );
    if (result.status === 'failed') {
      log(`[account] mail mislukt: ${result.detail ?? 'onbekende fout'}`);
    }
    return result.status;
  };
}
