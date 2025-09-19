import { Lib } from '../services/client.js';
import { Control, Param } from '../core/config.js';


const Tools = (() => {
    const idWhiteList = new Set(Object.values(Control.IdList));

    /* 存取會話數據 */
    const storage = (key, value = null) => {
        return value != null
            ? Lib.session(key, { value: value })
            : Lib.session(key);
    };

    /* 檢測到頂 */
    const topDetected = Lib.$throttle(() => {
        Param.Up_scroll = Lib.sY == 0 ? (storage("scroll", false), false) : true;
    }, 1000);

    /* 檢測到底 */
    const isTheBottom = () => Lib.sY + Lib.iH >= document.documentElement.scrollHeight;
    const bottomDetected = Lib.$throttle(() => {
        if (Param.DetectSkip) return;
        Param.Down_scroll = isTheBottom() ? (storage("scroll", false), false) : true;
    }, 1000);

    return {
        storage,

        /* 獲取設置 */
        getSet: () => {
            // 目前只有取得樣式
            return Lib.getV("Style", {
                "BG_Color": "#595959",
                "Img_Bw": "auto",
                "Img_Mw": "100%"
            });
        },

        /* 取得釋放節點 */
        getNodes(Root) {
            const nodes = [];

            function task(root) {
                const tree = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: (node) => {
                            if (idWhiteList.has(node.id)) {
                                return NodeFilter.FILTER_REJECT;
                            }
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                );

                while (tree.nextNode()) {
                    nodes.push(tree.currentNode);
                }
            };

            task(Root.head);
            task(Root.body);

            return nodes;
        },

        /* 自動滾動 */
        autoScroll(move) {
            requestAnimationFrame(() => {
                if (Param.Up_scroll && move < 0) {
                    window.scrollBy(0, move);
                    topDetected();
                    this.autoScroll(move);
                } else if (Param.Down_scroll && move > 0) {
                    window.scrollBy(0, move);
                    bottomDetected();
                    this.autoScroll(move);
                }
            })
        },
        /* 手動滾動 */
        manualScroll(move) {
            window.scrollBy({
                left: 0,
                top: move,
                behavior: "smooth"
            });
        },

        /* 檢測是否是最後一頁 (當是最後一頁, 就允許繼續處發翻頁跳轉) */
        isFinalPage(link) {
            Param.IsFinalPage = link.startsWith("javascript");
            return Param.IsFinalPage;
        },
        /* 篩選出可見的圖片 */
        visibleObjects: (object) => object.filter(img => img.height > 0 || img.src),
        /* 取得物件的倒數第二 */
        lastObject: (object) => object.length > 1 ? object.at(-2) ?? object.at(-1) : object[0],
        /* 總圖片數的 50 % */
        detectionValue(object) {
            return this.visibleObjects(object).length >= Math.floor(object.length * .5)
        },
    }
})();

export default Tools;