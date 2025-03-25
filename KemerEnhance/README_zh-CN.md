# **增强网站使用体验**

## ⚠️ 目前网站大改，临时进行修复，部分功能失效或是有BUG，有问题反馈

---

## **👻 使用方法**

1. 安装浏览器脚本管理工具（如 [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [安装脚本](https://update.greasyfork.org/scripts/472096/Kemer%20%E5%A2%9E%E5%BC%B7.user.js)
3. 前往
   - [kemono](https://kemono.su/)
   - [coomer](https://coomer.su/)
   - [nekohouse](https://nekohouse.su/)

---

## **📜 功能概述**

### **设置菜单（仅限帖子内）**

- 设置原图，宽高与间距，实时预览变更
- 菜单语言支持（默认英语）
  - 繁体中文
  - 简体中文
  - 日语
  - 英语

## **⚙️ 额外配置（代码上方）**

|     **参数**      |                        **说明**                        | **默认值** |
| :---------------: | :----------------------------------------------------: | :--------: |
|    `BlockAds`     |                      简单阻挡广告                      |   `true`   |
|    `BackToTop`    |              帖子跳转翻页后，自动回到顶部              |   `true`   |
|    `KeyScroll`    |                键盘热键功能 ↑↓ 自动滚动                |   `true`   |
|  `DeleteNotice`   |                        删除公告                        |   `true`   |
| `SidebarCollapse` |                侧边栏折叠，鼠标靠近恢复                |   `true`   |
|    `FixArtist`    |      以 Pixiv 名称，修改网站显示名称，可自定名称       |   `true`   |
|   `TextToLink`    |        将文本形式的链接字符串，转换成可点击链接        |   `true`   |
|    `CardZoom`     |                     调整预览卡大小                     |   `true`   |
|    `CardText`     |                   调整预览卡文字效果                   |   `true`   |
| `QuickPostToggle` |         快速切换帖子预览（目前仅限 nekohouse）         |   `true`   |
|   `NewTabOpens`   |               将页面跳转都以新标签页打开               |   `true`   |
|   `ExtraButton`   |      额外的下方按钮，用于快速回到顶部，与直接换页      |   `true`   |
|  `LinkBeautify`   | 美化下载链接，并让（browse »）可用鼠标悬浮直接显示内容 |   `true`   |
|  `CommentFormat`  |                     调整评论的排版                     |   `true`   |
|  `VideoBeautify`  |    美化视频的样式，并将视频下载链接，显示于标题位置    |   `true`   |
|  `OriginalImage`  |                        自动原图                        |   `true`   |

## **📜 其他说明**

```
设置选单（没有实时响应，可以重新刷新页面）

目前只可以在帖子内，也就是可以自动原图的地方，才会出现设置选单，于上方插件开启
当前只有调整图片大小功能，我一个没设计美感的人，真的很懒得去完成后续菜单w

KeyScroll:
（模式的差异就是实现方式，根据用户喜好自己选择）
↑ ↓ 键盘触发，按下滚动时，再次按下会停止，按反方向只会触发，反向的滚动

[1] 动画帧滚动
[2] 间隔滚动

CardText:
[1] 帖子预览页面，预览卡文字隐藏，鼠标移动过去后恢复
[2] 帖子预览页面，预览卡文字淡化，鼠标移动过去后恢复

CardZoom:
[1] 预览卡放大 [ v0.0.46 以前的都是他 ]
[2] 预览卡放大 + 悬浮缩放

VideoBeautify:
[1] 将 Download 区域的下载链接，复制到视频的上方作为标题，可直接点上方标题下载，或滚动到 Download 区域下载
[2] 将 Download 区域的下载链接，移动到视频的上方作为标题，可直接点上方标题下载，Download 区域有重复的会被移除掉

OriginalImage:
[1] 快速的自动原图，网络和电脑负担较高，但速度较快
[2] 超慢的自动原图，会等到一张图加载完成，才会加载下一张，对网络和电脑负担低，但速度超慢
[3] 滚动观看时触发加载原图，没观看就不会自动加载原图，对网络和电脑负担取决于你滚轮多快，加载速度中等

原图实验渲染方式（有时候服务器问题会导致卡住，也可以手动点击触发）:
要恢复将 experiment 改成 false

原先是直接替换预览图片，接着等待原图加载
实验方式改成，先获取原图数据，再进行替换，加载时预览图会有绿框指示器，并且会显示加载进度
```

---

## **🔗 相关链接**

- **开发环境**：[Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)
- **GitHub 仓库**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerEnhance)

---

## **📦 版本信息**

**发布版本：0.0.49-Beta8**

### **更新内容**

1. 修复 阻挡广告

---