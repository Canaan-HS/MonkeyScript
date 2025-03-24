# **增強網站使用體驗**

## ⚠️ 目前網站大改，臨時進行修復，部份功能失效 或是有 BUG，有問題反饋

---

## **👻 使用方法**

1. 安裝瀏覽器腳本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安裝腳本](https://update.greasyfork.org/scripts/472096/Kemer%20%E5%A2%9E%E5%BC%B7.user.js)
3. 前往
    - [kemono](https://kemono.su/)
    - [coomer](https://coomer.su/)
    - [nekohouse](https://nekohouse.su/)

---

## **📜 功能概述**

### **設置菜單（僅限帖子內）**
- 設置原圖，寬高與間距，及時預覽變更
- 菜單語言支援 (預設英語)
    - 繁體中文
    - 簡體中文
    - 日語
    - 英語


## **⚙️ 額外配置（代碼上方）**

| **參數** | **說明** | **預設值** |
| :----: | :----: | :----: |
| `BlockAds` | 簡單阻擋廣告 | `true` |
| `BackToTop` | 帖子跳轉翻頁後，自動回到頂部 | `true` |
| `KeyScroll` | 鍵盤熱鍵功能 ↑↓ 自動滾動 | `true` |
| `DeleteNotice` | 刪除公告 | `true` |
| `SidebarCollapse` | 側邊攔摺疊，滑鼠靠近恢復 | `true` |
| `FixArtist` | 以 Pixiv 名稱，修改網站顯示名稱，可自定名稱 | `true` |
| `TextToLink` | 將文本形式的連結字串，轉換成可點擊連結 | `true` |
| `CardZoom` | 調整預覽卡大小 | `true` |
| `CardText` | 調整預覽卡文字效果 | `true` |
| `QuickPostToggle` | 快速切換帖子預覽 (目前僅限 nekohouse) | `true` |
| `NewTabOpens` | 將頁面跳轉都以新分頁開啟 | `true` |
| `ExtraButton` | 額外的下方按鈕，用於快速回到頂部，與直接換頁 | `true` |
| `LinkBeautify` | 美化下載連結，並讓 (browse ») 可用滑鼠懸浮直接顯示內容 | `true` |
| `CommentFormat` | 調整評論的排版 | `true` |
| `VideoBeautify` | 美化影片的樣式，並將影片下載連結，顯示於標題位置 | `true` |
| `OriginalImage` | 自動原圖 | `true` |


## **📜 其他說明**

```
設置選單 (沒有及時響應，可以重新整理頁面)

目前只可以在帖子內，也就是可以自動原圖的地方，才會出現設置選單，於上方插件開啟
當前只有調整圖片大小功能，我一個沒設計美感的人，真的很懶得去完成後續菜單w


KeyScroll:
(模式的差異就是實現方式，根據使用者喜歡自己選擇)
↑ ↓ 鍵盤觸發，按下滾動時，再次按下會停止，按反方向只會觸發，反向的滾動

[1] 動畫幀滾動
[2] 間隔滾動

CardText:
[1] 帖子預覽頁面，預覽卡文字隱藏，滑鼠移動過去後恢復
[2] 帖子預覽頁面，預覽卡文字淡化，滑鼠移動過去後恢復

CardZoom:
[1] 預覽卡放大 [ v0.0.46 以前的都是他 ]
[2] 預覽卡放大 + 懸浮縮放

VideoBeautify:
[1] 將 Download 的區域的下載連結，複製到影片的上方作為標題，可直接點上方標題下載，或滾動到 Download 區域下載
[2] 將 Download 的區域的下載連結，移動到影片的上方作為標題，可直接點上方標題下載，Download 區域有重複的會被移除掉

OriginalImage:
[1] 快速的自動原圖，網路和電腦負擔較高，但速度較快
[2] 超慢的自動原圖，會等到一張圖載入完成，才會載入下一張，對網路和電腦負擔低，但速度超慢
[3] 滾動觀看時觸發載入原圖，沒觀看就不會自動載原圖，對網路和電腦負擔取決於你滾輪多快，載入速度中等

原圖實驗渲染方式 (有時候伺服器問題會導致卡住，也可以手動點擊觸發):
要恢復將 experiment 改成 false

原先是直接替換預覽圖片，接著等待原圖載入
實驗方式改成，先獲取原圖數據，在進行替換，載入時 預覽圖會有綠框指示器，並且會顯示載入進度
```

---

## **🔗 相關連結**

- **開發環境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 倉庫**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerEnhance)

---

## **📦 版本資訊**

**發佈版本：0.0.49-Beta8** 

### **更新內容**
1. 修復 阻擋廣告

---