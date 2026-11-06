(() => {
  "use strict";

  const ENDPOINT = "/.netlify/functions/live-rates";
  const REFRESH_MS = 2000;
  const body = document.getElementById("rates-body");
  const status = document.getElementById("rate-status");
  const history = new Map();
  let stopped = false;

  function numberOrNull(value) {
    const text = String(value ?? "").trim().replace(/,/g, "");
    if (!text || text === "-" || /^N\/?A$/i.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function parseRows(raw) {
    const text = String(raw ?? "")
      .replace(/\\u000d\\u000a/gi, "\n")
      .replace(/\\u000a/gi, "\n")
      .replace(/\\u0009/gi, "\t")
      .replace(/\\r\\n/gi, "\n");

    const rows = [];
    const numeric = "-?\\d[\\d,]*(?:\\.\\d+)?";
    // The live feed is whitespace-delimited; product names can contain spaces.
    const spacedRow = new RegExp(
      "^\\s*(\\S+)\\s+(.+?)\\s+(" + numeric + ")\\s+(" + numeric +
      ")(?:\\s+(" + numeric + "))?(?:\\s+(" + numeric + "))?(?:\\s+.*)?\\s*$"
    );

    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      let symbolId = "";
      let product = "";
      let bid = null;
      let ask = null;
      let high = null;
      let low = null;

      const tabCells = line.split("\t").map(cell => cell.trim()).filter(Boolean);
      if (tabCells.length >= 4 && /\b(?:GOLD|SILVER)\b/i.test(tabCells[1] || "")) {
        symbolId = tabCells[0];
        product = tabCells[1];
        bid = numberOrNull(tabCells[2]);
        ask = numberOrNull(tabCells[3]);
        high = numberOrNull(tabCells[4]);
        low = numberOrNull(tabCells[5]);
      } else {
        const match = line.match(spacedRow);
        if (!match) continue;
        symbolId = match[1];
        product = match[2].trim();
        bid = numberOrNull(match[3]);
        ask = numberOrNull(match[4]);
        high = numberOrNull(match[5]);
        low = numberOrNull(match[6]);
      }

      if (!/\b(?:GOLD|SILVER)\b/i.test(product)) continue;
      if (bid === null && ask === null) continue;
      rows.push({ id: symbolId || product, product, bid, ask, high, low });
    }

    if (!rows.length && /^[\s]*[\[{]/.test(text)) {
      try {
        const parsed = JSON.parse(text);
        const visit = value => {
          if (Array.isArray(value)) return value.forEach(visit);
          if (!value || typeof value !== "object") return;
          const product = value.product ?? value.Product ?? value.product_name ?? value.name ?? value.Name;
          if (product && /\b(?:GOLD|SILVER)\b/i.test(String(product))) {
            const bid = numberOrNull(value.bid ?? value.Bid);
            const ask = numberOrNull(value.ask ?? value.Ask);
            if (bid !== null || ask !== null) {
              rows.push({
                id: String(value.symbol_id ?? value.symbolId ?? product),
                product: String(product), bid, ask,
                high: numberOrNull(value.high ?? value.High),
                low: numberOrNull(value.low ?? value.Low)
              });
            }
          }
          Object.values(value).forEach(child => {
            if (child && typeof child === "object") visit(child);
          });
        };
        visit(parsed);
      } catch (_) {}
    }

    const unique = new Map();
    for (const row of rows) unique.set(row.id, row);
    return [...unique.values()];
  }

  function formatPrice(value) {
    return value === null ? "—" : new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2
    }).format(value);
  }

  function normalizeProduct(product) {
    return String(product || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  }

  function hasUnit(product, amount, units) {
    const normalized = normalizeProduct(product);
    const unitPattern = units.join("|");
    return new RegExp("(?:^|\\s)" + amount + "\\s*(?:" + unitPattern + ")(?=\\s|$)", "i").test(normalized);
  }

  function selectRequestedRates(rows) {
    const requested = [
      {
        id: "gold-1g",
        label: "Gold – 1g",
        matches: item => /\bGOLD\b/i.test(item.product) &&
          hasUnit(item.product, "1", ["G", "GM", "GMS", "GRAM", "GRAMS"])
      },
      {
        id: "gold-10g",
        label: "Gold – 10g",
        matches: item => /\bGOLD\b/i.test(item.product) &&
          hasUnit(item.product, "10", ["G", "GM", "GMS", "GRAM", "GRAMS"])
      },
      {
        id: "silver-1kg",
        label: "Silver – 1kg",
        matches: item => /\bSILVER\b/i.test(item.product) &&
          (hasUnit(item.product, "1", ["KG", "KGS", "KILOGRAM", "KILOGRAMS"]) ||
           hasUnit(item.product, "1000", ["G", "GM", "GMS", "GRAM", "GRAMS"]))
      }
    ];

    return requested.map(target => {
      const match = rows.find(target.matches);
      return {
        id: target.id,
        label: target.label,
        price: match ? (match.ask ?? match.bid) : null
      };
    });
  }

  function renderRates(rows) {
    const selected = selectRequestedRates(rows);
    const fragment = document.createDocumentFragment();

    for (const item of selected) {
      const row = document.createElement("tr");
      const product = document.createElement("td");
      const price = document.createElement("td");

      product.textContent = item.label;
      price.textContent = formatPrice(item.price);

      const previous = history.get(item.id);
      if (previous !== undefined && item.price !== null && previous !== item.price) {
        price.classList.add(item.price > previous ? "highlightgreen" : "highlightred");
      }
      history.set(item.id, item.price);

      row.append(product, price);
      fragment.appendChild(row);
    }
    body.replaceChildren(fragment);
  }

  async function refresh() {
    if (stopped) return;
    try {
      const response = await fetch(ENDPOINT, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "text/plain, application/json, application/xml, */*" }
      });
      const payload = await response.text();
      if (!response.ok) {
        let detail = payload;
        try { detail = JSON.parse(payload).error || payload; } catch (_) {}
        throw new Error("API " + response.status + ": " + detail.slice(0, 180));
      }

      const rows = parseRows(payload);
      if (!rows.length) {
        const preview = payload.replace(/\s+/g, " ").slice(0, 140);
        throw new Error("Unrecognized provider response. Preview: " + (preview || "(empty)"));
      }

      renderRates(rows);
      status.textContent = "లైవ్ ధరలు • చివరి నవీకరణ: " + new Date().toLocaleTimeString("te-IN");
      status.dataset.state = "ok";
    } catch (error) {
      status.textContent = "ధరలను పొందలేకపోయాము: " + error.message;
      status.dataset.state = "error";
      console.error("Live rate refresh failed:", error);
      if (!body.children.length || body.textContent.includes("పొందుతోంది")) {
        body.innerHTML = '<tr><td colspan="2">ప్రస్తుతం ధరలు అందుబాటులో లేవు.</td></tr>';
      }
    } finally {
      if (!stopped) window.setTimeout(refresh, REFRESH_MS);
    }
  }

  function updateClock() {
    const element = document.getElementById("current-datetime");
    element.textContent = "సమయం: " + new Date().toLocaleString("te-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Kolkata"
    });
  }

  updateClock();
  window.setInterval(updateClock, 1000);
  refresh();
  window.addEventListener("pagehide", () => { stopped = true; });
})();