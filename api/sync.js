const SUPABASE_URL = "https://bheziohaquiwnvbzrlio.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const FOOTBALL_API_KEY = "7b202a7eafec421fbfe1b5eb2d3749bb";

const FLAG = (code) => code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";

const TEAM_FLAGS = {
  "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czechia": "cz",
  "Canada": "ca", "Bosnia and Herzegovina": "ba", "Qatar": "qa", "Switzerland": "ch",
  "Brazil": "br", "Morocco": "ma", "Haiti": "ht", "Scotland": "gb-sct",
  "USA": "us", "United States": "us", "Paraguay": "py", "Australia": "au", "Turkey": "tr", "Türkiye": "tr",
  "Germany": "de", "Curaçao": "cw", "Ivory Coast": "ci", "Ecuador": "ec",
  "Netherlands": "nl", "Japan": "jp", "Sweden": "se", "Tunisia": "tn",
  "Belgium": "be", "Egypt": "eg", "Iran": "ir", "New Zealand": "nz",
  "Spain": "es", "Cape Verde": "cv", "Saudi Arabia": "sa", "Uruguay": "uy",
  "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
  "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
  "Portugal": "pt", "DR Congo": "cd", "Uzbekistan": "uz", "Colombia": "co",
  "England": "gb-eng", "Croatia": "hr", "Ghana": "gh", "Panama": "pa",
};

const TEAM_NAMES_ES = {
  "Mexico": "México", "South Africa": "Sudáfrica", "South Korea": "Corea del Sur",
  "Czechia": "Chequia", "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia",
  "Qatar": "Qatar", "Switzerland": "Suiza", "Brazil": "Brasil", "Morocco": "Marruecos",
  "Haiti": "Haití", "Scotland": "Escocia", "USA": "USA", "United States": "USA",
  "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Türkiye", "Türkiye": "Türkiye",
  "Germany": "Alemania", "Curaçao": "Curazao", "Ivory Coast": "Costa de Marfil",
  "Ecuador": "Ecuador", "Netherlands": "Países Bajos", "Japan": "Japón",
  "Sweden": "Suecia", "Tunisia": "Túnez", "Belgium": "Bélgica", "Egypt": "Egipto",
  "Iran": "Irán", "New Zealand": "Nueva Zelanda", "Spain": "España",
  "Cape Verde": "Cabo Verde", "Saudi Arabia": "Arabia Saudita", "Uruguay": "Uruguay",
  "France": "Francia", "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega",
  "Argentina": "Argentina", "Algeria": "Argelia", "Austria": "Austria",
  "Jordan": "Jordania", "Portugal": "Portugal", "DR Congo": "Congo DR",
  "Uzbekistan": "Uzbekistán", "Colombia": "Colombia", "England": "Inglaterra",
  "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá",
};

const PHASE_MAP = {
  "GROUP_STAGE": "Grupos",
  "LAST_32": "Octavos",
  "LAST_16": "Cuartos",
  "QUARTER_FINALS": "Cuartos",
  "SEMI_FINALS": "Semifinal",
  "THIRD_PLACE": "3er Lugar",
  "FINAL": "Final",
};

const GROUP_MAP = {
  "GROUP_A": "A", "GROUP_B": "B", "GROUP_C": "C", "GROUP_D": "D",
  "GROUP_E": "E", "GROUP_F": "F", "GROUP_G": "G", "GROUP_H": "H",
  "GROUP_I": "I", "GROUP_J": "J", "GROUP_K": "K", "GROUP_L": "L",
};

function teamName(name) { return TEAM_NAMES_ES[name] || name; }
function teamFlag(name) { return FLAG(TEAM_FLAGS[name] || ""); }

