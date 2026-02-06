import { monkeyWindow, Lib } from '../services/client.js';
import { User_Config, Parame, Page } from '../core/config.js';

import globalLoader from '../core/globalFunc/_loader_.js';
import previewLoader from '../core/previewFunc/_loader_.js';
import contentLoader from '../core/contentFunc/_loader_.js';

import MenuFactory from '../core/menu.js';

export default function Main() {
    const Enhance = (() => {

        // 加載函數映射
        const loadFunc = {
            Global: globalLoader,
            Preview: previewLoader,
            Content: contentLoader
        };

        // 呼叫函數
        async function call(runPage) {
            const config = User_Config[runPage] ?? {}; // 載入對應用戶配置

            for (const [name, func] of Object.entries(loadFunc[runPage] ?? {})) {
                let cfg = config[name]; // 載入對應名稱的用戶配置

                if (!cfg || !func) continue;
                if (typeof cfg !== "object") {
                    cfg = { enable: true };
                } else if (!cfg.enable) continue;

                // 直接呼叫 (沒有驗證數據格式)
                func(cfg);
            }
        };

        return {
            async run() {
                call("Global");

                if (Page.isPreview()) call("Preview");
                else if (Page.isContent()) {
                    MenuFactory.postViewInit(); // 菜單與配置初始化
                    call("Content");
                    MenuFactory.menuInit();
                }
            }
        }
    })();

    Enhance.run();

    if (import.meta.hot) {
        const waitDom = monkeyWindow["waitDom"] ??= new MutationObserver(() => {
            waitDom.disconnect();
            Enhance.run();
        });

        monkeyWindow["onUrlChange"] ??= Lib.onUrlChange(change => {
            Parame.Url = change.url;

            waitDom.observe(document, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            })

            Lib.body.$sAttr("Enhance", true);
        });
    } else {
        // 等待 DOM 更新
        const waitDom = new MutationObserver(() => {
            waitDom.disconnect();
            Enhance.run();
        });

        // 監聽網址變化
        Lib.onUrlChange(change => {
            Parame.Url = change.url;

            waitDom.observe(document, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            })

            Lib.body.$sAttr("Enhance", true); // 避免沒監聽到變化
        });
    };

    if (import.meta.hot) {
        return function () {
            // 禁止重新加載的變數 進行緩存
            monkeyWindow["openDB"] = Parame.DB;
            monkeyWindow["Registered"] = Parame.Registered;
        };
    }
};