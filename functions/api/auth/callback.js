function renderHtml(origin, provider, token, user, error) {
    const payload = { provider, token, user, error };
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>ورود به داشبورد</title>
<style>
body{font-family:system-ui,sans-serif;background:#0a0e17;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{background:#111827;border:1px solid #22d3ee;border-radius:12px;padding:32px;max-width:440px;text-align:center}
h2{margin:0 0 8px}
p{color:#94a3b8;line-height:1.8;margin:6px 0}
#status{font-weight:700}
#detail{color:#64748b;font-size:12px;direction:ltr}
.ok{color:#4ade80;font-size:36px}
</style></head><body>
<div class="box">
<div class="ok" id="icon">↻</div>
<h2 id="title">در حال اتصال...</h2>
<p id="status">...</p>
<p id="detail"></p>
</div>
<script>
(function () {
    var data = ${json};
    var log = ['provider=' + data.provider];
    var icon = document.getElementById('icon');
    var title = document.getElementById('title');
    var status = document.getElementById('status');
    var detail = document.getElementById('detail');

    if (data.error) {
        icon.textContent = '✗'; icon.style.color = '#f87171';
        title.textContent = 'خطا';
        status.textContent = data.error;
        detail.textContent = log.join(' | ');
        return;
    }

    icon.textContent = '✓'; icon.style.color = '#4ade80';
    title.textContent = 'ورود موفق بود';

    if (window.opener) {
        log.push('opener=yes');
        var delivered = false;
        try {
            window.opener.postMessage(data, '*');
            delivered = true;
            log.push('postMessage=ok');
        } catch (e) {
            log.push('postMessage_err=' + (e && e.message));
        }
        status.textContent = delivered
            ? 'توکن به داشبورد ارسال شد. در حال بستن پنجره...'
            : 'ارسال توکن ناموفق بود. پنجره را دستی ببند.';
        detail.textContent = log.join(' | ');
        if (delivered) {
            setTimeout(function () { try { window.close(); } catch (e) {} }, 400);
        }
    } else {
        log.push('opener=null');
        status.textContent = 'پنجرهٔ بازکننده پیدا نشد. به داشبورد برگرد و دوباره تلاش کن.';
        detail.textContent = log.join(' | ');
    }
}());
</script></body></html>`;
}

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const origin = url.origin;
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const provider = url.searchParams.get('provider') || 'github';
        const clientId = env.GITHUB_CLIENT_ID;
        const clientSecret = env.GITHUB_CLIENT_SECRET;

        const fail = (msg) => new Response(renderHtml(origin, provider, null, null, msg), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

        if (!clientId || !clientSecret) return fail('OAuth env not configured');
        if (!code) return fail('Missing authorization code');

        const cookies = request.headers.get('Cookie') || '';
        const m = cookies.match(/(?:^|;\s*)cms_state=([^;]+)/);
        if (m && m[1] !== state) return fail('State mismatch');

        const tokRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state })
        });
        const tokData = await tokRes.json();
        const accessToken = tokData.access_token;
        if (!accessToken) return fail(tokData.error_description || tokData.error || 'Could not get access token');

        let user = { login: '', name: '', avatar_url: '' };
        try {
            const userRes = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'decap-cms-oauth-proxy' }
            });
            if (userRes.ok) user = await userRes.json();
        } catch (e) {}

        const html = renderHtml(origin, provider, accessToken, user, null);
        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Set-Cookie': 'cms_state=; Path=/; HttpOnly; Max-Age=0'
            }
        });
    } catch (err) {
        return new Response('Auth callback error: ' + String(err), { status: 500 });
    }
}