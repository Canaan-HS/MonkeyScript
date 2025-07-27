# **Enhanced Website User Experience**

## ⚠️ The website has been changing frequently recently, and some functions may become invalid or have bugs at any time. Please provide feedback if you encounter any issues

---

## **👻 How to Use**

1. Install a browser script manager (such as [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [Install the script](https://update.greasyfork.org/scripts/472096/Kemer%20%E5%A2%9E%E5%BC%B7.user.js)
3. Visit the following sites:
    - [kemono](https://kemono.su/)
    - [coomer](https://coomer.su/)
    - [nekohouse](https://nekohouse.su/)

---

## **📜 Feature Overview**

### **Settings Menu (Only for Posts)**
- Set the original image, width, height, and spacing, with real-time previews of changes.
- Menu language support (default is English):
  - Traditional Chinese
  - Simplified Chinese
  - Japanese
  - English
  - Korean
  - Russian

## **⚙️ Additional Configuration (Located at the top of the code)**

|   **Parameter**   |                                  **Description**                                   | **Default Value** |
| :---------------: | :--------------------------------------------------------------------------------: | :---------------: |
|    `BlockAds`     |                                 Simple ad blocker                                  |      `true`       |
|    `BackToTop`    |            After page navigation, automatically scroll back to the top             |      `true`       |
|   `CacheFetch`    |   Cache Fetch data under the same page to speed up subsequent identical loading    |      `true`       |
|    `KeyScroll`    |                 Keyboard hotkey feature ↑↓ for automatic scrolling                 |      `true`       |
|  `DeleteNotice`   |                                   Remove notices                                   |      `true`       |
| `SidebarCollapse` |                 Sidebar collapses, restores when the mouse is near                 |      `true`       |
|    `FixArtist`    |      Modify the website's display name to Pixiv name, custom names can be set      |      `true`       |
|   `TextToLink`    |                      Convert text links into clickable links                       |      `true`       |
|    `CardZoom`     |                            Adjust the preview card size                            |      `true`       |
|    `CardText`     |                        Adjust the preview card text effects                        |      `true`       |
| `QuickPostToggle` |             Quickly toggle post preview (currently only for nekohouse)             |      `true`       |
|   `NewTabOpens`   |                        Open all page redirects in a new tab                        |      `true`       |
|   `ExtraButton`   | Additional button at the bottom for quick return to the top and direct page change |      `true`       |
|  `LinkBeautify`   |   Beautify download links and make (browse ») hoverable to show content directly   |      `true`       |
|  `CommentFormat`  |                               Adjust comment layout                                |      `true`       |
|  `VideoBeautify`  |      Beautify video styles and move the video download link to the title area      |      `true`       |
|  `OriginalImage`  |                       Automatically show the original image                        |      `true`       |

## **📜 Other Notes**

```
Settings menu (if no immediate response, try refreshing the page)

Currently, the settings menu will only appear inside posts, specifically in places where original images can be shown, when the plugin is enabled. At the moment, only the image size adjustment feature is available. As someone who isn't great at design, I’m honestly too lazy to complete the rest of the menu features w

KeyScroll: (The mode difference is the implementation method, users can choose based on preference)
↑ ↓ Trigger with keyboard, pressing to scroll will stop once pressed again, and pressing the opposite direction will trigger reverse scrolling.

[1] Animation frame scrolling
[2] Interval scrolling

CardText:
[1] On post preview pages, hide text on preview cards, which will be restored when the mouse moves over it
[2] On post preview pages, fade the text on preview cards, which will restore when the mouse moves over it

CardZoom:
[1] Enlarge preview card [previous versions before v0.0.46 used this method]
[2] Enlarge preview card + hover zoom

VideoBeautify:
[1] Move the download links from the download area to above the video as a title, allowing direct download by clicking the title or scrolling to the download area.
[2] Move the download links from the download area to above the video as a title, removing duplicate links in the download area.

OriginalImage:
[1] Fast auto-original image loading, with higher network and computer load, but faster speed.
[2] Very slow auto-original image, where each image waits until the previous one is fully loaded before proceeding, with lower network and computer load, but extremely slow.
[3] Trigger original image loading while scrolling, only loading original images when viewed, with load speed depending on scrolling speed, average load speed.

Original Image Experimental Rendering (sometimes server issues can cause delays, you can manually trigger it): To restore, change experiment to false.

Originally, the preview image would be replaced directly, and the original image would load afterward. In the experimental mode, it first retrieves the original image data before replacing it, showing a green border indicator on the preview image during loading and displaying the loading progress.
```

---

## 📣 Problem Feedback

> First of all, these scripts were originally written for my personal use and later simply shared with those who need them.
>
> As a developer providing scripts for free, I do not charge any fees and have no obligation to provide support for all situations, so I kindly ask you to maintain basic respect and friendliness when providing feedback.

#### ❓ Before submitting an issue, please note the following points:

**Not sure if it's a bug or a configuration issue?** Please use an "inquiry" approach to describe your situation, rather than directly determining that the script has an error.

#### 🔍 Description reference:

- **🖥️ Execution environment**: Browser, script manager (Tampermonkey, etc.), system platform
- **🧭 Operation process**: Detailed step-by-step explanation, not just a brief description
- **🎯 Expected result**: What effect you hoped to achieve and what actually happened
- **🤖 Suggestions (optional)**: If convenient, please try having an AI help understand your issue and attach the results

#### ⚠️ Important reminder:

**This is a free script, not a commercial product**

If your feedback lacks details, is emotional, non-constructive, or is just a simple sentence, I will not be able to or spend time guessing your meaning. Such feedback only consumes development enthusiasm and time.

#### 💡 Please understand:

**Developing, testing, and maintaining scripts requires a lot of effort**. Careless negative reviews can frustrate developers and even lead them to stop maintenance. Please cherish these free resources and report issues in a specific and rational manner.

**If you are unwilling to help clarify the issue and just want to vent and leave**, I suggest you choose not to use this script. Don't waste each other's time.

**If unclear and non-constructive comments appear in the future, I will choose to ignore them and may ultimately abandon script maintenance. Thank you for your understanding and cooperation.**

---

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerEnhance)

---

## **📦 Version Information**

**Release Version：0.0.50-Beta1**

### **What's New**
1. Temporary domain update (some incomplete test features)

### **Known Issues**
1. Sometimes the page loads slower than the script executes, which may cause features to fail. Refreshing the page usually resolves the issue.

---