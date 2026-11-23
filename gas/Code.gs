// 体育 うごきの教材：GAS の器。画面（index.html）を返すだけ。動きのページと一覧は、端末が jsDelivr から読む。
// 貼り方は gas/README.md。このファイルと index.html は、器の版（SHELL_VER）が上がった時だけ貼り直す。

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('体育 うごきの教材')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 最新の番号を調べられなかった時に読む版。プロジェクトの設定 → スクリプト プロパティ FALLBACK_REF に書く（無ければ main）
function getFallbackRef() {
  return PropertiesService.getScriptProperties().getProperty('FALLBACK_REF') || 'main';
}
