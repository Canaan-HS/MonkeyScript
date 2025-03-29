# **油猴 API (僅個人有用過的)**

[API 文檔](https://www.tampermonkey.net/documentation.php)

> **文件標頭**

```
所有的標頭 與 事先導入, 都會定義在這個範圍內
並以註解形式標記

// 標記 ...

// ==UserScript==
// @name 腳本名稱
// @description 腳本描述
// ==/UserScript==
```

**`@name`**
```
// @name 我的腳本
// @name:en MyScript
// @name:ja 私のスクリプト
```

**`@version`**
```
// @version 0.0.1
// @version 0.0.1-Beta2
// @version 2000/07/05
```

**`@description`**
```
// @description 腳本描述
// @description:en Script description
```

**`@author`**
```
// @author 作者
```

**`@website`**
```
// @website 作者網站連結
```

**`@homepage`**
```
// @homepage 作者頁面連結
```

**`@namespace`**
```
// @namespace 腳本網站連結
```

**`@icon`**
```
基本沒啥差別, 統一用 @icon 就好, 可以使用 連結 或 base64

// @icon 腳本圖示
// @iconURL 腳本圖示
// @icon64 高清腳本圖示
// @icon64URL 高清腳本圖示
```

**`@match`**
```
// @match 腳本支援的網站
// @match *://www.google.com/
```

**`@include`**
```
允許使用正則

// @include 腳本支援的網站
```

**`@exclude`**
```
// @exclude 腳本排除運行網站
```

**`@license`**
```
腳本授權的規範

// @license MIT
```

**`@copyright`**
```
// @copyright 著作權
```

**`@run-at`**
```
腳本載入時機

DOM 開始前就載入
// @run-at document-start

DOM 有 Body 標籤出現時載入
// @run-at document-body

在 DOMContentLoaded 觸發後載入
// @run-at document-idle

在 DOM 完整載入後 才 載入
// @run-at document-end

點選菜單 載入
// @run-at context-menu
```

**`@connect`**
```
設置針對 GM_xmlhttpRequest, 要進行跨域請求時的設置

// @connect *
```

**`@noframes`**
```
禁止再 iframe 中運行, 某些網站會有需多 iframe
如果不加入這個, 腳本可能會被反覆多次載入, 而導致異常
當然也能在腳本開頭判斷, 但加入這個比較簡單

// @noframes
```

**`@updateURL`**
```
// @updateURL 腳本更新時檢查的網址
```

**`@downloadURL`**
```
// @downloadURL 要下載更新的網址
```

**`@supportURL`**
```
// @supportURL 用戶反饋的網址
```

**`@require`**
```
請求外部的腳本

// @require https://update.greasyfork.org/scripts/...js
```

**`@resource`** [@grant 說明](#getResource)
```
載入外部無特定類型資源

// @resource Css https://...css
// @resource Json https://...json
// @resource 我的圖標 https://...ico

要以文本類型使用的資源, 可以在腳本內這樣調用
(以下 api 需要透過 @grant 導入)

GM_addStyle(
    GM_getResourceText(Css)
)

獲取索引連結
GM_getResourceURL(我的圖標)
```

---

> **權限授權 與 API 調用**

**`@grant none`**
```JavaScript
沒有要使用的可以直接這樣

// @grant none

```

**`@grant GM_info`**
```JavaScript
// @grant GM_info

console.log(`腳本資訊: ${GM_info()}`);
```

**`@grant unsafeWindow`**
```JavaScript
提供訪問 windows 原型的 API

// @grant unsafeWindow

或是

// @grant window.focus
// @grant window.close

導入後的調用

unsafeWindow.要調用的 API

在沒導入時, 你一樣可以透過 window.api 調用你要的功能
但不見得有用就是, 透過 JavaScript 直接運行, 是被瀏覽器限制很多的

window.focus()
window.close()
```

**`@grant window.onurlchange`**
```JavaScript
可監聽 url 變化

// @grant window.onurlchange

window.addEventListener("urlchange", change => {
    console.log(change);
})
```

**`@grant GM_addStyle`**
```JavaScript
在 head 添加樣式表

// @grant GM_addStyle

const css = `
    body {
        ...
    }
`

GM_addStyle(css)
```

**`@grant GM_addElement`**
```JavaScript
創建元素

// @grant GM_addElement

GM_addElement("父節點", "標籤", "屬性")
GM_addElement(document.body, "a", {
    href: "https://example.com/",
    class: "className",
    textContent: "我的連結"
});

或是

const img = GM_addElement("img", {一些屬性設置});
element.appendChild(img);
```

**`@grant GM_setValue`**
```JavaScript
將數據保存在, 腳本管理器的存儲空間

// @grant GM_setValue

GM_setValue("索引 Key", value)

對相同的 索引 Key, 使用 GM_setValue 他會覆蓋原有數據
```

**`@grant GM_getValue`**
```JavaScript
獲取腳本管理器存儲空間, 保存的數據

// @grant GM_getValue

const value = GM_getValue("索引 Key", 沒有該 key 的預設回傳)

沒有設置預設, 當沒有取到數據, 會得到一個 null
```

**`@grant GM_listValues`**
```JavaScript
獲取所有保存值列表

// @grant GM_listValues

const data = GM_listValues()
```

**`@grant GM_deleteValue`**
```JavaScript
刪除保存值

// @grant GM_deleteValue

GM_deleteValue("索引 Key")
```

**`@grant GM_addValueChangeListener`**
```JavaScript
監聽保存值變化

// @grant GM_addValueChangeListener

GM_addValueChangeListener("索引 Key", function (key, old_value, new_value, remote) {
    if (remote) { // 代表來自其他分頁的修改
        console.log({
            "被修改的 Key": key,
            "原始的 Value": old_value,
            "修改的 Value": new_value
        });
    }
})
```

**`@grant GM_removeValueChangeListener`**
```JavaScript
刪除監聽器

// @grant GM_removeValueChangeListener

GM_removeValueChangeListener("索引 Key")
```

<div id="getResource"></div>

**`@grant GM_getResourceText`**
```JavaScript
// @grant GM_getResourceText
// @grant GM_getResourceURL

根據數據使用的方法調用, 搭配 @resource 載入的資源
```

**`@grant GM_setClipboard`**
```JavaScript
// @grant GM_setClipboard

GM_setClipboard("將這段文本添加到剪貼簿, 當你使用貼上就會看到")
```

**`@grant GM_cookie`**
[範例](https://github.com/scriptscat/scriptcat/blob/main/example/gm_cookie.js)

**`@grant GM_registerMenuCommand`**
```JavaScript
// @grant GM_registerMenuCommand

GM_registerMenuCommand(菜單名稱, 呼叫函數, {
    id: 再次創建時, 同樣 id 的會進行覆蓋
    title: 當滑鼠在菜單上時, 提示該菜單功能
    accessKey: 設置快捷鍵用於開啟菜單
    autoClose: 點擊菜單後是否自動關閉
});

GM_registerMenuCommand(菜單名稱, function() {函數()});
```

**`@grant GM_unregisterMenuCommand`**
```JavaScript
刪除菜單

// @grant GM_unregisterMenuCommand

const Menu = GM_registerMenuCommand(名稱, 函數)
GM_unregisterMenuCommand(Menu);
```

**`@grant GM_openInTab`**
```JavaScript
開新分頁

// @grant GM_openInTab

GM_openInTab("URL", {
    active: 新分頁是否轉移焦點,
    insert: 是否插入至當前頁面的後方,
    setParent: 是否將新標籤頁的父頁面設置為當前頁面
});
```

**`@grant GM_notification`**
```JavaScript
創建瀏覽器通知 (較新的可能不適用)

// @grant GM_notification

GM_notification({
    title: 標題,
    text: 顯示文字,
    silent: 是否播放通知音,
    image: 圖片 URL,
    timeout: 持續時間,
    onclick: ()=> 通知被點觸發,
    ondone: ()=> 通知關閉後觸發
})
```

**`@grant GM_download`**
```JavaScript
用於直接下載資源

GM_download(
    url,
    name,
    headers,
    saveAs,
    conflictAction,
    onload,
    onerror,
    onprogress,
    ontimeout
)

const download = GM_download({
    url: "http://example.com/file.txt",
    name: "file.txt",
    headers: {通常自帶不用改},
    saveAs: 是否詢問下載位置,
    conflictAction: 重複名稱處理 (uniquify 重新命名) (overwrite 覆蓋) (prompt 提示詢問),
    onload: () => {
        下載完成操作
    },
    onprogress: (progress) => {
        下載進度
    },
    ontimeout: () => {
        超時失敗
    }
})

download.abort(); // 停止下載
```

**`@grant GM_xmlhttpRequest`**
```JavaScript
可發起跨域請求的強大 API

// @grant GM_xmlhttpRequest

參數 (非全部參數, 更多看文檔):
method: [GET, HEAD, POST, PUT, DELETE]
url: 請求URL
headers: 請求頭
data: 發送字串
fetch: 是否改用 fetch 而不是 xmlhttpRequest
cookie: 附帶 cookie (通常會自己獲取)
nocache: 是否使用緩存
revalidate: 是否重新驗證緩存
timeout: 超時
responseType: [text, arraybuffer, blob, document, json, stream]
onload: 請求成功操作
onprogress: 請求追蹤
onerror: 請求失敗操作

GM_xmlhttpRequest({
    method: "GET",
    url: "https://example.com/",
    headers: {
       "Content-Type": "application/json"
    },
    onload: (response) => {
        console.log("回傳數據", response.response);
        console.log("狀態碼", response.status);
        console.log("響應頭", response.responseHeaders);
        console.log("就緒狀態", response.readyState);
        console.log("最終網址, 適用於索引變更, 正確連結以請求頭返回", response.finalUrl);
        console.log("Dom, 可使用 querySelector 直接查找", response.responseXML);
        console.log("文本", response.responseText);
    },
    onprogress: (progress) => {
         
    },
    onerror: (error) => {
   
    }
});
```