# **[ Eh/Ex ] 简易图片下载器**

---

## **👻 使用方法**

1. 安装浏览器脚本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安装脚本](https://update.greasyfork.org/scripts/472882/%5BEEx-Hentai%5D%20Downloader.user.js)
3. 前往 [e-hentai](https://e-hentai.org/) 或 [exhentai](https://exhentai.org/)

---

## **⚠️ 使用须知**
- 网络速度或服务器响应太慢容易发生 “缺失页数| 下载很慢 | 完全卡死”
- 数据请求和处理有速度限制，短时间请求过多 IP 会被暂时封禁，换个IP即可
- 如果卡很久不动，可以重新刷新，可能是IP被封禁，或服务器某些页面有问题

## **📜 功能概述**

### **下载按钮**
- 在漫画主页右上角创建下载按钮，点击即可下载

### **切换下载模式**
- 压缩下载
- 单图下载（新版插件有问题）

### **下载范围设置**
- 指定下载范围（完成后恢复默认）

### **强制压缩**
- 有些链接存在问题，始终无法获取数据会导致卡死，可以通过强制压缩，直接获取已下载的内容

## **⚙️ 额外配置（代码上方）**

| **参数**        | **说明**                                                     | **默认值** |
| :-------------- | :----------------------------------------------------------- | :--------- |
| `Dev`           | 启用开发模式，在控制台打印调试信息                           | `false`    |
| `ReTry`         | 下载失败时的重试次数，超过次数后跳过该文件                   | `10`       |
| `Original`      | 优先下载原图（有流量限制，未特别处理限制问题）               | `false`    |
| `ResetScope`    | 下载范围设置完成后，是否重置为默认值（不重置则保持上次设置） | `true`     |
| `CompleteClose` | 下载完成后自动关闭页面                                       | `false`    |

---

## **🔗 相关链接**

- **开发环境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 仓库**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 版本信息**

**发布版本：0.0.16** 

### **更新内容**
1. API 更新
2. 增加语言支持
3. 修改部分翻译

### **已知问题**
❗️ 目前不知道是网站问题还是其他问题，原本可以的逻辑现在出现了很多问题，有点烦躁了

当前有的 BUG 目前没时间修复（有时会遇到）[建议降回旧版本]：
1. 新版本插件在使用 `GM_xmlhttpRequest` 下载图片时，有些奇怪的问题，有时会卡住很久，甚至直接卡死

---