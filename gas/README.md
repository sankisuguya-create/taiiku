# 体育 うごきの教材（GAS）

単元（跳び箱・マット・ボール運動・縄跳び）ごとに動きをまとめたアプリ。GAS は器だけを返し、一覧（`units.json`）と動きのページ（`motions/*/index.html`）は端末が jsDelivr から読む。

## 自動更新の仕組み
1. 開くたびに、端末が `data.jsdelivr.com` に「main の最新コミット番号」を問い合わせる。
2. その番号で固定したアドレス（`cdn.jsdelivr.net/gh/sankisuguya-create/taiiku@<番号>/…`）から読む。`@main` の古さ（最大12時間）を避けるため。
3. 問い合わせに失敗したら：前回の番号 → スクリプト プロパティ `FALLBACK_REF` → `main` の順に使う。画面の下に「版 xxxxxxx（最新／前回の番号／予備）」と出る。
- 読み込み先は cdn → fastly → gcore の順に試す（各8秒）。
- **main に入ったものが、そのまま児童に届く**（リポジトリ `-` の `jsdelivr-delivery.md` §2 の「教師が切り替える」方式から、利用者の指示で外した）。main への取り込みは確かめてから行う。

## 初回の設定（校務PC）
1. Google ドライブで「新規 → その他 → Google Apps Script」。名前は「体育 うごきの教材」。
2. `Code.gs` の中身を、このリポジトリの `gas/Code.gs` で置き換える。
3. 「ファイル → HTML」で `index` という名前のファイルを作り、`gas/index.html` の中身を貼る。
4. 「デプロイ → 新しいデプロイ → 種類：ウェブアプリ」。実行するユーザー：自分、アクセスできるユーザー：組織内（学校のドメイン）。
5. 出た `/exec` のアドレスを Classroom などで配る。

貼るファイルは、GitHub か jsDelivr のコミット番号付きのアドレスから、2つとも同じコミットのものを貼る（`gas-javascript-notes.md` §4）。

## 貼り直しが要るのは
- 器の版（`index.html` の `SHELL_VER`）が上がった時だけ。`units.json` の `shellMin` が器より大きいと、画面に「貼り直してください」と出る。
- 動きのページや一覧を直しただけなら、貼り直しもデプロイも要らない。

## 動きを足すには
`units.json` の単元の `actions` に `{"name": "表示名", "page": "motions/<名前>/index.html", "tech": "<技のid>"}` を足して main に入れる。`tech` はページの技ボタン（`id="tech-<id>"`）。技が1つのページは省く。

## 未確認（実機で確かめる）
- `data.jsdelivr.com` が学校の端末で通るか（`cdn.jsdelivr.net` は実機確認済み）。通らなければ「前回の番号」か `FALLBACK_REF` で動く。
- GAS の画面の中で、動きのページを `srcdoc` の枠に入れて動くか（手元の模擬では動いた）。
- `fonts.googleapis.com`（丸ゴシックの字体）が通るか。通らなくても端末の字体で表示される。
