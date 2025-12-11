export default `

// ==UserScript==
// @name         Media Volume Booster
// @name:zh-TW   媒體音量增強器
// @name:zh-CN   媒体音量增强器
// @name:en      Media Volume Booster
// @version      2025.12.11-Beta
// @author       Canaan HS
// @description         調整媒體音量與濾波器，增強倍數最高 20 倍，設置可記住並自動應用。部分網站可能無效、無聲音或無法播放，可選擇禁用。
// @description:zh-TW   調整媒體音量與濾波器，增強倍數最高 20 倍，設置可記住並自動應用。部分網站可能無效、無聲音或無法播放，可選擇禁用。
// @description:zh-CN   调整媒体音量与滤波器，增强倍数最高 20 倍，设置可记住并自动应用。部分网站可能无效、无声音或无法播放，可选择禁用。
// @description:en      Adjust media volume and filters with enhancement factor up to 20x. Settings are saved and auto-applied. May not work on some sites (causing no sound or playback issues). Can be disabled if needed.

// @noframes
// @match        *://*/*
// @icon         https://cdn-icons-png.flaticon.com/512/16108/16108408.png

// @license      MPL-2.0
// @namespace    https://greasyfork.org/users/989635
// @supportURL   https://github.com/Canaan-HS/MonkeyScript/issues

// @resource     Icon https://cdn-icons-png.flaticon.com/512/11243/11243783.png
// @require      https://update.greasyfork.org/scripts/487608/1711589/SyntaxLite_min.js

// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_addValueChangeListener

// @run-at       document-body
// ==/UserScript==

`