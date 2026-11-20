# AGENTS.md — taiiku（体育の動きの教材）

体育で「体の動かし方」を説明する教材を置く。どのAIも作業前にここを読む。
利用者のプロファイル・共通の理念は `sankisuguya-create/-` の `AGENTS.md` が正本。

## 説明のスケールと表現（設計の前提）

動きの説明は、対象の大きさで適した表現が違う。

| スケール | 例 | 表現 | 置き場 |
|---|---|---|---|
| 個人の体勢・運動 | 側転、チェストパス、走り方 | 関節が見える人形（3D、2D影絵） | `motions/` |
| ボール運動・少人数の位置関係 | パスの回し方、守り方 | 3Dの角柱など簡単な形 | （未作成）`plays/` |
| 学年規模の動き | 入場、隊形移動 | 点の集まり | （未作成。`flow-line-guide` との関係を先に決める） |

## 読む順序

1. `docs/methodology/contact-driven-motion.md` — **動作を作る・直す時は必ず読む**（接点駆動法）
2. `docs/mannequin.md` — 人形の仕様（寸法・色・関節）
3. `motions/<名前>/notes.md` — その動作の手本の読み取り記録

## 置き場

```
motions/<名前>/src.html     再生ページの元（直すのはこれ）
motions/<名前>/index.html   配るページ（tools/build.py が lib/ を埋め込んで作る生成物。直接直さない）
motions/<名前>/notes.md     手本の出典・読み取った時刻表・こつ・推定した部分・未確認
docs/methodology/           作り方の正本
docs/mannequin.md           人形の仕様
lib/mannequin.js            人形の組み立て（見た目の切り替え・関節）
prototypes/                 過去の試作（参照用。改修しない）。prototypes/joints/ は関節の確認ページ（src.html から組み立て）
tools/verify/               検証の道具（接点・加速度・可動域・干渉・腕の伸び）
```

- **手本動画そのものは置かない**（著作権。動画から読んだ時刻・形だけを `notes.md` に書く）。
- 個人情報・児童の映像は置かない。
- 再生ページは1ファイル（three.js r128 を cdnjs から読む以外は外部に依存しない）。学校へは jsDelivr でコミット番号を固定して配る（`-/principles/jsdelivr-delivery.md`）。

## 共通部分

- 人形の組み立ては `lib/mannequin.js` に切り出した（2026-11-20。見た目の切り替えを全ページで同じにするため）。
- 逆運動学・ならし・接点・再生画面は、まだ各ページに複製している。3つ目の動作を作る時に `lib/` へ切り出す。
- 直したら `python3 tools/build.py` で配るページを組み立て直し、`tools/verify/check.js` で検証する。

## 検証

`tools/verify/check.js <ページ>`（Playwright）。ページは `window.__motion` を公開する（各ページの末尾）。
この作業環境では cdnjs に届かないため、three.js r128 を `npm pack three@0.128.0` で取得して差し替える（スクリプト内の説明）。
