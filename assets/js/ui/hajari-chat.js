const state = { open: false };

function formatCurrency(v){
  try{ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v)); }catch(e){return v}
}

function makePanel(){
  const panel = document.createElement('div');
  panel.className = 'hajari-panel';
  panel.innerHTML = `
    <div class="hajari-panel__header">
      <img src="/assets/img/logo-hajari.svg" alt="Hajari" />
      <div>
        <strong>Hajari</strong><div style="font-size:0.85rem;color:#6b5742">تحليل بيانات موجز</div>
      </div>
    </div>
    <div class="hajari-panel__body" id="hajariBody">
      <div class="hajari-msg hajari-msg--bot">مرحباً — أنا حجري. اسألني عن الأداء وسأحلل الأرقام بسرعة.</div>
    </div>
    <div class="hajari-panel__input">
      <input id="hajariInput" placeholder="اسأل شيء مثل: 'أين نركز عملنا هذا الأسبوع؟'" />
      <button id="hajariSend">أرسل</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('hajariSend').addEventListener('click', ()=>{
    const q = document.getElementById('hajariInput').value.trim();
    if(!q) return;
    pushUserMsg(q);
    respondTo(q);
    document.getElementById('hajariInput').value = '';
  });

  return panel;
}

function pushUserMsg(text){
  const body = document.getElementById('hajariBody');
  const el = document.createElement('div'); el.className='hajari-msg hajari-msg--user'; el.textContent = text; body.appendChild(el); body.scrollTop = body.scrollHeight;
}

function pushBotMsg(text){
  const body = document.getElementById('hajariBody');
  const el = document.createElement('div'); el.className='hajari-msg hajari-msg--bot'; el.innerHTML = text; body.appendChild(el); body.scrollTop = body.scrollHeight;
}

function readKpis(){
  const nums = {};
  const pick = id => document.getElementById(id) ? document.getElementById(id).textContent.replace(/[^0-9.\-]/g,'') : null;
  nums.totalOrders = Number(pick('totalOrders')||0);
  nums.totalStones = Number(pick('totalStones')||0);
  nums.totalRequests = Number(pick('totalRequests')||0);
  nums.totalRevenue = Number((pick('totalRevenue')||0));
  nums.avgOrderValue = Number((pick('avgOrderValue')||0));
  nums.completionRate = Number((pick('completionRate')||0));
  return nums;
}

function simpleAnalysis(){
  const k = readKpis();
  const parts = [];
  parts.push(`<strong>ملخّص تلقائي:</strong>`);
  parts.push(`- إجمالي الطلبات: <strong>${k.totalOrders}</strong>`);
  parts.push(`- منتجات معروضة: <strong>${k.totalStones}</strong>`);
  parts.push(`- طلبات خاصة: <strong>${k.totalRequests}</strong>`);
  parts.push(`- متوسط قيمة الطلب: <strong>${formatCurrency(k.avgOrderValue || (k.totalRevenue/(k.totalOrders||1)))}</strong>`);
  if(k.completionRate < 60) parts.push(`<em>ملاحظة:</em> نسبة الإكمال منخفضة (${k.completionRate}%) — تحقق من تأخيرات الشحن.`);
  else parts.push(`<em>حالة:</em> نسبة الإكمال جيدة (${k.completionRate}%).`);
  return parts.join('<br/>');
}

async function respondTo(q){
  // send prompt + lightweight KPI context to server-side proxy
  const kpis = readKpis();
  const loadingId = `h_loading_${Date.now()}`;
  pushBotMsg('<em>جاري التحليل...</em>');
  const body = { prompt: `KPI CONTEXT: ${JSON.stringify(kpis)}\n\nUser question: ${q}` };

  try{
    const res = await fetch('http://localhost/ssms-backend/public/hajari_api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    const j = await res.json();
    if(!j.success){
      throw new Error(j.error || 'AI proxy error');
    }
    // replace last loading bot msg with real content
    const bodyEl = document.getElementById('hajariBody');
    const msgs = bodyEl.querySelectorAll('.hajari-msg.hajari-msg--bot');
    if(msgs && msgs.length) msgs[msgs.length-1].innerHTML = j.text.replace(/\n/g,'<br/>');
  }catch(err){
    const bodyEl = document.getElementById('hajariBody');
    const msgs = bodyEl.querySelectorAll('.hajari-msg.hajari-msg--bot');
    if(msgs && msgs.length) msgs[msgs.length-1].innerHTML = `<em>عذراً، فشل التحليل: ${err.message}</em>`;
    console.error('Hajari proxy error', err);
  }
}

export function injectHajari(){
  const opener = document.createElement('button'); opener.className='hajari-chat-opener'; opener.title='Hajari — تحليلات'; opener.innerHTML = 'ح';
  document.body.appendChild(opener);
  const panel = makePanel();
  opener.addEventListener('click', ()=>{
    state.open = !state.open; panel.classList.toggle('open', state.open);
  });
}

// auto-run on import if on admin page
if(typeof window !== 'undefined'){
  window.addEventListener('load', ()=>{
    try{ injectHajari(); }catch(e){console.warn('Hajari init failed',e)}
  });
}
