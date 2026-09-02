function renderHtml(origin, provider, token, user, error) {
    const payload = { provider, token, user, error };
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    const safeOrigin = origin.replace(/[^\w:\/.-]/g, '');
    const adminUrl = safeOrigin + '/admin/';
    return `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<title>ورود با موفقیت</title>
<style>
body{font-family:system-ui,sans-serif;background:#0a0e17;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{background:#111827;border:1px solid #22d3ee;border-radius:12px;padding:32px;max-width:420px;text-align:center}
.ok{color:#4ade80;font-size:40px}
p{color:#94a3b8;line-height:1.8}
a{color:#22d3ee}
</style></head><body>
<div class="box">
<div class="ok">✓</div>
<h2>ورود موفق بود</h2>
<p>پنجره رو ببند و به داشبورد برگرد.</p>
<p id="err" style="display:none;color:#f87171"></p>
<p>اگه پنجره بسته نشد: <a href="${adminUrl}" onclick="window.opener=null;">بازگشت به داشبورد</a></p>
</div>
<script>
(function () {
    var data = ${json};
    if (window.opener) {
        try {
            window.opener.postMessage(data, '${safeOrigin}');
        } catch (e) {
            try { window.opener.postMessage(data, '*'); } catch (e2) {}
        }
        try { window.close(); } catch (e) {}
    } else if (data.error) {
        var el = document.getElementById('err');
        el.style.display = 'block';
        el.textContent = 'خطا: ' + data.error;
    } else {
        document.body.innerHTML = document.body.innerHTML;
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