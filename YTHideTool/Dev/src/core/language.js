import { Lib } from "../services/client.js";

const dict = {
    Traditional: {
        "快捷提示": `@ 功能失效時 [請重新整理] =>
                    \r(Alt + 1)：隱藏推薦播放
                    \r(Alt + 2)：隱藏留言區
                    \r(Alt + 3)：隱藏功能列表
                    \r(Alt + T)：隱藏標題文字
                    \r(Ctrl + Z)：使用極簡化`
    },
    Simplified: {
        "📜 預設熱鍵": "📜 预设热键",
        "快捷提示": `@ 功能失效时 [请重新整理] =>
                    \r(Alt + 1)：隐藏推荐播放
                    \r(Alt + 2)：隐藏评论区
                    \r(Alt + 3)：隐藏功能列表
                    \r(Alt + T)：隐藏标题文字
                    \r(Ctrl + Z)：使用极简化`,
        "查找框架失敗": "查找框架失败",
        "頁面類型": "页面类型",
        "隱藏元素": "隐藏元素",
        "極簡化": "极简化",
        "隱藏標題": "隐藏标题",
        "隱藏推薦觀看": "隐藏推荐观看",
        "隱藏留言區": "隐藏留言区",
        "隱藏功能選項": "隐藏功能选项",
        "隱藏播放清單資訊": "隐藏播放清单信息",
    },
    Japan: {
        "📜 預設熱鍵": "📜 デフォルトホットキー",
        "快捷提示": `@ 机能が无効になった场合 [ページを更新してください] =>
                    \r(Alt + 1)：おすすめ再生を非表示にする
                    \r(Alt + 2)：コメントエリアを非表示にする
                    \r(Alt + 3)：机能リストを非表示にする
                    \r(Alt + T)：タイトル文字を隠す
                    \r(Ctrl + Z)：シンプル化を使用する`,
        "查找框架失敗": "フレームの検索に失敗しました",
        "頁面類型": "ページタイプ",
        "隱藏元素": "要素を隠す",
        "極簡化": "ミニマリスト",
        "隱藏標題": "タイトルを隠す",
        "隱藏推薦觀看": "おすすめ視聴を隠す",
        "隱藏留言區": "コメントセクションを隠す",
        "隱藏功能選項": "機能オプションを隠す",
        "隱藏播放清單資訊": "再生リスト情報を隠す",
    },
    Korea: {
        "📜 預設熱鍵": "📜 기본 단축키",
        "快捷提示": `@ 기능이 작동하지 않을 때 [새로 고침하세요] =>
                    \r(Alt + 1)：추천 재생 숨기기
                    \r(Alt + 2)：댓글 영역 숨기기
                    \r(Alt + 3)：기능 목록 숨기기
                    \r(Alt + T)：제목 텍스트 숨기기
                    \r(Ctrl + Z)：간소화 사용`,
        "查找框架失敗": "프레임 검색 실패",
        "頁面類型": "페이지 유형",
        "隱藏元素": "요소 숨기기",
        "極簡化": "극단적 단순화",
        "隱藏標題": "제목 숨기기",
        "隱藏推薦觀看": "추천 시청 숨기기",
        "隱藏留言區": "댓글 섹션 숨기기",
        "隱藏功能選項": "기능 옵션 숨기기",
        "隱藏播放清單資訊": "재생 목록 정보 숨기기",
    },
    English: {
        "📜 預設熱鍵": "📜 Default Hotkeys",
        "快捷提示": `@ If functionalities fail [Please refresh] =>
                    \r(Alt + 1)：Hide recommended playback
                    \r(Alt + 2)：Hide comments section
                    \r(Alt + 3)：Hide feature list
                    \r(Alt + 4)：Hide playlist info
                    \r(Alt + T)：Hide Title Text
                    \r(Ctrl + Z)：Use Simplification`,
        "查找框架失敗": "Frame search failed",
        "頁面類型": "Page type",
        "隱藏元素": "Hide elements",
        "極簡化": "Minimalize",
        "隱藏標題": "Hide title",
        "隱藏推薦觀看": "Hide recommended views",
        "隱藏留言區": "Hide comments section",
        "隱藏功能選項": "Hide feature options",
        "隱藏播放清單資訊": "Hide playlist information",
    }
};

const { Transl } = (() => {
    const Matcher = Lib.translMatcher(dict);
    return {
        Transl: (Str) => Matcher[Str] ?? Str,
    }
})();

export default Transl;