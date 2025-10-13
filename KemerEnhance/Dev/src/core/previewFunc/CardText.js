import { Lib } from '../../services/client.js';

/* 帖子說明文字效果 */
export default async function CardText({ mode }) {
    if (Lib.platform === "Mobile") return;

    switch (mode) {
        case 2:
            Lib.addStyle(`
                .post-card__header, .post-card__footer {
                    opacity: 0.4 !important;
                    transition: opacity 0.3s;
                }
                a:hover .post-card__header,
                a:hover .post-card__footer {
                    opacity: 1 !important;
                }
            `, "CardText-Effects-2", false);
            break;
        default:
            Lib.addStyle(`
                .post-card__header {
                    opacity: 0;
                    z-index: 1;
                    padding: 5px;
                    pointer-events: none;
                    transform: translateY(-6vh);
                    transition: transform 0.4s, opacity 0.6s;
                }
                .post-card__footer {
                    opacity: 0;
                    z-index: 1;
                    padding: 5px;
                    pointer-events: none;
                    transform: translateY(6vh);
                    transition: transform 0.4s, opacity 0.6s;
                }
                a:hover .post-card__header,
                a:hover .post-card__footer {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }
            `, "CardText-Effects", false);
    }
};