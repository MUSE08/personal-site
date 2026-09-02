function renderHtml(origin, provider, token, user, error) {
    const payload = {
        provider,
        token,
        user,
        error
    };
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
(function () {
    var data = ${json};
    function closeMe() {
        try { window.close(); } catch (e) {}
    }
    if (window.opener) {
        window.opener.postMessage(data, '${origin.replace(/'/g, "\\'")}');
        closeMe();
    } else {
        document.body.textContent = JSON.stringify(data);
    }
}());
</script></body></html>`;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const origin = url.origin;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const provider = url.searchParams.get('provider') || 'github';
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;

    const fail = (msg) => new Response(renderHtml(origin, provider, null, null, msg), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

    if (!clientId || !clientSecret) return fail('OAuth env not configured');
    if (!code) return fail('Missing authorization code');

    const cookies = request.headers.get('Cookie') || '';
    const m = cookies.match(/(?:^|;\s*)cms_state=([^;]+)/);
    if (m && m[1] !== state) return fail('State mismatch');

    try {
        const tokRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                state
            })
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
        const res = new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        res.headers.append('Set-Cookie', 'cms_state=; Path=/; HttpOnly; Max-Age=0');
        return res;
    } catch (err) {
        return fail(String(err));
    }
}
