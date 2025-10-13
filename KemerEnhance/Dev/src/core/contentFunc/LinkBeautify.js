import { Lib } from "../../services/client";
import { Page } from "../config";

import Fetch from "../../utils/fetch";

const LinkBeautifyFactory = () => {
    const showBrowse = (browse, retry = 3) => {
        if (!retry) return;

        browse.style.position = "relative"; // 修改樣式避免跑版
        browse.$q("View")?.remove(); // 查找是否存在 View 元素, 先將其刪除

        Fetch.send(
            browse.href?.replace("posts/archives", "api/v1/file"),
            json => {
                const password = json.password;
                browse.$iAdjacent(`
                    <view>
                        ${password ? `password: ${password}<br>` : ""}
                        ${json.file_list.map(file => `${file}<br>`).join("")}
                    </view>`
                );
            }
        ).catch(() => {
            setTimeout(() => showBrowse(browse, retry - 1), 1e3);
        })
    };

    return {
        /* 懸浮於 browse » 標籤時, 直接展示文件, 刪除下載連結前的 download 字樣, 並解析轉換連結 */
        async LinkBeautify() {
            Lib.addStyle(`
                View {
                    top: -10px;
                    z-index: 1;
                    padding: 10%;
                    display: none;
                    overflow: auto;
                    color: #f2f2f2;
                    font-size: 14px;
                    max-height: 50vh;
                    font-weight: 600;
                    text-align: center;
                    position: absolute;
                    white-space: nowrap;
                    border-radius: .5rem;
                    left: calc(100% + 10px);
                    border: 1px solid #737373;
                    background-color: #3b3e44;
                }
                a:hover View { display: block }
                .post__attachment .fancy-link::after {
                    content: "";
                    position: absolute;
                    height: 100%;
                    padding: .4rem;
                }
                .post__attachment-link:not([beautify]) { display: none !important; }
            `, "Link-Effects", false);

            Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {
                for (const link of post) {

                    // 過濾先前處理層
                    if (!Page.isNeko && link.$gAttr("beautify")) {
                        link.remove();
                        continue;
                    };

                    const text = link.$text().replace("Download ", ""); // 修正原文本

                    if (Page.isNeko) {
                        link.$text(text);
                        link.$sAttr("download", text);
                    } else {
                        // ! 該站點是 React 渲染的, 直接修改會導致變更異常
                        link.$iAdjacent(
                            `<a class="${link.$gAttr("class")}" href="${link.href}" download="${text}" beautify="true">${text}</a>`,
                            "beforebegin"
                        )
                    };

                    const browse = link.nextElementSibling; // 查找是否含有 browse 元素
                    if (!browse || browse.$text() !== "browse »") continue;
                    showBrowse(browse); // 請求顯示 browse 數據
                }
            });
        }
    }
};

export default LinkBeautifyFactory;