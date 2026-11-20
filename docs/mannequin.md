# 人形の仕様（採用：ドール型／針金型の切り替え）

組み立ては `lib/mannequin.js` が正本。各ページは `src.html` から `tools/build.py` で1ファイルに組み立てる（`index.html` は生成物）。

## 見た目（2種類を切り替え。2026-11-20 採用）
- **ドール型（なめらか）**：継ぎ目の目立たない人体。上腕・太もも・ふくらはぎのふくらみ、腰のくびれ。灰色系、関節は体と同系色。
  - 左右：右は濃い青灰、左は明るい灰（明るさの差で区別）
  - 前の印：胸にオレンジの円＋上向きの三角。顔は鼻で向きを示す
- **針金型**：同じ形を網目で描き、断面の輪を足す。透けるので奥側の手足・体のねじれが見える。関節はオレンジの小さな点。
- 切り替えても骨格・姿勢・動きは同じ（材質と表示だけが変わる）。

## 寸法
- 身長 1.6、約6頭身。体節の長さは身長比の実測値（Drillis & Contini。Winter『Biomechanics and Motor Control of Human Movement』所収）。
- 太さは周径の一般値（日本人の実測DBとは未照合）。

## 関節
`pelvis` `spine`（腰椎）`spine2`（下の胸椎）`chest`（上の胸椎）`neck` `head`
`clR` `shR` `elR` `wrR` / `clL` `shL` `elL` `wrL`（`cl`＝鎖骨。肩を前後・上下に動かす）
`hpR` `knR` `anR` / `hpL` `knL` `anL`
- 前は +Z、人形の右は −X。腕・脚は下（−Y）へ伸びる。
- 胴は関節ごとに分けた回転体を重ねる。背骨3つを少しずつ曲げると背中がカーブする（反る・丸める・ひねる）。
- 胸を張る＝上の胸椎を反らす＋鎖骨で肩を後ろへ引く（`prototypes/joints/` で確認できる）。
- 鎖骨の回転：右は y 負・左は y 正で肩が後ろへ、右は z 負・左は z 正で肩が上へ。
- 腕の逆運動学では、肩の親（鎖骨）の座標に変換して解く（`J_['sh'+側].parent.worldToLocal`）。
- 手：手のひら＋指4本（各2節）＋親指（2節）。`handC`（手の中心）`palmC`（手のひらの面）`fingers`（指の関節と先端）を返す。

## 試作の経緯
- `prototypes/dummy13.html`：DUMMY 13（CC BY 4.0）風
- `prototypes/deform-3levels.html`：写実7.5頭身／中間6頭身／デフォルメ4頭身
- `prototypes/skins.html`：ロボット風・中間・騎士甲冑風・木の人形風
- `prototypes/skins-v2.html`：DUMMY 13型・木製デッサン人形型・ドール型・針金型（ドール型＋針金型を採用）
- `prototypes/chestpass-keyframe.html`：接点駆動法以前のチェストパス
