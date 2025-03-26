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

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 Version Information**

**Release Version: 0.0.16**

### **Updates**
1. API updates
2. Added language support
3. Modified some translations

### **Known Issues**
❗️ Currently unsure whether the issue is from the website or elsewhere, the logic that previously worked has now encountered several problems, becoming quite frustrating.

The following bugs currently cannot be fixed due to time constraints (sometimes encountered). [Recommend rolling back to an older version]:
1. The newer plugin versions have strange issues when using `GM_xmlhttpRequest` to download images. Sometimes it freezes for a long time or even completely freezes.

---