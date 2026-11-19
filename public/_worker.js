export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) return response;

    const isPreviewHost = url.hostname.endsWith('.pages.dev');
    const hasQuery = url.search.length > 1;
    if (!isPreviewHost && !hasQuery) return response;

    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.delete('Content-Length');

    return new HTMLRewriter()
      .on('link[rel="canonical"]', {
        element(element) {
          element.remove();
        },
      })
      .on('meta[name="robots"]', {
        element(element) {
          element.setAttribute('content', 'noindex, nofollow');
        },
      })
      .transform(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      );
  },
};
