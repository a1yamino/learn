// usage: node kt.js BASE N1 N2 ; screenshots desktop+mobile, collect errors, exercise interactions
const puppeteer=require('puppeteer-core');const fs=require('fs');
const [,,BASE,...NS]=process.argv;const OUT='/workspace/shots/k8s';fs.mkdirSync(OUT,{recursive:true});
const CH=['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/opt/google/chrome/chrome'].find(f=>fs.existsSync(f));
const ACT={'19':async g=>{await g.evaluate(()=>document.querySelectorAll('#op .btn').forEach(b=>b.click()))},'20':async g=>{await g.evaluate(()=>document.querySelectorAll('#rq .btn').forEach(b=>b.click()))}};
(async()=>{const br=await puppeteer.launch({executablePath:CH,args:['--no-sandbox']});const errors=[];
for(const n of NS)for(const [m,vp] of [['d',{width:1024,height:640}],['m',{width:390,height:800,isMobile:true,deviceScaleFactor:2}]]){
 const g=await br.newPage();await g.setViewport(vp);g.on('pageerror',e=>errors.push(n+m+' '+e.message));g.on('console',c=>{if(c.type()==='error')errors.push(n+m+' console '+c.text())});
 const r=await g.goto(`${BASE}k8s/l${n}.html`,{waitUntil:'networkidle2'});if(r.status()>=400)errors.push(n+m+' status '+r.status());
 const at=async(sel,name,w=300)=>{await g.evaluate(s=>document.querySelector(s).scrollIntoView({block:'start'}),sel);await new Promise(r=>setTimeout(r,w));await g.screenshot({path:`${OUT}/l${n}-${m}-${name}.png`})};
 await g.screenshot({path:`${OUT}/l${n}-${m}-00-top.png`});
 for(const id of ['p1','p2']){if(!await g.$('#'+id+' *'))errors.push(n+m+' empty '+id);await at('#'+id,id==='p1'?'01-anim':'02-anim',4000)}
 await ACT[n](g);await at('#s3 .chal','03-hands',400);
 await g.evaluate(()=>{const b=document.querySelector('#t4 button, #t4 .cmd, #t4 [data-i]');b&&b.click()});await at('#t4','05-term',300);
 await g.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true)});await at('#s5 .prac','06-practice',200);await at('#s5 .task2','07-challenge',200);
 await g.evaluate(()=>{document.querySelectorAll('#qs button').forEach(b=>b.click())});await at('#qs','08-quiz',200);
 const ow=await g.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ow>2)errors.push(n+m+' overflow '+ow);
 if(!await g.$('#qs *'))errors.push(n+m+' empty quiz');if(!await g.$('#t4 *'))errors.push(n+m+' empty term');await g.close()}
console.log('errors',JSON.stringify(errors));await br.close()})();
