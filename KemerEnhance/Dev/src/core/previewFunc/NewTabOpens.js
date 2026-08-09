import { Lib } from '../../services/client.js';

/* 將預覽頁面 開啟帖子都變成新分頁開啟 */
export default async function NewTabOpens(openInTab) {
    Lib.onEvent(Lib.body, "click", event => {
        const target = event.target.closest("article a");
        target && (
            event.preventDefault(),
            event.stopImmediatePropagation(),
            GM_openInTab(target.href, openInTab)
        );
    }, { capture: true, mark: "NewTabOpens" });
}