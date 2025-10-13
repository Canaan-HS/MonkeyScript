import { Lib } from '../../services/client.js';

/* 刪除公告通知 */
export default async function DeleteNotice() {
    Lib.waitEl("#announcement-banner", null, { throttle: 50, timeout: 10 })
        .then(announcement => announcement.remove());
};