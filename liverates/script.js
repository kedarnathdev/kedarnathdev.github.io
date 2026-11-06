(() => {
  "use strict";

  const ENDPOINT = "/.netlify/functions/live-rates";
  const REFRESH_MS = 2000;
  const names = [
    { key: "MUMBAI", label: "ముంబై", unit: "1 గ్రాము" },
    { key: "BANGALORE", label: "బెంగళూరు", unit: "1 గ్రాము" },
    { key: "CHENNAI - CBE", label: "చెన్నై", unit: "1 గ్రాము" },
    { key: "HYDERABAD", label: "హైదరాబాద్", unit: "1 గ్రాము" },
    { key: "VJA - VIZAG", label: "విజయవాడ - వైజాగ్", unit: "1 గ్రాము" },
    { key: "NELLORE", label: "నెల్లూరు", unit: "1 గ్రాము" },
    { key: "SILVER ALL LOCO", label: "వెండి", unit: "1 కేజీ" }
  ];

  const body = document.getElementById("rates-body");
  const status = document.getElementById("rate-status");
  const history = new Map();
  let stopped = false;

  function normalizeCategory(value) {
    return String(value || "").toUpperCase().replace(/\s+/g, " ").trim();
  }

  function identifyCategory(value) {
    const normalized = normalizeCategory(value);
    return names.find(item => normalized === item.key ||
      normalized.replace(/\s/g, "") === item.key.replace(/\s/g, ""));
  }

  function parseRows(raw) {
    const text = String(raw || "")
      .replace(/\\u000d\\u000a/gi, "\n")
      .replace(/\\u000a/gi, "\n")
      .replace(/\\u0009/gi, "\t")
      .replace(/\\r\\n/gi, "\n");

    const rows = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;

      // First try tab-separated records; this preserves multi-word city names.
      const cells = line.split("\t").map(value => value.trim());
      let category = null;
      let price = NaN;

      for (let i = 0; i < cells.length; i++) {
        const match = identifyCategory(cells[i]);
        if (match) {
          category = match;
          price = Number(String(cells[i + 1] || "").replace(/[^0-9.+-]/g, ""));
          break;
        }
      }

      // Some provider responses are whitespace-delimited rather than TSV.
      if (!category) {
        const pattern = /(SILVER\s+ALL\s+LOCO|CHENNAI\s*-\s*CBE|VJA\s*-\s*VIZAG|MUMBAI|BANGALORE|HYDERABAD|NELLORE)\s+([^\s]+)/i;
        const match = line.match(pattern);
        if (match) {
          category = identifyCategory(match[1]);
          price = Number(String(match[2]).replace(/[^0-9.+-]/g, ""));
        }
      }

      if (category && Number.isFinite(price) && price > 0) {
        rows.push({ ...category, price });
      }
    }

    // Also accept a JSON response if the upstream changes its response format.
    if (!rows.length && /^[\s]*[\[{]/.test(text)) {
      try {
        const parsed = JSON.parse(text);
        const visit = value => {
          if (Array.isArray(value)) return value.forEach(visit);
          if (!value || typeof value !== "object") return;
          const categoryValue = value.Category ?? value.category ?? value.name ?? value.Name;
          const priceValue = value.Price ?? value.price ?? value.rate ?? value.Rate;
          const category = identifyCategory(categoryValue);
          const price = Number(String(priceValue ?? "").replace(/[^0-9.+-]/g, ""));
          if (category && Number.isFinite(price) && price > 0) rows.push({ ...category, price });
          Object.values(value).forEach(child => {
            if (child && typeof child === "object") visit(child);
          });
        };
        visit(parsed);
      } catch (_) {
        // Keep the clear "no recognizable rates" state below.
      }
    }

    const unique = new Map(rows.map(row => [row.key, row]));
    return names.map(item => unique.get(item.key)).filter(Boolean);
  }

  function renderRates(rows) {
    const fragment = document.createDocumentFragment();

    for (const item of rows) {
      const row = document.createElement("tr");
      const city = document.createElement("td");
      const rate = document.createElement("td");
      city.textContent = item.label;
      rate.textContent = new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
      }).format(item.price) + "  (" + item.unit + ")";

      const previous = history.get(item.key);
      if (previous !== undefined && previous !== item.price) {
        rate.classList.add(item.price > previous ? "highlightgreen" : "highlightred");
      }
      history.set(item.key, item.price);
      row.append(city, rate);
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
        throw new Error("The rate provider responded, but its data format was not recognized.");
      }
      renderRates(rows);
      status.textContent = "లైవ్ ధరలు • చివరి నవీకరణ: " +
        new Date().toLocaleTimeString("te-IN");
      status.dataset.state = "ok";
    } catch (error) {
      status.textContent = "ధరలను పొందలేకపోయాము: " + error.message;
      status.dataset.state = "error";
      if (!body.children.length || body.textContent.includes("పొందుతోంది")) {
        body.innerHTML = '<tr><td colspan="2">ప్రస్తుతం ధరలు అందుబాటులో లేవు.</td></tr>';
      }
      console.error("Live rate refresh failed:", error);
    } finally {
      if (!stopped) window.setTimeout(refresh, REFRESH_MS);
    }
  }

  function updateClock() {
    const element = document.getElementById("current-datetime");
    const now = new Date();
    element.textContent = "సమయం: " + now.toLocaleString("te-IN", {
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