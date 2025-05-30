# **[Eh/Ex] Простой загрузчик изображений**

---

## **👻 Как использовать**

1. Установите менеджер пользовательских скриптов (например, [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo))
2. [Установите скрипт](https://update.greasyfork.org/scripts/472882/%5BEEx-Hentai%5D%20Downloader.user.js)
3. Перейдите на [e-hentai](https://e-hentai.org/) или [exhentai](https://exhentai.org/)

---

## **⚠️ Важные замечания**
- При медленном интернет-соединении или медленном отклике сервера могут возникать проблемы: «отсутствующие страницы | медленная загрузка | полное зависание»
- Запросы данных и их обработка имеют ограничения по скорости. При слишком большом количестве запросов за короткое время ваш IP может быть временно заблокирован. В этом случае просто смените IP
- Если процесс долго не двигается, попробуйте обновить страницу, так как возможно ваш IP заблокирован или у сервера есть проблемы с определенными страницами

## **📜 Обзор функций**

### **Кнопка загрузки**
- В правом верхнем углу главной страницы манги создается кнопка загрузки, нажатие на которую начинает загрузку

### **Переключение режима загрузки**
- Сжатая загрузка
- Загрузка отдельных изображений (в новой версии плагина есть проблемы)

### **Настройка диапазона загрузки**
- Указание диапазона загрузки (после завершения возвращается к настройкам по умолчанию)

### **Принудительное сжатие**
- Некоторые ссылки могут быть проблемными, что приводит к невозможности получения данных и зависанию. Принудительное сжатие позволяет напрямую получить уже загруженные данные

## **⚙️ Дополнительные настройки (в верхней части кода)**

| **Параметр**     | **Описание**                                                | **По умолчанию** |
| :--------------- | :---------------------------------------------------------- | :--------------- |
| `Dev`            | Включение режима разработчика для вывода отладочной информации в консоль | `false`          |
| `ReTry`          | Количество повторных попыток при сбое загрузки, после превышения файл пропускается | `10`             |
| `Original`       | Приоритет загрузки оригинальных изображений (имеет ограничения по трафику, проблема ограничений не обрабатывается специально) | `false`          |
| `ResetScope`     | Сброс настроек диапазона после завершения загрузки (если отключено, сохраняются последние настройки) | `true`           |
| `CompleteClose`  | Автоматическое закрытие страницы после завершения загрузки  | `false`          |

---

## 📣 문제 피드백

> 우선 이 스크립트들은 제 개인 사용을 위해 작성되었으며, 이후 순수하게 필요한 분들에게 공유 제공한 것입니다.
>
> 무료로 스크립트를 제공하는 개발자로서, 저는 어떠한 비용도 받지 않았으며 모든 상황에 대한 지원을 제공할 의무가 없습니다. 따라서 피드백 시 기본적인 존중과 친절한 태도를 유지해 주시기 바랍니다.

#### ❓ 문제 제출 전 다음 사항을 참고해 주세요:

**버그인지 설정 문제인지 확실하지 않나요?** 스크립트에 오류가 있다고 단정짓기보다는 "질문" 방식으로 상황을 설명해 주세요.

#### 🔍 설명 참고사항:

- **🖥️ 실행 환경**: 브라우저, 스크립트 매니저(Tampermonkey 등), 시스템 플랫폼
- **🧭 작업 과정**: 자세한 단계별 설명, 간단한 서술만 제공하지 마세요
- **🎯 기대 결과**: 어떤 효과를 원했는지, 실제로 무슨 일이 발생했는지
- **🤖 제안(선택 사항)**: 가능하다면, AI에게 문제 이해를 도움받고 그 결과를 첨부해 주세요

#### ⚠️ 중요 경고:

**이것은 무료 스크립트이며, 상업 제품이 아닙니다**

만약 피드백이 세부 사항이 부족하거나, 감정적이거나, 건설적이지 않거나, 단순한 한 문장이라면, 저는 귀하의 의도를 추측하는 데 시간을 할애할 수 없으며, 이러한 피드백은 개발 열정과 시간만 소모시킵니다.

#### 💡 이해해 주세요:

**스크립트 개발, 테스트 및 유지 관리에는 많은 노력이 필요합니다**. 경솔한 부정적 평가는 개발자를 좌절시키고 유지 관리를 중단하게 만들 수 있습니다. 이러한 무료 리소스를 소중히 여기고, 구체적이고 합리적인 방식으로 문제를 보고해 주세요.

**문제 명확화에 협조하지 않고 단지 불만을 토로한 후 떠나길 원한다면**, 이 스크립트를 사용하지 않는 것을 권장합니다. 서로의 시간을 낭비하지 마세요.

**향후 불분명하고 건설적이지 않은 댓글이 나타나면, 저는 무시하기로 선택할 것이며, 최종적으로 스크립트 유지 관리를 포기할 수 있습니다. 이해와 협조에 감사드립니다.**

---

## **🔗 Полезные ссылки**

- **Среда разработки**: [Greasy Fork](https://greasyfork.org/zh-TW/users/989635-canaan-hs)  
- **GitHub репозиторий**: [GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 Информация о версии**

**Версия выпуска: 0.0.17-Beta**

### **Содержание обновления**
1. Обновление библиотеки
2. Изменена логика сжатия
3. Оптимизирована динамическая настройка
4. Корректировка архитектуры

### **Известные проблемы**
❗️ В настоящее время непонятно, связано ли это с проблемами сайта или с чем-то еще, но логика, которая раньше работала, теперь имеет множество проблем, что начинает немного раздражать

Текущие ошибки, на исправление которых сейчас нет времени (иногда встречаются) [Рекомендуется вернуться к старой версии]:
1. В более новых версиях плагина при загрузке изображений с использованием `GM_xmlhttpRequest` возникают странные проблемы, иногда процесс зависает надолго или полностью прекращается

---