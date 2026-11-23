'use strict';
// ラインポートボールの作戦ボードを、flow-line-guide の元のファイルから1枚の HTML に組み立てる。
//   node tools/build-board.cjs [flow-line-guide のクローン]   既定は ../flow-line-guide
// 出力：linepb/board/index.html（生成物。直接直さない）。中身が変わらない時は書きかえない（印の版だけ違う変更を作らない）。
// 元：guides/linepb/board/mock.html ＋ engine/voxel/render.js・stage3d.js ＋ assets/objects/sport/figure.js
// three.js は jsDelivr から版を固定して読む（mock.html の importmap のまま）。
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const R = path.resolve(__dirname, '..');
const SRC = path.resolve(process.argv[2] || process.env.FLG_DIR || path.join(R, '..', 'flow-line-guide'));
const OUT = path.join(R, 'linepb', 'board', 'index.html');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const strip = t => t.replace(/^import .*\n/gm, '').replace(/export function/g, 'function');

let html = read('guides/linepb/board/mock.html');
const fig = read('assets/objects/sport/figure.js');
const render = strip(read('engine/voxel/render.js')), stage = strip(read('engine/voxel/stage3d.js'));
const need = (s, a) => { if (!s.includes(a)) throw new Error('mock.html に「' + a + '」がありません（組み立て方を見直す）'); };
need(html, '<script src="../../../assets/objects/sport/figure.js"></script>');
need(html, 'import { createStage } from "../../../engine/voxel/stage3d.js";');
html = html.replace('<script src="../../../assets/objects/sport/figure.js"></script>', () => '<script>\n' + fig + '\n</script>');
html = html.replace('import { createStage } from "../../../engine/voxel/stage3d.js";', () =>
  'import * as THREE from "three";\nimport { OrbitControls } from "three/addons/controls/OrbitControls.js";\n' + render + '\n' + stage);
if (/\.\.\/\.\.\/\.\.\//.test(html)) throw new Error('組み立て後に ../../../ への参照が残っています');

let commit = 'unknown';
try { commit = execFileSync('git', ['-C', SRC, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (e) {}
const MARK = /<meta name="board-source" content="[^"]*">\n/;
const body = html.replace('<head>', '<head>\n<!-- 生成物（tools/build-board.cjs）。直接直さない。元は sankisuguya-create/flow-line-guide の guides/linepb/board/ -->');
const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
if (old.replace(MARK, '') === body) { console.log('変わりなし（' + OUT + '）'); process.exit(0); }
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body.replace('<head>\n', '<head>\n<meta name="board-source" content="flow-line-guide@' + commit + '">\n'));
console.log('書いた：' + OUT + '（flow-line-guide@' + commit.slice(0, 7) + '、' + body.length + '字）');
