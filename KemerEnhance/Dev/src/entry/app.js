import { monkeyWindow, Lib } from '../services/client.js';
import { User_Config, Parame, Page } from '../core/config.js';

import globalLoader from '../core/globalFunc/_loader_.js';
import previewLoader from '../core/previewFunc/_loader_.js';
import contentLoader from '../core/contentFunc/_loader_.js';

import MenuFactory from '../core/menu.js';

export default function Main() {
    const Enhance = (() => {
        const runningOrder = {
            Global: [
                "BlockAds",
                "CacheFetch",
                "SidebarCollapse",
                "DeleteNotice",
                "TextToLink",
                "BetterPostCard",
                "KeyScroll"
            ],
            Preview: [
                "CardText",
                "CardZoom",
                "NewTabOpens",
                "QuickPostToggle",
                "BetterThumbnail"
            ],
            Content: [
                "LinkBeautify",
                "VideoBeautify",
                "OriginalImage",
                "ExtraButton",
                "CommentFormat",
            ],
        };

        // 加載函數
        const loadFunc = {
            Global: globalLoader,
            Preview: previewLoader,
            Content: contentLoader
        };

        // 解析配置調用對應功能
        async function call(page, config = User_Config[page]) {
            const func = loadFunc[page]; // 載入對應函數

            for (const ord of runningOrder[page]) {
                let userConfig = config[ord]; // 載入對應的用戶配置

                if (!userConfig) continue;
                if (typeof userConfig !== "object") {
                    userConfig = { enable: true };
                } else if (!userConfig.enable) continue;

                // 更輕量化的直接呼叫 (沒有驗證數據格式)
                func[ord]?.(userConfig);
            }
        };

        return {
            async run() {
                call("Global");

                if (Page.isPreview()) call("Preview");
                else if (Page.isContent()) {
                    MenuFactory.postViewInit();
                    call("Content"); // 呼叫功能
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