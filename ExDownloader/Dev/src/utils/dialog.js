import { Lib } from '../services/client.js';

const Dialog = (() => {
    const dialogStyle = `
        .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(20, 15, 20, 0.75);
            display: grid;
            place-items: center;
            z-index: 10000;
            backdrop-filter: blur(3px);
            padding: clamp(12px, 4vw, 60px);
            box-sizing: border-box;
        }

        /* 動畫效果類 */
        .dialog-overlay.animated-fade { animation: fadeIn 0.4s ease-out; }
        .dialog-overlay.animated-fade.closing { animation: fadeOut 0.35s ease-out forwards; }
        .dialog-overlay.no-animation { opacity: 1; }

        .dialog {
            background: linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.28) 22%, rgba(0,0,0,.48) 50%, rgba(0,0,0,.28) 78%);
            border-radius: clamp(12px, 3vw, 18px);
            padding: 3px;
            width: fit-content;
            min-width: min(clamp(280px, 90vw, var(--dialog-width)), 95vw);
            max-width: 95vw;
            max-height: clamp(400px, 85vh, 90vh);
            box-shadow: 
                0 0 25px rgba(50, 50, 50, 0.2), 
                0 0 50px rgba(75, 75, 75, 0.15), 
                0 12px 35px rgba(0, 0, 0, 0.4);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            font-family: 
                'Segoe UI Variable', 'Segoe UI', system-ui,
                -apple-system, BlinkMacSystemFont,
                'Roboto', 'Helvetica Neue', 'Arial',
                'Microsoft YaHei', '微软雅黑',
                'Microsoft JhengHei', '微軟正黑體',
                'PingFang SC', 'PingFang TC',
                'Hiragino Sans GB', 'Hiragino Kaku Gothic Pro',
                'Noto Sans CJK SC', 'Noto Sans CJK TC', 
                'Source Han Sans SC', 'Source Han Sans TC',
                'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo',
                sans-serif,
                'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji';
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: 'kern' 1;
            font-kerning: normal;
        }

        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            @supports not (-webkit-touch-callout: none) {
                .dialog-title { font-weight: 700; }
                .dialog-message { font-weight: 550; }
                .dialog-button { font-weight: 600; }
            }
        }

        /* 對話框動畫 */
        .dialog.animated-fade { animation: dialogFadeIn 0.4s ease-out; }
        .dialog.animated-fade.closing { animation: dialogFadeOut 0.35s ease-out forwards; }
        .dialog.animated-slide-top { animation: slideFromTop 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .dialog.animated-slide-top.closing { animation: slideToTop 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        .dialog.animated-slide-bottom { animation: slideFromBottom 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .dialog.animated-slide-bottom.closing { animation: slideToBottom 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        .dialog.animated-slide-left { animation: slideFromLeft 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .dialog.animated-slide-left.closing { animation: slideToLeft 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        .dialog.animated-slide-right { animation: slideFromRight 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .dialog.animated-slide-right.closing { animation: slideToRight 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards; }
        .dialog.animated-scale { animation: scaleIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .dialog.animated-scale.closing { animation: scaleOut 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }
        .dialog.no-animation { opacity: 1; transform: none; }

        .dialog-content {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.97) 0%, rgba(250, 250, 250, 0.98) 100%);
            backdrop-filter: blur(10px);
            border-radius: clamp(10px, 2.5vw, 15px);
            padding: clamp(16px, 4vw, 24px);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: calc(85vh - 6px);
            box-sizing: border-box;
        }

        .dialog-title-spacer { 
            height: clamp(8px, 2vh, 16px); 
            flex-shrink: 0; 
        }

        .dialog-title {
            font-size: clamp(17px, 3.5vw, 20px);
            color: rgba(20, 20, 20, 0.95);
            margin-bottom: clamp(12px, 3vw, 16px);
            text-align: center;
            letter-spacing: -0.01em;
            flex-shrink: 0;
        }

        .dialog-message-align[align="center"] { align-items: center; text-align: center; }
        .dialog-message-align[align="left"] { align-items: flex-start; text-align: left; }
        .dialog-message-align[align="right"] { align-items: flex-end; text-align: right; }

        .dialog-message-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            margin-bottom: clamp(14px, 3vw, 20px);
            min-height: clamp(40px, 10vh, 60px);
            max-height: clamp(200px, 50vh, 400px);
            padding: clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 10px);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        /* 優化滾動條 */
        .dialog-message-container::-webkit-scrollbar { 
            width: clamp(7px, 1.8vw, 9px); 
        }
        .dialog-message-container::-webkit-scrollbar-track { 
            background: rgba(0, 0, 0, 0.06); 
            border-radius: 5px;
            margin: 4px 0;
        }
        .dialog-message-container::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.5) 100%);
            border-radius: 5px;
            border: 2px solid rgba(0, 0, 0, 0.06);
            background-clip: padding-box;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .dialog-message-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.7) 100%);
            background-clip: padding-box;
        }

        .dialog-message {
            font-size: clamp(14px, 3.2vw, var(--message-font-size));
            color: rgba(30, 30, 30, 0.92);
            line-height: 1.7;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            letter-spacing: 0.01em;
        }

        .dialog-input-container { 
            flex-shrink: 0; 
            margin-bottom: clamp(14px, 3vw, 20px);
        }

        /* 輸入框 */
        .dialog-input {
            width: 100%;
            padding: clamp(11px, 2.5vw, 13px) clamp(14px, 3.5vw, 18px);
            border: 2px solid rgba(40, 40, 40, 0.9);
            border-radius: clamp(8px, 2vw, 10px);
            font-size: clamp(14px, 3vw, 16px);
            font-weight: 450;
            background: linear-gradient(135deg, rgba(25, 25, 25, 0.98) 0%, rgba(15, 15, 15, 0.99) 100%);
            color: rgba(255, 255, 255, 0.95);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing: 0.02em;
            box-sizing: border-box;
            box-shadow: 
                0 2px 6px rgba(0, 0, 0, 0.15),
                inset 0 1px 3px rgba(0, 0, 0, 0.4),
                inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .dialog-input::placeholder { 
            color: rgba(180, 180, 180, 0.5);
            font-weight: 400;
            text-align: center; 
        }

        .dialog-input:focus {
            outline: none;
            border-color: rgba(60, 60, 60, 1);
            background: linear-gradient(135deg, rgba(30, 30, 30, 1) 0%, rgba(20, 20, 20, 1) 100%);
            color: rgba(255, 255, 255, 1);
            box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.25),
                0 0 0 3px rgba(80, 80, 80, 0.2),
                inset 0 1px 3px rgba(0, 0, 0, 0.3),
                inset 0 0 0 1px rgba(255, 255, 255, 0.08);
            transform: translateY(-1px);
        }

        .dialog-input:hover:not(:focus) {
            border-color: rgba(50, 50, 50, 0.95);
            box-shadow: 
                0 3px 8px rgba(0, 0, 0, 0.18),
                inset 0 1px 3px rgba(0, 0, 0, 0.35),
                inset 0 0 0 1px rgba(255, 255, 255, 0.07);
        }

        .dialog-buttons {
            display: flex;
            gap: clamp(8px, 2vw, 12px);
            justify-content: flex-end;
            flex-shrink: 0;
            flex-wrap: wrap;
        }

        .dialog-button {
            padding: clamp(10px, 2.2vw, 12px) clamp(20px, 4.5vw, 28px);
            border: none;
            border-radius: clamp(7px, 1.5vw, 9px);
            font-size: clamp(13px, 2.8vw, 15px);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: clamp(70px, 16vw, 90px);
            letter-spacing: 0.02em;
            position: relative;
            overflow: hidden;
            outline: none;
            box-sizing: border-box;
        }

        .dialog-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.5s, height 0.5s;
            pointer-events: none;
        }

        .dialog-button:active::before { 
            width: 320px; 
            height: 320px; 
        }

        /* 主要按鈕 */
        .dialog-button-primary {
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.96) 0%, rgba(10, 10, 10, 0.98) 100%);
            color: rgba(255, 255, 255, 0.98);
            border: 1.5px solid rgba(0, 0, 0, 0.2);
            box-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.2),
                0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dialog-button-primary:hover {
            background: linear-gradient(135deg, rgba(40, 40, 40, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
            transform: translateY(-1px);
            border-color: rgba(0, 0, 0, 0.25);
            box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.25),
                0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .dialog-button-primary:active {
            transform: translateY(0);
            box-shadow: 
                0 1px 4px rgba(0, 0, 0, 0.2),
                0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* 次要按鈕 */
        .dialog-button-secondary {
            background: rgba(255, 255, 255, 0.9);
            color: rgba(20, 20, 20, 0.9);
            border: 1.5px solid rgba(0, 0, 0, 0.15);
            box-shadow: 
                0 1px 3px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }

        .dialog-button-secondary:hover {
            background: rgba(255, 255, 255, 0.95);
            color: rgba(10, 10, 10, 0.95);
            border-color: rgba(0, 0, 0, 0.25);
            transform: translateY(-1px);
            box-shadow: 
                0 2px 6px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }

        .dialog-button-secondary:active {
            transform: translateY(0);
            box-shadow: 
                0 1px 2px rgba(0, 0, 0, 0.08),
                inset 0 1px 2px rgba(0, 0, 0, 0.06);
            background: rgba(245, 245, 245, 0.95);
        }

        /* 位置類 */
        .position-top { place-items: start center; }
        .position-center { place-items: center; }
        .position-bottom { place-items: end center; }
        .position-left { place-items: center start; }
        .position-right { place-items: center end; }

        /* 小屏幕優化 */
        @media (max-width: 640px) {
            .dialog-overlay { padding: 16px; }
            .dialog { width: 100%; min-width: unset; max-width: calc(100vw - 32px); }
            .dialog-buttons { flex-direction: column-reverse; gap: 10px; }
            .dialog-button { width: 100%; min-width: unset; padding: 12px 20px; }
            .dialog-message-container { max-height: 60vh; }
        }

        @media (max-width: 380px) {
            .dialog-overlay { padding: 8px; }
            .dialog { border-radius: 12px; max-width: calc(100vw - 16px); }
            .dialog-content { padding: 14px; }
            .dialog-title { font-size: 16px; margin-bottom: 12px; }
            .dialog-message { font-size: 13px; line-height: 1.65; }
            .dialog-input { padding: 10px 12px; }
        }

        /* 動畫定義 */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes dialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dialogFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideFromTop { from { transform: translateY(clamp(-40px, -10vw, -60px)); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideToTop { from { transform: translateY(0); opacity: 1; } to { transform: translateY(clamp(-40px, -10vw, -60px)); opacity: 0; } }
        @keyframes slideFromBottom { from { transform: translateY(clamp(40px, 10vw, 60px)); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideToBottom { from { transform: translateY(0); opacity: 1; } to { transform: translateY(clamp(40px, 10vw, 60px)); opacity: 0; } }
        @keyframes slideFromLeft { from { transform: translateX(clamp(-40px, -10vw, -60px)); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .slideToLeft { from { transform: translateX(0); opacity: 1; } to { transform: translateX(clamp(-40px, -10vw, -60px)); opacity: 0; } }
        @keyframes slideFromRight { from { transform: translateX(clamp(40px, 10vw, 60px)); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideToRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(clamp(40px, 10vw, 60px)); opacity: 0; } }
        @keyframes scaleIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.7); opacity: 0; } }
    `;

    class DialogManager {
        constructor() {
            Lib.addStyle(dialogStyle, "dialog-style");

            // 對話框隊列管理
            this.dialogQueue = [];
            this.currentDialog = null;
            this.isProcessing = false;
            this.transitionDelay = 100; // 多對話框間的過渡延遲

            // 位置映射表
            this.positionMap = {
                top: 'position-top',
                center: 'position-center',
                bottom: 'position-bottom',
                left: 'position-left',
                right: 'position-right'
            };

            // 動畫類型映射表
            this.animationMap = {
                fade: 'animated-fade',
                top: 'animated-slide-top',
                bottom: 'animated-slide-bottom',
                left: 'animated-slide-left',
                right: 'animated-slide-right',
                scale: 'animated-scale'
            };

            // 動畫持續時間映射表（毫秒）
            this.durationMap = {
                fade: 400,
                top: 450,
                bottom: 450,
                left: 450,
                right: 450,
                scale: 450
            };
        };

        // 獲取位置對應的 CSS 類名
        getPositionClass(position) {
            return this.positionMap[position] || 'position-center';
        };

        // 獲取動畫對應的 CSS 類名
        getAnimationClass(animation) {
            if (!animation || animation === 'none') return 'no-animation';
            if (animation === true) return 'animated-fade';
            return this.animationMap[animation] || 'animated-fade';
        };

        // 獲取動畫持續時間
        getAnimationDuration(animation) {
            if (!animation || animation === 'none') return 0;
            if (animation === true) return 400;
            return this.durationMap[animation] || 400;
        };

        // 將隊列中的對話框入隊
        enqueue(options) {
            return new Promise(resolve => {
                this.dialogQueue.push({ options, resolve });
                if (!this.isProcessing) this.processQueue();
            })
        };

        // 處理對話框隊列
        async processQueue() {
            if (this.dialogQueue.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.isProcessing = true;
            const { options, resolve } = this.dialogQueue.shift();
            const hasNextDialog = this.dialogQueue.length > 0;

            // 關閉當前對話框
            if (this.currentDialog) {
                await this.closeCurrentDialog(this.currentDialog.animation, hasNextDialog);
                if (hasNextDialog) {
                    await new Promise(r => setTimeout(r, this.transitionDelay));
                }
            }

            // 創建新對話框
            const result = await this.createDialog(options);
            resolve(result);

            this.processQueue();
        };

        // 關閉當前對話框
        closeCurrentDialog(animation, hasNextDialog = false) {
            return new Promise(resolve => {
                if (!this.currentDialog) return resolve();

                const { overlay, dialog } = this.currentDialog;
                const duration = this.getAnimationDuration(animation);

                const cleanup = () => {
                    overlay.remove();
                    this.currentDialog = null;
                    resolve();
                };

                if (duration > 0 && !hasNextDialog) {
                    overlay.style.transition = 'none';
                    void overlay.offsetHeight; // 強制重繪

                    overlay.classList.add('closing');
                    dialog.classList.add('closing');
                    setTimeout(cleanup, duration);
                } else if (hasNextDialog) {
                    overlay.style.transition = 'opacity 0.15s ease-out';
                    overlay.style.opacity = '0';
                    setTimeout(cleanup, 150);
                } else {
                    cleanup();
                }
            })
        };

        // 創建對話框
        createDialog(rawOptions) {
            return new Promise(resolve => {
                const {
                    type = 'alert',
                    message = '',
                    title = '',
                    confirmText = 'OK',
                    cancelText = 'Cancel',
                    defaultValue = '',
                    placeholder = 'Enter text...',
                    position = 'center',
                    width = 420,
                    fontSize = 18,
                    autoClose = false,
                    duration = 3,
                    animation = 'fade',
                    align = 'center',
                } = rawOptions;

                const overlayAnimationClass = !animation || animation === 'none'
                    ? 'no-animation' : 'animated-fade';
                const dialogAnimationClass = this.getAnimationClass(animation);
                const positionClass = this.getPositionClass(position);
                const hasQueue = this.dialogQueue.length > 0;

                const showCancelBtn = type === 'confirm' || type === 'prompt';
                const showInput = type === 'prompt';

                const html = `
                    <div class="dialog-overlay ${overlayAnimationClass} ${positionClass}"
                         ${hasQueue ? 'style="opacity: 0;"' : ''}>
                        <div class="dialog ${dialogAnimationClass}" 
                             style="--dialog-width: ${width}px;">
                            <div class="dialog-content">
                                ${title ? `<div class="dialog-title">${title}</div>` : '<div class="dialog-title-spacer"></div>'}
                                <div class="dialog-message-align dialog-message-container" align="${align}">
                                    <div class="dialog-message-align dialog-message" 
                                         align="${align}" 
                                         style="--message-font-size: ${fontSize}px;">
                                        ${message.replace(/\n/g, '<br>')}
                                    </div>
                                </div>
                                ${showInput ? `
                                    <div class="dialog-input-container">
                                        <input class="dialog-input" 
                                               type="text" 
                                               value="${defaultValue}" 
                                               placeholder="${placeholder}"
                                               style="text-align: center;">
                                    </div>
                                ` : ''}
                                <div class="dialog-buttons">
                                    ${showCancelBtn ? `
                                        <button class="dialog-button dialog-button-secondary" data-action="cancel">
                                            ${cancelText}
                                        </button>
                                    ` : ''}
                                    <button class="dialog-button dialog-button-primary" data-action="confirm">
                                        ${confirmText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // 解析模板為 DOM 元素
                document.body.appendChild(
                    document.createRange().createContextualFragment(html)
                );

                const overlay = document.querySelector('.dialog-overlay');

                const dialog = overlay.querySelector('.dialog');
                const inputElement = overlay.querySelector('.dialog-input');
                const confirmBtn = overlay.querySelector('[data-action="confirm"]');
                const cancelBtn = overlay.querySelector('[data-action="cancel"]');

                // 確認/取消/背景點擊
                const handleClose = (confirmed) => {
                    let result;
                    if (type === 'prompt') {
                        result = confirmed ? (inputElement?.value ?? '') : null;
                    } else {
                        result = confirmed;
                    }

                    const hasNextInQueue = this.dialogQueue.length > 0;
                    const duration = this.getAnimationDuration(animation);

                    const cleanup = () => {
                        overlay.remove();
                        if (this.currentDialog?.overlay === overlay) {
                            this.currentDialog = null;
                        }
                        resolve(result);
                    };

                    if (duration > 0 && !hasNextInQueue) {
                        overlay.style.transition = 'none';
                        void overlay.offsetHeight; // 強制重繪

                        overlay.classList.add('closing');
                        dialog.classList.add('closing');
                        setTimeout(cleanup, duration);
                    } else if (hasNextInQueue) {
                        overlay.style.transition = 'opacity 0.15s ease-out';
                        overlay.style.opacity = '0';
                        setTimeout(cleanup, 150);
                    } else {
                        cleanup();
                    }
                };

                overlay.addEventListener('pointerup', e => {
                    const target = e.target;

                    // 點擊確認按鈕
                    if (target === confirmBtn || target.closest('[data-action="confirm"]')) {
                        handleClose(true);
                    }
                    // 點擊取消按鈕
                    else if (target === cancelBtn || target.closest('[data-action="cancel"]')) {
                        handleClose(false);
                    }
                    // 點擊模態背景（overlay 本身，不是 dialog 內部）
                    else if (target === overlay) {
                        handleClose(false);
                    }
                });

                // 輸入框 Enter 鍵處理
                if (inputElement) {
                    inputElement.addEventListener('keydown', e => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleClose(true);
                        }
                    })
                };

                this.currentDialog = { overlay, dialog, animation };

                // 隊列淡入處理
                if (hasQueue) {
                    requestAnimationFrame(() => {
                        overlay.style.transition = 'opacity 0.2s ease-in';
                        overlay.style.opacity = '1';
                    })
                }

                // 延遲聚焦
                setTimeout(() => {
                    if (inputElement) {
                        inputElement.focus();
                    } else {
                        confirmBtn?.focus();
                    }
                }, hasQueue ? 150 : 50);

                // 自動關閉
                if (autoClose && duration > 0) {
                    setTimeout(() => {
                        if (this.currentDialog?.overlay === overlay) {
                            handleClose(true);
                        }
                    }, duration * 1000);
                }
            });
        };
    };

    const dialogManager = new DialogManager();
    return {
        alert: (message, options = {}) => dialogManager.enqueue({
            type: 'alert',
            message: String(message ?? ''),
            ...options
        }),
        confirm: (message, options = {}) => dialogManager.enqueue({
            type: 'confirm',
            message: String(message ?? ''),
            ...options
        }),
        prompt: (message, defaultValue = '', options = {}) => dialogManager.enqueue({
            type: 'prompt',
            message: String(message ?? ''),
            defaultValue: String(defaultValue ?? ''),
            ...options
        })
    }
})();

export default Dialog;