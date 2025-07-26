import {
    monkeyWindow,
    GM_info,
    GM_setValue,
    GM_getValue,
    GM_download,
    GM_openInTab,
    GM_xmlhttpRequest,
    GM_registerMenuCommand,
    GM_unregisterMenuCommand,
} from 'vite-plugin-monkey/dist/client';
const { Syn, md5, saveAs } = monkeyWindow; // 外部函數

import Config from './config.js'; // 腳本配置
import Dict from './language.js'; // 腳本語言
import Fetch from './fetch.js'; // 抓取數據
import Menu from './menu.js'; // 導入菜單模塊
import Downloader from './downloader.js'; // 下載數據

const { General, FileName, FetchSet, Process } = Config(Syn);
const { Transl } = (() => { // 取得對應語言翻譯
    const Matcher = Syn.TranslMatcher(Dict);
    return {
        Transl: (Str) => Matcher[Str] ?? Str,
    }
})();

(new class Main {
    constructor() {
        this.Download = null;
        this.Content = (URL) => /^(https?:\/\/)?(www\.)?.+\/.+\/user\/.+\/post\/.+$/.test(URL),
            this.Preview = (URL) => /^(https?:\/\/)?(www\.)?.+\/posts\/?(\?.*)?$/.test(URL)
                || /^(https?:\/\/)?(www\.)?.+\/.+\/user\/[^\/]+(\?.*)?$/.test(URL)
                || /^(https?:\/\/)?(www\.)?.+\/dms\/?(\?.*)?$/.test(URL)

        this.Menu = Menu(Syn, Transl, General, FileName, FetchSet);
    }

    /* 按鈕創建 */
    async ButtonCreation() {
        Syn.WaitElem(".post__body h2, .scrape__body h2", null, { raf: true, all: true, timeout: 10 }).then(Files => {
            Syn.AddStyle(`
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

            Syn.$q("#Button-Container")?.remove(); // 重複時刪除舊的容器

            try {

                // 創建 Span (找到含有 Files 文本的對象)
                Files = [...Files].filter(file => file.$text() === "Files");
                if (Files.length == 0) return;

                const CompressMode = Syn.Local("Compression", { error: true });
                const ModeDisplay = CompressMode ? Transl("壓縮下載") : Transl("單圖下載");

                this.Download ??= Downloader( // 懶加載 Download 類
                    GM_unregisterMenuCommand, GM_xmlhttpRequest, GM_download,
                    General, FileName, Process, Transl, Syn, saveAs
                );

                // 添加按鈕容器
                Syn.createElement(Files[0], "span", {
                    id: "Button-Container",
                    on: {
                        type: "click",
                        listener: event => {
                            const target = event.target;

                            if (target.tagName === "BUTTON") {
                                let Instantiate = null;
                                Instantiate = new this.Download(CompressMode, ModeDisplay, target);
                                Instantiate.DownloadTrigger();
                            } else if (target.closest("svg")) {
                                this.Menu.open(); // 打開設置菜單
                            }
                        },
                        add: { capture: true, passive: true }
                    },
                    innerHTML: `
                            <svg class="Setting_Button" xmlns="http://www.w3.org/2000/svg" height="1.3rem" viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>
                            <button class="Download_Button" ${Process.Lock ? "disabled" : ""}>${Process.Lock ? Transl("下載中鎖定") : ModeDisplay}</button>
                        `
                });

            } catch (error) {
                Syn.Log("Button Creation Failed", error, { dev: General.Dev, type: "error", collapsed: false });

                const Button = Syn.$q('#Button-Container button');
                if (Button) {
                    Button.disabled = true;
                    Button.textContent = Transl("無法下載");
                }
            }
        })
    }

    /* 一鍵開啟當前所有帖子 */
    async OpenAllPages() {
        const card = Syn.$qa("article.post-card a");
        if (card.length == 0) { throw new Error("No links found") }

        let scope = prompt(`(${Transl("當前帖子數")}: ${card.length})${Transl("開帖說明")}`);
        if (scope == null) return;

        scope = scope === "" ? "1-50" : scope;
        for (const link of Syn.ScopeParsing(scope, card)) {
            GM_openInTab(link.href, {
                insert: false,
                setParent: false
            });
            await Syn.Sleep(General.BatchOpenDelay);
        }
    }

    /* 下載模式切換 */
    async DownloadModeSwitch() {
        Syn.Local("Compression", { error: true })
            ? Syn.Local("Compression", { value: false })
            : Syn.Local("Compression", { value: true });
        this.ButtonCreation();
    }

    /* 檢測創建 [ 檢測頁面創建按鈕, 創建菜單 ] */
    async Init() {
        let FetchData;
        const self = this;

        // 下載模式 native, disabled, browser
        GM_info.downloadMode = "browser";
        GM_info.isIncognito = true;

        // 首次載入嘗試註冊
        registerMenu(Syn.$url);
        self.Content(Syn.$url) && self.ButtonCreation();

        /* 註冊菜單 */
        async function registerMenu(Page) {
            if (self.Content(Page)) {
                Syn.Menu({
                    [Transl("🔁 切換下載模式")]: { func: () => self.DownloadModeSwitch(), close: false, hotkey: "c" }
                }, { reset: true });
            } else if (self.Preview(Page)) {
                FetchData ??= Fetch( // 懶加載 FetchData 類
                    General, Process, Transl, Syn, md5
                );

                Syn.Menu({
                    [Transl("📑 獲取帖子數據")]: () => {
                        if (Process.IsNeko) { // 暫時還沒修復 (懶得修)
                            alert("Temporarily Not Supported");
                            return;
                        }

                        if (!Process.Lock) {
                            let Instantiate = null;
                            Instantiate = new FetchData(FetchSet.Delay, FetchSet.AdvancedFetch, FetchSet.ToLinkTxt);
                            FetchSet.UseFormat && Instantiate.FetchConfig(FetchSet.Mode, FetchSet.Format);
                            Instantiate.FetchInit();
                        }
                    },
                    [Transl("📃 開啟當前頁面帖子")]: self.OpenAllPages
                }, { reset: true });

                if (General.Dev && !Process.IsNeko) {
                    Syn.Menu({ // 不支援 Neko, 抓取邏輯不同
                        "🛠️ 開發者獲取": () => {
                            const ID = prompt("輸入請求的 ID");
                            if (ID == null || ID === "") return; // 開發用的不做防呆

                            let Instantiate = null;
                            Instantiate = new FetchData(FetchSet.Delay, FetchSet.AdvancedFetch, FetchSet.ToLinkTxt);
                            FetchSet.UseFormat && Instantiate.FetchConfig(FetchSet.Mode, FetchSet.Format);
                            Instantiate.FetchTest(ID); // 只專注於測試 進階抓取, 如果用一般模式會報錯
                        },
                    }, { index: 3 });
                }
            }
        };

        Syn.onUrlChange(change => {
            self.Content(change.url) && self.ButtonCreation();
            registerMenu(change.url);
        });

    }
}).Init();