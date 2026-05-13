import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/launchfly/AppShell";
import { requireActiveSubscription } from "@/lib/require-subscription";

export const Route = createFileRoute("/app")({
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
      selectedIdeaId: result.selectedIdeaId,
      launchStartedAt: result.launchStartedAt,
    };
  },
  component: AppShell,
});
