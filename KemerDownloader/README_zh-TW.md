# **圖片一鍵下載 and 數據處理工具**

## ⚠️ 目前網站大改, 某些功能失效, 或導致網站無法正常運作, 先停用該腳本等待修正

---

## **👻 使用方法**

1. 安裝瀏覽器腳本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安裝腳本](https://update.greasyfork.org/scripts/472282/Kemer%20%E4%B8%8B%E8%BC%89%E5%99%A8.user.js)
3. 前往
    - [kemono](https://kemono.su/)
    - [coomer](https://coomer.su/)
    - [nekohouse](https://nekohouse.su/)

---

## **⚠️ 使用須知**
- 建議等到頁面，原圖全部顯示，在按下下載
- 當前頁面沒有 Files 標籤，就不會創建下載按鈕
- 有時頁面載入太快，MutationObserver 會來不及創建，可能會導致按鈕無法創建


## **📜 功能概述**

### **下載按鈕**
- 在頁面 Files 標籤旁創建，覺得很不顯眼的，你是對的因為本來就是這樣設計的

### **切換下載模式**
- 壓縮下載
- 單圖下載 (新版插件怪怪的)

### **一鍵開帖（僅限帖子預覽頁面）**
- 輸入開啟的範圍，自動開啟當前頁面所有帖子

### **數據獲取（僅限帖子預覽頁面）**
- 以當前頁數開始，直到最後一頁，獲取帖子相關數據 (目前發佈版僅在 nekohouse 可正常運作，開發版則是另外兩個)


## **⚙️ 額外配置（代碼上方）**
|       **參數**       |              **說明**               | **預設值** |
| :------------------: | :---------------------------------: | :--------: |
|        `Dev`         |   開發模式，在控制台列印調試資訊    |  `false`   |
|   `ContainsVideo`    |  下載包含影片，會大幅增加下載時間   |  `false`   |
|   `CompleteClose`    |       下載完成後自動關閉頁面        |  `false`   |
|  `ConcurrentDelay`   |       下載送出請求的延遲 (秒)       |    `3`     |
| `ConcurrentQuantity` |       下載同時發起請求的數量        |    `5`     |
|   `BatchOpenDelay`   | 一鍵開帖，開啟每個帖子的延遲 (毫秒) |   `500`    |

---

## **🔗 相關連結**

- **開發環境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 倉庫**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerDownloader)

---

## **📦 版本資訊**

**發佈版本：0.0.21-Beta5** 

### **更新內容**
1. 修正 下載數據抓取問題
2. 修改 預設配置 (檔案名稱)
3. 添加 下載線程數 及 延遲 (替代實驗性延遲)

### **已知問題**
1. Tampermonkey 較新的版本 GM_download API 有點異常, 導致單圖下載功能會出錯, 建議只使用壓縮下載

---