# **[Eh/Ex] Simple Image Downloader**

---

## **👻 Usage**

1. Install a browser script manager (e.g., [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)).
2. [Install the script](https://update.greasyfork.org/scripts/472882/%5BEEx-Hentai%5D%20Downloader.user.js).
3. Visit [e-hentai](https://e-hentai.org/) or [exhentai](https://exhentai.org/).

---

## **⚠️ Important Notes**
- Slow network or server response may cause issues such as "missing pages | slow download | complete freeze."
- Data requests and processing have speed limits; making too many requests in a short time may result in a temporary IP ban. Simply change your IP to resolve this.
- If it freezes for a long time, try refreshing the page, as the IP may have been banned, or there may be issues with certain pages on the server.

## **📜 Feature Overview**

### **Download Button**
- A download button is created on the top-right of the comic's main page. Clicking it directly initiates the download.

### **Download Mode Toggle**
- Compressed download.
- Single image download (may have issues with the newer plugin version).

### **Download Range Settings**
- Specify the download range (resets to default after completion).

### **Force Compression**
- Some links may have issues and cannot fetch data, causing the process to freeze. Use force compression to directly retrieve images that are already downloaded.

## **⚙️ Additional Configuration (above the code)**

| **Parameter**   | **Description**                                                                                                | **Default Value** |
| :-------------- | :------------------------------------------------------------------------------------------------------------- | :---------------- |
| `Dev`           | Enable developer mode to print debug information to the console                                                | `false`           |
| `ReTry`         | Number of retries when a download fails. The file will be skipped after exceeding the retry count.             | `10`              |
| `Original`      | Prefer downloading the original image (with traffic limitations, which are not specifically handled)           | `false`           |
| `ResetScope`    | Whether to reset the download range settings after completion (if not reset, it will retain the last settings) | `true`            |
| `CompleteClose` | Automatically close the page after download completion                                                         | `false`           |

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
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 Version Information**

**Release Version: 0.0.17-Beta**

### **Update Content**
1. Library update
2. Modified compression logic
3. Optimized dynamic adjustment
4. Architecture adjustment

### **Known Issues**
❗️ Currently not sure if it's a website issue or something else, logic that previously worked now has numerous problems, starting to get a bit frustrated

Current bugs that I don't have time to fix (encountered occasionally) [Recommend downgrading to an older version]:
1. In newer versions of the plugin, there are some strange issues when downloading images using `GM_xmlhttpRequest`, sometimes it gets stuck for a long time or even freezes completely

---