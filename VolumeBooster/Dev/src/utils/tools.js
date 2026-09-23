import { Lib } from '../services/client.js';
import { Default, Share } from '../core/config.js';

const audioContextRecord = (() => {
    if (!unsafeWindow.AudioContext) return;

    const mediaRecord = new WeakMap();
    const nodeRecord = new WeakMap();

    const audioContextPrototype = unsafeWindow.AudioContext.prototype;
    const audioNodePrototype = unsafeWindow.AudioNode.prototype;

    const createSource = audioContextPrototype.createMediaElementSource;
    const connect = audioNodePrototype.connect;

    audioContextPrototype.createMediaElementSource = function (media) {
        const source = createSource.call(this, media);

        const record = {
            source,
            context: this,
            destination: this.destination,
            gain: null,
            lowFilter: null,
            midFilter: null,
            highFilter: null,
            compressor: null
        };

        mediaRecord.set(media, record);
        nodeRecord.set(source, record);

        return source;
    };

    audioNodePrototype.connect = function (destination, ...args) {
        const result = connect.call(this, destination, ...args);
        const record = nodeRecord.get(this);

        if (!record) return result;

        nodeRecord.set(destination, record);

        if (destination instanceof unsafeWindow.GainNode)
            record.gain = destination;

        else if (destination instanceof unsafeWindow.BiquadFilterNode) {

            if (destination.type === "lowshelf")
                record.lowFilter = destination;

            else if (destination.type === "peaking")
                record.midFilter = destination;

            else if (destination.type === "highshelf")
                record.highFilter = destination;

        } else if (
            destination instanceof unsafeWindow.DynamicsCompressorNode
        ) {
            record.compressor = destination;
        }

        return result;
    };

    return {
        get(media) {
            return mediaRecord.get(media) ?? {};
        }
    };
})();

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

const isCrossOrigin = (url) => {
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) {
        return false;
    }

    try {
        return Lib.domain !== new URL(url).hostname;
    } catch {
        return false;
    }
};

export { audioContextRecord, bannedDomains, updateParame, isCrossOrigin };