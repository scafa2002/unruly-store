// Unruly store server: zero dependencies, needs Node 22.13+ (built-in SQLite). Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{DatabaseSync}=require('node:sqlite');
const PORT=process.env.PORT||3000,ADMIN_CODE=process.env.ADMIN_CODE||'UNRULY-ADMIN';
const db=new DatabaseSync(process.env.DB_PATH||path.join(__dirname,'unruly.db'));
db.exec(`create table if not exists kv(k text primary key,v text);
create table if not exists users(id integer primary key,name text,email text unique,phone text,pass text,role text,created text default current_timestamp);
create table if not exists products(id integer primary key,name text,cat text,price integer,color text,img text,sizes text);
create table if not exists orders(id text primary key,user_id integer,name text,phone text,address text,items text,total integer,status text default 'Pending',pay text,created text default current_timestamp);
create table if not exists subs(email text primary key,created text default current_timestamp);`);
let SECRET=(db.prepare('select v from kv where k=?').get('secret')||{}).v;
if(!SECRET){SECRET=crypto.randomBytes(32).toString('hex');db.prepare('insert into kv values(?,?)').run('secret',SECRET)}
if(!db.prepare('select 1 from products').get()){
 const ins=db.prepare('insert into products(name,cat,price,color,img,sizes) values(?,?,?,?,?,?)'),z=a=>JSON.stringify({S:a[0],M:a[1],L:a[2],XL:a[3]});
 [['Fracture Tee','Tees',18000,'#e9e7e1',[6,10,8,4]],['Static Hoodie','Hoodies',42000,'#2b2b2b',[3,5,2,0]],['Off-Script Cargo','Bottoms',36000,'#4a4d3f',[4,6,6,3]],['Riot Cap','Headwear',12000,'#4d3dff',[0,0,0,0]],['Mono Long Sleeve','Tees',24000,'#1d1d1d',[2,2,1,5]],['Drift Zip Hoodie','Hoodies',46000,'#bdb7a8',[5,7,7,2]]].forEach(p=>ins.run(p[0],p[1],p[2],p[3],'',z(p[4])));
}
try{db.exec('alter table products add column colors text')}catch(e){}
for(const r of db.prepare('select * from products where colors is null').all())db.prepare('update products set colors=? where id=?').run(JSON.stringify([{name:'Standard',hex:r.color||'#e9e7e1',img:r.img||'',sizes:JSON.parse(r.sizes)}]),r.id);
const hash=p=>{const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,32).toString('hex')};
const check=(p,h)=>{const[s,k]=h.split(':');return crypto.timingSafeEqual(crypto.scryptSync(p,s,32),Buffer.from(k,'hex'))};
const mac=b=>crypto.createHmac('sha256',SECRET).update(b).digest('base64url');
const sign=u=>{const b=Buffer.from(JSON.stringify({id:u.id,role:u.role,exp:Date.now()+6048e5})).toString('base64url');return b+'.'+mac(b)};
const who=req=>{const[b,s]=(req.headers.authorization||'').slice(7).split('.');if(!s||mac(b)!==s)return null;try{const p=JSON.parse(Buffer.from(b,'base64url'));return p.exp>Date.now()?p:null}catch{return null}};
const err=(m,c=400)=>{throw Object.assign(new Error(m),{c})};
const iso=s=>String(s).replace(' ','T')+'Z';
const SIZES=['S','M','L','XL','2XL','3XL'];
const P=r=>{const colors=JSON.parse(r.colors),sizes={};SIZES.forEach(k=>sizes[k]=0);colors.forEach(c=>SIZES.forEach(k=>{c.sizes[k]=c.sizes[k]||0;sizes[k]+=c.sizes[k]}));return{id:r.id,name:r.name,cat:r.cat,price:r.price,color:colors[0].hex,img:colors[0].img,sizes,colors}};
const O=r=>({id:r.id,date:iso(r.created),name:r.name,phone:r.phone,address:r.address,items:JSON.parse(r.items),total:r.total,status:r.status,pay:r.pay});
const pub=u=>({id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role});
const R=[],route=(m,p,role,fn)=>R.push([m,new RegExp('^'+p+'$'),role,fn]);
const mail=e=>/^\S+@\S+\.\S+$/.test(e);

