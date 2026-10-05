/* SPARTAN 💎 LUCKY WHEEL
   1) Create a Supabase project.
   2) Run schema.sql in Supabase SQL Editor.
   3) Replace SUPABASE_URL and SUPABASE_ANON_KEY below.
*/
const SUPABASE_URL = "https://eejexypuzxlhgyhkqyeu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jkaUkbf1HTVS5q46LJVbrQ_Nt6PWojL";

const canvas=document.getElementById("wheel"),ctx=canvas.getContext("2d");
const nameInput=document.getElementById("name"),spinBtn=document.getElementById("spin");
const message=document.getElementById("message"),historyEl=document.getElementById("history"),countEl=document.getElementById("count");
let history=[], available=[], angle=0, spinning=false;

const colors=["#ff4d6d","#ff9f1c","#ffd166","#06d6a0","#00b4d8","#4361ee","#8b5cf6","#f72585","#4cc9f0","#80ed99"];

function configured(){return SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");}
async function api(path, options={}){
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{
    ...options,
    headers:{
      "apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY,
      "Content-Type":"application/json","Prefer":"return=representation",
      ...(options.headers||{})
    }
  });
  if(!r.ok) throw new Error(await r.text());
  return r.status===204?[]:r.json();
}
async function load(){
  if(!configured()){available=[2,3,4,5,6,7,8,9,10];draw();return;}
  try{
    history=await api("spins?select=display_name,number,created_at&order=created_at.asc");
    const used=new Set(history.map(x=>Number(x.number)));
    available=[2,3,4,5,6,7,8,9,10].filter(n=>!used.has(n));
    draw();renderHistory();
  }catch(e){message.textContent="Could not load shared history. Check Supabase setup.";console.error(e);}
}
function renderHistory(){
  historyEl.innerHTML="";
  if(!history.length){historyEl.innerHTML='<div class="empty">No spins yet. You could be first!</div>';}
  history.forEach(x=>{
    const row=document.createElement("div");row.className="row";
    row.innerHTML=`<span class="name">${escapeHtml(x.display_name)}</span><span class="num">#${x.number}</span>`;
    historyEl.appendChild(row);
  });
  countEl.textContent=history.length+"/10";
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function draw(){
  const dpr=devicePixelRatio||1,S=700;canvas.width=S*dpr;canvas.height=S*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const cx=350,cy=350,r=310,n=Math.max(available.length,1),step=Math.PI*2/n;
  ctx.clearRect(0,0,S,S);ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
  for(let i=0;i<n;i++){
    const a=i*step;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,a+step);ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.lineWidth=5;ctx.strokeStyle="#fff";ctx.stroke();
    ctx.save();ctx.rotate(a+step/2);ctx.fillStyle="#111";ctx.font="900 42px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(available[i],r*.68,0);ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,53,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#111";ctx.lineWidth=5;ctx.stroke();
  ctx.fillStyle="#111";ctx.font="900 25px system-ui";ctx.textAlign="center";ctx.fillText("💎",0,9);ctx.restore();
}

async function spin(){
  if(spinning)return;
  const name=nameInput.value.trim();
  if(!name){message.textContent="Enter your WhatsApp display name first.";nameInput.focus();return;}
  if(!configured()){message.textContent="The site is not connected to its shared database yet.";return;}
  if(!available.length){message.textContent="All numbers have been claimed!";return;}
  spinning=true;spinBtn.disabled=true;
  try{
    /* The database function chooses the winner atomically, preventing duplicate numbers. */
    const rows=await api("rpc/spin_wheel",{method:"POST",body:JSON.stringify({p_name:name})});
    const winner=Number(rows[0].number);
    const idx=available.indexOf(winner),n=available.length,step=Math.PI*2/n;
    const current=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    let delta=-(idx*step+step/2)-current;while(delta<0)delta+=Math.PI*2;delta+=Math.PI*2*6;
    const start=angle,end=angle+delta,dur=4000,t0=performance.now();
    await new Promise(resolve=>{function f(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);angle=start+(end-start)*e;draw();if(p<1)requestAnimationFrame(f);else resolve();}requestAnimationFrame(f);});
    message.textContent=`🏆 ${name} won Number ${winner}!`;
    await load();
  }catch(e){
    if(String(e).toLowerCase().includes("already"))message.textContent="You have already used your one spin.";
    else message.textContent="That spin could not be completed. Please try again.";
    console.error(e);
  }finally{spinning=false;spinBtn.disabled=false;}
}
spinBtn.addEventListener("click",spin);window.addEventListener("resize",draw);load();
