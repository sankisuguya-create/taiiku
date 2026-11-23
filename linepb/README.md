# ラインポートボール（3年 体育）

| ファイル | 内容 | 長さ | 大きさ |
|---|---|---|---|
| rules.md | ルールの正本（めあて・コート・得点・ファウル・交代・審判・未決事項） | — | — |
| linepb-rule-v2-3d.mp4 | 3D版（マスコット・BGM・効果音つき） | 4分38秒 | 28MB |
| linepb-rule-v1.8-2d.mp4 | 2D版（音なし） | 4分36秒 | 6MB |
| board/index.html | 作戦ボード（平面・立体の切り替え、見本の作戦13）。学習BASE の「体育」から開く。**生成物**：flow-line-guide の `guides/linepb/board/` から自動で作る（下の「作戦ボードの更新」） | — | 約74KB |
| board-mock.html | 作戦ボード＋はんだんトレーニング（モック。ブラウザで開く。保存はその端末の中だけ） | — | 34KB |

- 動画を作るソース：sankisuguya-create/flow-line-guide の `guides/linepb/`（v1 は `rule.html`、v2 は `v2/full.src.html`）
- まだ決めていないこと：帯の幅（仮に2m）、審判5人の役割分担、4ゲームめ以降の回し方

## 作戦ボードの更新（自動）

1. flow-line-guide の main で作戦ボード（`guides/linepb/board/mock.html`・`engine/voxel/`・`assets/objects/sport/figure.js`）が変わる
2. このリポジトリの自動処理「作戦ボードを取りこむ」（`.github/workflows/sync-board.yml`、1時間ごと）が `linepb/board/index.html` を作り直して main に書き込む
3. 学習BASE の自動処理が「教科の版を上げる」PR を作る（1時間以内）。**それをマージすると学校に届く**

- 学習BASE で開く所：ホーム →「体育」→ ラインポートボール 作戦ボード（`…/exec?app=taiiku`）
- 学習BASE の中で返すのは `gas/Taiiku.js`（ページを返すだけ。名簿・記録は使わない）
- 手で作り直す時：`node tools/build-board.cjs ../flow-line-guide`
- `linepb/board/index.html` は直接直さない（次の取りこみで上書きされる）。直すのは flow-line-guide の元のファイル