route('POST','/api/register',null,b=>{
 const name=(b.name||'').trim(),email=(b.email||'').trim().toLowerCase(),role=b.role==='admin'?'admin':'customer';
 if(!name||!mail(email))err('Enter your name and a valid email address.');
 if((b.password||'').length<6)err('Your password needs at least 6 characters.');
 if(role==='admin'&&b.code!==ADMIN_CODE)err('That admin code is not correct.',403);
 if(db.prepare('select 1 from users where email=?').get(email))err('An account with that email already exists. Try signing in.');
 const r=db.prepare('insert into users(name,email,phone,pass,role) values(?,?,?,?,?)').run(name,email,(b.phone||'').trim(),hash(b.password),role);
 const u=pub({id:Number(r.lastInsertRowid),name,email,phone:(b.phone||'').trim(),role});return{token:sign(u),user:u}});
route('POST','/api/login',null,b=>{
 const u=db.prepare('select * from users where email=?').get((b.email||'').trim().toLowerCase());
 if(!u||!check(b.password||'',u.pass))err('Email or password is incorrect.',401);
 if(u.role!==(b.role==='admin'?'admin':'customer'))err(u.role==='admin'?'This is an admin account. Use the admin sign-in page.':'This is a customer account. Use the customer sign-in page.',403);
 return{token:sign(u),user:pub(u)}});
route('GET','/api/me','any',(b,u)=>{const r=db.prepare('select id,name,email,phone,role from users where id=?').get(u.id);if(!r)err('Please sign in again.',401);return r});

