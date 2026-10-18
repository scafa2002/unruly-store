let tab='inv',draft=null;
if(!U||U.role!=='admin')location='/admin-login.html';
const put=p=>api('/products/'+p.id,{method:'PUT',body:p});
async function refresh(m){try{const[p,o,c,sb]=await Promise.all([api('/products'),api('/orders'),api('/customers'),api('/subscribers')]);db.subscribers=sb;db.products=p;db.orders=o;db.customers=c.customers;db.subs=c.subs;renderAdmin();if(m)toast(m)}catch(e){if(e.status===401||e.status===403)return logout('/admin-login.html');toast(e.message)}}
/* ---------- admin ---------- */
function renderAdmin(){
 const A=$('#admin');
 const P=db.products,out=P.filter(p=>stat(p)==='out').length,low=P.filter(p=>stat(p)==='low').length;
 const rev=db.orders.filter(o=>o.status!=='Cancelled').reduce((a,o)=>a+o.total,0);
 let body='';
 if(tab==='inv')body=`<p style="margin-bottom:16px"><button class="cta" data-a="new">Add new product</button><span class="mut" style="font-size:14px;margin-left:12px">Stock per size is the total across colours. Click Edit to change stock for each colour.</span></p><div class="tw"><table><tr><th>Product</th><th>Price</th><th>Colours</th>${SZ.map(s=>`<th>${s}</th>`).join('')}<th>Status</th><th></th></tr>${P.map(p=>{const s=stat(p);return `<tr><td><div style="display:flex;gap:12px;align-items:center"><button class="row th" data-a="edit" data-v="${p.id}" title="Edit photo and details" style="padding:0;border:0;width:40px;height:48px">${art(p)}</button><div>${esc(p.name)}<div class="mut" style="font-size:13px">${p.cat}</div></div></div></td><td>${fmt(p.price)}</td><td>${dots(p)||'<span class="mut">One colour</span>'}</td>${SZ.map(z=>`<td class="${p.sizes[z]<1?'bad':''}">${p.sizes[z]}</td>`).join('')}<td><span class="badge b-${s}">${s==='out'?'Sold out':s==='low'?'Low stock':'In stock'}</span></td><td style="white-space:nowrap"><button class="sm" data-a="soldout" data-v="${p.id}">Mark sold out</button><button class="sm" data-a="edit" data-v="${p.id}">Edit</button><button class="sm d" data-a="del" data-v="${p.id}">Delete</button></td></tr>`}).join('')}</table></div>`;
 if(tab==='ord')body=db.orders.length?`<div class="tw"><table><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>${db.orders.map(o=>`<tr><td>${o.id}<div class="mut" style="font-size:13px">${new Date(o.date).toLocaleDateString()}</div></td><td>${esc(o.name)}<div class="mut" style="font-size:13px">${esc(o.phone)} · ${esc(o.address)}</div></td><td>${o.items.map(i=>`${i.qty} × ${esc(i.name)} (${i.color&&i.color!=='Standard'?esc(i.color)+', ':''}${i.size})`).join('<br>')}</td><td>${fmt(o.total)}</td><td><select class="stk" style="width:auto" data-oid="${o.id}">${STATUS.map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</table></div><p style="margin-top:14px"><button class="sm" data-a="csv">Download orders as CSV</button></p>`:'<p class="mut">No orders yet. They will show up here as customers check out.</p>';
 if(tab==='sub')body=`<p style="margin-bottom:16px"><button class="cta" data-a="copyemails">Copy all emails</button><button class="sm" data-a="subcsv" style="margin-left:10px">Download CSV</button><span class="mut" style="font-size:14px;margin-left:12px">${db.subscribers.length} subscribers. Paste the copied emails into the BCC box of a new email.</span></p>`+(db.subscribers.length?`<div class="tw"><table style="min-width:420px"><tr><th>Email</th><th>Joined</th><th></th></tr>${db.subscribers.map(s=>`<tr><td>${esc(s.email)}</td><td>${new Date(s.created).toLocaleDateString()}</td><td><button class="sm d" data-a="unsub" data-v="${esc(s.email)}">Remove</button></td></tr>`).join('')}</table></div>`:'<p class="mut">No subscribers yet. Emails appear here when visitors join the list on your shop page.</p>');
 if(tab==='cus')body=db.customers.length?`<div class="tw"><table><tr><th>Customer</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Spent</th></tr>${db.customers.map(c=>`<tr><td>${esc(c.name)}<div class="mut" style="font-size:13px">${esc(c.email)}</div></td><td>${esc(c.phone||'-')}</td><td>${new Date(c.created).toLocaleDateString()}</td><td>${c.orders}</td><td>${fmt(c.spent)}</td></tr>`).join('')}</table></div>`:'<p class="mut">No customers yet. They appear here when they create an account.</p>';
 if(tab==='form'){const d=draft;body=`<div class="fgrid"><div class="fld"><label for="f_n">Product name</label><input id="f_n" value="${esc(d.name)}"></div>
 <div class="two"><div class="fld"><label for="f_c">Category</label><select id="f_c">${CATS.map(c=>`<option ${c===d.cat?'selected':''}>${c}</option>`).join('')}</select></div><div class="fld"><label for="f_p">Price (${CFG.cur})</label><input id="f_p" type="number" min="0" value="${d.price}"></div></div>
 <div class="fld"><label>Colours, photos and stock</label>${d.colors.map((k,i)=>`<div class="panel cblk"><div class="cbh"><label class="drop dsm" for="ci_${i}" title="Choose a photo for this colour"><div id="prev${i}" style="display:contents">${artC(d,k)}</div></label><input type="file" id="ci_${i}" data-ci="${i}" accept="image/*" hidden><div class="cbm"><div class="two"><div class="fld"><label>Colour name</label><input data-ci="${i}" data-f="name" value="${esc(k.name)}" placeholder="e.g. Black"></div><div class="fld"><label>Colour</label><input type="color" data-ci="${i}" data-f="hex" value="${esc(k.hex)}" style="height:44px;padding:4px"></div></div></div></div>
 <div class="mut" style="font-size:13px">Units in stock</div><div class="sizesrow">${SZ.map(s=>`<div style="text-align:center"><input class="stk" type="number" min="0" data-ci="${i}" data-s="${s}" value="${k.sizes[s]}" aria-label="${esc(k.name)} ${s} stock"><div class="mut" style="font-size:13px">${s}</div></div>`).join('')}</div>
 <div class="cbf"><label class="sm" for="ci_${i}" style="cursor:pointer">${k.img?'Replace photo':'Upload photo'}</label>${k.img?`<button class="sm" data-a="rmimg" data-v="${i}">Remove photo</button>`:''}${d.colors.length>1?`<button class="sm d" data-a="rmcolor" data-v="${i}">Remove colour</button>`:''}</div></div>`).join('')}<button class="cta ghost" data-a="addcolor" style="margin:4px 0 22px">Add another colour</button></div>
 <button class="cta" data-a="saveP">${d.id?'Save changes':'Add product'}</button> <button class="cta ghost" data-a="tab" data-v="inv">Cancel</button></div>`}
 A.innerHTML=`<div class="wrap ad"><div class="bar"><div><h1 class="disp">Store admin</h1><p class="mut">Changes appear in the shop straight away.</p></div><div><a class="sm" href="/">View shop</a><button class="sm" data-a="logout">Sign out</button></div></div>
 <div class="stats"><div class="st"><span class="mut">Products</span><b>${P.length}</b></div><div class="st"><span class="mut">Units in stock</span><b>${P.reduce((a,p)=>a+tot(p),0)}</b></div><div class="st ${out?'warn':''}"><span class="mut">Sold out</span><b>${out}</b></div><div class="st"><span class="mut">Low stock</span><b>${low}</b></div><div class="st"><span class="mut">Orders</span><b>${db.orders.length}</b></div><div class="st"><span class="mut">Revenue</span><b style="font-size:20px;padding-top:6px">${fmt(rev)}</b></div><div class="st"><span class="mut">Email list</span><b>${db.subs}</b></div></div>
 <div class="tabs"><button class="chip ${tab==='inv'?'on':''}" data-a="tab" data-v="inv">Inventory</button><button class="chip ${tab==='ord'?'on':''}" data-a="tab" data-v="ord">Orders</button><button class="chip ${tab==='cus'?'on':''}" data-a="tab" data-v="cus">Customers</button><button class="chip ${tab==='sub'?'on':''}" data-a="tab" data-v="sub">Subscribers</button><button class="chip ${tab==='form'?'on':''}" data-a="new">Add product</button></div>${body}
 </div>`;
}
const newColor=(n='',h='#e9e7e1')=>({name:n,hex:h,img:'',sizes:{S:0,M:0,L:0,XL:0}});
const blank=()=>({id:0,name:'',cat:'Tees',price:'',color:'#e9e7e1',img:'',sizes:{S:0,M:0,L:0,XL:0},colors:[newColor('Black','#1d1d1d')]});
async function saveProduct(){
 const n=$('#f_n').value.trim(),pr=+$('#f_p').value,d=draft;
 if(!n||!pr)return toast('Add a name and a price first.');
 if(d.colors.some(k=>!k.name.trim()))return toast('Give every colour a name.');
 d.name=n;d.price=pr;d.cat=$('#f_c').value;
 try{d.id?await put(d):await api('/products',{method:'POST',body:d});tab='inv';await refresh('Saved')}catch(e){toast(e.message)}
}
function readImg(file,ci){
 const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);draft.colors[ci].img=c.toDataURL('image/jpeg',.8);renderAdmin()};im.src=r.result};r.readAsDataURL(file);
}

const act={
 tab:t=>{tab=t.dataset.v;renderAdmin()},new:()=>{draft=blank();tab='form';renderAdmin()},
 edit:t=>{draft=JSON.parse(JSON.stringify(byId(t.dataset.v)));tab='form';renderAdmin()},
 csv:()=>{const rows=[['Order','Date','Name','Phone','Address','Items','Total','Status'],...db.orders.map(o=>[o.id,o.date,o.name,o.phone,o.address,o.items.map(i=>`${i.qty}x ${i.name} ${i.color||''} ${i.size}`).join('; '),o.total,o.status])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'}));a.download='unruly-orders.csv';a.click()},
 del:async t=>{if(confirm('Delete this product? This cannot be undone.')){try{await api('/products/'+t.dataset.v,{method:'DELETE'});refresh('Deleted')}catch(e){toast(e.message)}}},
 soldout:async t=>{const p=byId(t.dataset.v);p.colors.forEach(k=>SZ.forEach(s=>k.sizes[s]=0));try{await put(p);refresh(p.name+' is now sold out')}catch(e){toast(e.message)}},
 rmimg:t=>{draft.colors[+t.dataset.v].img='';renderAdmin()},
 rmcolor:t=>{draft.colors.splice(+t.dataset.v,1);renderAdmin()},
 addcolor:()=>{draft.colors.push(newColor());renderAdmin()},
 copyemails:async()=>{const t=db.subscribers.map(s=>s.email).join(', ');if(!t)return toast('No subscribers to copy yet.');try{await navigator.clipboard.writeText(t);toast('Copied '+db.subscribers.length+' emails')}catch(e){prompt('Copy these emails:',t)}},
 subcsv:()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['Email,Joined\n'+db.subscribers.map(s=>s.email+','+s.created).join('\n')],{type:'text/csv'}));a.download='unruly-subscribers.csv';a.click()},
 unsub:async t=>{if(confirm('Remove '+t.dataset.v+' from the list?')){try{await api('/subscribers/'+encodeURIComponent(t.dataset.v),{method:'DELETE'});refresh('Removed')}catch(e){toast(e.message)}}},
 saveP:saveProduct};
document.addEventListener('change',async e=>{const t=e.target;try{
 if(t.dataset.s&&t.dataset.id){const p=byId(t.dataset.id);p.sizes[t.dataset.s]=Math.max(0,+t.value||0);await put(p);refresh('Stock updated')}
 if(t.dataset.oid){await api('/orders/'+t.dataset.oid,{method:'PATCH',body:{status:t.value}});toast('Order marked '+t.value.toLowerCase())}
 if(t.dataset.ci!==undefined&&t.type==='file'&&t.files[0])readImg(t.files[0],+t.dataset.ci)}catch(err){toast(err.message)}});
document.addEventListener('input',e=>{const t=e.target;if(!draft)return;
 if(t.id==='f_n')draft.name=t.value;if(t.id==='f_p')draft.price=t.value;if(t.id==='f_c')draft.cat=t.value;
 if(t.dataset.ci===undefined||t.type==='file')return;const k=draft.colors[+t.dataset.ci];
 if(t.dataset.f)k[t.dataset.f]=t.value;if(t.dataset.s)k.sizes[t.dataset.s]=Math.max(0,+t.value||0);
 if(t.dataset.f==='hex')$('#prev'+t.dataset.ci).innerHTML=artC(draft,k)});
refresh();
