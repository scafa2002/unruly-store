(()=>{const role=document.body.dataset.role,A=role==='admin',q=new URLSearchParams(location.search);let mode='in';
const n=q.get('next'),next=n&&n[0]==='/'&&n[1]!=='/'?n:(A?'/admin.html':'/account.html');
if(U&&U.role===role)location=next;
function draw(){const reg=mode==='reg';$('#auth').innerHTML=`<div class="wrap"><div class="panel auth"><h1 class="disp">${A?'Admin':'Customer'} ${reg?'sign up':'sign in'}</h1><p class="mut" style="margin-bottom:18px">${q.get('msg')?'Sign in or create an account to place your order.':A?'Manage stock, orders and customers.':'Track your orders and check out faster.'}</p>
<div class="tabs" style="margin:0 0 18px"><button class="chip ${reg?'':'on'}" data-a="mode" data-v="in">Sign in</button><button class="chip ${reg?'on':''}" data-a="mode" data-v="reg">Create account</button></div>
${reg?'<div class="fld"><label for="a_n">Full name</label><input id="a_n" autocomplete="name"></div><div class="fld"><label for="a_p">Phone number</label><input id="a_p" type="tel" autocomplete="tel"></div>':''}
<div class="fld"><label for="a_e">Email</label><input id="a_e" type="email" autocomplete="email"></div>
<div class="fld"><label for="a_w">Password</label><input id="a_w" type="password" autocomplete="${reg?'new':'current'}-password"></div>
${reg&&A?'<div class="fld"><label for="a_c">Admin code</label><input id="a_c" type="password"></div>':''}
<button class="cta" data-a="go" style="width:100%">${reg?'Create account':'Sign in'}</button>
<p class="mut" style="margin-top:16px;font-size:14px">${A?'Shopping instead? <a href="/login.html"><u>Customer sign in</u></a>':'Store owner? <a href="/admin-login.html"><u>Admin sign in</u></a>'}</p></div></div>`}
window.act={mode:t=>{mode=t.dataset.v;draw()},go:async()=>{const g=i=>($('#'+i)||{}).value||'';
 try{const r=await api(mode==='reg'?'/register':'/login',{method:'POST',body:{role,name:g('a_n'),phone:g('a_p'),email:g('a_e'),password:g('a_w'),code:g('a_c')}});
 localStorage.setItem('unr_token',r.token);localStorage.setItem('unr_user',JSON.stringify(r.user));location=next}catch(e){toast(e.message)}}};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('#auth'))act.go()});
draw()})();
