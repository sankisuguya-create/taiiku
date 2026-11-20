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
  const wir=c=>new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:0.85});
  const solid=c=>new THREE.MeshBasicMaterial({color:c});
  const SKIN={
    doll:{R:lam('#4f6f9a'),L:lam('#dce5ee'),T:lam('#c9d1da'),S:lam('#d4dbe2'),J:lam('#aeb8c3'),A:lam('#4a545e'),O:lam(css('--joint')||'#e0761c')},
    wire:{R:wir('#1f4b99'),L:wir('#5fa8e6'),T:wir('#55636e'),S:wir('#55636e'),J:solid('#e0761c'),A:solid('#22303a'),O:solid('#e0761c')},
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
    mesh(new THREE.LatheGeometry(v,18),role,p);
    [.25,.5,.75].forEach(u=>{let r=pts[0][1];for(let i=1;i<pts.length;i++)if(pts[i][0]>=u){const [t0,a0]=pts[i-1],[t1,a1]=pts[i];r=a0+(a1-a0)*(u-t0)/(t1-t0);break;} ring(p,r,-u*len,role);});
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
    limb(sh,L(R.upperArm),PROF.upper,role);
    const el=J(sh,'el'+k,0,-L(R.upperArm),0); joint(el,G(.024));
    limb(el,L(R.forearm),PROF.fore,role);
    const wr=J(el,'wr'+k,0,-L(R.forearm),0); joint(wr,G(.016));
    // 手：手のひら＋指4本（各2節）＋親指（2節）
    const pl=0.05, pw=0.058, pt=0.02;
    mesh(new THREE.BoxGeometry(pw,pl,pt),'S',wr,0,-pl/2);
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
    const ft=mesh(new THREE.BoxGeometry(1,1,1),role,an,0,-L(R.ankle)*0.5,L(R.footL)*0.3); ft.scale.set(G(.034),L(R.ankle),L(R.footL));
  });
  // 指の部品にも役割を付ける（fsegで作った分）
  root.traverse(o=>{if(o.isMesh&&!o.userData.role){o.userData.role='S';allMeshes.push(o);}});
  function setSkin(kind){
    const sk=SKIN[kind]||SKIN.doll;
    allMeshes.forEach(o=>{o.material=sk[o.userData.role]; o.visible=o.userData.wireOnly?kind==='wire':true;
      if(o.userData.role==='J'){ if(!o.userData.s0)o.userData.s0=o.scale.x; o.scale.setScalar(o.userData.s0*(kind==='wire'?0.55:1)); } }); // 針金では関節を小さな点に
  }
  setSkin('doll');
  return {root,body,J_,handC,palmC,fingers,headMesh,setSkin};
}
