import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/launchfly/AppShell";

export const Route = createFileRoute("/app")({
  component: AppShell,
});
