# **Simple Text Converter (Experimental Project~~Just for Fun~~)**

---

## **👻 How to Use**

1. Install a browser script manager (such as [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [Install the script](https://update.greasyfork.org/scripts/504153/%E7%B0%A1%E6%98%93%E6%96%87%E6%9C%AC%E8%BD%89%E6%8F%9B%E5%99%A8.user.js)
3. Visit a supported website

---

## **🚧 Development Notes**

This project’s text conversion is highly efficient. Its conversion method is different from browser translation, as it does not alter the webpage structure and does not affect the normal operation of the website.

Although the dynamic conversion is not written in the best way, it is generally seamless. Currently, the dictionary just needs to be refined.

## **📜 Feature Overview**

- In theory, this script can be used on any webpage, but it has only been tested on a few websites (mainly translating tag labels).
- The script works by using set key-value pairs to automatically convert key strings into value strings. You can set any string for this purpose.
- When loading the default dictionary, the script acts like a translator, converting words with corresponding entries in the dictionary.
- The default dictionary will automatically update every 24 hours. If no dictionary is imported or the dictionary is cleared, it will not trigger the automatic update. You will need to manually click to update the dictionary for it to restore.
- Currently, I am the only one organizing the dictionary, mainly focusing on [https://nhentai.net/](https://nhentai.net/), and other websites have a more fragmented collection.

---

## **⚙️ Customization Notes**

> You can customize settings in the Config section at the top of the code (detailed explanations are in the code comments).

1. If you do not need the reverse functionality, it is recommended to set `FocusOnRecovery` to `false` to avoid strange or overlapping conversion issues.

2. Custom Dictionary (set in the Customize section at the top of the code)

```javascript

// Example

key = "apple"
value = "蘋果"

const Customize = {
        "apple": "蘋果"
};
```

---

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/PMouseHide)

---

## **📦 Version Information**

**Release Version: 0.0.1-Beta2**

### **Update Contents**
1. Added more development features

---