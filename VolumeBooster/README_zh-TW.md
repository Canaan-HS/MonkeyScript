# **媒體音量增幅**

---

## **👻 使用方法**

1. 安裝瀏覽器腳本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安裝腳本](https://update.greasyfork.org/scripts/472190/%E5%AA%92%E9%AB%94%E9%9F%B3%E9%87%8F%E5%A2%9E%E5%BC%B7%E5%99%A8.user.js)
3. 前往任意有媒體的網站（某些不支援）

---

## **🚧 開發說明**

個人電腦主板受損，常會有聲音忽大忽小的狀況，因此寫了該腳本

目前只獲取基本的媒體節點，沒有應對某些網站差異，所以會有許多不支援的網站

調整菜單是我個人設計的，覺得很醜我也沒辦法，沒有設計的天賦


## **⚠️ 使用須知**
- 會受到其他媒體相關腳本影響，會出現失效或是設置被變更
- 對於某些網站無效時，會出現「調整沒變化 | 直接沒聲音 | 無法播放」此時就禁用增幅


## **👀 菜單展示**
![Screenshot](https://github.com/user-attachments/assets/61547ac5-8653-45fb-bf26-bba4ee174f0b)


## **📜 功能概述**
- 頁面上有媒體時，會套用增幅節點，成功後可自行設置聲音的增幅，也可完全靜音
- 設置後如選擇保存，相同網域的分頁也會同時套用，如只針對單個分頁，設置後可點擊空白區塊直接關閉菜單

### **啟用/禁用**
- 預設都是啟用，禁用某網域後，將不會套用增幅

### **設置菜單**
- 可透過本管理工具的菜單開啟，或按下（Alt + B）

---

## **🔗 相關連結**

- **開發環境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 倉庫**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/VolumeBooster)

---

## **📦 版本資訊**

**發佈版本：0.0.40**

### **更新內容**
1. 降低載入延遲
2. 調整預設參數 與 UI 設置範圍

---