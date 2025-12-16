import { Lib } from '../services/client.js';

const Dialog = (() => {
    const dialogStyle = `
        .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: grid;
            place-items: center;
            z-index: 10000;
            backdrop-filter: blur(8px);
            padding: clamp(12px, 4vw, 60px);
            box-sizing: border-box;
        }

        /* 動畫效果類 */
        .dialog-overlay.animated-fade {
            animation: fadeIn 0.4s ease-out;
        }

        .dialog-overlay.animated-fade.closing {
            animation: fadeOut 0.35s ease-out;
        }

        .dialog-overlay.no-animation {
            opacity: 1;
        }

        .dialog {
            background: linear-gradient(135deg, 
                rgba(100, 180, 255, 0.6) 0%,
                rgba(33, 150, 243, 0.8) 50%,
                rgba(100, 180, 255, 0.6) 100%);
            border-radius: clamp(16px, 4vw, 24px);
            padding: 3px;
            width: clamp(280px, 90vw, var(--dialog-width));
            max-width: 100%;
            max-height: clamp(400px, 85vh, 90vh);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.2),
                0 2px 16px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
        }

        /* 淡入效果 */
        .dialog.animated-fade {
            animation: dialogFadeIn 0.4s ease-out;
        }

        .dialog.animated-fade.closing {
            animation: dialogFadeOut 0.35s ease-out;
        }

        /* 從上滑入 */
        .dialog.animated-slide-top {
            animation: slideFromTop 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .dialog.animated-slide-top.closing {
            animation: slideToTop 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53);
        }

        /* 從下滑入 */
        .dialog.animated-slide-bottom {
            animation: slideFromBottom 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .dialog.animated-slide-bottom.closing {
            animation: slideToBottom 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53);
        }

        /* 從左滑入 */
        .dialog.animated-slide-left {
            animation: slideFromLeft 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .dialog.animated-slide-left.closing {
            animation: slideToLeft 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53);
        }

        /* 從右滑入 */
        .dialog.animated-slide-right {
            animation: slideFromRight 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .dialog.animated-slide-right.closing {
            animation: slideToRight 0.35s cubic-bezier(0.55, 0.085, 0.68, 0.53);
        }

        /* 縮放效果 */
        .dialog.animated-scale {
            animation: scaleIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .dialog.animated-scale.closing {
            animation: scaleOut 0.35s cubic-bezier(0.6, -0.28, 0.735, 0.045);
        }

        /* 無動畫 */
        .dialog.no-animation {
            opacity: 1;
            transform: none;
        }

        .dialog-content {
            background: linear-gradient(135deg, 
                rgba(250, 250, 250, 0.98) 0%,
                rgba(255, 255, 255, 0.98) 100%);
            backdrop-filter: blur(10px);
            border-radius: clamp(14px, 3.5vw, 22px);
            padding: clamp(16px, 4vw, 24px);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: calc(85vh - 6px);
            box-sizing: border-box;
        }

        /* 標題占位符（無標題時使用） */
        .dialog-title-spacer {
            height: clamp(8px, 2vh, 16px);
            flex-shrink: 0;
        }

        .dialog-title {
            font-size: clamp(16px, 3.5vw, 19px);
            font-weight: 700;
            color: #2c2c2c;
            margin-bottom: clamp(12px, 3vw, 16px);
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            letter-spacing: clamp(0.3px, 0.1vw, 0.5px);
            flex-shrink: 0;
        }

        .dialog-message-align[align="center"] {
            align-items: center;
            text-align: center;
        }

        .dialog-message-align[align="left"] {
            align-items: flex-start;
            text-align: left;
        }

        .dialog-message-align[align="right"] {
            align-items: flex-end;
            text-align: right;
        }

        .dialog-message-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            margin-bottom: clamp(12px, 3vw, 18px);
            min-height: clamp(40px, 10vh, 60px);
            max-height: clamp(200px, 50vh, 400px);
            padding: 2px clamp(4px, 1.5vw, 8px);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }

        /* 自定義滾動條 */
        .dialog-message-container::-webkit-scrollbar {
            width: clamp(6px, 1.5vw, 8px);
        }

        .dialog-message-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.04);
            border-radius: 4px;
        }

        .dialog-message-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
        }

        .dialog-message-container::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
        }

        .dialog-message {
            font-size: clamp(14px, 3.2vw, var(--message-font-size));
            color: #3a3a3a;
            font-weight: 500;
            line-height: 1.75;
            word-wrap: break-word;
            word-break: break-word;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            letter-spacing: clamp(0.2px, 0.05vw, 0.3px);
        }

        .dialog-input-container {
            flex-shrink: 0;
            margin-bottom: clamp(12px, 3vw, 18px);
        }

        .dialog-input {
            width: 100%;
            padding: clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px);
            border: 2px solid #2196F3;
            border-radius: clamp(12px, 3vw, 18px);
            font-size: clamp(14px, 3vw, 16px);
            background: #fafafa;
            color: #2c2c2c;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            transition: all 0.3s ease;
            letter-spacing: clamp(0.2px, 0.05vw, 0.3px);
            box-sizing: border-box;
        }

        .dialog-input::placeholder {
            color: #999999;
        }

        .dialog-input:focus {
            outline: none;
            border-color: #1976D2;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
        }

        .dialog-buttons {
            display: flex;
            gap: clamp(6px, 1.5vw, 10px);
            justify-content: flex-end;
            flex-shrink: 0;
            flex-wrap: wrap;
        }

        .dialog-button {
            padding: clamp(8px, 2vw, 10px) clamp(16px, 4vw, 24px);
            border: none;
            border-radius: clamp(20px, 5vw, 28px);
            font-size: clamp(13px, 2.8vw, 15px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            min-width: clamp(60px, 15vw, 80px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            letter-spacing: clamp(0.3px, 0.08vw, 0.5px);
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
            transition: width 0.4s, height 0.4s;
        }

        .dialog-button:active::before {
            width: 300px;
            height: 300px;
        }

        .dialog-button:focus {
            outline: none;
        }

        .dialog-button-primary {
            background: #2196F3;
            color: #ffffff;
            box-shadow: 
                0 0 0 2px #ffffff,
                0 0 0 4px #2196F3,
                0 2px 8px rgba(33, 150, 243, 0.3);
        }

        .dialog-button-primary:hover {
            background: #1976D2;
            transform: translateY(-1px);
            box-shadow: 
                0 0 0 2px #ffffff,
                0 0 0 4px #1976D2,
                0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .dialog-button-primary:active {
            transform: translateY(0);
            box-shadow: 
                0 0 0 2px #ffffff,
                0 0 0 4px #1565C0,
                0 1px 4px rgba(33, 150, 243, 0.3);
        }

        .dialog-button-secondary {
            background: rgba(255, 255, 255, 0.95);
            color: #2196F3;
            border: 2px solid #2196F3;
        }

        .dialog-button-secondary:hover {
            background: rgba(245, 250, 255, 0.98);
            border-color: #1976D2;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
        }

        .dialog-button-secondary:active {
            transform: translateY(0);
            background: rgba(240, 248, 255, 0.95);
            border-color: #1565C0;
            box-shadow: none;
        }

        /* 位置類 - 使用 CSS Grid 布局 */
        .position-top { 
            place-items: start center;
        }

        .position-center { 
            place-items: center;
        }

        .position-bottom { 
            place-items: end center;
        }

        .position-left { 
            place-items: center start;
        }

        .position-right { 
            place-items: center end;
        }

        /* 小屏幕優化 */
        @media (max-width: 640px) {
            .dialog-overlay {
                padding: 16px;
            }

            .dialog {
                width: 100%;
                max-width: calc(100vw - 32px);
            }

            .dialog-buttons {
                flex-direction: column-reverse;
                gap: 8px;
            }

            .dialog-button {
                width: 100%;
                min-width: unset;
            }

            .dialog-message-container {
                max-height: 60vh;
            }
        }

        /* 超小屏幕 */
        @media (max-width: 380px) {
            .dialog-overlay {
                padding: 8px;
            }

            .dialog {
                border-radius: 12px;
            }

            .dialog-content {
                padding: 12px;
            }

            .dialog-title {
                font-size: 15px;
                margin-bottom: 10px;
            }

            .dialog-message {
                font-size: 13px;
            }
        }

        /* 動畫定義 */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes dialogFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes dialogFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes slideFromTop {
            from {
                transform: translateY(clamp(-40px, -10vw, -60px));
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideToTop {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(clamp(-40px, -10vw, -60px));
                opacity: 0;
            }
        }

        @keyframes slideFromBottom {
            from {
                transform: translateY(clamp(40px, 10vw, 60px));
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideToBottom {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(clamp(40px, 10vw, 60px));
                opacity: 0;
            }
        }

        @keyframes slideFromLeft {
            from {
                transform: translateX(clamp(-40px, -10vw, -60px));
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideToLeft {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(clamp(-40px, -10vw, -60px));
                opacity: 0;
            }
        }

        @keyframes slideFromRight {
            from {
                transform: translateX(clamp(40px, 10vw, 60px));
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideToRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(clamp(40px, 10vw, 60px));
                opacity: 0;
            }
        }

        @keyframes scaleIn {
            from {
                transform: scale(0.7);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        @keyframes scaleOut {
            from {
                transform: scale(1);
                opacity: 1;
            }
            to {
                transform: scale(0.7);
                opacity: 0;
            }
        }
    `;

    const dialogThemes = {
        // 暗黑主題
        dark: `
        .dialog-overlay { background: rgba(0, 0, 0, 0.7); }
        .dialog { background: linear-gradient(135deg, rgba(80, 80, 90, 0.8) 0%, rgba(50, 50, 60, 0.95) 50%, rgba(80, 80, 90, 0.8) 100%); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 16px rgba(0, 0, 0, 0.3); }
        .dialog-content { background: linear-gradient(135deg, rgba(35, 35, 45, 0.98) 0%, rgba(45, 45, 55, 0.98) 100%); }
        .dialog-title { color: #e8e8e8; }
        .dialog-message-container::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .dialog-message-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        .dialog-message-container::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        .dialog-message { color: #c8c8c8; }
        .dialog-input { border: 2px solid #5a5a6a; background: #2a2a35; color: #e0e0e0; }
        .dialog-input::placeholder { color: #777; }
        .dialog-input:focus { border-color: #7a7a8a; background: #35354a; box-shadow: 0 0 0 3px rgba(120, 120, 140, 0.2); }
        .dialog-button-primary { background: #6366f1; color: #ffffff; box-shadow: 0 0 0 2px #35354a, 0 0 0 4px #6366f1, 0 2px 8px rgba(99, 102, 241, 0.4); }
        .dialog-button-primary:hover { background: #5558e8; box-shadow: 0 0 0 2px #35354a, 0 0 0 4px #5558e8, 0 4px 12px rgba(99, 102, 241, 0.5); }
        .dialog-button-primary:active { box-shadow: 0 0 0 2px #35354a, 0 0 0 4px #4f52d5, 0 1px 4px rgba(99, 102, 241, 0.4); }
        .dialog-button-secondary { background: rgba(55, 55, 65, 0.95); color: #a5a5b5; border: 2px solid #5a5a6a; }
        .dialog-button-secondary:hover { background: rgba(65, 65, 75, 0.98); border-color: #7a7a8a; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
        .dialog-button-secondary:active { background: rgba(50, 50, 60, 0.95); border-color: #6a6a7a; }
        `,
        // 紫羅蘭主題
        violet: `
        .dialog-overlay { background: rgba(30, 15, 40, 0.55); }
        .dialog { background: linear-gradient(135deg, rgba(167, 139, 250, 0.6) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(167, 139, 250, 0.6) 100%); box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3), 0 2px 16px rgba(0, 0, 0, 0.1); }
        .dialog-content { background: linear-gradient(135deg, rgba(253, 251, 255, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%); }
        .dialog-title { color: #5b21b6; }
        .dialog-message-container::-webkit-scrollbar-track { background: rgba(139, 92, 246, 0.08); }
        .dialog-message-container::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); }
        .dialog-message-container::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.45); }
        .dialog-message { color: #4c1d95; }
        .dialog-input { border: 2px solid #8b5cf6; background: #faf5ff; color: #5b21b6; }
        .dialog-input::placeholder { color: #c4b5fd; }
        .dialog-input:focus { border-color: #7c3aed; background: #ffffff; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); }
        .dialog-button-primary { background: #8b5cf6; color: #ffffff; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #8b5cf6, 0 2px 8px rgba(139, 92, 246, 0.3); }
        .dialog-button-primary:hover { background: #7c3aed; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #7c3aed, 0 4px 12px rgba(139, 92, 246, 0.4); }
        .dialog-button-primary:active { box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #6d28d9, 0 1px 4px rgba(139, 92, 246, 0.3); }
        .dialog-button-secondary { background: rgba(255, 255, 255, 0.95); color: #8b5cf6; border: 2px solid #8b5cf6; }
        .dialog-button-secondary:hover { background: rgba(250, 245, 255, 0.98); border-color: #7c3aed; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2); }
        .dialog-button-secondary:active { background: rgba(245, 240, 255, 0.95); border-color: #6d28d9; }
        `,
    };

    class DialogManager {
        constructor() {
            Lib.addStyle(dialogStyle, "dialog-style");

            this.dialogQueue = [];
            this.currentDialog = null;
            this.isProcessing = false;
            this.transitionDelay = 100; // 多對話框間的過渡延遲

            this.positionMap = {
                top: 'position-top',
                center: 'position-center',
                bottom: 'position-bottom',
                left: 'position-left',
                right: 'position-right'
            };

            this.animationMap = {
                fade: 'animated-fade',
                top: 'animated-slide-top',
                bottom: 'animated-slide-bottom',
                left: 'animated-slide-left',
                right: 'animated-slide-right',
                scale: 'animated-scale'
            };

            this.durationMap = {
                fade: 400,
                top: 450,
                bottom: 450,
                left: 450,
                right: 450,
                scale: 450
            };

            this.fragment = Lib.createFragment;
        };

        getPositionClass(position) {
            return this.positionMap[position] || 'position-center';
        };

        getAnimationClass(animation) {
            if (!animation || animation === 'none') return 'no-animation';
            if (animation === true) return 'animated-fade';
            return this.animationMap[animation] || 'animated-fade';
        };

        getAnimationDuration(animation) {
            if (!animation || animation === 'none') return 0;
            if (animation === true) return 400;
            return this.durationMap[animation] || 400;
        };

        enqueue(options) {
            return new Promise(resolve => {
                this.dialogQueue.push({ options, resolve });
                if (!this.isProcessing) this.processQueue();
            })
        };

        async processQueue() {
            if (this.dialogQueue.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.isProcessing = true;
            const { options, resolve } = this.dialogQueue.shift();
            const hasNextDialog = this.dialogQueue.length > 0;

            if (this.currentDialog) {
                await this.closeCurrentDialog(this.currentDialog.animation, hasNextDialog);

                if (hasNextDialog) {
                    await new Promise(resolve => setTimeout(resolve, this.transitionDelay));
                }
            }

            // 創建新對話框
            const result = await this.createDialog(options);
            resolve(result);

            this.processQueue();
        };

        closeCurrentDialog(animation, hasNextDialog = false) {
            return new Promise(resolve => {
                if (!this.currentDialog) return resolve();

                const { overlay, dialog } = this.currentDialog;
                const duration = this.getAnimationDuration(animation);

                const remove = () => {
                    if (hasNextDialog) {
                        overlay.style.transition = 'opacity 0.15s ease-out';
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            overlay.remove();
                            this.currentDialog = null;
                            resolve();
                        }, 150);
                    } else {
                        overlay.remove();
                        this.currentDialog = null;
                        resolve();
                    }
                };

                if (duration > 0) {
                    overlay.$addClass('closing');
                    dialog.$addClass('closing');
                    setTimeout(remove, duration * 0.9);
                } else {
                    remove();
                }
            })
        };

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
                    align = 'center'
                } = rawOptions;

                const overlayAnimationClass = !animation || animation === 'none'
                    ? 'no-animation' : 'animated-fade';

                const dialogAnimationClass = this.getAnimationClass(animation);
                const hasQueue = this.dialogQueue.length > 0;

                const overlay = Lib.createElement("div", {
                    class: `dialog-overlay ${overlayAnimationClass} ${this.getPositionClass(position)}`,
                    // 如果有隊列，初始設為半透明，避免閃爍
                    style: hasQueue ? "opacity: 0;" : {},
                    on: {
                        click: event => {
                            const target = event.target;
                            if (target === overlay) handleClose();
                        }
                    }
                });

                const dialog = Lib.createElement("div", {
                    class: `dialog ${dialogAnimationClass}`,
                    style: `--dialog-width: ${width}px;`,
                });

                const content = Lib.createElement("div", {
                    class: "dialog-content"
                });

                const dialogTitle = Lib.createElement(
                    "div", {
                    class: title ? "dialog-title" : "dialog-title-spacer",
                    text: title ? title : "",
                });

                content.appendChild(dialogTitle);

                const msgBox = Lib.createElement("div", {
                    class: 'dialog-message-align dialog-message-container',
                    attr: { align }
                });

                const msg = Lib.createElement("div", {
                    class: 'dialog-message-align dialog-message',
                    attr: { align },
                    style: `--message-font-size: ${fontSize}px;`,
                    html: message.replace(/\n/g, '<br>')
                });

                msgBox.appendChild(msg);
                content.appendChild(msgBox);

                let inputElement = null;
                if (type === 'prompt') {
                    const inputWrap = Lib.createElement("div", {
                        class: 'dialog-input-container'
                    });

                    inputElement = Lib.createElement("input", {
                        class: 'dialog-input',
                        type: 'text',
                        value: defaultValue,
                        placeholder,
                        on: {
                            keydown: e => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleConfirm();
                                }
                            }
                        }
                    });

                    inputWrap.appendChild(inputElement);
                    content.appendChild(inputWrap);
                };

                const btnBox = Lib.createElement("div", {
                    class: 'dialog-buttons'
                });

                if (type === 'confirm' || type === 'prompt') {
                    const cancelBtn = Lib.createElement("button", {
                        class: 'dialog-button dialog-button-secondary',
                        text: cancelText,
                        on: {
                            pointerup: handleCancel
                        }
                    });
                    btnBox.appendChild(cancelBtn);
                };

                const confirmBtn = Lib.createElement("button", {
                    class: 'dialog-button dialog-button-primary',
                    text: confirmText,
                    on: {
                        pointerup: handleConfirm
                    }
                });

                const self = this;
                function handleClose(result) {
                    self.closeDialog(overlay, dialog, () => {
                        resolve(result);
                    }, animation, self.dialogQueue.length > 0);
                };

                function handleConfirm() {
                    const result = type === 'prompt'
                        ? inputElement?.value ?? '' : true;
                    handleClose(result);
                };

                function handleCancel() {
                    const result = type === 'prompt'
                        ? null : false;
                    handleClose(result);
                };


                btnBox.appendChild(confirmBtn);
                content.appendChild(btnBox);
                dialog.appendChild(content);
                overlay.appendChild(dialog);

                this.fragment.appendChild(overlay);
                document.body.appendChild(this.fragment);

                this.currentDialog = { overlay, dialog, animation };

                // 如果有隊列，延遲後淡入
                if (hasQueue) {
                    requestAnimationFrame(() => {
                        overlay.style.transition = 'opacity 0.2s ease-in';
                        overlay.style.opacity = '1';
                    })
                };

                // 延遲聚焦，確保動畫流暢
                setTimeout(() => {
                    if (inputElement) {
                        inputElement.focus();
                    } else {
                        confirmBtn.focus();
                    }
                }, hasQueue ? 150 : 50);

                if (autoClose && duration > 0) {
                    setTimeout(() => {
                        if (this.currentDialog?.overlay === overlay) handleConfirm();
                    }, duration * 1000);
                };
            })
        };

        closeDialog(overlay, dialog, callback, animation, hasNextDialog = false) {
            const duration = this.getAnimationDuration(animation);

            const finish = () => {
                if (hasNextDialog) {
                    overlay.style.transition = 'opacity 0.15s ease-out';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        if (this.currentDialog?.overlay === overlay) {
                            this.currentDialog = null;
                        }
                        callback?.();
                    }, 150);
                } else {
                    overlay.remove();
                    if (this.currentDialog?.overlay === overlay) {
                        this.currentDialog = null;
                    }
                    callback?.();
                }
            };

            if (duration > 0 && !hasNextDialog) {
                overlay.$addClass('closing');
                dialog.$addClass('closing');
                setTimeout(finish, duration * 0.9);
            } else finish();
        }
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