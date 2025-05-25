export default function Tools(Syn, Config, Control, Param) {
    const IdWhiteList = new Set(Object.values(Control.IdList));

    /* 存取會話數據 */
    const Storage = (key, value = null) => {
        return value != null
            ? Syn.Session(key, { value: value })
            : Syn.Session(key);
    };

    /* 檢測到頂 */
    const TopDetected = Syn.Throttle(() => {
        Param.Up_scroll = Syn.sY() == 0 ? (Storage("scroll", false), false) : true;
    }, 1000);

    /* 檢測到底 */
    const IsTheBottom = () => Syn.sY() + Syn.iH() >= document.documentElement.scrollHeight;
    const BottomDetected = Syn.Throttle(() => {
        if (Config.AutoTurnPage.Mode <= 3) return; // ! 臨時寫法, 當翻頁模式為 1,2,3 時不會觸發
        Param.Down_scroll = IsTheBottom() ? (Storage("scroll", false), false) : true;
    }, 1000);

    return {
        Storage,

        /* 獲取設置 */
        GetSet: () => {
            // 目前只有取得樣式
            return Syn.gV("Style", {
                "BG_Color": "#595959",
                "Img_Bw": "auto",
                "Img_Mw": "100%"
            });
        },

        /* 取得釋放節點 */
        Get_Nodes(Root) {
            const nodes = [];

            function Task(root) {
                const tree = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_ELEMENT,
                    {
                        acceptNode: (node) => {
                            if (IdWhiteList.has(node.id)) {
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

            Task(Root.head);
            Task(Root.body);

            return nodes;
        },

        /* 自動滾動 */
        AutoScroll(move) {
            requestAnimationFrame(() => {
                if (Param.Up_scroll && move < 0) {
                    window.scrollBy(0, move);
                    TopDetected();
                    this.AutoScroll(move);
                } else if (Param.Down_scroll && move > 0) {
                    window.scrollBy(0, move);
                    BottomDetected();
                    this.AutoScroll(move);
                }
            })
        },
        /* 手動滾動 */
        ManualScroll(move) {
            window.scrollBy({
                left: 0,
                top: move,
                behavior: "smooth"
            });
        },

        /* 檢測是否是最後一頁 (當是最後一頁, 就允許繼續處發翻頁跳轉) */
        FinalPage(link) {
            Param.IsFinalPage = link.startsWith("javascript");
            return Param.IsFinalPage;
        },
        /* 篩選出可見的圖片 */
        VisibleObjects: (object) => object.filter(img => img.height > 0 || img.src),
        /* 取得物件的最後一項 */
        ObserveObject: (object) => object[Math.max(object.length - 2, 0)],
        /* 總圖片數的 50 % */
        DetectionValue(object) {
            return this.VisibleObjects(object).length >= Math.floor(object.length * .5)
        },
    };
};