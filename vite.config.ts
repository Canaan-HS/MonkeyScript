import fs from 'fs';
import path from 'path';

import { minify } from 'uglify-js';
import prettier from 'prettier';

import open from 'open';
import monkey from 'vite-plugin-monkey';
import { defineConfig, Plugin, ViteDevServer } from 'vite';

import config from './KemerEnhance/Dev/config'; // ? 引入特定腳本開發配置

/* 配置範例 */
interface configType {
    meta: string; // userscript 元數據
    entry: string; // 開發用入口檔案 (相對於腳本根目錄)
    devFileName: string; // 開發編譯檔名
    devOutDir: string; // 開發編譯目錄 (相對於腳本根目錄)
    releaseFileName: string; // 發佈編譯檔名
    releaseOutDir: string; // 發佈編譯目錄 (相對於腳本根目錄)
    userscript: object; // vite-plugin-monkey 的 userscript 配置
};

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
const restartFlag = '__SERVER_RESTARTED__';
function handleRestart(server: ViteDevServer) {
    delete process.env[restartFlag]; // 在行動前立即清除旗標
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
        if (process.env[restartFlag]) {
            handleRestart(server);
        }

        // 攔截重啟指令，為下一次重啟設置旗標
        const originalRestart = server.restart;
        server.restart = async function (...args: any[]) {
            process.env[restartFlag] = 'true';
            await originalRestart.apply(this, args);
        };
    },
});

/* 編譯後格式化 */
const isRelease = process.env.RELEASE === 'true';
const removeMarker = isRelease ? '__REMOVE_ON_RELEASE_BUILD__' : '__REMOVE_ON_DEV_BUILD__';
const userscriptPolisherPlugin = (): Plugin => ({
    name: 'userscript-polisher',
    apply: 'build',
    async closeBundle() {
        const finalScriptPath = isRelease
            ? path.join(config.releaseOutDir, config.releaseFileName)
            : path.join(config.devOutDir, config.devFileName);

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
            const processedContent = originalContent
                .substring(headerEndIndex + headerEndMarker.length)
                .split(/\r?\n/)
                .filter(line => {
                    const trimmed = line.trim();

                    /* vite-plugin-monkey 編譯處理 */
                    if (trimmed === '') return false; // 空行
                    if (/^['"]use strict['"];?$/.test(trimmed)) return false; // 'use strict';
                    if (/^var _monkeyWindow/.test(trimmed)) return false; // var _monkeyWindow
                    if (/^const \{.*?\}\s*=\s*_?monkeyWindow;/.test(trimmed)) return false; // const { ... } = _monkeyWindow

                    /* 自訂標記處理 */
                    if (trimmed.includes('__REMOVE_ON_BUILD__')) return false;
                    // if (trimmed.includes(removeMarker)) return false; // ? 暫時沒用到

                    return true;
                }).join('\n');

            // 格式化最終的完整內容
            const formattedCode: string = (
                isRelease
                    ? minify(processedContent, {
                        mangle: false,
                        compress: false,
                        output: {
                            beautify: true,
                            indent_level: 4,
                        }
                    }).code
                    : await prettier.format(processedContent, {
                        parser: 'babel',
                        printWidth: 800,
                    })
            ).trimEnd();

            const finalContent = config.meta + '\n\n' + formattedCode;
            fs.writeFileSync(finalScriptPath, finalContent, 'utf-8');
        } catch (error) {
            console.error('[process] An error occurred:', error);
        }
    }
});

export default defineConfig({
    build: {
        outDir: isRelease ? config.releaseOutDir : config.devOutDir,
        emptyOutDir: false,
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
                fileName: isRelease ? config.releaseFileName : config.devFileName,
            }
        }),
        serverRestartWatcherPlugin(),
        userscriptPolisherPlugin()
    ],
});