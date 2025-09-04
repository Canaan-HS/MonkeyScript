# **Media One-Click Download & Data Retrieval Tool**

## ⚠️ The website has been changing frequently recently, some functions may fail at any time or cause BUGs. Please provide feedback if you encounter any issues.

---

## **👻 How to Use**

1. Install a browser userscript manager (such as [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))  
2. [Install Script](https://update.greasyfork.org/scripts/472282/Kemer%20%E4%B8%8B%E8%BC%89%E5%99%A8.user.js)  
3. Visit  
    - [kemono](https://kemono.su/)  
    - [coomer](https://coomer.su/)  
    - [nekohouse](https://nekohouse.su/)  

---

## **⚠️ Usage Notes**
- It is recommended to wait until all original images are fully displayed before clicking download  
- If the current page does not have a Files tab, a download button will not be created  
- Sometimes when the page loads too quickly, the MutationObserver may fail to create the button in time, which could result in the button not being created  

## **📜 Feature Overview**

### **Download Button**
- Created next to the Files tab. If you find it not obvious, you are right — it was designed that way  

### **Switch Download Mode**
- Compressed download  
- Single image download (the new plugin is a bit buggy)  

### **One-Click Post Open (preview page only)**
- Input the opening range, and automatically open all posts on the current page  

### **Data Retrieval (preview page only)**
- Starting from the current page until the last page, retrieve related post data (default Json)  
- Can be set to exclude specific types, or enable ToLinkTxt to convert into Txt file (only containing download links) [Supports IDM and Aria2 import format]  

## **⚙️ Extra Configuration (at the top of the code)**
|       **Parameter**       |                       **Description**                       | **Default** |
| :-----------------------: | :---------------------------------------------------------: | :---------: |
|          `Dev`            |         Development mode, print debugging info in console   |  `false`    |
|     `IncludeExtras`       | Download attachments other than images, will greatly increase time |  `false`    |
|     `CompleteClose`       |             Automatically close the page after download     |  `false`    |
|    `ConcurrentDelay`      |             Delay of download request sending (ms)          |   `500`     |
|   `ConcurrentQuantity`    |               Number of simultaneous download requests      |     `5`     |
|     `BatchOpenDelay`      |       One-click open, delay for each post opening (ms)      |   `500`     |

---

## 📣 Feedback

> First of all, these scripts were originally written for my personal use, later purely shared with those who need them.  
>
> As a developer who provides scripts for free, I do not charge any fees, nor am I obliged to provide support for all situations. Therefore, I kindly ask you to remain respectful and courteous when giving feedback.  

#### ❓ Before submitting an issue, please note the following:

**Not sure if it is a bug or a configuration issue?** Please describe your situation in the form of a "question", instead of directly concluding that the script is faulty.  

#### 🔍 Description reference:

- **🖥️ Execution environment**: Browser, userscript manager (such as Tampermonkey), system platform  
- **🧭 Operation process**: Provide detailed step-by-step instructions, not just a short description  
- **🎯 Expected result**: What you hoped would happen versus what actually happened  
- **🤖 Suggestion (optional)**: If convenient, please try letting AI help you understand the problem, and attach its rephrased result  

#### ⚠️ Important Reminder:

**This is a free script, not a commercial product**  

If your feedback lacks details, is emotional, unconstructive, or just a single sentence, I cannot and will not spend time guessing what you mean. Such feedback only consumes my development enthusiasm and time.  

#### 💡 Please understand:

**Developing, testing, and maintaining scripts requires great effort.** Rash negative evaluations may discourage developers and even lead to abandoning maintenance. Please cherish these free resources and report issues in a concrete and rational way.  

**If you are not willing to help clarify the problem and only want to vent before leaving,** it is recommended that you choose not to use this script, so as not to waste each other’s time.  

**In the future, if vague and unconstructive comments appear, I will choose to ignore them, and eventually may give up maintaining the script. Thank you for your understanding and cooperation.**  

---

## **🔗 Related Links**

- **Development Profile**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/KemerDownloader)  

---

## **📦 Version Information**

**Release Version: 2025.09.03-Beta**  

### **Update Content**
Currently, the website API changes frequently. To ensure general usage, a large amount of testing is required. As an individual developer, I cannot devote all my energy to script testing. If there are support issues, please report error details and the corresponding page URL.  

1. **Compatibility Fix**
   - Adjustments to comply with recent website changes  
   - Adaptation to KemerEnhance script changes  
2. **Download Function Optimization**
   - Optimized compression implementation, faster compression speed  
3. **Data Crawling Optimization**
   - Support parsing more types of external links, and Mega password field parsing  
   - The new API currently only supports AdvancedFetch; normal Fetch is disabled  

### **Known Issues**
1. The newer version of Tampermonkey’s GM_download API is somewhat abnormal, causing single image download to fail. It is recommended to only use compressed download.  

---