import { Lib } from '../../services/client.js';
import { Parame } from '../config.js';

export default async function KeyScroll({ mode }) { /* 快捷自動滾動 */
    if (Lib.platform === "Mobile" || Parame.Registered.has("KeyScroll")) return;

    // 滾動配置
    const Scroll_Requ = {
        Scroll_Pixels: 2,
        Scroll_Interval: 800,
    };

    const UP_ScrollSpeed = Scroll_Requ.Scroll_Pixels * -1;
    let Scroll, Up_scroll = false, Down_scroll = false;

    const [TopDetected, BottomDetected] = [ // 到頂 和 到底 的檢測
        Lib.$throttle(() => {
            Up_scroll = Lib.sY == 0
                ? false : true
        }, 600),
        Lib.$throttle(() => {
            Down_scroll = Lib.sY + Lib.iH >= Lib.html.scrollHeight
                ? false : true
        }, 600)
    ];

    switch (mode) {
        case 2:
            Scroll = (Move) => {
                const Interval = setInterval(() => {
                    if (!Up_scroll && !Down_scroll) {
                        clearInterval(Interval);
                    }

                    if (Up_scroll && Move < 0) {
                        window.scrollBy(0, Move);
                        TopDetected();
                    } else if (Down_scroll && Move > 0) {
                        window.scrollBy(0, Move);
                        BottomDetected();
                    }
                }, Scroll_Requ.Scroll_Interval);
            }
        default:
            Scroll = (Move) => {
                if (Up_scroll && Move < 0) {
                    window.scrollBy(0, Move);
                    TopDetected();
                    requestAnimationFrame(() => Scroll(Move));
                } else if (Down_scroll && Move > 0) {
                    window.scrollBy(0, Move);
                    BottomDetected();
                    requestAnimationFrame(() => Scroll(Move));
                }
            }
    }

    Lib.onEvent(window, "keydown", Lib.$throttle(event => {
        const key = event.key;
        if (key == "ArrowUp") {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (Up_scroll) {
                Up_scroll = false;
            } else if (!Up_scroll || Down_scroll) {
                Down_scroll = false;
                Up_scroll = true;
                Scroll(UP_ScrollSpeed);
            }
        } else if (key == "ArrowDown") {
            event.stopImmediatePropagation();
            event.preventDefault();
            if (Down_scroll) {
                Down_scroll = false;
            } else if (Up_scroll || !Down_scroll) {
                Up_scroll = false;
                Down_scroll = true;
                Scroll(Scroll_Requ.Scroll_Pixels);
            }
        }
    }, 100), { capture: true });

    Parame.Registered.add("KeyScroll");
}