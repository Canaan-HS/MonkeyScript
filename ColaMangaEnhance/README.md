# **Enhancing ColaManga Reading Experience**

---

## **👻 Usage**

1. Install a browser script manager (e.g., [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)).
2. [Install the script](https://update.greasyfork.org/scripts/488622/ColaManga%20%E7%80%8F%E8%A6%BD%E5%A2%9E%E5%BC%B7.user.js).
3. Visit the [ColaManga](https://www.colamanga.com/) website.

---

## **🚧 Development Notes**

Currently, there is no settings menu available. Customizations need to be done by modifying the code directly. Basic functionality has been implemented and uploaded. Plans to create a settings interface when time permits.

## **⚠️ Important Notes**
- If other scripts modify the page elements, it may affect the proper functioning of some features.
- When ad-blocking plugins are enabled, it might cause layout issues or functional abnormalities. It is recommended to temporarily disable them if any issues occur.

## **📜 Feature Overview**

### **Simple Ad Removal**
- Automatically removes advertisement iframes on the page to enhance the visual comfort during reading.

### **Custom Background Color and Auto-Reload**
- Background color adjustments currently require modifying the code (future plans to add a settings menu).
- Automatically detects and clicks the "Reload" button to reduce manual operation.

### **Hotkey Controls (Desktop Only)**
- `←`: Previous page | `→`: Next page  
- `↑`: Start auto-scrolling upwards | `↓`: Start auto-scrolling downwards  
  - Press once to start, press again to stop in the same direction; press the opposite direction to switch scrolling direction.

### **Gesture Controls (Mobile Only)**
- **Swipe Right**: Previous page | **Swipe Left**: Next page  
  - You need to swipe about half the screen, keeping the swipe horizontal to avoid accidental touches.

### **Bottom Auto-Page Turning**
- **Regular Infinite Mode**: Implements infinite scrolling (occasionally has bugs, refreshing the page resolves it).
- **Optimized Infinite Mode**: Automatically clears read chapters to free up memory (occasionally has bugs, refreshing resolves it).
- **Other Modes**: Automatically jumps to the bottom when reached, offering "Fast | Normal | Slow" as options for trigger positions.

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
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ColaMangaEnhance)

---

## **📦 Version Information**

**Release Version: 0.0.11**

### **Updates**
1. API Update

### **Known Issues**
1. Ad-blocking is limited to page display and cannot prevent pop-ups triggered by accidental clicks.
2. The auto-reload function occasionally fails, cause unknown, with unstable performance.

---