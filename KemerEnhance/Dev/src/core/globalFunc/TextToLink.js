import { Lib } from '../../services/client.js';
import { Page } from '../config.js';

import megaUtils from '../../utils/mega.js';

const TextToLinkFactory = () => {
    let mega;

    const exclusionRegex = /onfanbokkusuokibalab\.net/;
    const urlRegex = /(?:(?:https?|ftp|mailto|file|data|blob|ws|wss|ed2k|thunder):\/\/|(?:[-\w]+\.)+[a-zA-Z]{2,}(?:\/|$)|\w+@[-\w]+\.[a-zA-Z]{2,})[^\s]*?(?=[{}「」『』【】\[\]（）()<>、"'，。！？；：…—～~]|$|\s)/gi;
    const exclusionTags = new Set([
        // 腳本和樣式
        "SCRIPT", "STYLE", "NOSCRIPT",
        // 多媒體元素
        "SVG", "CANVAS", "IFRAME", "AUDIO", "VIDEO", "EMBED", "OBJECT", "SOURCE", "TRACK",
        // 代碼和預格式化文本
        "CODE", "KBD", "SAMP",
        // 不可見或特殊功能元素
        "TEMPLATE", "SLOT", "PARAM", "META", "LINK",
        // 圖片相關
        "IMG", "PICTURE", "FIGURE", "FIGCAPTION",
        // 特殊交互元素
        "MATH", "PORTAL", "METER", "PROGRESS", "OUTPUT",
        // 表單元素
        "TEXTAREA", "SELECT", "OPTION", "DATALIST", "FIELDSET", "LEGEND",
        // 其他交互元素
        "MAP", "AREA"
    ]);

    // ? 使用 /g 全局匹配, 如果不重新宣告 使用 test()|exec(), 沒有重設 lastIndex 會有意外狀況
    const urlMatch = (str) => {
        // 不直接用 match 是為了性能, 因為節點可能很多, test 比 match 開銷更小
        urlRegex.lastIndex = 0;
        return urlRegex.test(str);
    };

    const uriFormat1 = /^[a-zA-Z][\w+.-]*:\/\//;
    const uriFormat2 = /^[a-zA-Z][\w+.-]*:/;
    const uriFormat3 = /^([\w-]+\.)+[a-z]{2,}(\/|$)/i;
    const uriFormat4 = /^\/\//;
    const protocolParse = (uri) => {
        if (uriFormat1.test(uri) || uriFormat2.test(uri)) return uri;
        if (uriFormat3.test(uri)) return "https://" + uri;
        if (uriFormat4.test(uri)) return "https:" + uri;
        return uri;
    };

    // 將區塊的所有 a 觸發跳轉, 改成新分頁
    const jumpTrigger = async (root, { newtab, newtab_active, newtab_insert }) => {
        const [active, insert] = [newtab_active, newtab_insert];
        Lib.onEvent(root, "click", event => {
            const target = event.target.closest("a:not(.fileThumb)");
            if (!target || target.$hAttr("download")) return;
            event.preventDefault();

            !newtab
                ? location.assign(target.href)
                : GM_openInTab(target.href, { active, insert });
        }, { capture: true });
    };

    const getTextNodeMap = (root) => {
        const nodes = new Map();
        const tree = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parentElement = node.parentElement;
                    if (!parentElement || exclusionTags.has(parentElement.tagName)) return NodeFilter.FILTER_REJECT;

                    const content = node.$text();
                    if (!content || exclusionRegex.test(content)) return NodeFilter.FILTER_REJECT;
                    return content === "(frame embed)" || urlMatch(content)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );
        let node, parent, pack;
        while ((node = tree.nextNode())) {
            parent = node.parentElement;
            pack = nodes.get(parent);
            if (pack === undefined) {
                pack = [];
                nodes.set(parent, pack);
            }
            pack.push(node);
        };
        return nodes;
    };

    /**
     * @description 解析後轉換網址
     * @param {Element} container - 上層容器
     * @param {Element} father - 文本父節點
     * @param {String} text - 文本內容
     * @param {Element|null} textNode - 文本節點
     * @param {Boolean} complex - 是否為複雜文本
     */
    async function parseModify(
        container, father, text, textNode = null, complex = false
    ) {
        let modifyUrl, passwordDict = {}, missingDict = {};

        // 單獨的 (frame embed)
        if (text === "(frame embed)") {
            const a = father.closest("a");
            if (!a) return;

            const href = a.href;
            if (!href) return;

            if (href.includes("mega.nz")) {
                mega ??= megaUtils(urlRegex);
                text = container.$oHtml();
                missingDict = mega.extractMissingKey(text);
                passwordDict = mega.extractPasswords(text);
            }

            if (missingDict[href])
                modifyUrl = mega.getCompleteUrl(href, missingDict[href]);

            if (passwordDict[href])
                modifyUrl = await mega.getDecryptedUrl(href, passwordDict[href]);

            if (modifyUrl && modifyUrl !== href) {
                a.href = modifyUrl;
                a.$text(modifyUrl);
            } else {
                a.$text(href);
            }
        }
        // 複雜文本, 同個父元素內含多個文本, 主要是避免跑板的 (還未支援 mega 解密)
        else if (complex) {
            textNode.replaceWith(
                Lib.createDomFragment(
                    text.replace(urlRegex, url => {
                        const decode = decodeURIComponent(url).trim();
                        return `<a href="${protocolParse(decode)}" rel="noopener noreferrer">${decode}</a>`;
                    })
                )
            )
        }
        // 通常是完整的 pre 文本
        else {
            // ? 用於提前退出, 與降低開始處理速度, 有時 AJAX 載入比較慢會導致沒處理到
            if (text.match(urlRegex).length === 0) return;

            if (text.includes("mega.nz")) {
                mega ??= megaUtils(urlRegex);
                missingDict = mega.extractMissingKey(text);
                passwordDict = mega.extractPasswords(text);
            };

            let url, index, lastIndex = 0;
            const segments = [];
            for (const match of text.matchAll(urlRegex)) {
                url = match[0];
                index = match.index;

                if (index > lastIndex) segments.push(text.slice(lastIndex, index));

                modifyUrl = decodeURIComponent(url).trim();

                if (missingDict[url])
                    modifyUrl = mega.getCompleteUrl(url, missingDict[url]);

                if (passwordDict[url])
                    modifyUrl = await mega.getDecryptedUrl(url, passwordDict[url]);

                segments.push(`<a href="${protocolParse(modifyUrl)}" rel="noopener noreferrer">${modifyUrl}</a>`);
                lastIndex = index + url.length;
            }

            if (lastIndex < text.length) {
                segments.push(text.slice(lastIndex));
            }

            father.tagName === "A"
                ? father.replaceWith(Lib.createDomFragment(segments.join("")))
                : father.$iHtml(segments.join(""));
        }
    };

    return {
        /* 連結文本轉連結 (沒有連結文本的不會執行) */
        async TextToLink(config) {
            if (!Page.isContent() && !Page.isAnnouncement()) return;

            let parentNode, text, textNode, data, isComplex;
            if (Page.isContent()) {
                Lib.waitEl(".post__body, .scrape__body", null).then(async body => {

                    let [article, content] = [
                        body.$q("article"),
                        body.$q(".post__content, .scrape__content")
                    ];

                    if (article) {
                        jumpTrigger(content, config);
                        let span;
                        for (span of article.$qa("span.choice-text")) {
                            parseModify(article, span, span.$text());
                        }
                    } else if (content) {
                        jumpTrigger(content, config);
                        for ([parentNode, data] of getTextNodeMap(content).entries()) {
                            // ? 實驗性判斷式, 可能不需要 data.length
                            isComplex = parentNode.childElementCount >= 1 || data.length > 1;
 
                            for (textNode of data) {
                                text = textNode.$text();

                                // ? 後續測試是否需要
                                if (text.startsWith("https://mega.nz")) {
                                    mega ??= megaUtils(urlRegex);
                                    text = await mega.getPassword(parentNode, text);
                                }

                                parseModify(content, parentNode, text, textNode, isComplex);
                            }
                        }
                    } else {
                        const attachments = body.$q(".post__attachments, .scrape__attachments");
                        attachments && jumpTrigger(attachments, config);
                    }
                });

            } else if (Page.isAnnouncement()) {
                Lib.waitEl(".card-list__items pre", null, { raf: true }).then(() => {
                    const items = Lib.$q(".card-list__items");
                    jumpTrigger(items, config);

                    for ([parentNode, data] of getTextNodeMap(items).entries()) {
                        isComplex = parentNode.childElementCount >= 1 || data.length > 1;

                        for (textNode of data) {
                            text = textNode.$text();
                            parseModify(items, parentNode, text, textNode, isComplex);
                        }
                    }
                })
            }
        }
    }
};

export default TextToLinkFactory;