// 模擬人形の組み立て（共通部品）。docs/mannequin.md が仕様。
// 見た目は2種類を切り替える：'doll'（ドール型＝ボディくん型のなめらかな人体）／'wire'（針金型＝網目と断面の輪。透けて奥が見える）
// 関節：pelvis spine spine2 chest neck head / clR shR elR wrR（左も同じ）/ hpR knR anR（左も同じ）
//   spine＝腰椎、spine2＝下の胸椎、chest＝上の胸椎（3つで背中を反る・丸める）。clR/clL＝鎖骨（肩を引く・すくめる＝胸を張る）
// 前は +Z、人形の右は −X。腕・脚は下（−Y）へ伸びる。各ページは //@include で埋め込む（tools/build.py）。
function buildMannequin(THREE, css){
  const H=1.6, HEADS=6, GIRTH=1.1;
  // 体節の長さは身長比の実測値（Drillis & Contini）
  const R={chin:0.870,shoulder:0.818,hipJ:0.530,knee:0.285,ankle:0.039,upperArm:0.186,forearm:0.146,hand:0.108,hipJW:0.10,footL:0.152};
  // 周径から出した半径（身長比）。[位置t, 半径]。ふくらはぎ・太もも・上腕のふくらみを残す
  const PROF={upper:[[0,.030],[.35,.029],[.8,.023],[1,.021]], fore:[[0,.023],[.25,.024],[.8,.017],[1,.015]],
              thigh:[[0,.050],[.15,.052],[.6,.040],[1,.031]], shank:[[0,.031],[.3,.035],[.75,.022],[1,.019]]};
  const hh=H/HEADS, s=(H-hh)/(R.chin*H), L=v=>v*H*s, G=v=>v*H*s*GIRTH;
  const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
  // 見た目（役割ごとの材質）
  const lam=c=>new THREE.MeshLambertMaterial({color:c});
  const lam2=c=>new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide});
  const wir=c=>new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.85});
  const solid=c=>new THREE.MeshBasicMaterial({color:c});
  const SKIN={
    doll:{R:lam('#4f6f9a'),L:lam('#dce5ee'),T:lam('#c9d1da'),S:lam('#d4dbe2'),J:lam('#aeb8c3'),A:lam('#4a545e'),O:lam(css('--joint')||'#e0761c'),
          BR:lam('#243f66'),BL:lam('#8fa6bf'),BS:lam('#8e9aa7'),G:lam('#7d8894')},   // B*＝腕の裏側（二の腕の後ろ・前腕と手の甲側）
    wire:{R:wir('#1f4b99'),L:wir('#5fa8e6'),T:wir('#55636e'),S:wir('#55636e'),J:solid('#e0761c'),A:solid('#22303a'),O:solid('#e0761c'),BR:wir('#1f4b99'),BL:wir('#5fa8e6'),BS:wir('#55636e'),G:solid('#7d8894')},
  };
  const root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const J_={}, allMeshes=[];
  const J=(p,name,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);if(name)J_[name]=g;return g;};
  const mesh=(geo,role,p,x,y,z,opt)=>{const o=new THREE.Mesh(geo,SKIN.doll[role]);o.position.set(x||0,y||0,z||0);o.userData.role=role;
    if(opt)Object.assign(o.userData,opt);p.add(o);allMeshes.push(o);return o;};
  const ell=(p,rx,ry,rz,y,role,z)=>{const o=mesh(new THREE.SphereGeometry(1,20,14),role,p,0,y,z);o.scale.set(rx,ry,rz);return o;};
  const ring=(p,r,y,role)=>{const o=mesh(new THREE.TorusGeometry(r,0.0025,4,24),role,p,0,y,0,{wireOnly:true});o.rotation.x=Math.PI/2;return o;};
  const joint=(p,r)=>mesh(new THREE.SphereGeometry(r,14,10),'J',p);
  function limb(p,len,prof,role){
    const pts=prof.map(([t,r])=>[t,G(r)]);
    const v=[new THREE.Vector2(0,0)]; pts.forEach(([t,r])=>v.push(new THREE.Vector2(r,-t*len))); v.push(new THREE.Vector2(0,-len));
    v.reverse(); // 下から上の順にすると面が外を向く（逆だと内側が見えて透けて見える）
    mesh(new THREE.LatheGeometry(v,18),role,p);
    [.25,.5,.75].forEach(u=>{let r=pts[0][1];for(let i=1;i<pts.length;i++)if(pts[i][0]>=u){const [t0,a0]=pts[i-1],[t1,a1]=pts[i];r=a0+(a1-a0)*(u-t0)/(t1-t0);break;} ring(p,r,-u*len,role);});
  }
  function backHalf(p,len,prof,role){ // 体節の後ろ半分を、わずかに大きい半円の回転体で覆う
    const v=[]; prof.forEach(([t,r])=>v.push(new THREE.Vector2(G(r)*1.012,-t*len))); v.reverse();
    const g=new THREE.LatheGeometry(v,12,Math.PI/2,Math.PI);   // phi=π が −Z（後ろ）
    mesh(g,role,p,0,0,0,{dollOnly:true});
  }
  const DEP=0.68;
  function trunk(p,pts,role){ // pts: [y, 半幅(身長比)]。断面は前後に薄い楕円
    const v=[new THREE.Vector2(0,pts[0][0])]; pts.forEach(([y,r])=>v.push(new THREE.Vector2(G(r),y))); v.push(new THREE.Vector2(0,pts[pts.length-1][0]));
    const o=mesh(new THREE.LatheGeometry(v,20),role,p); o.scale.z=DEP; return o;
  }
  // ---- 骨格 ----
  const hipY=L(R.hipJ), shY=L(R.shoulder), spineLen=(shY-hipY)*0.38, chestH=shY-hipY-L(0.05)-spineLen;
  J(body,'pelvis',0,hipY,0);
  J(J_.pelvis,'spine',0,L(0.05),0);          // 腰椎
  J(J_.spine,'spine2',0,spineLen*0.5,0);     // 下の胸椎
  J(J_.spine2,'chest',0,spineLen*0.5,0);     // 上の胸椎
  const neckLen=L(R.chin-R.shoulder);
  J(J_.chest,'neck',0,chestH,0); J(J_.neck,'head',0,neckLen*0.8,0);
  // 胴（関節ごとに分け、重ねて継ぎ目を隠す。反る・丸めると背中がカーブする）
  trunk(J_.pelvis,[[-L(.06),.071],[-L(.03),.095],[L(.03),.092],[L(.06),.074]],'T');
  trunk(J_.spine,[[-spineLen*.05,.075],[spineLen*.3,.073],[spineLen*.58,.075]],'T');
  trunk(J_.spine2,[[-spineLen*.06,.075],[spineLen*.3,.078],[spineLen*.58,.083]],'T');
  trunk(J_.chest,[[-chestH*.05,.083],[chestH*.45,.097],[chestH*.85,.095],[chestH,.074],[chestH*1.08,.03]],'T');
  [J_.spine,J_.spine2].forEach(j=>joint(j,G(.018)));
  // 胸の印（前が分かる）：オレンジの円＋上向きの三角
  const frontZ=G(.097)*DEP*0.985;
  mesh(new THREE.CircleGeometry(G(.03),24),'O',J_.chest,0,chestH*0.55,frontZ);
  const tri=mesh(new THREE.CircleGeometry(G(.022),3),'O',J_.chest,0,chestH*0.8,frontZ*0.985); tri.rotation.z=Math.PI/2;
  // 背中の印：肩甲骨のマーク。背中の面に貼った絵（左肩甲骨＝後ろから見て「」」、右肩甲骨＝その左右反転。内側の縦線＋下の横線、灰色）
  // 胸の回転体と同じ形の薄い面（左右に分けて）に描く。腕を上げると絵が少し下がり、下の角が外へ回る（applyRhythm）
  const scap={};
  [['L',1],['R',-1]].forEach(([sd,sx])=>{ // sx=1：人形の左（+X）
    const c=document.createElement('canvas'); c.width=128; c.height=256; const x=c.getContext('2d');
    // u：左は外側→背骨、右は背骨→外側。縦線は背骨寄り、横線は下で外へ
    const uIn=sx>0?0.82:0.18, uOut=sx>0?0.30:0.70, vTop=0.80, vBot=0.30, lw=10;
    x.strokeStyle='#7d8894'; x.lineWidth=lw; x.lineCap='round'; x.beginPath();
    x.moveTo(uIn*128,(1-vTop)*256); x.lineTo(uIn*128,(1-vBot)*256); x.lineTo(uOut*128,(1-vBot)*256); x.stroke();
    const tex=new THREE.CanvasTexture(c); tex.center.set(uIn,vBot);
    const pts=[[chestH*.12,.0855],[chestH*.45,.097],[chestH*.78,.0955]].map(([y,r])=>new THREE.Vector2(G(r)*1.03,y));
    const phi0=sx>0?Math.PI/2+0.35:Math.PI, phiL=Math.PI/2-0.35;      // phi=π が背中の中央
    const patch=new THREE.Mesh(new THREE.LatheGeometry(pts,16,phi0,phiL),new THREE.MeshLambertMaterial({map:tex,transparent:true,depthWrite:false}));
    patch.scale.z=DEP; patch.userData.fixed=true; J_.chest.add(patch);   // 見た目の切り替えで材質を変えない
    scap[sd]=tex;
  });
  // 首・頭（鼻で向きを示す）
  mesh(new THREE.CylinderGeometry(G(.022),G(.026),neckLen,14),'S',J_.neck,0,neckLen/2);
  joint(J_.neck,G(.016));
  const headMesh=ell(J_.head,hh*0.37,hh*0.5,hh*0.43,hh*0.5,'S');
  const nose=mesh(new THREE.ConeGeometry(hh*0.045,hh*0.1,10),'S',J_.head,0,hh*0.45,hh*0.45); nose.rotation.x=Math.PI/2;
  [-1,1].forEach(x=>mesh(new THREE.SphereGeometry(hh*0.035,8,6),'A',J_.head,x*hh*0.14,hh*0.56,hh*0.39,{wireOnly:true}));
  // ---- 手足 ----
  const handC={}, palmC={}, fingers={R:[],L:[]};
  const fseg=(len,r)=>{const g=new THREE.Group();mesh(new THREE.CylinderGeometry(r,r*0.9,len,6),'S',g,0,-len/2);mesh(new THREE.SphereGeometry(r*0.9,6,4),'S',g,0,-len);return g;};
  [['R',-1],['L',1]].forEach(([k,sx])=>{
    const role=k;
    const shX=sx*(G(.095)+G(.012)), clX=sx*G(.02);
    const cl=J(J_.chest,'cl'+k,clX,chestH*0.9,0);                         // 鎖骨（胸の上端の内側を支点に）
    const sh=J(cl,'sh'+k,shX-clX,chestH*0.85-chestH*0.9,0); joint(sh,G(.03));
    limb(sh,L(R.upperArm),PROF.upper,role); backHalf(sh,L(R.upperArm),PROF.upper,'B'+k);
    const el=J(sh,'el'+k,0,-L(R.upperArm),0); joint(el,G(.024));
    const fr=J(el,'fr'+k,0,0,0);                                            // 前腕のひねり（手のひらを上・下に向ける回転）
    limb(fr,L(R.forearm),PROF.fore,role); backHalf(fr,L(R.forearm),PROF.fore,'B'+k);   // 前腕の裏（手の甲側）
    const wr=J(fr,'wr'+k,0,-L(R.forearm),0); joint(wr,G(.016));
    // 手：手のひら＋指4本（各2節）＋親指（2節）
    const pl=0.05, pw=0.058, pt=0.02;
    mesh(new THREE.BoxGeometry(pw,pl,pt),'S',wr,0,-pl/2);
    mesh(new THREE.BoxGeometry(pw*1.01,pl*1.01,pt*0.35),'BS',wr,0,-pl/2,-pt*0.35,{dollOnly:true});   // 手の甲
    { // 手のひらのしわの印：右手＝「て」、左手＝その左右反転（手のひら側から見て）。手のひらの面に貼った絵
      const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
      x.save(); if(k==='L'){x.translate(128,0);x.scale(-1,1);}
      x.fillStyle='#6f7b88'; x.font='bold 112px "Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('て',64,70); x.restore();
      const pm=new THREE.Mesh(new THREE.PlaneGeometry(pw*0.95,pl*0.95),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
      pm.position.set(0,-pl/2,pt/2+0.0015); pm.rotation.z=Math.PI; pm.userData.fixed=true; wr.add(pm); // 指先が下なので絵を180°回して、指を上にして見た時に正しい向き
    }
    [[.021,.030,.020,.0058],[.007,.033,.022,.006],[-.007,.031,.021,.0058],[-.021,.024,.017,.0052]].forEach(([x,l1,l2,r],i)=>{
      const base=new THREE.Group(); base.position.set(sx*x,-pl,0); wr.add(base);
      const p1=fseg(l1,r); base.add(p1);
      const j2=new THREE.Group(); j2.position.y=-l1; p1.add(j2); j2.add(fseg(l2,r*0.92));
      const tip=new THREE.Object3D(); tip.position.y=-l2*0.95; j2.add(tip);
      fingers[k].push({base,j2,tip,spread:(1.5-i)*sx});
    });
    const tb=new THREE.Group(); tb.position.set(sx*pw/2,-0.012,0.004); wr.add(tb);
    const t1=fseg(0.026,0.0075); tb.add(t1);
    const tj=new THREE.Group(); tj.position.y=-0.026; t1.add(tj); tj.add(fseg(0.022,0.0068));
    const ttip=new THREE.Object3D(); ttip.position.y=-0.022; tj.add(ttip);
    fingers[k].thumb={tb,tj,sx,tip:ttip};
    const c=new THREE.Object3D(); c.position.y=-0.06; wr.add(c); handC[k]=c;
    const pc=new THREE.Object3D(); pc.position.set(0,-0.03,pt/2); wr.add(pc); palmC[k]=pc;
    // 脚
    const hp=J(J_.pelvis,'hp'+k,sx*L(R.hipJW/2),0,0); joint(hp,G(.034));
    limb(hp,hipY-L(R.knee),PROF.thigh,role);
    const kn=J(hp,'kn'+k,0,-(hipY-L(R.knee)),0); joint(kn,G(.03));
    limb(kn,L(R.knee-R.ankle),PROF.shank,role);
    const an=J(kn,'an'+k,0,-L(R.knee-R.ankle),0); joint(an,G(.02));
    // 足：かかと側とつま先に分け、母指球の位置につま先の関節
    const fL=L(R.footL), ballZ=fL*0.55, fy=-L(R.ankle)*0.5;
    const heel=mesh(new THREE.BoxGeometry(1,1,1),role,an,0,fy,(-0.2*fL+ballZ)/2); heel.scale.set(G(.034),L(R.ankle),ballZ+0.2*fL);
    const to=J(an,'to'+k,0,-L(R.ankle),ballZ);                              // つま先（足の指の付け根）
    const toe=mesh(new THREE.BoxGeometry(1,1,1),role,to,0,L(R.ankle)*0.42,(0.8*fL-ballZ)/2); toe.scale.set(G(.033),L(R.ankle)*0.84,0.8*fL-ballZ);
    joint(to,G(.012)).position.y=L(R.ankle)*0.4;
  });
  // 指の部品にも役割を付ける（fsegで作った分）
  root.traverse(o=>{if(o.isMesh&&!o.userData.role&&!o.userData.fixed){o.userData.role='S';allMeshes.push(o);}});
  function setSkin(kind){
    const sk=SKIN[kind]||SKIN.doll;
    allMeshes.forEach(o=>{o.material=sk[o.userData.role]; o.visible=o.userData.wireOnly?kind==='wire':(o.userData.dollOnly?kind!=='wire':true);
      if(o.userData.role==='J'){ if(!o.userData.s0)o.userData.s0=o.scale.x; o.scale.setScalar(o.userData.s0*(kind==='wire'?0.55:1)); } }); // 針金では関節を小さな点に
  }
  setSkin('doll');
  const D=Math.PI/180;
  // 関節の可動域（度、関節の局所の回転 YXZ）。x:前後に曲げる y:ひねる z:横に曲げる。正の向きは docs/mannequin.md
  // 数値は一般的な可動域の参考値を、背骨は3つに分けた1つあたりに割った目安（根拠：一般値。個人差が大きい）
  const ROM={
    spine:{x:[-20,25],y:[-8,8],z:[-10,10]}, spine2:{x:[-12,18],y:[-12,12],z:[-10,10]}, chest:{x:[-12,15],y:[-15,15],z:[-10,10]},
    neck:{x:[-30,30],y:[-45,45],z:[-25,25]}, head:{x:[-25,25],y:[-30,30],z:[-15,15]},
    clR:{x:[-5,5],y:[-25,20],z:[-35,5]}, clL:{x:[-5,5],y:[-20,25],z:[-5,35]},
    frR:{x:[0,0],y:[-90,90],z:[0,0]}, frL:{x:[0,0],y:[-90,90],z:[0,0]},
    toR:{x:[-70,10],y:[0,0],z:[0,0]}, toL:{x:[-70,10],y:[0,0],z:[0,0]},
    knR:{x:[0,150]}, knL:{x:[0,150]},
  };
  // 背骨3つへの配分（腰は少なめ、背中の上は多め）。x,y,z は背骨全体での角度（度）。範囲を超えた分は切る
  const SPLIT={spine:[.35,.25,.25],spine2:[.3,.35,.35],chest:[.35,.4,.4]};
  function bendSpine(x,y,z){ ['spine','spine2','chest'].forEach(n=>{const r=ROM[n],w=SPLIT[n],c=(v,[a,b])=>Math.max(a,Math.min(b,v));
    J_[n].rotation.set(c(x*w[0],r.x)*D,c(y*w[1],r.y)*D,c(z*w[2],r.z)*D,'YXZ');}); }
  // 2関節の逆運動学（親の座標で目標T・曲がる向きP）。sign=-1:ひじ +1:ひざ。伸びきる直前だけやわらかく止める
  function solve2(j1,j2,T,P,A,B,sign){
    const S=j1.position.clone();
    const d=T.clone().sub(S); const Rr=(A+B), raw=d.length(), k0=0.99*Rr, sp=0.0095*Rr;
    const len=raw<k0?raw:k0+sp*(1-Math.exp(-(raw-k0)/sp)); d.setLength(Math.max(len,Math.abs(A-B)*1.01));
    const l=d.length(), dirT=d.clone().normalize();
    const a=Math.acos(Math.min(1,Math.max(-1,(A*A+l*l-B*B)/(2*A*l))));
    const pole=P.clone().sub(dirT.clone().multiplyScalar(P.dot(dirT))).normalize();
    const dirU=dirT.clone().multiplyScalar(Math.cos(a)).add(pole.clone().multiplyScalar(Math.sin(a))).normalize();
    const E=S.clone().add(dirU.clone().multiplyScalar(A));
    const dirF=S.clone().add(d).sub(E).normalize();
    const Y=dirU.clone().negate();
    let Z=dirF.clone().sub(dirU.clone().multiplyScalar(dirF.dot(dirU)));
    if(Z.lengthSq()<1e-8) Z=pole.clone().multiplyScalar(-sign);
    Z.normalize(); if(sign>0) Z.negate();
    const X=new THREE.Vector3().crossVectors(Y,Z).normalize();
    j1.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z));
    const bend=Math.acos(Math.min(1,Math.max(-1,dirU.dot(dirF))));
    j2.rotation.set(sign*bend,0,0);
  }
  const ARM1=L(R.upperArm), ARM2=L(R.forearm);
  // 肩甲上腕リズム：腕を横・上に上げた角度に合わせて鎖骨（肩の付け根）を上げる。腕の角度:肩の付け根の角度＝おおよそ2:1（Inman 1944。個人差あり）
  function applyRhythm(sd){
    const v=v3(0,-1,0).applyQuaternion(J_['sh'+sd].quaternion);           // 上腕の向き（鎖骨の座標）
    const th=Math.acos(Math.max(-1,Math.min(1,-v.y)))/D;                     // 下に下ろした向きからの角度
    const up=Math.max(0,Math.min(1,(th-30)/150))*28;                         // 30°を超えた分を、最大28°まで
    const back=Math.max(0,Math.min(1,-v.z/0.8))*8;                           // 腕を後ろへ引くと少し寄せる
    const sx=sd==='R'?-1:1, r=ROM['cl'+sd];
    const c=(x,[a,b])=>Math.max(a,Math.min(b,x));
    J_['cl'+sd].rotation.set(0,c(-sx*back,r.y)*D,c(sx*up,r.z)*D,'YXZ');
    const k=up/28, tx=scap[sd]; tx.offset.set(0,0.12*k); tx.rotation=sx*k*18*D;   // 肩甲骨のマーク：絵を少し下げ、下の角を外へ回す
  }
  // 腕を世界の座標の目標へ（鎖骨の連動を含めて2回解く）。pole は鎖骨の座標での曲がる向き
  function armIK(sd,target,pole){
    J_['cl'+sd].rotation.set(0,0,0); J_['fr'+sd].quaternion.set(0,0,0,1);
    for(let it=0;it<3;it++){ root.updateMatrixWorld(true);   // 解く→鎖骨を合わせる→解く→…（最後は解いて終える）
      solve2(J_['sh'+sd],J_['el'+sd],J_['cl'+sd].worldToLocal(target.clone()),pole,ARM1,ARM2,-1);
      if(it<2) applyRhythm(sd); }
    root.updateMatrixWorld(true);
  }
  // 手首のひねりを前腕へ移す（手首に残すのは曲げと横への傾きだけ）。手首の向きを決めた後に呼ぶ
  const qa=new THREE.Quaternion(), qb=new THREE.Quaternion();
  function distributeTwist(sd){
    const wr=J_['wr'+sd], fr=J_['fr'+sd];
    const q=wr.quaternion; // 前腕の座標での手首の回転
    const tw=new THREE.Quaternion(0,q.y,0,q.w); if(tw.lengthSq()<1e-9) return; tw.normalize(); // 軸Yまわりのひねり成分
    let ang=2*Math.atan2(tw.y,tw.w); ang=Math.atan2(Math.sin(ang),Math.cos(ang));
    const r=ROM['fr'+sd].y, a2=Math.max(r[0]*D,Math.min(r[1]*D,ang));
    const qt=new THREE.Quaternion().setFromAxisAngle(v3(0,1,0),a2);
    fr.quaternion.multiply(qt);                                // 前腕をひねる
    wr.quaternion.premultiply(qt.clone().invert());            // 手首からひねりを抜く（世界での手の向きは同じ）
    root.updateMatrixWorld(true);
  }
  // つま先を床に：足が傾いた分だけつま先の関節を反らせる（w=床についている重み）
  function toeFlat(sd,w){
    const an=J_['an'+sd]; an.updateMatrixWorld(true);
    const f=v3(0,0,1).transformDirection(an.matrixWorld); const pitch=Math.asin(Math.max(-1,Math.min(1,-f.y)))/D; // つま先が下がる向きが正
    const r=ROM['to'+sd].x; J_['to'+sd].rotation.set(Math.max(r[0],Math.min(r[1],-Math.max(0,pitch)*w))*D,0,0);
  }
  // 本人の目線：目の位置から、顔の向きへ。頭の部品は目線を描く間だけ隠す
  const headParts=[]; J_.head.children.forEach(o=>{if(o.isMesh)headParts.push(o);});
  const eye=new THREE.Object3D(); eye.position.set(0,hh*0.56,hh*0.3); J_.head.add(eye);
  function eyeCamera(cam,target){
    root.updateMatrixWorld(true);
    const p=new THREE.Vector3(); eye.getWorldPosition(p);
    const q=new THREE.Quaternion(); eye.getWorldQuaternion(q);
    cam.position.copy(p); cam.up.copy(v3(0,1,0).applyQuaternion(q));
    if(target) cam.lookAt(target);                                          // 目で目標を見る（頭が向ききらない分は目が動く）
    else cam.lookAt(p.clone().add(v3(0,-0.25,1).normalize().applyQuaternion(q))); // 目標がなければ少し下（人の視線の目安）
    cam.updateProjectionMatrix();
  }
  function aimHead(target,k){ // 目標の方へ頭を k の割合だけ向ける（残りは目で見る）。首・頭の可動域で止める
    if(!target||k<=0) return;
    root.updateMatrixWorld(true);
    const p=new THREE.Vector3(); eye.getWorldPosition(p);
    const q=new THREE.Quaternion(); J_.head.getWorldQuaternion(q);
    const fwd=v3(0,-0.25,1).normalize().applyQuaternion(q), want=target.clone().sub(p).normalize();
    const full=new THREE.Quaternion().setFromUnitVectors(fwd,want), part=new THREE.Quaternion().slerp(full,k*0.5);
    ['neck','head'].forEach(n=>{const j=J_[n]; const pq=new THREE.Quaternion(); j.parent.getWorldQuaternion(pq); const wq=new THREE.Quaternion(); j.getWorldQuaternion(wq);
      const nw=part.clone().multiply(wq); j.quaternion.copy(pq.invert().multiply(nw));
      const e=new THREE.Euler().setFromQuaternion(j.quaternion,'YXZ'), r=ROM[n], c=(v,[a,b])=>Math.max(a*D,Math.min(b*D,v));
      j.rotation.set(c(e.x,r.x),c(e.y,r.y),c(e.z,r.z),'YXZ'); j.updateMatrixWorld(true);});
  }
  function showHead(on){ headParts.forEach(o=>{ o.userData.hid=!on; o.visible=on&&!(o.userData.wireOnly&&!wireOn); }); }
  let wireOn=false; const _setSkin=setSkin;
  function setSkin2(k){ wireOn=k==='wire'; _setSkin(k); }
  const dims={L1:ARM1,L2:ARM2,T1:hipY-L(R.knee),T2:L(R.knee-R.ankle),hipY,chestH,ankleH:hipY-(hipY-L(R.knee))-L(R.knee-R.ankle),ball:L(R.footL)*0.55,footH:L(R.ankle)};
  return {root,body,J_,handC,palmC,fingers,headMesh,setSkin:setSkin2,eyeCamera,showHead,aimHead,ROM,bendSpine,solve2,armIK,applyRhythm,distributeTwist,toeFlat,dims};
}

