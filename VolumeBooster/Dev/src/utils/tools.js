import { Lib } from "../services/client.js";
import { Default, Share } from "../core/config.js";

const bannedDomains = (() => {
    let banned = new Set(Lib.getV("Banned", [])); // 禁用網域
    let excludeStatus = banned.has(Lib.$domain); // 排除狀態

    return {
        isEnabled: (callback) => callback(!excludeStatus), // 返回排除狀態
        addBanned: async () => {
            excludeStatus
                ? banned.delete(Lib.$domain)
                : banned.add(Lib.$domain);

            Lib.setV("Banned", [...banned]); // 更新禁用網域
            location.reload(); // 重新加載頁面
        }
    }
})();

const updateParame = () => {
    let Config = Lib.getV(Lib.$domain, {}); // 獲取當前網域設置

    if (typeof Config === "number") {
        Config = { Gain: Config }; // 舊數據轉移
    };

    Share.Parame = Object.assign({}, Default, Config); // 更新參數
};

export { bannedDomains, updateParame };