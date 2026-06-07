module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const SUPABASE_URL = "https://bheziohaquiwnvbzrlio.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const FOOTBALL_KEY = "7b202a7eafec421fbfe1b5eb2d3749bb";

  if (!SUPABASE_KEY) {
    return res.status(500).json({ ok: false, error: "Missing SUPABASE_SERVICE_KEY" });
  }

  async function sbPatch(table, id, body) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function sbPost(table, body) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    });
  }

  async function sbGet(path) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    return r.json();
  }

  const FLAG = (code) => code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";

  const TEAM_FLAGS = {
    "Mexico":"mx","South Africa":"za","South Korea":"kr","Czechia":"cz",
    "Canada":"ca","Bosnia and Herzegovina":"ba","Qatar":"qa","Switzerland":"ch",
    "Brazil":"br","Morocco":"ma","Haiti":"ht","Scotland":"gb-sct",
    "USA":"us","United States":"us","Paraguay":"py","Australia":"au","Turkey":"tr","Türkiye":"tr",
    "Germany":"de","Curaçao":"cw","Ivory Coast":"ci","Ecuador":"ec",
    "Netherlands":"nl","Japan":"jp","Sweden":"se","Tunisia":"tn",
    "Belgium":"be","Egypt":"eg","Iran":"ir","New Zealand":"nz",
    "Spain":"es","Cape Verde":"cv","Saudi Arabia":"sa","Uruguay":"uy",
    "France":"fr","Senegal":"sn","Iraq":"iq","Norway":"no",
    "Argentina":"ar","Algeria":"dz","Austria":"at","Jordan":"jo",
    "Portugal":"pt","DR Congo":"cd","Uzbekistan":"uz","Colombia":"co",
    "England":"gb-eng","Croatia":"hr","Ghana":"gh","Panama":"pa",
  };

  const NAMES_ES = {
    "Mexico":"México","South Africa":"Sudáfrica","South Korea":"Corea del Sur","Czechia":"Chequia",
    "Canada":"Canadá","Bosnia and Herzegovina":"Bosnia","Qatar":"Qatar","Switzerland":"Suiza",
    "Brazil":"Brasil","Morocco":"Marruecos","Haiti":"Haití","Scotland":"Escocia",
    "USA":"USA","United States":"USA","Paraguay":"Paraguay","Australia":"Australia","Turkey":"Türkiye","Türkiye":"Türkiye",
    "Germany":"Alemania","Curaçao":"Curazao","Ivory Coast":"Costa de Marfil","Ecuador":"Ecuador",
    "Netherlands":"Países Bajos","Japan":"Japón","Sweden":"Suecia","Tunisia":"Túnez",
    "Belgium":"Bélgica","Egypt":"Egipto","Iran":"Irán","New Zealand":"Nueva Zelanda",
    "Spain":"España","Cape Verde":"Cabo Verde","Saudi Arabia":"Arabia Saudita","Uruguay":"Uruguay",
    "France":"Francia","Senegal":"Senegal","Iraq":"Irak","Norway":"Noruega",
    "Argentina":"Argentina","Algeria":"Argelia","Austria":"Austria","Jordan":"Jordania",
    "Portugal":"Portugal","DR Congo":"Congo DR","Uzbekistan":"Uzbekistán","Colombia":"Colombia",
    "England":"Inglaterra","Croatia":"Croacia","Ghana":"Ghana","Panama":"Panamá",
  };

  const PHASE_MAP = {
    "GROUP_STAGE":"Grupos","LAST_32":"Octavos","LAST_16":"Cuartos",
    "QUARTER_FINALS":"Cuartos","SEMI_FINALS":"Semifinal","THIRD_PLACE":"3er Lugar","FINAL":"Final",
  };

  const GROUP_MAP = {
    "GROUP_A":"A","GROUP_B":"B","GROUP_C":"C","GROUP_D":"D",
    "GROUP_E":"E","GROUP_F":"F","GROUP_G":"G","GROUP_H":"H",
    "GROUP_I":"I","GROUP_J":"J","GROUP_K":"K","GROUP_L":"L",
  };

  const tName = (n) => NAMES_ES[n] || n;
  const tFlag = (n) => FLAG(TEAM_FLAGS[n] || "");
  const fmtDate = (d) => {
    const dt = new Date(d);
    const m = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${m[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
  };
  const fmtTime = (d) => {
    const dt = new Date(d);
    const h = ((dt.getUTCHours() - 4 + 24) % 24).toString().padStart(2,"0");
    const mm = dt.getUTCMinutes().toString().padStart(2,"0");
    return `${h}:${mm} ET`;
  };

  try {
    const apiRes = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": FOOTBALL_KEY },
    });
    const apiData = await apiRes.json();
    if (!apiData.matches) return res.status(500).json({ ok: false, error: "No matches from API" });

    const dbMatches = await sbGet("matches?select=*&order=kickoff_at");
    const rules = await sbGet("scoring_rules?select=*");
    const ruleMap = {};
    rules.forEach(r => { ruleMap[r.rule_key] = r.rule_value; });

    let updated = 0, created = 0;

    for (const m of apiData.matches) {
      const homeName = m.homeTeam?.name;
      const awayName = m.awayTeam?.name;
      if (!homeName || !awayName) continue;

      const phase = PHASE_MAP[m.stage] || "Grupos";
      const group = GROUP_MAP[m.group] || null;
      const kickoff = m.utcDate;
      const status = m.status;

      const existing = dbMatches.find(db => {
        if (phase === "Grupos") return db.home === tName(homeName) && db.away === tName(awayName);
        return Math.abs(new Date(db.kickoff_at).getTime() - new Date(kickoff).getTime()) < 60000;
      });

      if (status === "FINISHED") {
        const homeScore = m.score?.fullTime?.home;
        const awayScore = m.score?.fullTime?.away;
        if (homeScore === null || homeScore === undefined) continue;

        if (existing && existing.status !== "finished") {
          await sbPatch("matches", existing.id, {
            home_score: homeScore, away_score: awayScore, status: "finished",
            home: tName(homeName), away: tName(awayName),
            home_flag: tFlag(homeName), away_flag: tFlag(awayName),
          });

          const isKnockout = phase !== "Grupos";
          const exactPts = isKnockout ? (ruleMap["exact_score_knockout"]||6) : (ruleMap["exact_score_groups"]||3);
          const resultPts = isKnockout ? (ruleMap["correct_result_knockout"]||2) : (ruleMap["correct_result_groups"]||1);
          const realResult = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";

          const preds = await sbGet(`predictions?match_id=eq.${existing.id}&select=*`);
          for (const pred of preds) {
            let pts = 0;
            if (pred.home_score === homeScore && pred.away_score === awayScore) pts = exactPts;
            else {
              const pr = pred.home_score > pred.away_score ? "home" : pred.away_score > pred.home_score ? "away" : "draw";
              if (pr === realResult) pts = resultPts;
            }
            await sbPatch("predictions", pred.id, { points: pts });
          }
          updated++;
        } else if (!existing && phase !== "Grupos") {
          await sbPost("matches", {
            group_name: group || phase, home: tName(homeName), home_flag: tFlag(homeName),
            away: tName(awayName), away_flag: tFlag(awayName),
            match_date: fmtDate(kickoff), match_time: fmtTime(kickoff),
            kickoff_at: kickoff, home_score: homeScore, away_score: awayScore,
            status: "finished", stage: phase, phase,
          });
          created++;
        }
      } else if ((status === "SCHEDULED" || status === "TIMED") && phase !== "Grupos") {
        if (!homeName.includes("Winner") && !homeName.includes("Loser") && !homeName.includes("Match")) {
          if (!existing) {
            await sbPost("matches", {
              group_name: group || phase, home: tName(homeName), home_flag: tFlag(homeName),
              away: tName(awayName), away_flag: tFlag(awayName),
              match_date: fmtDate(kickoff), match_time: fmtTime(kickoff),
              kickoff_at: kickoff, status: "upcoming", stage: phase, phase,
            });
            created++;
          } else {
            await sbPatch("matches", existing.id, {
              home: tName(homeName), home_flag: tFlag(homeName),
              away: tName(awayName), away_flag: tFlag(awayName),
            });
          }
        }
      }
    }

    await sbPost("sync_log", { matches_updated: updated, matches_created: created });
    return res.status(200).json({ ok: true, updated, created });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
