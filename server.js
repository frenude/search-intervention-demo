const express = require('express');
const { Pool } = require('pg');
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

const PORT = process.env.PORT || 3456;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Search intervention demo running on http://localhost:${PORT}`);
});
