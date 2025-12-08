import { General, Process } from "../core/config.js";
import { Lib } from "../services/client.js";

import UI from './menu.js';
import FetchData from '../core/fetch.js';
import Downloader from '../core/downloader.js';

import Transl from "../shared/language.js";

export default function Main() {
    const isContent = (URL) => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL);
    const isPreview = (URL) => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL)
        || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL)
        || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL);

    let download, menu;

    /* 一鍵開啟當前所有帖子 */
    async function openAllPages() {
        const card = Lib.$qa("article.post-card a");
        if (card.length == 0) { throw new Error("No links found") }

        let scope = prompt(`(${Transl("當前帖子數")}: ${card.length})${Transl("開帖說明")}`);
        if (scope == null) return;

        scope = scope === "" ? "1-50" : scope;
        for (const link of Lib.scopeParse(scope, card)) {
            GM_openInTab(link.href, {
                insert: false,
                setParent: false
            });

            await Lib.sleep(General.BatchOpenDelay);
        }
    };

    /* 按鈕創建 */
    async function buttonCreation() {
        Lib.waitEl(".post__body h2, .scrape__body h2", null, { raf: true, all: true, timeout: 10 }).then(Files => {
            if (Files.length === 0) return;

            Lib.addStyle(`
                #Button-Container {
                    padding: 1rem;
                    font-size: 40% !important;
                }
                #Button-Container svg {
                    fill: white;
                }
                .Setting_Button {
                    cursor: pointer;
                }
                .Download_Button {
                    color: hsl(0, 0%, 45%);
                    padding: 6px;
                    margin: 10px;
                    border-radius: 8px;
                    font-size: 1.1vw;
                    border: 2px solid rgba(59, 62, 68, 0.7);
                    background-color: rgba(29, 31, 32, 0.8);
                    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .Download_Button:hover {
                    color: hsl(0, 0%, 95%);
                    background-color: hsl(0, 0%, 45%);
                    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .Download_Button:disabled {
                    color: hsl(0, 0%, 95%);
                    background-color: hsl(0, 0%, 45%);
                    cursor: Synault;
                }
            `, "Download-button-style", false);

            try {
                Lib.$qa("[id^='Button-Container-']").forEach(button => button.remove()); // 移除已存在的按鈕

                const Pointer = [...Files].filter(file => {
                    const text = file.$text();
                    if (text === "Downloads" || text === "Files") {
                        file.id = text;
                        return true;
                    }
                    return false;
                })

                if (Pointer.length === 0) return;

                const CompressMode = Lib.getLocal("Compression", true);
                const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單獨下載");

                // 懶加載 download 類
                download ??= Downloader();
                Pointer.forEach((pointer, index) => {
                    // 添加按鈕容器
                    Lib.createElement(pointer, "span", {
                        id: `Button-Container-${index}`,
                        on: {
                            click: event => {
                                const target = event.target;

                                if (target.tagName === "BUTTON") {
                                    new download(CompressMode, ModeDisplay, target)
                                        .trigger(target.closest("h2").id); // 傳遞觸發類型
                                } else if (target.closest("svg")) {
                                    alert("Currently Invalid");
                                    // menu.open(); // 打開設置菜單
                                }
                            },
                        },
                        innerHTML: `
                            <svg class="Setting_Button" xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
                            <button class="Download_Button">${ModeDisplay}</button>
                        `
                    });
                })

            } catch (error) {
                Lib.log(error, { dev: General.Dev, group: "Button Creation Failed", collapsed: false }).error;

                const Button = Lib.$q('#Button-Container button');
                if (Button) {
                    Button.disabled = true;
                    Button.textContent = Transl("無法下載");
                }
            }
        })
    };

    /* 下載模式切換 */
    async function downloadModeSwitch() {
        if (Process.Lock) {
            alert(Transl("下載中鎖定")); // 下載也會暫時鎖定
            return;
        };

        Lib.getLocal("Compression", true)
            ? Lib.setLocal("Compression", false)
            : Lib.setLocal("Compression", true);

        buttonCreation();
    };

    /* 註冊菜單 */
    async function registerMenu(Page) {
        if (isContent(Page)) {
            Lib.regMenu({
                [Transl("🔁 切換下載模式")]: { func: () => downloadModeSwitch(), close: false, hotkey: "c" }
            }, { reset: true });
        } else if (isPreview(Page)) {
            Lib.regMenu({
                [Transl("📑 獲取帖子數據")]: () => {
                    if (!Process.Lock) {
                        new FetchData().fetchRun();
                    }
                },
                [Transl("📃 開啟當前頁面帖子")]: openAllPages
            }, { reset: true });

            if (General.Dev && !Process.IsNeko) {
                Lib.regMenu({ // 不支援 Neko, 抓取邏輯不同
                    "🛠️ 開發者獲取": () => {
                        const id = prompt("輸入請求的 ID");
                        if (id == null || id === "") return; // 開發用的不做防呆
                        new FetchData().fetchTest(id); // 只專注於測試 進階抓取, 如果用一般模式會報錯
                    },
                }, { index: 3 });
            }
        }
    };

    /* 檢測創建 [ 檢測頁面創建按鈕, 創建菜單 ] */
    // 首次載入嘗試註冊
    isContent(Lib.$url) && buttonCreation();
    registerMenu(Lib.$url);

    // ! 加載菜單 (等待重構)
    // menu = new UI();

    Lib.onUrlChange(change => {
        isContent(change.url) && buttonCreation();
        registerMenu(change.url);
    });
};