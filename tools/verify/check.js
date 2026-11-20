// 接点駆動法の検証（docs/methodology/contact-driven-motion.md §5）
// 使い方: node tools/verify/check.js motions/cartwheel/index.html [three.min.jsのパス]
// ページは window.__motion = {DUR, setPose(t), J, headMesh, armLen, legLen, contacts:[{name,joint,root,reach,at(t)->{w,x,y,z}|null}], support(t)->['L','R']} を公開する。
// cdnjs に届かない環境では three.js r128 を `npm pack three@0.128.0` で取得し、build/three.min.js のパスを第2引数に渡す。
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const page=process.argv[2], threePath=process.argv[3];
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']}); const p=await b.newPage();
  if(threePath) await p.route('**/three.min.js',r=>r.fulfill({path:path.resolve(threePath),contentType:'text/javascript'}));
  p.on('pageerror',e=>console.log('ページのエラー:',e.message));
  await p.setContent('<!doctype html><meta charset=utf-8><body>'+fs.readFileSync(page,'utf8'),{waitUntil:'networkidle'});
  const r=await p.evaluate(()=>{const M=window.__motion, T=THREE, R=180/Math.PI, dt=1/120, out={};
    const wp=n=>{const v=new T.Vector3();M.J[n].getWorldPosition(v);return v;};
    // 1 接点
    const miss=[]; for(let t=0;t<=M.DUR;t+=0.05){M.setPose(t);M.contacts.forEach(c=>{const a=c.at(t);if(!a||a.w<0.999)return;const d=wp(c.joint).distanceTo(new T.Vector3(a.x,a.y,a.z));if(d>0.03)miss.push(`${t.toFixed(2)}s ${c.name} ${(d*100).toFixed(1)}cm`);});}
    out['接点の外れ(3cm超)']=miss.length?miss:'なし';
    // 2 加速度
    const names=['wrL','wrR','anL','anR','elL','elR','knL','knR','head'], P=[];
    for(let t=0;t<=M.DUR;t+=dt){M.setPose(t);P.push(names.map(wp));}
    out['加速度の最大(m/s²)']=names.map((n,k)=>{let mx=0,at=0;for(let i=1;i<P.length-1;i++){const a=P[i+1][k].clone().add(P[i-1][k]).sub(P[i][k].clone().multiplyScalar(2)).length()/(dt*dt);if(a>mx){mx=a;at=i*dt;}}return `${n} ${mx.toFixed(0)} (${at.toFixed(2)}s)`;});
    // 3 可動域（ひざの逆折れ・股関節の曲げ）
    const rom=[]; for(let t=0;t<=M.DUR;t+=0.05){M.setPose(t);
      [['L',1],['R',-1]].forEach(([sd,sx])=>{const inv=new T.Matrix4().copy(M.J.pelvis.matrixWorld).invert();
        const h=wp('hp'+sd).applyMatrix4(inv),k=wp('kn'+sd).applyMatrix4(inv),a=wp('an'+sd).applyMatrix4(inv);
        const d=k.clone().sub(h).normalize(), s=a.clone().sub(k).normalize();
        const flex=Math.atan2(d.z,-d.y)*R, knee=Math.acos(Math.max(-1,Math.min(1,d.dot(s))))*R;
        if(flex>130) rom.push(`${t.toFixed(2)}s ${sd}股関節の曲げ ${flex.toFixed(0)}°`);
        if(M.J['kn'+sd].rotation.x<-0.02) rom.push(`${t.toFixed(2)}s ${sd}ひざが逆に曲がる`);});}
    // 可動域の表（ページが rom を公開していれば）：関節の局所回転（YXZ）が範囲内か
    if(M.rom){ const E=new T.Euler(); for(let t=0;t<=M.DUR;t+=0.05){M.setPose(t);
      Object.entries(M.rom).forEach(([n,r])=>{const j=M.J[n]; if(!j) return; E.setFromQuaternion(j.quaternion,'YXZ');
        ['x','y','z'].forEach(ax=>{ if(!r[ax]) return; const v=E[ax]*R; if(v<r[ax][0]-1||v>r[ax][1]+1) rom.push(`${t.toFixed(2)}s ${n}.${ax} ${v.toFixed(0)}°（範囲 ${r[ax][0]}〜${r[ax][1]}）`);});});} }
    out['可動域の外れ']=rom.length?rom:'なし';
    // 4 頭と腕の重なり
    const hit=[]; for(let t=0;t<=M.DUR;t+=0.05){M.setPose(t);const hm=M.headMesh;hm.updateMatrixWorld(true);const inv=new T.Matrix4().copy(hm.matrixWorld).invert(),sc=hm.scale,AR=0.042;let mn=9;
      ['L','R'].forEach(sd=>{const A=wp('sh'+sd),B=wp('el'+sd),C=wp('wr'+sd);for(let u=0.15;u<=1;u+=0.05)[[A,B],[B,C]].forEach(([P1,Q])=>{const X=P1.clone().lerp(Q,u).applyMatrix4(inv);
        const d=new T.Vector3(X.x*sc.x/(sc.x+AR),X.y*sc.y/(sc.y+AR),X.z*sc.z/(sc.z+AR)).length();mn=Math.min(mn,d);});});
      if(mn<1) hit.push(`${t.toFixed(2)}s ${mn.toFixed(2)}`);}
    out['頭と腕の重なり(1未満が重なり)']=hit.length?hit:'なし';
    // 5 支えている腕の伸び
    const el=[]; for(let t=0;t<=M.DUR;t+=0.05){M.setPose(t);(M.support?M.support(t):[]).forEach(sd=>{const a=Math.abs(M.J['el'+sd].rotation.x)*R;if(a>20)el.push(`${t.toFixed(2)}s ${sd} ${a.toFixed(0)}°`);});}
    out['支えている腕のひじ(20°超)']=el.length?el:'なし';
    return out;});
  for(const k in r) console.log('■ '+k+'\n  '+(Array.isArray(r[k])?r[k].join('\n  '):r[k]));
  await b.close();
})();
