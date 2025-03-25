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

## **🔗 Related Links**

- **Development Environment**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ColaMangaEnhance)

---

## **📦 Version Information**

**Release Version: 0.0.11-Beta4**

### **Updates**
1. Adjusted function injection timing to improve stability.
2. Fixed compatibility issues with mobile features.
3. Added synchronized update of quick jump links when using infinite page turning.
4. Adjusted sensitivity of mobile swipe jump and added debounce mechanism.

### **Known Issues**
1. Ad-blocking is limited to page display and cannot prevent pop-ups triggered by accidental clicks.
2. The auto-reload function occasionally fails, cause unknown, with unstable performance.

---