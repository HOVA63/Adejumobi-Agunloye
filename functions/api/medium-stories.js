// Cloudflare Pages Function. File path = URL path, so this answers GET /api/medium-stories.
// It fetches the Medium RSS feed on Cloudflare's servers (no browser CORS problem),
// turns it into the same JSON shape the page already expects, and caches it for an hour.

const FEED_URL = "https://medium.com/feed/@adejumobiagunloye";
const EXCERPT_LENGTH = 300;

const NAMED_ENTITIES = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”"
};

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === "#") {
            const code = entity[1].toLowerCase() === "x"
                ? Number.parseInt(entity.slice(2), 16)
                : Number.parseInt(entity.slice(1), 10);
            try {
                return String.fromCodePoint(code);
            } catch {
                return match;
            }
        }
        return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    });
}

function readTag(xml, tag) {
    const escaped = tag.replace(/[:.]/g, "\\$&");
    const match = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "i"));
    if (!match) return "";
    const cdata = match[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
    return cdata ? cdata[1] : decodeEntities(match[1]).trim();
}

function firstImage(html) {
    for (const [, src] of html.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) {
        if (/\/_\/stat\b/.test(src)) continue; // Medium's 1x1 tracking pixel
        const url = decodeEntities(src);
        if (url.startsWith("https://")) return url;
    }
    return "";
}

function excerptFrom(html) {
    const text = html
        .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ");
    const clean = decodeEntities(text).replace(/\s+/g, " ").trim();
    return clean.length > EXCERPT_LENGTH ? `${clean.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…` : clean;
}

function parseFeed(xml) {
    return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(([, block]) => {
        const content = readTag(block, "content:encoded") || readTag(block, "description");
        return {
            title: readTag(block, "title"),
            link: readTag(block, "link"),
            pubDate: readTag(block, "pubDate"),
            description: excerptFrom(content),
            image: firstImage(content)
        };
    }).filter(item => item.title && item.link);
}

function json(body, status, cacheControl) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cacheControl }
    });
}

export async function onRequestGet() {
    try {
        const response = await fetch(FEED_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; personal-site-feed-reader)",
                "Accept": "application/rss+xml, application/xml, text/xml"
            },
            // Cloudflare caches Medium's response at the edge for an hour.
            cf: { cacheTtl: 3600, cacheEverything: true }
        });
        if (!response.ok) throw new Error(`Medium returned HTTP ${response.status}`);

        const items = parseFeed(await response.text());
        if (!items.length) throw new Error("No stories found in the feed");

        // Browsers re-check after 5 minutes; Cloudflare's edge keeps it for an hour.
        return json({ status: "ok", items }, 200, "public, max-age=300, s-maxage=3600");
    } catch (error) {
        // Never cache a failure. The page shows its "Unable to load stories" message.
        return json({ status: "error", message: error.message }, 502, "no-store");
    }
}
