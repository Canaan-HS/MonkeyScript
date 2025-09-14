import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

import open from 'open';
import monkey from 'vite-plugin-monkey';
import { defineConfig, Plugin, ViteDevServer } from 'vite';

import config from './ExDownloader/Dev/config'; // ? 引入特定腳本開發配置

const browserPaths = {
    brave: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
};

// 取得設置的瀏覽器
const browserName = process.env.BROWSER;
let openConfig: boolean | { app: { name: string } } = true;
if (browserName) {
    const browserPath = browserPaths[browserName as keyof typeof browserPaths];
    if (browserPath && fs.existsSync(browserPath)) {
        openConfig = { app: { name: browserPath } };
    }
};

/* 重新啟動瀏覽器 */
const RESTART_FLAG = 'VITE_PLUGIN_RESTARTED';
function handleRestart(server: ViteDevServer) {
    delete process.env[RESTART_FLAG]; // 在行動前立即清除旗標
    server.httpServer?.once('listening', () => {
        const url = server.resolvedUrls?.local[0];
        if (url) {
            open(url, typeof openConfig === 'object' ? openConfig : undefined);
        }
    });
};
const serverRestartWatcherPlugin = (): Plugin => ({
    name: 'server-restart-watcher',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
        // 檢查是否為重啟後的進程
        if (process.env[RESTART_FLAG]) {
            handleRestart(server);
        }

        // 攔截重啟指令，為下一次重啟設置旗標
        const originalRestart = server.restart;
        server.restart = async function (...args: any[]) {
            process.env[RESTART_FLAG] = 'true';
            await originalRestart.apply(this, args);
        };
    },
});

/* 編譯後格式化 */
const userscriptPolisherPlugin = (): Plugin => ({
    name: 'userscript-polisher',
    apply: 'build',
    async closeBundle() {
        const finalScriptPath = path.join(config.outDir, config.fileName);

        try {
            if (!fs.existsSync(finalScriptPath)) {
                console.error(`[process] Error: File not found at ${finalScriptPath}`);
                return;
            }

            const originalContent = fs.readFileSync(finalScriptPath, 'utf-8');

            // 找到元數據區塊的結尾
            const headerEndMarker = '// ==/UserScript==';
            const headerEndIndex = originalContent.indexOf(headerEndMarker);

            if (headerEndIndex === -1) {
                console.error('[process] Error: UserScript header end marker not found.');
                return;
            }

            // 逐行清理程式碼
            const processedContent = originalContent.substring(headerEndIndex + headerEndMarker.length)
                .split(/\r?\n/)
                .map(line => {
                    if (/^\s*$/.test(line)) return; // 空行
                    if (/^\s*['"]use strict['"];?$/.test(line)) return; // 'use strict';
                    if (/^\s*var _monkeyWindow/.test(line)) return; // var _monkeyWindow
                    if (/^\s*const \{.*?\}\s*=\s*_?monkeyWindow;/.test(line)) return; // const { ... } = _monkeyWindow
                    return line
                })
                .filter(Boolean).join('\n');

            const finalContent = config.meta + '\n\n' + processedContent;

            // 格式化最終的完整內容
            let formattedContent = await prettier.format(finalContent, {
                parser: 'babel',
                printWidth: 800,
            });

            // 移除 Prettier 可能在結尾添加的多餘換行
            formattedContent = formattedContent.trimEnd();
            fs.writeFileSync(finalScriptPath, formattedContent, 'utf-8');
        } catch (error) {
            console.error('[process] An error occurred:', error);
        }
    }
});

export default defineConfig({
    build: {
        outDir: config.outDir,
    },
    server: {
        host: '0.0.0.0',
        open: openConfig as any,
    },
    plugins: [
        monkey({
            entry: config.entry,
            userscript: {
                version: 'alpha',
                author: 'Canaan HS',
                description: 'vite dev server',
                ...config.userscript as any,
            },
            server: {
                open: false,
                mountGmApi: true,
                prefix: '_vite-monkey-dev_',
            },
            build: {
                autoGrant: false,
                fileName: config.fileName,
            }
        }),
        serverRestartWatcherPlugin(),
        userscriptPolisherPlugin()
    ],
});
