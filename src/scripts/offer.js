export const RETAIL = 149;
export const OFFER_KEY = "stikr-offer";
export const SPIN_WIN_KEY = "stikr-spin-win";
export const BF_PERCENT = 10;

export function priceFromPercent(percent) {
  return Math.round(RETAIL * (1 - percent / 100));
}

export function fullPriceOffer() {
  return {
    percent: 0,
    unitPrice: RETAIL,
    label: "Retail",
    source: "none",
  };
}

export function bfOffer() {
  return {
    percent: BF_PERCENT,
    unitPrice: priceFromPercent(BF_PERCENT),
    label: "Black Friday 10% off",
    source: "bf",
  };
}

export function spinOffer(percent) {
  return {
    percent,
    unitPrice: priceFromPercent(percent),
    label: `${percent}% off invoice`,
    source: "spin",
  };
}

export function loadSpinWin() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SPIN_WIN_KEY) || "null");
    if (!parsed || typeof parsed.percent !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSpinWin(percent) {
  sessionStorage.setItem(SPIN_WIN_KEY, JSON.stringify({ percent, claimed: false }));
}

export function markSpinClaimed() {
  const win = loadSpinWin();
  if (!win) return;
  sessionStorage.setItem(SPIN_WIN_KEY, JSON.stringify({ ...win, claimed: true }));
}

export function resolveCheckoutOffer(search = location.search) {
  const intent = new URLSearchParams(search).get("offer") || new URLSearchParams(search).get("redeem");
  if (intent === "bf" || intent === "1") return bfOffer();
  if (intent === "spin") {
    const win = loadSpinWin();
    if (win?.percent > 0) return spinOffer(win.percent);
  }
  return fullPriceOffer();
}

export function saveOffer(offer) {
  localStorage.setItem(OFFER_KEY, JSON.stringify(offer));
}

export function loadOffer() {
  try {
    const raw = localStorage.getItem(OFFER_KEY);
    if (!raw) return fullPriceOffer();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.unitPrice !== "number") return fullPriceOffer();
    return parsed;
  } catch {
    return fullPriceOffer();
  }
}

export function invoiceTotals(offer = fullPriceOffer(), qty = 1) {
  const quantity = Math.min(10, Math.max(1, Number(qty) || 1));
  const subtotal = RETAIL * quantity;
  const total = offer.unitPrice * quantity;
  return {
    quantity,
    unitPrice: offer.unitPrice,
    percent: offer.percent,
    subtotal,
    discount: subtotal - total,
    total,
  };
}

export function applyOfferToPage(offer = resolveCheckoutOffer()) {
  const note = document.querySelector("[data-discount-note]");
  if (!note) return;

  if (offer.percent > 0 && offer.source !== "none") {
    const origin = offer.source === "spin" ? "your free spin" : "Black Friday";
    note.hidden = false;
    note.innerHTML = `<strong>${offer.percent}% off applied</strong> from ${origin} to the full invoice. You pay <strong>AED ${offer.unitPrice}</strong> each instead of AED ${RETAIL}. One discount only — offers do not stack.`;
  } else {
    note.hidden = true;
  }
}
