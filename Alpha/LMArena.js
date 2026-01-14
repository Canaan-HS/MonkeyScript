// ==UserScript==
// @name         LMArena 優化
// @version      0.0.1
// @author       Canaan HS
// @description  簡單優化

// @noframes
// @match        https://lmarena.ai/*

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635

// @run-at       document-end
// ==/UserScript==

(() => {
    function debounce(func, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(function () {
                func(...args);
            }, delay);
        }
    };

    const style = document.createElement('style');
    style.textContent = `
        .chhs-custom-control { display: flex !important; justify-content: center; gap: 4px; padding: 3px 6px; background: rgba(248, 249, 250, 0.95); backdrop-filter: blur(8px); border-radius: 3px; margin: 4px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); }
        .chhs-custom-control button { cursor: pointer; border: none; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: 500; transition: all 0.15s ease; opacity: 0.88; }
        .chhs-custom-control button:hover { opacity: 1; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .chhs-custom-control button:active { transform: translateY(0); }
        .chhs-toggle-collapse-btn { background: #28a745 !important; color: white !important; }
        .chhs-toggle-collapse-btn:hover { background: #218838 !important; }
        .chhs-toggle-collapse-btn.collapsed { background: #6c757d !important; }
        .chhs-delete-btn { background: #dc3545 !important; color: white !important; }
        .chhs-delete-btn:hover { background: #c82333 !important; }
        .chhs-jump-bottom-btn { background: #17a2b8 !important; color: white !important; }
        .chhs-jump-bottom-btn:hover { background: #138496 !important; }
        .chhs-back-top-btn { background: #ffc107 !important; color: #000 !important; }
        .chhs-back-top-btn:hover { background: #e0a800 !important; }
        .collapsed > *:not(.chhs-top-control) { display: none !important; }
    `;
    document.head.appendChild(style);

    // 監聽發送資訊
    document.body.addEventListener("keydown", event => {
        if (event.key !== 'Enter') return;
        if (event.shiftKey) return;
        if (!event.target.matches('input, textarea')) return;

        const textarea = document.querySelector("textarea");
        if (textarea.value === "/clear") {
            event.preventDefault();
            event.stopImmediatePropagation();
            document.querySelectorAll("button.chhs-delete-btn").forEach(btn => btn.click());
            textarea.value = "";
            return;
        }

        document.querySelectorAll("button.chhs-toggle-collapse-btn:not(.collapsed)").forEach(btn => btn.click());
    }, { capture: true });

    // 監聽點擊
    const getContainer = (target) => target.closest(".bg-surface-primary, .bg-surface-secondary");
    const operate = {
        // 刪除按鈕
        "chhs-delete-btn": (target) => getContainer(target)?.remove(),
        // 跳轉到底部按鈕
        "chhs-jump-bottom-btn": (target) => getContainer(target)?.scrollIntoView({ block: 'end' }),
        // 回到頂部按鈕
        "chhs-back-top-btn": (target) => getContainer(target)?.scrollIntoView({ block: 'start' }),
    };

    document.body.addEventListener("click", event => {
        const target = event.target;
        const className = target.className;

        const action = operate[className];
        if (action) {
            event.preventDefault();
            action(target);
        }
        // 收合按鈕
        else if (className.includes("chhs-toggle-collapse-btn")) {
            event.preventDefault();

            const container = getContainer(target);
            container.classList.toggle('collapsed');

            if (container.classList.contains('collapsed')) {
                target.textContent = '➕ 展開';
                target.classList.add('collapsed');
            } else {
                target.textContent = '➖ 收合';
                target.classList.remove('collapsed');
            }
        }
    });

    const record = new WeakSet();
    new MutationObserver(debounce(() => {
        for (const container of document.querySelectorAll("div.transition-all")) {
            if (record.has(container)) continue;

            // === 建立頂部控制容器 ===
            const topControl = document.createElement('div');
            topControl.className = 'chhs-custom-control chhs-top-control';

            // 收合按鈕
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'chhs-toggle-collapse-btn';
            toggleBtn.textContent = '➖ 收合';

            // 刪除按鈕
            const deleteTopBtn = document.createElement('button');
            deleteTopBtn.className = 'chhs-delete-btn';
            deleteTopBtn.textContent = '🗑️ 刪除';

            // 跳轉到底部按鈕
            const jumpBottomBtn = document.createElement('button');
            jumpBottomBtn.className = 'chhs-jump-bottom-btn';
            jumpBottomBtn.textContent = '⬇ 底部';

            topControl.appendChild(toggleBtn);
            topControl.appendChild(deleteTopBtn);
            topControl.appendChild(jumpBottomBtn);
            container.insertBefore(topControl, container.firstChild);

            // === 建立底部控制容器 ===
            const bottomControl = document.createElement('div');
            bottomControl.className = 'chhs-custom-control chhs-bottom-control';

            const deleteBottomBtn = document.createElement('button');
            deleteBottomBtn.className = 'chhs-delete-btn';
            deleteBottomBtn.textContent = '🗑️ 刪除';

            // 回到頂部按鈕
            const backTopBtn = document.createElement('button');
            backTopBtn.className = 'chhs-back-top-btn';
            backTopBtn.textContent = '⬆ 頂部';

            bottomControl.appendChild(deleteBottomBtn);
            bottomControl.appendChild(backTopBtn);
            container.appendChild(bottomControl);

            record.add(container);
        }

        for (const container of document.querySelectorAll("div.bg-surface-secondary.duration-150")) {
            if (record.has(container)) continue;

            container.classList.add('collapsed');

            // === 頂部收合按鈕 ===
            const topControl = document.createElement('div');
            topControl.className = 'chhs-custom-control chhs-top-control';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'chhs-toggle-collapse-btn collapsed';
            toggleBtn.textContent = '➕ 展開';

            topControl.appendChild(toggleBtn);
            container.insertBefore(topControl, container.firstChild);

            // === 底部回頂按鈕 ===
            const bottomControl = document.createElement('div');
            bottomControl.className = 'chhs-custom-control chhs-bottom-control';

            const backTopBtn = document.createElement('button');
            backTopBtn.className = 'chhs-back-top-btn';
            backTopBtn.textContent = '⬆ 頂部';

            bottomControl.appendChild(backTopBtn);
            container.appendChild(bottomControl);

            record.add(container);
        }
    }, 1e3)).observe(document, { attributes: true, childList: true, subtree: true });
})();