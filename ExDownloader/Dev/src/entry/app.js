import { Lib } from '../services/client.js';
import { DConfig } from '../core/config.js';

import Transl from '../shared/language.js';
import Downloader from '../core/downloader.js';

export default function Main() {
    const eRegex = /https:\/\/e-hentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;
    const exRegex = /https:\/\/exhentai\.org\/g\/\d+\/[a-zA-Z0-9]+/;

    let Download, downloadButton;
    let Url = Lib.url.split("?p=")[0]; // 獲取網址

    /* 初始化按鈕樣式 */
    async function initStyle() {
        const position = `
            .Download_Button {
                float: right;
                width: 12rem;
                cursor: pointer;
                font-weight: 800;
                line-height: 20px;
                border-radius: 5px;
                position: relative;
                padding: 5px 5px;
                font-family: arial, helvetica, sans-serif;
            }
        `;
        const eStyle = `
            .Download_Button {
                color: #5C0D12;
                border: 2px solid #9a7c7e;
                background-color: #EDEADA;
            }
            .Download_Button:hover {
                color: #8f4701;
                border: 2px dashed #B5A4A4;
            }
            .Download_Button:disabled {
                color: #B5A4A4;
                border: 2px dashed #B5A4A4;
                cursor: default;
            }
        `;
        const exStyle = `
            .Download_Button {
                color: #b3b3b3;
                border: 2px solid #34353b;
                background-color: #2c2b2b;
            }
            .Download_Button:hover {
                color: #f1f1f1;
                border: 2px dashed #4f535b;
            }
            .Download_Button:disabled {
                color: #4f535b;
                border: 2px dashed #4f535b;
                cursor: default;
            }
        `;

        const style = Lib.$domain === "e-hentai.org" ? eStyle : exStyle;
        Lib.addStyle(`${position}${style}`, "Downloader-Button-Style");
    };

    /* 下載範圍設置 */
    async function downloadRangeSetting() {
        const scope = prompt(Transl("範圍設置"));
        if (scope == null) return;

        const yes = confirm(`${Transl("確認設置範圍")}:\n${scope}`);
        if (yes) DConfig.Scope = scope;
    };

    /* 下載模式切換 */
    async function downloadModeSwitch() {
        if (DConfig.Lock) {
            alert(Transl("下載中鎖定"));
            return;
        };

        DConfig.CompressMode
            ? Lib.setV("CompressedMode", false)
            : Lib.setV("CompressedMode", true);

        downloadButton?.remove();
        buttonCreation();
    };

    /* 按鈕創建 */
    async function buttonCreation() {
        Lib.waitEl("#gd2", null, { raf: true }).then(gd2 => {

            DConfig.CompressMode = Lib.getV("CompressedMode", true);
            DConfig.ModeDisplay = DConfig.CompressMode ? Transl("壓縮下載") : Transl("單圖下載");

            downloadButton = Lib.createElement(gd2, "button", {
                id: "ExDB",
                class: "Download_Button",
                text: DConfig.ModeDisplay,
                on: {
                    click: () => {
                        Download ??= Downloader()
 
                        DConfig.Lock = true;
                        downloadButton.disabled = true;
                        downloadButton.$text(Transl("開始下載"));

                        Download(Url, downloadButton);
                    }
                }
            })
        });
    };

    /* 初始化判斷加載 */
    if (eRegex.test(Url) || exRegex.test(Url)) {

        initStyle();
        DConfig.TitleCache = Lib.title();

        buttonCreation();

        if (Lib.getSession(DConfig.GetKey())) {
            Lib.regMenu({
                [Transl("🚮 清除數據緩存")]: () => {
                    Lib.delSession(DConfig.GetKey());
                    Lib.unMenu("ClearCache-1");
                }
            }, { name: "ClearCache" });
        };

        Lib.regMenu({
            [Transl("🔁 切換下載模式")]: () => downloadModeSwitch(),
            [Transl("⚙️ 下載範圍設置")]: () => downloadRangeSetting()
        });

    };

    if (import.meta.hot) {
        return function () {
            Lib.title(DConfig.TitleCache);
            downloadButton?.remove();
            Lib.delHead("Downloader-Button-Style");
        }
    };
};