export const RETAIL = 149;
export const OFFER_KEY = "stikr-offer";

export function defaultOffer() {
  return {
    percent: 20,
    unitPrice: 119,
    label: "Black Friday 20% off",
    source: "bf",
  };
}

export function loadOffer() {
  try {
    const raw = localStorage.getItem(OFFER_KEY);
    if (!raw) return defaultOffer();
    const parsed = JSON.parse(raw);
    if (typeof parsed?.unitPrice !== "number") return defaultOffer();
    return parsed;
  } catch {
    return defaultOffer();
  }
}

export function saveOffer(offer) {
  localStorage.setItem(OFFER_KEY, JSON.stringify(offer));
}

export function priceFromPercent(percent) {
  return Math.round(RETAIL * (1 - percent / 100));
}

export function applyOfferToPage(offer = loadOffer()) {
  document.querySelectorAll("[data-now-price]").forEach((node) => {
    node.textContent = `AED ${offer.unitPrice}`;
  });
  document.querySelectorAll("[data-save-label]").forEach((node) => {
    node.textContent =
      offer.source === "spin"
        ? `you availed ${offer.percent}% off`
        : `save ${offer.percent}% today`;
  });

  const note = document.querySelector("[data-discount-note]");
  if (!note) return;

  if (offer.source === "spin" && offer.percent > 0) {
    note.hidden = false;
    note.innerHTML = `You availed <strong>${offer.percent}% off</strong> from your free spin. You pay <strong>AED ${offer.unitPrice}</strong> instead of AED ${RETAIL}.`;
  } else {
    note.hidden = true;
  }
}
