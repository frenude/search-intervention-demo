// ===== State =====
let currentPage='search-dashboard',currentEntity=null,algoResults=[],interventionSlots=[],candidatePool=[];
let selectedBots=new Set(),currentPlan=null,currentStep='edit';
let dashboardSortCol=null,dashboardSortDir=0; // 0=default,1=asc,2=desc
let hotSearchWords=[],trendingWords=[],blacklistWords=[];
let hotSearchPlans=[
  {id:'hsp1',name:'春季动漫角色推广',status:'published',creator:'张三',createdAt:'2026-03-10',updatedAt:'2026-03-15',wordCount:5,reviewStatus:'approved',reviewer:'李四',words:[
    {id:'hs1',text:'Gojo Satoru',region:'global',status:'active',pos:1,reviewStatus:'approved'},
    {id:'hs2',text:'Makima',region:'global',status:'active',pos:2,reviewStatus:'approved'},
    {id:'hs3',text:'Zero Two',region:'en',status:'active',pos:3,reviewStatus:'approved'},
    {id:'hs4',text:'Sukuna',region:'global',status:'active',pos:4,reviewStatus:'approved'},
    {id:'hs5',text:'Yor Forger',region:'global',status:'active',pos:5,reviewStatus:'approved'}]},
  {id:'hsp2',name:'泛需求热搜词优化',status:'experimenting',creator:'王五',createdAt:'2026-03-14',updatedAt:'2026-03-18',wordCount:4,reviewStatus:'approved',reviewer:'张三',words:[
    {id:'hs6',text:'AI Girlfriend',region:'en',status:'active',pos:1,reviewStatus:'approved'},
    {id:'hs7',text:'Horror Chat',region:'en',status:'active',pos:2,reviewStatus:'approved'},
    {id:'hs8',text:'Roleplay',region:'global',status:'active',pos:3,reviewStatus:'approved'},
    {id:'hs9',text:'Love Story',region:'global',status:'active',pos:4,reviewStatus:'pending'}]},
  {id:'hsp3',name:'新番推广计划',status:'draft',creator:'赵六',createdAt:'2026-03-18',updatedAt:'2026-03-18',wordCount:3,reviewStatus:'draft',reviewer:'--',words:[
    {id:'hs10',text:'Chainsaw Man S2',region:'global',status:'active',pos:1,reviewStatus:'draft'},
    {id:'hs11',text:'Spy x Family',region:'global',status:'active',pos:2,reviewStatus:'draft'},
    {id:'hs12',text:'Demon Slayer',region:'en',status:'active',pos:3,reviewStatus:'draft'}]},
  {id:'hsp4',name:'紧急下线-违规词',status:'rolled_back',creator:'张三',createdAt:'2026-03-05',updatedAt:'2026-03-06',wordCount:2,reviewStatus:'approved',reviewer:'李四',words:[]},
];
let trendingPlans=[
  {id:'trp1',name:'热门词-动漫分类',status:'published',creator:'张三',createdAt:'2026-03-08',updatedAt:'2026-03-12',wordCount:6,reviewStatus:'approved',reviewer:'王五',words:[
    {id:'tr1',text:'🔥 Anime',region:'global',status:'active',pos:1,reviewStatus:'approved'},
    {id:'tr2',text:'💬 Roleplay',region:'global',status:'active',pos:2,reviewStatus:'approved'},
    {id:'tr3',text:'❤️ Romance',region:'global',status:'active',pos:3,reviewStatus:'approved'},
    {id:'tr4',text:'🎮 Gaming',region:'en',status:'active',pos:4,reviewStatus:'approved'},
    {id:'tr5',text:'😈 Villain',region:'global',status:'active',pos:5,reviewStatus:'approved'},
    {id:'tr6',text:'🌙 Fantasy',region:'global',status:'active',pos:6,reviewStatus:'approved'}]},
  {id:'trp2',name:'恐怖&剧情标签测试',status:'pending_review',creator:'赵六',createdAt:'2026-03-17',updatedAt:'2026-03-17',wordCount:3,reviewStatus:'pending',reviewer:'--',words:[
    {id:'tr7',text:'💀 Horror',region:'en',status:'active',pos:1,reviewStatus:'pending'},
    {id:'tr8',text:'🎭 Drama',region:'global',status:'active',pos:2,reviewStatus:'pending'},
    {id:'tr9',text:'🗡️ Action',region:'global',status:'active',pos:3,reviewStatus:'pending'}]},
];
let currentEditPlan=null;

// ===== Navigation =====
document.querySelectorAll('.sidebar li').forEach(li=>{li.addEventListener('click',()=>navigateTo(li.dataset.page))});

