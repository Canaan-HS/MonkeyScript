import { Lib, preact } from '../../services/client.js';
import { Parame, Page } from '../config.js';

/* 預覽換頁 快速切換 (整體以性能為優先, 增加 代碼量|複雜度|緩存) */
export default async function QuickPostToggle() {

    // Todo - 臨時寫的等待重構
    if (!Page.isNeko || Parame.Registered.has("QuickPostToggle")) return; // ! 只支援 Neko

    Lib.waitEl("menu", null, { all: true, timeout: 5 }).then(menu => {
        Parame.Registered.add("QuickPostToggle");

        // 渲染
        function Rendering({ href, className, textContent, style }) {
            return preact.h("a", { href, className, style },
                preact.h("b", null, textContent)
            )
        };

        // 頁面內容緩存 - 帶大小限制
        const pageContentCache = new Map();
        const MAX_CACHE_SIZE = 30; // 最多緩存 30 頁

        // LRU緩存清理機制
        function cleanupCache() {
            if (pageContentCache.size >= MAX_CACHE_SIZE) {
                // 刪除最舊的緩存項（Map的第一個項目）
                const firstKey = pageContentCache.keys().next().value;
                pageContentCache.delete(firstKey);
            }
        };

        // 頁面獲取 - 使用 AbortController 支持取消
        async function fetchPage(url, abortSignal) {
            // 檢查緩存
            if (pageContentCache.has(url)) {
                const cachedContent = pageContentCache.get(url);

                // 將該項移到最後（LRU更新）
                pageContentCache.delete(url);
                pageContentCache.set(url, cachedContent);

                // 複製緩存的節點
                const clonedContent = cachedContent.cloneNode(true);
                Lib.$q(".card-list--legacy").replaceChildren(...clonedContent.childNodes);
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const request = GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    onload: response => {
                        if (abortSignal?.aborted) return reject(new Error('Aborted'));
                        if (response.status !== 200) return reject(new Error('Server error'));

                        const newContent = response.responseXML.$q(".card-list--legacy");

                        // 緩存清理
                        cleanupCache();

                        // 緩存內容
                        const contentToCache = newContent.cloneNode(true);
                        pageContentCache.set(url, contentToCache);

                        // 應用到頁面
                        Lib.$q(".card-list--legacy").replaceWith(newContent);
                        resolve();
                    },
                    onerror: () => reject(new Error('Network error'))
                });

                if (abortSignal) {
                    abortSignal.addEventListener('abort', () => {
                        request.abort?.();
                        reject(new Error('Aborted'));
                    });
                }
            });
        };

        const totalPages = Math.ceil(+(menu[0].previousElementSibling.$text().split("of")[1].trim()) / 50);
        const pageLinks = [Parame.Url, ...Array(totalPages - 1).fill().map((_, i) => `${Parame.Url}?o=${(i + 1) * 50}`)];

        const MAX_VISIBLE = 11;
        const hasScrolling = totalPages > 11;

        // 緩存按鈕引用和索引映射，避免重複查詢DOM
        let buttonCache = null;
        let pageButtonIndexMap = null;

        // 可見範圍計算 - 緩存結果
        let visibleRangeCache = { page: -1, range: null };
        function getVisibleRange(currentPage) {
            if (visibleRangeCache.page === currentPage) {
                return visibleRangeCache.range;
            }

            let range;
            if (!hasScrolling) {
                range = { start: 1, end: totalPages };
            } else {
                let start = 1;
                if (currentPage >= MAX_VISIBLE && totalPages > MAX_VISIBLE) {
                    start = currentPage - MAX_VISIBLE + 2;
                }
                range = { start, end: Math.min(totalPages, start + MAX_VISIBLE - 1) };
            }

            visibleRangeCache = { page: currentPage, range };
            return range;
        };

        // 創建按鈕元素
        function createButton(text, page, isDisabled = false, isCurrent = false, isHidden = false) {
            return preact.h(Rendering, {
                href: isDisabled ? undefined : pageLinks[page - 1],
                textContent: text,
                className: `${isDisabled ? "pagination-button-disabled" : ""} ${isCurrent ? "pagination-button-current" : ""}`.trim(),
                style: isHidden ? { display: 'none' } : undefined
            });
        };

        // 創建所有分頁元素
        function createPaginationElements(currentPage = 1) {
            const { start, end } = getVisibleRange(currentPage);
            const elements = [];

            if (hasScrolling) {
                elements.push(createButton("<<", 1, currentPage === 1));
            }
            elements.push(createButton("<", currentPage - 1, currentPage === 1));

            pageLinks.forEach((link, index) => {
                const pageNum = index + 1;
                const isVisible = pageNum >= start && pageNum <= end;
                const isCurrent = pageNum === currentPage;
                elements.push(createButton(pageNum, pageNum, isCurrent, isCurrent, !isVisible));
            });

            elements.push(createButton(">", currentPage + 1, currentPage === totalPages));
            if (hasScrolling) {
                elements.push(createButton(">>", totalPages, currentPage === totalPages));
            }

            return elements;
        };

        // 初始化按鈕緩存 - 一次性建立映射關係
        function initializeButtonCache() {
            const menu1Buttons = menu[0].$qa("a");
            const menu2Buttons = menu[1].$qa("a");

            const navOffset = hasScrolling ? 2 : 1;

            buttonCache = {
                menu1: {
                    all: menu1Buttons,
                    nav: {
                        first: hasScrolling ? menu1Buttons[0] : null,
                        prev: menu1Buttons[hasScrolling ? 1 : 0],
                        next: menu1Buttons[menu1Buttons.length - (hasScrolling ? 2 : 1)],
                        last: hasScrolling ? menu1Buttons[menu1Buttons.length - 1] : null
                    },
                    pages: menu1Buttons.slice(navOffset, menu1Buttons.length - navOffset)
                },
                menu2: {
                    all: menu2Buttons,
                    nav: {
                        first: hasScrolling ? menu2Buttons[0] : null,
                        prev: menu2Buttons[hasScrolling ? 1 : 0],
                        next: menu2Buttons[menu2Buttons.length - (hasScrolling ? 2 : 1)],
                        last: hasScrolling ? menu2Buttons[menu2Buttons.length - 1] : null
                    },
                    pages: menu2Buttons.slice(navOffset, menu2Buttons.length - navOffset)
                }
            };

            // 建立頁碼到按鈕索引的映射 - O(1) 查找
            pageButtonIndexMap = new Map();
            buttonCache.menu1.pages.forEach((btn, index) => {
                const pageNum = index + 1;
                pageButtonIndexMap.set(pageNum, index);
            });
        };

        // 批量DOM更新 - 最小化重排重繪
        function updateNavigationButtons(menuData, targetPage) {
            const isFirstPage = targetPage === 1;
            const isLastPage = targetPage === totalPages;
            const { nav } = menuData;

            // 批量更新導航按鈕狀態
            const navUpdates = [];

            if (hasScrolling) {
                navUpdates.push(
                    [nav.first, isFirstPage, pageLinks[0]],
                    [nav.prev, isFirstPage, pageLinks[targetPage - 2]],
                    [nav.next, isLastPage, pageLinks[targetPage]],
                    [nav.last, isLastPage, pageLinks[totalPages - 1]]
                );
            } else {
                navUpdates.push(
                    [nav.prev, isFirstPage, pageLinks[targetPage - 2]],
                    [nav.next, isLastPage, pageLinks[targetPage]]
                );
            }

            // 批量應用更新 - 減少DOM操作次數
            navUpdates.forEach(([btn, isDisabled, href]) => {
                btn.$toggleClass("pagination-button-disabled", isDisabled);
                if (isDisabled) {
                    btn.$dAttr('href');
                } else {
                    btn.href = href;
                }
            });
        };

        // 頁碼按鈕更新 - 只更新變化的部分
        function updatePageButtons(menuData, targetPage, visibleRange) {
            const { start, end } = visibleRange;
            const { pages } = menuData;

            // 找到當前活動按鈕並清除狀態 - O(1) 查找
            const currentActiveBtn = pages.find(btn => btn.classList.contains("pagination-button-current"));
            if (currentActiveBtn) {
                currentActiveBtn.$delClass("pagination-button-current", "pagination-button-disabled");
            }

            // 批量處理可見性和狀態 - 預計算範圍
            const startIndex = Math.max(0, start - 1);
            const endIndex = Math.min(pages.length - 1, end - 1);

            // 隱藏範圍外的按鈕
            for (let i = 0; i < startIndex; i++) {
                pages[i].style.display = 'none';
            }
            for (let i = endIndex + 1; i < pages.length; i++) {
                pages[i].style.display = 'none';
            }

            // 顯示範圍內的按鈕並設置狀態
            for (let i = startIndex; i <= endIndex; i++) {
                const btn = pages[i];
                const pageNum = i + 1;

                btn.style.display = '';
                if (pageNum === targetPage) {
                    btn.$addClass("pagination-button-current", "pagination-button-disabled");
                }
            }
        };

        // 主更新函數 - 使用緩存避免DOM查詢
        function updatePagination(targetPage) {
            const visibleRange = getVisibleRange(targetPage);

            // 並行更新兩個菜單 - 利用緩存的按鈕引用
            updateNavigationButtons(buttonCache.menu1, targetPage);
            updateNavigationButtons(buttonCache.menu2, targetPage);
            updatePageButtons(buttonCache.menu1, targetPage, visibleRange);
            updatePageButtons(buttonCache.menu2, targetPage, visibleRange);
        };

        // 目標頁碼解析 - 預編譯查找表
        const navigationActions = {
            "<<": () => 1,
            ">>": () => totalPages,
            "<": (current) => current > 1 ? current - 1 : null,
            ">": (current) => current < totalPages ? current + 1 : null
        };

        function parseTargetPage(clickText, currentPage) {
            const clickedNum = parseInt(clickText);
            if (!isNaN(clickedNum)) return clickedNum;

            const action = navigationActions[clickText];
            return action ? action(currentPage) : null;
        };

        // 初始化渲染
        const elements = createPaginationElements(1);
        const [fragment1, fragment2] = [Lib.createFragment, Lib.createFragment];

        preact.render([...elements], fragment1);
        preact.render([...elements], fragment2);

        menu[0].replaceChildren(fragment1);
        menu[0].$sAttr("QuickPostToggle", "true");

        requestAnimationFrame(() => {
            menu[1].replaceChildren(fragment2);
            menu[1].$sAttr("QuickPostToggle", "true");

            // 初始化完成後建立緩存
            initializeButtonCache();
        });

        // 事件處理 - 減少查詢和計算
        let isLoading = false;
        let abortController = null;

        Lib.onEvent("section", "click", async event => {
            const target = event.target.closest("menu a:not(.pagination-button-disabled)");
            if (!target || isLoading) return;

            event.preventDefault();

            // 取消之前的請求
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            // 使用緩存快速獲取當前頁 - 避免DOM查詢
            const currentActiveBtn = target.closest("menu").$q(".pagination-button-current");
            const currentPage = parseInt(currentActiveBtn.$text());
            const targetPage = parseTargetPage(target.$text(), currentPage);

            if (!targetPage || targetPage === currentPage) return;

            isLoading = true;

            try {
                // 並行執行頁面獲取和UI更新
                await Promise.all([
                    fetchPage(pageLinks[targetPage - 1], abortController.signal),
                    new Promise(resolve => {
                        updatePagination(targetPage);
                        resolve();
                    })
                ]);

                target.closest("#paginator-bottom") && menu[0].scrollIntoView();
                history.pushState(null, null, pageLinks[targetPage - 1]);
            } catch (error) {
                if (error.message !== 'Aborted') {
                    Lib.log('Page fetch failed:', error).error;
                }
            } finally {
                isLoading = false;
                abortController = null;
            }
        }, { capture: true, mark: "QuickPostToggle" });
    })
};