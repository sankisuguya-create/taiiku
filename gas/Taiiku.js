// 体育のページ（学習BASE の中で動く）。learning-base の tools/bundle.cjs がこのファイルを関数に包み、
// apps.lock.json の files（taiiku/board など）を LB_FILES に入れて渡す。約束は learning-base の docs/add-app.md。
//   …/exec?app=taiiku              ラインポートボールの作戦ボード
//   …/exec?app=taiiku&page=board   同じ
// 名簿・記録は使わない（作戦の保存は、その端末のブラウザの中だけ）。
var TAIIKU_PAGES = {
  board: { file: 'taiiku/board', title: 'ラインポートボール 作戦ボード' }
};

function doGet(e) {
  var key = String((e && e.parameter && e.parameter.page) || 'board');
  var pg = TAIIKU_PAGES[key] || TAIIKU_PAGES.board;
  var html = (typeof LB_FILES !== 'undefined' && LB_FILES[pg.file]) || '';
  if (!html) return HtmlService.createHtmlOutput('<p>いまは ひらけません。</p>').setTitle(pg.title);
  return HtmlService.createHtmlOutput(String(html))
    .setTitle(pg.title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