const pbody=b=>{
 if(!(b.name||'').trim()||!(+b.price>0))err('A product needs a name and a price.');
 const cs=(Array.isArray(b.colors)?b.colors:[]).slice(0,10).map(c=>{const s={};SIZES.forEach(k=>s[k]=Math.max(0,parseInt(c.sizes&&c.sizes[k])||0));return{name:(c.name||'').trim()||'Standard',hex:/^#[0-9a-f]{6}$/i.test(c.hex)?c.hex:'#e9e7e1',img:c.img||'',sizes:s}});
 if(!cs.length)err('Add at least one colour.');
 if(new Set(cs.map(c=>c.name.toLowerCase())).size<cs.length)err('Each colour needs a different name.');
 return[b.name.trim(),b.cat||'Tees',Math.round(+b.price),cs[0].hex,'',JSON.stringify(cs[0].sizes),JSON.stringify(cs)]};
route('GET','/api/products',null,()=>db.prepare('select * from products order by id desc').all().map(P));
route('POST','/api/products','admin',b=>({id:Number(db.prepare('insert into products(name,cat,price,color,img,sizes,colors) values(?,?,?,?,?,?,?)').run(...pbody(b)).lastInsertRowid)}));
route('PUT','/api/products/(\\d+)','admin',(b,u,m)=>{db.prepare('update products set name=?,cat=?,price=?,color=?,img=?,sizes=?,colors=? where id=?').run(...pbody(b),m[1]);return{ok:1}});
route('DELETE','/api/products/(\\d+)','admin',(b,u,m)=>{db.prepare('delete from products where id=?').run(m[1]);return{ok:1}});

route('POST','/api/orders','customer',(b,u)=>{
 const items=Array.isArray(b.items)?b.items:[];if(!items.length)err('Your bag is empty.');
 if(!['name','phone','address'].every(k=>(b[k]||'').trim()))err('Please fill in your name, phone and address.');
 db.exec('BEGIN');
 try{const lines=[];let total=0;
  for(const i of items){const p=db.prepare('select * from products where id=?').get(i.id);if(!p)err('A product in your bag is no longer available.');
   const cs=JSON.parse(p.colors),q=parseInt(i.qty)||0,c=i.color?cs.find(x=>x.name===i.color):cs[0];
   if(!c||q<1||!SIZES.includes(i.size)||(c.sizes[i.size]||0)<q)err(p.name+(c?' in '+c.name:'')+' ('+i.size+') is out of stock.');
   c.sizes[i.size]-=q;db.prepare('update products set colors=? where id=?').run(JSON.stringify(cs),p.id);lines.push({id:p.id,name:p.name,color:c.name,size:i.size,qty:q,price:p.price});total+=p.price*q}
  const id='UNR-'+Date.now().toString(36).toUpperCase();
  db.prepare('insert into orders(id,user_id,name,phone,address,items,total,pay) values(?,?,?,?,?,?,?,?)').run(id,u.id,b.name.trim(),b.phone.trim(),b.address.trim(),JSON.stringify(lines),total,b.pay==='wa'?'wa':'cod');
  db.exec('COMMIT');return O(db.prepare('select * from orders where id=?').get(id))
 }catch(e){db.exec('ROLLBACK');throw e}});
route('GET','/api/orders/mine','customer',(b,u)=>db.prepare('select * from orders where user_id=? order by created desc').all(u.id).map(O));
route('GET','/api/orders','admin',()=>db.prepare('select * from orders order by created desc').all().map(O));
route('PATCH','/api/orders/([\\w-]+)','admin',(b,u,m)=>{if(!['Pending','Paid','Shipped','Delivered','Cancelled'].includes(b.status))err('Unknown status.');db.prepare('update orders set status=? where id=?').run(b.status,m[1]);return{ok:1}});
route('GET','/api/customers','admin',()=>({customers:db.prepare("select u.id,u.name,u.email,u.phone,u.created,count(o.id) orders,coalesce(sum(case when o.status!='Cancelled' then o.total end),0) spent from users u left join orders o on o.user_id=u.id where u.role='customer' group by u.id order by u.created desc").all().map(c=>({...c,created:iso(c.created)})),subs:db.prepare('select count(*) n from subs').get().n}));
route('GET','/api/subscribers','admin',()=>db.prepare('select email,created from subs order by created desc').all().map(s=>({email:s.email,created:iso(s.created)})));
route('DELETE','/api/subscribers/([^/]+)','admin',(b,u,m)=>{db.prepare('delete from subs where email=?').run(decodeURIComponent(m[1]));return{ok:1}});
route('POST','/api/subscribe',null,b=>{const e=(b.email||'').trim().toLowerCase();if(!mail(e))err('Enter a valid email address.');db.prepare('insert or ignore into subs(email) values(?)').run(e);return{ok:1}});

const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'},PUB=path.join(__dirname,'public');
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://x');
  if(url.pathname.startsWith('/api/')){
   const r=R.find(x=>x[0]===req.method&&x[1].test(url.pathname));if(!r)return send(res,404,{error:'Not found'});
   const u=who(req);if(r[2]&&(!u||(r[2]!=='any'&&u.role!==r[2])))return send(res,u?403:401,{error:u?'You do not have access to this.':'Please sign in.'});
   let raw='';for await(const c of req){raw+=c;if(raw.length>8e6)err('That upload is too large.',413)}
   return send(res,200,r[3](raw?JSON.parse(raw):{},u,url.pathname.match(r[1])))}
  const f=path.join(PUB,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));
  if(!f.startsWith(PUB)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Page not found')}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(f).pipe(res);
 }catch(e){send(res,e.c||500,{error:e.c?e.message:'Something went wrong on our side. Try again.'});if(!e.c)console.error(e)}
}).listen(PORT,()=>console.log('Unruly v3 (colour options) is running at http://localhost:'+PORT+'\nAdmin sign-up code: '+ADMIN_CODE+' (set your own with the ADMIN_CODE environment variable)'));
