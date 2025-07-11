# **[ Eh/Ex ] 簡易画像ダウンローダー**

---

## **👻 使用方法**

1. ブラウザのスクリプト管理ツールをインストール（[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)）
2. [スクリプトをインストール](https://update.greasyfork.org/scripts/472882/%5BEEx-Hentai%5D%20Downloader.user.js)
3. [e-hentai](https://e-hentai.org/) または [exhentai](https://exhentai.org/) にアクセス

---

## **⚠️ 使用上の注意**
- ネットワーク速度やサーバー応答が遅いと「ページ数が欠けている| ダウンロードが遅い | 完全にフリーズ」といった問題が発生しやすい
- データリクエストと処理には速度制限があり、短時間で大量にリクエストするとIPが一時的にBanされることがあるので、IPを変更すれば解決する
- 長時間動かない場合、リロードを試みてください。IPがBanされているか、サーバーに問題のあるページがある可能性があります

## **📜 機能概要**

### **ダウンロードボタン**
- 漫画ページの右上にダウンロードボタンを作成、クリックで直接ダウンロード

### **ダウンロードモードの切替**
- 圧縮ダウンロード
- 単画像ダウンロード（新しいバージョンで問題あり）

### **ダウンロード範囲の設定**
- 指定した範囲をダウンロード（完了後、設定はデフォルトに戻る）

### **強制圧縮**
- リンクに問題がある場合、データを取得できずにフリーズすることがあるため、強制的に圧縮して既にダウンロードされた内容を取得する

## **⚙️ 追加設定（コード上部）**

| **パラメータ**  | **説明**                                                                                         | **デフォルト値** |
| :-------------- | :----------------------------------------------------------------------------------------------- | :--------------- |
| `Dev`           | 開発モードを有効にし、コンソールにデバッグ情報を表示                                             | `false`          |
| `ReTry`         | ダウンロード失敗時のリトライ回数。回数を超えるとそのファイルをスキップ                           | `10`             |
| `Original`      | 原画像を優先してダウンロード（データ制限あり、制限の問題は未処理）                               | `false`          |
| `ResetScope`    | ダウンロード範囲設定後、デフォルトにリセットするかどうか（リセットしない場合、前回の設定を保持） | `true`           |
| `CompleteClose` | ダウンロード完了後に自動でページを閉じる                                                         | `false`          |

---

## 📣 問題フィードバック

> まず、これらのスクリプトは私個人が使用するために作成したもので、その後純粋に必要とする人々に共有するためのものです。
>
> 無料でスクリプトを提供する開発者として、私は料金を一切請求していないため、すべての状況にサポートを提供する義務もありません。したがって、フィードバックの際には基本的な敬意と友好的な態度を維持するようお願いします。

#### ❓ 問題を提出する前に、以下の点に注意してください：

**バグなのか設定の問題なのかわからない場合？** スクリプトに誤りがあると断定するのではなく、「質問」の形で状況を説明してください。

#### 🔍 説明の参考：

- **🖥️ 実行環境**：ブラウザ、スクリプトマネージャ（Tampermonkeyなど）、システムプラットフォーム
- **🧭 操作プロセス**：詳細な手順説明、簡単な記述だけではなく
- **🎯 期待される結果**：どのような効果を期待していたか、実際に何が起こったか
- **🤖 提案（任意）**：可能であれば、AIに問題を理解させてみて、その結果を添付してください

#### ⚠️ 重要な注意：

**これは無料のスクリプトであり、商業製品ではありません**

もしあなたのフィードバックが詳細に欠け、感情的で、建設的でない、または単なる一言だけの場合、私はあなたの意図を推測するための時間を割くことができませんし、そのようなフィードバックは開発の熱意と時間を消費するだけです。

#### 💡 ご理解ください：

**スクリプトの開発、テスト、メンテナンスには多大な労力が必要です**。軽率な否定的評価は開発者を挫折させ、メンテナンスを停止させる可能性があります。これらの無料リソースを大切にし、具体的かつ理性的な方法で問題を報告してください。

**問題を明確にする協力をしたくなく、ただ不満を吐き出して去りたいだけの場合**、このスクリプトを使用しないことをお勧めします。お互いの時間を無駄にしないでください。

**今後、不明瞭で建設的でないコメントが表示された場合、私は無視することを選択し、最終的にはスクリプトのメンテナンスを放棄する可能性があります。ご理解とご協力に感謝します。**

---

## **🔗 関連リンク**

- **開発環境**：[Greasy Fork](https://greasyfork.org/ja/users/989635-canaan-hs)  
- **GitHub リポジトリ**：[GitHub](https://github.com/Canaan-HS/MonkeyScript/tree/main/ExDownloader)

---

## **📦 バージョン情報**

**リリースバージョン：0.0.17-Beta1**

### **更新内容**
1. ライブラリ更新
2. 一部の既知のバグを修正

### **既知の問題**
❗️ 現在、ウェブサイトの問題なのか何なのかわかりませんが、以前は動作していたロジックに多くの問題が発生しており、少しイライラし始めています

現在あるバグの修正時間がありません（時々遭遇します）[古いバージョンへのダウングレードをお勧めします]：
1. プラグインの最新バージョンでは、`GM_xmlhttpRequest`を使用して画像をダウンロードする際に奇妙な問題があり、時々長時間停止したり、完全にフリーズしたりすることがあります

---