let cart=JSON.parse(localStorage.getItem('unr_cart')||'[]'),cat='All',sel=null,cur=null,selC=0;
/* ---------- storefront ---------- */
function renderShop(){
 $('#chips').innerHTML=['All',...CATS].map(c=>`<button class="chip ${c===cat?'on':''}" data-a="cat" data-v="${c}">${c}</button>`).join('');
 const list=db.products.filter(p=>cat==='All'||p.cat===cat);
 $('#grid').innerHTML=list.length?list.map(p=>{const s=stat(p),t=tot(p);
  return `<button class="card ${s==='out'?'out':''}" data-a="open" data-v="${p.id}"><div class="img">${art(p)}${s==='out'?'<span class="tag">Sold out</span>':s==='low'?`<span class="tag low">Only ${t} left</span>`:''}</div><h3>${esc(p.name)}</h3><span class="pr">${fmt(p.price)}</span>${dots(p)}</button>`}).join(''):'<p class="mut">Nothing in this category yet. Check back after the next drop.</p>';
}
function openProduct(id){cur=byId(id);selC=0;sel=null;drawModal();openOv();$('#modal').classList.add('on')}
function drawModal(){const p=cur,c=p.colors[selC],out=stat(p)==='out',multi=p.colors.length>1||p.colors[0].name!=='Standard';
 $('#modal').innerHTML=`<button class="x" data-a="close" aria-label="Close">×</button><div class="mg"><div class="img">${artC(p,c)}</div><div class="mb"><h2>${esc(p.name)}</h2><div class="disp" style="font-size:20px">${fmt(p.price)}</div>
 ${multi?`<div><div class="mut" style="margin-bottom:8px">Colour: <b style="color:var(--fg)">${esc(c.name)}</b></div><div class="sw">${p.colors.map((k,i)=>`<button class="swb ${i===selC?'on':''} ${SZ.every(s=>k.sizes[s]<1)?'x0':''}" data-a="color" data-v="${i}" title="${esc(k.name)}" aria-label="${esc(k.name)}" style="background-color:${esc(k.hex)}"></button>`).join('')}</div></div>`:''}
 <p class="mut">${out?'This piece is sold out.':'Choose your size. Sizes run oversized, so go down one for a fitted look.'}</p>
 <div class="sizes">${SZ.map(s=>`<button class="sz ${s===sel?'on':''}" data-a="size" data-v="${s}" ${c.sizes[s]<1?'disabled':''}>${s}</button>`).join('')}</div>
 <div class="mut" id="left" style="min-height:22px">${sel&&c.sizes[sel]<=3?`Only ${c.sizes[sel]} left in ${sel}.`:''}</div>
 <button class="cta" id="addBtn" data-a="add" ${sel?'':'disabled'}>${out?'Sold out':sel?'Add to bag':'Select a size'}</button></div></div>`}
function pickSize(s){sel=s;drawModal()}
const colorOf=c=>{const p=byId(c.id);return p.colors.find(k=>k.name===c.color)||p.colors[0]};
function addCart(){const c=cur.colors[selC],ex=cart.find(x=>x.id==cur.id&&x.color===c.name&&x.size===sel);
 if((ex?ex.qty:0)>=c.sizes[sel])return toast('That is all we have in this size.');
 ex?ex.qty++:cart.push({id:cur.id,color:c.name,size:sel,qty:1});
 closeAll();updBag();toast('Added to your bag');renderDrawer()}
