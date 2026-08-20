import { Lib } from '../../services/client.js';
import { Parame, Page } from '../config.js';

/* 緩存請求 */
export default async function CacheReq() {
    if (Page.isNeko || Parame.Registered.has("CacheReq")) return;

    const cacheMaxCount = 500; // 緩存最大數量
    const cacheKey = "fetch_cache_data";

    const cache = await Parame.DB.get(cacheKey, new Map());
    const saveCache = Lib.debounce(() => {
        Parame.DB.set(cacheKey, cache, { expireStr: "10m" }); // 有效 10 分鐘緩存
    }, 1e3);

    function setCache(url, data) {
        // 若 key 已存在，先刪除，setCache 時能重新排到 Map 最尾端（標記為最新）
        if (cache.has(url)) {
            cache.delete(url);
        }
        // 超過數量限制，刪除最舊的第一筆
        else if (cache.size >= cacheMaxCount) {
            cache.delete(cache.keys().next().value);
        }

        cache.set(url, data);
        saveCache();
    };

    // unsafeWindow 是 瀏覽器環境, window 是 sandbox 環境
    const originalFetch = { sandbox: window.fetch, window: unsafeWindow.fetch };
    unsafeWindow.fetch = (...args) => fetchWrapper(originalFetch.window, ...args);

    async function fetchWrapper(windowContext, ...args) {
        const [input, options = {}] = args;
        if (!input) return windowContext(...args);

        const url = typeof input === 'string' ? input : (input.url || input.href || '');
        const rawMethod = options.method || input.method || 'GET';

        const isGet = rawMethod === 'GET' || rawMethod === 'get';

        const headers = options.headers;
        const bypassHeader = typeof headers?.get === 'function' ? headers.get('X-Bypass-CacheReq') : headers?.['X-Bypass-CacheReq'];

        // 不是 GET 請求 或 有 X-Bypass-CacheReq 標頭 或 url 結尾為 random
        if (!isGet || bypassHeader || url.endsWith('random')) {
            return windowContext(...args);
        }

        // 如果快取命中，立即返回快取中的 Response
        if (cache.has(url)) {
            const { body, status, headers } = cache.get(url);
            return new Response(body, { status, headers });
        }

        // 未命中，執行請求與背景快取處理
        const response = await windowContext(...args);
        if (response.status === 200 && (url.includes('api') || url.includes('default_config'))) {
            const clone = response.clone();
            clone.text().then(bodyText => {
                if (bodyText) {
                    setCache(url, { body: bodyText, status: clone.status, headers: clone.headers });
                }
            }).catch(() => { });
        }

        return response;
    };

    if (Page.isPawchive) {
        // ! 該網站的特供版寫法, 用 Proxy 寫雖然更乾淨, 但在該網站的實現會有問題

        const XHR = unsafeWindow.XMLHttpRequest;
        const { open, setRequestHeader, send } = XHR.prototype;

        XHR.prototype.open = function (method, url, ...args) {
            this._url = url;
            this._isGet = method === 'GET' || method === 'get';
            return open.call(this, method, url, ...args);
        };

        XHR.prototype.setRequestHeader = function (name, value) {
            // 若特定 Header 需要 Bypass，才記錄
            if (name === 'X-Bypass-CacheReq') this._bypass = true;
            return setRequestHeader.call(this, name, value);
        };

        XHR.prototype.send = function (...args) {
            const url = this._url;

            // 快取條件判斷（只走 GET、非 bypass、非 random URL）
            const canCache = this._isGet && !this._bypass && url && !url.endsWith('random');

            // 命中快取
            if (canCache && cache.has(url)) {
                const cachedDomString = cache.get(url);

                queueMicrotask(() => {
                    Object.defineProperties(this, {
                        readyState: { value: 4 },
                        status: { value: 200 },
                        statusText: { value: 'OK' },
                        responseText: { value: cachedDomString },
                        response: { value: cachedDomString }
                    });

                    if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                    if (typeof this.onload === 'function') this.onload();
                    this.dispatchEvent(new Event('load'));
                    this.dispatchEvent(new Event('loadend'));
                });

                return; // 阻斷真實網路發送
            }

            // 未命中快取
            if (canCache) {
                this.addEventListener('load', () => {
                    if (this.status === 200 && this.responseText) {
                        setCache(url,
                            this.responseText
                                .trim()
                                .replace(/\s+(?=[^<]*>)/g, ' ')
                                .replace(/>\s+</g, '><')
                        );
                    }
                });
            }

            // 正常請求
            return send.apply(this, args);
        };
    };

    Parame.Registered.add("CacheReq");
};