import { Lib } from "../services/client.js";
import { Config, Match, Param } from '../core/config.js';

const Tools = (() => {
    /* 判斷頁面 */
    const pageType = (url) =>
        Match.Video.test(url) ? "Video"
            : Match.Live.test(url) ? "Live"
                : "NotSupport";

    /* 標題格式 (傳入標題元素) */
    const titleFormat = (title) => title.$text().replace(/^\s+|\s+$/g, "");

    /* 開發模式 - 打印 (語法簡化) */
    const devPrint = (group, ...content) => {
        Lib.log(...content, { dev: Config.Dev, group, collapsed: false });
    };

    /*  開發模式 - 時間打印 (語法簡化) */
    const devTimePrint = (group, state) => {
        devPrint(group, Lib.runTime(Param.StartTime, { log: false }), state);
    };

    /**
     * 判斷設置
     * @param {element} element - 要修改的元素
     * @param {String} setKey - 要保存設置的 key, 如果沒傳遞該值, 就不會有保存操作
     */
    const hideJudgment = async (element, setKey = null) => {
        if (element.style.display == "none" || Param.Token) {
            element.style.display = "block";
            setKey && Lib.setV(setKey, false);
        } else {
            element.style.display = "none";
            setKey && Lib.setV(setKey, true);
        }
    };

    /**
     * 風格轉換器
     * @param {Array} list - 要修改的元素列表
     * @param {String} type - 要修改的樣式類型
     * @param {String} style - 要修改的樣式
     * @returns 回傳修改是否成功狀態 (有開啟 Dev 才會運作)
     */
    const styleTransform = async (list, type, style) => {
        list.forEach(element => { element.style[type] = style });
        if (Config.Dev) {
            return new Promise(resolve => {
                resolve(list.every(element => element.style[type] == style))
            });
        }
    };

    /* 監聽配置 */
    const titleOp = { childList: true, subtree: false };
    /* 持續隱藏 */
    const titleOb = new MutationObserver(() => {
        Lib.title() != "..." && Lib.title("...");
    });

    return { pageType, titleFormat, devPrint, devTimePrint, hideJudgment, styleTransform, titleOp, titleOb };
})();

export default Tools;