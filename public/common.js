const CFG={cur:'₦',wa:'2348028453170'};   // currency symbol and WhatsApp number (no +)
const SZ=['S','M','L','XL'],CATS=['Tees','Hoodies','Bottoms','Headwear'],STATUS=['Pending','Paid','Shipped','Delivered','Cancelled'];
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>CFG.cur+Number(n||0).toLocaleString('en-US');
const TOKEN=localStorage.getItem('unr_token');let U=null;try{U=JSON.parse(localStorage.getItem('unr_user'))}catch(e){}
const db={products:[],orders:[],customers:[],subs:0};
const byId=id=>db.products.find(p=>p.id==id);
const tot=p=>SZ.reduce((a,s)=>a+(+p.sizes[s]||0),0);
const stat=p=>{const t=tot(p);return t===0?'out':t<=5?'low':'ok'};
const PATH={Tees:'M30 14l-22 12 8 16 10-5v43h48V37l10 5 8-16-22-12c-3 7-10 10-20 10s-17-3-20-10z',Hoodies:'M32 16L8 30l7 22 11-4v40h48V48l11 4 7-22-24-14c-2 8-9 12-18 12s-16-4-18-12z',Bottoms:'M28 8h44l6 86H56L50 36l-6 58H22z',Headwear:'M15 60c0-22 15-34 35-34s35 12 35 34v6H15zM60 62h35c0 6-10 10-35 10z'};
const art=p=>p.img?`<img src="${p.img}" alt="">`:`<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${PATH[p.cat]||PATH.Tees}" fill="${esc(p.color)}" stroke="rgba(255,255,255,.3)" stroke-width="1"/></svg>`;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)}
function openOv(){$('#ov').classList.add('on')}
function closeAll(){['#ov','#drawer','#modal'].forEach(s=>$(s).classList.remove('on'))}
const artC=(p,c)=>art({...p,color:c.hex,img:c.img});
const dots=p=>p.colors&&p.colors.length>1?'<span class="dots">'+p.colors.map(k=>`<i style="background-color:${esc(k.hex)}" title="${esc(k.name)}"></i>`).join('')+'</span>':'';
async function api(p,o={}){const r=await fetch('/api'+p,{method:o.method||'GET',headers:{'Content-Type':'application/json',...(TOKEN?{Authorization:'Bearer '+TOKEN}:{})},body:o.body?JSON.stringify(o.body):undefined});
 const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'Something went wrong. Try again.');e.status=r.status;throw e}return j}
function logout(to='/'){localStorage.removeItem('unr_token');localStorage.removeItem('unr_user');location=to}
(function(){const pg=document.body.dataset.page,n=JSON.parse(localStorage.getItem('unr_cart')||'[]').reduce((a,c)=>a+c.qty,0),shop=pg==='shop';
 const acct=U?(U.role==='admin'?'<a href="/admin.html">Dashboard</a>':'<a href="/account.html">My account</a>')+'<a href="#" data-a="logout">Sign out</a>':'<a href="/login.html">Sign in</a><a href="/admin-login.html">Admin</a>';
 $('#top').innerHTML=`<div class="wrap"><a href="/" aria-label="Unruly home"><img class="logo" src="/logo.png" alt="Unruly"></a><nav><a href="/#shop">Shop</a><a href="/about.html">About</a>${acct}</nav>${shop?'<button class="bag" id="bagBtn" data-a="bag">':'<a class="bag" href="/?bag=1">'}Bag <b id="bagN">${n}</b>${shop?'</button>':'</a>'}</div>`})();
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;if(t.dataset.a==='logout'){e.preventDefault();return logout(U&&U.role==='admin'?'/admin-login.html':'/')}if(typeof act!=='undefined'&&act[t.dataset.a])act[t.dataset.a](t)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll()});
/* background: ruled lines that bend away from the cursor */
(function(){const c=$('#bg'),x=c.getContext('2d'),m={x:-999,y:-999,tx:-999,ty:-999},GAP=38,STEP=16,still=matchMedia('(prefers-reduced-motion:reduce)').matches;let W,H;
 function size(){const d=devicePixelRatio||1;W=innerWidth;H=innerHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)}
 size();addEventListener('resize',()=>{size();if(still)frame(0)});
 addEventListener('pointermove',e=>{m.tx=e.clientX;m.ty=e.clientY});
 function frame(t){
  m.x+=(m.tx-m.x)*.12;m.y+=(m.ty-m.y)*.12;x.clearRect(0,0,W,H);x.lineWidth=1;
  const off=(scrollY*.25)%GAP;
  for(let y0=-GAP+off;y0<H+GAP;y0+=GAP){
   let px=0,py=0,first=true;
   for(let X=0;X<=W+STEP;X+=STEP){
    const dx=X-m.x,dy=y0-m.y,d=Math.hypot(dx,dy)||1,f=Math.max(0,1-d/230);
    const y=y0+Math.sin(X*.007+y0*.012+t*.0005)*5+(dy/d)*f*f*50;
    if(!first){x.strokeStyle='rgba(200,195,255,'+(.07+f*.55)+')';x.beginPath();x.moveTo(px,py);x.lineTo(X,y);x.stroke()}
    px=X;py=y;first=false}
  }
  if(!still)requestAnimationFrame(frame)}
 requestAnimationFrame(frame)})();
