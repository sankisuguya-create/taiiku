"""配るページを組み立てる。motions/<名前>/src.html の `//@include <パス>` の行を、そのファイルの中身に置き換えて index.html を書く。
使い方: python3 tools/build.py   （リポジトリの一番上で）
index.html は生成物。直す時は src.html と lib/ を直してから、これを実行する。"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
for src in sorted(list(root.glob('motions/*/src.html'))+list(root.glob('prototypes/*/src.html'))):
    out = []
    for line in src.read_text(encoding='utf-8').split('\n'):
        m = re.match(r'\s*//@include\s+(\S+)', line)
        if m:
            inc = (root / m.group(1)).read_text(encoding='utf-8').rstrip('\n')
            out.append(f'// ---- {m.group(1)} ここから（tools/build.py が埋め込み。直す時は元のファイルを）')
            out.append(inc)
            out.append(f'// ---- {m.group(1)} ここまで')
        else:
            out.append(line)
    dst = src.with_name('index.html')
    dst.write_text('<!-- 生成物：src.html と lib/ から tools/build.py で組み立て。直接直さない -->\n' + '\n'.join(out), encoding='utf-8')
    print('組み立て:', dst.relative_to(root))
