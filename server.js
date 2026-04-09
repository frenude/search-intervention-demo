const express = require('express');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Prod DB (read-only)
const pool = new Pool({
  connectionString: 'postgresql://prod_jan_12:s8vSL5Q6IAR6HwWMY5FXb5JPrgk7xYam@prod-1.cluster-cmg2ypxvbvye.us-east-2.rds.amazonaws.com:5432/prod',
  max: 5,
  idleTimeoutMillis: 30000,
});

// ===== Mock bot data (fallback when DB unavailable) =====
const MOCK_BOTS = [
  {id:'b1',title:'Naruto Uzumaki',description:'The Seventh Hokage of Konohagakure. Energetic, determined ninja.',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:1887127},
  {id:'b2',title:'Gojo Sensei',description:'The strongest jujutsu sorcerer. Infinity and Six Eyes user.',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:1698322},
  {id:'b3',title:'Makima - Control Devil',description:'The mysterious Control Devil from Chainsaw Man.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:1992823},
  {id:'b4',title:'Zero Two - Darling',description:'A half-human, half-klaxo hybrid from DITF.',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:1500000},
  {id:'b5',title:'Raiden Ei',description:'The Electro Archon of Inazuma, eternal ruler.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:1200000},
  {id:'b6',title:'Sukuna - King of Curses',description:'The undisputed King of Curses from ancient times.',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:1100000},
  {id:'b7',title:'Levi Ackerman',description:'Humanity\'s strongest soldier. Captain of Survey Corps.',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:950000},
  {id:'b8',title:'Power - Blood Devil',description:'The chaotic Blood Fiend from Chainsaw Man.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:880000},
  {id:'b9',title:'Yor Forger - Thorn Princess',description:'An assassin pretending to be a loving wife.',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:820000},
  {id:'b10',title:'Marin Kitagawa',description:'A popular gyaru who loves cosplay.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:750000},
  {id:'b11',title:'Toji Fushiguro',description:'The Sorcerer Killer. A non-cursed energy human.',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:700000},
  {id:'b12',title:'Anya Forger',description:'A telepathic child. Waku waku!',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:680000},
  {id:'b13',title:'My AI Girlfriend',description:'Your virtual girlfriend. Sweet, caring and always here.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:2500000},
  {id:'b14',title:'Flirty Chat',description:'A playful, flirty conversation partner.',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:1800000},
  {id:'b15',title:'Roleplay Master',description:'Create any roleplay scenario you can imagine.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:2100000},
  {id:'b16',title:'Horror Escape Room',description:'Trapped in a haunted mansion. Can you survive?',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:600000},
  {id:'b17',title:'AI Therapist',description:'A supportive AI counselor for mental wellness.',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:950000},
  {id:'b18',title:'Vampire Prince',description:'An ancient vampire who just awakened in the modern world.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:550000},
  {id:'b19',title:'School Crush',description:'Your classmate who secretly likes you.',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:1300000},
  {id:'b20',title:'Love Story Generator',description:'Create beautiful love stories with AI.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:780000},
  {id:'b21',title:'Sasuke Uchiha',description:'The last surviving Uchiha. Rival of Naruto.',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:1400000},
  {id:'b22',title:'Hinata Hyuga',description:'The gentle princess of the Hyuga clan.',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:900000},
  {id:'b23',title:'Itachi Uchiha',description:'The tragic prodigy who sacrificed everything.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:1100000},
  {id:'b24',title:'Kakashi Sensei',description:'Copy Ninja Kakashi. The Sixth Hokage.',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:850000},
  {id:'b25',title:'Denji - Chainsaw Man',description:'A devil hunter who merged with Pochita.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:1050000},
  {id:'b26',title:'Megumi Fushiguro',description:'A talented jujutsu sorcerer with Ten Shadows.',avatar:'https://image-cdn.flowgpt.com/trans-images/656a0612-927f-4c09-b78f-4fe6eceb4df5.webp',uses:730000},
  {id:'b27',title:'Eren Yeager',description:'The boy who keeps moving forward.',avatar:'https://image-cdn.flowgpt.com/trans-images/d712a3fe-e6af-43d3-b97b-07a773cfb9ea.webp',uses:1600000},
  {id:'b28',title:'Mikasa Ackerman',description:'Devoted soldier and protector of Eren.',avatar:'https://image-cdn.flowgpt.com/trans-images/a126da48-cd02-410a-8362-1f720108a535.webp',uses:1200000},
  {id:'b29',title:'Luffy - Straw Hat',description:'The future King of Pirates!',avatar:'https://image-cdn.flowgpt.com/trans-images/avatars/JmOq44HspdMX8LC_ikIa3/1714850088409.webp',uses:1900000},
  {id:'b30',title:'Nezuko Kamado',description:'A demon who protects humans. Tanjiro\'s sister.',avatar:'https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Minimalist/i13.png',uses:1350000},
];

function getMockBots(q, limit) {
  let bots = [...MOCK_BOTS];
  if (q) bots = bots.filter(b => b.title.toLowerCase().includes(q.toLowerCase()) || b.description.toLowerCase().includes(q.toLowerCase()));
  bots = bots.slice(0, parseInt(limit) || 30);
  return bots.map(bot => {
    const seed = hashCode(bot.id);
    const ctr = (0.05 + (Math.abs(seed % 100) / 100) * 0.45).toFixed(3);
    const cvr = (0.02 + (Math.abs((seed >> 8) % 100) / 100) * 0.25).toFixed(3);
    return { ...bot, ctr: parseFloat(ctr), cvr: parseFloat(cvr), ctr_x_cvr: parseFloat((ctr * cvr).toFixed(5)), chat_count: Math.floor(bot.uses * parseFloat(cvr)) };
  });
}

// ===== API: Get bots (try DB, fallback to mock) =====
app.get('/api/bots/search', async (req, res) => {
  const { q, limit = 30, offset = 0 } = req.query;
  try {
    let query, params;
    if (q) {
      query = `SELECT p.id, p.title, LEFT(p.description, 200) as description, p."thumbnailURL" as avatar, p.views, p.uses, p.impressions FROM "Prompt" p WHERE p.live = true AND p.visibility = true AND p."deletedAt" IS NULL AND p.type = 'CHATBOT' AND (LOWER(p.title) LIKE LOWER($1) OR LOWER(p.description) LIKE LOWER($1)) ORDER BY p.uses DESC LIMIT $2 OFFSET $3`;
      params = [`%${q}%`, parseInt(limit), parseInt(offset)];
    } else {
      query = `SELECT p.id, p.title, LEFT(p.description, 200) as description, p."thumbnailURL" as avatar, p.views, p.uses, p.impressions FROM "Prompt" p WHERE p.live = true AND p.visibility = true AND p."deletedAt" IS NULL AND p.type = 'CHATBOT' ORDER BY p.uses DESC LIMIT $1 OFFSET $2`;
      params = [parseInt(limit), parseInt(offset)];
    }
    const result = await pool.query(query, params);
    const bots = result.rows.map(bot => {
      const seed = hashCode(bot.id);
      const ctr = (0.05 + (Math.abs(seed % 100) / 100) * 0.45).toFixed(3);
      const cvr = (0.02 + (Math.abs((seed >> 8) % 100) / 100) * 0.25).toFixed(3);
      return { ...bot, ctr: parseFloat(ctr), cvr: parseFloat(cvr), ctr_x_cvr: parseFloat((ctr * cvr).toFixed(5)), chat_count: Math.floor(bot.uses * parseFloat(cvr)) };
    });
    res.json({ items: bots, total: bots.length });
  } catch (err) {
    console.error('DB fallback to mock:', err.message);
    res.json({ items: getMockBots(q, limit), total: 30 });
  }
});

// Get tags for a bot
app.get('/api/bots/:botId/tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.name FROM "Tag" t
      JOIN "_PromptToTag" pt ON pt."B" = t.id
      WHERE pt."A" = $1
      LIMIT 10
    `, [req.params.botId]);
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    res.json([]);
  }
});

// ===== Mock data for search terms =====
const MOCK_ENTITIES = [
  { id: 'e1', name: 'Naruto', type: 'character', keywords: ['naruto', 'uzumaki naruto', '鳴人', 'naruto uzumaki'] },
  { id: 'e2', name: 'Gojo Satoru', type: 'character', keywords: ['gojo', 'gojo satoru', '五条悟', 'satoru gojo'] },
  { id: 'e3', name: 'Makima', type: 'character', keywords: ['makima', 'chainsaw man makima', 'マキマ'] },
  { id: 'e4', name: 'Zero Two', type: 'character', keywords: ['zero two', '02', 'darling in the franxx'] },
  { id: 'e5', name: 'Raiden Shogun', type: 'character', keywords: ['raiden shogun', 'ei', 'raiden', 'baal'] },
  { id: 'e6', name: 'Attack on Titan', type: 'work', keywords: ['aot', 'attack on titan', 'shingeki no kyojin', '进击的巨人'] },
  { id: 'e7', name: 'Jujutsu Kaisen', type: 'work', keywords: ['jjk', 'jujutsu kaisen', '咒术回战'] },
  { id: 'e8', name: 'Demon Slayer', type: 'work', keywords: ['demon slayer', 'kimetsu no yaiba', '鬼灭之刃'] },
  { id: 'e9', name: 'Genshin Impact', type: 'work', keywords: ['genshin', 'genshin impact', '原神'] },
  { id: 'e10', name: 'One Piece', type: 'work', keywords: ['one piece', 'luffy', '海贼王'] },
  { id: 'e11', name: 'Marin Kitagawa', type: 'character', keywords: ['marin', 'kitagawa', 'my dress-up darling'] },
  { id: 'e12', name: 'Yor Forger', type: 'character', keywords: ['yor', 'yor forger', 'spy x family yor'] },
  { id: 'e13', name: 'Power', type: 'character', keywords: ['power', 'chainsaw man power', 'パワー'] },
  { id: 'e14', name: 'Anya Forger', type: 'character', keywords: ['anya', 'anya forger', 'spy x family anya'] },
  { id: 'e15', name: 'Tokyo Revengers', type: 'work', keywords: ['tokyo revengers', 'tokyorev'] },
  { id: 'e16', name: 'Sukuna', type: 'character', keywords: ['sukuna', 'ryomen sukuna', '宿儺'] },
  { id: 'e17', name: 'Toji Fushiguro', type: 'character', keywords: ['toji', 'toji fushiguro', '伏黒甚爾'] },
  { id: 'e18', name: 'Levi Ackerman', type: 'character', keywords: ['levi', 'levi ackerman', 'captain levi'] },
  { id: 'e19', name: 'Chainsaw Man', type: 'work', keywords: ['chainsaw man', 'csm', 'チェンソーマン'] },
  { id: 'e20', name: 'Spy x Family', type: 'work', keywords: ['spy x family', 'spy family', 'spyxfamily'] },
  { id: 'e21', name: 'girlfriend', type: 'generic', keywords: ['girlfriend', 'gf', 'my girlfriend'] },
  { id: 'e22', name: 'sexy chat', type: 'generic', keywords: ['sexy chat', 'sexy', 'hot chat'] },
  { id: 'e23', name: 'roleplay', type: 'generic', keywords: ['roleplay', 'rp', 'role play'] },
  { id: 'e24', name: 'AI boyfriend', type: 'generic', keywords: ['ai boyfriend', 'boyfriend ai', 'virtual boyfriend'] },
  { id: 'e25', name: 'love story', type: 'generic', keywords: ['love story', 'romance', 'love'] },
  { id: 'e26', name: 'horror game', type: 'generic', keywords: ['horror', 'horror game', 'scary'] },
  { id: 'e27', name: 'therapist', type: 'generic', keywords: ['therapist', 'therapy', 'counselor'] },
  { id: 'e28', name: 'vampire', type: 'generic', keywords: ['vampire', 'vampiro', 'dracula'] },
  { id: 'e29', name: 'flirt', type: 'generic', keywords: ['flirt', 'flirting', 'coqueteo'] },
  { id: 'e30', name: 'school crush', type: 'generic', keywords: ['school crush', 'crush', 'classmate'] },
];

// Generate consistent mock metrics per entity
function generateMockMetrics(entityId, days = 30) {
  const seed = hashCode(entityId);
  const baseVolume = 500 + Math.abs(seed % 5000);
  const baseUV = Math.floor(baseVolume * (0.5 + (Math.abs(seed >> 4) % 50) / 100));
  const baseSuccessRate = 0.08 + (Math.abs(seed >> 8) % 40) / 100;
  
  const metrics = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const noise = 0.85 + Math.random() * 0.3;
    const vol = Math.floor(baseVolume * noise);
    const uv = Math.floor(baseUV * noise);
    const resultRate = Math.min(0.99, 0.85 + Math.random() * 0.14);
    const clickRate = Math.min(0.7, (baseSuccessRate + 0.15) * (0.8 + Math.random() * 0.4));
    const chatRate = Math.min(clickRate, baseSuccessRate * (0.8 + Math.random() * 0.4));
    metrics.push({ date: dateStr, volume: vol, uv, result_rate: resultRate, click_rate: clickRate, chat_rate: chatRate });
  }
  return metrics;
}

app.get('/api/search-terms', (req, res) => {
  const { period = 'daily', entity_type = 'all', sort = 'volume', page = 1, page_size = 20 } = req.query;
  let entities = [...MOCK_ENTITIES];
  if (entity_type !== 'all') entities = entities.filter(e => e.type === entity_type);
  
  const periodDays = period === 'daily' ? 1 : period === '3day' ? 3 : 7;
  
  const result = entities.map(e => {
    const allMetrics = generateMockMetrics(e.id);
    const periodMetrics = allMetrics.slice(0, periodDays);
    const volume = periodMetrics.reduce((s, m) => s + m.volume, 0);
    const uv = periodMetrics.reduce((s, m) => s + m.uv, 0);
    const chatRate = periodMetrics.reduce((s, m) => s + m.chat_rate, 0) / periodDays;
    const clickRate = periodMetrics.reduce((s, m) => s + m.click_rate, 0) / periodDays;
    const resultRate = periodMetrics.reduce((s, m) => s + m.result_rate, 0) / periodDays;
    return {
      ...e,
      search_volume: volume,
      search_uv: uv,
      success_rate: chatRate,
      click_rate: clickRate,
      result_rate: resultRate,
      intervention_status: 'none',
    };
  });

  if (sort === 'volume') result.sort((a, b) => b.search_volume - a.search_volume);
  else if (sort === 'success_rate') result.sort((a, b) => a.success_rate - b.success_rate);
  else if (sort === 'uv') result.sort((a, b) => b.search_uv - a.search_uv);

  res.json({ items: result, total: result.length });
});

app.get('/api/search-terms/:entityId', (req, res) => {
  const entity = MOCK_ENTITIES.find(e => e.id === req.params.entityId);
  if (!entity) return res.status(404).json({ error: 'Not found' });
  const metrics = generateMockMetrics(entity.id);
  res.json({ ...entity, metrics });
});

// ===== Intervention plans (in-memory store for demo) =====
const plans = new Map();
let planCounter = 0;

app.post('/api/intervention-plans', (req, res) => {
  const { entity_id, interventions } = req.body;
  // Validate non-consecutive positions
  const positions = interventions.map(i => i.position).sort((a, b) => a - b);
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] - positions[i-1] < 2) {
      return res.status(400).json({ error: `位次 ${positions[i-1]} 和 ${positions[i]} 不满足间隔≥2的规则` });
    }
  }
  const planId = `plan_${++planCounter}`;
  const plan = {
    plan_id: planId,
    entity_id,
    version: 1,
    status: 'draft',
    interventions,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  plans.set(planId, plan);
  res.json(plan);
});

app.get('/api/intervention-plans', (req, res) => {
  res.json({ items: Array.from(plans.values()), total: plans.size });
});

app.get('/api/intervention-plans/:planId', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  res.json(plan);
});

app.put('/api/intervention-plans/:planId', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  if (plan.status !== 'draft') return res.status(400).json({ error: '只有草稿状态可编辑' });
  const { interventions } = req.body;
  if (interventions) {
    const positions = interventions.map(i => i.position).sort((a, b) => a - b);
    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - positions[i-1] < 2) {
        return res.status(400).json({ error: `位次 ${positions[i-1]} 和 ${positions[i]} 不满足间隔≥2的规则` });
      }
    }
    plan.interventions = interventions;
  }
  plan.updated_at = new Date().toISOString();
  res.json(plan);
});

app.post('/api/intervention-plans/:planId/submit', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  plan.status = 'pending_review';
  plan.submitted_at = new Date().toISOString();
  res.json(plan);
});

app.post('/api/intervention-plans/:planId/approve', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  plan.status = 'approved';
  res.json(plan);
});

app.post('/api/intervention-plans/:planId/reject', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  plan.status = 'draft';
  plan.reject_reason = req.body.reason;
  res.json(plan);
});

app.post('/api/intervention-plans/:planId/publish', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  plan.status = 'published';
  plan.published_at = new Date().toISOString();
  res.json(plan);
});

app.post('/api/intervention-plans/:planId/rollback', (req, res) => {
  const plan = plans.get(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Not found' });
  plan.status = 'rolled_back';
  res.json(plan);
});

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

// ===== StarRocks Connection Pool =====
const srPool = mysql.createPool({
  host: '18.189.20.30',
  port: 9030,
  user: 'backend',
  password: 'JNs4d34Fgk50',
  database: 'flow_event_info',
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 15000,
  enableKeepAlive: true,
});

// Helper: run StarRocks query with timeout
async function srQuery(sql, params = [], timeoutMs = 30000) {
  const conn = await srPool.getConnection();
  try {
    await conn.query(`SET query_timeout = ${Math.floor(timeoutMs / 1000)}`);
    const [rows] = await conn.query(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

// ===== Search Dashboard APIs =====

// GET /api/search-dashboard/filters
app.get('/api/search-dashboard/filters', async (req, res) => {
  try {
    const [countries, sources] = await Promise.all([
      srQuery(`SELECT country, COUNT(*) AS cnt FROM flow_event_info.tbl_app_event_search
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND product_name = 'flowgpt_app'
          AND country IS NOT NULL AND country != ''
        GROUP BY country ORDER BY cnt DESC LIMIT 30`, [], 15000),
      srQuery(`SELECT DISTINCT query_source FROM flow_event_info.tbl_app_event_search
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND product_name = 'flowgpt_app'
          AND query_source IS NOT NULL AND query_source != ''
        ORDER BY query_source`, [], 15000),
    ]);
    res.json({
      countries: countries.map(r => r.country),
      query_sources: sources.map(r => r.query_source),
    });
  } catch (err) {
    console.error('filters error:', err.message);
    res.json({ countries: [], query_sources: ['custom', 'hot', 'scroll_hot', 'history'], error: err.message });
  }
});

// GET /api/search-dashboard/kpi?days=1&query_source=&country=
app.get('/api/search-dashboard/kpi', async (req, res) => {
  const days = parseInt(req.query.days) || 1;
  const qs = req.query.query_source || '';
  const country = req.query.country || '';

  // Build WHERE extras
  let searchWhere = "AND product_name = 'flowgpt_app'";
  let clickWhere = "AND source = 'search' AND product_name = 'flowgpt_app'";
  if (qs) { searchWhere += ` AND query_source = '${qs.replace(/'/g, "''")}'`; }
  if (country) {
    searchWhere += ` AND country = '${country.replace(/'/g, "''")}'`;
    clickWhere += ` AND country = '${country.replace(/'/g, "''")}'`;
  }

  try {
    // Current period
    const [searchCur, clickCur, successCur, dauCur] = await Promise.all([
      srQuery(`SELECT COUNT(DISTINCT user_id) AS search_uv, COUNT(*) AS search_pv
        FROM flow_event_info.tbl_app_event_search
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND event_date < CURDATE() ${searchWhere}`),
      srQuery(`SELECT COUNT(DISTINCT user_id) AS click_uv, COUNT(*) AS click_pv
        FROM flow_event_info.tbl_app_event_bot_view
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND event_date < CURDATE() ${clickWhere}`),
      srQuery(`SELECT COUNT(DISTINCT s.search_id) AS total_searches,
        COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.search_id END) AS clicked_searches
        FROM flow_event_info.tbl_app_event_search s
        LEFT JOIN flow_event_info.tbl_app_event_bot_view b
          ON s.search_id = b.search_id AND b.source = 'search' AND b.event_date = s.event_date
        WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND s.event_date < CURDATE()
          AND s.product_name = 'flowgpt_app'
          ${qs ? `AND s.query_source = '${qs.replace(/'/g, "''")}'` : ''}
          ${country ? `AND s.country = '${country.replace(/'/g, "''")}'` : ''}`),
      srQuery(`SELECT COUNT(DISTINCT user_id) AS dau
        FROM flow_wide_info.tbl_wide_user_daily_info
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND event_date < CURDATE()`),
    ]);

    // Previous period for comparison
    const [searchPrev, clickPrev, successPrev, dauPrev] = await Promise.all([
      srQuery(`SELECT COUNT(DISTINCT user_id) AS search_uv, COUNT(*) AS search_pv
        FROM flow_event_info.tbl_app_event_search
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY) AND event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY) ${searchWhere}`),
      srQuery(`SELECT COUNT(DISTINCT user_id) AS click_uv, COUNT(*) AS click_pv
        FROM flow_event_info.tbl_app_event_bot_view
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY) AND event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY) ${clickWhere}`),
      srQuery(`SELECT COUNT(DISTINCT s.search_id) AS total_searches,
        COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.search_id END) AS clicked_searches
        FROM flow_event_info.tbl_app_event_search s
        LEFT JOIN flow_event_info.tbl_app_event_bot_view b
          ON s.search_id = b.search_id AND b.source = 'search' AND b.event_date = s.event_date
        WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY) AND s.event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
          AND s.product_name = 'flowgpt_app'
          ${qs ? `AND s.query_source = '${qs.replace(/'/g, "''")}'` : ''}
          ${country ? `AND s.country = '${country.replace(/'/g, "''")}'` : ''}`),
      srQuery(`SELECT COUNT(DISTINCT user_id) AS dau
        FROM flow_wide_info.tbl_wide_user_daily_info
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY) AND event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`),
    ]);

    const cur = {
      search_uv: Number(searchCur[0]?.search_uv || 0),
      search_pv: Number(searchCur[0]?.search_pv || 0),
      click_uv: Number(clickCur[0]?.click_uv || 0),
      click_pv: Number(clickCur[0]?.click_pv || 0),
      total_searches: Number(successCur[0]?.total_searches || 0),
      clicked_searches: Number(successCur[0]?.clicked_searches || 0),
      dau: Number(dauCur[0]?.dau || 0),
    };
    const prev = {
      search_uv: Number(searchPrev[0]?.search_uv || 0),
      search_pv: Number(searchPrev[0]?.search_pv || 0),
      click_uv: Number(clickPrev[0]?.click_uv || 0),
      click_pv: Number(clickPrev[0]?.click_pv || 0),
      total_searches: Number(successPrev[0]?.total_searches || 0),
      clicked_searches: Number(successPrev[0]?.clicked_searches || 0),
      dau: Number(dauPrev[0]?.dau || 0),
    };

    res.json({ current: cur, previous: prev });
  } catch (err) {
    console.error('kpi error:', err.message);
    res.json({ current: {}, previous: {}, error: err.message });
  }
});

// GET /api/search-dashboard/daily?days=30&query_source=&country=
app.get('/api/search-dashboard/daily', async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const qs = req.query.query_source || '';
  const country = req.query.country || '';

  let searchWhere = "AND product_name = 'flowgpt_app'";
  let clickWhere = "AND source = 'search' AND product_name = 'flowgpt_app'";
  if (qs) { searchWhere += ` AND query_source = '${qs.replace(/'/g, "''")}'`; }
  if (country) {
    searchWhere += ` AND country = '${country.replace(/'/g, "''")}'`;
    clickWhere += ` AND country = '${country.replace(/'/g, "''")}'`;
  }

  try {
    const [searchRows, clickRows, successRows, dauRows] = await Promise.all([
      srQuery(`SELECT event_date, COUNT(DISTINCT user_id) AS search_uv, COUNT(*) AS search_pv
        FROM flow_event_info.tbl_app_event_search
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) ${searchWhere}
        GROUP BY event_date ORDER BY event_date DESC`),
      srQuery(`SELECT event_date, COUNT(DISTINCT user_id) AS click_uv, COUNT(*) AS click_pv
        FROM flow_event_info.tbl_app_event_bot_view
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) ${clickWhere}
        GROUP BY event_date ORDER BY event_date DESC`),
      srQuery(`SELECT s.event_date,
        COUNT(DISTINCT s.search_id) AS total_searches,
        COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.search_id END) AS clicked_searches
        FROM flow_event_info.tbl_app_event_search s
        LEFT JOIN flow_event_info.tbl_app_event_bot_view b
          ON s.search_id = b.search_id AND b.source = 'search' AND b.event_date = s.event_date
        WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
          AND s.product_name = 'flowgpt_app'
          ${qs ? `AND s.query_source = '${qs.replace(/'/g, "''")}'` : ''}
          ${country ? `AND s.country = '${country.replace(/'/g, "''")}'` : ''}
        GROUP BY s.event_date ORDER BY s.event_date DESC`),
      srQuery(`SELECT event_date, COUNT(DISTINCT user_id) AS dau
        FROM flow_wide_info.tbl_wide_user_daily_info
        WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        GROUP BY event_date ORDER BY event_date DESC`),
    ]);

    // Merge by date
    const dateMap = {};
    const toDateStr = (d) => {
      if (!d) return null;
      if (typeof d === 'string') return d.slice(0, 10);
      return new Date(d).toISOString().slice(0, 10);
    };
    for (const r of searchRows) {
      const d = toDateStr(r.event_date); if (!d) continue;
      if (!dateMap[d]) dateMap[d] = {};
      dateMap[d].search_uv = Number(r.search_uv);
      dateMap[d].search_pv = Number(r.search_pv);
    }
    for (const r of clickRows) {
      const d = toDateStr(r.event_date); if (!d) continue;
      if (!dateMap[d]) dateMap[d] = {};
      dateMap[d].click_uv = Number(r.click_uv);
      dateMap[d].click_pv = Number(r.click_pv);
    }
    for (const r of successRows) {
      const d = toDateStr(r.event_date); if (!d) continue;
      if (!dateMap[d]) dateMap[d] = {};
      dateMap[d].total_searches = Number(r.total_searches);
      dateMap[d].clicked_searches = Number(r.clicked_searches);
    }
    for (const r of dauRows) {
      const d = toDateStr(r.event_date); if (!d) continue;
      if (!dateMap[d]) dateMap[d] = {};
      dateMap[d].dau = Number(r.dau);
    }

    const rows = Object.keys(dateMap).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      search_uv: dateMap[date].search_uv || 0,
      search_pv: dateMap[date].search_pv || 0,
      click_uv: dateMap[date].click_uv || 0,
      click_pv: dateMap[date].click_pv || 0,
      total_searches: dateMap[date].total_searches || 0,
      clicked_searches: dateMap[date].clicked_searches || 0,
      dau: dateMap[date].dau || 0,
    }));

    res.json({ rows });
  } catch (err) {
    console.error('daily error:', err.message);
    res.json({ rows: [], error: err.message });
  }
});

// GET /api/hot-search/ranking?days=7&query_source=&country=&limit=50
app.get('/api/hot-search/ranking', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const limit = parseInt(req.query.limit) || 50;
  const qs = req.query.query_source || '';
  const country = req.query.country || '';

  let extraWhere = '';
  if (qs) extraWhere += ` AND s.query_source = '${qs.replace(/'/g, "''")}'`;
  if (country) extraWhere += ` AND s.country = '${country.replace(/'/g, "''")}'`;

  try {
    // Current window
    const currentRows = await srQuery(`
      SELECT UPPER(s.search_text) AS keyword,
        COUNT(DISTINCT s.user_id) AS search_uv,
        COUNT(*) AS search_pv,
        COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.user_id END) AS click_uv
      FROM flow_event_info.tbl_app_event_search s
      LEFT JOIN flow_event_info.tbl_app_event_bot_view b
        ON s.search_id = b.search_id AND b.source = 'search' AND b.event_date = s.event_date
      WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        AND s.product_name = 'flowgpt_app'
        AND s.search_text IS NOT NULL AND s.search_text != ''
        ${extraWhere}
      GROUP BY UPPER(s.search_text)
      ORDER BY search_uv DESC
      LIMIT ${limit}
    `, [], 60000);

    // Previous window for rank change
    const prevRows = await srQuery(`
      SELECT UPPER(s.search_text) AS keyword,
        COUNT(DISTINCT s.user_id) AS search_uv
      FROM flow_event_info.tbl_app_event_search s
      WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY)
        AND s.event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        AND s.product_name = 'flowgpt_app'
        AND s.search_text IS NOT NULL AND s.search_text != ''
        ${extraWhere}
      GROUP BY UPPER(s.search_text)
      ORDER BY search_uv DESC
      LIMIT ${limit * 2}
    `, [], 60000);

    // Build prev rank map
    const prevRankMap = {};
    prevRows.forEach((r, i) => { prevRankMap[r.keyword] = i + 1; });

    const ranking = currentRows.map((r, i) => {
      const curRank = i + 1;
      const prevRank = prevRankMap[r.keyword] || null;
      let trend = 'new';
      let trendValue = 0;
      if (prevRank !== null) {
        trendValue = prevRank - curRank;
        if (trendValue > 0) trend = 'up';
        else if (trendValue < 0) trend = 'down';
        else trend = 'same';
      }
      return {
        rank: curRank,
        keyword: r.keyword,
        search_uv: Number(r.search_uv),
        search_pv: Number(r.search_pv),
        click_uv: Number(r.click_uv),
        trend,
        trend_value: Math.abs(trendValue),
      };
    });

    res.json({ ranking, days, limit });
  } catch (err) {
    console.error('hot-search ranking error:', err.message);
    res.json({ ranking: [], days, limit, error: err.message });
  }
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Search intervention demo running on http://localhost:${PORT}`);
});