function navigateTo(page){
  document.querySelectorAll('.sidebar li').forEach(l=>l.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const li=document.querySelector(`[data-page="${page}"]`);
  if(li)li.classList.add('active');
  document.getElementById(`page-${page}`).classList.add('active');
  currentPage=page;
  if(page==='search-dashboard')loadSearchDashboard();
  else if(page==='dashboard')loadDashboard();
  else if(page==='monitor')loadMonitor();
  else if(page==='health')loadHealth();
  else if(page==='hot-search')loadHotSearch();
  else if(page==='trending')loadTrending();
  else if(page==='blacklist')loadBlacklist();
  else if(page==='auto-optimize')loadAutoOptimize();
  else if(page==='hot-search-auto')loadHotSearchAuto();
  else if(page==='trending-auto')loadTrendingAuto();
  // sub-pages (no sidebar highlight change needed)
  if(page==='hot-search-edit'){document.querySelector('[data-page="hot-search"]')?.classList.add('active')}
  if(page==='trending-edit'){document.querySelector('[data-page="trending"]')?.classList.add('active')}
  if(page==='ao-detail'){document.querySelector('[data-page="auto-optimize"]')?.classList.add('active')}
  if(page==='hsa-detail'){document.querySelector('[data-page="hot-search-auto"]')?.classList.add('active')}
  if(page==='tra-detail'){document.querySelector('[data-page="trending-auto"]')?.classList.add('active')}
}
function goBack(){navigateTo('dashboard')}

// ===== Step tabs =====
function switchStep(step){
  currentStep=step;
  if(step==='edit')updateTopActions('edit');
  document.querySelectorAll('.step-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.step-content').forEach(c=>c.classList.remove('active'));
  document.querySelector(`.step-tab[data-step="${step}"]`).classList.add('active');
  document.getElementById(`step-${step}`).classList.add('active');
  if(step==='experiment'){renderExperimentPanel();updateTopActions('experiment')}
  if(step==='publish'){renderPublishPanel();updateTopActions('publish')}
  if(step==='edit')updateTopActions('edit');
}
function goToStep(step){switchStep(step)}

// ===== Dashboard =====
async function loadDashboard(){
  const p=document.getElementById('filter-period').value;
  const t=document.getElementById('filter-type').value;
  const s=document.getElementById('filter-sort').value;
  const kw=document.getElementById('filter-keyword')?.value?.trim()||'';
  const resp=await fetch(`/api/search-terms?period=${p}&entity_type=${t}&sort=${s}`);
  const data=await resp.json();
  let items=data.items;
  if(kw){const lc=kw.toLowerCase();items=items.filter(i=>i.name.toLowerCase().includes(lc)||i.keywords.some(k=>k.toLowerCase().includes(lc)))}
  renderDashboard(items);
}
function renderDashboard(items){
  const c=document.getElementById('dashboard-table');
  const typeMap={character:'角色',work:'作品',actor:'演员',generic:'通用词'};
  const sortCols=['search_volume','search_uv','success_rate','result_rate','click_rate','chat_rate'];
  function sortIcon(col){if(dashboardSortCol!==col)return'';return dashboardSortDir===1?' ↑':' ↓'}
  function thClick(col){return `onclick="toggleDashboardSort('${col}')"`}
  if(dashboardSortCol&&dashboardSortDir>0){
    const dir=dashboardSortDir===1?1:-1;
    items=[...items].sort((a,b)=>{const av=a[dashboardSortCol]||0,bv=b[dashboardSortCol]||0;return(av-bv)*dir});
  }
  const mockOps=['张三','李四','王五','赵六'];
  const mockTimes=['2026-03-18 14:30','2026-03-17 10:15','2026-03-16 09:00','2026-03-15 16:45','--'];
  c.innerHTML=`<table><thead><tr>
    <th>标准实体</th><th>类型</th><th>关联搜索词</th>
    <th ${thClick('search_volume')}>搜索量${sortIcon('search_volume')}</th>
    <th ${thClick('search_uv')}>搜索人数${sortIcon('search_uv')}</th>
    <th ${thClick('success_rate')}>搜索成功率${sortIcon('success_rate')}</th>
    <th ${thClick('result_rate')}>有结果率${sortIcon('result_rate')}</th>
    <th ${thClick('click_rate')}>点击率${sortIcon('click_rate')}</th>
    <th ${thClick('chat_rate')}>开聊率${sortIcon('chat_rate')}</th>
    <th>干预状态</th><th>最新干预</th><th>操作人</th><th>操作</th>
  </tr></thead><tbody>${items.map((item,idx)=>{
    const successPct=(item.success_rate*100).toFixed(1);
    const successClass=parseFloat(successPct)>=90?'rate-green':'rate-red';
    return `<tr>
      <td><strong class="clickable" onclick="openEditor('${item.id}')">${item.name}</strong></td>
      <td><span class="type-tag ${item.type}">${typeMap[item.type]||item.type}</span></td>
      <td style="font-size:12px;color:#666">${item.keywords.slice(0,3).join(', ')}</td>
      <td>${item.search_volume.toLocaleString()}</td>
      <td>${item.search_uv.toLocaleString()}</td>
      <td class="${successClass}">${successPct}%</td>
      <td>${(item.result_rate*100).toFixed(1)}%</td>
      <td>${(item.click_rate*100).toFixed(1)}%</td>
      <td>${(item.chat_rate*100).toFixed(1)}%</td>
      <td><span class="status-tag ${item.intervention_status}">${getStatusText(item.intervention_status)}</span></td>
      <td style="font-size:12px;color:#888">${mockTimes[idx%mockTimes.length]}</td>
      <td style="font-size:12px;color:#888">${item.intervention_status!=='none'?mockOps[idx%mockOps.length]:'--'}</td>
      <td><button class="btn btn-sm" onclick="openEditor('${item.id}')">优化方案</button></td>
    </tr>`}).join('')}</tbody></table>`;
}
function toggleDashboardSort(col){
  if(dashboardSortCol===col){dashboardSortDir=(dashboardSortDir+1)%3;if(dashboardSortDir===0)dashboardSortCol=null}
  else{dashboardSortCol=col;dashboardSortDir=1}
  loadDashboard();
}
function getStatusText(s){return{none:'未干预',draft:'草稿',pending_review:'待审核',approved:'已通过',experimenting:'实验中',published:'已上线',rolled_back:'已回滚',archived:'已归档'}[s]||s}
// ===== Monitor (热搜监控) =====
// --- Cached hot search data ---
let _hsCache={};
async function _ensureHSData(days){
  const key=days+'d';
  if(!_hsCache[key]){
    const resp=await fetch(`/data/hot-search-${key}.json`);
    _hsCache[key]=(await resp.json()).ranking||[];
  }
  return _hsCache[key];
}
function _fmtK(n){if(n>=1000)return (n/1000).toFixed(1)+'k';return String(n);}
async function loadMonitor(){
  const c=document.getElementById('monitor-content');
  const now=new Date().toLocaleString('zh-CN');
  // Load all period data
  let hs1,hs24,hs3;
  try{[hs1,hs24,hs3]=await Promise.all([_ensureHSData(1),_ensureHSData(3),_ensureHSData(7)]);}catch(e){c.innerHTML='<div style="color:#e74c3c;padding:20px">'+e.message+'</div>';return;}
  function toMkw(arr,limit){return (arr||[]).slice(0,limit||20).map(r=>({kw:r.keyword,trend:r.trend,tv:r.trend_value||0,suv:_fmtK(r.search_uv),cuv:_fmtK(r.click_uv),cr:r.search_uv?(r.click_uv/r.search_uv*100).toFixed(1)+'%':'--'}));}
  const mkw={global:toMkw(hs24)};
  const regions=[{id:'global',name:'全球',periods:['1H','24H','3D']}];
  const periodData={'1H':toMkw(hs1),'24H':toMkw(hs24),'3D':toMkw(hs3)};
  function renderRegion(r){
    const cards=r.periods.map(period=>{
      const kws=periodData[period]||toMkw(hs24);
      const rows=kws.map((item,i)=>{
        let trendHtml='';
        if(item.trend==='up')trendHtml=`<span class="trend-up">↑ ${item.tv}</span>`;
        else if(item.trend==='down')trendHtml=`<span class="trend-down">↓ ${item.tv}</span>`;
        else if(item.trend==='new')trendHtml=`<span class="trend-up" style="color:#74b9ff">NEW</span>`;
        else trendHtml=`<span class="trend-same">—</span>`;
        return `<tr><td class="rank">${i+1}</td><td class="keyword">${item.kw}</td><td class="trend">${trendHtml}</td><td class="stats">${item.suv}/${item.cuv}</td><td class="chat-rate">${item.cr}</td></tr>`;
      }).join('');
      return `<div class="monitor-card"><h3>${period}<span class="monitor-card-actions"><button class="btn-text" onclick="showDetailModal('${r.id}','${period}')">查看全部</button><button class="btn-text" onclick="downloadCSV('${r.id}','${period}')">下载</button></span></h3><table class="monitor-table"><thead><tr><th>排序</th><th>热搜词</th><th>排名变化</th><th>搜索人数/点击人数</th><th>搜索成功率</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join('');
    return `<div class="monitor-region"><div class="monitor-region-header"><h2>${r.name}</h2><div class="update-time">最新数据更新时间：${now}</div></div><div class="monitor-cards">${cards}</div></div>`;
  }
  c.innerHTML=regions.map(r=>renderRegion(r)).join('')+renderFilteredRegion(mkw)+renderDetailModule(mkw);
  updateDetailModule();updateFilteredRegion();
}
// Filtered region board
function renderFilteredRegion(mkw){
  return `<div class="monitor-region" id="filtered-region">
    <div class="monitor-region-header"><h2>语区/国家筛选</h2>
      <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
        <select id="fr-region" onchange="updateFilteredRegion()" style="padding:6px 10px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px">
          <option value="en">英语区</option><option value="es">西语区</option><option value="zh">中文区</option></select>
        <select id="fr-country" onchange="updateFilteredRegion()" style="padding:6px 10px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px">
          <option value="all">全部国家</option><option>US</option><option>GB</option><option>MX</option><option>JP</option><option>BR</option><option>IN</option></select>
      </div>
    </div>
    <div class="monitor-cards" id="fr-cards"></div>
  </div>`;
}
function updateFilteredRegion(){
  const region=document.getElementById('fr-region')?.value||'en';
  // Use real data (global only for now, per-region not yet available)
  const kws=_hsCache['3d']||[];
  const cards=['1H','24H','3D'].map(period=>{
    const periodKey={'1H':'1d','24H':'3d','3D':'7d'}[period]||'3d';
    const data=(_hsCache[periodKey]||kws).slice(0,20);
    const rows=data.map((r,i)=>{
      const suv=_fmtK(r.search_uv);const cuv=_fmtK(r.click_uv);const cr=r.search_uv?(r.click_uv/r.search_uv*100).toFixed(1)+'%':'--';
      let trendH='';if(r.trend==='up')trendH=`<span class="trend-up">↑ ${r.trend_value||0}</span>`;else if(r.trend==='down')trendH=`<span class="trend-down">↓ ${r.trend_value||0}</span>`;else if(r.trend==='new')trendH=`<span class="trend-up" style="color:#74b9ff">NEW</span>`;else trendH=`<span class="trend-same">—</span>`;
      return `<tr><td class="rank">${i+1}</td><td class="keyword" style="text-align:center">${r.keyword}</td><td class="trend">${trendH}</td><td class="stats">${suv}/${cuv}</td><td class="chat-rate">${cr}</td></tr>`;
    }).join('');
    return `<div class="monitor-card"><h3>${period}<span class="monitor-card-actions"><button class="btn-text" onclick="showDetailModal('${region}','${period}')">查看全部</button><button class="btn-text" onclick="downloadCSV('${region}','${period}')">下载</button></span></h3><table class="monitor-table"><thead><tr><th>排序</th><th style="text-align:center">热搜词</th><th>排名变化</th><th>搜索人数/点击人数</th><th>搜索成功率</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');
  const el=document.getElementById('fr-cards');
  if(el)el.innerHTML=cards;
}
// Detail module at bottom of monitor
function renderDetailModule(mkw){
  return `<div class="monitor-region" id="detail-module">
    <div class="monitor-region-header"><h2>自定义查询</h2></div>
    <div class="detail-filters">
      <div class="filter-group"><label>语区</label><select id="detail-region" onchange="updateDetailModule()"><option value="global">全球</option><option value="en">英语区</option><option value="es">西语区</option><option value="zh">中文区</option></select></div>
      <div class="filter-group"><label>国家</label><select id="detail-country" onchange="updateDetailModule()"><option value="all">全部</option><option value="US">美国</option><option value="GB">英国</option><option value="MX">墨西哥</option><option value="JP">日本</option><option value="BR">巴西</option><option value="IN">印度</option><option value="DE">德国</option></select></div>
      <div class="filter-group"><label>时间</label><select id="detail-time" onchange="updateDetailModule()"><option value="1H">1H</option><option value="24H" selected>24H</option><option value="3D">3D</option><option value="1W">1 Week</option><option value="1M">1 Month</option></select></div>
    </div>
    <div class="monitor-cards" style="grid-template-columns:1fr"><div class="monitor-card" id="detail-card" style="max-width:100%"></div></div>
  </div>`;
}
function updateDetailModule(){
  const region=document.getElementById('detail-region').value;
  const time=document.getElementById('detail-time').value;
  const card=document.getElementById('detail-card');
  const timeKey={'1H':'1d','24H':'3d','3D':'7d','1W':'7d','1M':'30d'}[time]||'3d';
  const data=(_hsCache[timeKey]||[]).slice(0,20);
  const rows=data.map((r,i)=>{
    const suv=_fmtK(r.search_uv);const cuv=_fmtK(r.click_uv);const cr=r.search_uv?(r.click_uv/r.search_uv*100).toFixed(1)+'%':'--';
    let trendH='';if(r.trend==='up')trendH=`<span class="trend-up">↑ ${r.trend_value||0}</span>`;else if(r.trend==='down')trendH=`<span class="trend-down">↓ ${r.trend_value||0}</span>`;else if(r.trend==='new')trendH=`<span class="trend-up" style="color:#74b9ff">NEW</span>`;else trendH=`<span class="trend-same">—</span>`;
    return `<tr><td class="rank">${i+1}</td><td class="keyword">${r.keyword}</td><td class="trend">${trendH}</td><td class="stats">${suv}/${cuv}</td><td class="chat-rate">${cr}</td></tr>`;
  }).join('');
  card.innerHTML=`<h3>${time}<span class="monitor-card-actions"><button class="btn-text" onclick="showDetailModal('${region}','${time}')">查看全部</button><button class="btn-text" onclick="downloadCSV('${region}','${time}')">下载</button></span></h3><table class="monitor-table"><thead><tr><th>排序</th><th>热搜词</th><th>排名变化</th><th>搜索人数/点击人数</th><th>搜索成功率</th></tr></thead><tbody>${rows}</tbody></table>`;
}
// Detail modal (top 200)
function showDetailModal(region,period){
  document.getElementById('detail-modal').classList.remove('hidden');
  const title=document.getElementById('detail-modal-title');
  const body=document.getElementById('detail-modal-body');
  const regionNames={global:'全球',en:'英语区',es:'西语区',zh:'中文区'};
  title.textContent=`${regionNames[region]||region} - ${period} 热搜词明细`;
  const timeKey={'1H':'1d','24H':'3d','3D':'7d','1W':'7d','1M':'30d'}[period]||'3d';
  const data=(_hsCache[timeKey]||[]).slice(0,200);
  const rows=data.map((r,i)=>{
    const suv=_fmtK(r.search_uv);const cuv=_fmtK(r.click_uv);const cr=r.search_uv?(r.click_uv/r.search_uv*100).toFixed(1)+'%':'--';
    let trendH='';if(r.trend==='up')trendH=`<span class="trend-up">↑ ${r.trend_value||0}</span>`;else if(r.trend==='down')trendH=`<span class="trend-down">↓ ${r.trend_value||0}</span>`;else if(r.trend==='new')trendH=`<span class="trend-up" style="color:#74b9ff">NEW</span>`;else trendH=`<span class="trend-same">—</span>`;
    return `<tr><td style="text-align:center">${i+1}</td><td style="text-align:left">${r.keyword}</td><td style="text-align:center">${trendH}</td><td style="text-align:center">${suv}/${cuv}</td><td style="text-align:center;color:#d4a847;font-weight:600">${cr}</td></tr>`;
  });
  body.innerHTML=`<div class="detail-table-wrap"><table style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr><th>排序</th><th style="text-align:left">热搜词</th><th>排名变化</th><th>搜索人数/点击人数</th><th>搜索成功率</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function closeDetailModal(){document.getElementById('detail-modal').classList.add('hidden')}
function downloadCSV(region,period){
  const regionNames={global:'全球',en:'英语区',es:'西语区',zh:'中文区'};
  const timeKey={'1H':'1d','24H':'3d','3D':'7d','1W':'7d','1M':'30d'}[period]||'3d';
  const data=(_hsCache[timeKey]||[]).slice(0,200);
  let csv='排序,热搜词,排名变化,搜索人数,点击人数,搜索成功率\n';
  data.forEach((r,i)=>{const cr=r.search_uv?(r.click_uv/r.search_uv*100).toFixed(1):'--';csv+=`${i+1},${r.keyword},${r.trend==='new'?'NEW':(r.trend==='up'?'+':r.trend==='down'?'-':'')+String(r.trend_value||0)},${r.search_uv},${r.click_uv},${cr}%\n`;});
  const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${regionNames[region]||region}_${period}_热搜词.csv`;a.click();URL.revokeObjectURL(url);
}
// ===== Editor =====
async function openEditor(entityId){
  const resp=await fetch(`/api/search-terms/${entityId}`);
  currentEntity=await resp.json();
  interventionSlots=[];selectedBots.clear();currentPlan=null;currentStep='edit';
  document.getElementById('editor-title').textContent=`干预方案 — ${currentEntity.name}`;
  document.getElementById('preview-keyword').textContent=currentEntity.keywords[0];
  const recent=currentEntity.metrics.slice(0,7);
  const avgRate=recent.reduce((s,m)=>s+m.chat_rate,0)/recent.length;
  document.getElementById('current-success-rate').textContent=(avgRate*100).toFixed(1)+'%';
  await loadAlgoResults(currentEntity.keywords[0]);
  await loadCandidates(currentEntity.keywords[0]);
  renderSlots();refreshPreview();updateFooterStats();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sidebar li').forEach(l=>l.classList.remove('active'));
  document.getElementById('page-editor').classList.add('active');
  // Reset step tabs
  document.querySelectorAll('.step-tab').forEach(t=>t.classList.remove('active','completed'));
  document.querySelectorAll('.step-content').forEach(c=>c.classList.remove('active'));
  document.querySelector('.step-tab[data-step="edit"]').classList.add('active');
  document.getElementById('step-edit').classList.add('active');
  currentPage='editor';
}
async function loadAlgoResults(kw){
  const resp=await fetch(`/api/bots/search?q=${encodeURIComponent(kw)}&limit=30`);
  const data=await resp.json();algoResults=data.items;renderAlgoResults();
}
function renderAlgoResults(){
  document.getElementById('algo-results').innerHTML=algoResults.map((bot,i)=>`
    <div class="bot-card ${selectedBots.has(bot.id)?'selected':''}" onclick="addBotToSlot('${bot.id}')">
      <div class="bot-rank">${i+1}</div>
      <img class="bot-avatar" src="${bot.avatar||''}" alt="" onerror="this.style.background='#dfe6e9'">
      <div class="bot-info"><div class="bot-name">${escHtml(bot.title)}</div><div class="bot-desc">${escHtml(bot.description||'')}</div>
        <div class="bot-metrics"><span class="bot-metric">CTR ${(bot.ctr*100).toFixed(1)}%</span><span class="bot-metric">CVR ${(bot.cvr*100).toFixed(1)}%</span><span class="bot-metric">CTR×CVR ${(bot.ctr_x_cvr*10000).toFixed(1)}</span></div>
      </div></div>`).join('');
}
async function loadCandidates(kw){
  const resp=await fetch(`/api/bots/search?q=${encodeURIComponent(kw)}&limit=50`);
  const data=await resp.json();candidatePool=data.items;renderCandidates();
}
function renderCandidates(){
  document.getElementById('candidate-list').innerHTML=candidatePool.map(bot=>{
    const isSelected=selectedBots.has(bot.id);
    return `<div class="bot-card ${isSelected?'selected disabled':''}" ${isSelected?'':'onclick="addBotToSlot(\''+bot.id+'\')"'}>
      <img class="bot-avatar" src="${bot.avatar||''}" alt="" onerror="this.style.background='#dfe6e9'">
      <div class="bot-info"><div class="bot-name">${escHtml(bot.title)}</div><div class="bot-desc">${escHtml(bot.description||'')}</div>
        <div class="bot-metrics"><span class="bot-metric">CTR ${(bot.ctr*100).toFixed(1)}%</span><span class="bot-metric">CVR ${(bot.cvr*100).toFixed(1)}%</span><span class="bot-metric">聊天 ${bot.chat_count?.toLocaleString()||0}</span></div>
      </div>
      <div class="bot-actions">${isSelected?'<span style="color:#6c5ce7">✓ 已选</span>':`<button class="btn btn-sm" onclick="event.stopPropagation();addBotToSlot('${bot.id}')">+ 添加</button>`}</div>
    </div>`}).join('');
}
async function searchCandidates(event){
  if(event&&event.key&&event.key!=='Enter')return;
  const q=document.getElementById('candidate-search').value.trim();
  if(!q){await loadCandidates(currentEntity.keywords[0]);return}
  const resp=await fetch(`/api/bots/search?q=${encodeURIComponent(q)}&limit=50`);
  const data=await resp.json();candidatePool=data.items;renderCandidates();
}

// ===== Slots =====
function addSlot(){
  const nextPos=interventionSlots.length===0?1:Math.max(...interventionSlots.map(s=>s.position))+2;
  const start=new Date();const end=new Date();end.setDate(end.getDate()+30);
  interventionSlots.push({position:nextPos,bot:null,start_date:start.toISOString().split('T')[0],end_date:end.toISOString().split('T')[0]});
  renderSlots();
}
function addBotToSlot(botId){
  if(selectedBots.has(botId))return; // prevent duplicate
  const bot=[...algoResults,...candidatePool].find(b=>b.id===botId);
  if(!bot)return;
  let slot=interventionSlots.find(s=>!s.bot);
  if(!slot){addSlot();slot=interventionSlots[interventionSlots.length-1]}
  slot.bot=bot;selectedBots.add(botId);
  renderSlots();renderAlgoResults();renderCandidates();refreshPreview();updateFooterStats();
}
function removeSlot(index){
  const slot=interventionSlots[index];
  if(slot.bot)selectedBots.delete(slot.bot.id);
  interventionSlots.splice(index,1);
  renderSlots();renderAlgoResults();renderCandidates();refreshPreview();updateFooterStats();
}
function updateSlotPosition(index,value){interventionSlots[index].position=parseInt(value)||1;renderSlots();refreshPreview()}

function renderSlots(){
  const c=document.getElementById('intervention-slots');
  if(interventionSlots.length===0){
    c.innerHTML='<div style="text-align:center;padding:20px;color:#999;font-size:13px">点击左栏或候选池中的 bot 添加干预位次</div>';
    document.getElementById('estimated-rate').textContent='--';return;
  }
  const positions=interventionSlots.map(s=>s.position).sort((a,b)=>a-b);
  const ce=new Set();
  for(let i=1;i<positions.length;i++){if(positions[i]-positions[i-1]<2){ce.add(positions[i]);ce.add(positions[i-1])}}
  c.innerHTML=interventionSlots.map((slot,i)=>{
    const hasErr=ce.has(slot.position);
    return `<div class="slot-item ${hasErr?'error':''}">
      <div class="slot-drag">⠿</div>
      <div class="slot-position"><input type="number" value="${slot.position}" min="1" class="${hasErr?'error':''}" onchange="updateSlotPosition(${i},this.value)"></div>
      <div class="slot-bot">${slot.bot?`
        <img class="bot-avatar" src="${slot.bot.avatar||''}" alt="" style="width:32px;height:32px" onerror="this.style.background='#dfe6e9'">
        <div class="bot-info"><div class="bot-name">${escHtml(slot.bot.title)}</div><div class="bot-metrics"><span class="bot-metric">CTR×CVR ${(slot.bot.ctr_x_cvr*10000).toFixed(1)}</span></div></div>
      `:'<span class="slot-bot-placeholder">点击 bot 添加到此位次</span>'}</div>
      <div class="slot-dates"><input type="date" value="${slot.start_date}" onchange="interventionSlots[${i}].start_date=this.value"><span>至</span><input type="date" value="${slot.end_date}" onchange="interventionSlots[${i}].end_date=this.value"></div>
      <div class="slot-remove" onclick="removeSlot(${i})">✕</div>
    </div>`}).join('');
  const wb=interventionSlots.filter(s=>s.bot);
  if(wb.length>0){
    const avg=wb.reduce((s,sl)=>s+sl.bot.ctr_x_cvr,0)/wb.length;
    const cur=parseFloat(document.getElementById('current-success-rate').textContent)/100;
    document.getElementById('estimated-rate').textContent=(Math.min(0.95,cur+avg*wb.length*2)*100).toFixed(1)+'%';
  }
}
// ===== Footer Stats =====
function updateFooterStats(){
  if(!currentEntity)return;
  const m=currentEntity.metrics&&currentEntity.metrics[0];
  const rr=m?(m.result_rate*100).toFixed(1)+'%':'--';
  const clr=m?(m.click_rate*100).toFixed(1)+'%':'--';
  const chr=m?(m.chat_rate*100).toFixed(1)+'%':'--';
  document.getElementById('algo-result-rate').textContent=rr;
  document.getElementById('algo-click-rate').textContent=clr;
  document.getElementById('algo-chat-rate').textContent=chr;
  // Estimated stats for intervention
  const wb=interventionSlots.filter(s=>s.bot);
  if(wb.length>0){
    const boost=wb.length*0.02;
    document.getElementById('est-result-rate').textContent=m?((Math.min(0.99,m.result_rate+boost))*100).toFixed(1)+'%':'--';
    document.getElementById('est-click-rate').textContent=m?((Math.min(0.99,m.click_rate+boost*1.5))*100).toFixed(1)+'%':'--';
    document.getElementById('est-chat-rate').textContent=m?((Math.min(0.99,m.chat_rate+boost*2))*100).toFixed(1)+'%':'--';
  } else {
    document.getElementById('est-result-rate').textContent='--';
    document.getElementById('est-click-rate').textContent='--';
    document.getElementById('est-chat-rate').textContent='--';
  }
}
// ===== Preview =====
function refreshPreview(){
  const final=buildFinalRanking(algoResults,interventionSlots);
  const mockTags={
    'Naruto':['热血','冒険','Original','男朋友'],
    'Gojo':['喜劇','戲劇','JJK','Other'],
    'Makima':['黑暗浪漫','犯罪','Original','配偶'],
    'Zero Two':['浪漫','科幻','DITF','Other'],
    'Sukuna':['黑暗浪漫','犯罪','JJK','配偶'],
    'Levi':['熱血','戲劇','AOT','Other'],
    'Power':['喜劇','犯罪','CSM','Other'],
  };
  const mockAuthors=['Yuri','Five\'s girl','Flore','Emily','Luna','Yashin','Miko','Zero'];
  document.getElementById('mobile-results').innerHTML=final.slice(0,10).map((item,i)=>{
    const author=mockAuthors[i%mockAuthors.length];
    const views=item.uses?(item.uses/1000000).toFixed(1)+'M':((Math.random()*5+0.5).toFixed(1)+'M');
    const name=item.title||'Bot';
    const firstName=name.split(' ')[0]||name;
    const tags=mockTags[firstName]||['浪漫','喜劇','Original','Other'];
    return `<div class="mobile-bot-card ${item.isIntervention?'intervention':''}">
      <img class="mobile-bot-avatar" src="${item.avatar||''}" alt="" onerror="this.style.background='#1a1a1a'">
      <div class="mobile-bot-info">
        <div class="mobile-bot-name">${escHtml(name)}</div>
        <div class="mobile-bot-meta"><span>@ ${escHtml(author)}</span><span class="meta-dot"></span><span>✉ ${views}</span></div>
        <div class="mobile-bot-desc">${escHtml(item.description||'')}</div>
        <div class="mobile-bot-tags">${tags.map(t=>`<span class="mobile-bot-tag${item.isIntervention?' intervention-tag':''}">${t}</span>`).join('')}</div>
      </div>${item.isIntervention?'<div class="mobile-intervention-badge">干预</div>':''}
    </div>`;
  }).join('');
}
function buildFinalRanking(algo,slots){
  let result=algo.map(bot=>({...bot,isIntervention:false}));
  const filled=slots.filter(s=>s.bot).sort((a,b)=>a.position-b.position);
  if(filled.length===0)return result;
  const ids=new Set(filled.map(s=>s.bot.id));
  result=result.filter(bot=>!ids.has(bot.id));
  for(const slot of filled){const pos=slot.position-1;const item={...slot.bot,isIntervention:true};if(pos>=result.length)result.push(item);else result.splice(pos,0,item)}
  return result;
}

// ===== Update top-right buttons per step =====
function updateTopActions(step){
  const el=document.getElementById('editor-top-actions');
  if(step==='edit'){
    el.innerHTML=`<button class="btn btn-outline" onclick="saveDraft()">保存草稿</button><button class="btn btn-primary" onclick="submitAndWaitReview()">提交审核 →</button>`;
  } else if(step==='review_pending'){
    el.innerHTML=`<span style="color:#636e72;font-size:14px">⏳ 等待主管审核中...</span>`;
  } else if(step==='review_approve'){
    el.innerHTML=`<button class="btn btn-success" onclick="approvePlanInline()">✅ 审核通过</button><button class="btn btn-danger" onclick="rejectPlanInline()">❌ 驳回</button>`;
  } else if(step==='experiment'){
    el.innerHTML=`<span style="color:#636e72;font-size:14px">流量实验（V3 版本实现）</span>`;
  } else if(step==='publish'){
    el.innerHTML=`<span style="color:#636e72;font-size:14px">全量发布（V3 版本实现）</span>`;
  }
}

// ===== Review Panel with approval =====
function renderReviewPanel(){
  const filled=interventionSlots.filter(s=>s.bot);
  const isPending=currentPlan&&currentPlan.status==='pending_review';
  document.getElementById('review-panel').innerHTML=`
    <h2 style="margin-bottom:16px">方案审核</h2>
    <div style="display:flex;gap:32px;margin-bottom:24px">
      <div><p style="color:#999;font-size:12px">搜索词</p><p style="font-weight:600;font-size:16px">${currentEntity?.name||'--'}</p></div>
      <div><p style="color:#999;font-size:12px">干预位次数</p><p style="font-weight:600;font-size:16px">${filled.length}</p></div>
      <div><p style="color:#999;font-size:12px">当前搜索成功率</p><p style="font-weight:600;font-size:16px;color:#e74c3c">${document.getElementById('current-success-rate').textContent}</p></div>
      <div><p style="color:#999;font-size:12px">预估成功率</p><p style="font-weight:600;font-size:16px;color:#00b894">${document.getElementById('estimated-rate').textContent} <span style="color:#b2bec3;font-size:11px">仅供参考</span></p></div>
      <div><p style="color:#999;font-size:12px">方案状态</p><p><span class="status-tag ${currentPlan?.status||'draft'}">${getStatusText(currentPlan?.status||'draft')}</span></p></div>
    </div>
    <table style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr style="background:#f8f9fa"><th style="padding:10px;text-align:center">位次</th><th style="padding:10px;text-align:center">Bot 名称</th><th style="padding:10px;text-align:center">CTR×CVR</th><th style="padding:10px;text-align:center">生效时间</th></tr></thead>
    <tbody>${filled.map(s=>`<tr><td style="padding:10px;text-align:center;font-weight:700">#${s.position}</td><td style="padding:10px;text-align:center">${escHtml(s.bot.title)}</td><td style="padding:10px;text-align:center">${(s.bot.ctr_x_cvr*10000).toFixed(1)}</td><td style="padding:10px;text-align:center">${s.start_date} ~ ${s.end_date}</td></tr>`).join('')}</tbody></table>
    ${isPending?`
    <div style="margin-top:24px;padding:20px;background:#f0f9ff;border:1px solid #74b9ff;border-radius:8px">
      <h3 style="margin-bottom:12px">🔍 主管审核</h3>
      <p style="margin-bottom:12px;color:#636e72;font-size:13px">请审核以上干预方案，确认排序和位次设置是否合理。</p>
      <div style="margin-bottom:12px"><label style="font-size:13px;color:#636e72">审核意见（可选）：</label><br><textarea id="approval-comment" rows="3" style="width:100%;margin-top:4px;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px" placeholder="输入审核意见..."></textarea></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-success" onclick="approvePlanInline()">✅ 审核通过</button>
        <button class="btn btn-danger" onclick="rejectPlanInline()">❌ 驳回</button>
      </div>
    </div>`:''}
  `;
}
function renderExperimentPanel(){
  document.getElementById('experiment-panel').innerHTML=`
    <h2 style="margin-bottom:16px;color:#f0f0f0">流量实验</h2>
    <div class="step-placeholder">
      <p style="color:#888">实验状态：<span class="status-tag ${currentPlan?.status||'none'}">${getStatusText(currentPlan?.status||'none')}</span></p>
      <p style="margin-top:8px;color:#666;font-size:13px">此功能将在 V3 版本中与算法团队配合实现</p>
    </div>`;
}
function renderPublishPanel(){
  document.getElementById('publish-panel').innerHTML=`
    <h2 style="margin-bottom:16px;color:#f0f0f0">全量发布</h2>
    <div class="step-placeholder">
      <p style="color:#888">发布状态：<span class="status-tag ${currentPlan?.status||'none'}">${getStatusText(currentPlan?.status||'none')}</span></p>
      <p style="margin-top:8px;color:#666;font-size:13px">此功能将在 V3 版本中实现</p>
    </div>`;
}

// ===== Plan Actions =====
async function saveDraft(){
  const filled=interventionSlots.filter(s=>s.bot);
  if(filled.length===0){alert('请至少添加一个干预位次');return}
  const body={entity_id:currentEntity.id,interventions:filled.map(s=>({position:s.position,bot_id:s.bot.id,bot_name:s.bot.title,bot_avatar:s.bot.avatar,start_date:s.start_date,end_date:s.end_date}))};
  try{
    let resp;
    if(currentPlan){resp=await fetch(`/api/intervention-plans/${currentPlan.plan_id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
    else{resp=await fetch('/api/intervention-plans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
    const result=await resp.json();
    if(result.error){alert('保存失败: '+result.error);return}
    currentPlan=result;alert('✅ 草稿已保存');
  }catch(err){alert('保存失败: '+err.message)}
}
async function submitAndWaitReview(){
  if(!currentPlan){await saveDraft();if(!currentPlan)return}
  const resp=await fetch(`/api/intervention-plans/${currentPlan.plan_id}/submit`,{method:'POST'});
  const result=await resp.json();
  if(result.error){alert('提交失败: '+result.error);return}
  currentPlan=result;
  document.querySelector('.step-tab[data-step="edit"]').classList.add('completed');
  alert('✅ 已提交审核，等待主管审批。审批通过后进入流量实验');
  updateTopActions('review_pending');
}
async function approvePlanInline(){
  if(!currentPlan){alert('暂无方案');return}
  const comment=document.getElementById('approval-comment')?.value||'';
  const resp=await fetch(`/api/intervention-plans/${currentPlan.plan_id}/approve`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comment})});
  currentPlan=await resp.json();
  document.querySelector('.step-tab[data-step="review"]').classList.add('completed');
  alert('✅ 审核已通过');
  renderReviewPanel();
  switchStep('experiment');
}
async function rejectPlanInline(){
  if(!currentPlan){alert('暂无方案');return}
  const reason=prompt('请输入驳回原因:');
  if(!reason)return;
  const resp=await fetch(`/api/intervention-plans/${currentPlan.plan_id}/reject`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});
  currentPlan=await resp.json();
  alert('❌ 已驳回，返回编辑');
  switchStep('edit');
}

// ===== Health =====
function loadHealth(){
  document.getElementById('health-alerts').innerHTML=`
    <div class="alert-item critical"><div class="alert-icon">🔴</div><div class="alert-text"><h4>Bot 已下架 - Naruto 干预方案位次 #3</h4><p>Bot "Naruto Adventure" 已被封禁，干预位次已自动剔除</p></div><div class="alert-time">2 小时前</div></div>
    <div class="alert-item warning"><div class="alert-icon">🟡</div><div class="alert-text"><h4>CTR×CVR 下降 - Gojo Satoru 干预位次 #1</h4><p>Bot "Gojo Sensei" 的 CTR×CVR 下降 35%，建议检查</p></div><div class="alert-time">5 小时前</div></div>
    <div class="alert-item warning"><div class="alert-icon">🟡</div><div class="alert-text"><h4>位次即将过期 - Makima 干预方案</h4><p>位次 #1 和 #3 将在 2 天后过期</p></div><div class="alert-time">1 天前</div></div>
    <div class="alert-item info"><div class="alert-icon">🔵</div><div class="alert-text"><h4>算法更新通知</h4><p>搜索算法 v2.3.1 已上线，建议 review 所有在线方案</p></div><div class="alert-time">3 天前</div></div>`;
}

// ===== Modals =====
function showMappingModal(){
  document.getElementById('mapping-modal').classList.remove('hidden');
  document.getElementById('mapping-body').innerHTML=`
    <p style="color:#636e72;font-size:13px;margin-bottom:12px">管理原始搜索词到标准实体的映射关系。</p>
    <table style="width:100%;font-size:13px"><thead><tr><th style="text-align:center">标准实体</th><th style="text-align:center">原始搜索词</th><th style="text-align:center">匹配类型</th><th style="text-align:center">操作</th></tr></thead>
    <tbody>
      <tr><td style="text-align:center">Naruto</td><td style="text-align:center">naruto</td><td style="text-align:center">精确</td><td style="text-align:center"><a href="#" class="clickable">编辑</a></td></tr>
      <tr><td style="text-align:center">Naruto</td><td style="text-align:center">uzumaki naruto</td><td style="text-align:center">同义词</td><td style="text-align:center"><a href="#" class="clickable">编辑</a></td></tr>
      <tr><td style="text-align:center">Gojo Satoru</td><td style="text-align:center">gojo</td><td style="text-align:center">精确</td><td style="text-align:center"><a href="#" class="clickable">编辑</a></td></tr>
    </tbody></table>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-primary btn-sm">+ 添加映射</button></div>`;
}
function closeMappingModal(){document.getElementById('mapping-modal').classList.add('hidden')}
function escHtml(str){return str?str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

// ===== Search Dashboard (搜索大盘) =====
function updateGranularityFilter(){
  const g=document.getElementById('sd-granularity').value;
  const container=document.getElementById('sd-date-group');
  if(g==='day'){
    container.innerHTML='<input type="date" id="sd-date" value="2026-03-19" style="padding:6px 12px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px">';
  }else if(g==='week'){
    container.innerHTML='<select id="sd-week" style="padding:6px 12px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px"><option>2026-W12 (3/16-3/22)</option><option>2026-W11 (3/9-3/15)</option><option>2026-W10 (3/2-3/8)</option><option>2026-W09 (2/23-3/1)</option></select>';
  }else{
    container.innerHTML='<select id="sd-month" style="padding:6px 12px;border-radius:6px;border:1px solid #333;background:#1a1a1a;color:#e0e0e0;font-size:13px"><option>2026年3月</option><option>2026年2月</option><option>2026年1月</option><option>2025年12月</option></select>';
  }
}
// --- Cached real data ---
let _sdDailyCache=null;
let _sdKpiCache=null;
async function _ensureSDData(){
  if(!_sdDailyCache){
    const [kRes,dRes]=await Promise.all([fetch('/data/kpi.json'),fetch('/data/daily.json')]);
    _sdKpiCache=await kRes.json();
    _sdDailyCache=(await dRes.json()).rows||[];
  }
}
function _fmtNum(n){return n==null?'/':Number(n).toLocaleString()}
function _fmtDelta(cur,prev){if(cur==null||prev==null||prev===0)return{delta:'/',pct:'/',dir:'up'};const d=cur-prev;const pct=((cur/prev)*100).toFixed(1);return{delta:(d>=0?'+':'')+_fmtNum(d),pct:pct+'%',dir:d>=0?'up':'down'};}
async function loadSearchDashboard(){
  if(!document.getElementById('sd-date-group').innerHTML)updateGranularityFilter();
  const g=document.getElementById('sd-granularity').value;
  try{await _ensureSDData();}catch(e){console.error('Failed to load data',e);}
  const cur=_sdKpiCache?.current||{};
  const prev=_sdKpiCache?.previous||{};
  const successRate=cur.total_searches?(cur.clicked_searches/cur.total_searches*100).toFixed(2)+'%':'/';
  const prevSuccessRate=prev.total_searches?(prev.clicked_searches/prev.total_searches*100).toFixed(2)+'%':'/';
  const penRate=cur.dau?(cur.search_uv/cur.dau*100).toFixed(2)+'%':'/';
  const prevPenRate=prev.dau?(prev.search_uv/prev.dau*100).toFixed(2)+'%':'/';
  const d1=_fmtDelta(cur.search_uv,prev.search_uv);
  const d2=_fmtDelta(cur.search_pv,prev.search_pv);
  const d3=_fmtDelta(cur.dau?cur.search_uv/cur.dau:null,prev.dau?prev.search_uv/prev.dau:null);
  const d4=_fmtDelta(cur.click_uv,prev.click_uv);
  const d5=_fmtDelta(cur.click_pv,prev.click_pv);
  const d6=_fmtDelta(cur.total_searches?cur.clicked_searches/cur.total_searches:null,prev.total_searches?prev.clicked_searches/prev.total_searches:null);
  const kpis=[
    {title:'总搜索人数',value:_fmtNum(cur.search_uv),...d1},
    {title:'总搜索次数',value:_fmtNum(cur.search_pv),...d2},
    {title:'搜索渗透率',value:penRate,...d3},
    {title:'总点击人数',value:_fmtNum(cur.click_uv),...d4},
    {title:'总点击次数',value:_fmtNum(cur.click_pv),...d5},
    {title:'搜索成功率',value:successRate,...d6},
  ];
  document.getElementById('sd-kpis').innerHTML=kpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-title"><span>${k.title}</span><span class="info-icon" title="指标说明">ⓘ</span></div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-delta"><span class="${k.dir}">上日 ${k.dir==='up'?'▲':'▼'}${k.delta}</span><span class="${k.dir}">环比 ${k.pct}</span></div>
    </div>`).join('');
  // Build table rows from real daily data
  let rows=[];
  const daily=_sdDailyCache||[];
  const dateLabel=g==='day'?'日期':g==='week'?'周次':'月份';
  if(g==='day'){
    rows=daily.map(d=>{const sr=d.total_searches?(d.clicked_searches/d.total_searches*100).toFixed(0):'--';const pen=d.dau?(d.search_uv/d.dau*100).toFixed(1):'--';const avg=d.search_uv?(d.click_pv/d.search_uv).toFixed(2):'--';return{label:d.date,suv:d.search_uv,stimes:d.search_pv,pen,cuv:d.click_uv,ctimes:d.click_pv,avg,rate:sr};});
  }else if(g==='week'){
    // Aggregate daily into weeks
    const weeks={};daily.forEach(d=>{const dt=new Date(d.date);const wk=`W${String(getISOWeek(dt)).padStart(2,'0')}`;if(!weeks[wk])weeks[wk]={label:wk,search_uv:0,search_pv:0,click_uv:0,click_pv:0,total_searches:0,clicked_searches:0,dau:0,days:0};const w=weeks[wk];w.search_uv+=d.search_uv;w.search_pv+=d.search_pv;w.click_uv+=d.click_uv;w.click_pv+=d.click_pv;w.total_searches+=d.total_searches;w.clicked_searches+=d.clicked_searches;w.dau+=d.dau;w.days++;});
    rows=Object.values(weeks).map(w=>{const sr=w.total_searches?(w.clicked_searches/w.total_searches*100).toFixed(0):'--';const pen=w.dau?(w.search_uv/w.dau*100).toFixed(1):'--';const avg=w.search_uv?(w.click_pv/w.search_uv).toFixed(2):'--';return{label:w.label,suv:w.search_uv,stimes:w.search_pv,pen,cuv:w.click_uv,ctimes:w.click_pv,avg,rate:sr};});
  }else{
    const months={};daily.forEach(d=>{const mk=d.date.slice(0,7);if(!months[mk])months[mk]={label:mk,search_uv:0,search_pv:0,click_uv:0,click_pv:0,total_searches:0,clicked_searches:0,dau:0};const m=months[mk];m.search_uv+=d.search_uv;m.search_pv+=d.search_pv;m.click_uv+=d.click_uv;m.click_pv+=d.click_pv;m.total_searches+=d.total_searches;m.clicked_searches+=d.clicked_searches;m.dau+=d.dau;});
    rows=Object.values(months).map(m=>{const sr=m.total_searches?(m.clicked_searches/m.total_searches*100).toFixed(0):'--';const pen=m.dau?(m.search_uv/m.dau*100).toFixed(1):'--';const avg=m.search_uv?(m.click_pv/m.search_uv).toFixed(2):'--';return{label:m.label,suv:m.search_uv,stimes:m.search_pv,pen,cuv:m.click_uv,ctimes:m.click_pv,avg,rate:sr};});
  }
  document.getElementById('sd-table').innerHTML=`<table><thead><tr>
    <th>${dateLabel}</th><th>搜索人数</th><th>搜索次数</th><th>搜索渗透率</th><th>点击人数</th><th>点击次数</th><th>人均搜索点击量</th><th>搜索成功率</th>
  </tr></thead><tbody>${rows.map(d=>`<tr>
    <td>${d.label}</td><td>${d.suv.toLocaleString()}</td><td>${d.stimes.toLocaleString()}</td><td>${d.pen}%</td>
    <td>${d.cuv.toLocaleString()}</td><td>${d.ctimes.toLocaleString()}</td><td>${d.avg}</td><td>${d.rate}%</td>
  </tr>`).join('')}</tbody></table>`;
}
function getISOWeek(d){const t=new Date(d.valueOf());const day=(t.getDay()+6)%7;t.setDate(t.getDate()-day+3);const first=new Date(t.getFullYear(),0,4);return 1+Math.round(((t.getTime()-first.getTime())/86400000-((first.getDay()+6)%7)+3)/7);}
function exportSearchDashboard(){
  if(!_sdDailyCache){alert('数据尚未加载');return;}
  let csv='日期,搜索人数,搜索次数,搜索渗透率,点击人数,点击次数,人均搜索点击量,搜索成功率\n';
  _sdDailyCache.forEach(d=>{const sr=d.total_searches?(d.clicked_searches/d.total_searches*100).toFixed(1):'--';const pen=d.dau?(d.search_uv/d.dau*100).toFixed(1):'--';const avg=d.search_uv?(d.click_pv/d.search_uv).toFixed(2):'--';csv+=`${d.date},${d.search_uv},${d.search_pv},${pen}%,${d.click_uv},${d.click_pv},${avg},${sr}%\n`;});
  const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='搜索大盘数据.csv';a.click();URL.revokeObjectURL(url);
}

// ===== Hot Search Intervention (热搜词干预) =====
function loadHotSearch(){renderPlanList('hot-search',hotSearchPlans)}
function loadTrending(){renderPlanList('trending',trendingPlans)}
function renderPlanList(type,plans){
  const isHS=type==='hot-search';
  const containerId=isHS?'hot-search-plans':'trending-plans';
  const c=document.getElementById(containerId);
  const statusLabels={draft:'草稿',pending_review:'待审核',published:'已上线',experimenting:'实验中',rolled_back:'已回滚',approved:'已通过'};
  const statusColors={draft:'#888',pending_review:'#d4a847',published:'#00b894',experimenting:'#74b9ff',rolled_back:'#e74c3c',approved:'#00b894'};
  c.innerHTML=`<div class="card"><table><thead><tr>
    <th>计划名称</th><th>状态</th><th>词条数</th><th>创建人</th><th>创建时间</th><th>最后更新</th><th>审核人</th><th>操作</th>
  </tr></thead><tbody>${plans.map(p=>`<tr>
    <td><strong class="clickable" onclick="editPlan('${type}','${p.id}')">${escHtml(p.name)}</strong></td>
    <td><span style="color:${statusColors[p.status]||'#888'};font-weight:600;font-size:12px">${statusLabels[p.status]||p.status}</span></td>
    <td>${p.wordCount}</td>
    <td style="color:#888">${p.creator}</td>
    <td style="color:#888;font-size:12px">${p.createdAt}</td>
    <td style="color:#888;font-size:12px">${p.updatedAt}</td>
    <td style="color:#888">${p.reviewer}</td>
    <td>
      <button class="btn-text" onclick="editPlan('${type}','${p.id}')">编辑</button>
      ${p.status==='draft'?`<button class="btn-text" style="color:#00b894" onclick="submitPlanForReview('${type}','${p.id}')">提交审核</button>`:''}
      ${p.status==='pending_review'?`<button class="btn-text" style="color:#00b894" onclick="approvePlanReview('${type}','${p.id}')">通过</button><button class="btn-text" style="color:#e74c3c" onclick="rejectPlanReview('${type}','${p.id}')">驳回</button>`:''}
      ${p.status==='published'?`<button class="btn-text" style="color:#e74c3c" onclick="rollbackPlanReview('${type}','${p.id}')">下线</button>`:''}
      <button class="btn-text" style="color:#e74c3c" onclick="deletePlan('${type}','${p.id}')">删除</button>
    </td>
  </tr>`).join('')}</tbody></table></div>`;
}
function createHotSearchPlan(){
  const name=prompt('请输入计划名称:');if(!name)return;
  // Pre-fill with current online words from published plans
  const existingWords=[];
  hotSearchPlans.filter(p=>p.status==='published').forEach(p=>{
    p.words.forEach(w=>{if(!existingWords.find(e=>e.text===w.text)){existingWords.push({...w,id:'hs'+Date.now()+Math.random().toString(36).slice(2,6),reviewStatus:'draft'})}});
  });
  const plan={id:'hsp'+Date.now(),name,status:'draft',creator:'当前用户',createdAt:new Date().toISOString().split('T')[0],updatedAt:new Date().toISOString().split('T')[0],wordCount:existingWords.length,reviewStatus:'draft',reviewer:'--',words:existingWords};
  hotSearchPlans.unshift(plan);
  editPlan('hot-search',plan.id);
}
function createTrendingPlan(){
  const name=prompt('请输入计划名称:');if(!name)return;
  // Pre-fill with current online words from published plans
  const existingWords=[];
  trendingPlans.filter(p=>p.status==='published').forEach(p=>{
    p.words.forEach(w=>{if(!existingWords.find(e=>e.text===w.text)){existingWords.push({...w,id:'tr'+Date.now()+Math.random().toString(36).slice(2,6),reviewStatus:'draft'})}});
  });
  const plan={id:'trp'+Date.now(),name,status:'draft',creator:'当前用户',createdAt:new Date().toISOString().split('T')[0],updatedAt:new Date().toISOString().split('T')[0],wordCount:existingWords.length,reviewStatus:'draft',reviewer:'--',words:existingWords};
  trendingPlans.unshift(plan);
  editPlan('trending',plan.id);
}
function editPlan(type,planId){
  const plans=type==='hot-search'?hotSearchPlans:trendingPlans;
  const plan=plans.find(p=>p.id===planId);if(!plan)return;
  currentEditPlan=plan;
  hotSearchWords=plan.words;
  trendingWords=plan.words;
  const pageName=type==='hot-search'?'hot-search-edit':'trending-edit';
  const titleEl=type==='hot-search'?'hs-edit-title':'tr-edit-title';
  navigateTo(pageName);
  document.getElementById(titleEl).textContent=`${plan.name}`;
  renderWordEditor(type==='hot-search'?'hot-search-editor':'trending-editor',plan.words,type);
}
function saveHsPlan(){if(currentEditPlan){currentEditPlan.wordCount=hotSearchWords.length;currentEditPlan.updatedAt=new Date().toISOString().split('T')[0];currentEditPlan.words=hotSearchWords;alert('计划已保存')}}
function saveTrPlan(){if(currentEditPlan){currentEditPlan.wordCount=trendingWords.length;currentEditPlan.updatedAt=new Date().toISOString().split('T')[0];currentEditPlan.words=trendingWords;alert('计划已保存')}}
function submitHsPlan(){if(currentEditPlan){saveHsPlan();currentEditPlan.status='pending_review';currentEditPlan.reviewStatus='pending';alert('已提交审核');navigateTo('hot-search')}}
function submitTrPlan(){if(currentEditPlan){saveTrPlan();currentEditPlan.status='pending_review';currentEditPlan.reviewStatus='pending';alert('已提交审核');navigateTo('trending')}}
function submitPlanForReview(type,planId){
  const plans=type==='hot-search'?hotSearchPlans:trendingPlans;
  const p=plans.find(x=>x.id===planId);if(!p)return;
  p.status='pending_review';p.reviewStatus='pending';p.updatedAt=new Date().toISOString().split('T')[0];
  alert(`「${p.name}」已提交审核`);
  type==='hot-search'?loadHotSearch():loadTrending();
}
function approvePlanReview(type,planId){
  const plans=type==='hot-search'?hotSearchPlans:trendingPlans;
  const p=plans.find(x=>x.id===planId);if(!p)return;
  p.status='published';p.reviewStatus='approved';p.reviewer='当前用户';p.updatedAt=new Date().toISOString().split('T')[0];
  alert(`「${p.name}」审核通过，已上线`);
  type==='hot-search'?loadHotSearch():loadTrending();
}
function rejectPlanReview(type,planId){
  const reason=prompt('请输入驳回原因:');if(!reason)return;
  const plans=type==='hot-search'?hotSearchPlans:trendingPlans;
  const p=plans.find(x=>x.id===planId);if(!p)return;
  p.status='draft';p.reviewStatus='rejected';p.updatedAt=new Date().toISOString().split('T')[0];
  alert(`「${p.name}」已驳回: ${reason}`);
  type==='hot-search'?loadHotSearch():loadTrending();
}
function rollbackPlanReview(type,planId){
  if(!confirm('确认下线该计划？'))return;
  const plans=type==='hot-search'?hotSearchPlans:trendingPlans;
  const p=plans.find(x=>x.id===planId);if(!p)return;
  p.status='rolled_back';p.updatedAt=new Date().toISOString().split('T')[0];
  alert(`「${p.name}」已下线`);
  type==='hot-search'?loadHotSearch():loadTrending();
}
function deletePlan(type,planId){
  if(!confirm('确认删除该计划？'))return;
  if(type==='hot-search')hotSearchPlans=hotSearchPlans.filter(p=>p.id!==planId);
  else trendingPlans=trendingPlans.filter(p=>p.id!==planId);
  type==='hot-search'?loadHotSearch():loadTrending();
}
function renderWordEditor(containerId,words,type){
  const c=document.getElementById(containerId);
  const activeWords=words.filter(w=>w.status==='active');
  const isHotSearch=type==='hot-search';
  const reviewLabels={draft:'草稿',pending:'待审核',approved:'已通过',rejected:'已驳回'};
  const reviewColors={draft:'#888',pending:'#d4a847',approved:'#00b894',rejected:'#e74c3c'};
  const pendingCount=words.filter(w=>w.reviewStatus==='pending').length;
  const draftCount=words.filter(w=>w.reviewStatus==='draft').length;
  c.innerHTML=`<div class="word-editor">
    <div class="word-col">
      <div class="col-header"><h3>📋 ${isHotSearch?'热搜词列表':'热门词列表'}</h3><span style="font-size:12px;color:#888">${words.length} 个词条</span></div>
      ${pendingCount>0?`<div style="padding:8px 16px;background:rgba(212,168,71,0.08);border-bottom:1px solid #222;font-size:12px;color:#d4a847">⏳ ${pendingCount} 个词条待审核</div>`:''}
      <div class="word-list">${words.map((w,i)=>`
        <div class="word-item ${w.reviewStatus==='pending'?'word-pending':''}" onclick="selectWord('${type}','${w.id}')">
          <span style="color:#555;cursor:grab">⠿</span>
          <span style="color:#888;font-size:12px;width:24px">${i+1}</span>
          <span class="word-text">${escHtml(w.text)}</span>
          <span style="font-size:11px;color:#666">${w.region}</span>
          <span class="word-status ${w.status}">${w.status==='active'?'在线':'已禁用'}</span>
          <span style="font-size:10px;padding:2px 6px;border-radius:3px;background:${reviewColors[w.reviewStatus]||'#888'}22;color:${reviewColors[w.reviewStatus]||'#888'}">${reviewLabels[w.reviewStatus]||w.reviewStatus}</span>
          <div class="word-actions">
            ${w.reviewStatus==='draft'?`<button class="btn-text" style="font-size:11px;color:#d4a847" onclick="event.stopPropagation();submitWordForReview('${type}','${w.id}')">提交审核</button>`:''}
            ${w.reviewStatus==='pending'?`<button class="btn-text" style="font-size:11px;color:#00b894" onclick="event.stopPropagation();approveWord('${type}','${w.id}')">通过</button><button class="btn-text" style="font-size:11px;color:#e74c3c" onclick="event.stopPropagation();rejectWord('${type}','${w.id}')">驳回</button>`:''}
            <button class="btn-text" style="font-size:11px" onclick="event.stopPropagation();toggleWordStatus('${type}','${w.id}')">${w.status==='active'?'禁用':'启用'}</button>
            <button class="btn-text" style="font-size:11px;color:#e74c3c" onclick="event.stopPropagation();deleteWord('${type}','${w.id}')">删除</button>
          </div>
        </div>`).join('')}</div>
      <div class="word-add-form">
        <input type="text" id="${type}-new-word" placeholder="输入新${isHotSearch?'热搜词':'热门词'}...">
        <button class="btn btn-sm" onclick="addWord('${type}')">添加</button>
      </div>
    </div>
    <div class="word-col">
      <div class="col-header"><h3>⚙️ 投放配置</h3></div>
      <div style="padding:16px;color:#666;font-size:13px;flex:1;overflow-y:auto" id="${type}-config">
        <p style="text-align:center;padding:40px 0;color:#555">← 点击左侧词条查看配置</p>
      </div>
    </div>
    <div class="word-col">
      <div class="col-header"><h3>📱 移动端预览</h3></div>
      <div class="mobile-preview-container" style="padding:12px">
        <div class="mobile-frame" style="width:100%;max-width:320px;min-height:480px">
          <div class="mobile-notch"></div>
          ${isHotSearch?`
            <div class="mobile-search-bar" style="position:relative;overflow:hidden">
              <span class="search-icon">🔍</span>
              <span id="${type}-scroll-text" class="search-text" style="animation:scrollText 8s linear infinite">${activeWords.map(w=>w.text).join('  ·  ')}</span>
            </div>
            <div style="padding:8px;color:#555;font-size:11px;text-align:center">搜索栏滚动热搜词预览</div>
          `:`
            <div class="mobile-search-bar"><span class="search-icon">🔍</span><span class="search-text" style="color:#666">搜索...</span></div>
            <div class="word-preview-scroll" style="padding:8px">
              <div style="display:flex;flex-wrap:wrap;gap:6px">${activeWords.map(w=>`<span class="mobile-bot-tag" style="font-size:12px;padding:6px 12px">${escHtml(w.text)}</span>`).join('')}</div>
            </div>
            <div style="padding:8px;color:#555;font-size:11px;text-align:center">搜索栏下方热门词预览</div>
          `}
          <div class="mobile-home-bar"></div>
        </div>
      </div>
    </div>
  </div>`;
}
function selectWord(type,wordId){
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const w=words.find(x=>x.id===wordId);
  if(!w)return;
  const cfg=document.getElementById(`${type}-config`);
  cfg.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:16px;padding:4px">
      <h4 style="color:#d4a847;font-size:16px">"${escHtml(w.text)}"</h4>
      <div><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">⏰ 生效时间</label>
        <label style="font-size:13px;color:#ccc"><input type="radio" name="${type}-time" checked> 马上开始</label>
        <label style="font-size:13px;color:#ccc;margin-left:12px"><input type="radio" name="${type}-time"> 自定义时间</label></div>
      <div><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">📍 位次</label>
        <label style="font-size:13px;color:#ccc"><input type="radio" name="${type}-pos" checked> 指定位次</label>
        <select style="margin-left:8px;padding:4px 8px;background:#1a1a1a;border:1px solid #333;color:#e0e0e0;border-radius:4px;font-size:12px">
          ${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${n===w.pos?'selected':''}>${n}</option>`).join('')}
        </select>
        <label style="font-size:13px;color:#ccc;margin-left:12px"><input type="radio" name="${type}-pos"> 随机位次</label></div>
      <div><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">👥 人群圈选</label>
        <div style="display:flex;gap:12px;margin-bottom:8px">
          <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-user" checked> 全部用户</label>
          <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-user"> 新用户</label>
          <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-user"> 老用户</label>
        </div>
        <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#888;width:40px">性别</span>
            <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-gender" checked> 全部</label>
            <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-gender"> 男</label>
            <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-gender"> 女</label></div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#888;width:40px">地区</span>
            <select style="padding:4px 8px;background:#1a1a1a;border:1px solid #333;color:#e0e0e0;border-radius:4px;font-size:11px"><option>全部大洲</option><option>北美</option><option>南美</option><option>欧洲</option><option>亚洲</option></select>
            <select style="padding:4px 8px;background:#1a1a1a;border:1px solid #333;color:#e0e0e0;border-radius:4px;font-size:11px"><option>全部国家</option><option>US</option><option>GB</option><option>MX</option><option>JP</option></select></div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#888;width:40px">语言</span>
            <select style="padding:4px 8px;background:#1a1a1a;border:1px solid #333;color:#e0e0e0;border-radius:4px;font-size:11px"><option>全部语区</option><option>英语区</option><option>西语区</option><option>中文区</option></select></div>
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:#888;width:40px">年龄</span>
            <label style="font-size:11px;color:#ccc"><input type="checkbox" checked> 17以下</label>
            <label style="font-size:11px;color:#ccc"><input type="checkbox" checked> 17-24</label>
            <label style="font-size:11px;color:#ccc"><input type="checkbox" checked> 25-32</label>
            <label style="font-size:11px;color:#ccc"><input type="checkbox"> 33+</label></div>
        </div></div>
      <div><label style="font-size:12px;color:#888;display:block;margin-bottom:4px">📱 生效设备</label>
        <label style="font-size:12px;color:#ccc"><input type="radio" name="${type}-device" checked> 全部</label>
        <label style="font-size:12px;color:#ccc;margin-left:8px"><input type="radio" name="${type}-device"> iOS</label>
        <label style="font-size:12px;color:#ccc;margin-left:8px"><input type="radio" name="${type}-device"> Android</label></div>
      <div style="padding:8px;background:rgba(0,184,148,0.08);border:1px solid rgba(0,184,148,0.3);border-radius:6px;font-size:12px;color:#00b894">🚫 黑名单检查: ✅ 未命中</div>
    </div>`;
}
function toggleWordStatus(type,wordId){
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const w=words.find(x=>x.id===wordId);
  if(w)w.status=w.status==='active'?'blocked':'active';
  if(type==='hot-search')loadHotSearch();else loadTrending();
}
function deleteWord(type,wordId){
  if(!confirm('确认删除？'))return;
  if(type==='hot-search')hotSearchWords=hotSearchWords.filter(w=>w.id!==wordId);
  else trendingWords=trendingWords.filter(w=>w.id!==wordId);
  if(type==='hot-search')loadHotSearch();else loadTrending();
}
function addWord(type){
  const input=document.getElementById(`${type}-new-word`);
  const text=input.value.trim();if(!text)return;
  // Check blacklist
  const hit=blacklistWords.find(b=>b.matchType==='exact'?text.toLowerCase()===b.word.toLowerCase():text.toLowerCase().includes(b.word.toLowerCase()));
  if(hit){alert(`⚠️ 该词命中黑名单（${hit.matchType==='exact'?'精确':'模糊'}匹配：${hit.word}），需人工审核后才能上线`);return}
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const id=type.replace('-','')+Date.now();
  words.push({id,text,region:'global',status:'active',pos:words.length+1,reviewStatus:'draft'});
  input.value='';
  if(type==='hot-search')loadHotSearch();else loadTrending();
}
function submitWordForReview(type,wordId){
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const w=words.find(x=>x.id===wordId);
  if(w){w.reviewStatus='pending';alert(`"${w.text}" 已提交审核`)}
  if(type==='hot-search')loadHotSearch();else loadTrending();
}
function approveWord(type,wordId){
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const w=words.find(x=>x.id===wordId);
  if(w){w.reviewStatus='approved';w.status='active';alert(`"${w.text}" 审核通过，已上线`)}
  if(type==='hot-search')loadHotSearch();else loadTrending();
}
function rejectWord(type,wordId){
  const reason=prompt('请输入驳回原因:');
  if(reason===null)return;
  const words=type==='hot-search'?hotSearchWords:trendingWords;
  const w=words.find(x=>x.id===wordId);
  if(w){w.reviewStatus='rejected';w.status='blocked';alert(`"${w.text}" 已驳回: ${reason}`)}
  if(type==='hot-search')loadHotSearch();else loadTrending();
}

// ===== Auto Optimize (自动优化) =====
const aoData=[
  {id:'ao1',kw:'Gojo Satoru',type:'character',volume:'12.5k',baseline:71.2,current:87.3,diagnosis:'排序不优',status:'experimenting',round:3,experiments:[
    {round:1,period:'3/1-3/7',control:71.2,winner:78.4,lift:7.2,p:0.003,status:'published'},
    {round:2,period:'3/8-3/14',control:78.4,winner:84.1,lift:5.7,p:0.012,status:'published'},
    {round:3,period:'3/15-',control:84.1,winner:87.3,lift:3.2,p:0.08,status:'running'}]},
  {id:'ao2',kw:'girlfriend',type:'generic',volume:'8.2k',baseline:83.5,current:96.1,diagnosis:'--',status:'graduated',round:0,experiments:[
    {round:1,period:'2/20-2/26',control:83.5,winner:89.2,lift:5.7,p:0.008,status:'published'},
    {round:2,period:'2/27-3/5',control:89.2,winner:94.8,lift:5.6,p:0.004,status:'published'},
    {round:3,period:'3/6-3/12',control:94.8,winner:96.1,lift:1.3,p:0.12,status:'published'}]},
  {id:'ao3',kw:'Makima',type:'character',volume:'6.8k',baseline:42.1,current:42.1,diagnosis:'供给不足',status:'supply',round:0,experiments:[]},
  {id:'ao4',kw:'sexy chat',type:'generic',volume:'5.1k',baseline:55.3,current:68.9,diagnosis:'排序不优',status:'experimenting',round:2,experiments:[
    {round:1,period:'3/5-3/11',control:55.3,winner:63.2,lift:7.9,p:0.001,status:'published'},
    {round:2,period:'3/12-',control:63.2,winner:68.9,lift:5.7,p:0.03,status:'running'}]},
  {id:'ao5',kw:'Zero Two',type:'character',volume:'4.5k',baseline:62.8,current:78.4,diagnosis:'排序不优',status:'experimenting',round:2,experiments:[
    {round:1,period:'3/3-3/9',control:62.8,winner:71.5,lift:8.7,p:0.002,status:'published'},
    {round:2,period:'3/10-',control:71.5,winner:78.4,lift:6.9,p:0.01,status:'running'}]},
  {id:'ao6',kw:'roleplay',type:'generic',volume:'7.3k',baseline:78.1,current:95.3,diagnosis:'--',status:'graduated',round:0,experiments:[
    {round:1,period:'2/25-3/3',control:78.1,winner:86.4,lift:8.3,p:0.001,status:'published'},
    {round:2,period:'3/4-3/10',control:86.4,winner:95.3,lift:8.9,p:0.001,status:'published'}]},
  {id:'ao7',kw:'Naruto',type:'work',volume:'9.1k',baseline:74.5,current:74.5,diagnosis:'供给质量差',status:'supply',round:0,experiments:[]},
  {id:'ao8',kw:'AI boyfriend',type:'generic',volume:'3.9k',baseline:66.7,current:82.5,diagnosis:'排序不优',status:'experimenting',round:2,experiments:[
    {round:1,period:'3/2-3/8',control:66.7,winner:75.3,lift:8.6,p:0.005,status:'published'},
    {round:2,period:'3/9-',control:75.3,winner:82.5,lift:7.2,p:0.02,status:'running'}]},
  {id:'ao9',kw:'love story',type:'generic',volume:'2.8k',baseline:58.2,current:58.2,diagnosis:'体验差',status:'experimenting',round:1,experiments:[
    {round:1,period:'3/15-',control:58.2,winner:61.4,lift:3.2,p:0.15,status:'running'}]},
  {id:'ao10',kw:'horror game',type:'generic',volume:'3.2k',baseline:45.6,current:45.6,diagnosis:'供给不足',status:'diagnosing',round:0,experiments:[]},
  {id:'ao11',kw:'Sukuna',type:'character',volume:'5.5k',baseline:69.3,current:88.7,diagnosis:'排序不优',status:'experimenting',round:3,experiments:[
    {round:1,period:'2/28-3/6',control:69.3,winner:76.8,lift:7.5,p:0.004,status:'published'},
    {round:2,period:'3/7-3/13',control:76.8,winner:84.2,lift:7.4,p:0.003,status:'published'},
    {round:3,period:'3/14-',control:84.2,winner:88.7,lift:4.5,p:0.04,status:'running'}]},
  {id:'ao12',kw:'vampire',type:'generic',volume:'2.1k',baseline:51.3,current:51.3,diagnosis:'排序不优',status:'diagnosing',round:0,experiments:[]},
];
function loadAutoOptimize(){
  const statusFilter=document.getElementById('ao-filter-status')?.value||'all';
  const typeFilter=document.getElementById('ao-filter-type')?.value||'all';
  const timeRange=document.getElementById('ao-time-range')?.value||'30d';
  const timeLabels={'7d':'近7天','14d':'近14天','30d':'近30天','90d':'近90天','all':'全部时间'};
  let items=aoData.filter(d=>(statusFilter==='all'||d.status===statusFilter)&&(typeFilter==='all'||d.type===typeFilter));
  // KPIs scoped to time range
  const graduated=aoData.filter(d=>d.status==='graduated').length;
  const experimenting=aoData.filter(d=>d.status==='experimenting').length;
  const supply=aoData.filter(d=>d.status==='supply').length;
  const diagnosing=aoData.filter(d=>d.status==='diagnosing').length;
  const avgLift=aoData.filter(d=>d.current>d.baseline).reduce((s,d)=>s+(d.current-d.baseline),0)/Math.max(1,aoData.filter(d=>d.current>d.baseline).length);
  document.getElementById('ao-kpis').innerHTML=`<div style="grid-column:1/-1;font-size:12px;color:#666;margin-bottom:-8px">统计周期：${timeLabels[timeRange]}</div>`+[
    {t:'覆盖搜索词',v:aoData.length,c:'#f0f0f0'},
    {t:`${timeLabels[timeRange]}毕业 ✅`,v:`${graduated} (${(graduated/aoData.length*100).toFixed(0)}%)`,c:'#00b894'},
    {t:'实验中',v:experimenting,c:'#d4a847'},
    {t:'补供给中',v:supply,c:'#74b9ff'},
    {t:'待诊断',v:diagnosing,c:'#e74c3c'},
    {t:`${timeLabels[timeRange]}平均提升`,v:`+${avgLift.toFixed(1)}pp`,c:'#00b894'}
  ].map(k=>`<div class="kpi-card"><div class="kpi-title">${k.t}</div><div class="kpi-value" style="color:${k.c}">${k.v}</div></div>`).join('');
  // Table
  const statusLabels={graduated:'✅ 已毕业',experimenting:'🧪 实验中',supply:'📦 补供给中',diagnosing:'🔍 待诊断'};
  const statusColors={graduated:'#00b894',experimenting:'#d4a847',supply:'#74b9ff',diagnosing:'#e74c3c'};
  const typeLabels={character:'角色',work:'作品',generic:'泛需求'};
  document.getElementById('ao-table').innerHTML=`<table><thead><tr>
    <th>搜索词</th><th>类型</th><th>搜索量</th><th>基线成功率</th><th>当前成功率</th><th>提升</th><th>诊断</th><th>状态</th><th>当前轮次</th><th>操作</th>
  </tr></thead><tbody>${items.map(d=>{
    const lift=d.current-d.baseline;
    const liftStr=lift>0?`<span style="color:#00b894">+${lift.toFixed(1)}pp</span>`:(lift<0?`<span style="color:#e74c3c">${lift.toFixed(1)}pp</span>`:'--');
    const currentClass=d.current>=95?'rate-green':(d.current<60?'rate-red':'');
    return `<tr>
      <td><strong class="clickable" onclick="openAoDetail('${d.id}')">${d.kw}</strong></td>
      <td><span class="type-tag ${d.type}">${typeLabels[d.type]}</span></td>
      <td>${d.volume}</td>
      <td>${d.baseline.toFixed(1)}%</td>
      <td class="${currentClass}" style="font-weight:600">${d.current.toFixed(1)}%</td>
      <td>${liftStr}</td>
      <td style="font-size:12px;color:#888">${d.diagnosis}</td>
      <td><span style="color:${statusColors[d.status]};font-weight:600;font-size:12px">${statusLabels[d.status]}</span></td>
      <td>${d.round>0?'R'+d.round:'--'}</td>
      <td><button class="btn btn-sm" onclick="openAoDetail('${d.id}')">详情</button>${d.status==='experimenting'?` <button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="rollbackAo('${d.id}')">回滚</button>`:''}</td>
    </tr>`}).join('')}</tbody></table>`;
}
function openAoDetail(id){
  const d=aoData.find(x=>x.id===id);if(!d)return;
  navigateTo('ao-detail');
  document.getElementById('ao-detail-title').textContent=`${d.kw} — 自动优化详情`;
  document.getElementById('ao-detail-actions').innerHTML=`
    <button class="btn btn-outline" onclick="navigateTo('auto-optimize')">← 返回</button>
    ${d.status==='experimenting'?`<button class="btn btn-outline" onclick="rollbackAo('${d.id}')">回滚</button><button class="btn btn-outline" onclick="pauseAo('${d.id}')">暂停实验</button>`:''}`;
  const gap=95-d.current;
  const gapStr=gap>0?`还差 ${gap.toFixed(1)}pp`:'已达标 ✅';
  const expRows=d.experiments.map(e=>`<tr>
    <td style="font-weight:600">R${e.round}</td><td>${e.period}</td><td>${e.control.toFixed(1)}%</td><td style="color:#00b894;font-weight:600">${e.winner.toFixed(1)}%</td>
    <td><span style="color:#00b894">+${e.lift.toFixed(1)}pp</span></td><td>${e.p.toFixed(3)}</td>
    <td><span style="color:${e.status==='running'?'#d4a847':'#00b894'}">${e.status==='running'?'进行中':'已发布'}</span></td>
  </tr>`).join('');
  const trendPoints=[{label:'基线',val:d.baseline}];
  d.experiments.filter(e=>e.status==='published').forEach(e=>{trendPoints.push({label:`R${e.round}胜出`,val:e.winner})});
  if(d.experiments.find(e=>e.status==='running')){const r=d.experiments.find(e=>e.status==='running');trendPoints.push({label:`R${r.round}进行中`,val:r.winner})}
  const trendBar=trendPoints.map(p=>{
    const pct=Math.max(5,((p.val-30)/70)*100);const color=p.val>=95?'#00b894':'#d4a847';
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <span style="width:80px;text-align:right;font-size:12px;color:#888">${p.label}</span>
      <div style="flex:1;background:#1a1a1a;border-radius:4px;height:28px;position:relative;overflow:hidden">
        <div style="width:${pct}%;background:${color};height:100%;border-radius:4px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px">
          <span style="font-size:12px;font-weight:600;color:#111">${p.val.toFixed(1)}%</span></div></div></div>`}).join('');
  const logs=[];
  logs.push(`首次诊断 → ${d.diagnosis}（基线 ${d.baseline}%）`);
  d.experiments.filter(e=>e.status==='published').forEach(e=>{logs.push(`R${e.round} 实验胜出，${e.control.toFixed(1)}% → ${e.winner.toFixed(1)}%，自动进入下一轮`)});
  const runningExp=d.experiments.find(e=>e.status==='running');
  if(runningExp)logs.push(`R${runningExp.round} 实验启动中`);
  if(d.status==='graduated')logs.push(`搜索成功率达 ${d.current.toFixed(1)}% ≥ 95%，已毕业 ✅`);
  if(d.status==='supply')logs.push(`供给不足，已触发定向生产任务`);

  const resultCount=d.status==='supply'?Math.floor(Math.random()*6+2):Math.floor(Math.random()*40+15);
  const relatedCount=resultCount+Math.floor(Math.random()*20+5);

  // Generate mock bot data for supply and preview
  const mockBotNames=['Gojo RP','Makima Dark','Zero Two Love','Sukuna Curse','Naruto Sage','Chainsaw Devil','Spy Family','Demon Blade','Yor Assassin','Levi Captain','Anime GF','Horror Doll','Vampire Lord','Fantasy Quest','School Romance'];
  const mockAuthors=['@anime_creator','@bot_studio','@rp_master','@ai_forge','@char_lab'];
  const existingBots=Array.from({length:resultCount},(_,i)=>({
    name:i<mockBotNames.length?`${d.kw} - ${mockBotNames[i]}`:`${d.kw} Bot #${i+1}`,
    author:mockAuthors[i%mockAuthors.length],
    ctr:(Math.random()*15+3).toFixed(1),
    chatRate:(Math.random()*30+20).toFixed(1),
    msgs:Math.floor(Math.random()*50000+1000),
    isNew:false
  }));
  // Generated bots (for supply scenarios)
  const generatedBots=d.status==='supply'||d.diagnosis==='供给不足'||d.diagnosis==='供给质量差'?[
    {name:`${d.kw} - AI Generated #1`,author:'🤖 AI生产',ctr:'--',chatRate:'--',msgs:0,isNew:true,genStatus:'已生成',genDate:'2026-03-18'},
    {name:`${d.kw} - AI Generated #2`,author:'🤖 AI生产',ctr:'--',chatRate:'--',msgs:0,isNew:true,genStatus:'已生成',genDate:'2026-03-18'},
    {name:`${d.kw} - AI Generated #3`,author:'🤖 AI生产',ctr:'--',chatRate:'--',msgs:0,isNew:true,genStatus:'审核中',genDate:'2026-03-19'},
    {name:`${d.kw} - AI Generated #4`,author:'🤖 AI生产',ctr:'--',chatRate:'--',msgs:0,isNew:true,genStatus:'待生产',genDate:'--'},
    {name:`${d.kw} - AI Generated #5`,author:'🤖 AI生产',ctr:'--',chatRate:'--',msgs:0,isNew:true,genStatus:'待生产',genDate:'--'},
  ]:[];
  const genStatusColors={已生成:'#00b894',审核中:'#d4a847',待生产:'#888'};

  // Supply section HTML
  const supplySection=(d.status==='supply'||d.diagnosis==='供给不足'||d.diagnosis==='供给质量差')?`
    <div class="card"><h3>🏭 定向生产任务</h3>
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <div class="kpi-card" style="flex:1"><div class="kpi-title">需生产数量</div><div class="kpi-value" style="font-size:18px">5</div></div>
        <div class="kpi-card" style="flex:1"><div class="kpi-title">已完成</div><div class="kpi-value" style="font-size:18px;color:#00b894">2</div></div>
        <div class="kpi-card" style="flex:1"><div class="kpi-title">审核中</div><div class="kpi-value" style="font-size:18px;color:#d4a847">1</div></div>
        <div class="kpi-card" style="flex:1"><div class="kpi-title">待生产</div><div class="kpi-value" style="font-size:18px;color:#888">2</div></div>
      </div>
      <table><thead><tr><th>Bot名称</th><th>来源</th><th>生产状态</th><th>生成日期</th><th>点击率</th><th>开聊率</th></tr></thead>
      <tbody>${generatedBots.map(b=>`<tr>
        <td><strong style="color:#d4a847">${escHtml(b.name)}</strong></td>
        <td style="font-size:12px">${b.author}</td>
        <td><span style="color:${genStatusColors[b.genStatus]};font-weight:600;font-size:12px">${b.genStatus}</span></td>
        <td style="color:#888;font-size:12px">${b.genDate}</td>
        <td>${b.ctr}</td><td>${b.chatRate}</td>
      </tr>`).join('')}</tbody></table>
    </div>`:'';

  // Build preview (right column showing current online results, matching editor style)
  const previewBots=[...existingBots,...generatedBots.filter(b=>b.genStatus==='已生成')].slice(0,10);
  const previewTags={
    'Gojo':['喜劇','戲劇','JJK','Other'],'Makima':['黑暗浪漫','犯罪','Original','配偶'],
    'Zero Two':['浪漫','科幻','DITF','Other'],'Sukuna':['黑暗浪漫','犯罪','JJK','配偶'],
    'Naruto':['热血','冒険','Original','男朋友'],'girlfriend':['浪漫','Original','约会'],
    'sexy':['浪漫','成人','Original'],'roleplay':['角色扮演','Original','互动'],
    'horror':['恐怖','驚悚','Original'],'love':['浪漫','喜劇','Original','约会'],
    'vampire':['恐怖','浪漫','犯罪'],'AI':['科技','Original','约会'],
  };
  const previewDescs=['A mysterious and powerful character...','Ready for an adventure together?','Let me tell you a story...','Come chat with me!','Your loyal companion awaits...','I have so much to share...'];
  const previewAuthors=['Yuri','Five\'s girl','Flore','Emily','Luna','Yashin','Miko','Zero'];
  const kwFirst=d.kw.split(' ')[0];
  const matchedTags=previewTags[kwFirst]||['浪漫','喜劇','Original','Other'];
  const previewHtml=`
    <div class="mobile-frame" style="width:100%;max-width:320px;min-height:500px;margin:0 auto">
      <div class="mobile-notch"></div>
      <div class="mobile-search-bar"><span class="search-icon">🔍</span><span class="search-text">${escHtml(d.kw)}</span></div>
      <div class="mobile-results-list" style="padding:4px 8px">${previewBots.map((b,i)=>`
        <div class="mobile-bot-card ${b.isNew?'intervention':''}">
          ${b.isNew?'<div class="mobile-intervention-badge">AI生产</div>':''}
          <div class="mobile-bot-avatar" style="background:hsl(${(i*47)%360},30%,20%)"></div>
          <div class="mobile-bot-info">
            <div class="mobile-bot-name">${escHtml(b.name)}</div>
            <div class="mobile-bot-meta"><span>@ ${previewAuthors[i%previewAuthors.length]}</span><span class="meta-dot"></span><span>✉ ${b.msgs>0?(b.msgs/1000).toFixed(0)+'k':'新上线'}</span></div>
            <div class="mobile-bot-desc">${previewDescs[i%previewDescs.length]}</div>
            <div class="mobile-bot-tags">${matchedTags.map(t=>`<span class="mobile-bot-tag${b.isNew?' intervention-tag':''}">${t}</span>`).join('')}</div>
          </div>
        </div>`).join('')}</div>
      <div class="mobile-home-bar"></div>
    </div>`;

  // Main layout: two-column for supply, single column for others
  const isSupplyType=d.status==='supply'||d.diagnosis==='供给不足'||d.diagnosis==='供给质量差';
  
  document.getElementById('ao-detail-content').innerHTML=`
    <div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-title">基线成功率</div><div class="kpi-value" style="font-size:20px">${d.baseline.toFixed(1)}%</div></div>
      <div class="kpi-card"><div class="kpi-title">当前成功率</div><div class="kpi-value" style="font-size:20px;color:${d.current>=95?'#00b894':'#d4a847'}">${d.current.toFixed(1)}%</div></div>
      <div class="kpi-card"><div class="kpi-title">提升幅度</div><div class="kpi-value" style="font-size:20px;color:#00b894">${d.current>d.baseline?'+':''}${(d.current-d.baseline).toFixed(1)}pp</div></div>
      <div class="kpi-card"><div class="kpi-title">当前轮次</div><div class="kpi-value" style="font-size:20px">${d.round>0?'R'+d.round:'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">距毕业</div><div class="kpi-value" style="font-size:20px;color:${gap<=0?'#00b894':'#e74c3c'}">${gapStr}</div></div>
    </div>
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="card"><h3>📈 成功率趋势</h3><div style="position:relative;padding:16px 0">
          <div style="position:absolute;top:0;right:0;font-size:11px;color:#00b894;border:1px dashed #00b894;padding:2px 8px;border-radius:4px">毕业线 95%</div>
          ${trendBar}</div></div>
        ${supplySection}
        <div class="card"><h3>📦 当前搜索结果 (${resultCount}个)</h3>
          <table><thead><tr><th>排序</th><th>Bot名称</th><th>作者</th><th>点击率</th><th>开聊率</th><th>消息量</th></tr></thead>
          <tbody>${existingBots.map((b,i)=>`<tr>
            <td style="font-weight:600">${i+1}</td><td>${escHtml(b.name)}</td><td style="color:#888;font-size:12px">${b.author}</td>
            <td>${b.ctr}%</td><td>${b.chatRate}%</td><td>${b.msgs.toLocaleString()}</td>
          </tr>`).join('')}</tbody></table>
        </div>
        ${d.experiments.length>0?`<div class="card"><h3>🧪 实验历史</h3><table><thead><tr><th>轮次</th><th>时间</th><th>对照组</th><th>胜出组</th><th>提升</th><th>p值</th><th>状态</th></tr></thead><tbody>${expRows}</tbody></table></div>`:'<div class="card"><h3>🧪 实验历史</h3><p style="color:#666;padding:20px;text-align:center">暂无实验记录</p></div>'}
        <div class="card"><h3>📋 诊断记录</h3><div style="padding:8px 0">${logs.map((l,i)=>`<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #1a1a1a"><span style="color:#555;font-size:12px;flex-shrink:0">${i+1}.</span><span style="font-size:13px;color:#ccc">${l}</span></div>`).join('')}</div></div>
      </div>
      <div style="flex:0 0 30%;min-width:320px">
        <div class="card"><h3>📱 线上搜索结果预览</h3>
          <div style="background:#000;border-radius:12px;padding:8px">${previewHtml}</div>
        </div>
        <div class="card" style="margin-top:20px"><h3>⚠️ 供给状态</h3>
          <div style="display:flex;flex-direction:column;gap:8px;padding:8px 0">
            <span style="font-size:14px;color:#ccc">当前结果数: <strong style="color:${resultCount>=10?'#00b894':'#e74c3c'}">${resultCount}</strong></span>
            <span style="font-size:14px;color:#ccc">相关bot总数: <strong>${relatedCount}</strong></span>
            <span style="font-size:14px;color:${resultCount>=10?'#00b894':'#e74c3c'};font-weight:600">${resultCount>=10?'供给充足 ✅':isSupplyType?'供给不足 ⚠️ — 已触发定向生产':'供给不足 ⚠️'}</span>
          </div>
        </div>
      </div>
    </div>`;
}
function rollbackAo(id){
  const d=aoData.find(x=>x.id===id);if(!d)return;
  const pubExps=d.experiments.filter(e=>e.status==='published');
  const target=pubExps.length>0?`R${pubExps[pubExps.length-1].round} 胜出策略 (${pubExps[pubExps.length-1].winner.toFixed(1)}%)`:'基线';
  if(!confirm(`确认回滚「${d.kw}」？\n\n当前策略将终止\n回滚到: ${target}\n回滚后进入 7 天观测期`))return;
  const reason=prompt('请输入回滚原因:\n• 数据异常\n• 用户投诉\n• 误操作\n• 其他');
  if(!reason)return;
  alert(`「${d.kw}」已回滚到 ${target}\n原因: ${reason}\n已进入 7 天观测期`);
}
function pauseAo(id){
  const d=aoData.find(x=>x.id===id);if(!d)return;
  if(confirm(`确认暂停「${d.kw}」的实验？`)){alert(`「${d.kw}」实验已暂停`)}
}
function showAoRulesModal(){
  document.getElementById('ao-rules-modal').classList.remove('hidden');
  document.getElementById('ao-rules-body').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:24px">
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">📋 当前优化规则</h3>
        <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:16px;font-size:13px;color:#ccc;line-height:2">
          <p>1. <strong>入队条件</strong>：搜索量 ≥ 1000次/天 的搜索词自动进入优化队列</p>
          <p>2. <strong>毕业条件</strong>：搜索成功率 ≥ 95%，稳定保持 7 天</p>
          <p>3. <strong>回落重入</strong>：已毕业搜索词成功率回落 < 90% 自动重新诊断</p>
          <p>4. <strong>供给不足判定</strong>：搜索结果数 < 10 个 bot</p>
          <p>5. <strong>供给质量差判定</strong>：首屏 top5 平均点击率 < 同类 P25</p>
          <p>6. <strong>体验差判定</strong>：首屏 top5 平均开聊率 < 同类 P25</p>
          <p>7. <strong>实验周期</strong>：每轮 7 天，无显著差异延长 3 天</p>
          <p>8. <strong>显著性阈值</strong>：p < 0.05 判定胜出</p>
          <p>9. <strong>护栏指标</strong>：搜索后再搜率不升、对话留存率不降、人均搜索次数不增</p>
          <p>10. <strong>冲突处理</strong>：手动干预（人工优化）> 自动优化，有手动干预的搜索词跳过</p>
        </div>
      </div>
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">⚙️ 关键参数调整</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">入队搜索量阈值（次/天）</label>
            <input type="number" id="ao-rule-volume" value="1000" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">毕业成功率阈值（%）</label>
            <input type="number" id="ao-rule-grad" value="95" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">回落重入阈值（%）</label>
            <input type="number" id="ao-rule-reenter" value="90" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">供给不足阈值（bot数）</label>
            <input type="number" id="ao-rule-supply" value="10" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">实验周期（天）</label>
            <input type="number" id="ao-rule-exp-days" value="7" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">毕业稳定天数</label>
            <input type="number" id="ao-rule-stable" value="7" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">显著性阈值（p值）</label>
            <input type="number" id="ao-rule-pvalue" value="0.05" step="0.01" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">延长实验天数（无显著差异时）</label>
            <input type="number" id="ao-rule-extend" value="3" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="closeAoRulesModal()">取消</button>
        <button class="btn btn-primary" onclick="saveAoRules()">保存规则</button>
      </div>
    </div>`;
}
function closeAoRulesModal(){document.getElementById('ao-rules-modal').classList.add('hidden')}
function saveAoRules(){alert('规则已保存');closeAoRulesModal()}


