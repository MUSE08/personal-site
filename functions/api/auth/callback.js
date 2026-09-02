function renderBody(status, content) {
    const html = `
    <script>
      const receiveMessage = (message) => {
        window.opener.postMessage(
          'authorization:github:${status}:${JSON.stringify(content)}',
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    </script>
    `;
    return html;
}

export async function onRequestGet(context) {
    try {
        const { request, env } = context;
        const client_id = env.GITHUB_CLIENT_ID;
        const client_secret = env.GITHUB_CLIENT_SECRET;
        const url = new URL(request.url);
        const code = url.searchParams.get('code');

        if (!client_id || !client_secret) {
            return new Response('OAuth env not configured', { status: 500 });
        }
        if (!code) return new Response(renderBody('error', { error: 'Missing code' }), { status: 400, headers: { 'content-type': 'text/html;charset=UTF-8' } });

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'cloudflare-functions-github-oauth-login-demo',
                'accept': 'application/json',
            },
            body: JSON.stringify({ client_id, client_secret, code }),
        });
        const result = await response.json();
        if (result.error) {
            return new Response(renderBody('error', result), {
                headers: { 'content-type': 'text/html;charset=UTF-8' },
                status: 401,
            });
        }
        const token = result.access_token;
        const provider = 'github';
        const responseBody = renderBody('success', { token, provider });
        return new Response(responseBody, {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
            status: 200,
        });
    } catch (error) {
        return new Response(renderBody('error', { error: String(error) }), {
            headers: { 'content-type': 'text/html;charset=UTF-8' },
            status: 500,
        });
    }
}