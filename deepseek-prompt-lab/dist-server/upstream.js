export function buildUpstreamUrl(baseUrl, resource) {
    let url;
    try {
        url = new URL(baseUrl);
    }
    catch {
        throw new Error('接口地址必须是有效的 HTTP URL。');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('接口地址必须使用 HTTP 或 HTTPS 协议。');
    }
    url.search = '';
    url.hash = '';
    const basePath = url.pathname.replace(/\/+$/, '');
    const versionedPath = /\/v1$/i.test(basePath) ? basePath : `${basePath}/v1`;
    url.pathname = `${versionedPath}/${resource}`.replace(/\/{2,}/g, '/');
    return url.toString();
}
