import { monkeyWindow, Lib } from '../services/client.js';
import { Control, Param } from '../core/config.js';

/* 阻擋廣告 (目前無效) */
export default (async () => {
    if (!Param.IsMainPage) return;

    Lib.addStyle(`
        html {pointer-events: none !important;}
        div[style*='position'] {display: none !important;}
        .mh_wrap a,
        .mh_readend a,
        span.mh_btn:not(.contact),
        #${Control.IdList.Iframe} {
            pointer-events: auto !important;
        }
    `, Control.IdList.Block);

    if (import.meta.hot && monkeyWindow.AdBlock) return;

    const OriginListener = EventTarget.prototype.addEventListener;
    const Block = Control.BlockListener;

    EventTarget.prototype.addEventListener = new Proxy(OriginListener, {
        apply(target, thisArg, args) {
            const [type, listener, options] = args;
            if (Block.has(type)) return;
            return target.apply(thisArg, args);
        }
    });


    // 雖然性能開銷比較高, 但比較不會跳一堆錯誤訊息
    const iframe = `iframe:not(#${Control.IdList.Iframe})`;
    const AdCleanup = () => {
        Lib.$qa(iframe).forEach(ad => ad.remove());
        Lib.body?.$qa("script").forEach(ad => ad.remove());
        requestIdleCallback(AdCleanup, { timeout: 300 });
    };

    AdCleanup();

    if (import.meta.hot) monkeyWindow.AdBlock = true;
})();