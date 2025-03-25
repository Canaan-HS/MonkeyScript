# **One-Click Image Downloader and Data Processing Tool**

## ⚠️ The website has recently undergone a major update, and some features may be broken or cause the site to not function properly. Please disable the script until it is fixed.

---

## **👻 How to Use**

1. Install a browser script manager (such as [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [Install the script](https://update.greasyfork.org/scripts/472282/Kemer%20%E4%B8%8B%E8%BC%89%E5%99%A8.user.js)
3. Visit the following sites:
    - [kemono](https://kemono.su/)
    - [coomer](https://coomer.su/)
    - [nekohouse](https://nekohouse.su/)

---

## **⚠️ Usage Notes**
- It is recommended to wait until the page fully loads the original images before clicking the download button.
- If the page does not have a "Files" tab, no download button will be created.
- Sometimes, if the page loads too quickly, the MutationObserver may not have time to create the button, which could result in the button not being created.

## **📜 Feature Overview**

### **Download Button**
- A button is created next to the "Files" tab on the page. It may not be very noticeable, and that's intentional—it was designed that way.

### **Switch Download Mode**
- Compressed download
- Single image download (the new version of the plugin may have issues)

### **One-Click Post Open (Only for Post Preview Pages)**
- Enter a range to automatically open all posts on the current page.

### **Data Collection (Only for Post Preview Pages)**
- Collect data from the current page to the last page, retrieving relevant post data (currently, this works properly only on nekohouse in the release version; in the development version, it works on the other two sites).

## **⚙️ Additional Configuration (Located at the top of the code)**

|    **Parameter**     |                              **Description**                              | **Default Value** |
| :------------------: | :-----------------------------------------------------------------------: | :---------------: |
|        `Dev`         |         Enable developer mode to print debug info in the console          |      `false`      |
|   `ContainsVideo`    | Download includes videos, which will significantly increase download time |      `false`      |
|   `CompleteClose`    |        Automatically close the page after the download is complete        |      `false`      |
|  `ConcurrentDelay`   |             Delay in seconds before sending download requests             |        `3`        |
| `ConcurrentQuantity` |           Number of download requests initiated simultaneously            |        `5`        |
|   `BatchOpenDelay`   |    Delay in milliseconds when opening each post in one-click post open    |       `500`       |

---

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerDownloader)

---

## **📦 Version Information**

**Release Version: 0.0.21-Beta5**

### **Update Contents**
1. Fixed the issue with downloading data
2. Modified default configuration (file name)
3. Added download thread count and delay (replacing the experimental delay)

### **Known Issues**
1. In newer versions of Tampermonkey, the GM_download API is behaving abnormally, causing issues with single image download. It is recommended to use the compressed download option only.

---