// ===== Hot Search Auto Optimize (热搜词自动优化) =====
const hsaData=[
  {id:'hsa1',word:'Gojo Satoru',pos:1,status:'online',ctr:12.3,downstreamSuccess:87.3,chatRate:45.2,efficiency:48.3,onlineDays:5,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa2',word:'girlfriend',pos:2,status:'online',ctr:15.1,downstreamSuccess:96.1,chatRate:52.8,efficiency:54.7,onlineDays:11,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa3',word:'Makima',pos:3,status:'fatigued',ctr:6.2,downstreamSuccess:42.1,chatRate:28.3,efficiency:25.5,onlineDays:14,fatigueDay:3,source:'搜索日志',experiment:null},
  {id:'hsa4',word:'roleplay',pos:4,status:'online',ctr:9.8,downstreamSuccess:95.3,chatRate:48.1,efficiency:50.9,onlineDays:8,fatigueDay:0,source:'高供给词',experiment:null},
  {id:'hsa5',word:'Zero Two',pos:5,status:'experimenting',ctr:8.5,downstreamSuccess:78.4,chatRate:38.9,efficiency:41.9,onlineDays:3,fatigueDay:0,source:'新内容驱动',experiment:{name:'R1-替换测试',day:2,total:3}},
  {id:'hsa6',word:'sexy chat',pos:null,status:'candidate',ctr:0,downstreamSuccess:68.9,chatRate:35.1,efficiency:0,onlineDays:0,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa7',word:'Naruto RPG',pos:null,status:'candidate',ctr:0,downstreamSuccess:74.5,chatRate:41.2,efficiency:0,onlineDays:0,fatigueDay:0,source:'新内容驱动',experiment:null},
  {id:'hsa8',word:'horror game',pos:null,status:'offline',ctr:3.1,downstreamSuccess:45.6,chatRate:22.4,efficiency:23.7,onlineDays:0,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa9',word:'AI boyfriend',pos:6,status:'experimenting',ctr:11.2,downstreamSuccess:82.5,chatRate:44.7,efficiency:45.5,onlineDays:1,fatigueDay:0,source:'搜索日志',experiment:{name:'R1-新词上线',day:1,total:3}},
  {id:'hsa10',word:'love story',pos:null,status:'offline',ctr:4.5,downstreamSuccess:58.2,chatRate:30.1,efficiency:30.9,onlineDays:0,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa11',word:'Sukuna',pos:7,status:'online',ctr:10.1,downstreamSuccess:88.7,chatRate:42.3,efficiency:47.0,onlineDays:6,fatigueDay:0,source:'搜索日志',experiment:null},
  {id:'hsa12',word:'vampire chat',pos:null,status:'candidate',ctr:0,downstreamSuccess:71.3,chatRate:33.8,efficiency:0,onlineDays:0,fatigueDay:0,source:'运营添加',experiment:null},
];

function loadHotSearchAuto(){
  const statusFilter=document.getElementById('hsa-filter-status')?.value||'all';
  const timeRange=document.getElementById('hsa-time-range')?.value||'30d';
  const timeLabels={'7d':'近7天','14d':'近14天','30d':'近30天','90d':'近90天','all':'全部时间'};
  let items=hsaData.filter(d=>statusFilter==='all'||d.status===statusFilter);
  const online=hsaData.filter(d=>d.status==='online').length;
  const experimenting=hsaData.filter(d=>d.status==='experimenting').length;
  const fatigued=hsaData.filter(d=>d.status==='fatigued').length;
  const candidate=hsaData.filter(d=>d.status==='candidate').length;
  const onlineItems=hsaData.filter(d=>d.status==='online'||d.status==='experimenting');
  const avgCtr=onlineItems.length?onlineItems.reduce((s,d)=>s+d.ctr,0)/onlineItems.length:0;
  const avgEfficiency=onlineItems.length?onlineItems.reduce((s,d)=>s+d.efficiency,0)/onlineItems.length:0;
  document.getElementById('hsa-kpis').innerHTML=`<div style="grid-column:1/-1;font-size:12px;color:#666;margin-bottom:-8px">统计周期：${timeLabels[timeRange]}</div>`+[
    {t:'在线热搜词',v:online,c:'#00b894'},
    {t:'实验中',v:experimenting,c:'#d4a847'},
    {t:'疲劳预警',v:fatigued,c:'#e74c3c'},
    {t:'候选池',v:candidate,c:'#74b9ff'},
    {t:'平均CTR',v:avgCtr.toFixed(1)+'%',c:'#f0f0f0'},
    {t:'平均词效率分',v:avgEfficiency.toFixed(1),c:'#00b894'}
  ].map(k=>`<div class="kpi-card"><div class="kpi-title">${k.t}</div><div class="kpi-value" style="color:${k.c}">${k.v}</div></div>`).join('');
  const statusLabels={online:'在线',experimenting:'实验中',fatigued:'疲劳',candidate:'候选',offline:'已下线'};
  const statusColors={online:'#00b894',experimenting:'#d4a847',fatigued:'#e74c3c',candidate:'#74b9ff',offline:'#666'};
  document.getElementById('hsa-table').innerHTML=`<table><thead><tr>
    <th>热搜词</th><th>位置</th><th>状态</th><th>CTR</th><th>下游成功率</th><th>开聊率</th><th>词效率分</th><th>在线天数</th><th>疲劳天数</th><th>来源</th><th>操作</th>
  </tr></thead><tbody>${items.map(d=>`<tr>
    <td><strong class="clickable" onclick="openHsaDetail('${d.id}')">${escHtml(d.word)}</strong></td>
    <td>${d.pos||'--'}</td>
    <td><span style="color:${statusColors[d.status]||'#888'};font-weight:600">${statusLabels[d.status]||d.status}</span></td>
    <td>${d.ctr?d.ctr.toFixed(1)+'%':'--'}</td>
    <td>${d.downstreamSuccess.toFixed(1)}%</td>
    <td>${d.chatRate.toFixed(1)}%</td>
    <td style="font-weight:600">${d.efficiency?d.efficiency.toFixed(1):'--'}</td>
    <td>${d.onlineDays||'--'}</td>
    <td style="color:${d.fatigueDay>=3?'#e74c3c':'inherit'}">${d.fatigueDay||'--'}</td>
    <td style="font-size:12px;color:#888">${d.source}</td>
    <td>${d.status==='candidate'?`<button class="btn btn-sm" onclick="alert('启动上线实验')">上线实验</button>`:
        d.status==='fatigued'?`<button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="alert('启动轮换实验')">轮换</button>`:
        d.status==='online'?`<button class="btn btn-sm btn-outline" onclick="alert('下线该词')">下线</button>`:
        d.status==='experimenting'?`<span style="font-size:12px;color:#d4a847">${d.experiment?d.experiment.name+' D'+d.experiment.day+'/'+d.experiment.total:''}</span>`:''}</td>
  </tr>`).join('')}</tbody></table>`;
}

function openHsaDetail(id){
  const d=hsaData.find(x=>x.id===id);if(!d)return;
  navigateTo('hsa-detail');
  document.getElementById('hsa-detail-title').textContent=`${d.word} — 热搜词详情`;
  document.getElementById('hsa-detail-actions').innerHTML=`
    <button class="btn btn-outline" onclick="navigateTo('hot-search-auto')">← 返回</button>
    ${d.status==='fatigued'?`<button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="alert('启动轮换')">启动轮换</button>`:''}
    ${d.status==='online'?`<button class="btn btn-outline" onclick="alert('下线')">下线</button>`:''}`;
  // Mock trend data
  const trendDays=['3/13','3/14','3/15','3/16','3/17','3/18','3/19'];
  const ctrTrend=trendDays.map((_,i)=>d.ctr*(1-0.03*i*(d.status==='fatigued'?1:0.3))+Math.random()*1);
  const successTrend=trendDays.map(()=>d.downstreamSuccess+Math.random()*3-1.5);
  const maxCtr=Math.max(...ctrTrend,15);
  const ctrBars=ctrTrend.map((v,i)=>`<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
    <span style="font-size:10px;color:#ccc">${v.toFixed(1)}%</span>
    <div style="width:100%;background:${v<d.ctr*0.85?'#e74c3c':'#d4a847'};height:${v/maxCtr*120}px;border-radius:4px 4px 0 0;min-height:4px"></div>
    <span style="font-size:10px;color:#666">${trendDays[i]}</span>
  </div>`).join('');
  // Mock preview bots
  const previewAuthors=['Yuri','Five\'s girl','Flore','Emily','Luna','Yashin','Miko','Zero'];
  const previewDescs=['A mysterious and powerful character...','Ready for an adventure together?','Let me tell you a story...','Come chat with me!','Your loyal companion awaits...'];
  const previewTags=['浪漫','喜劇','Original','Other','角色扮演'];
  const mockBots=Array.from({length:6},(_,i)=>({name:`${d.word} Bot #${i+1}`,author:previewAuthors[i%previewAuthors.length],desc:previewDescs[i%previewDescs.length]}));
  const previewHtml=`<div class="mobile-frame" style="width:100%;max-width:320px;min-height:400px;margin:0 auto">
    <div class="mobile-notch"></div>
    <div class="mobile-search-bar"><span class="search-icon">🔍</span><span class="search-text">${escHtml(d.word)}</span></div>
    <div class="mobile-results-list" style="padding:4px 8px">${mockBots.map((b,i)=>`
      <div class="mobile-bot-card">
        <div class="mobile-bot-avatar" style="background:hsl(${(i*47+120)%360},30%,20%)"></div>
        <div class="mobile-bot-info">
          <div class="mobile-bot-name">${escHtml(b.name)}</div>
          <div class="mobile-bot-meta"><span>@ ${b.author}</span><span class="meta-dot"></span><span>✉ ${Math.floor(Math.random()*50+5)}k</span></div>
          <div class="mobile-bot-desc">${b.desc}</div>
          <div class="mobile-bot-tags">${previewTags.slice(0,3).map(t=>`<span class="mobile-bot-tag">${t}</span>`).join('')}</div>
        </div>
      </div>`).join('')}</div>
    <div class="mobile-home-bar"></div>
  </div>`;
  // Candidate queue
  const candidates=hsaData.filter(x=>x.status==='candidate').sort((a,b)=>b.downstreamSuccess-a.downstreamSuccess);
  document.getElementById('hsa-detail-content').innerHTML=`
    <div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-title">当前CTR</div><div class="kpi-value" style="font-size:20px">${d.ctr?d.ctr.toFixed(1)+'%':'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">下游搜索成功率</div><div class="kpi-value" style="font-size:20px;color:${d.downstreamSuccess>=90?'#00b894':'#d4a847'}">${d.downstreamSuccess.toFixed(1)}%</div></div>
      <div class="kpi-card"><div class="kpi-title">词效率分</div><div class="kpi-value" style="font-size:20px">${d.efficiency?d.efficiency.toFixed(1):'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">在线天数</div><div class="kpi-value" style="font-size:20px">${d.onlineDays}</div></div>
      <div class="kpi-card"><div class="kpi-title">疲劳状态</div><div class="kpi-value" style="font-size:20px;color:${d.fatigueDay>=3?'#e74c3c':'#00b894'}">${d.fatigueDay>=3?'⚠️ CTR连降'+d.fatigueDay+'天':'正常 ✅'}</div></div>
    </div>
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="card"><h3>📈 CTR趋势（近7天）</h3>
          <div style="display:flex;align-items:flex-end;gap:4px;padding:16px 0;height:180px">${ctrBars}</div>
          ${d.fatigueDay>=3?'<div style="padding:8px;background:rgba(231,76,60,0.1);border-radius:6px;color:#e74c3c;font-size:13px">⚠️ CTR 连续下降 '+d.fatigueDay+' 天，建议启动轮换实验</div>':''}
        </div>
        <div class="card"><h3>📊 下游搜索成功率趋势</h3>
          <div style="display:flex;align-items:flex-end;gap:4px;padding:16px 0;height:180px">${successTrend.map((v,i)=>`<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
            <span style="font-size:10px;color:#ccc">${v.toFixed(1)}%</span>
            <div style="width:100%;background:${v>=90?'#00b894':'#d4a847'};height:${v/100*120}px;border-radius:4px 4px 0 0;min-height:4px"></div>
            <span style="font-size:10px;color:#666">${trendDays[i]}</span>
          </div>`).join('')}</div>
        </div>
        ${d.experiment?`<div class="card"><h3>🧪 当前实验</h3><div style="padding:12px 0">
          <p style="color:#ccc;font-size:14px"><strong>${d.experiment.name}</strong> — 第${d.experiment.day}天/共${d.experiment.total}天</p>
          <div style="margin-top:12px;display:flex;gap:16px">
            <div style="flex:1;padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid #222">
              <p style="font-size:12px;color:#888">对照组（当前词）</p>
              <p style="font-size:18px;font-weight:600;color:#ccc;margin-top:4px">${d.word}</p>
              <p style="font-size:13px;color:#888;margin-top:8px">CTR: ${d.ctr.toFixed(1)}%</p>
            </div>
            <div style="flex:1;padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid #d4a847">
              <p style="font-size:12px;color:#d4a847">实验组（候选词）</p>
              <p style="font-size:18px;font-weight:600;color:#d4a847;margin-top:4px">${candidates[0]?.word||'候选词'}</p>
              <p style="font-size:13px;color:#888;margin-top:8px">CTR: ${(d.ctr*1.15).toFixed(1)}% <span style="color:#00b894">↑</span></p>
            </div>
          </div>
        </div></div>`:''}
        <div class="card"><h3>📋 替补候选队列</h3>
          ${candidates.length>0?`<table><thead><tr><th>候选词</th><th>来源</th><th>下游搜索成功率</th><th>预估词效率分</th><th>操作</th></tr></thead>
          <tbody>${candidates.map(c=>`<tr>
            <td><strong>${escHtml(c.word)}</strong></td><td style="font-size:12px;color:#888">${c.source}</td>
            <td>${c.downstreamSuccess.toFixed(1)}%</td><td>${(c.downstreamSuccess*0.4+c.chatRate*0.2).toFixed(1)}</td>
            <td><button class="btn btn-sm" onclick="alert('启动上线实验')">上线实验</button></td>
          </tr>`).join('')}</tbody></table>`:'<p style="color:#666;padding:20px;text-align:center">暂无候选词</p>'}
        </div>
      </div>
      <div style="flex:0 0 30%;min-width:320px">
        <div class="card"><h3>📱 线上搜索结果预览</h3>
          <div style="background:#000;border-radius:12px;padding:8px">${previewHtml}</div>
        </div>
      </div>
    </div>`;
}

function showHsaRulesModal(){
  document.getElementById('hsa-rules-modal').classList.remove('hidden');
  document.getElementById('hsa-rules-body').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:24px">
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">📋 热搜词优化规则</h3>
        <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:16px;font-size:13px;color:#ccc;line-height:2">
          <p>1. <strong>词效率分</strong> = CTR × 0.4 + 下游搜索成功率 × 0.4 + 下游开聊率 × 0.2</p>
          <p>2. <strong>疲劳判定</strong>：CTR 连续 3 天下降触发轮换预警</p>
          <p>3. <strong>在线轮换上限</strong>：超过 14 天自动评估是否需要替换</p>
          <p>4. <strong>候选池准入</strong>：搜索成功率 ≥ 70% 且未命中黑名单</p>
          <p>5. <strong>实验周期</strong>：3 天，无显著差异延长 2 天</p>
          <p>6. <strong>护栏指标</strong>：搜索后再搜率不升，对话留存率不降</p>
          <p>7. <strong>常青词保护</strong>：CTR ≥ P90 的词不轻易替换</p>
          <p>8. <strong>联动规则</strong>：下游搜索成功率 < 70% 的词暂停推荐</p>
        </div>
      </div>
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">⚙️ 关键参数调整</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">CTR权重</label>
            <input type="number" value="0.4" step="0.1" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">下游成功率权重</label>
            <input type="number" value="0.4" step="0.1" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">疲劳触发天数</label>
            <input type="number" value="3" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">在线轮换上限（天）</label>
            <input type="number" value="14" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">候选池准入成功率（%）</label>
            <input type="number" value="70" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">实验周期（天）</label>
            <input type="number" value="3" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="closeHsaRulesModal()">取消</button>
        <button class="btn btn-primary" onclick="alert('规则已保存');closeHsaRulesModal()">保存规则</button>
      </div>
    </div>`;
}
function closeHsaRulesModal(){document.getElementById('hsa-rules-modal').classList.add('hidden')}

// ===== Trending Auto Optimize (热门词自动优化) =====
const traData=[
  {id:'tra1',word:'🔥 Anime',category:'content',status:'online',ctr:8.5,exploreDepth:4.2,chatRate:38.5,coverage:72.1,efficiency:40.3,onlineDays:25,fatigueDay:0,variants:['🔥 Anime','🎌 Anime','✨ Anime World'],currentVariant:0},
  {id:'tra2',word:'❤️ Romance',category:'emotion',status:'online',ctr:11.2,exploreDepth:3.8,chatRate:45.1,coverage:81.3,efficiency:46.2,onlineDays:20,fatigueDay:0,variants:['❤️ Romance','💕 Love Stories','❤️‍🔥 Romance'],currentVariant:0},
  {id:'tra3',word:'🎮 Gaming',category:'content',status:'online',ctr:6.3,exploreDepth:3.1,chatRate:29.8,coverage:55.2,efficiency:31.1,onlineDays:18,fatigueDay:0,variants:['🎮 Gaming','🕹️ Game Chat','🎮 Gamer Zone'],currentVariant:0},
  {id:'tra4',word:'😈 Villain',category:'emotion',status:'fatigued',ctr:4.1,exploreDepth:2.5,chatRate:22.3,coverage:38.7,efficiency:22.4,onlineDays:30,fatigueDay:7,variants:['😈 Villain','🦹 Anti-Hero','👿 Dark Side'],currentVariant:0},
  {id:'tra5',word:'💬 Roleplay',category:'interaction',status:'online',ctr:9.8,exploreDepth:5.1,chatRate:51.2,coverage:68.9,efficiency:48.5,onlineDays:15,fatigueDay:0,variants:['💬 Roleplay','🎭 RP','💬 角色扮演'],currentVariant:0},
  {id:'tra6',word:'🌙 Fantasy',category:'content',status:'experimenting',ctr:7.2,exploreDepth:3.5,chatRate:33.1,coverage:61.4,efficiency:34.4,onlineDays:5,fatigueDay:0,variants:['🌙 Fantasy','✨ Magic World','🧙 Fantasy'],currentVariant:0,experiment:{name:'文案A/B-R1',day:3,total:5}},
  {id:'tra7',word:'💀 Horror',category:'emotion',status:'online',ctr:5.8,exploreDepth:2.9,chatRate:26.5,coverage:42.1,efficiency:25.4,onlineDays:12,fatigueDay:0,variants:['💀 Horror','👻 Scary','🎃 Horror Chat'],currentVariant:0},
  {id:'tra8',word:'🎵 Music',category:'content',status:'candidate',ctr:0,exploreDepth:0,chatRate:0,coverage:0,efficiency:0,onlineDays:0,fatigueDay:0,variants:['🎵 Music','🎶 Music Chat','🎤 Sing Along'],currentVariant:0},
  {id:'tra9',word:'📚 Story',category:'interaction',status:'candidate',ctr:0,exploreDepth:0,chatRate:0,coverage:0,efficiency:0,onlineDays:0,fatigueDay:0,variants:['📚 Story','📖 Tales','📚 故事'],currentVariant:0},
  {id:'tra10',word:'🏆 Competition',category:'special',status:'offline',ctr:3.2,exploreDepth:1.8,chatRate:15.2,coverage:28.5,efficiency:15.7,onlineDays:0,fatigueDay:0,variants:['🏆 Competition','⚔️ Battle','🏆 挑战'],currentVariant:0},
  {id:'tra11',word:'🔞 Spicy',category:'emotion',status:'online',ctr:13.5,exploreDepth:3.9,chatRate:48.3,coverage:45.8,efficiency:43.9,onlineDays:22,fatigueDay:0,variants:['🔞 Spicy','🌶️ Hot','💋 Flirty'],currentVariant:0},
  {id:'tra12',word:'🆕 New Bots',category:'special',status:'online',ctr:7.8,exploreDepth:4.5,chatRate:35.2,coverage:78.3,efficiency:41.6,onlineDays:8,fatigueDay:0,variants:['🆕 New Bots','✨ Just Added','🆕 新上线'],currentVariant:0},
];

function loadTrendingAuto(){
  const statusFilter=document.getElementById('tra-filter-status')?.value||'all';
  const categoryFilter=document.getElementById('tra-filter-category')?.value||'all';
  const timeRange=document.getElementById('tra-time-range')?.value||'30d';
  const timeLabels={'7d':'近7天','14d':'近14天','30d':'近30天','90d':'近90天','all':'全部时间'};
  let items=traData.filter(d=>(statusFilter==='all'||d.status===statusFilter)&&(categoryFilter==='all'||d.category===categoryFilter));
  const online=traData.filter(d=>d.status==='online').length;
  const experimenting=traData.filter(d=>d.status==='experimenting').length;
  const fatigued=traData.filter(d=>d.status==='fatigued').length;
  const candidate=traData.filter(d=>d.status==='candidate').length;
  // Category diversity check
  const onlineCats=new Set(traData.filter(d=>d.status==='online'||d.status==='experimenting').map(d=>d.category));
  const diversityOk=onlineCats.size>=3;
  const onlineItems=traData.filter(d=>d.status==='online'||d.status==='experimenting');
  const avgEfficiency=onlineItems.length?onlineItems.reduce((s,d)=>s+d.efficiency,0)/onlineItems.length:0;
  document.getElementById('tra-kpis').innerHTML=`<div style="grid-column:1/-1;font-size:12px;color:#666;margin-bottom:-8px">统计周期：${timeLabels[timeRange]}</div>`+[
    {t:'在线热门词',v:online,c:'#00b894'},
    {t:'实验中',v:experimenting,c:'#d4a847'},
    {t:'疲劳预警',v:fatigued,c:'#e74c3c'},
    {t:'候选池',v:candidate,c:'#74b9ff'},
    {t:'品类覆盖',v:`${onlineCats.size}/4 ${diversityOk?'✅':'⚠️'}`,c:diversityOk?'#00b894':'#e74c3c'},
    {t:'平均效率分',v:avgEfficiency.toFixed(1),c:'#00b894'}
  ].map(k=>`<div class="kpi-card"><div class="kpi-title">${k.t}</div><div class="kpi-value" style="color:${k.c}">${k.v}</div></div>`).join('');
  const statusLabels={online:'在线',experimenting:'实验中',fatigued:'疲劳',candidate:'候选',offline:'已下线'};
  const statusColors={online:'#00b894',experimenting:'#d4a847',fatigued:'#e74c3c',candidate:'#74b9ff',offline:'#666'};
  const catLabels={content:'内容类型',emotion:'情感类型',interaction:'互动类型',special:'特殊标签'};
  document.getElementById('tra-table').innerHTML=`<table><thead><tr>
    <th>热门词</th><th>品类</th><th>状态</th><th>CTR</th><th>探索深度</th><th>开聊率</th><th>覆盖度</th><th>效率分</th><th>在线天数</th><th>文案变体</th><th>操作</th>
  </tr></thead><tbody>${items.map(d=>`<tr>
    <td><strong class="clickable" onclick="openTraDetail('${d.id}')">${escHtml(d.word)}</strong></td>
    <td><span style="font-size:12px;padding:2px 8px;background:rgba(212,168,71,0.1);border-radius:4px;color:#d4a847">${catLabels[d.category]||d.category}</span></td>
    <td><span style="color:${statusColors[d.status]||'#888'};font-weight:600">${statusLabels[d.status]||d.status}</span></td>
    <td>${d.ctr?d.ctr.toFixed(1)+'%':'--'}</td>
    <td>${d.exploreDepth?d.exploreDepth.toFixed(1):'--'}</td>
    <td>${d.chatRate?d.chatRate.toFixed(1)+'%':'--'}</td>
    <td>${d.coverage?d.coverage.toFixed(1)+'%':'--'}</td>
    <td style="font-weight:600">${d.efficiency?d.efficiency.toFixed(1):'--'}</td>
    <td>${d.onlineDays||'--'}</td>
    <td style="font-size:12px;color:#888">${d.variants.length}个</td>
    <td>${d.status==='candidate'?`<button class="btn btn-sm" onclick="alert('启动上线实验')">上线</button>`:
        d.status==='fatigued'?`<button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="alert('启动轮换')">轮换</button>`:
        d.status==='online'?`<button class="btn btn-sm btn-outline" onclick="alert('启动文案实验')">文案实验</button>`:
        d.status==='experimenting'?`<span style="font-size:12px;color:#d4a847">${d.experiment?d.experiment.name+' D'+d.experiment.day+'/'+d.experiment.total:''}</span>`:''}</td>
  </tr>`).join('')}</tbody></table>`;
}

function openTraDetail(id){
  const d=traData.find(x=>x.id===id);if(!d)return;
  navigateTo('tra-detail');
  document.getElementById('tra-detail-title').textContent=`${d.word} — 热门词详情`;
  document.getElementById('tra-detail-actions').innerHTML=`
    <button class="btn btn-outline" onclick="navigateTo('trending-auto')">← 返回</button>
    ${d.status==='online'?`<button class="btn btn-outline" onclick="alert('启动文案A/B实验')">文案实验</button>`:''}
    ${d.status==='fatigued'?`<button class="btn btn-sm" style="background:#e74c3c;color:#fff" onclick="alert('启动轮换')">启动轮换</button>`:''}`;
  const trendDays=['3/13','3/14','3/15','3/16','3/17','3/18','3/19'];
  const ctrTrend=trendDays.map((_,i)=>d.ctr*(1-0.02*i*(d.status==='fatigued'?1:0.2))+Math.random()*0.8);
  const depthTrend=trendDays.map(()=>d.exploreDepth+Math.random()*0.6-0.3);
  const maxCtr=Math.max(...ctrTrend,15);
  const maxDepth=Math.max(...depthTrend,6);
  // Preview: search page with pill tags
  const onlineTags=traData.filter(x=>x.status==='online'||x.status==='experimenting');
  const previewHtml=`<div class="mobile-frame" style="width:100%;max-width:320px;min-height:400px;margin:0 auto">
    <div class="mobile-notch"></div>
    <div class="mobile-search-bar"><span class="search-icon">🔍</span><span class="search-text" style="color:#666">搜索 bot...</span></div>
    <div style="padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px">${onlineTags.map(t=>`<span style="padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;${t.id===d.id?'background:rgba(212,168,71,0.2);color:#d4a847;border:1px solid #d4a847':'background:rgba(255,255,255,0.06);color:#ccc;border:1px solid transparent'}">${t.word}</span>`).join('')}</div>
    <div style="padding:8px 12px;font-size:12px;color:#555;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px">点击标签后的搜索结果...</div>
    <div class="mobile-results-list" style="padding:4px 8px">${Array.from({length:4},(_,i)=>`
      <div class="mobile-bot-card">
        <div class="mobile-bot-avatar" style="background:hsl(${(i*67+200)%360},30%,20%)"></div>
        <div class="mobile-bot-info">
          <div class="mobile-bot-name">${d.word.replace(/[^\w\s]/g,'')} Bot #${i+1}</div>
          <div class="mobile-bot-meta"><span>@ Creator${i+1}</span><span class="meta-dot"></span><span>✉ ${Math.floor(Math.random()*30+5)}k</span></div>
          <div class="mobile-bot-desc">Explore the world of ${d.word.replace(/[^\w\s]/g,'')}...</div>
          <div class="mobile-bot-tags"><span class="mobile-bot-tag">${d.word.replace(/[^\w\s]/g,'').trim()}</span><span class="mobile-bot-tag">Original</span></div>
        </div>
      </div>`).join('')}</div>
    <div class="mobile-home-bar"></div>
  </div>`;
  // Variant experiment section
  const variantHtml=d.variants.map((v,i)=>`<div style="flex:1;padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid ${i===d.currentVariant?'#d4a847':'#222'}">
    <p style="font-size:12px;color:${i===d.currentVariant?'#d4a847':'#888'}">${i===d.currentVariant?'当前文案':'备选文案 '+(i)}</p>
    <p style="font-size:20px;margin-top:8px">${v}</p>
    ${i===d.currentVariant?`<p style="font-size:12px;color:#888;margin-top:8px">CTR: ${d.ctr.toFixed(1)}%</p>`:`<p style="font-size:12px;color:#888;margin-top:8px">预估CTR: ${(d.ctr*(0.9+Math.random()*0.3)).toFixed(1)}%</p>`}
  </div>`).join('');
  document.getElementById('tra-detail-content').innerHTML=`
    <div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-title">当前CTR</div><div class="kpi-value" style="font-size:20px">${d.ctr?d.ctr.toFixed(1)+'%':'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">探索深度</div><div class="kpi-value" style="font-size:20px">${d.exploreDepth?d.exploreDepth.toFixed(1):'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">效率分</div><div class="kpi-value" style="font-size:20px">${d.efficiency?d.efficiency.toFixed(1):'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">人群覆盖度</div><div class="kpi-value" style="font-size:20px">${d.coverage?d.coverage.toFixed(1)+'%':'--'}</div></div>
      <div class="kpi-card"><div class="kpi-title">疲劳状态</div><div class="kpi-value" style="font-size:20px;color:${d.fatigueDay>=7?'#e74c3c':'#00b894'}">${d.fatigueDay>=7?'⚠️ CTR连降'+d.fatigueDay+'天':'正常 ✅'}</div></div>
    </div>
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div style="flex:1;min-width:0">
        <div class="card"><h3>📈 CTR趋势（近7天）</h3>
          <div style="display:flex;align-items:flex-end;gap:4px;padding:16px 0;height:180px">${ctrTrend.map((v,i)=>`<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
            <span style="font-size:10px;color:#ccc">${v.toFixed(1)}%</span>
            <div style="width:100%;background:${v<d.ctr*0.85?'#e74c3c':'#d4a847'};height:${v/maxCtr*120}px;border-radius:4px 4px 0 0;min-height:4px"></div>
            <span style="font-size:10px;color:#666">${trendDays[i]}</span>
          </div>`).join('')}</div>
          ${d.fatigueDay>=7?'<div style="padding:8px;background:rgba(231,76,60,0.1);border-radius:6px;color:#e74c3c;font-size:13px">⚠️ CTR 连续下降 '+d.fatigueDay+' 天（≥7天），建议替换</div>':''}
        </div>
        <div class="card"><h3>🔍 探索深度趋势</h3>
          <div style="display:flex;align-items:flex-end;gap:4px;padding:16px 0;height:180px">${depthTrend.map((v,i)=>`<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
            <span style="font-size:10px;color:#ccc">${v.toFixed(1)}</span>
            <div style="width:100%;background:#74b9ff;height:${v/maxDepth*120}px;border-radius:4px 4px 0 0;min-height:4px"></div>
            <span style="font-size:10px;color:#666">${trendDays[i]}</span>
          </div>`).join('')}</div>
        </div>
        <div class="card"><h3>🎨 文案变体</h3>
          <div style="display:flex;gap:12px;padding:12px 0">${variantHtml}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="alert('启动文案A/B实验')">启动文案A/B实验</button>
        </div>
        ${d.experiment?`<div class="card"><h3>🧪 当前实验</h3><div style="padding:12px 0">
          <p style="color:#ccc;font-size:14px"><strong>${d.experiment.name}</strong> — 第${d.experiment.day}天/共${d.experiment.total}天</p>
          <div style="margin-top:12px;display:flex;gap:16px">
            <div style="flex:1;padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid #222">
              <p style="font-size:12px;color:#888">对照组</p>
              <p style="font-size:18px;margin-top:4px">${d.variants[0]}</p>
              <p style="font-size:13px;color:#888;margin-top:8px">CTR: ${d.ctr.toFixed(1)}% | 探索: ${d.exploreDepth.toFixed(1)}</p>
            </div>
            <div style="flex:1;padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid #d4a847">
              <p style="font-size:12px;color:#d4a847">实验组</p>
              <p style="font-size:18px;margin-top:4px">${d.variants[1]||d.variants[0]}</p>
              <p style="font-size:13px;color:#888;margin-top:8px">CTR: ${(d.ctr*1.08).toFixed(1)}% <span style="color:#00b894">↑</span> | 探索: ${(d.exploreDepth*1.05).toFixed(1)}</p>
            </div>
          </div>
        </div></div>`:''}
        <div class="card"><h3>📊 品类分布</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 0">${['content','emotion','interaction','special'].map(cat=>{
            const count=traData.filter(x=>(x.status==='online'||x.status==='experimenting')&&x.category===cat).length;
            const total=traData.filter(x=>x.status==='online'||x.status==='experimenting').length;
            const pct=total?((count/total)*100).toFixed(0):0;
            return `<div style="padding:12px;background:#0f0f0f;border-radius:8px;border:1px solid ${d.category===cat?'#d4a847':'#222'}">
              <p style="font-size:12px;color:#888">${{content:'内容类型',emotion:'情感类型',interaction:'互动类型',special:'特殊标签'}[cat]}</p>
              <p style="font-size:20px;font-weight:600;color:${d.category===cat?'#d4a847':'#ccc'};margin-top:4px">${count}个 (${pct}%)</p>
              ${pct>50?'<p style="font-size:11px;color:#e74c3c;margin-top:4px">⚠️ 超过50%上限</p>':''}
            </div>`;
          }).join('')}</div>
        </div>
      </div>
      <div style="flex:0 0 30%;min-width:320px">
        <div class="card"><h3>📱 线上热门词预览</h3>
          <div style="background:#000;border-radius:12px;padding:8px">${previewHtml}</div>
        </div>
      </div>
    </div>`;
}

function showTraRulesModal(){
  document.getElementById('tra-rules-modal').classList.remove('hidden');
  document.getElementById('tra-rules-body').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:24px">
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">📋 热门词优化规则</h3>
        <div style="background:#0f0f0f;border:1px solid #222;border-radius:8px;padding:16px;font-size:13px;color:#ccc;line-height:2">
          <p>1. <strong>标签效率分</strong> = 探索深度 × 0.3 + 开聊率 × 0.3 + CTR × 0.2 + 覆盖度 × 0.2</p>
          <p>2. <strong>疲劳判定</strong>：CTR 连续 7 天下降触发轮换预警</p>
          <p>3. <strong>在线轮换上限</strong>：超过 30 天自动评估是否需要替换</p>
          <p>4. <strong>品类多样性</strong>：在线标签必须覆盖 ≥ 3 个品类</p>
          <p>5. <strong>同品类上限</strong>：同品类不超过总位置的 50%</p>
          <p>6. <strong>实验周期</strong>：5 天，无显著差异延长 3 天</p>
          <p>7. <strong>常青标签保护</strong>：CTR ≥ P90 不轻易替换</p>
          <p>8. <strong>季节性标签</strong>：到期自动下线</p>
          <p>9. <strong>文案实验</strong>：可对同一标签 A/B 不同 emoji + 文案组合</p>
        </div>
      </div>
      <div>
        <h3 style="color:#d4a847;margin-bottom:12px">⚙️ 关键参数调整</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">探索深度权重</label>
            <input type="number" value="0.3" step="0.1" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">开聊率权重</label>
            <input type="number" value="0.3" step="0.1" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">疲劳触发天数</label>
            <input type="number" value="7" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">在线轮换上限（天）</label>
            <input type="number" value="30" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">品类覆盖最低数</label>
            <input type="number" value="3" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:12px;color:#888">实验周期（天）</label>
            <input type="number" value="5" style="padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px">
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="closeTraRulesModal()">取消</button>
        <button class="btn btn-primary" onclick="alert('规则已保存');closeTraRulesModal()">保存规则</button>
      </div>
    </div>`;
}
function closeTraRulesModal(){document.getElementById('tra-rules-modal').classList.add('hidden')}

// ===== Blacklist (黑名单) =====
function loadBlacklist(){
  if(blacklistWords.length===0){
    blacklistWords=[
      {id:'bl1',word:'porn',matchType:'fuzzy',action:'block',status:'active',addedBy:'张三',addedAt:'2026-03-15'},
      {id:'bl2',word:'nude',matchType:'exact',action:'block',status:'active',addedBy:'李四',addedAt:'2026-03-14'},
      {id:'bl3',word:'kill',matchType:'fuzzy',action:'review',status:'active',addedBy:'张三',addedAt:'2026-03-13'},
      {id:'bl4',word:'drug',matchType:'exact',action:'block',status:'active',addedBy:'王五',addedAt:'2026-03-12'},
      {id:'bl5',word:'violence',matchType:'fuzzy',action:'review',status:'active',addedBy:'李四',addedAt:'2026-03-10'},
    ];
  }
  const c=document.getElementById('blacklist-content');
  const pendingAlerts=blacklistWords.filter(b=>b.action==='review');
  c.innerHTML=`
    ${pendingAlerts.length>0?`<div class="bl-alert"><span class="alert-icon">⚠️</span><span class="alert-text">有 ${pendingAlerts.length} 个模糊匹配规则需要人工审核确认</span></div>`:''}
    <div class="card">
      <div class="card-header-row"><h3>黑名单词库 (${blacklistWords.length})</h3></div>
      <table class="bl-table"><thead><tr>
        <th>关键词</th><th>匹配方式</th><th>处置方式</th><th>状态</th><th>添加人</th><th>添加时间</th><th>操作</th>
      </tr></thead><tbody>${blacklistWords.map(b=>`<tr>
        <td style="font-weight:600;color:#e74c3c">${escHtml(b.word)}</td>
        <td><span class="match-type ${b.matchType}">${b.matchType==='exact'?'精确匹配':'模糊匹配'}</span></td>
        <td>${b.action==='block'?'直接拦截':'需人工审核'}</td>
        <td><span class="word-status active">生效中</span></td>
        <td style="color:#888">${b.addedBy}</td>
        <td style="color:#888">${b.addedAt}</td>
        <td><button class="btn-text" onclick="deleteBlacklistWord('${b.id}')">删除</button></td>
      </tr>`).join('')}</tbody></table>
    </div>`;
}
function addBlacklistWord(){
  document.getElementById('blacklist-modal').classList.remove('hidden');
  document.getElementById('bl-modal-body').innerHTML=`
    <div style="display:flex;flex-direction:column;gap:16px">
      <div><label style="font-size:13px;color:#888;display:block;margin-bottom:4px">关键词</label>
        <input type="text" id="bl-new-word" style="width:100%;padding:8px 12px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#e0e0e0;font-size:14px" placeholder="输入要屏蔽的关键词..."></div>
      <div><label style="font-size:13px;color:#888;display:block;margin-bottom:4px">匹配方式</label>
        <label style="font-size:13px;color:#ccc"><input type="radio" name="bl-match" value="exact" checked> 精确匹配</label>
        <label style="font-size:13px;color:#ccc;margin-left:16px"><input type="radio" name="bl-match" value="fuzzy"> 模糊匹配</label></div>
      <div><label style="font-size:13px;color:#888;display:block;margin-bottom:4px">处置方式</label>
        <label style="font-size:13px;color:#ccc"><input type="radio" name="bl-action" value="block" checked> 直接拦截</label>
        <label style="font-size:13px;color:#ccc;margin-left:16px"><input type="radio" name="bl-action" value="review"> 需人工审核</label></div>
      <button class="btn btn-primary" onclick="confirmAddBlacklist()">确认添加</button>
    </div>`;
}
function confirmAddBlacklist(){
  const word=document.getElementById('bl-new-word').value.trim();if(!word){alert('请输入关键词');return}
  const matchType=document.querySelector('input[name="bl-match"]:checked').value;
  const action=document.querySelector('input[name="bl-action"]:checked').value;
  blacklistWords.push({id:'bl'+Date.now(),word,matchType,action,status:'active',addedBy:'当前用户',addedAt:new Date().toISOString().split('T')[0]});
  closeBlacklistModal();loadBlacklist();
}
function deleteBlacklistWord(id){if(!confirm('确认删除？'))return;blacklistWords=blacklistWords.filter(b=>b.id!==id);loadBlacklist()}
function closeBlacklistModal(){document.getElementById('blacklist-modal').classList.add('hidden')}

loadSearchDashboard();
