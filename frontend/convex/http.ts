import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook handler
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Server configuration error", { status: 500 });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const body = await request.text();

    // Verify the webhook
    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook verification failed", { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || email || "User";

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: id,
        email,
        name,
        profileImageUrl: image_url,
      });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) {
        await ctx.runMutation(internal.users.deleteByClerkId, {
          clerkId: id,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

// Stripe webhook handler
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeWebhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return new Response("Server configuration error", { status: 500 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await request.text();

    // We'll import Stripe dynamically or use the API directly
    // For now, we'll parse the event manually and verify later
    // In production, use the Stripe SDK to verify
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Handle Stripe events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await ctx.runMutation(internal.subscriptions.handleCheckoutComplete, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          userId: session.metadata?.userId,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await ctx.runMutation(internal.subscriptions.syncSubscription, {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          status: subscription.status,
          priceId: subscription.items?.data?.[0]?.price?.id,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Payment failed for customer:", invoice.customer);
        break;
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;

// Type definitions for Clerk webhook events
type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
};
