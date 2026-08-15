import type { IncomingMessage, ServerResponse } from "node:http";
import { json, readBody } from "./http.ts";
import { setTier } from "./usageStore.ts";

/**
 * RevenueCat webhook — keeps our own tier record in sync with real
 * entitlement state. Configure the webhook URL + this secret in the
 * RevenueCat dashboard (Project Settings → Integrations → Webhooks).
 * RevenueCat sends the secret back as "Authorization: Bearer <secret>".
 */

const PRO_ENTITLEMENT = "pro";

const GRANT_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"]);
const REVOKE_EVENTS = new Set(["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"]);

interface RevenueCatPayload {
  event?: {
    type?: string;
    app_user_id?: string;
    entitlement_ids?: string[];
  };
}

function isAuthorized(req: IncomingMessage): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return false; // not configured — reject rather than trust unverified events
  return req.headers.authorization === `Bearer ${secret}`;
}

export async function handleRevenueCatWebhook(req: IncomingMessage, res: ServerResponse) {
  if (!isAuthorized(req)) return json(res, 401, { error: "unauthorized" });

  let body: RevenueCatPayload;
  try {
    body = (await readBody(req)) as RevenueCatPayload;
  } catch {
    return json(res, 400, { error: "bad-request" });
  }

  const event = body.event;
  if (!event?.app_user_id || !event.type) return json(res, 400, { error: "bad-request" });

  const hasProEntitlement = (event.entitlement_ids ?? []).includes(PRO_ENTITLEMENT);
  if (GRANT_EVENTS.has(event.type) && hasProEntitlement) {
    setTier(event.app_user_id, "pro");
  } else if (REVOKE_EVENTS.has(event.type)) {
    setTier(event.app_user_id, "free");
  }
  // Unrecognized event types are acknowledged (200) but ignored — RevenueCat
  // retries non-2xx responses, and there's a long tail of event types
  // (TRANSFER, NON_RENEWING_PURCHASE, etc.) we don't need to act on.

  return json(res, 200, { ok: true });
}
