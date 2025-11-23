import { Lib } from '../../services/client.js';
import { Parame, Page, Load } from '../config.js';

import Fetch from '../../utils/fetch.js';

const BetterPostCardFactory = async () => {
    const oldKey = "fix_record_v2";
    const recordKey = "better_post_record";

    // 數據轉移
    const oldRecord = Lib.getLocal(oldKey);
    if (oldRecord instanceof Array) {
        const r = await Parame.DB.set(recordKey, new Map(oldRecord));
        r === recordKey && Lib.delLocal(oldKey);
    };

    let recordCache; // 緩存修復紀錄
    const fixCache = new Map(); // 緩存修復後結果

    /* ===== 保存數據處理 ===== */
    const init = async () => {
        recordCache = await getRecord();
    };
    const getRecord = async () => await Parame.DB.get(recordKey, new Map());
    const saveRecord = async (save) => {
        await Parame.DB.set(recordKey, new Map([...await getRecord(), ...save]));
        fixCache.clear();
    };
    const saveWork = Lib.$debounce(() => saveRecord(fixCache), 1e3);

    /* ===== 外部數據請求 ===== */
    const fixRequest = async (url, headers = {}) => {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: headers,
                responseType: "json",
                onload: response => resolve(response),
                onerror: () => resolve(),
                ontimeout: () => resolve()
            })
        })
    };

    /* ===== 修復數據解析與處理 ===== */
    const replaceUrlTail = (url, tail) => {
        const uri = new URL(url);
        uri.pathname = tail;
        url = uri.href;
        return url;
    };

    const uriFormat1 = /\/([^\/]+)\/(?:user|server|creator|fanclubs)\/([^\/?]+)/;
    const uriFormat2 = /\/([^\/]+)\/([^\/]+)$/;
    const uriFormat3 = /^https?:\/\/([^.]+)\.([^.]+)\./;
    const specialServer = { x: "twitter", maker_id: "dlsite" };
    const supportServer = /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans|Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/i;
    // 解析所有內部網址, 與作者外部網址
    const parseUrlInfo = (uri) => {
        uri = uri.match(uriFormat1) || uri.match(uriFormat2) || uri.match(uriFormat3);
        if (!uri) return;

        return uri.splice(1).reduce((acc, str) => {
            if (supportServer.test(str)) {
                const cleanStr = str.replace(/\/?(www\.|\.com|\.to|\.jp|\.net|\.adult|user\?u=)/g, "");
                acc.server = specialServer[cleanStr] ?? cleanStr
            } else {
                acc.user = str;
            }

            return acc;
        }, {});
    };

    // 取得 Pixiv 名稱
    const getPixivName = async (id) => {
        const response = await fixRequest(
            `https://www.pixiv.net/ajax/user/${id}?full=1&lang=ja`, { referer: "https://www.pixiv.net/" }
        );
        if (response.status === 200) {
            const user = response.response;
            let user_name = user.body.name;
            user_name = user_name.replace(/(c\d+)?([日月火水木金土]曜日?|[123１２３一二三]日目?)[東南西北]..?\d+\w?/i, '');
            user_name = user_name.replace(/[@＠]?(fanbox|fantia|skeb|ファンボ|リクエスト|お?仕事|新刊|単行本|同人誌)+(.*(更新|募集|公開|開設|開始|発売|販売|委託|休止|停止)+中?[!！]?$|$)/gi, '');
            user_name = user_name.replace(/\(\)|（）|「」|【】|[@＠_＿]+$/g, '').trim();
            return user_name;
        } else return;
    }

    // 取得 Candfans 名稱
    const getCandfansName = async (id) => {
        const response = await fixRequest(
            `https://candfans.jp/api/contents/get-timeline?user_id=${id}&record=1`
        );
        if (response.status === 200) {
            const user = response.response.data[0];
            const user_code = user?.user_code || "";
            const username = user?.username || "";
            return [user_code, username]; // user_code 是搜尋用, username 是顯示用
        } else return;
    };
    // Candfans 很麻煩, 不同頁面的格式不一樣
    const candfansPageAdapt = (oldId, newId, oldUrl, oldName, newName) => {
        if (Page.isSearch()) {
            oldId = newId || oldId;
        } else {
            oldUrl = newId ? replaceUrlTail(oldUrl, newId) : oldUrl;
        }

        oldName = newName || oldName;
        return [oldId, oldUrl, oldName];
    };

    /* ===== 主要修復渲染 ===== */

    const supportFixName = new Set(["pixiv", "fanbox", "candfans"]);
    const supportFixTag = { // 無論是 ID 修復, 還是 NAME 修復, 處理方式都一樣, 只是分開處理, 方便維護
        // ? 使用 g 是因為, 會有 'Pixiv Fanbox' 這樣的字串
        ID: /Gumroad|Patreon|Fantia|Pixiv|Fanbox|CandFans/gi,
        NAME: /Twitter|Boosty|OnlyFans|Fansly|SubscribeStar|DLsite/gi,

        Fantia: "https://fantia.jp/fanclubs/{id}/posts",
        FantiaPost: "https://fantia.jp/posts/{id}",

        Patreon: "https://www.patreon.com/user?u={id}",
        PatreonPost: "https://www.patreon.com/posts/{id}",

        DLsite: "https://www.dlsite.com/maniax/circle/profile/=/maker_id/{name}.html",
        DLsitePost: "https://www.dlsite.com/maniax/work/=/product_id/{name}.html",

        CandFans: "https://candfans.jp/{id}",
        CandFansPost: "https://candfans.jp/posts/comment/show/{id}",

        Gumroad: "https://gumroad.com/{id}",
        Pixiv: "https://www.pixiv.net/users/{id}/artworks",
        Fanbox: "https://www.pixiv.net/fanbox/creator/{id}",
        Boosty: "https://boosty.to/{name}",
        SubscribeStar: "https://subscribestar.adult/{name}",
        Twitter: "https://x.com/{name}",
        OnlyFans: "https://onlyfans.com/{name}",
        Fansly: "https://fansly.com/{name}/posts",
    };

    // 修復更新 UI
    async function fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, showText, appendTag) {
        nameEl.$sAttr("style", "display: none;"); // 隱藏原始名稱

        if (nameEl.previousElementSibling?.tagName !== "FIX_WRAPPER") {
            nameEl.$iAdjacent(`
                <fix_wrapper>
                    <fix_name jump="${mainUrl}">${showText.trim()}</fix_name>
                    <fix_edit id="${user}">Edit</fix_edit>
                </fix_wrapper>
            `, "beforebegin");
        };

        /* 取得支援修復的正則 */
        const [tag_text, support_id, support_name] = [
            tagEl.$text(),
            supportFixTag.ID,
            supportFixTag.NAME
        ];

        if (!tag_text) return;

        const [mark, matchId] = support_id.test(tag_text)
            ? ["{id}", support_id]
            : support_name.test(tag_text) ? ["{name}", support_name] : ["", null];

        if (!mark) return;

        tagEl.$iHtml(tag_text.replace(matchId, tag => {
            let supported = false;
            const supportFormat = appendTag
                ? ( // 存在 appendTag 時 且擁有對應的 API 格式, 才使用新的 user 與支援格式, 否則回退到舊格式
                    supported = supportFixTag[`${tag}${appendTag}`],
                    supported ? (user = parseUrlInfo(otherUrl).user, supported) : supportFixTag[tag]
                )
                : supportFixTag[tag];

            return `<fix_tag jump="${supportFormat.replace(mark, user)}">${tag}</fix_tag>`;
        }));
    };
    // 觸發修復
    async function fixTrigger(data) {
        let { mainUrl, otherUrl, server, user, nameEl, tagEl, appendTag } = data;

        let recordName = recordCache?.get(user); // 從緩存 使用尾部 ID 取出對應紀錄
        if (recordName) {
            if (server === "candfans") {
                [user, mainUrl, recordName] = candfansPageAdapt(
                    user,
                    recordName[0],
                    mainUrl,
                    nameEl.$text(),
                    recordName[1]
                )
            };

            fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, recordName, appendTag);
        } else {
            if (supportFixName.has(server)) {

                if (server === "candfans") {
                    const [user_code, username] = await getCandfansName(user) ?? nameEl.$text();

                    if (user_code && username) fixCache.set(user, [user_code, username]); // 都存在才添加數據

                    [user, mainUrl, recordName] = candfansPageAdapt(
                        user,
                        user_code,
                        mainUrl,
                        nameEl.$text(),
                        username
                    )

                    fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                } else {
                    const username = await getPixivName(user) ?? nameEl.$text();
                    fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, username, appendTag);
                    fixCache.set(user, username); // 添加數據
                }

                saveWork(); // 呼叫保存工作
            } else {
                fixUpdateUi(mainUrl, otherUrl, user, nameEl, tagEl, nameEl.$text(), appendTag);
            }
        }
    };

    /* ===== 前置獲取需修復元素 ===== */

    // 針對 搜尋頁, 那種有許多用戶卡的
    async function searchFix(items) {
        items.$sAttr("fix", true); // 添加修復標籤

        const url = items.href;
        const img = items.$q("img");
        const { server, user } = parseUrlInfo(url);

        img.$sAttr("jump", url); // 圖片設置跳轉連結

        fixTrigger({
            mainUrl: url, // 主要跳轉連結
            otherUrl: "", // 其他替代連結
            server, // 網站 字串
            user, // 尾部 id 資訊
            nameEl: items.$q(".user-card__name"), // 名稱物件
            tagEl: items.$q(".user-card__service"), // 標籤物件
            appendTag: "", // 附加 tag 文本
        });
    };
    // 針對其餘頁面的修復
    async function otherFix(artist, tag = "", mainUrl = null, otherUrl = null, reTag = "fix_view") {
        try {
            const parent = artist.parentElement;
            const url = mainUrl ?? parent.href;
            const { server, user } = parseUrlInfo(url);

            await fixTrigger({
                mainUrl: url,
                otherUrl,
                server,
                user,
                nameEl: artist,
                tagEl: tag,
                appendTag: otherUrl ? "Post" : "" // 用於調用 Post API, 的附加標籤
            });

            parent.replaceWith(
                Lib.createElement(reTag, { html: parent.$iHtml() })
            );
        } catch {/* 防止動態監聽進行二次操作時的錯誤 (因為 DOM 已經被修改) */ }
    };
    // 需要動態監聽變化的頁面
    async function dynamicFix(element) {
        Lib.$observer(element, async () => {
            recordCache = await getRecord(); // 觸發時重新取得緩存
            // ! 暫時寫法, 該頁面更新時不會完整刷新, 所以要跳過檢查
            const checkFix = !Parame.FavoritesArtists.test(Parame.Url);
            for (const items of element.$qa(`a.user-card${checkFix ? ":not([fix])" : ""}`)) {
                searchFix(items);
            }
        }, { mark: "dynamic-fix", subtree: false, debounce: 50 });
    };

    // 初始化
    await init();

    const color = Load.color;
    const loadStyle = async () => {
        Lib.addStyle(`
            a {
                user-drag: none;
                -webkit-user-drag: none; 
            }

            /* 搜尋頁面的樣式 */
            fix_tag:hover { color: ${color}; }
            .card-list__items a:not(article a) {
                cursor: default;
            }
            .fancy-image__image, fix_name, fix_tag, fix_edit {
                cursor: pointer;
            }
            .user-card__info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            fix_name {
                color: #fff;
                font-size: 28px;
                font-weight: 500;
                max-width: 320px;
                overflow: hidden;
                display: block;
                padding: .25rem .1rem;
                border-radius: .25rem;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            fix_edit {
                top: 85px;
                right: 8%;
                color: #fff;
                display: none;
                z-index: 9999;
                font-size: 1.1rem;
                font-weight: 700;
                position: absolute;
                background: #666;
                white-space: nowrap;
                padding: .25rem .5rem;
                border-radius: .25rem;
                transform: translateY(-100%);
            }
            .edit_textarea {
                color: #fff;
                display: block;
                font-size: 30px;
                padding: 6px 1px;
                line-height: 5vh;
                text-align: center;
            }
            .user-card:hover fix_edit {
                display: block;
            }
            .user-card:hover fix_name {
                background-color: ${color};
            }
            .edit_textarea ~ fix_name,
            .edit_textarea ~ fix_edit {
                display: none !important;
            }

            /* 預覽頁面的樣式 */
            fix_view {
                display: flex;
                flex-flow: wrap;
                align-items: center;
            }
            fix_view fix_name {
                font-size: 2rem;
                font-weight: 700;
                padding: .25rem 3rem;
                border-radius: .25rem;
                transition: background-color 0.3s ease;
            }
            fix_view fix_edit {
                top: 65px;
                right: 5%;
                transform: translateY(-80%);
            }
            fix_view:hover fix_name {
                background-color: ${color};
            }
            fix_view:hover fix_edit {
                display: block;
            }
  
            /* 內容頁面的樣式 */
            fix_cont {
                display: flex;
                height: 5rem;
                width: 15rem;
                align-items: center;
                justify-content: center;
            }
            fix_cont fix_wrapper {
                position: relative;
                display: inline-block;
                margin-top: 1.5rem;
            }
            fix_cont fix_name {
                color: ${color};
                font-size: 1.8rem;
                display: inline-block;
            }
            fix_cont fix_edit {
                top: 2.2rem;
                right: -4.2rem;
                position: absolute;
            }
            fix_cont fix_wrapper::after {
                content: "";
                position: absolute;
                width: 1.2rem;
                height: 100%;
            }
            fix_cont fix_wrapper:hover fix_name {
                background-color: #fff;
            }
            fix_cont fix_wrapper:hover fix_edit {
                display: block;
            }
            .post-show-box {
                z-index: 9999;
                cursor: pointer;
                position: absolute;
                padding: 8px 4px;
                max-width: 120%;
                min-width: 80px;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                border-radius: 5px;
                background: #1d1f20ff;
                border: 1px solid #fff;
            }
            .post-show-box[preview="above"] {
                bottom: 85%;
            }
            .post-show-box[preview="below"] {
                top: 85%;
            }
            .post-show-box::-webkit-scrollbar {
                display: none;
            }
            .post-show-box img {
                height: 23vh;
                margin: 0 .3rem;
                min-width: 55%;
                border: 1px solid #fff;
            }
            .fancy-image__image {
                z-index: 1;
                position: relative;
            }
            .fancy-image__picture:before {
                content: "";
                z-index: 0;
                bottom: 10%;
                width: 100px;
                height: 115px;
                position: absolute;
            }
        `, "Better-Post-Card-Effects", false);
    };

    return {
        /* 更好的 PostCard */
        async BetterPostCard({ newtab, newtab_active, newtab_insert, previewAbove, enableNameTools }) {
            loadStyle();

            const isSearch = Page.isSearch();

            // 監聽滑鼠移入事件
            if (Lib.platform.desktop) {
                if (isSearch) {
                    let currentBox, currentTarget;

                    Lib.onEvent(Lib.body, "mouseover", Lib.$debounce(event => {
                        let target = event.target;
                        const className = target.className;

                        if (className === "fancy-image__image") {
                            currentTarget = target.parentElement;
                            currentBox = target.previousElementSibling;
                        }
                        else if (className === "fancy-image__picture") {
                            currentTarget = target;
                            currentBox = target.$q(".post-show-box");
                            target = target.$q("img");
                        } else return;

                        if (!currentBox && target) {
                            currentBox = Lib.createElement(target, "div", {
                                text: "Loading...",
                                style: "display: none;",
                                class: "post-show-box",
                                attr: { preview: previewAbove ? "above" : "below" },
                                on: {
                                    wheel: event => {
                                        event.preventDefault();
                                        event.currentTarget.scrollLeft += event.deltaY;
                                    }
                                }
                            }, "beforebegin");

                            // 目前暫時只有 discord 不支援, 就不用正則
                            const url = target.$gAttr("jump") || target.closest("a.user-card").href;
                            if (url && !url.includes("discord")) {
                                const uri = new URL(url);
                                const api = Page.isNeko ? url : `${uri.origin}/api/v1${uri.pathname}/posts`;
                                Fetch.send(api, null, {
                                    responseType: Page.isNeko ? "document" : "json"
                                })
                                    .then(data => {
                                        if (Page.isNeko) data = data.$qa(".post-card__image");
                                        currentBox.$text(""); // 清除載入文本

                                        const srcBox = new Set();
                                        for (const post of data) {
                                            let src = "";

                                            if (Page.isNeko) src = post.src ?? "";
                                            else {
                                                for (const { path } of [
                                                    post.file,
                                                    ...post?.attachments || []
                                                ]) {
                                                    if (!path) continue;

                                                    const isImg = Parame.SupportImg.has(path.split(".")[1]);
                                                    if (!isImg) continue;

                                                    src = Parame.ThumbnailApi + path;
                                                    break;
                                                }
                                            }

                                            if (!src) continue;
                                            srcBox.add(src);
                                        }

                                        if (srcBox.size === 0) currentBox.$text("No Image");
                                        else {
                                            currentBox.$iAdjacent([...srcBox].map((src, index) => `<img src="${src}" loading="lazy" number="${index + 1}">`).join(''));
                                            srcBox.clear();
                                        }
                                    })
                            } else currentBox.$text("Not Supported");
                        }

                        // ? 這樣寫是為了使用 ?. 語法, 避免 currentBox 為 null 造成錯誤
                        currentBox?.$sAttr("style", "display: block;");
                    }, 3e2), { passive: true, mark: "PostShow" });

                    Lib.onEvent(Lib.body, "mouseout", event => {
                        if (!currentTarget) return;
                        if (currentTarget.contains(event.relatedTarget)) return;
                        currentTarget = null;
                        currentBox?.$sAttr("style", "display: none;");
                    }, { passive: true, mark: "PostHide" });
                }
                else {
                    Lib.offEvent(Lib.body, "mouseover", "PostShow");
                    Lib.offEvent(Lib.body, "mouseout", "PostHide");
                }
            };

            if (!enableNameTools) return;

            // 監聽點擊事件
            const [active, insert] = [newtab_active, newtab_insert];
            Lib.onEvent(Lib.body, "click", event => {
                const target = event.target;
                const tagName = target.tagName;

                if (tagName === "TEXTAREA") {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } else if (tagName === "FIX_EDIT") {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    Lib.$q(".edit_textarea")?.remove(); // 移除上一次的編輯框 (避免意外)

                    const display = target.previousElementSibling; // 取得上方的 name 元素
                    const text = Lib.createElement(display, "textarea", {
                        class: "edit_textarea",
                        style: `height: ${display.scrollHeight + 10}px;`,
                    }, "beforebegin");

                    const original_name = display.$text();
                    text.value = original_name.trim();

                    text.scrollTop = 0; // 滾動到最上方
                    setTimeout(() => {
                        text.focus() // 設置焦點
                        setTimeout(() => { // 避免還沒設置好焦點就觸發
                            text.on("blur", () => {
                                const change_name = text.value.trim();
                                if (!change_name) display.$text(original_name);
                                else if (change_name !== original_name) {
                                    display.$text(change_name); // 修改顯示名
                                    saveRecord(new Map([[target.id, change_name]])); // 保存修改名
                                }
                                text.remove();
                            }, { once: true, passive: true });
                        }, 50);
                    }, 300);
                } else if (
                    // ! 以後在優化, 現在只是為了快速實現
                    newtab && Lib.platform.desktop && (
                        tagName === "FIX_NAME" || tagName === "FIX_TAG" || tagName === "PICTURE"
                        || target.matches(".fancy-image__image, .post-show-box, .post-show-box img")
                    )
                    || tagName === "FIX_TAG"
                    || tagName === "FIX_NAME" && (Page.isPreview() || Page.isContent())
                    || Page.isContent() && target.matches(".fancy-image__image")
                ) {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    const url = target.$gAttr("jump");
                    if (url) {
                        newtab
                            || tagName === "FIX_TAG"
                            || tagName === "FIX_NAME" && Page.isPreview()
                            ? GM_openInTab(url, { active, insert })
                            : location.assign(url);
                    }
                    else if (tagName === "IMG" || tagName === "PICTURE") {
                        const href = target.closest("a").href;
                        newtab && !Page.isContent()
                            ? GM_openInTab(href, { active, insert })
                            : location.assign(href);
                    }
                }
            }, { capture: true, mark: "BetterPostCard" });

            // 搜尋頁面, 與一些特殊預覽頁
            if (isSearch) {
                Lib.waitEl(".card-list__items", null, { raf: true, timeout: 10 }).then(card_items => {
                    if (Parame.Links.test(Parame.Url) || Parame.Recommended.test(Parame.Url)) {
                        // 特定頁面的 名稱修復
                        const artist = Lib.$q("span[itemprop='name']");
                        artist && otherFix(artist);
                    }

                    dynamicFix(card_items);
                    card_items.$sAttr("fix-trigger", true); // 避免沒觸發變更
                });
            }
            else if (Page.isContent()) { // 是內容頁面
                Lib.waitEl([
                    "h1 span:nth-child(2)",
                    ".post__user-name, .scrape__user-name"
                ], null, { raf: true, timeout: 10 }).then(([title, artist]) => {
                    otherFix(artist, title, artist.href, Lib.url, "fix_cont");
                });
            }
            else { // 一般 預覽頁面
                Lib.waitEl("span[itemprop='name']", null, { raf: true, timeout: 3 }).then(artist => {
                    otherFix(artist);
                });
            }
        }
    }
};

export default BetterPostCardFactory;