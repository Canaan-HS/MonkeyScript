import { Lib } from "../../services/client";
import { Page, Load } from "../config";

import Fetch from "../../utils/fetch";

const ExtraButtonFactory = () => {
    const loadStyle = () => {
        Lib.addStyle(`
            #main section {
                width: 100%;
            }
        `, "Post-Extra", false);
    };

    const getNextPage = (url, oldMain, retry = 5) => {
        if (!retry) return;

        Fetch.send(url, null, { responseType: "document" })
            .then(dom => {
                const main = dom.$q("main");
                if (!main) return;

                oldMain.replaceWith(main); // 替換舊的 main
                Lib.$q("header")?.scrollIntoView(); // 回到頂部

                history.pushState(null, null, url); // 修改連結與紀錄
                Lib.title(dom.title); // 修改標題
            })
            .catch(() => {
                setTimeout(() => getNextPage(url, oldMain), 1e3);
            });
    };

    return {
        /* 下方額外擴充按鈕 */
        async ExtraButton() {
            Lib.waitEl("h2.site-section__subheading", null, { raf: true, timeout: 5 }).then(comments => {
                loadStyle();

                const prevBtn = Lib.$q(".post__nav-link.prev, .scrape__nav-link.prev");
                const nextBtn = Lib.$q(".post__nav-link.next, .scrape__nav-link.next");

                let toTopBtn, newNextBtn;

                if (!Lib.$q("#to-top-svg")) {
                    const header = Lib.$q("header");
                    toTopBtn = Lib.createElement(comments, "span", {
                        id: "to-top-svg",
                        html: `
                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512" style="margin-left: 10px;cursor: pointer;">
                                <style>svg{fill: ${Load.color}}</style>
                                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM135.1 217.4l107.1-99.9c3.8-3.5 8.7-5.5 13.8-5.5s10.1 2 13.8 5.5l107.1 99.9c4.5 4.2 7.1 10.1 7.1 16.3c0 12.3-10 22.3-22.3 22.3H304v96c0 17.7-14.3 32-32 32H240c-17.7 0-32-14.3-32-32V256H150.3C138 256 128 246 128 233.7c0-6.2 2.6-12.1 7.1-16.3z"></path>
                            </svg>`,
                        on: {
                            click: () => header?.scrollIntoView()
                        }
                    })
                }

                if (nextBtn && !Lib.$q("#next-btn")) {
                    const newBtn = nextBtn.$copy(true);
                    newBtn.style = `color: ${Load.color};`;
                    newBtn.$sAttr("jump", nextBtn.href);
                    newBtn.$dAttr("href");

                    newNextBtn = Lib.createElement(comments, "span", {
                        id: "next-btn",
                        style: "float: right; cursor: pointer;",
                        on: {
                            click: {
                                listen: () => {
                                    if (Page.isNeko) {
                                        newBtn.disabled = true;
                                        getNextPage(newBtn.$gAttr("jump"), Lib.$q("main"));
                                    } else {
                                        toTopBtn?.remove();
                                        newNextBtn.remove();
                                        nextBtn.click();
                                    }
                                },
                                add: { once: true }
                            }
                        }
                    })

                    newNextBtn.appendChild(newBtn);
                }
            })
        }
    }
};

export default ExtraButtonFactory;