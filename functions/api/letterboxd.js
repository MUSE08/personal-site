const USER = 'alireza8023';
const FEED_URL = `https://letterboxd.com/${USER}/rss/`;

function extractItems(xml) {
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null) {
        const block = m[1];
        const title = (block.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
        const link = (block.match(/<link>([^<]*)<\/link>/) || [])[1] || '';
        const date = (block.match(/<pubDate>([^<]*)<\/pubDate>/) || [])[1] || '';
        items.push({ title, link, date });
    }
    return items;
}

export async function onRequestGet(context) {
    const cache = caches.default;
    const cacheKey = new Request(context.request.url);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(FEED_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (personal-site; +https://ali8muse.dpdns.org)' }
        });
        if (!res.ok) throw new Error('Letterboxd fetch failed: ' + res.status);
        const xml = await res.text();

        const items = extractItems(xml);
        // keep only "Watched ..." diary entries
        const watched = items.filter(it => /^Watched\s/i.test(it.title));
        const entry = watched[0] || null;

        const payload = entry ? {
            ok: true,
            title: entry.title.replace(/^Watched\s+/i, '').trim(),
            url: entry.link,
            date: entry.date
        } : { ok: true, title: null, url: null, date: null };

        const out = new Response(JSON.stringify(payload), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' }
        });
        await cache.put(cacheKey, out.clone());
        return out;
    } catch (err) {
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
}
