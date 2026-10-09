import { Lib } from '../../services/client.js';
import { Parame, Page } from '../config.js';

/* (阻止/封鎖)廣告 */
export default async function BlockAds() {
    if (Page.isNeko) return;

    Lib.addStyle(`
        [class^="ad-"], [class^="root--"], [id^="ts_ad_native_"], [id^="ts_ad_video_"], .▶ { display: none !important }
    `, { id: "Ad-blocking-style", repeatAdd: false });

    if (Parame.Registered.has("BlockAds")) return;

    if (Page.isPawchive) {
        const originalGetItem = unsafeWindow.Storage.prototype.getItem;
        unsafeWindow.Storage.prototype.getItem = function (key) {
            if (key.startsWith("__PPU_SESSION")) {
                const timer = new Date().getTime();
                return `0|${timer}|1|${timer}|1|0|0`;
            }
            return originalGetItem.call(this, key);
        };
    }
    else {
        // ! 也許不再需要
        const domains = new Set([
            "go.mnaspm.com", "tsyndicate.com", "go.reebr.com", "creative.reebr.com",
            "go.bluetrafficstream.com", "creative.bluetrafficstream.com",
            "tsvideo.sacdnssedge.com", "media-hls.growcdnssedge.com", "static-worker.ourdream.ai"
        ]);

        const originalFetch = unsafeWindow.fetch;
        unsafeWindow.fetch = function (input) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url || '';
            try {
                if (url.endsWith('.m3u8')) return new Response(url, { status: 204 });
                if ((
                    url.startsWith('http') || url.startsWith('//')
                ) && domains.has(new URL(url).host)) return new Response(url, { status: 204 });
            } catch { }
            return originalFetch.apply(this, arguments);
        };
    }

    Parame.Registered.add("BlockAds");
};