import type { APIRoute } from "astro";
import { priceFromPercent, RETAIL } from "../../scripts/offer.js";

export const prerender = false;

const ALLOWED_PERCENTS = [0, 5, 10, 20, 50];

const money = (value: number) => value.toFixed(2);

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Customer";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
};

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.NOMOD_API_KEY || import.meta.env.NOMOD_HOSTED_CHECKOUT_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Nomod is not configured yet. Add NOMOD_API_KEY in Vercel (and a local .env) from Nomod Hosted Checkout.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const customer = (body.customer ?? {}) as Record<string, string>;
  const name = String(customer.name || "").trim();
  const email = String(customer.email || "").trim();
  const phone = String(customer.phone || "").trim();
  const address1 = String(customer.address1 || "").trim();
  const city = String(customer.city || "").trim();
  const region = String(customer.region || "").trim();
  const country = String(customer.country || "").trim();
  const quantity = Math.min(10, Math.max(1, Number(body.quantity) || 1));
  const requestedPercent = Number(body.discountPercent);
  const percent = ALLOWED_PERCENTS.includes(requestedPercent) ? requestedPercent : 0;
  const unitPrice = priceFromPercent(percent);
  const retailLine = RETAIL * quantity;
  const total = unitPrice * quantity;
  const discount = retailLine - total;

  if (!name || !email || !phone || !address1 || !city || !region || !country) {
    return Response.json({ error: "Please complete contact and delivery details." }, { status: 400 });
  }

  const orderId = `STIKR-${Date.now()}`;
  const origin = new URL(request.url).origin;
  const { firstName, lastName } = splitName(name);
  const address = [address1, customer.address2, city, region, country, customer.postal]
    .filter(Boolean)
    .join(", ")
    .slice(0, 512);

  const payload = {
    reference_id: orderId,
    amount: money(total),
    currency: "AED",
    discount: money(discount),
    items: [
      {
        item_id: "stikr-pouch",
        name: "STIKR magnetic gym pouch",
        quantity,
        unit_amount: money(RETAIL),
        discount_type: "flat",
        discount_amount: money(discount),
        total_amount: money(retailLine),
        net_amount: money(total),
      },
    ],
    customer: {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      business_name: "",
    },
    success_url: `${origin}/thank-you?paid=1&ref=${encodeURIComponent(orderId)}`,
    failure_url: `${origin}/checkout?payment=failed`,
    cancelled_url: `${origin}/checkout?payment=cancelled`,
    metadata: {
      orderid: orderId,
      qty: String(quantity),
      city: city.slice(0, 512),
      region: region.slice(0, 512),
      address,
    },
  };

  const nomod = await fetch("https://api.nomod.com/v1/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const result = await nomod.json().catch(() => ({}));

  if (!nomod.ok || !result?.url) {
    const message =
      result?.message ||
      result?.error ||
      result?.detail ||
      "Nomod could not start checkout. Check the API key and try again.";
    return Response.json({ error: String(message) }, { status: 502 });
  }

  return Response.json({
    url: result.url,
    checkoutId: result.id,
    orderId,
    total,
    unitPrice,
    percent,
  });
};