function formatDate(utcDate) {
  const d = new Date(utcDate);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatTime(utcDate) {
  const d = new Date(utcDate);
  const h = d.getUTCHours() - 4; // ET = UTC-4
  const hh = ((h + 24) % 24).toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} ET`;
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=minimal",
      ...options.headers,
    },
  });
  if (options.returnData) {
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }
  return res;
}

export async function syncMatches() {
  // Fetch all WC matches from API
  const apiRes = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": FOOTBALL_API_KEY },
  });
  const apiData = await apiRes.json();
  if (!apiData.matches) throw new Error("No matches from API");

  // Get existing matches from DB
  const dbMatches = await sbFetch("/matches?select=*&order=kickoff_at", { returnData: true });

  // Get scoring rules
  const rules = await sbFetch("/scoring_rules?select=*", { returnData: true });
  const ruleMap = {};
  rules.forEach(r => { ruleMap[r.rule_key] = r.rule_value; });

  let updated = 0, created = 0;

  for (const m of apiData.matches) {
    const homeTeam = m.homeTeam?.name;
    const awayTeam = m.awayTeam?.name;
    const phase = PHASE_MAP[m.stage] || "Grupos";
    const group = GROUP_MAP[m.group] || null;
    const kickoff = m.utcDate;
    const status = m.status;

    // Try to find existing match
    const existing = dbMatches.find(db => {
      if (phase === "Grupos") {
        return db.home === teamName(homeTeam) && db.away === teamName(awayTeam);
      }
      // For knockout, match by kickoff time
      return new Date(db.kickoff_at).getTime() === new Date(kickoff).getTime();
    });

    if (status === "FINISHED") {
      const homeScore = m.score?.fullTime?.home;
      const awayScore = m.score?.fullTime?.away;
      if (homeScore === null || awayScore === null) continue;

      if (existing && existing.status !== "finished") {
        // Update result
        await sbFetch(`/matches?id=eq.${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            home_score: homeScore,
            away_score: awayScore,
            status: "finished",
            home: teamName(homeTeam),
            away: teamName(awayTeam),
            home_flag: teamFlag(homeTeam),
            away_flag: teamFlag(awayTeam),
          }),
        });

        // Calculate points
        const isKnockout = phase !== "Grupos";
        const exactPts = isKnockout ? (ruleMap["exact_score_knockout"] || 6) : (ruleMap["exact_score_groups"] || 3);
        const resultPts = isKnockout ? (ruleMap["correct_result_knockout"] || 2) : (ruleMap["correct_result_groups"] || 1);
        const realResult = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";

        const preds = await sbFetch(`/predictions?match_id=eq.${existing.id}&select=*`, { returnData: true });
        for (const pred of preds) {
          let pts = 0;
          if (pred.home_score === homeScore && pred.away_score === awayScore) { pts = exactPts; }
          else {
            const pr = pred.home_score > pred.away_score ? "home" : pred.away_score > pred.home_score ? "away" : "draw";
            if (pr === realResult) pts = resultPts;
          }
          await sbFetch(`/predictions?id=eq.${pred.id}`, { method: "PATCH", body: JSON.stringify({ points: pts }) });
        }
        updated++;
      } else if (!existing && phase !== "Grupos") {
        // Create finished knockout match
        await sbFetch("/matches", {
          method: "POST",
          prefer: "return=minimal",
          body: JSON.stringify({
            group_name: group || phase,
            home: teamName(homeTeam),
            home_flag: teamFlag(homeTeam),
            away: teamName(awayTeam),
            away_flag: teamFlag(awayTeam),
            match_date: formatDate(kickoff),
            match_time: formatTime(kickoff),
            kickoff_at: kickoff,
            home_score: m.score?.fullTime?.home,
            away_score: m.score?.fullTime?.away,
            status: "finished",
            stage: phase,
            phase: phase,
          }),
        });
        created++;
      }
    } else if (status === "SCHEDULED" || status === "TIMED") {
      if (!existing && phase !== "Grupos" && homeTeam && awayTeam && !homeTeam.includes("Winner") && !homeTeam.includes("Loser")) {
        // Create upcoming knockout match
        await sbFetch("/matches", {
          method: "POST",
          prefer: "return=minimal",
          body: JSON.stringify({
            group_name: group || phase,
            home: teamName(homeTeam),
            home_flag: teamFlag(homeTeam),
            away: teamName(awayTeam),
            away_flag: teamFlag(awayTeam),
            match_date: formatDate(kickoff),
            match_time: formatTime(kickoff),
            kickoff_at: kickoff,
            status: "upcoming",
            stage: phase,
            phase: phase,
          }),
        });
        created++;
      } else if (existing && phase !== "Grupos" && homeTeam && !homeTeam.includes("Winner")) {
        // Update team names when confirmed
        await sbFetch(`/matches?id=eq.${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            home: teamName(homeTeam),
            home_flag: teamFlag(homeTeam),
            away: teamName(awayTeam),
            away_flag: teamFlag(awayTeam),
          }),
        });
      }
    }
  }

  // Log sync
  await sbFetch("/sync_log", {
    method: "POST",
    body: JSON.stringify({ matches_updated: updated, matches_created: created }),
  });

  return { updated, created };
}
