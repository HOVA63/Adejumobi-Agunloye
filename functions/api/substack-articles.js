// Cloudflare Pages Function. File path = URL path, so this answers GET /api/substack-articles.
const ARCHIVE_URL = "https://adejumobiagunloye.substack.com/api/v1/archive?sort=new&limit=20";

function json(body, status, cacheControl) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cacheControl }
    });
}

export async function onRequestGet() {
    try {
        const response = await fetch(ARCHIVE_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; personal-site-feed-reader)",
                "Accept": "application/json"
            },
            cf: { cacheTtl: 3600, cacheEverything: true }
        });
        if (!response.ok) throw new Error(`Substack returned HTTP ${response.status}`);

        const archive = await response.json();
        if (!archive || !Array.isArray(archive.posts)) {
            throw new Error("Substack returned an invalid archive.");
        }

        return json({ status: "ok", items: archive.posts }, 200, "public, max-age=300, s-maxage=3600");
    } catch (error) {
        return json({ status: "error", message: error.message }, 502, "no-store");
    }
}
