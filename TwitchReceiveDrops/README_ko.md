# **Twitch의 드롭 자동 수령**

---

## **👻 사용 방법**

1. 브라우저 스크립트 관리 도구([Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 등) 설치
2. [스크립트 설치](https://update.greasyfork.org/scripts/474799/Twitch%20%E8%87%AA%E5%8B%95%E9%A0%98%E5%8F%96%E6%8E%89%E5%AF%B6%20%20Auto%20Receive%20Drops.user.js)
3. [inventory](https://www.twitch.tv/drops/inventory) 페이지 방문

---

## **⚠️ 사용 시 주의사항**
- Twitch가 페이지 요소를 수정하면 기능이 작동하지 않을 수 있으며, 이 경우 재설정이 필요합니다(문제가 있으면 피드백 부탁드립니다)
- ❗️ 개인 사용에 문제가 있는 경우, 먼저 설정 매개변수를 직접 구성해 보세요. 이것은 매우 간단한 스크립트로, 다양한 환경에 적응하는 기능이 없습니다
- 사용 시 스크립트 관리 도구가 이 스크립트를 로드했는지 확인하고, 방송 페이지와 Inventory 페이지를 동시에 열어 백그라운드에 두고 자동 수령을 기다리세요


## **📜 기능 개요**

### **자동 방송 재시작**
- 설정에서 RestartLive가 True일 때 활성화
- inventory 페이지에 "드롭 진행 상황이 있을 때" 매번 새로고침할 때마다 기록하며, 진행 상황이 계속 변화가 없고 변화 없는 시간이 JudgmentInterval 설정 시간 이상이면 방송이 중단된 것으로 판단하여 방송을 재시작합니다
- 언어 필터링을 설정하면 찾지 못할 수 있으므로 가급적 설정하지 마세요. 채널의 Tags가 FindTag 설정 텍스트와 일치하는지 확인하고 첫 번째 일치하는 방송을 엽니다
- 두 번째 방송 재시작인 경우, 이전 창을 자동으로 닫고 항상 하나의 방송 창만 유지합니다(직접 연 창은 무효)

### **완료 시 자동 닫기**
- 설정에서 EndAutoClose가 True일 때 활성화
- 기록된 드롭 진행 상황이 있는 경우, 완료 후 창이 자동으로 닫힙니다
- 기록된 드롭 진행 상황이 없으면 트리거되지 않습니다

### **만료된 진행 상황 지우기**
- 설정에서 ClearExpiration이 True일 때 활성화
- 이것은 이벤트 시간이 이미 만료된 드롭 객체를 지우기 위한 것이지만, 이 기능은 타임스탬프를 판단해야 하며 다양한 언어의 타임스탬프 형식이 다르기 때문에
현재는 특정 언어만 지원하며, 지원되지 않는 언어에서는 효과가 없습니다
- **🌐 지원 언어**: 웹사이트 설정에 따라 다음 언어에 자동 적응:
  - en-US, en-GB, es-ES, fr-FR, pt-PT, pt-BR, ru-RU, de-DE, it-IT, tr-TR, es-MX, ja-JP, ko-KR, zh-TW, zh-CN


## **⚙️ 추가 설정(코드 상단)**

|    **매개변수**     |                             **설명**                              |                **기본값**                 |
| :-----------------: | :---------------------------------------------------------------: | :---------------------------------------: |
|    `RestartLive`    |                         방송 자동 재시작                          |                  `true`                   |
|   `EndAutoClose`    |                     활동 완료 후 창 자동 닫기                     |                  `true`                   |
|   `TryStayActive`   |                   창을 항상 활성 상태로 "시도"                    |                  `true`                   |
|  `RestartLiveMute`  | 방송 재시작 후 음소거(항상 효과적이지 않거나 작동이 느릴 수 있음) |                  `true`                   |
| `RestartLowQuality` |                   방송 재시작 시 자동 최저 화질                   |                  `false`                  |
|   `UpdateDisplay`   |              웹 탭에 드롭 확인 간격 카운트다운 표시               |                  `true`                   |
|  `ClearExpiration`  |                만료된 활동의 드롭 진행 상황 지우기                |                  `true`                   |
|  `ProgressDisplay`  |                    웹 탭에 드롭 진행 상황 표시                    |                  `true`                   |
|  `UpdateInterval`   |                      드롭 확인 간격 시간(초)                      |                   `120`                   |
| `JudgmentInterval`  |                  방송 재시작 판단 간격 시간(분)                   |                    `6`                    |
|      `FindTag`      |                    방송 재시작 시 검색할 태그                     | `drops、啟用掉寶、启用掉宝、드롭활성화됨` |

---

## **🔗 관련 링크**

- **개발 환경**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub 저장소**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/TwitchReceiveDrops)

---

## **📦 버전 정보**

**릴리스 버전: 0.0.16-Beta** 

### **업데이트 내용**
1. 조기 종료 판단 제거
2. 자동 드롭 수령 로직 수정(현재 시간 만료된 항목은 자동 수령 불가)

### **알려진 문제**
1. 현재 플러그인의 `GM_notification`에 일부 문제가 있어, 이 API에 의존하는 기능 구현이 정상적으로 작동하지 않을 수 있습니다

---