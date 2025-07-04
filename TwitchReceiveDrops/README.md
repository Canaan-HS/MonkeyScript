# **Auto Receive Twitch Drops**

---

## **👻 How to Use**

1. Install a browser script manager (such as [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [Install the script](https://update.greasyfork.org/scripts/474799/Twitch%20%E8%87%AA%E5%8B%95%E9%A0%98%E5%8F%96%E6%8E%89%E5%AF%B6%20%20Auto%20Receive%20Drops.user.js)
3. Visit the [inventory](https://www.twitch.tv/drops/inventory) page

---

## **⚠️ Usage Notes**
- When Twitch modifies page elements, it may cause the functionality to fail. In such cases, you may need to reconfigure (please provide feedback if there are issues).
- ❗️ If you encounter personal issues, try adjusting the configuration parameters. This is a very simple script, without adaptive features for different environments.
- Ensure that the script manager has loaded this script, and that both the live page and the Inventory page are open. The script will run in the background and automatically claim the drops.

## **📜 Feature Overview**

### **Auto Restart Live Stream**
- Enabled when the `RestartLive` configuration is set to True.
- When the inventory page shows "progress of drops," the script will record the progress each time the page is refreshed. If the progress doesn't change, and the time without change exceeds the `JudgmentInterval` configuration time, it will be determined that the live stream has been interrupted and will restart the stream.
- Avoid setting language filters as they may cause the stream not to be found. The script will look for a stream that matches the `FindTag` setting and will open the first matching stream.
- If the live stream is restarted for the second time, the script will automatically close the previous window, ensuring only one live stream window is open (manually opened windows will not be affected).

### **Auto Close When Finished**
- Enabled when the `EndAutoClose` configuration is set to True.
- If there is recorded progress for drops, once it is completed, the script will automatically close the window.
- If no progress is recorded, the script will not trigger the close action.

### **Clear Expired Progress**
- Enabled when the `ClearExpiration` configuration is set to True.
- This clears expired drops from events that have ended, based on timestamps. Since timestamps vary by language, the feature only supports a few specific languages.
- **🌐 Supported Languages**: The script automatically adapts to the following languages:
  - en-US, en-GB, es-ES, fr-FR, pt-PT, pt-BR, ru-RU, de-DE, it-IT, tr-TR, es-MX, ja-JP, ko-KR, zh-TW, zh-CN

## **⚙️ Additional Configuration (Above the Code)**

| **Parameter**       | **Description**                                                              | **Default Value**                         |
| :------------------ | :--------------------------------------------------------------------------- | :---------------------------------------- |
| `RestartLive`       | Automatically restart live stream                                            | `true`                                    |
| `EndAutoClose`      | Automatically close the window when event is completed                       | `true`                                    |
| `TryStayActive`     | "Try" to keep the window active                                              | `true`                                    |
| `RestartLiveMute`   | Mute after restarting the live stream (may not always work or may be slower) | `true`                                    |
| `RestartLowQuality` | Automatically set the lowest quality on restart                              | `false`                                   |
| `UpdateDisplay`     | Show the countdown for drop checking on the webpage tab                      | `true`                                    |
| `ClearExpiration`   | Clear expired drop progress                                                  | `true`                                    |
| `ProgressDisplay`   | Show drop progress on the webpage tab                                        | `true`                                    |
| `UpdateInterval`    | The interval time (in seconds) for checking drops                            | `120`                                     |
| `JudgmentInterval`  | The interval time (in minutes) for determining stream restart                | `6`                                       |
| `FindTag`           | Tags to find when restarting the stream                                      | `drops、啟用掉寶、启用掉宝、드롭활성화됨` |

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
- **GitHub Repository**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/TwitchReceiveDrops)

---

## **📦 Version Information**

**Release Version: 0.0.17-Beta1**

### **Updates**
1. Website changes adaptation fix

---