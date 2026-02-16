import { Lib } from '../../services/client.js';
import { Parame, Page } from '../config.js';

/* (阻止/封鎖)廣告 */
export default async function BlockAds() {
    if (Page.isNeko) return;

    const cookieString = Lib.cookie();
    const required = ["ts_popunder", "ts_popunder-cnt"];
    const hasCookies = required.every(name => new RegExp(`(?:^|;\\s*)${name}=`).test(cookieString));

    if (!hasCookies) {
        const now = new Date();
        now.setFullYear(now.getFullYear() + 1);
        const expires = now.toUTCString();

        const cookies = {
            [required[0]]: now,
            [required[1]]: 1
        };

        for (const [key, value] of Object.entries(cookies)) {
            Lib.cookie(`${key}=${value}; domain=.${Lib.$domain}; path=/; expires=${expires};`);
        }
    };

    // 舊版白名單正則轉換
    // const adRegex = new RegExp("(?:" + domains.join("|").replace(/\./g, "\\.") + ")");

    if (Parame.Registered.has("BlockAds")) return;

    Lib.addStyle(`
        [class^="ad-"], [class^="root--"], [id^="ts_ad_native_"], [id^="ts_ad_video_"] { display: none !important }
    `, "Ad-blocking-style");

    const domains = new Set([
        "go.mnaspm.com", "tsyndicate.com", "go.reebr.com", "creative.reebr.com",
        "go.bluetrafficstream.com", "creative.bluetrafficstream.com",
        "tsvideo.sacdnssedge.com", "media-hls.growcdnssedge.com", "static-worker.ourdream.ai"
    ]);

    const originalFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = function (input) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url || '';
        try {
            if (url.endsWith(".m3u8")) return new Response(url, { status: 204 });
            if ((
                url.startsWith('http') || url.startsWith('//')
            ) && domains.has(new URL(url).host)) return new Response(url, { status: 204 });
        } catch { }
        return originalFetch.apply(this, arguments);
    };

    const originalRequest = unsafeWindow.XMLHttpRequest;
    unsafeWindow.XMLHttpRequest = new Proxy(originalRequest, {
        construct: function (target, args) {
            const xhr = new target(...args);
            return new Proxy(xhr, {
                get: function (target, prop, receiver) {
                    if (prop === 'open') {
                        return function (method, url) {
                            try {
                                if (url.endsWith(".m3u8")) return;
                                if ((
                                    url.startsWith('http') || url.startsWith('//')
                                ) && domains.has(new URL(url).host)) return;
                            } catch { }
                            return target[prop].apply(target, arguments);
                        };
                    }
                    return Reflect.get(target, prop, receiver);
                }
            })
        }
    });

    Parame.Registered.add("BlockAds");
};