// 体育館（本人の目線で、どちらを向いているか分かる目印つき）。opts.center:[x,z] 中心、opts.yaw 向き、opts.target:[x,z] 相手の位置（体育館の中の座標）
function buildGym(THREE, opts){
  opts=opts||{}; const g=new THREE.Group(); const [gx,gz]=opts.center||[0,0]; const cx=0, cz=0;
  g.position.set(gx,0,gz); g.rotation.y=opts.yaw||0;   // 体育館の中心と向き（yaw=π/2 で「前」が +X）。target は体育館の中での位置
  const lam=c=>new THREE.MeshLambertMaterial({color:c});
  const floorM=lam('#d9b98c');
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(28,28),floorM); fl.rotation.x=-Math.PI/2; fl.position.set(cx,-0.002,cz); g.add(fl);
  const line=(x1,z1,x2,z2,c)=>{const l=Math.hypot(x2-x1,z2-z1);const m=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.004,l),new THREE.MeshBasicMaterial({color:c||0xffffff}));
    m.position.set(cx+(x1+x2)/2,0.001,cz+(z1+z2)/2); m.rotation.y=Math.atan2(x2-x1,z2-z1); g.add(m);};
  // コートの線と中央の円
  line(-7,-12,-7,12); line(7,-12,7,12); line(-7,-12,7,-12); line(-7,12,7,12); line(-7,0,7,0);
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2; line(Math.sin(a)*1.8,Math.cos(a)*1.8,Math.sin(b)*1.8,Math.cos(b)*1.8);}
  // 壁：前（+Z）は青に白い丸、後ろは白、左右は薄い緑と薄い橙。高い所に窓の帯
  const wall=(w,h,x,z,ry,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),lam(c)); m.position.set(cx+x,h/2,cz+z); m.rotation.y=ry; g.add(m); return m;};
  wall(28,7,0,14,Math.PI,'#7aa6d6'); wall(28,7,0,-14,0,'#eef0ec'); wall(28,7,14,0,-Math.PI/2,'#b8d8b0'); wall(28,7,-14,0,Math.PI/2,'#f0c9a0');
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.4,40),lam('#ffffff')); disc.position.set(cx,3.2,cz+13.98); disc.rotation.y=Math.PI; g.add(disc);
  [[0,13.97,Math.PI],[0,-13.97,0],[13.97,0,-Math.PI/2],[-13.97,0,Math.PI/2]].forEach(([x,z,ry])=>{const b=new THREE.Mesh(new THREE.PlaneGeometry(26,0.9),lam('#f7fbff'));b.position.set(cx+x,5.8,cz+z);b.rotation.y=ry;g.add(b);});
  // 大きな文字（前・後・右・左・天井）。前を向いた時の右は −X 側
  const label=(txt,w,x,y,z,rx,ry,col)=>{const c=document.createElement('canvas');c.width=c.height=256;const x2=c.getContext('2d');
    x2.fillStyle=col||'#1d2a33';x2.font='bold '+(txt.length>1?110:200)+'px "Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif';x2.textAlign='center';x2.textBaseline='middle';x2.fillText(txt,128,138);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true}));
    m.position.set(cx+x,y,cz+z);m.rotation.set(rx,ry,0,'YXZ');g.add(m);};
  label('前',2.4,0,3.2,13.95,0,Math.PI);
  label('後',3.4,0,3.2,-13.95,0,0);
  label('右',3.4,-13.95,3.2,0,0,Math.PI/2);
  label('左',3.4,13.95,3.2,0,0,-Math.PI/2);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(28,28),new THREE.MeshBasicMaterial({color:0xe9edf1})); // 下からの光がないので、照明に頼らない色 ceil.position.set(cx,7,cz); ceil.rotation.x=Math.PI/2; g.add(ceil);
  [[0,0],[0,7],[0,-7],[7,0],[-7,0]].forEach(([x,z])=>label('天井',4,x,6.98,z,Math.PI/2,Math.PI)); // 見上げた角度でも見えるよう5か所
  // 相手（パスを受ける人の目印）
  if(opts.target){const [tx,tz]=opts.target; const m=lam('#e0761c');
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,1.2,16),m); body.position.set(tx,0.6,tz); g.add(body);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(0.13,16,12),m); hd.position.set(tx,1.36,tz); g.add(hd);
    [-1,1].forEach(sx=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.55,8),m);a.position.set(tx+sx*0.2,1.1,tz-0.15);a.rotation.x=-1.2;g.add(a);});}
  return g;
}
