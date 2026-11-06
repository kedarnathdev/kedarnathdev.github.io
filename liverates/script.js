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
    // Some VOTS responses escape tabs/newlines instead of returning literal separators.
    const text = String(raw ?? "")
      .replace(/\\u000d\\u000a/gi, "\n")
      .replace(/\\u000a/gi, "\n")
      .replace(/\\u0009/gi, "\t")
      .replace(/\\r\\n/gi, "\n");

    const rows = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const cells = line.split("\t").map(cell => cell.trim());
      if (cells.length < 4) continue;

      // VOTS layout described from the dP Gold feed:
      // [symbol_id, product_name, bid, ask, high, low, optional fields...]
      const product = cells[1] || "";
      if (!/\b(?:GOLD|SILVER)\b/i.test(product)) continue;

      const bid = numberOrNull(cells[2]);
      const ask = numberOrNull(cells[3]);
      if (bid === null && ask === null) continue;

      rows.push({
        id: cells[0] || product,
        product,
        bid,
        ask,
        high: numberOrNull(cells[4]),
        low: numberOrNull(cells[5])
      });
    }

    // Keep a defensive JSON path if the provider changes its transport format.
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
                product: String(product),
                bid,
                ask,
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
      } catch (_) {
        // The user-facing error below reports an unrecognized response.
      }
    }

    // Deduplicate repeated instrument IDs without changing provider order.
    const unique = new Map();
    for (const row of rows) unique.set(row.id, row);
    return [...unique.values()];
  }

  function formatPrice(value) {
    return value === null ? "—" : new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2
    }).format(value);
  }

  function renderRates(rows) {
    const fragment = document.createDocumentFragment();
    for (const item of rows) {
      const row = document.createElement("tr");
      const product = document.createElement("td");
      const bid = document.createElement("td");
      const ask = document.createElement("td");

      product.textContent = item.product;
      bid.textContent = formatPrice(item.bid);
      ask.textContent = formatPrice(item.ask);

      const previous = history.get(item.id);
      if (previous && item.ask !== null && previous.ask !== item.ask) {
        ask.classList.add(item.ask > previous.ask ? "highlightgreen" : "highlightred");
      }
      history.set(item.id, { bid: item.bid, ask: item.ask });

      row.append(product, bid, ask);
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
        body.innerHTML = '<tr><td colspan="3">ప్రస్తుతం ధరలు అందుబాటులో లేవు.</td></tr>';
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