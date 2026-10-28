# VISION.md — what Klusbaas is, and what it refuses to become

The accept/resist policy for this repo. Every principle below cites merged
pull requests, not opinions: if the history cannot support a principle, it
does not belong here. Read this before you build; use it to decide whether a
change is a fit or a drift.

Evidence base: 30 pull requests (27 merged), the merge history on GitHub, and
the independent study in `docs/kun-repo-study.md` (PR #29).

---

## 1. The craftsman writes, we do not write for him

**Evidence:** PR #30 shipped a customer editor where the craftsman fills in
his own copy, deliberately without AI; PR #9 shipped a lead list of 229 real
companies as the thing that carries the business.

- **Accept** a feature when the craftsman keeps the last word over his own
  text, his blocks and his order.
- **Resist** any feature that generates a craftsman's copy, reviews, photos
  or offers for him. No "AI writes your page", no synthetic portfolio, no
  invented testimonials — not as a demo, not behind a toggle.

## 2. Nothing on a public page may be untrue

**Evidence:** PR #8 stopped demo sites from dialling strangers' numbers and
added personal demo links; PR #30 removed the hardcoded `KvK 12345678` and
made a customer site hide its call buttons when the owner entered no number
of their own.

- **Accept** a number, a KvK number, a review or a photo only when the owner
  supplied it. Unknown stays unknown.
- **Resist** placeholders that look like facts: sample phone numbers, fake
  KvK numbers, stock reviews presented as the craftsman's own, "30+ reviews"
  nobody can verify.

## 3. Accessibility is a floor, not a feature

**Evidence:** PR #17 fixed WCAG AA contrast in every style; PR #19 fixed form
labels, focus traps and HeroStrip links; PR #6 and PR #3 were dedicated
mobile/iOS passes.

- **Accept** a new component only when its label is tied to its field
  (`htmlFor` + `id`), its focus is visible, its contrast passes and it works
  with one thumb on a 360 px screen.
- **Resist** shipping a component that only "looks right" on a 1440 px
  desktop screenshot.

## 4. A request may never disappear quietly

**Evidence:** PR #16 removed silent loss of fast quote requests, added a
timeout and kept PII out of the logs; PR #10 built the lead API and quote
builder with real delivery states.

- **Accept** a flow only when it has a visible failure path: an error the
  visitor sees, a fallback that still works, and a server-side record.
- **Resist** "the WhatsApp link is enough" as the only path when the person
  is standing in front of a broken form.

## 5. Consent and legal come before growth

**Evidence:** PR #12 shipped the privacy statement and a double opt-in
newsletter; PR #23 and PR #24 added the missing legal templates.

- **Accept** a newsletter, tracking or a lead list only with a written
  statement, a confirmation step and a way out.
- **Resist** pre-checked boxes, silent mailing lists, and "we'll add the
  privacy page later".

## 6. The craftsman's site belongs to the craftsman

**Evidence:** PR #30 made a customer's site public at `/site/<slug>` with a
private management link, and made the site render on the server so search
engines and link previews show it.

- **Accept** a feature when the customer can reach, share and keep their own
  site without our permission.
- **Resist** anything that makes a customer dependent on a state only our
  browser holds, and anything that puts our brand on their page without
  value for them.

## 7. No backend where a link does the job, and no dependencies without a
   reason

**Evidence:** PR #1 built the product around WhatsApp and telephone deep
links with no application backend; PR #10 added a real API only where
persistence and documents demanded it; PR #26–#28 kept the GitHub
visualizer a separate vanilla-JS project so it never touched the app's
stack.

- **Accept** a dependency when it removes real work (rendering, auth,
  storage) and its cost is written down.
- **Resist** adding a database, a framework or a package because it is
  "standard", and resist moving a side project into the app's build.

## 8. Audits come from the code

**Evidence:** PR #15 and PR #25 produced audits by reading the source; PR #29
commissioned an outside perspective instead of trusting our own reading.

- **Accept** a claim in the docs only when a command measured it.
- **Resist** documentation that asserts what the code does not do — the FAQ
  once promised a dashboard that did not exist, and the ROADMAP promised a
  customer backend that was still a localStorage draft.

## 9. One phase, one PR, green

**Evidence:** PR #14 wrote the parallel-check and merge rules down for
agents; every merged PR since then is a single coherent phase with
`bun run check` green.

- **Accept** a pull request that does one thing, has a conventional commit
  subject, and passes lint, tests, inventory and build.
- **Resist** merging with a failing check, and resist folding two phases
  into one pull request to save a round trip.

## 10. Dutch, plain words, written for a tradesman

**Evidence:** PR #3, PR #6 and PR #9 are all about the visitor's screen and
the Dutch copy; PR #26–#28 built a separate tool in Dutch and vanilla JS
because that is what suited it.

- **Accept** a screen when a timmerman reads it once and knows what to do.
- **Resist** jargon, English-only interfaces, and marketing sentences that
  hide what the product actually does.

---

## Stress test: eight changes that look tempting

Each hypothetical is stated in the strongest form for building it, with the
counter-argument answered. Where the answer is "no", the principle is
named so the decision can be revisited on evidence instead of on taste.

**1. "Add an AI that writes the craftsman's site for him."**
For: it is the obvious differentiator, the demo becomes impressive in one
click, and the leads convert better.
Against: principle 1. The craftsman's own words are the product; generated
copy is a promise he did not make, and it puts hallucinated claims (reviews,
prices, "since 1998") on a public page. The editor's preset-and-fallback
flow gets a real site on the table in ten minutes without a single lie.
**Verdict: refuse.** The moment the customer can review and edit every
sentence, generated text becomes an assistant, not an author.

**2. "We need a real database, our own auth, a CMS and a designer."**
For: the token link is fragile, one customer may want five sites, and
professionals expect a login.
Against: principle 7, and principle 6. A published site and a management
link already give the craftsman his own address; a login adds accounts to
support without changing what he can do. The stack stays small so the
product keeps building in a quarter of a day at a time.
**Verdict: refuse for now; allow accounts when they remove a real limit.**
Accounts are the next step precisely because a token link is a promise
nobody can keep — see the account work in the roadmap, not a CMS.

**3. "Put a demo phone number on the page so it always looks complete."**
For: an empty phone field looks broken and costs conversions.
Against: principle 2. The number may belong to a stranger; a public page
that dials a stranger is a real harm, not a design detail. The buttons
disappear instead, and the editor says why.
**Verdict: refuse.** Unknown stays unknown.

**4. "Ship the new editor without the label/focus work; we can fix it in a
sprint."**
For: the deadline is next week and the visual part is done.
Against: principle 3, and PR #19 exactly. Half-accessible forms are worse
than no forms: a keyboard user can fill the field but not tell what it is.
**Verdict: refuse.** Accessibility is part of "done", not a sprint.

**5. "Add a newsletter popup and a Meta pixel to lift the demo conversion."**
For: the demo traffic is the funnel and the numbers are the sales case.
Against: principle 5. Tracking needs a statement and consent; a popup on the
demo is not a signup for the demo.
**Verdict: refuse** without a written statement and a real opt-in.

**6. "Skip the tests for the publish flow, the unit tests already cover the
content model."**
For: the flow is thin, and the tests cost a day.
Against: principle 9 and principle 4. The publish flow is exactly where a
silent failure hides: a site that is not public but says it is.
**Verdict: refuse.** The tests are the floor of the promise "your site is
live".

**7. "Add a fifth style to every trade — the design system makes it cheap."**
For: styles are the product's variety; five looks thin; the palette code is
already there.
Against: principle 10 and principle 9. A style is a promise about how the
craftsman looks, and each one costs contrast checks, screenshots, a font and
a review of 35 pages.
**Verdict: refuse now**; a new style needs its own review of all trades,
not a generator.

**8. "Publish the site only for paying customers, so the free tier does not
cost us hosting."**
For: hosting and mail are real costs; the free tier is the funnel.
Against: principle 6 and principle 8. The published site is the proof that
the product works, and it is how a craftsman convinces his next customer.
**Verdict: refuse.** The funnel is not "the customer gets nothing"; it is
"the customer gets a site he can show".

---

## How to use this file

- Before you build: find the principle. If none applies, you are probably
  adding a feature the product does not need.
- When you refuse: say which principle refused it, in the pull request.
- When you change your mind: change this file first, with the pull request
  that shows the evidence. Principles are not carved in stone — they are
  carved in pull requests.
