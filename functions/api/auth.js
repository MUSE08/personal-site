export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const provider = url.searchParams.get('provider') || 'github';
        const clientId = env.GITHUB_CLIENT_ID;
        if (!clientId) {
            return new Response('GITHUB_CLIENT_ID not configured', { status: 500 });
        }

        const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
        const redirectUri = `${url.origin}/api/auth/callback?provider=${provider}`;

        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'repo user');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('allow_signup', 'true');

        return new Response(null, {
            status: 302,
            headers: {
                Location: authUrl.toString(),
                'Set-Cookie': `cms_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
            }
        });
    } catch (err) {
        return new Response('Auth begin error: ' + String(err), { status: 500 });
    }
}