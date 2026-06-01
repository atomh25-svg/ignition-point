import { createFileRoute, Link } from "@tanstack/react-router";

import { Navbar } from "@/components/launchfly/Navbar";
// Vite's ?raw import — gives us the file contents as a string at
// build time. The HTML comes from Termly's generator (see the
// header comment at the top of that file for regeneration notes).
import privacyHtml from "../content/privacy-policy.html?raw";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LaunchFly.io" },
      {
        name: "description",
        content:
          "How LaunchFly collects, uses, stores, and shares your personal information.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <section className="relative flex-1 overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute inset-0 bg-warm-glow opacity-50" />
        <div className="relative mx-auto w-full max-w-3xl">
          {/* Termly's exported HTML uses inline color: rgb(89,89,89) /
              color: rgb(0,0,0) which would be unreadable on our dark
              bg. The class wrapper below scopes overrides so every
              [data-custom-class] inside the HTML reads as bone-white
              on the warm-dark page, and links use our gold. */}
          <div
            className="privacy-doc rounded-3xl border border-gold/20 bg-card/50 p-8 sm:p-12 shadow-elegant"
            dangerouslySetInnerHTML={{ __html: privacyHtml }}
          />

          <div className="mt-10 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              ← Back to launchfly.io
            </Link>
          </div>
        </div>
      </section>

      {/* Scoped overrides for Termly's inline light-theme styles. Targets
          the wrapper class so this never bleeds into other routes. */}
      <style>{`
        .privacy-doc [data-custom-class='body'],
        .privacy-doc [data-custom-class='body'] * {
          background: transparent !important;
        }
        .privacy-doc [data-custom-class='title'],
        .privacy-doc [data-custom-class='title'] *,
        .privacy-doc h1, .privacy-doc h2, .privacy-doc h3 {
          font-family: inherit !important;
          color: rgb(244, 239, 230) !important;
        }
        .privacy-doc [data-custom-class='subtitle'],
        .privacy-doc [data-custom-class='subtitle'] * {
          font-family: inherit !important;
          color: rgb(154, 146, 134) !important;
        }
        .privacy-doc [data-custom-class='heading_1'],
        .privacy-doc [data-custom-class='heading_1'] * {
          font-family: inherit !important;
          color: rgb(214, 166, 81) !important; /* warm gold */
          font-size: 1.5rem !important;
          margin-top: 2rem !important;
          margin-bottom: 0.5rem !important;
        }
        .privacy-doc [data-custom-class='heading_2'],
        .privacy-doc [data-custom-class='heading_2'] * {
          font-family: inherit !important;
          color: rgb(244, 239, 230) !important;
          font-size: 1.125rem !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.4rem !important;
        }
        .privacy-doc [data-custom-class='body_text'],
        .privacy-doc [data-custom-class='body_text'] *,
        .privacy-doc p, .privacy-doc li, .privacy-doc span {
          color: rgb(204, 198, 188) !important;
          font-family: inherit !important;
          font-size: 0.9375rem !important;
          line-height: 1.65 !important;
        }
        .privacy-doc [data-custom-class='link'],
        .privacy-doc [data-custom-class='link'] *,
        .privacy-doc a {
          color: rgb(214, 166, 81) !important;
          text-decoration: underline !important;
          text-underline-offset: 2px !important;
        }
        .privacy-doc a:hover {
          color: rgb(232, 196, 121) !important;
        }
        .privacy-doc table {
          border-collapse: collapse !important;
          margin: 1rem 0 !important;
          width: 100% !important;
        }
        .privacy-doc table td,
        .privacy-doc table th {
          border: 1px solid rgba(214, 166, 81, 0.18) !important;
          padding: 0.5rem 0.75rem !important;
          vertical-align: top !important;
        }
        .privacy-doc ul {
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .privacy-doc li {
          margin: 0.3rem 0 !important;
        }
      `}</style>
    </main>
  );
}
