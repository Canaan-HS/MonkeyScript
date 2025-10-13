import { Lib } from '../../services/client.js';
import { Parame, Page } from '../config.js';

import Fetch from '../../utils/fetch.js';

const BetterThumbnailFactory = () => {
    const imgReload = (img, thumbnailSrc, retry) => {
        if (!img.isConnected) return;

        if (!retry) {
            img.src = thumbnailSrc;
            return;
        };

        const src = img.src;

        img.onload = function () {
            img.onload = img.onerror = null;
        };
        img.onerror = function () {
            img.onload = img.onerror = null;
            img.src = thumbnailSrc;

            setTimeout(() => {
                imgReload(img, thumbnailSrc, retry - 1);
            }, 2e3);
        };

        img.src = src;
    };

    const changeSrc = (img, thumbnailSrc, src) => {
        if (!img.isConnected) return;

        img.loading = "lazy";
        img.onerror = function () {
            img.onerror = null;
            imgReload(this, thumbnailSrc, 10);
        };

        img.src = src;
    };

    return {
        /* 變更預覽卡縮圖 */
        async BetterThumbnail() {
            if (Page.isNeko) return;

            Lib.waitEl(
                "article.post-card", null, { raf: true, all: true, timeout: 5 }
            ).then(postCard => {
                const uri = new URL(Parame.Url);

                if (uri.searchParams.get("q") === "") uri.searchParams.delete("q"); // 移除空搜尋

                if (Parame.User.test(Parame.Url)) { // 一般預覽頁面適應
                    uri.pathname += "/posts";
                }
                else if (Parame.FavorPosts.test(Parame.Url)) { // 收藏頁面適應
                    uri.pathname = uri.pathname.replace("/posts", "");
                    uri.searchParams.set("type", "post");
                };

                const postData = [...postCard].reduce((acc, card) => {
                    const id = card.$gAttr("data-id");
                    if (id) acc[id] = { img: card.$q("img"), footer: card.$q("time").nextElementSibling };
                    return acc;
                }, {});

                // ! 理論上這邊的實現如果交給 CacheFetch 攔截時直接修改, 會更加高效
                const api = `${uri.origin}/api/v1${uri.pathname}${uri.search}`;
                Fetch.send(api, data => {
                    // ! 不特別處理 API 格式修改, 會導致報錯的問題
                    if (Lib.$type(data) === "Object") data = data?.posts || [];

                    for (const post of data) {
                        const { img, footer } = postData[post?.id] || {};
                        if (!img && !footer) continue;

                        let replaced = false;
                        const src = img?.src;
                        const attachments = post.attachments || [];

                        const record = new Set();
                        const count = [post.file, ...attachments].reduce((count, attach, index) => {
                            const path = attach.path || "";
                            if (record.has(path)) return count;

                            const ext = path.split(".").at(-1).toLowerCase();
                            if (!ext) return count;

                            // 計算檔案類型
                            const isImg = Parame.SupportImg.has(ext);
                            if (isImg) count.image = (count.image ?? 0) + 1;
                            else if (Parame.VideoType.has(ext)) count.video = (count.video ?? 0) + 1;
                            else count.file = (count.file ?? 0) + 1;

                            // 替換縮圖
                            if (src && !replaced && index > 0 && isImg) {
                                replaced = true;
                                changeSrc(img, src, Parame.ThumbnailApi + path);
                            };

                            record.add(path);
                            return count;
                        }, {});

                        if (footer && !Lib.isEmpty(count)) {
                            const { image, video, file } = count;

                            const parts = [];
                            if (image) parts.push(`${image} images`);
                            if (video) parts.push(`${video} videos`);
                            if (file) parts.push(`${file} files`);

                            const showText = parts.join(" | ");
                            if (showText) footer.$text(showText);
                        }
                    }
                })
            })
        }
    }
};

export default BetterThumbnailFactory;