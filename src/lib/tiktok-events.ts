/**
 * TikTok pixel + Events API helpers.
 *
 *  - Browser side: `trackTikTokEvent(name, params?)` calls the `ttq`
 *    global injected by the snippet in __root.tsx. Safe-no-op when
 *    `ttq` isn't on window (SSR, dev without the snippet, etc).
 *
 *  - Server side: `sendTikTokServerEvent(...)` POSTs to TikTok's
 *    Events API from the Cloudflare Worker (used by the Stripe
 *    webhook for CompletePayment) — required for iOS/blocked-pixel
 *    users where browser tracking misses the conversion.
 */

const TIKTOK_PIXEL_ID = "D8Q51L3C77U2T659M9M0";
const TIKTOK_EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

type TikTokEventName =
  | "ViewContent"
  | "ClickButton"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Subscribe"
  | "CompletePayment"
  | "Lead"
  | "SubmitForm"
  | "CompleteRegistration";

type TikTokEventParams = {
  content_name?: string;
  content_id?: string;
  content_type?: string;
  value?: number;
  currency?: string;
  email?: string;
  external_id?: string;
};

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

export function trackTikTokEvent(
  name: TikTokEventName,
  params?: TikTokEventParams,
): void {
  if (typeof window === "undefined" || !window.ttq) return;
  try {
    window.ttq.track(name, params as Record<string, unknown>);
  } catch (err) {
    console.warn("[tiktok] client track failed:", err);
  }
}

export function identifyTikTokUser(params: { email?: string; external_id?: string }): void {
  if (typeof window === "undefined" || !window.ttq) return;
  try {
    window.ttq.identify(params as Record<string, unknown>);
  } catch (err) {
    console.warn("[tiktok] client identify failed:", err);
  }
}

/**
 * Server-side Events API. Hashes PII (email, external_id) per TikTok's
 * spec — SHA-256 hex, lowercase + trimmed. Requires TIKTOK_ACCESS_TOKEN
 * secret (wrangler secret put TIKTOK_ACCESS_TOKEN).
 */
export async function sendTikTokServerEvent(opts: {
  event: TikTokEventName;
  eventId?: string;
  email?: string;
  externalId?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
  url?: string;
}): Promise<void> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn(
      "[tiktok] no TIKTOK_ACCESS_TOKEN set — skipping server event",
      opts.event,
    );
    return;
  }

  const user: Record<string, string> = {};
  if (opts.email) user.email = await sha256Hex(opts.email.trim().toLowerCase());
  if (opts.externalId)
    user.external_id = await sha256Hex(opts.externalId.trim().toLowerCase());

  const body = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: opts.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        user: Object.keys(user).length > 0 ? user : undefined,
        properties: {
          value: opts.value,
          currency: opts.currency ?? "USD",
          content_name: opts.contentName,
          content_id: opts.contentId,
        },
        page: opts.url ? { url: opts.url } : undefined,
      },
    ],
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      console.warn(
        "[tiktok] events API non-ok:",
        response.status,
        text.slice(0, 300),
      );
    } else {
      console.log("[tiktok] sent server event:", opts.event, text.slice(0, 200));
    }
  } catch (err) {
    console.warn("[tiktok] events API call failed:", err);
  }
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
