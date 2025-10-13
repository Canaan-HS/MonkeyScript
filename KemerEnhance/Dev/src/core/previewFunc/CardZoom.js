import { Lib } from '../../services/client.js';
import { Page } from '../config.js';

/* 帖子預覽卡縮放效果 */
export default async function CardZoom({ mode }) {
    let paddingBottom, rowGap, height;
    switch (mode) {
        case 2:
            Lib.addStyle(`
                .post-card a:hover {
                    z-index: 9999;
                    overflow: auto;
                    max-height: 90vh;
                    min-height: 100%;
                    height: max-content;
                    background: #000;
                    border: 1px solid #fff6;
                    transform: scale(1.1) translateY(0);
                }
                .post-card a::-webkit-scrollbar {
                    display: none;
                }
                .post-card a:hover .post-card__image-container {
                    position: relative;
                }
            `, "CardZoom-Effects-2", false);
            break;
        case 3:
            [paddingBottom, rowGap, height] = Page.isNeko
                ? ["0", "0", "57"]
                : ["7", "5.8", "50"];

            Lib.addStyle(`
                .card-list--legacy { padding-bottom: ${paddingBottom}em }
                .card-list--legacy .card-list__items {
                    row-gap: ${rowGap}em;
                    column-gap: 3em;
                }
                .post-card a {
                    width: 20em;
                    height: ${height}vh;
                }
                .post-card__image-container img { object-fit: contain }
            `, "CardZoom-Effects-3", false);
    };

    Lib.addStyle(`
        .card-list--legacy * {
            font-size: 20px !important;
            font-weight: 600 !important;
            --card-size: 350px !important;
        }
        .post-card a {
            background: #000;
            overflow: hidden;
            border-radius: 8px;
            border: 3px solid #fff6;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
    `, "CardZoom-Effects", false);
};