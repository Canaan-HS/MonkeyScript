/* 實現方式

匹配頁面: https://www.twitch.tv/* 後面沒有 (觀看頁面)

必要條件 @noframes
創建 iframe
iframe.src = https://www.twitch.tv/drops/inventory

獲取標題元素下方本身的, 標籤, 找到 /directory/category/遊戲名稱 大致這樣的標籤, 判斷這個遊戲
根據 inventory 頁面的 活動頻道, 比對之後就可以得知是哪個遊戲

刷新方式用 庫存 跟 所有活動, 這兩個按鈕點擊後, 刷新庫存資訊
後續採用相同邏輯處理

重啟直播會變成, 先開啟頁面後去查找, 找到後開啟再去調用原始頁面關閉

*/