import { Lib } from '../../services/client.js';
import { Parame, Page } from '../config.js';

/* 緩存請求 */
export default async function CacheFetch() {
    if (Page.isNeko || Parame.Registered.has("CacheFetch")) return;

    const cacheKey = "fetch_cache_data";
    const cache = await Parame.DB.get(cacheKey, new Map());
    const saveCache = Lib.debounce(() => {
        Parame.DB.set(cacheKey, cache, { expireStr: "5m" }); // 有效 5 分鐘緩存 (每次都刷新)
    }, 1e3);

    // unsafeWindow 是 瀏覽器環境, window 是 sandbox 環境
    const originalFetch = { Sandbox: window.fetch, Window: unsafeWindow.fetch };

    window.fetch = (...args) => fetchWrapper(originalFetch.Sandbox, ...args);
    unsafeWindow.fetch = (...args) => fetchWrapper(originalFetch.Window, ...args);

    async function fetchWrapper(windowContext, ...args) {
        const input = args[0];
        const options = args[1] || {};

        if (!input) return windowContext(...args);

        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url || '';
        const method = options.method || (typeof input === 'object' ? input.method : 'GET') || 'GET';

        // 不是 GET 請求 或 有 X-Bypass-CacheFetch 標頭 或 url 結尾為 random
        if (method.toUpperCase() !== 'GET' || options.headers?.['X-Bypass-CacheFetch'] || url.endsWith("random")) {
            return windowContext(...args);
        }

        // 如果快取命中，立即返回快取中的 Response
        if (cache.has(url)) {
            const cached = cache.get(url);
            return new Response(cached.body, {
                status: cached.status,
                headers: cached.headers
            })
        }

        // 執行請求與非阻塞式快取
        try {
            // 等待原始請求完成
            const response = await windowContext(...args);

            // 檢查是否滿足所有快取條件
            if (response.status === 200 && (url.includes('api') || url.includes('default_config'))) {

                // 使用一個立即執行的 async 函式 (IIFE) 來處理快取儲存。
                (async () => {
                    try {
                        const responseClone = response.clone();
                        const bodyText = await responseClone.text();

                        // 檢查是否有實際內容
                        if (bodyText) {
                            cache.set(url, {
                                body: bodyText,
                                status: responseClone.status,
                                headers: responseClone.headers
                            });

                            saveCache();
                        }
                    } catch { }
                })();
            }

            return response;
        } catch (error) {
            throw error;
        }
    };

    Parame.Registered.add("CacheFetch");
};