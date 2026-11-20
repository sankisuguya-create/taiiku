# 人形の仕様（中間案B）

## 形
- 身長 1.6（単位m相当）、約6頭身。体節の長さは身長比の実測値（Drillis & Contini。Winter『Biomechanics and Motor Control of Human Movement』所収）。
- 太さは周径の一般値から直線的に単純化（日本人の実測DBとは未照合）。
- 胴は骨盤・腹・胸の3つ（つながった回転体、断面は前後に薄い楕円）。首・頭（卵形）。
- 手：手のひら＋指4本（各2節）＋親指（2節）。足：箱形。

## 色（役割）
- 右半身：濃い青、左半身：明るい青（色だけでなく明るさの差でも区別）
- 関節：オレンジの球
- 胴：白、肌：薄い肌色、胸の前に印（前後の区別）

## 関節（名前は各ページ共通）
`pelvis` `spine` `chest` `neck` `head` / `shR` `elR` `wrR` `shL` `elL` `wrL` / `hpR` `knR` `anR` `hpL` `knL` `anL`
- 前は +Z、人形の右は −X。腕・脚は下（−Y）へ伸びる。

## 試作の経緯
- `prototypes/dummy13.html`：DUMMY 13（CC BY 4.0）風の骨組み＋装甲（約6頭身）
- `prototypes/deform-3levels.html`：写実寄り7.5頭身／中間6頭身（採用）／デフォルメ4頭身
- `prototypes/chestpass-keyframe.html`：接点駆動法以前の、姿勢を数値で直接指定した版
