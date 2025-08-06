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

|    **Parameter**     |                                            **Description**                                            | **Default Value** |
| :------------------: | :---------------------------------------------------------------------------------------------------: | :---------------: |
|        `Dev`         |                       Enable developer mode to print debug info in the console                        |      `false`      |
|   `IncludeExtras`    | Include attachments other than images during download. This may significantly increase download time. |      `false`      |
|   `CompleteClose`    |                      Automatically close the page after the download is complete                      |      `false`      |
|  `ConcurrentDelay`   |                           Delay in seconds before sending download requests                           |        `3`        |
| `ConcurrentQuantity` |                         Number of download requests initiated simultaneously                          |        `5`        |
|   `BatchOpenDelay`   |                  Delay in milliseconds when opening each post in one-click post open                  |       `500`       |

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
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerDownloader)

---

## **📦 Version Information**

**Release Version: 2025.08.06-Beta** 

### **What's New**
The website API changes frequently, and achieving general compatibility requires extensive testing. As a solo developer, I’m unable to dedicate full resources to script testing. If you encounter any support issues, please report the problem along with the URL of the affected page.

1. Download Feature Adjustments
   - Temporarily added "Files" and "Downloads" buttons, each downloading different datasets. When IncludeExtras is enabled, both buttons provide the same combined data (experimental).

2. Data Fetching Optimizations
   - Added basic data support for nekohouse (external links such as cloud storage are not included).
   - Improved data processing stability and encoding conversion (experimental).


### **Known Issues**
1. Newer versions of Tampermonkey have some issues with the GM_download API, causing the single image download function to error. It's recommended to only use compressed download.

---