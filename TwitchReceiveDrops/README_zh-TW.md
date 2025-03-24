# **自動領取 Twitch 的 Drops**

---

## **👻 使用方法**

1. 安裝瀏覽器腳本管理工具（如 Tampermonkey）
2. 安裝腳本
3. 前往 [inventory](https://www.twitch.tv/drops/inventory) 頁面

---

## **⚠️ 使用須知**
- 當 Twitch 修改頁面元素，有可能造成功能失效，就需要重新配置 (有問題可反饋)
- ❗️ 個人使用上有問題，請先嘗試自定配置參數，這只是一個很簡單的腳本，沒有針對不同環境適應變化的功能
- 使用時確保腳本管理工具，已經載入此腳本，同時開啟直播頁面與 Inventory 頁面，即可放置於後台等待自動領取


## **📜 功能概述**

### **自動重啟直播**
- 配置 RestartLive 是 True 時啟用
- 當 inventory 頁面 "存在掉寶進度" 時，每次刷新都會進行紀錄，如進度始終沒有變化，且沒變化的時間 >= JudgmentInterval 的配置時間，將會判斷為直播中斷，進而重啟直播
- 盡量不要設置語言篩選可能導致找不到，會根據頻道的 Tags，是否與 FindTag 設置的文字匹配，並開啟第一個匹配直播
- 如果是第二次重啟直播，會自動關閉前一次窗口，始終保持一個直播窗口 (自行開啟的無效)

### **完成自動關閉**
- 配置 EndAutoClose 是 True 時啟用
- 存在被紀錄的掉寶進度，在完成後會自動關閉窗口
- 沒有被紀錄的掉寶進度，就不會觸發

### **清除過期進度**
- 配置 ClearExpiration 是 True 時啟用
- 這是針對活動時間已經過期的掉寶對象進行清除，但因為該功能需要判斷時間戳，針對不同語言時間戳的格式又不同
目前只有支援特定幾種語言，不在支援內的就不會有效果
- **🌐 支援語言**：根據網站設置自動適配以下語言：
  - en-US，en-GB，es-ES，fr-FR，pt-PT，pt-BR，ru-RU，de-DE，it-IT，tr-TR，es-MX，ja-JP，ko-KR，zh-TW，zh-CN


## **⚙️ 額外配置（代碼上方）**

| **參數** | **說明** | **預設值** |
| :----: | :----: | :----: |
| `RestartLive` | 自動重啟直播 | `true` |
| `EndAutoClose` | 活動完成後自動關閉窗口 | `true` |
| `TryStayActive` | "嘗試" 讓窗口始終處於活躍狀態 | `true` |
| `RestartLiveMute` | 重啟直播後靜音（不一定有效 or 比較慢運作） | `true` |
| `RestartLowQuality` | 重啟直播自動最低畫質 | `false` |
| `UpdateDisplay` | 在網頁標籤顯示檢查掉寶的間隔倒數 | `true` |
| `ClearExpiration` | 清除過期活動的掉寶進度 | `true` |
| `ProgressDisplay` | 在網頁標籤顯示掉寶進度 | `true` |
| `UpdateInterval` | 掉寶檢查的間隔時間（秒） | `120` |
| `JudgmentInterval` | 判斷重啟直播的間隔時間（分） | `6` |
| `FindTag` | 重啟直播查找的包含 Tag 標籤 | `drops、啟用掉寶、启用掉宝、드롭활성화됨` |

---

## **🔗 相關連結**

- **開發環境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 倉庫**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/TwitchReceiveDrops)

---

## **📦 版本資訊**

**發佈版本：0.0.16-Beta** 

### **更新內容**
1. 移除 早期跳出判斷
2. 修改 自動領取掉寶邏輯 (目前 時間過期的無法自動領取)

### **已知問題**
1.目前插件的 GM_notification 有些問題，依賴該 API 的功能實現，可能無法正常運行

---