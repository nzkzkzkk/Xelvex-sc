import { NextRequest, NextResponse } from "next/server";
import { paymentWebhookSchema } from "@/lib/validation";
import { processPaymentEvent } from "@/lib/payments";

/**
 * Real payment-gateway webhook endpoint (TrueMoney / PromptPay /
 * card processor — whichever gets integrated). Until a real gateway
 * is wired up, `/api/dev/simulate-payment` exercises this same
 * `processPaymentEvent` logic from the checkout flow.
 */
export async function POST(req: NextRequest) {
  // A real gateway signs its webhook body (HMAC over the raw payload).
  // This shared-secret header is a placeholder for that signature
  // check — swap it for real signature verification before going live.
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!process.env.PAYMENT_WEBHOOK_SECRET || providedSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = paymentWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const result = await processPaymentEvent(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result);
}
