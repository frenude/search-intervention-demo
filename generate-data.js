const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SR_CONFIG = {
  host: '18.189.20.30', port: 9030, user: 'backend', password: 'JNs4d34Fgk50',
  database: 'flow_event_info', connectTimeout: 15000,
};

async function run() {
  const conn = await mysql.createConnection(SR_CONFIG);
  const outDir = path.join(__dirname, 'public/data');

  async function q(sql) {
    await conn.query('SET query_timeout = 120');
    const [rows] = await conn.query(sql);
    return rows;
  }

  console.log('Generating filters...');
  const countries = await q(`SELECT country, COUNT(*) cnt FROM flow_event_info.tbl_app_event_search
    WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND product_name='flowgpt_app'
      AND country IS NOT NULL AND country != '' GROUP BY country ORDER BY cnt DESC LIMIT 30`);
  const sources = await q(`SELECT DISTINCT query_source FROM flow_event_info.tbl_app_event_search
    WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND product_name='flowgpt_app'
      AND query_source IS NOT NULL AND query_source != '' ORDER BY query_source`);
  fs.writeFileSync(path.join(outDir, 'filters.json'), JSON.stringify({
    countries: countries.map(r => r.country),
    query_sources: sources.map(r => r.query_source),
  }));

  console.log('Generating daily search data (30 days)...');
  const searchRows = await q(`SELECT event_date, COUNT(DISTINCT user_id) search_uv, COUNT(*) search_pv
    FROM flow_event_info.tbl_app_event_search
    WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND product_name='flowgpt_app'
    GROUP BY event_date ORDER BY event_date DESC`);
  const clickRows = await q(`SELECT event_date, COUNT(DISTINCT user_id) click_uv, COUNT(*) click_pv
    FROM flow_event_info.tbl_app_event_bot_view
    WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND source='search' AND product_name='flowgpt_app'
    GROUP BY event_date ORDER BY event_date DESC`);
  const successRows = await q(`SELECT s.event_date,
    COUNT(DISTINCT s.search_id) total_searches,
    COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.search_id END) clicked_searches
    FROM flow_event_info.tbl_app_event_search s
    LEFT JOIN flow_event_info.tbl_app_event_bot_view b ON s.search_id=b.search_id AND b.source='search' AND b.event_date=s.event_date
    WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND s.product_name='flowgpt_app'
    GROUP BY s.event_date ORDER BY s.event_date DESC`);
  const dauRows = await q(`SELECT event_date, COUNT(DISTINCT user_id) dau
    FROM flow_wide_info.tbl_wide_user_daily_info
    WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY event_date ORDER BY event_date DESC`);

  const toDate = d => d ? (typeof d === 'string' ? d.slice(0,10) : new Date(d).toISOString().slice(0,10)) : null;
  const dateMap = {};
  for (const r of searchRows) { const d=toDate(r.event_date); if(!d) continue; dateMap[d]={...(dateMap[d]||{}), search_uv:Number(r.search_uv), search_pv:Number(r.search_pv)}; }
  for (const r of clickRows) { const d=toDate(r.event_date); if(!d) continue; dateMap[d]={...(dateMap[d]||{}), click_uv:Number(r.click_uv), click_pv:Number(r.click_pv)}; }
  for (const r of successRows) { const d=toDate(r.event_date); if(!d) continue; dateMap[d]={...(dateMap[d]||{}), total_searches:Number(r.total_searches), clicked_searches:Number(r.clicked_searches)}; }
  for (const r of dauRows) { const d=toDate(r.event_date); if(!d) continue; dateMap[d]={...(dateMap[d]||{}), dau:Number(r.dau)}; }

  const daily = Object.keys(dateMap).sort((a,b)=>b.localeCompare(a)).map(date => ({
    date, search_uv:dateMap[date].search_uv||0, search_pv:dateMap[date].search_pv||0,
    click_uv:dateMap[date].click_uv||0, click_pv:dateMap[date].click_pv||0,
    total_searches:dateMap[date].total_searches||0, clicked_searches:dateMap[date].clicked_searches||0,
    dau:dateMap[date].dau||0,
  }));
  fs.writeFileSync(path.join(outDir, 'daily.json'), JSON.stringify({ rows: daily }));

  // KPI: latest day vs previous day
  const cur = daily[0] || {};
  const prev = daily[1] || {};
  fs.writeFileSync(path.join(outDir, 'kpi.json'), JSON.stringify({ current: cur, previous: prev }));

  // Hot search ranking for multiple time windows
  for (const days of [1, 3, 7, 30]) {
    console.log(`Generating hot search ranking (${days}d)...`);
    const currentRows = await q(`
      SELECT UPPER(s.search_text) keyword, COUNT(DISTINCT s.user_id) search_uv, COUNT(*) search_pv,
        COUNT(DISTINCT CASE WHEN b.search_id IS NOT NULL THEN s.user_id END) click_uv
      FROM flow_event_info.tbl_app_event_search s
      LEFT JOIN flow_event_info.tbl_app_event_bot_view b ON s.search_id=b.search_id AND b.source='search' AND b.event_date=s.event_date
      WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY) AND s.product_name='flowgpt_app'
        AND s.search_text IS NOT NULL AND s.search_text != ''
      GROUP BY UPPER(s.search_text) ORDER BY search_uv DESC LIMIT 200`);
    const prevRows = await q(`
      SELECT UPPER(s.search_text) keyword, COUNT(DISTINCT s.user_id) search_uv
      FROM flow_event_info.tbl_app_event_search s
      WHERE s.event_date >= DATE_SUB(CURDATE(), INTERVAL ${days*2} DAY) AND s.event_date < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        AND s.product_name='flowgpt_app' AND s.search_text IS NOT NULL AND s.search_text != ''
      GROUP BY UPPER(s.search_text) ORDER BY search_uv DESC LIMIT 400`);
    const prevRankMap = {};
    prevRows.forEach((r,i) => { prevRankMap[r.keyword] = i+1; });
    const ranking = currentRows.map((r,i) => {
      const curRank = i+1;
      const prevRank = prevRankMap[r.keyword] || null;
      let trend = 'new', trendValue = 0;
      if (prevRank !== null) { trendValue = prevRank - curRank; trend = trendValue > 0 ? 'up' : (trendValue < 0 ? 'down' : 'same'); }
      return { rank:curRank, keyword:r.keyword, search_uv:Number(r.search_uv), search_pv:Number(r.search_pv), click_uv:Number(r.click_uv), trend, trend_value:Math.abs(trendValue) };
    });
    fs.writeFileSync(path.join(outDir, `hot-search-${days}d.json`), JSON.stringify({ ranking, days }));
  }

  console.log('Done! Files written to public/data/');
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
