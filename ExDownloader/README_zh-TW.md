# **[ Eh/Ex ] 簡易圖片下載器**

---

## **👻 使用方法**

1. 安裝瀏覽器腳本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安裝腳本](https://update.greasyfork.org/scripts/472882/%5BEEx-Hentai%5D%20Downloader.user.js)
3. 前往 [e-hentai](https://e-hentai.org/) 或 [exhentai](https://exhentai.org/)

---

## **⚠️ 使用須知**
- 網速或伺服器響應太慢較容易發生 「缺失頁數| 下載很慢 | 完全卡死」
- 數據請求和處理有速度限制，短時間請求太多 IP 還是會被 暫時 Ban，換個IP就好
- 如果卡很久都不動，可以重新整理，因為有可能是 IP 被 Ban，或是伺服器有某些頁面有問題


## **📜 功能概述**

### **下載按鈕**
- 漫畫主頁右上創建下載按鈕，點擊直接下載

### **切換下載模式**
- 壓縮下載
- 單圖下載 (新版插件怪怪的)

### **下載範圍設置**
- 指定下載範圍 (完成後恢復預設)

### **強制壓縮**
- 有些連結有問題，始終無法取得數據會導致卡死，可透過強制壓縮，直接取得已經下載好的


## **⚙️ 額外配置（代碼上方）**

| **參數**        | **說明**                                                     | **預設值** |
| :-------------- | :----------------------------------------------------------- | :--------- |
| `Dev`           | 啟用開發模式，在控制台列印調試資訊                           | `false`    |
| `ReTry`         | 下載失敗時的重試次數，超過次數後跳過該檔案                   | `10`       |
| `Original`      | 優先下載原圖（有流量限制，未特別處理限制問題）               | `false`    |
| `ResetScope`    | 下載範圍設置完成後，是否重置為預設值（不重置則維持上次設置） | `true`     |
| `CompleteClose` | 下載完成後自動關閉頁面                                       | `false`    |

---

## **🔗 相關連結**

- **開發環境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 倉庫**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 版本資訊**

**發佈版本：0.0.16**

### **更新內容**
1. API 更新
2. 增加 語言支援
3. 修改 部份翻譯

### **已知問題**
❗️ 目前不知道是網站還是什麼的問題, 原先可以的邏輯現在問題一堆, 開始有點煩躁了

目前有的 BUG 目前沒時間修復 (有時候會遇到) [推薦降回舊版本]:
1. 目前較新版本的插件，在使用 `GM_xmlhttpRequest` 下載圖片時，有些奇怪的問題，有時會卡住很久，甚至直接卡死

---