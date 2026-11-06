const UPSTREAM_URL = "http://viewbcastgold.dpgold.in:8811/VOTSBroadcast/Services/xml/GetLiveRate";

export default async function handler() {
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      method: "GET",
      headers: { "Accept": "text/plain, application/xml, */*" },
      signal: AbortSignal.timeout(12000)
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream provider returned HTTP ${upstream.status}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("Live rate upstream request failed:", error);
    return Response.json(
      { error: error?.name === "TimeoutError" ? "Rate provider timed out" : "Unable to reach the rate provider" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}