/**
 * Editable copy for the landing page hero / banner area.
 *
 * Touch this file (not the JSX) when you just want to tweak words —
 * the strings here are pulled into `src/routes/index.tsx` directly.
 *
 * Notes:
 * - `heroHeadline.lead` is the part of the headline that gets the
 *   gold gradient (currently "This"). The rest of the headline is
 *   `heroHeadline.tail` and renders in white.
 * - `bannerWordmark.lead` is the part of "LaunchFly" that gets the
 *   gold-fade gradient. `tail` renders in near-white.
 * - For the subhead, `bannerSubhead.lead` is plain white, `accent`
 *   is the word that gets the gold gradient (e.g. "founder?").
 */

export const landingContent = {
  banner: {
    eyebrow: "How to start your own business",
    subhead: {
      lead: "Want to be a",
      accent: "founder?",
    },
    tagline: "Start your own business?",
    wordmark: {
      lead: "Launch",
      tail: "Fly",
    },
  },
  hero: {
    headline: {
      lead: "This",
      tail: " is How to Start.",
    },
    subhead:
      "LaunchFly helps you go from \"I want to start something\" to knowing exactly what to build, how to start, and what to do next.",
    primaryCta: "Start Your Launch — $19/month",
    secondaryCta: "See How It Works",
  },
};

export type LandingContent = typeof landingContent;
