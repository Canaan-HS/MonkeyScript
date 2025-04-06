# **媒体音量增幅**

---

## **👻 使用方法**

1. 安装浏览器脚本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安装脚本](https://update.greasyfork.org/scripts/472190/%E5%AA%92%E9%AB%94%E9%9F%B3%E9%87%8F%E5%A2%9E%E5%BC%B7%E5%99%A8.user.js)
3. 前往任意有媒体的网站（某些不支持）

---

## **🚧 开发说明**

个人电脑主板受损，常会有声音忽大忽小的情况，因此写了该脚本

目前只获取基本的媒体节点，没有应对某些网站差异，所以会有许多不支持的网站

调整菜单是我个人设计的，觉得很丑我也没办法，没有设计的天赋


## **⚠️ 使用须知**
- 会受到其他媒体相关脚本影响，会出现失效或是设置被变更
- 对于某些网站无效时，会出现「调整没变化 | 直接没声音 | 无法播放」此时就禁用增幅


## **👀 菜单展示**
![Screenshot](https://github.com/user-attachments/assets/61547ac5-8653-45fb-bf26-bba4ee174f0b)


## **📜 功能概述**
- 页面上有媒体时，会套用增幅节点，成功后可自行设置声音的增幅，也可完全静音
- 设置后如选择保存，相同域名的分页也会同时套用，如只针对单个分页，设置后可点击空白区域直接关闭菜单

### **启用/禁用**
- 预设都是启用，禁用某网域后，将不会套用增幅

### **设置菜单**
- 可通过本管理工具的菜单打开，或按下（Alt + B）

---

## **🔗 相关链接**

- **开发环境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 仓库**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/VolumeBooster)

---

## **📦 版本信息**

**发布版本：0.0.39**

### **更新内容**
1. 增加 滤波器与压缩调整
2. 修改 菜单设计

---