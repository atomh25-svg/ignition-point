import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Show, SignInButton, useAuth } from "@clerk/tanstack-react-start";
import { Navbar } from "@/components/launchfly/Navbar";
import { CheckCircle2, ArrowRight, Rocket, Loader2 } from "lucide-react";
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "@/lib/stripe-checkout";
import { requireActiveSubscription } from "@/lib/require-subscription";
import { trackTikTokEvent } from "@/lib/tiktok-events";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "The Commitment — LaunchFly.io" },
      { name: "description", content: "LaunchFly Membership — $19/month. Commit and begin your build journey." },
      { property: "og:title", content: "Commit & Begin — LaunchFly.io" },
      { property: "og:description", content: "Paying is part of the ritual. Become someone who builds." },
    ],
  }),
  component: Pricing,
});

const includes = [
  "Founder DNA diagnosis",
  "Personalized AI business ideas",
  "Launch Blueprint",
  "30-day build journey",
  "MVP prompts",
  "Outreach scripts",
  "AI founder coach",
  "Progress dashboard",
];

function Pricing() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Did this user already subscribe? If yes, the CTA flips to "Manage
  // subscription" → opens Stripe Customer Portal instead of trying to
  // create a duplicate Checkout Session (which Stripe would happily
  // process and create a second active subscription).
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  // Tracks "the user clicked Sign in to commit" so that the moment
  // Clerk reports them signed in, we auto-forward to Stripe Checkout
  // — saving the second click. Persisted in sessionStorage so OAuth
  // round-trips (Google sign-in) don't lose the intent across the
  // full-page redirect back to /pricing.
  const [autoForwardArmed, setAutoForwardArmed] = useState(false);
  const armAutoForward = () => {
    setAutoForwardArmed(true);
    try {
      sessionStorage.setItem("launchfly:checkoutIntent", "1");
    } catch {
      /* private mode */
    }
  };
  useEffect(() => {
    try {
      if (sessionStorage.getItem("launchfly:checkoutIntent") === "1") {
        setAutoForwardArmed(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  // TikTok funnel signal: pricing page view = mid-funnel ViewContent
  // on the actual SKU.
  useEffect(() => {
    trackTikTokEvent("ViewContent", {
      content_name: "LaunchFly Membership Pricing",
      content_type: "product",
      content_id: "launchfly-membership",
      value: 19,
      currency: "USD",
    });
  }, []);

  useEffect(() => {
    if (!authLoaded || !isSignedIn) {
      setStatusChecked(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await requireActiveSubscription();
        if (cancelled) return;
        setAlreadySubscribed(result.ok);
      } catch (err) {
        console.warn("[pricing] sub status check failed:", err);
      } finally {
        if (!cancelled) setStatusChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, isSignedIn]);

  // Auto-forward to Stripe Checkout the moment we confirm the user is
  // signed in AND not already subscribed AND they explicitly clicked
  // the sign-in CTA from this page. Skips the second "Commit & Begin"
  // click that previously broke the flow.
  useEffect(() => {
    if (!autoForwardArmed) return;
    if (!authLoaded || !isSignedIn) return;
    if (!statusChecked) return;
    if (alreadySubscribed) {
      // They signed in but already have a sub — clear the intent and
      // let them see the "Manage subscription" CTA.
      try {
        sessionStorage.removeItem("launchfly:checkoutIntent");
      } catch {
        /* private mode */
      }
      setAutoForwardArmed(false);
      return;
    }
    // Clear before redirecting so a back-button trip doesn't loop.
    try {
      sessionStorage.removeItem("launchfly:checkoutIntent");
    } catch {
      /* private mode */
    }
    setAutoForwardArmed(false);
    handleCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoForwardArmed, authLoaded, isSignedIn, statusChecked, alreadySubscribed]);

  const handleCommit = async () => {
    if (loading) return;
    // TikTok funnel signal: bottom-of-funnel InitiateCheckout right
    // before we redirect to Stripe. The server-side webhook fires
    // CompletePayment when (and only if) the payment actually succeeds.
    trackTikTokEvent("InitiateCheckout", {
      content_name: "LaunchFly Membership",
      content_type: "product",
      content_id: "launchfly-membership",
      value: 19,
      currency: "USD",
    });
    setLoading(true);
    setError(null);
    try {
      const result = await createCheckoutSession();
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      console.error("[checkout]", result);
      setError(`Couldn't start checkout: ${result.reason}`);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(
        `Couldn't start checkout: ${err instanceof Error ? err.message : String(err)}`,
      );
      setLoading(false);
    }
  };

  const handleManage = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await createCustomerPortalSession();
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      console.error("[portal]", result);
      // If we somehow lost the customer link, fall back to checkout.
      if (result.reason === "no-customer") {
        setAlreadySubscribed(false);
        setLoading(false);
        return;
      }
      setError(`Couldn't open billing portal: ${result.reason}`);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(
        `Couldn't open billing portal: ${err instanceof Error ? err.message : String(err)}`,
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <section className="relative flex-1 overflow-hidden px-4 py-10 md:px-6 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
        <div className="relative mx-auto w-full max-w-3xl">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold md:text-xs">The commitment</p>
            <h1 className="mt-2 md:mt-4 text-3xl font-semibold tracking-tight sm:text-6xl">
              Pay before you plan.
            </h1>
            <p className="mt-3 md:mt-4 mx-auto max-w-md md:max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
              You're not unlocking a report. You're committing to becoming someone who builds.
            </p>
          </div>

          <div className="relative mt-6 md:mt-14 overflow-hidden rounded-2xl md:rounded-3xl border border-gold/40 bg-card p-5 md:p-8 shadow-gold sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-warm-glow" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-glow md:text-xs">
                LaunchFly Membership
              </p>
              <div className="mt-2 md:mt-4 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-semibold text-gradient-gold">$19</span>
                <span className="text-sm md:text-base text-muted-foreground">/month</span>
              </div>

              <ul className="mt-5 md:mt-8 grid grid-cols-2 gap-2 md:gap-3">
                {includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs md:text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Show when="signed-in">
                {alreadySubscribed ? (
                  <>
                    <button
                      type="button"
                      onClick={handleManage}
                      disabled={loading}
                      className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Opening billing portal…
                        </>
                      ) : (
                        <>
                          Manage subscription
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      You're already a member. This opens the Stripe
                      Customer Portal where you can update payment
                      method, switch plan, or cancel.
                    </p>
                    <div className="mt-4">
                      <Link
                        to="/app/dashboard"
                        className="inline-flex items-center gap-1 text-sm text-amber-glow hover:underline"
                      >
                        Or jump back to your dashboard
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={loading || !statusChecked}
                    className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting to checkout…
                      </>
                    ) : (
                      <>
                        Commit &amp; Begin
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    onClick={armAutoForward}
                    className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-base font-medium text-gold-foreground shadow-gold transition hover:opacity-90 sm:w-auto"
                  >
                    Sign in to commit
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
                <p className="mt-3 text-xs text-muted-foreground">
                  We need an account so your subscription stays attached to you across devices. After sign-in, you'll go straight to checkout.
                </p>
              </Show>
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}

              <p className="mt-6 text-sm italic text-muted-foreground">
                Welcome to LaunchFly. Your vision has entered the build phase.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-gold">
              <Rocket className="h-3.5 w-3.5 -rotate-45 text-gold-foreground" />
            </span>
            <span className="text-sm font-semibold">
              LaunchFly<span className="text-gold">.io</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} LaunchFly.io — The first step from idea to takeoff.
          </p>
        </div>
      </footer>
    </main>
  );
}
