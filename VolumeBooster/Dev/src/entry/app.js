import { monkeyWindow, Lib } from '../services/client.js';
import { Share } from '../core/config.js';
import Transl from '../shared/language.js';

import { bannedDomains } from '../utils/tools.js';
import Booster from '../core/booster.js';
import CreateMenu from '../core/menu.js';

export default function Main() {
    bannedDomains.isEnabled(status => {
        const regMenu = async (name) => { // 簡化註冊菜單
            Lib.regMenu({
                [name]: () => bannedDomains.addBanned()
            })
        };

        if (status) {
            Share.Menu = CreateMenu();
            Share.SetControl = (type, value) => { // 建立控制器
                Share.Parame[type] = value; // 更新增強參數 (原始值)
                Share.EnhancedNodes.forEach(items => {
                    items[type].value = value;
                })
            };

            // 查找媒體元素
            const findMedia = (func) => {
                const tree = document.createTreeWalker(
                    Lib.body,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: (node) => {
                            const tag = node.tagName;

                            if (tag === 'VIDEO' || tag === 'AUDIO') {
                                if (!Share.ProcessedElements.has(node))
                                    return NodeFilter.FILTER_ACCEPT;
                            };

                            return NodeFilter.FILTER_SKIP;
                        }
                    }
                );

                const media = [];
                while (tree.nextNode()) {
                    media.push(tree.currentNode);
                };

                media.length > 0 && func(media);
            };

            // 觀察者持續觸發查找
            Lib.observer(Lib.body, () => {
                if (Share.ProcessLock) return;

                findMedia(media => {
                    Share.ProcessLock = true;
                    Booster.trigger(media);
                })

            }, { mark: "Media-Booster", attributes: false, throttle: 500 }, ({ ob }) => {
                if (import.meta.hot) monkeyWindow.ob = ob;
                regMenu(Transl("❌ 禁用網域"));
            });

        } else regMenu(Transl("✅ 啟用網域"));
    });

    if (import.meta.hot) {
        return function () {
            monkeyWindow.ob?.disconnect();
        }
    }
};