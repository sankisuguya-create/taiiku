// 体育 うごきの教材：GAS の器。画面（index.html）を返し、単元・動きの表示／非表示の設定を持つ。
// 動きのページと一覧（units.json）は、端末が jsDelivr から読む。貼り方は gas/README.md。
// このファイルと index.html は、器の版（index.html の SHELL_VER）が上がった時だけ、2つとも同じコミットから貼り直す。

var TEACHER_DOMAIN = 'edu.nishi.or.jp'; // 教師のアドレスの @ より後ろ。児童（kyoiku.edu.nishi.or.jp）は含まない
var HIDDEN_KEY = 'HIDDEN';              // スクリプト プロパティ：非表示にした単元・動きの一覧（JSON の配列）

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

// 画面が開いた時に呼ぶ：教師かどうかと、非表示の一覧
function apiState() {
  return { teacher: isTeacher_(), hidden: readHidden_() };
}

// 教師だけ：単元（"rope"）または動き（"rope/交差跳び"）の表示を切り替える。新しい一覧を返す
function apiSetHidden(key, hidden) {
  if (!isTeacher_()) throw new Error('先生のアカウントで開いてください');
  key = String(key || '');
  if (!/^[a-z0-9_-]{1,32}(\/[^\/]{1,40})?$/.test(key)) throw new Error('名前が正しくありません: ' + key);
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var list = readHidden_().filter(function (k) { return k !== key; });
    if (hidden) list.push(key);
    PropertiesService.getScriptProperties().setProperty(HIDDEN_KEY, JSON.stringify(list));
    return list;
  } finally { lock.releaseLock(); }
}

function isTeacher_() {
  var e = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  return e.length > 0 && e.slice(-(TEACHER_DOMAIN.length + 1)) === '@' + TEACHER_DOMAIN;
}

function readHidden_() {
  try {
    var v = JSON.parse(PropertiesService.getScriptProperties().getProperty(HIDDEN_KEY) || '[]');
    return Array.isArray(v) ? v.filter(function (k) { return typeof k === 'string'; }) : [];
  } catch (e) { return []; }
}
