const UPSTREAM_BASE =
  "https://statewisebcast.dpgold.in:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/dpgold";

export default async function handler() {
  try {
    // The dP Gold website adds a changing "_=" value to every poll to bypass
    // intermediary/browser caches. Generate a fresh value for each request.
    const upstreamUrl = new URL(UPSTREAM_BASE);
    upstreamUrl.searchParams.set("_", String(Date.now()));

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "Accept": "application/xml, text/xml, text/plain, application/json, */*",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.dpgold.com/",
        "User-Agent": "Mozilla/5.0 (compatible; LiveRates/1.0)"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000)
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      console.error("dP Gold rate endpoint returned HTTP", upstream.status, body.slice(0, 500));
      return Response.json(
        { error: `dP Gold rate endpoint returned HTTP ${upstream.status}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!body.trim()) {
      return Response.json(
        { error: "dP Gold rate endpoint returned an empty response" },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Rate-Source": "dpgold-statewise-broadcast"
      }
    });
  } catch (error) {
    console.error("dP Gold live-rate request failed:", error);
    return Response.json(
      {
        error: error?.name === "TimeoutError"
          ? "dP Gold live-rate endpoint timed out"
          : "Unable to reach dP Gold live-rate endpoint"
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}