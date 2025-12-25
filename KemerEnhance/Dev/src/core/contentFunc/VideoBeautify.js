import { Lib } from "../../services/client";
import { Page } from "../config";

/* 調整影片區塊大小, 將影片名稱轉換成下載連結 */
export default async function VideoBeautify({ mode }) {
    if (Page.isNeko) {
        Lib.waitEl(".scrape__files video", null, { raf: true, all: true, timeout: 5 }).then(video => {
            video.forEach(media => media.$sAttr("preload", "metadata"));
        });
    } else {
        Lib.waitEl("ul[style*='text-align: center; list-style-type: none;'] li:not([id])", null, { raf: true, all: true, timeout: 5 }).then(parents => {
            Lib.waitEl(".post__attachment-link, .scrape__attachment-link", null, { raf: true, all: true, timeout: 5 }).then(post => {

                Lib.addStyle(`
                    .fluid_video_wrapper {
                        height: 50% !important;
                        width: 65% !important;
                        border-radius: 8px !important;
                    }
                `, "Video-Effects", false);

                const move = mode === 2;
                const linkBox = Object.fromEntries([...post].map(a => {
                    const data = [a.download?.trim(), a];

                    return data;
                }));

                for (const li of parents) {

                    const waitLoad = new MutationObserver(Lib.debounce(() => {
                        waitLoad.disconnect();

                        let [video, summary] = [
                            li.$q("video"),
                            li.$q("summary"),
                        ];

                        if (!video || !summary) return;

                        video.$sAttr("loop", true); // 開啟影片循環
                        video.$sAttr("preload", "metadata"); // 預載影片元數據

                        const link = linkBox[summary.$text()]; // 查找對應下載連結
                        if (!link) return;

                        move && link.parentElement.remove(); // 刪除對應下載連結

                        let element = link.$copy();
                        element.$sAttr("beautify", true); // ? LinkBeautify 的適應, 避免被隱藏
                        element.$text(element.$text().replace("Download", "")); // 修改載入連結

                        summary.$text("");
                        summary.appendChild(element);
                    }, 100));

                    // 監聽動態變化
                    waitLoad.observe(li, { attributes: true, characterData: true, childList: true, subtree: true });
                    li.$sAttr("Video-Beautify", true); // 容錯 (避免沒有監聽到動態變化)
                };

            })
        })
    }
};