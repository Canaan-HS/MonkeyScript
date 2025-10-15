import { Lib } from '../../services/client.js';

/* 收縮側邊攔 */
export default async function SidebarCollapse() {
    if (Lib.platform.mobile) return;

    Lib.addStyle(`
        .global-sidebar {
            opacity: 0;
            height: 100%;
            width: 10rem;
            display: flex;
            position: fixed;
            padding: 0.5em 0;
            transition: 0.8s;
            background: #282a2e;
            flex-direction: column;
            transform: translateX(-9rem);
        }
        .global-sidebar:hover {opacity: 1; transform: translateX(0rem);}
        .content-wrapper.shifted {transition: 0.7s; margin-left: 0rem;}
        .global-sidebar:hover + .content-wrapper.shifted {margin-left: 10rem;}
    `, "Collapse-Effects", false);
};