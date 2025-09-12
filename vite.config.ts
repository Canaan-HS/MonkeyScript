import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

import config from './ExDownloader/Dev/config';
import metaData from './ExDownloader/Dev/metadata';

/* 解析運行的瀏覽器 */
const browserPaths = {
    brave: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
};

const browserName = process.env.BROWSER;
const openConfig = browserName && browserPaths[browserName as keyof typeof browserPaths]
    ? { app: { name: browserPaths[browserName as keyof typeof browserPaths] } }
    : true;

/* 編譯後格式化 */
const meta = metaData.trim();
const userscriptPolisherPlugin = () => ({
    name: 'userscript-polisher',
    apply: 'build' as const,
    async closeBundle() {
        const finalScriptPath = path.join(config.outDir, config.fileName);

        try {
            if (!fs.existsSync(finalScriptPath)) {
                console.error(`[process] Error: File not found at ${finalScriptPath}`);
                return;
            }

            const originalContent = fs.readFileSync(finalScriptPath, 'utf-8');

            // --- 找到元數據區塊的結尾 ---
            const headerEndMarker = '// ==/UserScript==';
            const headerEndIndex = originalContent.indexOf(headerEndMarker);

            if (headerEndIndex === -1) {
                console.error('[process] Error: UserScript header end marker not found.');
                return;
            }

            // --- 逐行清理程式碼 ---
            const processedContent = originalContent.substring(headerEndIndex + headerEndMarker.length)
                .split(/\r?\n/)
                .map(line => {
                    if (/^\s*$/.test(line)) return; // 空行
                    if (/^\s*['"]use strict['"];?\s*$/.test(line)) return; // 'use strict';
                    if (/^\s*var _GM_/.test(line)) return; // var _GM_
                    if (/^\s*var _monkeyWindow/.test(line)) return; // var _monkeyWindow
                    if (/^\s*const \{.*?\} = _monkeyWindow;/.test(line)) return; // const { ... } = _monkeyWindow

                    return line.replace(/_GM_([a-zA-Z]+)/g, 'GM_$1'); // 將 _GM_ 替換為 GM_
                })
                .filter(Boolean)
                .join('\n');

            // --- 組合最終的完整內容 ---
            const finalContent = meta + '\n\n' + processedContent;

            // --- 格式化最終的完整內容 ---
            let formattedContent = await prettier.format(finalContent, {
                parser: 'babel',
            });

            // --- 移除 Prettier 可能在結尾添加的多餘換行 ---
            formattedContent = formattedContent.trimEnd();

            // --- 寫入最終檔案 ---
            fs.writeFileSync(finalScriptPath, formattedContent, 'utf-8');
            console.log('[process] Userscript polished successfully!');

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
                prefix: 'vite-monkey-dev',
            },
            build: {
                autoGrant: false,
                fileName: config.fileName,
            }
        }),
        userscriptPolisherPlugin()
    ],
});
