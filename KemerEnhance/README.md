# **Enhanced Website User Experience**

## ⚠️ The website has recently undergone a major update. Temporary fixes have been applied, but some features may be broken or there may be bugs. Please report any issues.

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

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerEnhance)

---

## **📦 Version Details**

**Release Version: 0.0.49-Beta10**

### **Updates**
1. Adapting to website changes

### **Known Issues**
1. Due to AJAX rendering on Kemono and Coomer, functionality may fail to load if rendering is incomplete when the script finishes running. This can be resolved by refreshing the page. A 0.5-second loading delay has been implemented, but issues may still occur. Adding more delay could negatively impact user experience
2. After modifying menu positions, changes may be visible during debugging but require a page refresh to take effect in actual use

---