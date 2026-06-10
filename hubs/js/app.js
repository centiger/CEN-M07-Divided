let HUBS=[];
let current=null;
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);

async function loadData(){
  const res=await fetch('data/hubs.json?v=flow-fix-20260610',{cache:'no-store'});
  const data=await res.json();
  HUBS=data.hubs||[];
  const slug=params.get('hub')||data.defaultHub||(HUBS[0]&&HUBS[0].slug);
  renderHub(slug);
  renderHubList();
}

function setOptional(sectionId, contentId, value, renderer){
  const section=$(sectionId);
  const box=$(contentId);
  if(!section||!box)return;
  if(!value || (Array.isArray(value)&&!value.length)){
    section.style.display='none';
    box.innerHTML='';
    return;
  }
  section.style.display='block';
  box.innerHTML=renderer?renderer(value):formatText(value);
}

function formatText(v){
  if(Array.isArray(v)) return `<ul class="cleanList">${v.map(x=>`<li>${formatInline(x)}</li>`).join('')}</ul>`;
  return escapeHtml(formatInline(v)).replace(/\n/g,'<br>');
}

function formatInline(v){
  if(v===null||v===undefined) return '';
  if(typeof v==='object'){
    const main=v.title||v.label||v.name||v.text||v.content||'';
    const sub=v.desc||v.description||v.detail||'';
    const icon=v.icon?`${v.icon} `:'';
    if(main||sub) return icon + main + (sub?` - ${sub}`:'');
    return Object.values(v).filter(x=>typeof x!=='object').join(' - ');
  }
  return String(v);
}

function escapeHtml(s){
  return s.replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}

function renderHub(slug){
  current=HUBS.find(h=>h.slug===slug)||HUBS[0];
  if(!current)return;
  $('appTitle').textContent=current.title;
  $('appSub').textContent=current.subtitle||'분열왕국 핵심사건 확장탐험';
  $('hero').innerHTML=`${current.kicker?`<div class="kicker">${escapeHtml(current.kicker)}</div>`:''}<h1>${escapeHtml(current.heroTitle||current.title)}</h1><p>${formatText(current.heroText||'')}</p><div class="tags">${(current.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div>`;

  $('flowTitle').textContent=current.mainFlowTitle||'핵심 흐름';
  $('mainFlow').innerHTML=nodes(current.mainFlow||[]);

  $('mapTitle').textContent=current.mapTitle||'지도';
  $('mapImg').src=current.map||'';
  $('mapCaption').textContent=current.mapCaption||'';

  setOptional('verseSection','verse',current.verse);

  $('keyItems').innerHTML=(current.keyItems||[]).map(i=>`<div class="infoBox"><div class="ico">${i.icon||'•'}</div><b>${escapeHtml(i.title||'')}</b><p>${formatText(i.text||'')}</p></div>`).join('');
  $('overviewFlow').innerHTML=nodes(current.overviewFlow||[]);

  setOptional('eventsSection','events',current.events, renderListOrFlow);
  setOptional('meaningSection','meaning',current.meaning);
  setOptional('integrationSection','integration',current.integration);
  setOptional('bibleSection','bible',current.bible);
  setOptional('messageSection','message',current.message, v=>`<div class="messageStrong">${formatText(v)}</div>`);

  if($('timeline')) $('timeline').innerHTML=(current.timeline||[]).map(t=>`<div class="t ${t.active?'active':''}">${escapeHtml(t.year||'')}<div class="dot"></div>${escapeHtml(t.label||'')}</div>`).join('');
  $('links').innerHTML=(current.links||[]).map((l,i)=>`<button class="${i===1?'primary':''}" data-url="${l.url||''}" data-hub="${l.hub||''}">${escapeHtml(l.label||'')}</button>`).join('');
  $('prevBtn').textContent=current.prevLabel||'이전 허브';
  $('nextBtn').textContent=current.nextLabel||'다음 허브';
}

function renderListOrFlow(value){
  if(Array.isArray(value)) return formatText(value);
  const parts=formatInline(value).split('→').map(s=>s.trim()).filter(Boolean);
  if(parts.length>1){
    return `<div class="arrowFlow">${parts.map(p=>`<span>${escapeHtml(p)}</span>`).join('<b>→</b>')}</div>`;
  }
  return formatText(value);
}

function nodes(items){
  return items.map(i=>`<div class="node"><div class="ico">${i.icon||'•'}</div><b>${escapeHtml(i.title||'')}</b><small>${escapeHtml(i.text||'')}</small></div>`).join('');
}

function goHub(slug){
  if(!slug){alert('다음 단계에서 연결됩니다.');return}
  history.pushState(null,'',`?hub=${slug}`);
  renderHub(slug);
  window.scrollTo(0,0);
}
function openUrl(url){
  if(!url)return;
  if(url.startsWith('#'))alert('다음 단계에서 연결됩니다.');
  else window.open(url,'_self');
}
function renderHubList(){
  $('hubList').innerHTML=HUBS.map(h=>`<button class="hubItem" data-hub="${h.slug}"><b>${escapeHtml(h.title||'')}</b><span>${escapeHtml(h.year||'')} · ${escapeHtml(h.short||'')}</span></button>`).join('');
}

document.addEventListener('click',e=>{
  const url=e.target.closest('[data-url]');
  if(url&&url.dataset.url){e.preventDefault();$('drawer').classList.remove('show');openUrl(url.dataset.url);return}
  const hub=e.target.closest('[data-hub]');
  if(hub&&hub.dataset.hub){e.preventDefault();$('drawer').classList.remove('show');goHub(hub.dataset.hub);return}
});
$('prevBtn').onclick=()=>current&&current.prev?goHub(current.prev):null;
$('nextBtn').onclick=()=>{if(!current)return;if(current.nextUrl)return openUrl(current.nextUrl);if(current.next)return goHub(current.next)};
$('matrixBtn').onclick=()=>openUrl('../index.html');
$('backBtn').onclick=()=>openUrl('../index.html');
$('hubListBtn').onclick=()=>$('drawer').classList.add('show');
$('drawerClose').onclick=()=>$('drawer').classList.remove('show');
$('drawer').onclick=e=>{if(e.target.id==='drawer')$('drawer').classList.remove('show')};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=flow-fix-20260610').catch(()=>{});
loadData();