function updBag(){localStorage.setItem('unr_cart',JSON.stringify(cart));const n=cart.reduce((a,c)=>a+c.qty,0);$('#bagN').textContent=n;const b=$('#bagBtn');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
const cartTotal=()=>cart.reduce((a,c)=>a+byId(c.id).price*c.qty,0);
function renderDrawer(open){
 const d=$('#drawer');
 d.innerHTML=`<div class="dh"><h3 style="font-size:20px">Your bag</h3><button data-a="close" aria-label="Close bag" style="font-size:24px">×</button></div>
 <div class="db">${cart.length?cart.map((c,i)=>{const p=byId(c.id);return `<div class="row"><div class="th">${artC(p,colorOf(c))}</div><div class="in"><div>${esc(p.name)}</div><div class="mut">${c.color!=='Standard'?esc(c.color)+' · ':''}Size ${c.size} · ${fmt(p.price)}</div><div class="qty"><button data-a="qty" data-i="${i}" data-v="-1" aria-label="Less">−</button>${c.qty}<button data-a="qty" data-i="${i}" data-v="1" aria-label="More">+</button></div></div><button class="mut" data-a="rm" data-i="${i}">Remove</button></div>`}).join(''):'<p class="mut" style="padding:30px 0">Your bag is empty. Pick something from the drop.</p>'}</div>
 <div class="df"><div style="display:flex;justify-content:space-between"><span class="mut">Subtotal</span><b>${fmt(cartTotal())}</b></div><button class="cta" data-a="checkout" ${cart.length?'':'disabled'}>Check out</button></div>`;
 if(open){openOv();d.classList.add('on')}
}
function checkoutForm(){if(!U||U.role!=='customer'){location='/login.html?next=%2F%3Fbag%3D1&msg=1';return}
 $('#drawer').classList.remove('on');
 $('#modal').innerHTML=`<button class="x" data-a="close" aria-label="Close">×</button><div class="mb"><h2>Delivery details</h2><p class="mut">Order total ${fmt(cartTotal())}. We confirm every order by phone before dispatch.</p>
 <div class="two"><div class="fld"><label for="cn">Full name</label><input id="cn" autocomplete="name" value="${esc(U.name)}"></div><div class="fld"><label for="cp">Phone number</label><input id="cp" type="tel" autocomplete="tel" value="${esc(U.phone||'')}"></div></div>
 <div class="fld"><label for="ca">Delivery address</label><input id="ca" autocomplete="street-address"></div>
 <div class="fld"><label for="pay">How would you like to pay?</label><select id="pay"><option value="cod">Pay on delivery</option><option value="wa">Send order on WhatsApp</option></select></div>
 <button class="cta" data-a="place">Place order</button></div>`;
 $('#modal').classList.add('on');$('#ov').classList.add('on');
}
async function placeOrder(){
 const n=$('#cn').value.trim(),ph=$('#cp').value.trim(),ad=$('#ca').value.trim(),pay=$('#pay').value;
 if(!n||!ph||!ad)return toast('Please fill in your name, phone and address.');
 const w=pay==='wa'?window.open('','_blank'):null;
 try{const o=await api('/orders',{method:'POST',body:{name:n,phone:ph,address:ad,pay,items:cart.map(c=>({id:c.id,color:c.color,size:c.size,qty:c.qty}))}});
  let wl='';if(pay==='wa'){const msg=`Hi Unruly, I want to order (${o.id}):\n`+o.items.map(i=>`${i.qty} x ${i.name} (${i.color}, ${i.size})`).join('\n')+`\nTotal: ${fmt(o.total)}\nName: ${n}\nAddress: ${ad}`;wl='https://wa.me/'+CFG.wa+'?text='+encodeURIComponent(msg);if(w)w.location.href=wl}
  cart=[];updBag();db.products=await api('/products');renderShop();
  $('#modal').innerHTML=`<button class="x" data-a="close" aria-label="Close">×</button><div class="mb" style="text-align:center;padding:50px 30px"><h2>Order placed</h2><p class="mut">Thank you, ${esc(n.split(' ')[0])}. Your order number is <b style="color:var(--fg)">${o.id}</b>. You can follow it in your account.</p>${wl?`<a class="cta" href="${wl}" target="_blank" rel="noopener">Open WhatsApp to send your order</a><br><br>`:''}<a class="cta ghost" href="/account.html">View my orders</a></div>`;
 }catch(e){if(w)w.close();toast(e.message)}}
const act={
 color:t=>{selC=+t.dataset.v;if(sel&&cur.colors[selC].sizes[sel]<1)sel=null;drawModal()},
 cat:t=>{cat=t.dataset.v;renderShop()},open:t=>openProduct(t.dataset.v),size:t=>pickSize(t.dataset.v),add:addCart,close:closeAll,
 bag:()=>renderDrawer(true),checkout:checkoutForm,place:placeOrder,
 qty:t=>{const c=cart[t.dataset.i],p=byId(c.id),v=+t.dataset.v;if(v>0&&c.qty>=colorOf(c).sizes[c.size])return toast('That is all we have in this size.');c.qty+=v;if(c.qty<1)cart.splice(t.dataset.i,1);updBag();renderDrawer()},
 rm:t=>{cart.splice(t.dataset.i,1);updBag();renderDrawer()},
 sub:()=>{const e=$('#em').value.trim();if(!/^\S+@\S+\.\S+$/.test(e))return toast('Enter a valid email address.');api('/subscribe',{method:'POST',body:{email:e}}).then(()=>{$('#em').value='';toast('You are on the list')}).catch(x=>toast(x.message))},
};
$('#hh').parentElement.addEventListener('mousemove',e=>{$('#hh').style.setProperty('--mx',((e.clientX/innerWidth-.5)*40).toFixed(1))});
(async()=>{try{db.products=await api('/products');cart=cart.filter(c=>byId(c.id)&&byId(c.id).colors.some(k=>k.name===c.color));renderShop();renderDrawer();updBag();if(location.search.includes('bag'))renderDrawer(true)}catch(e){toast(e.message)}})();
