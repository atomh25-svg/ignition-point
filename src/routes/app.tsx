import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/launchfly/AppShell";
import { requireActiveSubscription } from "@/lib/require-subscription";

export const Route = createFileRoute("/app")({
  // Server-side gate. Runs on every navigation into /app/*. Sends
  // unauthenticated visitors home and unsubscribed users to /pricing.
  // Exposes `founderDnaCompleted` to child routes via context so they
  // can decide whether to redirect into the survey or render a
  // "complete Founder DNA first" placeholder.
  beforeLoad: async () => {
    const result = await requireActiveSubscription();
    if (!result.ok) {
      if (result.reason === "unauthenticated") {
        throw redirect({ to: "/" });
      }
      throw redirect({ to: "/pricing" });
    }
    return {
      userId: result.userId,
      subscription: result.subscription,
      founderDnaCompleted: result.founderDnaCompleted,
    };
  },
  component: AppShell,
});
