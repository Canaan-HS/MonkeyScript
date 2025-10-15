import { Lib } from '../../services/client.js';
import { Parame } from '../config.js';

export default async function KeyScroll({ mode }) { /* 快捷自動滾動 */
    if (Lib.platform.mobile || Parame.Registered.has("KeyScroll")) return;

    // 滾動配置
    const scrollConfig = {
        scrollPixel: 2,
        scrollInterval: 800,
    };

    const upScrollSpeed = scrollConfig.scrollPixel * -1;
    let scrollFunc, isUpScroll = false, isDownScroll = false;

    const [topDetected, bottomDetected] = [ // 到頂 和 到底 的檢測
        Lib.$throttle(() => {
            isUpScroll = Lib.sY == 0
                ? false : true
        }, 600),
        Lib.$throttle(() => {
            isDownScroll = Lib.sY + Lib.iH >= Lib.html.scrollHeight
                ? false : true
        }, 600)
    ];

    switch (mode) {
        case 2:
            scrollFunc = (Move) => {
                const Interval = setInterval(() => {
                    if (!isUpScroll && !isDownScroll) {
                        clearInterval(Interval);
                    }

                    if (isUpScroll && Move < 0) {
                        window.scrollBy(0, Move);
                        topDetected();
                    } else if (isDownScroll && Move > 0) {
                        window.scrollBy(0, Move);
                        bottomDetected();
                    }
                }, scrollConfig.scrollInterval);
            }
        default:
            scrollFunc = (Move) => {
                if (isUpScroll && Move < 0) {
                    window.scrollBy(0, Move);
                    topDetected();
                    requestAnimationFrame(() => scrollFunc(Move));
                } else if (isDownScroll && Move > 0) {
                    window.scrollBy(0, Move);
                    bottomDetected();
                    requestAnimationFrame(() => scrollFunc(Move));
                }
            }
    }

    Lib.onEvent(window, "keydown", Lib.$throttle(event => {
        const key = event.key;
        if (key == "ArrowUp") {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (isUpScroll) {
                isUpScroll = false;
            } else if (!isUpScroll || isDownScroll) {
                isDownScroll = false;
                isUpScroll = true;
                scrollFunc(upScrollSpeed);
            }
        } else if (key == "ArrowDown") {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (isDownScroll) {
                isDownScroll = false;
            } else if (isUpScroll || !isDownScroll) {
                isUpScroll = false;
                isDownScroll = true;
                scrollFunc(scrollConfig.scrollPixel);
            }
        }
    }, 100), { capture: true });

    Parame.Registered.add("KeyScroll");
}