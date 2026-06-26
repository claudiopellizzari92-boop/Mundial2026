import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bheziohaquiwnvbzrlio.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZXppb2hhcXVpd252YnpybGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQzNzEsImV4cCI6MjA5Mzk0MDM3MX0.p53LDuRulCzO_ceRjS47jNbirEpfDTk5NYCi9AT92CM";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWTaWlboBH-oZ0mdrpm1-DcOT329Nijd4",
  authDomain: "quiniela-2026-8e03c.firebaseapp.com",
  projectId: "quiniela-2026-8e03c",
  storageBucket: "quiniela-2026-8e03c.firebasestorage.app",
  messagingSenderId: "1033273841478",
  appId: "1:1033273841478:web:462aec25e01fc44bd2f747",
};
const FCM_VAPID_KEY = "BACoBZoreHNOrU2TMlzhPqCFFMPt5Qj9nNXc9zz8ApNXi88IQ_xQUoOdRAh8PV7SRPZAmCmheQcbBrlr6q5UubE";
const EDGE_FUNCTION_URL = "https://bheziohaquiwnvbzrlio.supabase.co/functions/v1/send-push";

async function sendPushNotification(type, userIds, notification) {
  try {
    const { data: { session } } = await sb.auth.getSession();
    await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ type, user_ids: userIds, notification }),
    });
  } catch (e) {
    console.warn("Push notification failed:", e);
  }
}

// Offset entre el reloj del servidor (Supabase) y el del dispositivo.
// Si el teléfono está corrido, esto lo compensa: la app decide cierres con la hora real.
let serverOffsetMs = 0;
function nowMs() { return Date.now() + serverOffsetMs; }
async function syncServerClock(client) {
  try {
    const t0 = Date.now();
    const { data, error } = await client.rpc("server_now");
    if (error || !data) return;
    const t1 = Date.now();
    const serverMs = new Date(data).getTime();
    const rtt = t1 - t0;
    // Estimar el "ahora" del servidor en el instante de respuesta (mitad del round-trip)
    serverOffsetMs = serverMs - (t0 + rtt / 2);
  } catch (_e) { /* si falla, queda 0 = usa hora local */ }
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage.getItem("sb-remember") === "true" ? window.localStorage : window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// Trae TODAS las predicciones paginando de a 1000 (Supabase corta en 1000 por consulta)
async function fetchAllPredictions(columns = "*") {
  const pageSize = 1000;
  let from = 0, all = [];
  while (true) {
    const { data, error } = await sb.from("predictions").select(columns).order("id", { ascending: true }).range(from, from + pageSize - 1);
    if (error) return all;
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ─── World Cup 2026 Groups ────────────────────────────────────────────────────
const FLAG = (code) => `https://flagcdn.com/24x18/${code}.png`;

// Comprime una imagen (File o Blob) a JPEG redimensionado. Si algo falla, devuelve el original.
async function compressImg(input, maxW = 512, quality = 0.82) {
  try {
    const bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", quality));
    if (bitmap.close) bitmap.close();
    return blob || input;
  } catch (e) { return input; }
}
const GROUPS = {
  A: [{ name: "México", flag: FLAG("mx") }, { name: "Sudáfrica", flag: FLAG("za") }, { name: "Corea del Sur", flag: FLAG("kr") }, { name: "Chequia", flag: FLAG("cz") }],
  B: [{ name: "Canadá", flag: FLAG("ca") }, { name: "Bosnia", flag: FLAG("ba") }, { name: "Qatar", flag: FLAG("qa") }, { name: "Suiza", flag: FLAG("ch") }],
  C: [{ name: "Brasil", flag: FLAG("br") }, { name: "Marruecos", flag: FLAG("ma") }, { name: "Haití", flag: FLAG("ht") }, { name: "Escocia", flag: FLAG("gb-sct") }],
  D: [{ name: "USA", flag: FLAG("us") }, { name: "Paraguay", flag: FLAG("py") }, { name: "Australia", flag: FLAG("au") }, { name: "Türkiye", flag: FLAG("tr") }],
  E: [{ name: "Alemania", flag: FLAG("de") }, { name: "Curazao", flag: FLAG("cw") }, { name: "Costa de Marfil", flag: FLAG("ci") }, { name: "Ecuador", flag: FLAG("ec") }],
  F: [{ name: "Países Bajos", flag: FLAG("nl") }, { name: "Japón", flag: FLAG("jp") }, { name: "Suecia", flag: FLAG("se") }, { name: "Túnez", flag: FLAG("tn") }],
  G: [{ name: "Bélgica", flag: FLAG("be") }, { name: "Egipto", flag: FLAG("eg") }, { name: "Irán", flag: FLAG("ir") }, { name: "Nueva Zelanda", flag: FLAG("nz") }],
  H: [{ name: "España", flag: FLAG("es") }, { name: "Cabo Verde", flag: FLAG("cv") }, { name: "Arabia Saudita", flag: FLAG("sa") }, { name: "Uruguay", flag: FLAG("uy") }],
  I: [{ name: "Francia", flag: FLAG("fr") }, { name: "Senegal", flag: FLAG("sn") }, { name: "Irak", flag: FLAG("iq") }, { name: "Noruega", flag: FLAG("no") }],
  J: [{ name: "Argentina", flag: FLAG("ar") }, { name: "Argelia", flag: FLAG("dz") }, { name: "Austria", flag: FLAG("at") }, { name: "Jordania", flag: FLAG("jo") }],
  K: [{ name: "Portugal", flag: FLAG("pt") }, { name: "Congo DR", flag: FLAG("cd") }, { name: "Uzbekistán", flag: FLAG("uz") }, { name: "Colombia", flag: FLAG("co") }],
  L: [{ name: "Inglaterra", flag: FLAG("gb-eng") }, { name: "Croacia", flag: FLAG("hr") }, { name: "Ghana", flag: FLAG("gh") }, { name: "Panamá", flag: FLAG("pa") }],
};

const ALL_TEAMS = Object.entries(GROUPS).map(([g, teams]) => teams.map(t => ({ ...t, group: g }))).flat();
const TOURNAMENT_START = new Date("2026-06-11T19:00:00Z");
const isPreTournamentLocked = () => new Date() >= TOURNAMENT_START;

function localTime(kickoff) {
  if (!kickoff) return "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(kickoff).toLocaleTimeString("es", {
    hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: false
  });
}

function localDate(kickoff) {
  if (!kickoff) return "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const d = new Date(kickoff);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const local = new Date(d.toLocaleString("en", { timeZone: tz }));
  return `${months[local.getMonth()]} ${local.getDate()}`;
}

function localTzName() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const short = new Date().toLocaleTimeString("en", { timeZoneName: "short", timeZone: tz }).split(" ").pop();
  return short;
}

// Hora de cierre (deadline) formateada en la zona local de quien mira: "Jun 14, 10:00"
function formatDeadline(deadlineMs) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const d = new Date(deadlineMs);
  const local = new Date(d.toLocaleString("en", { timeZone: tz }));
  const hh = String(local.getHours()).padStart(2,"0");
  const mm = String(local.getMinutes()).padStart(2,"0");
  return `${months[local.getMonth()]} ${local.getDate()}, ${hh}:${mm}`;
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090f;--surface:#0d1019;--card:#111520;--card2:#161b28;
  --border:#1c2235;--border2:#242a3a;
  --gold:#f5b731;--gold2:#e09820;--gold-dim:rgba(245,183,49,.12);
  --green:#2adf7a;--green-dim:rgba(42,223,122,.12);
  --red:#ff4d6d;--red-dim:rgba(255,77,109,.12);
  --blue:#4a9eff;--muted:#5a6278;--txt:#dde2f0;--nav:#aab3c6;--r:12px;
}
body{background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;min-height:100vh;}
input,button,select{font-family:inherit;}
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 70% 50% at 50% -10%,#1d2b4a,var(--bg) 65%);}
.auth-box{width:400px;padding:52px 44px;background:var(--card);border:1px solid var(--border);border-radius:20px;box-shadow:0 0 80px rgba(245,183,49,.07);}
.auth-logo{text-align:center;margin-bottom:36px;}
.auth-logo .icon{font-size:52px;display:block;margin-bottom:10px;}
.auth-logo h1{font-family:'Bebas Neue';font-size:38px;letter-spacing:3px;color:var(--gold);line-height:1;}
.auth-logo p{color:var(--muted);font-size:13px;margin-top:5px;}
.auth-tabs{display:flex;margin-bottom:28px;border-radius:8px;overflow:hidden;border:1px solid var(--border);}
.auth-tab{flex:1;padding:10px;background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;transition:all .2s;}
.auth-tab.active{background:var(--gold-dim);color:var(--gold);}
.field{margin-bottom:14px;}
.field label{display:block;font-size:11px;color:var(--muted);margin-bottom:6px;letter-spacing:.6px;text-transform:uppercase;}
.field input,.field select{width:100%;padding:13px 15px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-size:15px;outline:none;transition:border .2s;}
.field input:focus,.field select:focus{border-color:var(--gold);}
.field select option{background:var(--card);}
.btn-gold{width:100%;padding:15px;margin-top:10px;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;border-radius:9px;color:#07090f;font-family:'Bebas Neue';font-size:19px;letter-spacing:2.5px;cursor:pointer;transition:opacity .2s;}
.btn-gold:hover{opacity:.9;}
.btn-gold:disabled{opacity:.4;cursor:not-allowed;}
.msg-err{color:var(--red);font-size:13px;margin-top:10px;text-align:center;}
.msg-ok{color:var(--green);font-size:13px;margin-top:10px;text-align:center;}
.invite-note{margin-top:4px;margin-bottom:14px;padding:12px;background:var(--gold-dim);border:1px solid rgba(245,183,49,.2);border-radius:8px;font-size:12px;color:var(--gold);text-align:center;}
.shell{display:flex;flex-direction:column;min-height:100vh;}
.nav{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:62px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;}
.nav-brand{font-family:'Bebas Neue';font-size:24px;color:var(--gold);letter-spacing:3px;}
.nav-tabs{display:flex;gap:2px;}
.nav-tab{padding:7px 14px;border-radius:8px;background:none;border:none;color:var(--nav);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;}
.nav-tab:hover{background:var(--card2);color:var(--txt);}
.nav-tab.active{background:var(--gold-dim);color:var(--gold);}
.nav-tab.admin-tab{color:var(--red);}
.nav-tab.admin-tab.active{background:var(--red-dim);color:var(--red);}
.nav-user{display:flex;align-items:center;gap:8px;}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#07090f;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.avatar.sm{width:28px;height:28px;font-size:10px;}
.avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.btn-logout{padding:6px 13px;background:none;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s;}
.btn-logout:hover{border-color:var(--red);color:var(--red);}
.main{flex:1;padding:28px 24px;max-width:980px;margin:0 auto;width:100%;}
.sec-hdr{display:flex;align-items:baseline;gap:12px;margin-bottom:20px;}
.sec-hdr h2{font-family:'Bebas Neue';font-size:28px;letter-spacing:1.5px;}
.sec-hdr span{color:var(--muted);font-size:13px;}
.banner{background:linear-gradient(135deg,#111a2e,#0d1520);border:1px solid var(--border);border-radius:var(--r);padding:24px 26px;margin-bottom:24px;position:relative;overflow:hidden;}
.banner::after{content:'⚽';font-size:100px;position:absolute;right:-8px;top:-8px;opacity:.05;line-height:1;pointer-events:none;}
.banner h3{font-family:'Bebas Neue';font-size:22px;color:var(--gold);letter-spacing:1.5px;}
.banner p{color:var(--muted);font-size:13px;margin-top:6px;line-height:1.65;max-width:540px;}
.dash-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;gap:4px;}
.stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;}
.stat-value{font-family:'Bebas Neue';font-size:42px;color:var(--gold);line-height:1;}
.stat-sub{font-size:12px;color:var(--muted);}
.matches-grid{display:flex;flex-direction:column;gap:10px;}
.match-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;transition:border-color .2s;}
.match-card:hover{border-color:var(--border2);}
.match-card.saved{border-left:3px solid var(--green);}
.match-card.locked{border-left:3px solid var(--gold);}
.team{display:flex;align-items:center;gap:8px;}
.team.away{flex-direction:row-reverse;text-align:right;}
.team-flag{width:28px;height:21px;object-fit:cover;border-radius:2px;}
.team-name{font-size:13px;font-weight:500;}
.match-center{display:flex;flex-direction:column;align-items:center;gap:7px;}
.match-meta{font-size:11px;color:var(--muted);white-space:nowrap;}
.score-inputs{display:flex;align-items:center;gap:5px;}
.score-input{width:42px;height:42px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-family:'Bebas Neue';font-size:22px;text-align:center;outline:none;transition:border .2s;}
.score-input:focus{border-color:var(--gold);}
.score-input:disabled{opacity:.5;cursor:not-allowed;}
.score-sep{font-family:'Bebas Neue';font-size:20px;color:var(--muted);}
.score-display{display:flex;align-items:center;gap:8px;font-family:'Bebas Neue';font-size:26px;color:var(--txt);}
.group-badge{font-size:10px;padding:2px 7px;border-radius:20px;background:var(--surface);color:var(--muted);border:1px solid var(--border);}
.save-btn{padding:5px 14px;background:none;border:1px solid var(--gold);border-radius:7px;color:var(--gold);font-size:12px;cursor:pointer;transition:all .2s;}
.save-btn:hover{background:var(--gold);color:#07090f;}
.save-btn:disabled{opacity:.4;cursor:not-allowed;}
.saved-tag{font-size:11px;color:var(--green);}
.locked-tag{font-size:11px;color:var(--gold);}
.no-pred{font-size:11px;color:var(--muted);font-style:italic;}
.reveal-card{background:var(--card2);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;margin-top:6px;}
.reveal-title{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;}
.reveal-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);}
.reveal-row:last-child{border-bottom:none;}
.reveal-user{display:flex;align-items:center;gap:8px;font-size:13px;}
.reveal-score{font-family:'Bebas Neue';font-size:17px;}
.reveal-pts{font-size:12px;color:var(--green);}
.standings-wrap{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.standings-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.standings-table{width:100%;border-collapse:collapse;}
.standings-table thead tr{border-bottom:1px solid var(--border);}
.standings-table th{padding:10px 14px;font-size:11px;color:var(--muted);text-align:left;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;background:var(--card);}
.standings-table th.c,.standings-table td.c{text-align:center;}
.standings-table th.sticky,.standings-table td.sticky{position:sticky;left:0;z-index:2;background:var(--card);}
.standings-table th.sticky2,.standings-table td.sticky2{position:sticky;left:42px;z-index:2;background:var(--card);}
.standings-table tbody tr{border-bottom:1px solid var(--border);transition:background .15s;}
.standings-table tbody tr:last-child{border-bottom:none;}
.standings-table tbody tr:hover{background:var(--card2);}
.standings-table tbody tr:hover td.sticky,.standings-table tbody tr:hover td.sticky2{background:var(--card2);}
.standings-table td{padding:13px 14px;font-size:14px;white-space:nowrap;}
.mobile-col{display:none;}
.desktop-col{display:table-cell;}
.rank-num{font-family:'Bebas Neue';font-size:22px;color:var(--muted);}
.rank-1{color:var(--gold)!important;}.rank-2{color:#b0bcd0!important;}.rank-3{color:#cd7f32!important;}
.user-cell{display:flex;align-items:center;gap:10px;}
.me-badge{font-size:10px;padding:2px 7px;border-radius:20px;background:var(--gold-dim);color:var(--gold);}
.pts-big{font-family:'Bebas Neue';font-size:26px;color:var(--gold);}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;background:var(--surface);font-size:13px;}
.spinner{display:flex;align-items:center;justify-content:center;padding:80px;color:var(--muted);font-size:14px;gap:10px;}
.spin{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes slideUp{from{opacity:0;transform:translate(-50%,20px);}to{opacity:1;transform:translate(-50%,0);}}
@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}
@keyframes championGlow{0%,100%{text-shadow:0 0 8px rgba(245,183,49,.9),0 0 20px rgba(245,183,49,.5),0 0 40px rgba(245,183,49,.3);}50%{text-shadow:0 0 16px rgba(245,183,49,1),0 0 40px rgba(245,183,49,.8),0 0 80px rgba(245,183,49,.5);}}
@keyframes silverGlow{0%,100%{text-shadow:0 0 8px rgba(192,192,192,.9),0 0 20px rgba(192,192,192,.5),0 0 40px rgba(192,192,192,.3);}50%{text-shadow:0 0 16px rgba(220,220,220,1),0 0 40px rgba(192,192,192,.8),0 0 80px rgba(192,192,192,.4);}}
@keyframes debtorPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(1.15);}}
@keyframes debtorShake{0%,100%{transform:translateX(0);}20%{transform:translateX(-3px);}40%{transform:translateX(3px);}60%{transform:translateX(-2px);}80%{transform:translateX(2px);}}
.debtor-badge{display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border-radius:20px;background:rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.4);color:var(--red);font-size:9px;font-weight:700;animation:debtorPulse 1.5s ease-in-out infinite;white-space:nowrap;}
.debtor-badge .icon{animation:debtorShake 2s ease-in-out infinite;}
.debtor-overlay{position:fixed;inset:0;z-index:150;backdrop-filter:blur(6px) grayscale(80%);background:rgba(7,9,15,.7);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;}
.debtor-overlay-box{background:var(--card);border:2px solid var(--red);border-radius:20px;padding:32px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 0 60px rgba(255,77,109,.3);}
.debtor-pts{position:relative;display:inline-block;}
.debtor-pts::after{content:"❌";position:absolute;top:-6px;right:-18px;font-size:12px;}
@keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
.champion-name{background:linear-gradient(90deg,#f5b731,#ffe066,#f5b731,#e09820,#f5b731);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite,championGlow 2s ease-in-out infinite;font-weight:700;}
.silver-name{background:linear-gradient(90deg,#b0bcd0,#e8edf5,#b0bcd0,#8899aa,#b0bcd0);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2.5s linear infinite,silverGlow 2s ease-in-out infinite;font-weight:700;}
.champion-avatar{box-shadow:0 0 0 2px #f5b731,0 0 12px rgba(245,183,49,.6);}
.silver-avatar{box-shadow:0 0 0 2px #b0bcd0,0 0 12px rgba(176,188,208,.6);}
.frame-fuego{box-shadow:0 0 0 2px #ff6b35,0 0 12px rgba(255,107,53,.7);}
.frame-neon{box-shadow:0 0 0 2px #00e5ff,0 0 12px rgba(0,229,255,.7);}
.frame-rosa{box-shadow:0 0 0 2px #ff4fa3,0 0 12px rgba(255,79,163,.7);}
.frame-violeta{box-shadow:0 0 0 2px #a78bfa,0 0 12px rgba(167,139,250,.7);}
.frame-verde{box-shadow:0 0 0 2px #2adf7a,0 0 12px rgba(42,223,122,.6);}
.frame-azul{box-shadow:0 0 0 2px #4a9eff,0 0 12px rgba(74,158,255,.6);}
.tienda-grid{display:grid;grid-template-columns:1fr;gap:14px;}
@media(min-width:760px){.tienda-grid{grid-template-columns:1fr 1fr;}}
.tienda-item{background:linear-gradient(135deg,var(--card),var(--surface));border:1px solid var(--border);border-radius:16px;padding:16px;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease;}
.tienda-item:hover{transform:translateY(-2px);border-color:rgba(245,183,49,.45);box-shadow:0 8px 24px rgba(0,0,0,.32);}
.tienda-row{display:flex;align-items:center;gap:14px;}
.tienda-thumb{width:58px;height:58px;border-radius:13px;object-fit:cover;flex-shrink:0;box-shadow:0 0 0 1px var(--border);}
.tienda-price{display:inline-flex;align-items:center;gap:5px;background:rgba(245,183,49,.13);border:1px solid rgba(245,183,49,.32);border-radius:999px;padding:3px 11px;font-weight:800;color:var(--gold);font-size:13px;white-space:nowrap;}
.tienda-buy{padding:8px 18px;border-radius:10px;border:none;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;transition:filter .15s ease;}
.tienda-buy:hover{filter:brightness(1.08);}
@keyframes popIn{0%{transform:scale(.5);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}
@keyframes skelShimmer{0%{background-position:100% 50%;}100%{background-position:0 50%;}}
.skel{background:linear-gradient(90deg,var(--surface) 25%,var(--border) 37%,var(--surface) 63%);background-size:400% 100%;animation:skelShimmer 1.4s ease infinite;border-radius:8px;display:block;}
.light-mode{
  --bg:#eef1f7;--surface:#ffffff;--card:#ffffff;--card2:#eef2f9;
  --border:#d2d8e6;--border2:#bcc4d6;
  --gold:#c4870a;--gold2:#a86f08;--gold-dim:rgba(196,135,10,.12);
  --green:#11924d;--green-dim:rgba(17,146,77,.13);
  --red:#d62a48;--red-dim:rgba(214,42,72,.12);
  --blue:#1f6fe0;--muted:#5b6478;--txt:#161b2c;--nav:#394053;
}
.light-mode .nav-tab{color:#394053;}
.light-mode .pre-tab{color:#4a5266;}
.light-mode .group-card-hdr h4{color:#161b2c;}
.light-mode .card,.light-mode .group-card{box-shadow:0 1px 3px rgba(20,30,60,.06);}
.theme-toggle{padding:6px 10px;background:none;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:14px;cursor:pointer;transition:all .2s;}
.theme-toggle:hover{border-color:var(--gold);color:var(--gold);}
.confetti-piece{position:fixed;width:8px;height:8px;top:-10px;z-index:9999;pointer-events:none;animation:confettiFall linear forwards;border-radius:2px;}

/* ── Mobile ── */
.hamburger{display:none;flex-direction:column;gap:5px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;cursor:pointer;padding:9px 11px;}
.hamburger span{display:block;width:22px;height:2.5px;background:var(--gold);border-radius:2px;}
.desktop-only{display:inline-flex;}
.mobile-only{display:none;}
.mobile-menu{display:none;position:fixed;top:62px;left:0;right:0;background:var(--surface);border-bottom:1px solid var(--border);z-index:99;padding:8px 12px;flex-direction:column;gap:2px;}
.mobile-menu.open{display:flex;}
.mobile-nav-tab{padding:11px 14px;border-radius:8px;background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;text-align:left;transition:all .2s;}
.mobile-nav-tab.active{background:var(--gold-dim);color:var(--gold);}
.mobile-nav-tab.admin-tab{color:var(--red);}
.mobile-nav-tab.admin-tab.active{background:var(--red-dim);color:var(--red);}
@media(max-width:768px){
  .nav-tabs{display:none;}
  .nav-brand{font-size:18px;}
  .nav-user span{display:none;}
  .desktop-only{display:none!important;}
  .mobile-only{display:inline-flex!important;}
  .hamburger{display:flex;}
  .main{padding:16px 14px;}
  .dash-grid{grid-template-columns:repeat(3,1fr);gap:8px;}
  .stat-card{padding:14px 10px;}
  .stat-value{font-size:30px;}
  .stat-label{font-size:10px;}
  .match-card{padding:12px 10px;gap:8px;}
  .team-name{font-size:12px;}
  .score-input{width:36px;height:36px;font-size:19px;}
  .score-display{font-size:20px;}
  .groups-grid{grid-template-columns:1fr;}
  .thirds-grid{grid-template-columns:repeat(2,1fr);}
  .standings-table th,.standings-table td{padding:8px 6px;font-size:11px;}
  .pts-big{font-size:18px;}
  .mobile-col{display:table-cell!important;}
  .desktop-col{display:none!important;}
  .standings-table th.sticky2,.standings-table td.sticky2{left:32px;max-width:130px;overflow:hidden;}
.standings-table td.sticky2 .user-cell{gap:4px;min-width:0;overflow:hidden;}
.standings-table td.sticky2 .user-cell > div{min-width:0;overflow:hidden;}
  .standings-table td.sticky2 .champion-name,
  .standings-table td.sticky2 .silver-name,
  .standings-table td.sticky2 span[style]{max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;}
  .rules-grid{grid-template-columns:1fr;}
  .admin-match-row{grid-template-columns:55px 1fr auto auto auto;gap:6px;font-size:12px;}
  .sec-hdr h2{font-size:22px;}
  .banner{padding:16px 14px;}
  .banner h3{font-size:17px;}
  .banner p{font-size:12px;}
}

/* ── Pre-tournament ── */
.pre-alert{padding:14px 18px;border-radius:var(--r);margin-bottom:20px;display:flex;align-items:center;gap:12px;font-size:13px;}
.pre-alert.warning{background:rgba(245,183,49,.1);border:1px solid rgba(245,183,49,.3);color:var(--gold);}
.pre-alert.locked{background:var(--red-dim);border:1px solid rgba(255,77,109,.3);color:var(--red);}
.pre-alert.complete{background:var(--green-dim);border:1px solid rgba(42,223,122,.3);color:var(--green);}
.pre-tabs{display:flex;gap:6px;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:0;}
.pre-tab{padding:8px 16px;background:none;border:none;color:var(--nav);font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;}
.pre-tab.active{color:var(--gold);border-bottom-color:var(--gold);}
.groups-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.group-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.group-card.complete{border-color:rgba(42,223,122,.3);}
.group-card-hdr{padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.group-card-hdr h4{font-family:'Bebas Neue';font-size:18px;letter-spacing:1px;}
.group-complete-badge{font-size:10px;color:var(--green);background:var(--green-dim);padding:2px 8px;border-radius:20px;}
.group-card-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
.group-select-row{display:flex;align-items:center;gap:10px;}
.pos-badge{font-family:'Bebas Neue';font-size:16px;width:24px;text-align:center;flex-shrink:0;}
.pos-1{color:var(--gold);}
.pos-2{color:#b0bcd0;}
.group-select{flex:1;padding:9px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-size:13px;outline:none;cursor:pointer;transition:border .2s;}
.group-select:focus{border-color:var(--gold);}
.group-select:disabled{opacity:.6;cursor:not-allowed;}
.group-save-btn{padding:6px 14px;background:none;border:1px solid var(--gold);border-radius:7px;color:var(--gold);font-size:12px;cursor:pointer;transition:all .2s;margin-top:4px;width:100%;}
.group-save-btn:hover{background:var(--gold);color:#07090f;}
.group-save-btn:disabled{opacity:.4;cursor:not-allowed;}
.thirds-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.third-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all .2s;}
.third-card:hover:not(.disabled){border-color:var(--gold);background:var(--gold-dim);}
.third-card.selected{border-color:var(--green);background:var(--green-dim);}
.third-card.disabled{opacity:.5;cursor:not-allowed;}
.third-card.locked-card{cursor:default;}
.third-team-info{flex:1;}
.third-team-name{font-size:13px;font-weight:500;}
.third-team-group{font-size:11px;color:var(--muted);}
.third-check{width:20px;height:20px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;}
.third-card.selected .third-check{background:var(--green);border-color:var(--green);color:#07090f;}
.thirds-counter{font-size:13px;color:var(--muted);margin-bottom:14px;}
.thirds-counter strong{color:var(--gold);}
.thirds-save-btn{width:100%;padding:12px;margin-top:16px;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;border-radius:9px;color:#07090f;font-family:'Bebas Neue';font-size:17px;letter-spacing:2px;cursor:pointer;transition:opacity .2s;}
.thirds-save-btn:hover{opacity:.9;}
.thirds-save-btn:disabled{opacity:.4;cursor:not-allowed;}

/* ── Admin ── */
.admin-wrap{display:flex;flex-direction:column;gap:24px;}
.admin-section{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.admin-section-hdr{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.admin-section-hdr h3{font-family:'Bebas Neue';font-size:19px;letter-spacing:1px;}
.admin-section-body{padding:18px;}
.admin-matches-list{display:flex;flex-direction:column;gap:8px;}
.admin-match-row{display:grid;grid-template-columns:80px 1fr auto auto auto;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);border-radius:8px;border:1px solid var(--border);}
.admin-score-input{width:38px;height:34px;background:var(--card);border:1px solid var(--border);border-radius:6px;color:var(--txt);font-family:'Bebas Neue';font-size:19px;text-align:center;outline:none;}
.admin-score-input:focus{border-color:var(--green);}
.admin-save-btn{padding:5px 12px;background:var(--green-dim);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:12px;cursor:pointer;white-space:nowrap;}
.admin-save-btn:hover{background:var(--green);color:#07090f;}
.result-badge{font-size:11px;padding:2px 8px;border-radius:20px;background:var(--green-dim);color:var(--green);font-family:'Bebas Neue';}
.admin-edit-btn{padding:4px 10px;background:none;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer;}
.admin-edit-btn:hover{border-color:var(--blue);color:var(--blue);}
.match-filter{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;}
.filter-btn{padding:4px 12px;border-radius:20px;background:none;border:1px solid var(--border);color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s;}
.filter-btn.active{background:var(--gold-dim);border-color:var(--gold);color:var(--gold);}
.rules-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.rule-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.rule-label{font-size:13px;color:var(--txt);}
.rule-input{width:52px;padding:6px;background:var(--card);border:1px solid var(--border);border-radius:6px;color:var(--gold);font-family:'Bebas Neue';font-size:20px;text-align:center;outline:none;}
.invite-list{display:flex;flex-direction:column;gap:8px;}
.invite-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--surface);border-radius:8px;border:1px solid var(--border);}
.invite-code{font-family:'Bebas Neue';font-size:17px;letter-spacing:1px;color:var(--gold);}
.invite-status{font-size:12px;padding:2px 8px;border-radius:20px;}
.invite-status.active{background:var(--green-dim);color:var(--green);}
.invite-status.inactive{background:var(--red-dim);color:var(--red);}
.new-invite-row{display:flex;gap:8px;margin-top:10px;}
.new-invite-input{flex:1;padding:9px 12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--txt);font-size:14px;outline:none;}
.btn-small{padding:7px 14px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:7px;color:var(--gold);font-size:12px;cursor:pointer;transition:all .2s;}
.btn-small:hover{background:var(--gold);color:#07090f;}
.btn-small.red{background:var(--red-dim);border-color:var(--red);color:var(--red);}
.btn-small.red:hover{background:var(--red);color:#fff;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;}
.modal{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;}
.modal::-webkit-scrollbar{display:none;}
.modal h3{font-family:'Bebas Neue';font-size:20px;letter-spacing:1px;margin-bottom:18px;color:var(--gold);}
.modal-btns{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
.btn-cancel{padding:9px 18px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:13px;cursor:pointer;}
.btn-confirm{padding:9px 18px;background:var(--gold);border:none;border-radius:8px;color:#07090f;font-size:13px;font-weight:600;cursor:pointer;}
.admin-standings-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.admin-group-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;}
.admin-group-card h4{font-family:'Bebas Neue';font-size:16px;margin-bottom:10px;color:var(--gold);}
.admin-group-select-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.admin-pos-badge{font-family:'Bebas Neue';font-size:14px;width:20px;flex-shrink:0;color:var(--muted);}
.reaction-wrap{display:inline-block;}
.reaction-tooltip{display:none;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:11px;color:var(--txt);white-space:nowrap;z-index:10;pointer-events:none;}
.reaction-wrap:hover .reaction-tooltip{display:block;}
/* ===== NFT ===== */
.nftgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;}
.nftcard,.nftbig{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:1792/2400;container-type:inline-size;background:var(--card2);}
.nftcard{cursor:pointer;transition:transform .15s;}
.nftcard:hover{transform:translateY(-3px);}
.nftimg,.nftbig-art{position:absolute;inset:0;background-size:cover;background-position:center;}
.nftcard.r-common{box-shadow:inset 0 0 0 1px var(--border);}
.nftcard.r-limited{box-shadow:inset 0 0 0 2px rgba(200,215,240,.75),0 0 14px rgba(120,150,210,.4);}
.nftcard.r-legendary{box-shadow:inset 0 0 0 2px rgba(245,217,122,.85),0 0 18px rgba(245,183,49,.5);}
.nft-num{position:absolute;left:calc(var(--nx,50)*1%);top:calc(var(--ny,90)*1%);transform:translate(-50%,-50%);font-family:'DejaVu Serif',Georgia,'Times New Roman',serif;font-weight:700;font-size:calc(var(--ns,9)*1cqw);color:#eef7fa;text-shadow:0 0.4cqw 0.8cqw rgba(8,14,30,.95);white-space:nowrap;pointer-events:none;line-height:1;letter-spacing:.5px;}
.nft-num-d{font-size:.62em;color:#c4d2ee;}
.nft-num-leg{color:#fff;text-shadow:0 0 1.5cqw rgba(245,200,90,.9);}
.nft-num-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}
.nftbig{width:min(74vw,320px);transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transform-style:preserve-3d;transition:transform .12s ease-out;animation:nftFloat 6s ease-in-out infinite;will-change:transform;box-shadow:0 18px 50px rgba(0,0,0,.6);touch-action:none;cursor:grab;}
@keyframes nftFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}
.nft-frame{position:absolute;inset:0;border-radius:14px;pointer-events:none;border:2px solid transparent;transition:.4s;}
.nftbig.r-limited .nft-frame{border-color:rgba(200,215,240,.7);box-shadow:0 0 26px rgba(120,150,210,.45);}
.nftbig.r-legendary .nft-frame{border-color:rgba(245,217,122,.8);box-shadow:0 0 30px rgba(245,183,49,.55);}
.nftbig::before{content:"";position:absolute;inset:-3px;border-radius:17px;z-index:-1;filter:blur(9px);opacity:0;background-size:300% 300%;}
.nftbig.r-limited::before{opacity:.85;background:linear-gradient(135deg,#cfe0ff,#7c93c7,#cfe0ff,#5a6da0);animation:nftAura 5s linear infinite;}
.nftbig.r-legendary::before{opacity:.95;background:linear-gradient(135deg,#f5d97a,#a855f7,#f5d97a,#7c3aed);animation:nftAura 5s linear infinite;}
@keyframes nftAura{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.nft-holo{position:absolute;inset:0;border-radius:14px;pointer-events:none;opacity:0;mix-blend-mode:color-dodge;background:repeating-linear-gradient(115deg,rgba(255,0,132,.28) 0%,rgba(255,214,0,.28) 14%,rgba(0,255,170,.28) 28%,rgba(0,168,255,.28) 42%,rgba(168,85,247,.28) 56%,rgba(255,0,132,.28) 70%);background-size:220% 220%;}
.nftbig.r-legendary .nft-holo{opacity:.5;animation:nftHolo 4.5s linear infinite;}
@keyframes nftHolo{0%{background-position:0% 0%}100%{background-position:220% 0%}}
.nft-glare{position:absolute;inset:0;border-radius:14px;pointer-events:none;opacity:0;mix-blend-mode:soft-light;background:radial-gradient(circle at var(--mx,50%) var(--my,40%),rgba(255,255,255,.85) 0%,rgba(255,255,255,.22) 18%,rgba(255,255,255,0) 45%);}
.nftbig.r-limited .nft-glare,.nftbig.r-legendary .nft-glare{opacity:1;}
.nft-sheen{position:absolute;inset:0;border-radius:14px;pointer-events:none;overflow:hidden;opacity:0;}
.nftbig.r-limited .nft-sheen,.nftbig.r-legendary .nft-sheen{opacity:1;}
.nft-sheen::after{content:"";position:absolute;top:-60%;left:-150%;width:60%;height:220%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:rotate(8deg);animation:nftSweep 4.3s ease-in-out infinite;}
@keyframes nftSweep{0%{left:-150%}35%,100%{left:160%}}
.nft-spark{position:absolute;width:4cqw;height:4cqw;pointer-events:none;opacity:0;background:radial-gradient(circle,#fff 0%,rgba(255,255,255,.6) 22%,transparent 60%);}
.nftbig .nft-spark{animation:nftTwinkle 1.9s ease-in-out infinite;}
.nft-spark.s0{left:7%;top:6%;}.nft-spark.s1{right:7%;top:6%;left:auto;animation-delay:.3s;}.nft-spark.s2{left:7%;bottom:6%;top:auto;animation-delay:.6s;}.nft-spark.s3{right:7%;bottom:6%;left:auto;top:auto;animation-delay:.9s;}
@keyframes nftTwinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1)}}
.nft-pop{animation:nftPop .5s ease-out both;}
@keyframes nftPop{0%{transform:scale(.3) rotate(-8deg);opacity:0}60%{transform:scale(1.12) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1}}
.nft-godray{position:fixed;inset:0;background:radial-gradient(circle at 50% 40%,rgba(245,200,90,.28),transparent 60%);pointer-events:none;animation:nftGod 2.4s ease-in-out infinite;}
@keyframes nftGod{0%,100%{opacity:.5}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.nftbig,.nft-holo,.nft-sheen::after,.nftbig::before,.nft-spark,.nft-pop,.nft-godray{animation:none!important;}}
/* ===== Cartas v255: brillo en grilla, limited plateada, sin borde girando ===== */
.nft-holo{background:repeating-linear-gradient(115deg,rgba(255,40,142,.5) 0%,rgba(255,210,63,.5) 12%,rgba(45,255,155,.5) 24%,rgba(45,181,255,.5) 36%,rgba(177,77,255,.5) 48%,rgba(255,40,142,.5) 60%);background-size:300% 300%;}
.nftbig.r-legendary .nft-holo{opacity:.62;}
.nftcard.r-legendary .nft-holo{opacity:.42;animation:nftHolo 4.5s linear infinite;}
.nftcard.r-legendary{animation:nftBreath 2.8s ease-in-out infinite;}
@keyframes nftBreath{0%,100%{box-shadow:inset 0 0 0 2px rgba(245,217,122,.75),0 0 16px rgba(245,183,49,.45);}50%{box-shadow:inset 0 0 0 2px rgba(245,217,122,1),0 0 32px rgba(245,183,49,.85);}}
.nftbig.r-limited .nft-holo{opacity:.42;filter:saturate(.4) brightness(1.18);animation:nftHolo 5s linear infinite;}
.nftcard.r-limited .nft-holo{opacity:.3;filter:saturate(.4) brightness(1.18);animation:nftHolo 5s linear infinite;}
.nftcard.r-limited{animation:nftBreathS 3.2s ease-in-out infinite;}
@keyframes nftBreathS{0%,100%{box-shadow:inset 0 0 0 2px rgba(205,220,245,.7),0 0 14px rgba(130,160,220,.4);}50%{box-shadow:inset 0 0 0 2px rgba(230,238,255,1),0 0 28px rgba(150,180,235,.72);}}
.nftcard.r-limited .nft-sheen,.nftcard.r-legendary .nft-sheen{opacity:1;}
.nftcard .nft-spark{animation:nftTwinkle 2.1s ease-in-out infinite;}
@media (prefers-reduced-motion:reduce){.nftcard.r-legendary,.nftcard.r-limited,.nftcard .nft-spark{animation:none!important;}}
/* ===== Reveal: cartas volteadas + efectos por rareza ===== */
.flipwrap{position:relative;perspective:1000px;cursor:pointer;aspect-ratio:1792/2400;}
.flipinner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.7,.2,1);}
.flipinner.flipped{transform:rotateY(180deg);}
.flipface{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;}
.flipfront-nft{transform:rotateY(180deg);}
.cardback{position:absolute;inset:0;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 35%,#241a3a,#120c20 70%,#0a0712);border:2px solid rgba(245,217,122,.5);box-shadow:inset 0 0 30px rgba(245,200,90,.12);}
.cardback::before{content:"";position:absolute;inset:6px;border:1px solid rgba(245,217,122,.28);border-radius:10px;pointer-events:none;}
.flipwrap:not(.done):hover .flipinner:not(.flipped){transform:translateY(-5px);}
.flipwrap.done:hover .flipinner.flipped{transform:rotateY(180deg) scale(1.04);}
.reveal-burst{position:absolute;inset:0;pointer-events:none;z-index:4;}
.reveal-burst::after{content:"";position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);}
.burst-limited::after{border:3px solid rgba(190,215,255,.95);box-shadow:0 0 22px rgba(150,190,255,.85);animation:ringOut .85s ease-out forwards;}
.burst-legendary::after{border:4px solid rgba(245,210,110,.97);box-shadow:0 0 32px rgba(245,200,90,.95);animation:ringOut 1.05s ease-out forwards;}
@keyframes ringOut{0%{width:8%;height:8%;opacity:1}100%{width:165%;height:165%;opacity:0}}
.epic-overlay{position:fixed;inset:0;z-index:5;pointer-events:none;overflow:hidden;}
.epic-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,240,200,.6),transparent 60%);animation:epicFlash 1.5s ease-out forwards;}
@keyframes epicFlash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}
.epic-rays{position:absolute;left:50%;top:45%;animation:epicSpinC 6s linear infinite;}
@keyframes epicSpinC{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.epic-rays span{position:absolute;left:0;top:0;width:4px;height:62vh;margin-left:-2px;transform-origin:top center;background:linear-gradient(rgba(245,210,110,0),rgba(245,210,110,.5),rgba(245,210,110,0));animation:epicFade 1.7s ease-out forwards;}
@keyframes epicFade{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
.epic-word{position:absolute;left:0;right:0;top:15%;text-align:center;font-family:'Bebas Neue';font-size:46px;letter-spacing:5px;color:#f7e2a0;text-shadow:0 0 26px rgba(245,200,90,.95);animation:epicWord 1.7s ease-out forwards;}
@keyframes epicWord{0%{transform:scale(.4);opacity:0}28%{transform:scale(1.12);opacity:1}82%{opacity:1}100%{transform:scale(1);opacity:0}}
@media (prefers-reduced-motion:reduce){.flipinner{transition:none}.reveal-burst::after,.epic-flash,.epic-rays span,.epic-word{animation:none!important;display:none}}
/* ===== Ceremonia de apertura: el sobre ===== */
.pack-stage{display:flex;flex-direction:column;align-items:center;gap:16px;padding:10px 0 4px;}
.pack{width:172px;height:236px;border-radius:16px;position:relative;cursor:pointer;overflow:hidden;border:2px solid rgba(255,255,255,.18);box-shadow:0 16px 40px rgba(0,0,0,.55);animation:packIdle 1.5s ease-in-out infinite;will-change:transform;}
.pack-shine{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.4),transparent 42%);pointer-events:none;}
.pack-label{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-family:'Bebas Neue',sans-serif;font-size:25px;letter-spacing:2px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.55);z-index:2;}
.pack-top{position:absolute;left:-2px;right:-2px;top:0;height:34px;background:rgba(255,255,255,.16);border-bottom:2px dashed rgba(255,255,255,.5);}
.pk-cinco{background:linear-gradient(160deg,#5b8def,#2a4db5 60%,#16285f);}
.pk-triple{background:linear-gradient(160deg,#b06bf0,#7c2fc4 60%,#421a78);}
.pk-god{background:linear-gradient(160deg,#ffe79a,#f5b400 55%,#9a6b00);border-color:rgba(255,240,180,.6);box-shadow:0 16px 50px rgba(245,183,49,.6);}
@keyframes packIdle{0%,100%{transform:rotate(-1.5deg) translateY(0)}50%{transform:rotate(1.5deg) translateY(-4px)}}
.pack.tear{animation:packShake .82s ease-in forwards;}
@keyframes packShake{0%{transform:rotate(0) translateY(0)}15%{transform:rotate(-4deg)}30%{transform:rotate(4deg)}45%{transform:rotate(-6deg)}60%{transform:rotate(6deg) scale(1.04)}80%{transform:scale(1.1);opacity:1}100%{transform:scale(1.22);opacity:0}}
.pack.tear .pack-top{animation:packLid .82s ease-in forwards;}
@keyframes packLid{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-64px) rotate(-14deg);opacity:0}}
.pack-burst{position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%) scale(0);background:radial-gradient(circle,#fff,rgba(255,255,255,.55) 38%,transparent 70%);z-index:3;pointer-events:none;}
.pack.tear .pack-burst{animation:packBurst .82s ease-out forwards;}
@keyframes packBurst{0%{transform:translate(-50%,-50%) scale(0);opacity:0}40%{opacity:1}100%{transform:translate(-50%,-50%) scale(36);opacity:0}}
@media (prefers-reduced-motion:reduce){.pack,.pack.tear,.pack.tear .pack-top,.pack.tear .pack-burst{animation:none!important;}}
/* ===== Suspenso: el dorso brilla según rareza (antes de revelar) ===== */
.flipwrap{z-index:0;}
.flipwrap .flipinner{z-index:1;}
.flipwrap::before{content:"";position:absolute;inset:-3px;border-radius:17px;z-index:0;opacity:0;pointer-events:none;transition:opacity .4s;}
.flipwrap.back-limited:not(.done)::before{opacity:1;animation:backPulseS 1.5s ease-in-out infinite;}
.flipwrap.back-legendary:not(.done)::before{opacity:1;animation:backPulse 1.2s ease-in-out infinite;}
@keyframes backPulseS{0%,100%{box-shadow:0 0 13px 1px rgba(150,190,255,.5)}50%{box-shadow:0 0 26px 5px rgba(150,190,255,.9)}}
@keyframes backPulse{0%,100%{box-shadow:0 0 16px 2px rgba(245,200,90,.55)}50%{box-shadow:0 0 36px 8px rgba(245,200,90,1)}}
/* ===== Confeti dorado (legendary / god pack) ===== */
.confetti{position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden;}
.confetti span{position:absolute;top:-7%;border-radius:2px;opacity:0;animation-name:confettiFall;animation-timing-function:cubic-bezier(.3,.6,.5,1);animation-fill-mode:forwards;}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(108vh) rotate(560deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){.flipwrap::before,.confetti{display:none!important;}}
/* ===== Vista héroe: resplandor ambiental detrás de la carta ===== */
.hero-glow{position:absolute;top:50%;left:50%;width:120%;height:120%;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;filter:blur(36px);opacity:0;}
.hero-legendary{opacity:.85;background:radial-gradient(circle,rgba(245,205,95,.9),rgba(245,183,49,.25) 45%,transparent 70%);animation:heroPulse 2.6s ease-in-out infinite;}
.hero-limited{opacity:.7;background:radial-gradient(circle,rgba(150,190,255,.82),rgba(120,150,210,.2) 45%,transparent 70%);}
@keyframes heroPulse{0%,100%{opacity:.6}50%{opacity:.95}}
@media (prefers-reduced-motion:reduce){.hero-legendary{animation:none!important;}}
/* ===== God Pack: cinemática a pantalla completa ===== */
.god-cine{position:fixed;inset:0;z-index:8;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;}
.god-flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,250,230,.92),rgba(245,200,90,.5) 40%,transparent 76%);animation:godFlash 2.4s ease-out forwards;}
@keyframes godFlash{0%{opacity:0}8%{opacity:1}45%{opacity:.45}100%{opacity:0}}
.god-rays{position:absolute;left:50%;top:50%;animation:godSpin 8s linear infinite;}
.god-rays span{position:absolute;left:0;top:0;width:6px;height:72vh;margin-left:-3px;transform-origin:top center;background:linear-gradient(rgba(245,210,110,0),rgba(245,215,120,.55),rgba(245,210,110,0));animation:godRayFade 2.4s ease-out forwards;}
@keyframes godSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes godRayFade{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
.god-title{position:relative;font-family:'Bebas Neue',sans-serif;font-size:clamp(46px,16vw,74px);letter-spacing:6px;color:#fff3c4;text-shadow:0 0 30px rgba(245,200,90,1),0 0 60px rgba(245,183,49,.85);animation:godTitle 2.4s cubic-bezier(.2,.8,.2,1) forwards;}
@keyframes godTitle{0%{transform:scale(.3);opacity:0}18%{transform:scale(1.15);opacity:1}30%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
.god-sub{position:relative;margin-top:6px;font-size:15px;font-weight:800;letter-spacing:2px;color:#f5d97a;text-shadow:0 0 12px rgba(245,200,90,.85);animation:godSub 2.4s ease-out forwards;}
@keyframes godSub{0%,15%{opacity:0}30%{opacity:1}82%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.god-flash,.god-rays,.god-rays span,.god-title,.god-sub{animation:none!important;}}
`;

const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ profile, size = "md" }) {
  const ac = championAvatarClass(profile);
  const sz = size === "sm" ? 28 : 34;
  const difunto = !!profile?.is_difunto;
  const luto = difunto ? { filter: "grayscale(1)", opacity: .6 } : {};
  const inner = profile?.avatar_url
    ? <img src={profile.avatar_url} alt={profile.name || ""} className={`avatar ${size === "sm" ? "sm" : ""} ${ac}`} style={{ objectFit: "cover", borderRadius: "50%", width: sz, height: sz, flexShrink: 0, ...luto }} />
    : <div className={`avatar ${size === "sm" ? "sm" : ""} ${ac}`} style={{ flexShrink: 0, ...luto }}>{initials(profile?.name)}</div>;
  if (!difunto) return inner;
  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      {inner}
      <span style={{ position: "absolute", top: -5, right: -5, fontSize: size === "sm" ? 12 : 14, lineHeight: 1, filter: "brightness(0) drop-shadow(0 0 1.5px rgba(255,255,255,.85))" }} title="Difunto">🎗️</span>
    </div>
  );
}

// ── Foto de cromo (foto dedicada → avatar → iniciales) ────────────────────────
function CromoFoto({ profile, size = 56 }) {
  const src = profile?.cromo_foto || profile?.avatar_url;
  const difunto = !!profile?.is_difunto;
  const luto = difunto ? { filter: "grayscale(1)", opacity: .6 } : {};
  if (src) return <img src={src} alt={profile?.name || ""} style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0, ...luto }} />;
  return <div style={{ width: size, height: size, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.34), fontWeight: 700, color: "var(--muted)", flexShrink: 0, ...luto }}>{initials(profile?.name)}</div>;
}

// ── Title helpers ─────────────────────────────────────────────────────────────
function getTitleInfo(profile) {
  const titles = profile?.titles || [];
  const wins = titles.filter(t => t.position === 1).length;
  const silvers = titles.filter(t => t.position === 2).length;
  return { wins, silvers, titles };
}

function TitleBadges({ profile, size = 14 }) {
  const { wins, silvers } = getTitleInfo(profile);
  if (!wins && !silvers) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {Array.from({ length: Math.min(wins, 4) }).map((_, i) => (
        <span key={"w"+i} style={{ fontSize: size, filter: "drop-shadow(0 0 4px rgba(245,183,49,.8))" }}>👑</span>
      ))}
      {Array.from({ length: Math.min(silvers, 4) }).map((_, i) => (
        <span key={"s"+i} style={{ fontSize: size, filter: "drop-shadow(0 0 4px rgba(176,188,208,.8))" }}>🥈</span>
      ))}
    </span>
  );
}

function ChampionName({ profile, name, style = {} }) {
  const { wins, silvers } = getTitleInfo(profile);
  if (wins > 0) return <span className="champion-name" style={style}>{name}</span>;
  if (silvers > 0) return <span className="silver-name" style={style}>{name}</span>;
  return <span style={style}>{name}</span>;
}

function frameClass(profile) {
  const f = profile?.avatar_frame;
  const ok = ["fuego", "neon", "rosa", "violeta", "verde", "azul"];
  return (f && ok.includes(f)) ? `frame-${f}` : "";
}
function championAvatarClass(profile) {
  const { wins, silvers } = getTitleInfo(profile);
  if (wins > 0) return "champion-avatar";
  if (silvers > 0) return "silver-avatar";
  return frameClass(profile);
}

function isLocked(kickoff, allMatches, matchDate) {
  // Usar match_date de la DB si está disponible, sino derivar del kickoff en UTC
  const dateKey = matchDate || new Date(kickoff).toISOString().slice(0, 10);
  const sameDayMatches = (allMatches || []).filter(m => {
    const mDateKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
    return mDateKey === dateKey;
  });
  if (sameDayMatches.length === 0) return new Date(kickoff).getTime() <= nowMs();
  const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
  const deadline = firstKickoff - 24 * 60 * 60 * 1000;
  return nowMs() >= deadline;
}

// ── Resultado de un pronóstico vs el partido (fuente única de verdad) ──────────
// Devuelve "exact" | "winner" | "goals" | "miss" | null (null si el partido no tiene resultado).
// "winner" = acertó el signo (local/empate/visita) sin clavar el marcador.
// "goals"  = acertó el total de goles sin acertar el signo ni el exacto.
function matchSign(h, a) { return h > a ? "H" : a > h ? "A" : "D"; }
function predOutcome(pred, match) {
  if (!pred || !match) return null;
  if (match.home_score == null || match.away_score == null) return null;
  if (pred.home_score == null || pred.away_score == null) return null;
  if (pred.home_score === match.home_score && pred.away_score === match.away_score) return "exact";
  if (matchSign(pred.home_score, pred.away_score) === matchSign(match.home_score, match.away_score)) return "winner";
  if ((pred.home_score + pred.away_score) === (match.home_score + match.away_score)) return "goals";
  return "miss";
}
const isExactPred = (pred, match) => predOutcome(pred, match) === "exact";
const isCorrectSign = (pred, match) => { const o = predOutcome(pred, match); return o === "exact" || o === "winner"; };

// ── Debtor helpers ────────────────────────────────────────────────────────────
function DebtorBadge({ profile }) {
  if (!profile?.is_debtor) return null;
  const days = profile.debt_since
    ? Math.floor((new Date() - new Date(profile.debt_since)) / 86400000)
    : 0;
  return (
    <span className="debtor-badge">
      <span className="icon">🚨</span>
      <span>💸 En deuda</span>
      {days > 0 && <span>· {days}d</span>}
    </span>
  );
}

function DebtorCounter({ profile }) {
  if (!profile?.is_debtor) return null;
  const days = profile.debt_since
    ? Math.floor((new Date() - new Date(profile.debt_since)) / 86400000)
    : 0;
  return (
    <div style={{ fontSize: 10, color: "var(--red)", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
      {profile.debt_amount > 0 && <span>Debe ${profile.debt_amount}</span>}
      {days > 0 && <span>· {days} día{days !== 1 ? "s" : ""} sin pagar</span>}
    </div>
  );
}

const DEBTOR_VIDEOS = [
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/videos/quiero_que_el_video_lo_genere.mp4",
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/videos/dale_continua_el_video_en_otro.mp4",
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/videos/continualo_en_otro_de_seg_p.mp4",
];

const DEBTOR_MESSAGES = [
  "💸 Che... ¿cuándo vas a pagar?",
  "🚨 El grupo sabe que no pagaste",
  "⏰ Ya van {days} días sin pagar...",
  "😤 Todos te están mirando en la tabla",
  "🤑 ${amount} no es tanto, ¡pagá ya!",
  "👀 Tus predicciones existen... tu pago no",
];

function DebtorOverlay({ profile, onDismiss }) {
  const days = profile.debt_since
    ? Math.floor((new Date() - new Date(profile.debt_since)) / 86400000)
    : 0;
  return (
    <div className="debtor-overlay">
      <div className="debtor-overlay-box">
        <div style={{ fontSize: 56, marginBottom: 12 }}>💸</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "var(--red)", letterSpacing: 2, marginBottom: 8 }}>
          PAGO PENDIENTE
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
          Tenés un pago pendiente de inscripción al torneo.
          {profile.debt_amount > 0 && <><br/><strong style={{ color: "var(--txt)" }}>${profile.debt_amount}</strong> sin abonar.</>}
          {days > 0 && <><br/>Hace <strong style={{ color: "var(--red)" }}>{days} día{days !== 1 ? "s" : ""}</strong> que no pagás.</>}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
          Contactá al organizador para regularizar tu situación y seguir participando.
        </div>
        <button onClick={onDismiss} style={{
          padding: "10px 24px", background: "var(--red-dim)", border: "1px solid var(--red)",
          borderRadius: 8, color: "var(--red)", fontSize: 13, cursor: "pointer", width: "100%",
        }}>
          Entendido, voy a pagar
        </button>
      </div>
    </div>
  );
}

// Popup de video cada 2 minutos para morosos
function DebtorVideoPopup({ profile, videoIndex, onClose }) {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [playing, setPlaying] = useState(false);
  const videoRef = React.useRef(null);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const days = profile.debt_since
    ? Math.floor((new Date() - new Date(profile.debt_since)) / 86400000)
    : 0;
  const msg = DEBTOR_MESSAGES[videoIndex % DEBTOR_MESSAGES.length]
    .replace("{days}", days)
    .replace("{amount}", profile.debt_amount || "?");

  // Arrancar countdown cuando empieza a reproducir
  function startCountdown() {
    setPlaying(true);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setCanClose(true); clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (!isMobile) {
      // Desktop: arrancar automático y countdown
      startCountdown();
    }
  }, []);

  function handlePlay() {
    if (videoRef.current) {
      videoRef.current.play();
      startCountdown();
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.92)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      {/* Mensaje */}
      <div style={{
        fontFamily: "Bebas Neue", fontSize: 22, color: "var(--red)",
        letterSpacing: 2, marginBottom: 16, textAlign: "center",
        animation: "debtorShake 2s ease-in-out infinite",
      }}>{msg}</div>

      {/* Video */}
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 12, overflow: "hidden", border: "2px solid var(--red)", marginBottom: 16, position: "relative" }}>
        <video
          ref={videoRef}
          src={DEBTOR_VIDEOS[videoIndex % DEBTOR_VIDEOS.length]}
          autoPlay={!isMobile}
          playsInline
          style={{ width: "100%", display: "block" }}
        />
        {/* Botón play manual en móvil */}
        {isMobile && !playing && (
          <div
            onClick={handlePlay}
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,.5)", cursor: "pointer",
            }}
          >
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, boxShadow: "0 0 20px rgba(255,77,109,.6)",
            }}>▶️</div>
          </div>
        )}
      </div>

      {/* Contador / botón cerrar */}
      {canClose ? (
        <button onClick={onClose} style={{
          padding: "12px 32px", background: "var(--red)", border: "none",
          borderRadius: 10, color: "#fff", fontFamily: "Bebas Neue",
          fontSize: 18, letterSpacing: 2, cursor: "pointer",
        }}>
          😭 Ya voy a pagar
        </button>
      ) : (
        <div style={{
          padding: "10px 24px", background: "var(--red-dim)",
          border: "1px solid rgba(255,77,109,.3)", borderRadius: 10,
          color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        }}>
          {playing
            ? <><div style={{ width: 16, height: 16, border: "2px solid var(--red)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />Podés cerrar en {countdown}s...</>
            : <span>👆 Tocá el video para reproducir</span>
          }
        </div>
      )}
    </div>
  );
}

// ── Hall of Shame ─────────────────────────────────────────────────────────────
function HallOfShame({ profiles }) {
  const eliminated = profiles.filter(p => p.is_eliminated).sort((a, b) => {
    const daysA = a.debt_since ? Math.floor((new Date() - new Date(a.debt_since)) / 86400000) : 0;
    const daysB = b.debt_since ? Math.floor((new Date() - new Date(b.debt_since)) / 86400000) : 0;
    return daysB - daysA;
  });

  if (eliminated.length === 0) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 20, color: "var(--green)", letterSpacing: 1 }}>¡Todos al día!</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Nadie ha sido eliminado por mala paga.</div>
    </div>
  );

  return (<>
    <div className="sec-hdr"><h2>💀 HALL OF SHAME</h2><span>{eliminated.length} eliminado{eliminated.length !== 1 ? "s" : ""}</span></div>

    <div style={{ background: "var(--red-dim)", border: "1px solid rgba(255,77,109,.3)", borderRadius: "var(--r)", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 11, color: "var(--red)", textTransform: "uppercase", letterSpacing: .5 }}>Eliminados por mala paga</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: "var(--red)" }}>{eliminated.length} jugador{eliminated.length !== 1 ? "es" : ""}</div>
      </div>
      <div style={{ fontSize: 40 }}>💀</div>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {eliminated.map((p, i) => {
        const days = p.debt_since ? Math.floor((new Date() - new Date(p.debt_since)) / 86400000) : 0;
        return (
          <div key={p.id} style={{
            background: "var(--card)", border: "1px solid rgba(255,77,109,.3)",
            borderRadius: "var(--r)", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            opacity: 0.85,
          }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "var(--red)", minWidth: 30, textAlign: "center", opacity: .5 }}>{i + 1}</div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar profile={p} size="md" />
              <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 14 }}>💀</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, textDecoration: "line-through", opacity: .6 }}>{p.name}</span>
                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "rgba(255,77,109,.2)", border: "1px solid rgba(255,77,109,.4)", color: "var(--red)", fontWeight: 700 }}>💀 Eliminado por mala paga</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10 }}>
                {p.debt_since && <span>Desde: {new Date(p.debt_since).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                {days > 0 && <span style={{ color: "var(--red)" }}>⏰ {days} día{days !== 1 ? "s" : ""} sin pagar</span>}
              </div>
            </div>
            {p.debt_amount > 0 && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "Bebas Neue", fontSize: 24, color: "var(--red)", textDecoration: "line-through", opacity: .6 }}>${p.debt_amount}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>no pagado</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </>);
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ onDone }) {
  const colors = ["#f5b731","#2adf7a","#4a9eff","#ff4d6d","#fff","#e09820"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, color: colors[i % colors.length],
    left: Math.random() * 100, delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2, size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? "50%" : "2px",
  }));
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, []);
  return (<>{pieces.map(p => (
    <div key={p.id} className="confetti-piece" style={{
      left: `${p.left}%`, background: p.color,
      width: p.size, height: p.size, borderRadius: p.shape,
      animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
    }}/>
  ))}</>);
}

// ── Countdown animado ─────────────────────────────────────────────────────────
function MatchCountdown({ kickoff, matchDate, matches: allMatches }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [deadlineMs, setDeadlineMs] = useState(null);

  useEffect(() => {
    function calc() {
      const dateKey = matchDate || new Date(kickoff).toISOString().slice(0, 10);
      const sameDayMatches = (allMatches || []).filter(m => {
        const mKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
        return mKey === dateKey;
      });
      const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
      const deadline = firstKickoff - 24 * 60 * 60 * 1000;
      setDeadlineMs(deadline);
      const diff = deadline - nowMs();
      if (diff <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 30 * 60 * 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [kickoff, matchDate]);

  if (!timeLeft) return null;
  return (
    <span style={{
      fontSize: 10, padding: "1px 7px", borderRadius: 20,
      background: urgent ? "var(--red-dim)" : "var(--gold-dim)",
      color: urgent ? "var(--red)" : "var(--gold)",
      border: `1px solid ${urgent ? "rgba(255,77,109,.3)" : "rgba(245,183,49,.3)"}`,
      fontFamily: "Bebas Neue", letterSpacing: .5,
      animation: urgent ? "popIn .3s ease" : "none",
    }}>⏱ {timeLeft}</span>
  );
}

// Línea explícita de cierre en hora local (para que nadie se confíe con el huso)
function DeadlineLabel({ kickoff, matchDate, matches: allMatches }) {
  const dateKey = matchDate || new Date(kickoff).toISOString().slice(0, 10);
  const sameDayMatches = (allMatches || []).filter(m => {
    const mKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
    return mKey === dateKey;
  });
  if (!sameDayMatches.length) return null;
  const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
  const deadlineMs = firstKickoff - 24 * 60 * 60 * 1000;
  if (deadlineMs - nowMs() <= 0) return null;
  return (
    <span style={{ fontSize: 10, color: "var(--muted)" }}>
      ⏰ Cierra {formatDeadline(deadlineMs)} {localTzName()}
    </span>
  );
}

// ── Achievements System ───────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Rendimiento
  { key: "sniper",        icon: "🎯", name: "Francotirador",   desc: "5 marcadores exactos",                      tier: "silver" },
  { key: "oracle",        icon: "🔮", name: "Adivino",         desc: "10 marcadores exactos",                     tier: "gold"   },
  { key: "onfire",        icon: "🔥", name: "En llamas",       desc: "Racha de 5 predicciones correctas seguidas", tier: "silver" },
  { key: "unstoppable",   icon: "⚡", name: "Imparable",       desc: "Racha de 10 predicciones correctas seguidas",tier: "gold"   },
  // Participación
  { key: "committed",     icon: "✅", name: "Comprometido",    desc: "Predecir todos los partidos de grupos",      tier: "silver" },
  { key: "gambler",       icon: "🃏", name: "Apostador",       desc: "Usar los 4 comodines",                      tier: "silver" },
  { key: "strategist",    icon: "📋", name: "Estratega",       desc: "Completar todas las predicciones pre-torneo",tier: "silver" },
  { key: "globetrotter",  icon: "🌍", name: "Mundialista",     desc: "Predecir al menos 1 partido de cada grupo", tier: "bronze" },
  { key: "earlybird",     icon: "⏰", name: "Madrugador",      desc: "Guardar una predicción 12hs antes del partido", tier: "bronze" },
  // Posición
  { key: "leader",        icon: "👑", name: "Líder",           desc: "Llegar al 1er lugar en algún snapshot",     tier: "gold"   },
  { key: "podium",        icon: "🏅", name: "Podio",           desc: "Estar en top 3 en algún snapshot",          tier: "silver" },
  { key: "champion",      icon: "🏆", name: "Campeón",         desc: "Terminar 1ro en la tabla final",            tier: "gold"   },
  { key: "comeback",      icon: "📈", name: "Remontada",       desc: "Subir 3+ posiciones en un snapshot",        tier: "silver" },
  // Precisión
  { key: "drawmaster",    icon: "🤝", name: "Empate técnico",  desc: "Predecir empate y acertar 3 veces",         tier: "bronze" },
  { key: "wildcard_ace",  icon: "🎪", name: "Comodín de oro",  desc: "Acertar exacto usando un comodín",          tier: "gold"   },
  { key: "perfectday",    icon: "💎", name: "Día perfecto",    desc: "Acertar todos los partidos de un día",      tier: "gold"   },
  // Divertidos
  { key: "unlucky",       icon: "💀", name: "Sin suerte",      desc: "5 predicciones incorrectas seguidas",       tier: "bronze" },
  { key: "iceman",        icon: "🧊", name: "Frío",            desc: "Predecir 0-0 y acertar 3 veces",           tier: "bronze" },
  // Momento
  { key: "lastminute",    icon: "🎯", name: "Última hora",     desc: "Guardar una predicción en los últimos 5 min antes del cierre", tier: "silver" },
  { key: "nightowl",      icon: "🌙", name: "Noctámbulo",      desc: "Guardar una predicción entre medianoche y las 6am",           tier: "bronze" },
  // Competitivos
  { key: "executioner",   icon: "😈", name: "Verdugo",         desc: "Ganarle en puntos al líder en un partido",                   tier: "gold"   },
  { key: "ghost",         icon: "👻", name: "Fantasma",        desc: "Ser el único que acertó un partido",                         tier: "gold"   },
  // Curiosos
  { key: "goat",          icon: "🐐", name: "GOAT",            desc: "Tener el puntaje más alto del grupo en algún momento",       tier: "gold"   },
  { key: "banger",        icon: "💣", name: "Bombazo",         desc: "Acertar un resultado con más de 4 goles en total",           tier: "silver" },
  { key: "consistent",    icon: "🔁", name: "Consistente",     desc: "Predecir al menos 1 partido por día durante 7 días seguidos",tier: "silver" },
];

const TIER_COLORS = {
  bronze: { bg: "rgba(205,127,50,.15)", border: "rgba(205,127,50,.4)", color: "#cd7f32" },
  silver: { bg: "rgba(176,188,208,.15)", border: "rgba(176,188,208,.4)", color: "#b0bcd0" },
  gold:   { bg: "rgba(245,183,49,.15)", border: "rgba(245,183,49,.4)",  color: "#f5b731" },
};

function calcAchievements({ predictions, matches, wildcards, snapshots, prePreds, userId }) {
  const myPreds = predictions.filter(p => p.user_id === userId);
  const mySnaps = snapshots.filter(s => s.user_id === userId).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const myWildcards = wildcards.filter(w => w.user_id === userId);
  const myPrePreds = prePreds.filter(p => p.user_id === userId);
  const finishedPreds = myPreds
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(p => p.match && p.match.home_score !== null && p.match.home_score !== undefined && p.match.away_score !== null && p.match.away_score !== undefined)
    .sort((a, b) => new Date(a.match.kickoff_at) - new Date(b.match.kickoff_at));

  const unlocked = new Set();

  // 🎯 Francotirador — 5 exactos
  const exactCount = finishedPreds.filter(p => isExactPred(p, p.match)).length;
  if (exactCount >= 5) unlocked.add("sniper");

  // 🔮 Adivino — 10 exactos
  if (exactCount >= 10) unlocked.add("oracle");

  // 🔥 En llamas — racha 5
  // ⚡ Imparable — racha 10
  let maxRacha = 0, curRacha = 0;
  for (const p of finishedPreds) {
    if (p.points > 0) { curRacha++; maxRacha = Math.max(maxRacha, curRacha); }
    else curRacha = 0;
  }
  if (maxRacha >= 5)  unlocked.add("onfire");
  if (maxRacha >= 10) unlocked.add("unstoppable");

  // ✅ Comprometido — predecir todos los partidos de grupos
  const groupMatches = matches.filter(m => m.phase === "Grupos" || !m.phase || m.phase === "");
  const predictedGroupIds = new Set(myPreds.map(p => p.match_id));
  if (groupMatches.length > 0 && groupMatches.every(m => predictedGroupIds.has(m.id)))
    unlocked.add("committed");

  // 🃏 Apostador — usar 4 comodines
  if (myWildcards.length >= 4) unlocked.add("gambler");

  // 📋 Estratega — completar pre-torneo (12 grupos x 2 posiciones + 8 terceros = 32)
  const groupStandings = myPrePreds.filter(p => p.prediction_type === "group_standing");
  const thirds = myPrePreds.filter(p => p.prediction_type === "third_place");
  if (groupStandings.length >= 24 && thirds.length >= 8) unlocked.add("strategist");

  // 🌍 Mundialista — predecir al menos 1 de cada grupo
  const groupsCovered = new Set(
    myPreds.map(p => matches.find(m => m.id === p.match_id)?.group_name).filter(Boolean)
  );
  if (groupsCovered.size >= 12) unlocked.add("globetrotter");

  // 👑 Líder — 1er lugar en algún snapshot
  if (mySnaps.some(s => s.position === 1)) unlocked.add("leader");

  // 🏅 Podio — top 3 en algún snapshot
  if (mySnaps.some(s => s.position <= 3)) unlocked.add("podium");

  // 📈 Remontada — subir 3+ posiciones en un snapshot
  for (let i = 1; i < mySnaps.length; i++) {
    if (mySnaps[i - 1].position - mySnaps[i].position >= 3) { unlocked.add("comeback"); break; }
  }

  // 🤝 Empate técnico — predecir empate y acertar 3 veces
  const drawWins = finishedPreds.filter(p => {
    const m = p.match;
    return p.home_score === p.away_score && m.home_score === m.away_score && p.points > 0;  // empate predicho y real, con puntos
  }).length;
  if (drawWins >= 3) unlocked.add("drawmaster");

  // 🎪 Comodín de oro — exacto con comodín
  const wcMatchIds = new Set(myWildcards.map(w => w.match_id));
  const wcExact = finishedPreds.some(p => wcMatchIds.has(p.match_id) && isExactPred(p, p.match));
  if (wcExact) unlocked.add("wildcard_ace");

  // 💎 Día perfecto — todos los partidos de un día acertados
  const byDay = {};
  finishedPreds.forEach(p => {
    const d = p.match.match_date;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(p);
  });
  const allMatchesByDay = {};
  matches.filter(m => m.status === "finished").forEach(m => {
    if (!allMatchesByDay[m.match_date]) allMatchesByDay[m.match_date] = [];
    allMatchesByDay[m.match_date].push(m);
  });
  for (const day of Object.keys(byDay)) {
    const dayTotal = allMatchesByDay[day]?.length || 0;
    const dayPreds = byDay[day];
    if (dayTotal > 0 && dayPreds.length === dayTotal && dayPreds.every(p => predOutcome(p, p.match) === "exact"))
      unlocked.add("perfectday");
  }

  // 💀 Sin suerte — racha 5 incorrectas
  let maxBadRacha = 0, curBadRacha = 0;
  for (const p of finishedPreds) {
    if ((p.points || 0) <= 0) { curBadRacha++; maxBadRacha = Math.max(maxBadRacha, curBadRacha); }
    else curBadRacha = 0;
  }
  if (maxBadRacha >= 5) unlocked.add("unlucky");

  // 🧊 Frío — predecir 0-0 y acertar 3 veces
  const zeroZero = finishedPreds.filter(p => {
    const m = p.match;
    return p.home_score === 0 && p.away_score === 0 && m.home_score === 0 && m.away_score === 0;
  }).length;
  if (zeroZero >= 3) unlocked.add("iceman");

  // ⏰ Madrugador — se marca desde la DB (se verifica si existe en achievements)
  // Este se guarda al guardar predicción, no se puede calcular retroactivo aquí

  // 🎯 Última hora — predicción en los últimos 5 min antes del cierre
  for (const p of myPreds) {
    const m = matches.find(m => m.id === p.match_id);
    if (!m || !p.updated_at) continue;
    const matchDate = new Date(m.kickoff_at).toISOString().slice(0, 10);
    const sameDayMatches = matches.filter(x => new Date(x.kickoff_at).toISOString().slice(0, 10) === matchDate);
    const firstKickoff = Math.min(...sameDayMatches.map(x => new Date(x.kickoff_at).getTime()));
    const deadline = new Date(firstKickoff - 24 * 60 * 60 * 1000);
    const savedAt = new Date(p.updated_at);
    const diffMs = deadline - savedAt;
    if (diffMs >= 0 && diffMs <= 5 * 60 * 1000) { unlocked.add("lastminute"); break; }
  }

  // 🌙 Noctámbulo — predicción entre medianoche y 6am UTC
  for (const p of myPreds) {
    if (!p.updated_at) continue;
    const hour = new Date(p.updated_at).getUTCHours();
    if (hour >= 0 && hour < 6) { unlocked.add("nightowl"); break; }
  }

  // 😈 Verdugo — ganarle en puntos al líder en un partido
  // El líder es quien tiene más puntos totales entre todos los usuarios
  const userTotals = {};
  predictions.forEach(p => {
    if (!userTotals[p.user_id]) userTotals[p.user_id] = 0;
    userTotals[p.user_id] += (p.points || 0);
  });
  const leaderEntry = Object.entries(userTotals).filter(([uid]) => uid !== userId).sort((a, b) => b[1] - a[1])[0];
  if (leaderEntry) {
    const leaderId = leaderEntry[0];
    const leaderPreds = predictions.filter(p => p.user_id === leaderId);
    for (const myP of finishedPreds) {
      const leaderP = leaderPreds.find(p => p.match_id === myP.match_id);
      if (leaderP && (myP.points || 0) > (leaderP.points || 0)) { unlocked.add("executioner"); break; }
    }
  }

  // 👻 Fantasma — único que acertó un partido
  for (const myP of finishedPreds) {
    if (!myP.points || myP.points <= 0) continue;
    const allForMatch = predictions.filter(p => p.match_id === myP.match_id && p.points > 0);
    if (allForMatch.length === 1 && allForMatch[0].user_id === userId) { unlocked.add("ghost"); break; }
  }

  // 🐐 GOAT — puntaje más alto del grupo en algún snapshot
  if (mySnaps.some(s => s.position === 1)) unlocked.add("goat");

  // 💣 Bombazo — acertar con 5+ goles totales
  for (const p of finishedPreds) {
    const m = p.match;
    if (!p.points || p.points <= 0) continue;
    const totalGoals = (m.home_score || 0) + (m.away_score || 0);
    if (totalGoals >= 5) { unlocked.add("banger"); break; }
  }

  // 🔁 Consistente — 7 días seguidos con al menos 1 predicción
  const predDays = [...new Set(
    myPreds.filter(p => p.updated_at).map(p => new Date(p.updated_at).toISOString().slice(0, 10))
  )].sort();
  let maxConsec = 1, curConsec = 1;
  for (let i = 1; i < predDays.length; i++) {
    const prev = new Date(predDays[i - 1]);
    const curr = new Date(predDays[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) { curConsec++; maxConsec = Math.max(maxConsec, curConsec); }
    else curConsec = 1;
  }
  if (maxConsec >= 7) unlocked.add("consistent");

  return unlocked;
}

// Toast de logro desbloqueado
function AchievementToast({ achievement, onClose }) {
  const tier = TIER_COLORS[achievement.tier];
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "var(--card)", border: `1px solid ${tier.border}`,
      borderRadius: 14, padding: "14px 20px", zIndex: 999,
      boxShadow: `0 0 30px ${tier.bg}`, display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp .3s ease", minWidth: 280, maxWidth: 340,
    }}>
      <span style={{ fontSize: 32 }}>{achievement.icon}</span>
      <div>
        <div style={{ fontSize: 10, color: tier.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
          🏆 Logro desbloqueado
        </div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 18, color: tier.color, letterSpacing: 1 }}>{achievement.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{achievement.desc}</div>
      </div>
    </div>
  );
}

// Sección de logros para el Dashboard
function AchievementsSection({ userId, achievements: unlocked, equippedBadge, onEquip }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const filtered = filter === "all" ? ACHIEVEMENTS
    : filter === "unlocked" ? ACHIEVEMENTS.filter(a => unlocked.has(a.key))
    : ACHIEVEMENTS.filter(a => !unlocked.has(a.key));
  const visible = expanded ? filtered : filtered.slice(0, 6);

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "16px", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1 }}>
          🏆 LOGROS <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "DM Sans" }}>({unlocked.size}/{ACHIEVEMENTS.length})</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["all","Todos"],["unlocked","✓"],["locked","🔒"]].map(([k,l]) => (
            <button key={k} onClick={() => { setFilter(k); setExpanded(false); }} style={{
              padding: "3px 10px", borderRadius: 20, border: "1px solid",
              borderColor: filter === k ? "var(--gold)" : "var(--border)",
              background: filter === k ? "var(--gold-dim)" : "none",
              color: filter === k ? "var(--gold)" : "var(--muted)",
              fontSize: 11, cursor: "pointer"
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Progreso */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ background: "var(--border)", borderRadius: 20, height: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 20, background: "linear-gradient(90deg,var(--gold),var(--gold2))", width: `${unlocked.size / ACHIEVEMENTS.length * 100}%`, transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, textAlign: "right" }}>
          {Math.round(unlocked.size / ACHIEVEMENTS.length * 100)}% completado
        </div>
      </div>

      {/* Lista de logros — una columna, fila horizontal compacta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map(a => {
          const isUnlocked = unlocked.has(a.key);
          const isEquipped = equippedBadge === a.key;
          const tier = TIER_COLORS[a.tier];
          return (
            <div key={a.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: isUnlocked ? tier.bg : "var(--surface)",
              border: `1px solid ${isUnlocked ? tier.border : "var(--border)"}`,
              borderRadius: 10, padding: "10px 12px",
              opacity: isUnlocked ? 1 : 0.4,
            }}>
              {/* Ícono */}
              <span style={{ fontSize: 22, flexShrink: 0, filter: isUnlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isUnlocked ? tier.color : "var(--muted)" }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.3 }}>{a.desc}</div>
              </div>
              {/* Acción */}
              {isUnlocked ? (
                <button onClick={() => onEquip(isEquipped ? null : a.key)} style={{
                  padding: "5px 12px", borderRadius: 20, border: "1px solid",
                  borderColor: isEquipped ? tier.color : "var(--border)",
                  background: isEquipped ? tier.bg : "none",
                  color: isEquipped ? tier.color : "var(--muted)",
                  fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {isEquipped ? "✓ Equipado" : "Equipar"}
                </button>
              ) : (
                <span style={{ fontSize: 13, flexShrink: 0, color: "var(--muted)" }}>🔒</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Ver más / menos */}
      {filtered.length > 6 && (
        <button onClick={() => setExpanded(e => !e)} style={{
          width: "100%", marginTop: 10, padding: "8px",
          background: "none", border: "1px solid var(--border)", borderRadius: 8,
          color: "var(--muted)", fontSize: 12, cursor: "pointer",
        }}>
          {expanded ? "▲ Ver menos" : `▼ Ver todos (${filtered.length - 6} más)`}
        </button>
      )}
    </div>
  );
}

// ── Deep Stats (equipo favorito, mapa de calor, pred vs realidad) ─────────────
// ── Gráfico de puntos por fecha (interactivo) ──
function PuntosChart({ evolucion }) {
  const [hover, setHover] = useState(null);
  const W = 340, H = 160, padL = 26, padR = 24, padT = 16, padB = 26;
  const maxY = Math.max(...evolucion.map(e => Math.max(e.miosAcum, e.promedioAcum)), 1);
  const xAt = i => padL + (i / Math.max(evolucion.length - 1, 1)) * (W - padL - padR);
  const yAt = v => padT + (1 - v / maxY) * (H - padT - padB);
  const lineMios = evolucion.map((e, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(e.miosAcum)}`).join(" ");
  const lineAvg = evolucion.map((e, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(e.promedioAcum)}`).join(" ");
  const areaMios = `${lineMios} L${xAt(evolucion.length - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`;
  const gridY = [0, 0.5, 1].map(f => f * maxY);

  function handleMove(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = Math.max(0, Math.min(W, ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width * W));
    let best = 0, bestD = Infinity;
    evolucion.forEach((_, i) => { const d = Math.abs(xAt(i) - px); if (d < bestD) { bestD = d; best = i; } });
    setHover(best);
  }

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>📈 Puntos por fecha</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 16, height: 3, background: "var(--gold)", borderRadius: 2 }} /><span style={{ color: "var(--muted)" }}>Vos</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 16, height: 3, background: "var(--muted)", borderRadius: 2, opacity: .6 }} /><span style={{ color: "var(--muted)" }}>Promedio grupo</span></div>
      </div>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}
        onTouchStart={handleMove} onTouchMove={handleMove} onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="gradPuntos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="transparent" />
        {gridY.map((v, i) => <line key={i} x1={padL} y1={yAt(v)} x2={W - padR} y2={yAt(v)} stroke="var(--border)" strokeWidth="1" opacity="0.5" />)}
        {gridY.map((v, i) => <text key={"gy" + i} x={padL - 6} y={yAt(v) + 3} textAnchor="end" fontSize="9" fill="var(--muted)">{Math.round(v)}</text>)}
        <path d={areaMios} fill="url(#gradPuntos)" />
        <path d={lineAvg} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" strokeLinejoin="round" />
        <path d={lineMios} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#glowGold)" />
        {hover !== null && <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={H - padB} stroke="var(--gold)" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />}
        {evolucion.map((e, i) => <circle key={i} cx={xAt(i)} cy={yAt(e.miosAcum)} r={hover === i ? 5 : 3} fill="var(--gold)" stroke="var(--surface)" strokeWidth={hover === i ? 2 : 0} style={{ transition: "r .1s" }} />)}
        {evolucion.map((e, i) => <text key={"x" + i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={hover === i ? "var(--gold)" : "var(--muted)"} fontWeight={hover === i ? "bold" : "normal"}>{e.fecha.replace("Jun ", "").replace("Jul ", "J")}</text>)}
        {hover !== null && (() => {
          const e = evolucion[hover]; const tx = Math.max(2, Math.min(W - 116, xAt(hover) - 58));
          return (<g>
            <rect x={tx} y={padT - 4} width="114" height="46" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
            <text x={tx + 8} y={padT + 9} fontSize="9.5" fill="var(--gold)" fontWeight="bold">Total: {e.miosAcum} pts</text>
            <text x={tx + 8} y={padT + 22} fontSize="9" fill="var(--txt)">Esta fecha: +{e.mios}</text>
            <text x={tx + 8} y={padT + 35} fontSize="9" fill="var(--muted)">Grupo: {e.promedioAcum} (+{e.promedio})</text>
          </g>);
        })()}
      </svg>
    </div>
  );
}

// ── Gráfico de posición en el tiempo (interactivo) ──
function PosicionChart({ misSnaps, totalJugadores }) {
  const [hover, setHover] = useState(null);
  const W = 340, H = 170, padL = 28, padR = 26, padT = 20, padB = 26;
  const xAt = i => padL + (i / Math.max(misSnaps.length - 1, 1)) * (W - padL - padR);
  const yAt = pos => padT + ((pos - 1) / Math.max(totalJugadores - 1, 1)) * (H - padT - padB);
  const linePos = misSnaps.map((sn, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(sn.position)}`).join(" ");
  const areaPos = `${linePos} L${xAt(misSnaps.length - 1)},${yAt(totalJugadores)} L${xAt(0)},${yAt(totalJugadores)} Z`;
  const mejorPos = Math.min(...misSnaps.map(sn => sn.position));
  const peorPos = Math.max(...misSnaps.map(sn => sn.position));
  const mejorIdx = misSnaps.findIndex(sn => sn.position === mejorPos);
  const step = Math.ceil(misSnaps.length / 6);
  const podioY = yAt(3); // límite inferior de la zona de podio (top 3)

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(W, ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width * W));
    let best = 0, bestD = Infinity;
    misSnaps.forEach((_, i) => { const d = Math.abs(xAt(i) - px); if (d < bestD) { bestD = d; best = i; } });
    setHover(best);
  }

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>🏆 Tu posición en el tiempo</div>
        <div style={{ fontSize: 10, color: "var(--gold)", background: "var(--gold-dim)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Mejor: {mejorPos}º</div>
      </div>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block", touchAction: "none" }}
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}
        onTouchStart={handleMove} onTouchMove={handleMove} onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradPodio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
          <filter id="glowBlue2" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="transparent" />

        {/* Zona podio (top 3) */}
        <rect x={padL} y={padT} width={W - padL - padR} height={Math.max(0, podioY - padT)} fill="url(#gradPodio)" />
        <line x1={padL} y1={podioY} x2={W - padR} y2={podioY} stroke="var(--gold)" strokeWidth="1" opacity="0.25" strokeDasharray="2 3" />
        <text x={padL + 3} y={podioY - 3} fontSize="7.5" fill="var(--gold)" opacity="0.6">PODIO</text>

        {/* Grilla de referencia */}
        <line x1={padL} y1={yAt(1)} x2={W - padR} y2={yAt(1)} stroke="var(--border)" strokeWidth="1" opacity="0.4" />
        <text x={padL - 6} y={yAt(1) + 3} textAnchor="end" fontSize="8.5" fill="var(--gold)" opacity="0.8">1º</text>
        <text x={padL - 6} y={yAt(totalJugadores) + 3} textAnchor="end" fontSize="8.5" fill="var(--muted)">{totalJugadores}º</text>

        {/* Guía de hover */}
        {hover !== null && <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={H - padB} stroke="var(--blue)" strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />}

        {/* Área + línea */}
        <path d={areaPos} fill="url(#gradPos)" />
        <path d={linePos} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#glowBlue2)" />

        {/* Anillo dorado en la mejor posición */}
        {mejorIdx >= 0 && <circle cx={xAt(mejorIdx)} cy={yAt(mejorPos)} r="7" fill="none" stroke="var(--gold)" strokeWidth="1.5" opacity="0.6" />}

        {/* Puntos */}
        {misSnaps.map((sn, i) => <circle key={i} cx={xAt(i)} cy={yAt(sn.position)} r={hover === i ? 5 : 3.2} fill={sn.position === mejorPos ? "var(--gold)" : "var(--blue)"} stroke="var(--surface)" strokeWidth={hover === i ? 2 : 1} style={{ transition: "r .1s" }} />)}

        {/* Etiquetas eje X */}
        {misSnaps.map((sn, i) => (i % step === 0 || i === misSnaps.length - 1) && <text key={"x" + i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={hover === i ? "var(--blue)" : "var(--muted)"} fontWeight={hover === i ? "bold" : "normal"}>{sn.snapshot_date.slice(5)}</text>)}

        {/* Tooltip */}
        {hover !== null && (() => {
          const sn = misSnaps[hover]; const tx = Math.max(2, Math.min(W - 72, xAt(hover) - 36));
          const ty = Math.max(2, yAt(sn.position) - 34);
          return (<g>
            <rect x={tx} y={ty} width="72" height="26" rx="6" fill="var(--card)" stroke="var(--blue)" strokeWidth="1" opacity="0.97" />
            <text x={tx + 36} y={ty + 16} textAnchor="middle" fontSize="10" fill="var(--blue)" fontWeight="bold">{sn.position}º · {sn.snapshot_date.slice(5)}</text>
          </g>);
        })()}
      </svg>
      <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>Mejor: <strong style={{ color: "var(--gold)" }}>{mejorPos}º</strong> · Peor: {peorPos}º</div>
    </div>
  );
}
function StatsDeep({ user, matches, predictions, snapshots, profiles }) {
  const myPreds = predictions.filter(p => p.user_id === user.id);
  const finished = myPreds
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(p => p.match && p.match.status === "finished" && p.points !== null);

  // ── Equipo favorito ──────────────────────────────────────────────────────
  const teamStats = {};
  finished.forEach(p => {
    const m = p.match;
    [m.home, m.away].forEach((team, idx) => {
      if (!teamStats[team]) teamStats[team] = { correct: 0, total: 0, flag: idx === 0 ? m.home_flag : m.away_flag };
      teamStats[team].total++;
      if (p.points > 0) teamStats[team].correct++;
    });
  });
  const bestTeam = Object.entries(teamStats)
    .filter(([, s]) => s.total >= 2)
    .map(([name, s]) => ({ name, ...s, pct: Math.round(s.correct / s.total * 100) }))
    .sort((a, b) => b.pct - a.pct || b.total - a.total)[0];

  // ── Vos vs el grupo (% de acierto comparado con los demás) ────────────────
  const finishedMatchIds = new Set(matches.filter(m => m.status === "finished").map(m => m.id));
  const accByUser = {};
  predictions.forEach(p => {
    if (!finishedMatchIds.has(p.match_id)) return;
    if (p.points === null) return;
    if (!accByUser[p.user_id]) accByUser[p.user_id] = { correct: 0, total: 0 };
    accByUser[p.user_id].total++;
    if (p.points > 0) accByUser[p.user_id].correct++;
  });
  const allPcts = Object.values(accByUser).filter(s => s.total > 0).map(s => s.correct / s.total);
  const avgPct = allPcts.length ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length : 0;
  const myAcc = accByUser[user.id] || { correct: 0, total: 0 };
  const myPct = myAcc.total > 0 ? myAcc.correct / myAcc.total : 0;
  // Ranking por % de acierto (cuántos tienen mejor % que yo)
  const sortedPcts = Object.entries(accByUser)
    .filter(([, s]) => s.total > 0)
    .map(([uid, s]) => ({ uid, pct: s.correct / s.total }))
    .sort((a, b) => b.pct - a.pct);
  const myRank = sortedPcts.findIndex(x => x.uid === user.id) + 1;
  const totalPlayers = sortedPcts.length;

  // ── Pred vs Realidad (últimos 10) ────────────────────────────────────────
  const lastTen = finished.slice(-10);
  // Resumen de cómo le fue en esos últimos partidos
  const lastTenSummary = lastTen.reduce((acc, p) => {
    const o = predOutcome(p, p.match);
    if (o === "exact") acc.exact++;
    else if (o === "winner" || o === "goals") acc.correct++;
    else acc.miss++;
    return acc;
  }, { exact: 0, correct: 0, miss: 0 });

  // ── Datos para gráficos de evolución ──
  // Fechas finalizadas en orden cronológico
  const finishedDates = [...new Set(matches.filter(m => m.status === "finished").map(m => m.match_date))]
    .sort((a, b) => {
      const ka = Math.min(...matches.filter(m => m.match_date === a).map(m => new Date(m.kickoff_at).getTime()));
      const kb = Math.min(...matches.filter(m => m.match_date === b).map(m => new Date(m.kickoff_at).getTime()));
      return ka - kb;
    });
  // Puntos por fecha: míos y promedio del grupo
  const evolucion = finishedDates.map(d => {
    const ids = matches.filter(m => m.match_date === d && m.status === "finished").map(m => m.id);
    const mine = predictions.filter(p => p.user_id === user.id && ids.includes(p.match_id))
      .reduce((sum, p) => sum + (p.points || 0), 0);
    // promedio del grupo: suma de puntos de cada usuario en esa fecha / nº usuarios que jugaron
    const byUser = {};
    predictions.forEach(p => {
      if (!ids.includes(p.match_id)) return;
      byUser[p.user_id] = (byUser[p.user_id] || 0) + (p.points || 0);
    });
    const vals = Object.values(byUser);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { fecha: d, mios: mine, promedio: Math.round(avg * 10) / 10 };
  });
  let accMios = 0, accAvg = 0;
  evolucion.forEach(e => {
    accMios += e.mios; accAvg += e.promedio;
    e.miosAcum = accMios;
    e.promedioAcum = Math.round(accAvg * 10) / 10;
  });

  // Evolución de posición (desde snapshots)
  const misSnaps = (snapshots || [])
    .filter(sn => sn.user_id === user.id)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
  const totalJugadores = (profiles || []).length || 1;

    if (finished.length === 0) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1, marginBottom: 8 }}>📊 ANÁLISIS DETALLADO</div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>Disponible cuando haya partidos finalizados con tus predicciones.</div>
    </div>
  );

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1, marginBottom: 16 }}>📊 ANÁLISIS DETALLADO</div>

      {/* ── Gráficos de evolución ── */}
      {evolucion.length >= 2 && <PuntosChart evolucion={evolucion} />}
      {misSnaps.length >= 2 && <PosicionChart misSnaps={misSnaps} totalJugadores={totalJugadores} />}


      {/* Equipo favorito */}
      {bestTeam && (
        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>⭐ Tu equipo favorito</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={bestTeam.flag} alt={bestTeam.name} style={{ width: 32, height: 24, objectFit: "cover", borderRadius: 3 }} />
            <div>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 20, color: "var(--gold)" }}>{bestTeam.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Acertás el <strong style={{ color: "var(--green)" }}>{bestTeam.pct}%</strong> de sus partidos ({bestTeam.correct}/{bestTeam.total})</div>
            </div>
          </div>
        </div>
      )}

      {/* Vos vs el grupo */}
      {myAcc.total > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 12 }}>📊 Vos vs el grupo</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: "center", background: "var(--card)", borderRadius: 8, padding: "10px 6px" }}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: myPct >= avgPct ? "var(--green)" : "var(--gold)" }}>{Math.round(myPct * 100)}%</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Tu acierto</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "var(--card)", borderRadius: 8, padding: "10px 6px" }}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--muted)" }}>{Math.round(avgPct * 100)}%</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>Promedio grupo</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", background: "var(--card)", borderRadius: 8, padding: "10px 6px" }}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--gold)" }}>{myRank}º</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>de {totalPlayers}</div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            {myPct >= avgPct
              ? <>Estás <strong style={{ color: "var(--green)" }}>por encima</strong> del promedio del grupo 🔥</>
              : <>Estás <strong style={{ color: "var(--gold)" }}>por debajo</strong> del promedio — ¡a remontar! 💪</>}
          </div>
        </div>
      )}

      {/* Predicción vs Realidad */}
      {lastTen.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>🎯 Predicción vs Realidad (últimos {lastTen.length})</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--gold)" }}>⭐ {lastTenSummary.exact} <span style={{ color: "var(--muted)", fontSize: 11 }}>exactos</span></span>
            <span style={{ color: "var(--green)" }}>✓ {lastTenSummary.correct} <span style={{ color: "var(--muted)", fontSize: 11 }}>correctos</span></span>
            <span style={{ color: "#ff8080" }}>✗ {lastTenSummary.miss} <span style={{ color: "var(--muted)", fontSize: 11 }}>fallos</span></span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lastTen.map((p, i) => {
              const m = p.match;
              const isExact = isExactPred(p, m);
              const isCorrect = isCorrectSign(p, m);
              const color = isExact ? "var(--gold)" : isCorrect ? "var(--green)" : "var(--red)";
              return (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto 1fr", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < lastTen.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.home}</div>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 15, color: "var(--muted)", textAlign: "center" }}>{p.home_score}–{p.away_score}</div>
                  <div style={{ fontSize: 14, textAlign: "center" }}>{isExact ? "⭐" : isCorrect ? "✅" : "❌"}</div>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 15, color, textAlign: "center" }}>{m.home_score}–{m.away_score}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.away}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "var(--muted)", justifyContent: "center" }}>
            <span>⭐ Exacto</span><span>✅ Correcto</span><span>❌ Falló</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hall of Fame ───────────────────────────────────────────────────────────────
function HallOfFame({ profiles, predictions, matches, snapshots, allAchievements }) {
  const rows = profiles.map(p => {
    const preds = predictions.filter(pr => pr.user_id === p.id);
    const pts = preds.reduce((s, pr) => s + (pr.points || 0), 0);
    // Predicciones sobre partidos finalizados, ordenadas cronológicamente
    const finishedPreds = preds
      .map(pr => ({ pr, m: (matches || []).find(mm => mm.id === pr.match_id) }))
      .filter(x => x.m && x.m.home_score != null && x.m.away_score != null)
      .sort((a, b) => new Date(a.m.kickoff_at) - new Date(b.m.kickoff_at));
    const exact = finishedPreds.filter(x => x.pr.home_score === x.m.home_score && x.pr.away_score === x.m.away_score).length;
    const userSnaps = (snapshots || []).filter(s => s.user_id === p.id);
    const daysFirst = userSnaps.filter(s => s.position === 1).length;
    // Racha máxima de exactos seguidos
    let maxStreak = 0, curStreak = 0;
    finishedPreds.forEach(x => {
      if (x.pr.home_score === x.m.home_score && x.pr.away_score === x.m.away_score) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
      else curStreak = 0;
    });
    // Mejor golpe (más puntos sacados en un solo partido — comodín exacto da 8)
    const bestHit = finishedPreds.reduce((best, x) => (x.pr.points || 0) > best ? (x.pr.points || 0) : best, 0);
    // El más arriesgado: exacto clavado con mayor cantidad de goles totales
    const riskyExact = finishedPreds
      .filter(x => x.pr.home_score === x.m.home_score && x.pr.away_score === x.m.away_score)
      .reduce((max, x) => Math.max(max, x.m.home_score + x.m.away_score), 0);
    return { ...p, pts, exact, daysFirst, maxStreak, bestHit, riskyExact };
  }).sort((a, b) => b.pts - a.pts);

  const categories = [
    { label: "🏆 Más puntos", key: "pts", unit: "pts", winner: [...rows].sort((a,b) => b.pts - a.pts)[0] },
    { label: "⭐ Más exactos", key: "exact", unit: "exactos", winner: [...rows].sort((a,b) => b.exact - a.exact)[0] },
    { label: "👑 Días en 1°", key: "daysFirst", unit: "días", winner: [...rows].sort((a,b) => b.daysFirst - a.daysFirst)[0] },
    { label: "🔥 Mejor racha", key: "maxStreak", unit: "exactos seguidos", winner: [...rows].sort((a,b) => b.maxStreak - a.maxStreak)[0], min: 2 },
    { label: "💥 Mejor golpe", key: "bestHit", unit: "pts en un partido", winner: [...rows].sort((a,b) => b.bestHit - a.bestHit)[0], min: 1 },
    { label: "🎲 El más arriesgado", key: "riskyExact", unit: "goles en un exacto", winner: [...rows].sort((a,b) => b.riskyExact - a.riskyExact)[0], min: 1 },
  ];

  return (<>
    <div className="sec-hdr"><h2>🏅 SALÓN DE LA FAMA</h2></div>
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.filter(cat => cat.winner && cat.winner[cat.key] >= (cat.min || 0)).map(cat => (
          <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 14, color: "var(--gold)", minWidth: 110 }}>{cat.label}</div>
            <Avatar profile={cat.winner} size="sm" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.winner.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{cat.winner[cat.key]} {cat.unit}</div>
            </div>
            {cat.winner.equipped_badge && (() => { const a = ACHIEVEMENTS.find(a => a.key === cat.winner.equipped_badge); return a ? <span style={{ fontSize: 20 }}>{a.icon}</span> : null; })()}
          </div>
        ))}
      </div>
    </div>
  </>);
}
// ── Info Tab ─────────────────────────────────────────────────────────────────
function InfoTab({ user, isAdmin, matches, allPredictions, profiles }) {
  const [subTab, setSubTab] = useState("rules");
  return (<>
    <div className="sec-hdr"><h2>📋 INFO</h2></div>
    <div className="pre-tabs" style={{marginBottom:20}}>
      <button className={`pre-tab ${subTab==="rules"?"active":""}`} onClick={()=>setSubTab("rules")}>📜 Reglamento</button>
      <button className={`pre-tab ${subTab==="prizes"?"active":""}`} onClick={()=>setSubTab("prizes")}>🏆 Premios</button>
    </div>

    {subTab === "rules" && (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"20px 24px"}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:20,color:"var(--gold)",letterSpacing:1,marginBottom:16}}>⚽ PUNTOS POR PARTIDO</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {pts:"5 pts", desc:"Acertar el resultado exacto (ganador y marcador)", color:"var(--gold)"},
              {pts:"3 pts", desc:"Acertar únicamente el ganador", color:"var(--green)"},
              {pts:"1 pt",  desc:"Acertar únicamente la cantidad total de goles", color:"var(--blue)"},
            ].map((r,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"var(--surface)",borderRadius:10}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:28,color:r.color,minWidth:60,textAlign:"center"}}>{r.pts}</div>
                <div style={{fontSize:14,color:"var(--txt)"}}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"20px 24px"}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:20,color:"var(--gold)",letterSpacing:1,marginBottom:16}}>🏆 BONIFICACIÓN FASE DE GRUPOS</div>
          <div style={{padding:"12px 16px",background:"var(--surface)",borderRadius:10,fontSize:14,color:"var(--txt)",lineHeight:1.7}}>
            <strong style={{color:"var(--gold)"}}>+1 punto extra</strong> por cada equipo cuya posición de clasificación sea acertada (1°, 2° y los 8 mejores terceros).
          </div>
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"20px 24px"}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:20,color:"var(--gold)",letterSpacing:1,marginBottom:16}}>🃏 REGLAS DEL COMODÍN</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {[
              {label:"Cantidad", value:"5 comodines por participante para todo el torneo"},
              {label:"Costo", value:"Activar un comodín resta 1 punto de la tabla general"},
              {label:"Límites", value:"Intransferibles · Máximo 1 por partido"},
            ].map((r,i) => (
              <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",background:"var(--surface)",borderRadius:10}}>
                <span style={{fontSize:12,color:"var(--gold)",fontWeight:700,minWidth:80,textTransform:"uppercase",letterSpacing:.5,paddingTop:2}}>{r.label}</span>
                <span style={{fontSize:14,color:"var(--txt)"}}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{fontFamily:"Bebas Neue",fontSize:16,color:"var(--gold)",letterSpacing:1,marginBottom:10}}>Puntuación con comodín activado:</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {pts:"8 pts", desc:"Acertar resultado exacto", color:"var(--gold)"},
              {pts:"5 pts", desc:"Acertar únicamente el ganador", color:"var(--green)"},
              {pts:"2 pts", desc:"Acertar únicamente la cantidad total de goles", color:"var(--blue)"},
            ].map((r,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 14px",background:"var(--surface)",borderRadius:10}}>
                <div style={{fontFamily:"Bebas Neue",fontSize:24,color:r.color,minWidth:60,textAlign:"center"}}>{r.pts}</div>
                <div style={{fontSize:14,color:"var(--txt)"}}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {subTab === "prizes" && (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[
          {pos:"🥇 1er Lugar", pct:"75%", monto:"$540", desc:"del acumulado total", color:"var(--gold)", bg:"rgba(245,183,49,.1)", border:"rgba(245,183,49,.3)"},
          {pos:"🥈 2do Lugar", pct:"25%", monto:"$180", desc:"del acumulado total", color:"#b0bcd0", bg:"rgba(176,188,208,.1)", border:"rgba(176,188,208,.3)"},
          {pos:"🥉 3er Lugar", pct:"🎟️", desc:"Participación gratis en la siguiente quiniela", color:"#cd7f32", bg:"rgba(205,127,50,.1)", border:"rgba(205,127,50,.3)"},
          {pos:"✨ Premio Especial", pct:"🏰", desc:"Una experiencia soñada: entrada gratis para 2 personas a cualquier parque de Disney a tu elección. Incluye guía turístico, descuento en bebidas y comidas, y fotos gratis para el recuerdo.", donor:"Premio donado por Florentino Pérez Quintero", color:"#e85d9c", bg:"rgba(232,93,156,.1)", border:"rgba(232,93,156,.4)"},
        ].map((p,i) => (
          <div key={i} style={{background:p.bg,border:`1px solid ${p.border}`,borderRadius:"var(--r)",padding:"24px 28px",display:"flex",alignItems:"center",gap:20}}>
            <div style={{minWidth:80,textAlign:"center"}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:48,color:p.color,lineHeight:1}}>{p.pct}</div>
              {p.monto && <div style={{fontFamily:"Bebas Neue",fontSize:28,color:p.color,letterSpacing:1,marginTop:2}}>{p.monto}</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"Bebas Neue",fontSize:22,color:p.color,letterSpacing:1}}>{p.pos}</div>
              <div style={{fontSize:14,color:"var(--muted)",marginTop:4,lineHeight:1.5}}>{p.desc}</div>
              {p.donor && <div style={{marginTop:10,display:"inline-block",fontSize:12,fontWeight:700,color:p.color,background:"rgba(0,0,0,.25)",border:`1px solid ${p.border}`,borderRadius:20,padding:"4px 14px"}}>🎁 {p.donor}</div>}
            </div>
          </div>
        ))}
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"16px 20px",textAlign:"center",fontSize:13,color:"var(--muted)"}}>
          💰 El acumulado se calcula sobre el total de inscripciones del torneo.
        </div>
      </div>
    )}
  </>);
}
// ── Auth ──────────────────────────────────────────────────────────────────────
// ── Cronista IA ───────────────────────────────────────────────────────────────

// Segundos que el cuerpo de una crónica debe permanecer visible en pantalla
// para contarla como "leída". Como las crónicas son largas, 10s evita falsos
// positivos por el auto-expand de la última (estar expandida no alcanza: hay
// que quedarse mirándola).
const CHRONICLE_READ_SECONDS = 10;

// Observa la visibilidad real del cuerpo y, tras CHRONICLE_READ_SECONDS seguidos
// en pantalla, dispara onRead(chronicleId) una sola vez. Si el usuario scrollea
// y se va antes, el timer se resetea.
function ReadObserver({ active, chronicleId, onRead, children }) {
  const ref = React.useRef(null);
  const timerRef = React.useRef(null);
  const doneRef = React.useRef(false);
  useEffect(() => {
    if (!active || doneRef.current) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
    const obs = new IntersectionObserver((entries) => {
      const visible = !!entries[0] && entries[0].isIntersecting;
      if (visible && !timerRef.current && !doneRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          doneRef.current = true;
          onRead(chronicleId);
        }, CHRONICLE_READ_SECONDS * 1000);
      } else if (!visible) {
        clearTimer();
      }
    }, { threshold: 0.01 });
    obs.observe(el);
    return () => { obs.disconnect(); clearTimer(); };
  }, [active, chronicleId, onRead]);
  return <div ref={ref}>{children}</div>;
}

function CronistaTab({ user, isAdmin, matches, allPredictions, profiles }) {
  const [chronicles, setChronicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [ideas, setIdeas] = useState("");
  const [usarReacciones, setUsarReacciones] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editCuerpo, setEditCuerpo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [cronSub, setCronSub] = useState("lista");
  const [cronReactions, setCronReactions] = useState({});
  const [expandedChron, setExpandedChron] = useState({});
  const [reads, setReads] = useState({});        // { chronicle_id: [ {user_id, read_at}, ... ] }
  const [showReaders, setShowReaders] = useState({}); // panel admin "quién leyó" por crónica
  const CRON_EMOJIS = ["😂","🔥","😭","❤️","👎"];

  // Ordenar las fechas cronológicamente por el primer kickoff de cada día (no alfabéticamente por texto)
  const dateFirstKickoff = {};
  matches.forEach(m => {
    const t = m.kickoff_at ? new Date(m.kickoff_at).getTime() : Number.MAX_SAFE_INTEGER;
    if (dateFirstKickoff[m.match_date] === undefined || t < dateFirstKickoff[m.match_date]) dateFirstKickoff[m.match_date] = t;
  });
  const ordenFecha = (a, b) => (dateFirstKickoff[a] || 0) - (dateFirstKickoff[b] || 0);
  const allDates = [...new Set(matches.map(m => m.match_date))].sort(ordenFecha);
  function jornadaLabel(d) {
    const i = allDates.indexOf(d);
    return i >= 0 ? `Fecha ${i + 1}` : d;
  }
  const hasScore = (m) => m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined;
  const fechasFinished = [...new Set(matches.filter(hasScore).map(m => m.match_date))].sort(ordenFecha).reverse();

  async function loadChronicles() {
    setLoading(true);
    const { data } = await sb.from("chronicles").select("*").order("created_at", { ascending: false });
    setChronicles(data || []);
    setLoading(false);
  }
  async function loadCronReactions() {
    const { data } = await sb.from("chronicle_reactions").select("*");
    const byChron = {};
    (data || []).forEach(r => { (byChron[r.chronicle_id] = byChron[r.chronicle_id] || []).push(r); });
    setCronReactions(byChron);
  }
  async function toggleCronReaction(chronicleId, emoji) {
    const mine = (cronReactions[chronicleId] || []).find(r => r.user_id === user.id);
    if (mine) {
      if (mine.emoji === emoji) {
        await sb.from("chronicle_reactions").delete().eq("id", mine.id);
      } else {
        await sb.from("chronicle_reactions").update({ emoji }).eq("id", mine.id);
      }
    } else {
      await sb.from("chronicle_reactions").insert({ user_id: user.id, chronicle_id: chronicleId, emoji });
    }
    await loadCronReactions();
  }
  function cronReactionCounts(chronicleId) {
    const counts = {};
    (cronReactions[chronicleId] || []).forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    return counts;
  }
  async function loadReads() {
    const { data } = await sb.from("chronicle_reads").select("*");
    const byChron = {};
    (data || []).forEach(r => { (byChron[r.chronicle_id] = byChron[r.chronicle_id] || []).push(r); });
    setReads(byChron);
  }
  // Registra (una sola vez) que el usuario actual leyó una crónica.
  // ignoreDuplicates: conserva el primer read_at y no pisa lecturas previas.
  const recordRead = useCallback(async (chronicleId) => {
    let alreadyRead = false;
    setReads(prev => {
      const rows = prev[chronicleId] || [];
      if (rows.some(r => r.user_id === user.id)) { alreadyRead = true; return prev; }
      return { ...prev, [chronicleId]: [...rows, { chronicle_id: chronicleId, user_id: user.id, read_at: new Date().toISOString() }] };
    });
    if (alreadyRead) return;
    await sb.from("chronicle_reads").upsert(
      { chronicle_id: chronicleId, user_id: user.id },
      { onConflict: "chronicle_id,user_id", ignoreDuplicates: true }
    );
  }, [user.id]);
  useEffect(() => { loadChronicles(); loadCronReactions(); loadReads(); }, []);
  // Expandir por defecto la crónica más reciente (la primera del array ya viene ordenada desc)
  useEffect(() => {
    if (chronicles.length > 0) {
      setExpandedChron(prev => (prev[chronicles[0].id] === undefined ? { ...prev, [chronicles[0].id]: true } : prev));
    }
  }, [chronicles]);
  useEffect(() => { if (!selectedDate && fechasFinished.length) setSelectedDate(fechasFinished[0]); }, [fechasFinished.length]);

  async function buildResumen(matchDate) {
    const finished = matches.filter(m => m.match_date === matchDate && hasScore(m));
    const matchIds = finished.map(m => m.id);

    const { data: wcs } = await sb.from("wildcards").select("*")
      .in("match_id", matchIds.length ? matchIds : ["00000000-0000-0000-0000-000000000000"]);
    const wcSet = new Set((wcs || []).map(w => `${w.user_id}:${w.match_id}`));

    const { data: prePreds } = await sb.from("pretournament_predictions").select("*");
    const { data: snaps } = await sb.from("ranking_snapshots").select("*").order("snapshot_date");

    const nameById = {};
    profiles.forEach(p => { nameById[p.id] = p.name; });
    const matchById = {};
    finished.forEach(m => { matchById[m.id] = m; });
    const win = (h, a) => h > a ? "L" : a > h ? "V" : "E";

    // Detalle por partido: quién clavó el exacto y quién erró más feo
    const partidos = finished.map(m => {
      const mp = allPredictions.filter(p => p.match_id === m.id && p.home_score != null && p.away_score != null);
      const clavaron_exacto = mp
        .filter(p => p.home_score === m.home_score && p.away_score === m.away_score)
        .map(p => nameById[p.user_id]).filter(Boolean);
      let peor = null, peorDist = -1;
      mp.forEach(p => {
        const dist = Math.abs(p.home_score - m.home_score) + Math.abs(p.away_score - m.away_score)
          + (win(p.home_score, p.away_score) !== win(m.home_score, m.away_score) ? 3 : 0);
        if (dist > peorDist) { peorDist = dist; peor = { nombre: nameById[p.user_id] || "?", pronostico: `${p.home_score}-${p.away_score}` }; }
      });
      return {
        local: m.home, visitante: m.away,
        resultado: `${m.home_score}-${m.away_score}`,
        fase: m.group_name ? `Grupo ${m.group_name}` : (m.phase || ""),
        clavaron_exacto, peor_pronostico: peor,
      };
    });

    // Comodines de la fecha y cómo les fue
    const comodines = (wcs || []).map(w => {
      const m = matchById[w.match_id];
      if (!m) return null;
      const p = allPredictions.find(pr => pr.user_id === w.user_id && pr.match_id === w.match_id);
      if (!p || p.home_score == null) return null;
      const o = predOutcome(p, m);
      const salio = o === "exact" ? "exacto" : o === "winner" ? "ganador" : o === "goals" ? "goles" : "falló";
      return {
        nombre: nameById[w.user_id] || "?",
        partido: `${m.home} ${m.home_score}-${m.away_score} ${m.away}`,
        pronostico: `${p.home_score}-${p.away_score}`,
        salio, puntos: p.points || 0,
      };
    }).filter(Boolean);

    // Tabla de la fecha (exactos/ganadores/fallos calculados de verdad)
    const fechaMap = {};
    allPredictions.forEach(p => {
      if (!matchIds.includes(p.match_id)) return;
      const m = matchById[p.match_id];
      if (!m || p.home_score == null) return;
      if (!fechaMap[p.user_id]) fechaMap[p.user_id] = { nombre: nameById[p.user_id] || "Desconocido", puntos_fecha: 0, exactos: 0, ganadores: 0, fallos: 0, uso_comodin: false };
      const e = fechaMap[p.user_id];
      e.puntos_fecha += (p.points || 0);
      if (p.home_score === m.home_score && p.away_score === m.away_score) e.exactos += 1;
      else if (win(p.home_score, p.away_score) === win(m.home_score, m.away_score)) e.ganadores += 1;
      else if ((p.points || 0) === 0) e.fallos += 1;
      if (wcSet.has(`${p.user_id}:${p.match_id}`)) e.uso_comodin = true;
    });
    const tabla_fecha = Object.values(fechaMap).sort((a, b) => b.puntos_fecha - a.puntos_fecha);
    const heroe_fecha = tabla_fecha[0] || null;
    const papelon_fecha = tabla_fecha.length ? tabla_fecha[tabla_fecha.length - 1] : null;

    // Tabla general
    const general = profiles.map(p => {
      const mPts = allPredictions.filter(pr => pr.user_id === p.id).reduce((s, pr) => s + (pr.points || 0), 0);
      const pPts = (prePreds || []).filter(pr => pr.user_id === p.id).reduce((s, pr) => s + (pr.points || 0), 0);
      return { nombre: p.name, puntos: mPts + pPts };
    }).sort((a, b) => b.puntos - a.puntos);
    const tabla_general = general.slice(0, 5).map((g, i) => ({ puesto: i + 1, nombre: g.nombre, puntos: g.puntos }));
    const colista = general.length ? { puesto: general.length, nombre: general[general.length - 1].nombre, puntos: general[general.length - 1].puntos } : null;

    const morosos = profiles.filter(p => p.is_debtor).map(p => p.name);
    const eliminados = profiles.filter(p => p.is_eliminated).map(p => p.name);

    // ── Datos jugosos para el Cronista ──
    const datesOrder = [...new Set(matches.filter(hasScore).map(m => m.match_date))]
      .sort((a, b) => {
        const ka = Math.min(...matches.filter(m => m.match_date === a).map(m => new Date(m.kickoff_at).getTime()));
        const kb = Math.min(...matches.filter(m => m.match_date === b).map(m => new Date(m.kickoff_at).getTime()));
        return ka - kb;
      });
    const idxHasta = datesOrder.indexOf(matchDate);
    const datesHasta = idxHasta >= 0 ? datesOrder.slice(0, idxHasta + 1) : datesOrder;
    function rachaDe(userId) {
      let aciertoStreak = 0, falloStreak = 0, corte = false;
      for (let i = datesHasta.length - 1; i >= 0 && !corte; i--) {
        const d = datesHasta[i];
        const ids = matches.filter(m => m.match_date === d && hasScore(m)).map(m => m.id);
        const preds = allPredictions.filter(p => ids.includes(p.match_id) && p.home_score != null && p.user_id === userId);
        if (!preds.length) continue;
        const acertoAlgo = preds.some(p => (p.points || 0) > 0);
        if (i === datesHasta.length - 1) {
          if (acertoAlgo) aciertoStreak = 1; else falloStreak = 1;
        } else {
          if (aciertoStreak > 0 && acertoAlgo) aciertoStreak++;
          else if (falloStreak > 0 && !acertoAlgo) falloStreak++;
          else corte = true;
        }
      }
      if (aciertoStreak >= 2) return { tipo: "acertando", fechas: aciertoStreak };
      if (falloStreak >= 2) return { tipo: "sin_acertar", fechas: falloStreak };
      return null;
    }
    const uidByName = {};
    Object.keys(fechaMap).forEach(uid => { uidByName[fechaMap[uid].nombre] = uid; });
    const heroe_racha = heroe_fecha ? rachaDe(uidByName[heroe_fecha.nombre]) : null;
    const papelon_racha = papelon_fecha ? rachaDe(uidByName[papelon_fecha.nombre]) : null;

    let escalador = null, desplomado = null;
    if (Array.isArray(snaps) && snaps.length) {
      const snapDates = [...new Set(snaps.map(s => s.snapshot_date))].sort();
      if (snapDates.length >= 2) {
        const hoy = snapDates[snapDates.length - 1];
        const ayer = snapDates[snapDates.length - 2];
        const posHoy = {}, posAyer = {};
        snaps.forEach(s => { if (s.snapshot_date === hoy) posHoy[s.user_id] = s.position; if (s.snapshot_date === ayer) posAyer[s.user_id] = s.position; });
        let maxSube = 0, maxBaja = 0;
        Object.keys(posHoy).forEach(uid => {
          if (posAyer[uid] == null) return;
          const delta = posAyer[uid] - posHoy[uid];
          if (delta > maxSube) { maxSube = delta; escalador = { nombre: nameById[uid] || "?", subio: delta, de: posAyer[uid], a: posHoy[uid] }; }
          if (-delta > maxBaja) { maxBaja = -delta; desplomado = { nombre: nameById[uid] || "?", bajo: -delta, de: posAyer[uid], a: posHoy[uid] }; }
        });
      }
    }

    // Perfiles secretos de los jugadores (munición para el Cronista)
    const perfiles_jugadores = profiles
      .filter(p => (p.cronista_perfil || "").trim().length > 0)
      .map(p => ({ nombre: p.name, perfil: p.cronista_perfil.trim() }));

    // Hitos NFT recientes (munición extra para el Cronista): desde la crónica anterior
    let hitos_nft = [];
    try {
      const idxN = allDates.indexOf(matchDate);
      const prevN = chronicles
        .filter(c => c.published && c.created_at && allDates.indexOf(c.match_date) > -1 && allDates.indexOf(c.match_date) < idxN)
        .sort((a, b) => allDates.indexOf(b.match_date) - allDates.indexOf(a.match_date))[0];
      const cutoff = (prevN && prevN.created_at) ? prevN.created_at : new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const { data: evs } = await sb.from("nft_events").select("*").gt("created_at", cutoff).order("created_at", { ascending: true });
      if (evs && evs.length) {
        const nm = id => (profiles.find(p => p.id === id) || {}).name || "alguien";
        hitos_nft = evs.map(e => {
          const d = e.detail || {};
          if (e.tipo === "legendary_sobre") return `${nm(e.user_id)} sacó de un sobre la legendary "${d.nombre || "?"}" 🃏`;
          if (e.tipo === "subasta_vendida") return `${nm(d.comprador_id)} le ganó a ${nm(d.vendedor_id)} la subasta de "${d.nombre || "?"}" por ${d.precio} Petros`;
          if (e.tipo === "legendary_reciclada") return `${nm(e.user_id)} mandó al reciclador la legendary "${d.nombre || "?"}" por ${d.reward} Petros`;
          return null;
        }).filter(Boolean);
      }
    } catch (_e) {}

    return {
      jornada: jornadaLabel(matchDate),
      partidos, comodines, tabla_fecha,
      heroe_fecha, papelon_fecha,
      heroe_racha, papelon_racha,
      escalador, desplomado,
      tabla_general, lider: tabla_general[0] || null, colista,
      morosos, eliminados,
      perfiles_jugadores,
      hitos_nft,
    };
  }

  async function generar(dateArg) {
    const date = (typeof dateArg === "string" ? dateArg : null) || selectedDate;
    if (!date) return;
    setGenerating(true); setError("");
    try {
      const resumen = await buildResumen(date);
      // Crónicas anteriores (publicadas, cronológicamente previas) para dar continuidad
      const idxActual = allDates.indexOf(date);
      const historial = chronicles
        .filter(c => c.published && c.match_date !== date && allDates.indexOf(c.match_date) > -1 && allDates.indexOf(c.match_date) < idxActual)
        .sort((a, b) => allDates.indexOf(a.match_date) - allDates.indexOf(b.match_date))
        .slice(-5)
        .map(c => ({ jornada: jornadaLabel(c.match_date), titulo: c.titulo, cuerpo: c.cuerpo }));
      // Reacciones de la crónica anterior (la última publicada antes de esta fecha), con nombres
      const previas = chronicles
        .filter(c => c.published && allDates.indexOf(c.match_date) > -1 && allDates.indexOf(c.match_date) < idxActual)
        .sort((a, b) => allDates.indexOf(b.match_date) - allDates.indexOf(a.match_date));
      let reacciones_previas = null;
      if (usarReacciones && previas.length) {
        const cronAnterior = previas[0];
        const { data: reacs } = await sb.from("chronicle_reactions").select("*").eq("chronicle_id", cronAnterior.id);
        if (reacs && reacs.length) {
          const porEmoji = {};
          reacs.forEach(r => {
            const nombre = (profiles.find(p => p.id === r.user_id)?.name) || "alguien";
            (porEmoji[r.emoji] = porEmoji[r.emoji] || []).push(nombre);
          });
          reacciones_previas = {
            jornada: jornadaLabel(cronAnterior.match_date),
            titulo: cronAnterior.titulo,
            detalle: Object.entries(porEmoji).map(([emoji, nombres]) => ({ emoji, nombres })),
          };
        }
      }
      const { data, error: invErr } = await sb.functions.invoke("generate-chronicle", {
        body: { match_date: date, fecha_label: jornadaLabel(date), ideas, resumen, historial, reacciones_previas },
      });
      if (invErr) {
        let msg = invErr.message || "Error llamando a la función";
        try { const j = await invErr.context.json(); if (j && j.error) msg = j.error + (j.detalle ? ` — ${j.detalle}` : ""); } catch (_e) {}
        setError(msg); setGenerating(false); return;
      }
      if (data && data.error) { setError(data.error); setGenerating(false); return; }
      setIdeas("");
      await loadChronicles();
    } catch (e) {
      setError(String(e));
    }
    setGenerating(false);
  }

  async function publicar(matchDate) {
    setPublishingId(matchDate);
    await sb.from("chronicles").update({ published: true, updated_at: new Date().toISOString() }).eq("match_date", matchDate);
    // Teaser para el push: usa el título real de la crónica como gancho + un arranque que varía
    const cronPub = chronicles.find(c => c.match_date === matchDate);
    const titulo = cronPub?.titulo || `Crónica de ${jornadaLabel(matchDate)}`;
    const ganchos = [
      "📰 ¡Salió la crónica! 👀",
      "🔥 La crónica de la fecha ya está",
      "✍️ El Cronista habló 👀",
      "📰 Nueva crónica caliente",
      "🍿 Salió la crónica, agarrá los pochoclos",
    ];
    const gancho = ganchos[Math.floor(Math.random() * ganchos.length)];
    sendPushNotification("all", null, { title: gancho, body: `"${titulo}" — leela en la pestaña Crónica antes de que te la spoileen 😏`, tag: `cronica-${matchDate}`, url: "/" });
    await loadChronicles();
    setPublishingId(null);
  }

  async function borrarBorrador(id) {
    if (!window.confirm("¿Eliminar este borrador?")) return;
    await sb.from("chronicles").delete().eq("id", id);
    await loadChronicles();
  }

  async function descargarPDF(c) {
    try {
      if (!(window.jspdf && window.jspdf.jsPDF)) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = res;
          s.onerror = () => rej(new Error("No se pudo cargar el generador de PDF"));
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 48;
      const maxW = pageW - margin * 2;
      let y = margin;

      const strip = (t) => (t || "")
        .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, "")
        .replace(/ {2,}/g, " ");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(184, 140, 30);
      doc.text("QUINIELA MUNDIAL 2026  \u00b7  EL CRONISTA", margin, y);
      y += 26;

      doc.setFontSize(22);
      doc.setTextColor(20, 20, 20);
      const titulo = strip(c.titulo).trim() || "Crónica de la fecha";
      const tLines = doc.splitTextToSize(titulo, maxW);
      doc.text(tLines, margin, y);
      y += tLines.length * 26 + 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(130, 130, 130);
      const fecha = new Date(c.created_at).toLocaleDateString();
      doc.text(`${jornadaLabel(c.match_date)}  \u00b7  ${fecha}`, margin, y);
      y += 18;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 24;

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      const lineH = 17;
      const paras = strip(c.cuerpo).split(/\n\n+/);
      for (const para of paras) {
        const clean = para.trim();
        if (!clean) continue;
        const lines = doc.splitTextToSize(clean, maxW);
        for (const line of lines) {
          if (y > pageH - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += lineH;
        }
        y += Math.round(lineH * 0.6);
      }

      const safeLabel = jornadaLabel(c.match_date).replace(/[^\w\dáéíóúñ]+/gi, "-");
      doc.save(`Cronica-${safeLabel}.pdf`);
    } catch (e) {
      window.alert("No se pudo generar el PDF: " + (e && e.message ? e.message : e));
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditTitulo(c.titulo || "");
    setEditCuerpo(c.cuerpo || "");
  }
  function cancelEdit() {
    setEditingId(null); setEditTitulo(""); setEditCuerpo("");
  }
  async function saveEdit(c) {
    setSavingEdit(true);
    await sb.from("chronicles").update({ titulo: editTitulo, cuerpo: editCuerpo, updated_at: new Date().toISOString() }).eq("id", c.id);
    setSavingEdit(false);
    cancelEdit();
    await loadChronicles();
  }

  return (<>
    {isAdmin && (
      <div className="pre-tabs" style={{marginBottom:20}}>
        <button className={`pre-tab ${cronSub==="lista"?"active":""}`} onClick={()=>setCronSub("lista")}>📰 Crónica</button>
        <button className={`pre-tab ${cronSub==="generar"?"active":""}`} onClick={()=>setCronSub("generar")}>⚙️ Generar</button>
      </div>
    )}

    {isAdmin && cronSub==="generar" && (
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"20px 24px",marginBottom:20}}>
        <div style={{fontFamily:"Bebas Neue",fontSize:20,color:"var(--gold)",letterSpacing:1,marginBottom:16}}>✍️ GENERAR CRÓNICA</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:12,color:"var(--muted)",display:"block",marginBottom:6}}>Jornada</label>
            <select value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--txt)",fontSize:14}}>
              {fechasFinished.length===0 && <option value="">No hay fechas con resultados todavía</option>}
              {fechasFinished.map(d => <option key={d} value={d}>{jornadaLabel(d)} · {d}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,color:"var(--muted)",display:"block",marginBottom:6}}>💡 Ideas para esta crónica (opcional)</label>
            <textarea value={ideas} onChange={e=>setIdeas(e.target.value)} placeholder={'Ej: "Cargá fuerte al que falló el comodín", "es el cumple del Colo", "tono más picante"...'} rows={3} style={{width:"100%",padding:"10px 12px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--txt)",fontSize:14,resize:"vertical",fontFamily:"inherit"}}/>
            <label style={{display:"flex",alignItems:"center",gap:8,marginTop:12,cursor:"pointer",fontSize:13,color:"var(--txt)"}}>
              <input type="checkbox" checked={usarReacciones} onChange={e=>setUsarReacciones(e.target.checked)} style={{width:16,height:16,accentColor:"var(--gold)",cursor:"pointer"}}/>
              <span>👍👎 Tomar en cuenta las reacciones del público a la crónica anterior</span>
            </label>
          </div>
          {error && <div style={{padding:"10px 14px",background:"rgba(220,60,60,.12)",border:"1px solid rgba(220,60,60,.3)",borderRadius:10,fontSize:13,color:"#ff8080"}}>{error}</div>}
          <button onClick={()=>generar()} disabled={generating||!selectedDate} style={{padding:"12px 16px",background:generating?"var(--surface)":"var(--gold)",color:generating?"var(--muted)":"#1a1a1a",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:generating?"default":"pointer"}}>
            {generating ? "🪄 Generando con la IA..." : "🪄 Generar crónica"}
          </button>
          <div style={{fontSize:12,color:"var(--muted)"}}>Las crónicas generadas aparecen como borrador en la solapa 📰 Crónica, donde podés revisarlas, editarlas y publicarlas.</div>
        </div>
      </div>
    )}

    {(!isAdmin || cronSub==="lista") && (loading ? (
      <div style={{textAlign:"center",padding:40,color:"var(--muted)"}}>Cargando crónicas...</div>
    ) : chronicles.length===0 ? (
      <div style={{textAlign:"center",padding:40,color:"var(--muted)"}}>Todavía no hay crónicas. {isAdmin ? "Generá la primera 👆" : "Pronto el cronista va a narrar la primera fecha."}</div>
    ) : (
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {chronicles.map(c => (
          <div key={c.id} style={{background:"var(--card)",border:`1px solid ${c.published?"var(--border)":"rgba(245,183,49,.4)"}`,borderRadius:"var(--r)",padding:"22px 26px"}}>
            {!c.published && (
              <div style={{display:"inline-block",fontSize:11,fontWeight:700,letterSpacing:.5,color:"var(--gold)",background:"rgba(245,183,49,.15)",padding:"3px 10px",borderRadius:20,marginBottom:12}}>BORRADOR · solo vos lo ves</div>
            )}
            {editingId === c.id ? (
              <>
                <input value={editTitulo} onChange={e=>setEditTitulo(e.target.value)} style={{width:"100%",padding:"10px 12px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--txt)",fontSize:18,fontWeight:700,marginBottom:10}}/>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>{jornadaLabel(c.match_date)} · {new Date(c.created_at).toLocaleDateString()}</div>
                <textarea value={editCuerpo} onChange={e=>setEditCuerpo(e.target.value)} rows={12} style={{width:"100%",padding:"12px 14px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,color:"var(--txt)",fontSize:15,lineHeight:1.6,resize:"vertical",fontFamily:"inherit"}}/>
                <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>saveEdit(c)} disabled={savingEdit} style={{padding:"10px 18px",background:"var(--gold)",color:"#1a1a1a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>{savingEdit?"Guardando...":"💾 Guardar cambios"}</button>
                  <button onClick={cancelEdit} style={{padding:"10px 16px",background:"transparent",color:"var(--muted)",border:"1px solid var(--border)",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontFamily:"Bebas Neue",fontSize:26,color:"var(--gold)",letterSpacing:.5,lineHeight:1.1,marginBottom:6}}>{c.titulo}</div>
                <div style={{fontSize:12,color:"var(--muted)",marginBottom:10}}>{jornadaLabel(c.match_date)} · {new Date(c.created_at).toLocaleDateString()}</div>
                {/* separador dorado bajo el subtítulo */}
                <div style={{width:48,height:3,background:"var(--gold)",borderRadius:2,marginBottom:16}}/>
                {(() => {
                  const parrafos = (c.cuerpo || "").split(/\n\s*\n/);
                  const bajada = parrafos[0] || "";
                  const resto = parrafos.slice(1).join("\n\n");
                  const isExpanded = !!expandedChron[c.id];
                  return (
                    <ReadObserver active={c.published && (isExpanded || !resto)} chronicleId={c.id} onRead={recordRead}>
                      <div style={{fontSize:17,color:"var(--txt)",lineHeight:1.55,fontStyle:"italic",fontWeight:500,marginBottom:14}}>{bajada}</div>
                      {resto && isExpanded && <div style={{fontSize:15,color:"var(--txt)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{resto}</div>}
                      {resto && (
                        <button onClick={()=>setExpandedChron(e=>({...e,[c.id]:!e[c.id]}))} style={{marginTop:10,background:"none",border:"none",color:"var(--gold)",fontSize:13,fontWeight:600,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:5}}>
                          {isExpanded ? "Mostrar menos ▴" : "Seguir leyendo ▾"}
                        </button>
                      )}
                    </ReadObserver>
                  );
                })()}
                {/* firma del autor */}
                <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)",fontSize:13,color:"var(--gold)",fontStyle:"italic",letterSpacing:.3}}>✍️ El Cronista</div>
                {c.published && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:14}}>
                    {CRON_EMOJIS.map(emoji => {
                      const counts = cronReactionCounts(c.id);
                      const count = counts[emoji] || 0;
                      const mine = (cronReactions[c.id] || []).find(r => r.user_id === user.id && r.emoji === emoji);
                      const reactors = (cronReactions[c.id] || []).filter(r => r.emoji === emoji).map(r => (profiles.find(p=>p.id===r.user_id)?.name) || "?");
                      return (
                        <div key={emoji} style={{position:"relative"}} className="reaction-wrap">
                          <button onClick={()=>toggleCronReaction(c.id, emoji)} style={{padding:"5px 11px",borderRadius:20,border:"1px solid",borderColor:mine?"var(--gold)":"var(--border)",background:mine?"var(--gold-dim)":"none",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",gap:5}}>
                            {emoji}{count>0 && <span style={{fontSize:12,color:"var(--muted)"}}>{count}</span>}
                          </button>
                          {count>0 && <div className="reaction-tooltip">{reactors.join(", ")}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isAdmin && c.published && (() => {
                  const readRows = reads[c.id] || [];
                  const readIds = new Set(readRows.map(r => r.user_id));
                  const lectores = profiles.filter(p => readIds.has(p.id));
                  const faltan = profiles.filter(p => !readIds.has(p.id));
                  const open = !!showReaders[c.id];
                  const readAtOf = (uid) => { const r = readRows.find(x => x.user_id === uid); return r ? new Date(r.read_at).toLocaleString("es", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : ""; };
                  return (
                    <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid var(--border)"}}>
                      <button onClick={()=>setShowReaders(s=>({...s,[c.id]:!s[c.id]}))} style={{background:"none",border:"none",color:"var(--blue)",fontSize:13,fontWeight:600,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6}}>
                        👀 {lectores.length}/{profiles.length} leyeron {open ? "▴" : "▾"}
                      </button>
                      {open && (
                        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:12}}>
                          <div>
                            <div style={{fontSize:11,color:"var(--green)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Leyeron ({lectores.length})</div>
                            {lectores.length ? (
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {lectores.map(p => (
                                  <span key={p.id} title={readAtOf(p.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px 3px 3px",borderRadius:20,background:"var(--green-dim)",border:"1px solid rgba(42,223,122,.3)",fontSize:12}}>
                                    <Avatar profile={p} size="sm" />{p.name}
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{fontSize:12,color:"var(--muted)"}}>Nadie todavía.</span>}
                          </div>
                          <div>
                            <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Todavía no ({faltan.length})</div>
                            {faltan.length ? (
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {faltan.map(p => (
                                  <span key={p.id} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px 3px 3px",borderRadius:20,background:"var(--surface)",border:"1px solid var(--border)",fontSize:12,color:"var(--muted)"}}>
                                    <Avatar profile={p} size="sm" />{p.name}
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{fontSize:12,color:"var(--green)"}}>¡Todos la leyeron! 🎉</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {isAdmin && (
                  <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
                    {!c.published && (
                      <button onClick={()=>publicar(c.match_date)} disabled={publishingId===c.match_date} style={{padding:"10px 18px",background:"var(--green)",color:"#0a0a0a",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                        {publishingId===c.match_date ? "Publicando..." : "📢 Publicar para todos"}
                      </button>
                    )}
                    <button onClick={()=>startEdit(c)} style={{padding:"10px 16px",background:"var(--surface)",color:"var(--txt)",border:"1px solid var(--border)",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                      ✏️ Editar
                    </button>
                    <button onClick={()=>descargarPDF(c)} style={{padding:"10px 16px",background:"var(--surface)",color:"var(--txt)",border:"1px solid var(--border)",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                      ⬇️ Descargar PDF
                    </button>
                    {!c.published && (
                      <button onClick={()=>borrarBorrador(c.id)} style={{padding:"10px 16px",background:"transparent",color:"#ff8080",border:"1px solid rgba(220,60,60,.3)",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    ))}
  </>);
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [name, setName] = useState(""); const [invite, setInvite] = useState("");
  const [msg, setMsg] = useState(null); const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin() {
    setLoading(true); setMsg(null);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { setMsg({ type: "err", text: "Email o contraseña incorrectos" }); setLoading(false); return; }
    const { data: profile } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
    if (rememberMe) {
  localStorage.setItem("sb-remember", "true");
  window.location.reload();
} else {
  localStorage.removeItem("sb-remember");
  onAuth({ ...data.user, profile }); setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setMsg({ type: "err", text: "Ingresa tu email primero" }); return; }
    setLoading(true); setMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: "https://mundial2026-plum.vercel.app"
    });
    if (error) { setMsg({ type: "err", text: error.message }); }
    else { setMsg({ type: "ok", text: "✅ Te enviamos un link para restablecer tu contraseña. Revisa tu email." }); }
    setLoading(false);
  }

  async function handleRegister() {
    if (!name.trim()) { setMsg({ type: "err", text: "Ingresa tu nombre" }); return; }
    if (pass.length < 6) { setMsg({ type: "err", text: "Mínimo 6 caracteres" }); return; }
    setLoading(true); setMsg(null);
    const { data: codeOk, error: codeErr } = await sb.rpc("check_invite_code", { p_code: invite });
    if (codeErr || !codeOk) { setMsg({ type: "err", text: "Código de invitación inválido" }); setLoading(false); return; }
    const { data, error } = await sb.auth.signUp({ email, password: pass });
    if (error) { setMsg({ type: "err", text: error.message }); setLoading(false); return; }
    if (data.user) {
      await sb.from("profiles").insert({ id: data.user.id, name: name.trim() });
      setMsg({ type: "ok", text: "¡Cuenta creada! Ya puedes ingresar." });
      setMode("login"); setEmail(""); setPass("");
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo"><span className="icon">🏆</span><h1>QUINIELA 2026</h1><p>Copa del Mundo · USA · CAN · MEX</p></div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"active":""}`} onClick={() => { setMode("login"); setMsg(null); }}>Entrar</button>
          <button className={`auth-tab ${mode==="register"?"active":""}`} onClick={() => { setMode("register"); setMsg(null); }}>Registrarse</button>
        </div>
        {mode === "login" ? (<>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="tu@email.com"/></div>
          <div className="field"><label>Contraseña</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••"/></div>
          <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0"}}>
            <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"var(--gold)"}}/>
            <label htmlFor="rememberMe" style={{fontSize:13,color:"var(--muted)",cursor:"pointer"}}>Recordar este dispositivo</label>
          </div>
          <button className="btn-gold" onClick={handleLogin} disabled={loading}>{loading?"CARGANDO...":"ENTRAR"}</button>
          <button onClick={handleForgotPassword} disabled={loading} style={{marginTop:12,width:"100%",background:"none",border:"none",color:"var(--muted)",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>
            ¿Olvidaste tu contraseña?
          </button>
        </>) : (<>
          <div className="invite-note">🔗 Necesitas un código de invitación</div>
          <div className="field"><label>Tu nombre</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Como te verán los demás"/></div>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></div>
          <div className="field"><label>Contraseña</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres"/></div>
          <div className="field"><label>Código de invitación</label><input value={invite} onChange={e=>setInvite(e.target.value)} placeholder="Código que te compartieron"/></div>
          <button className="btn-gold" onClick={handleRegister} disabled={loading}>{loading?"CREANDO CUENTA...":"CREAR CUENTA"}</button>
        </>)}
        {msg && <p className={msg.type==="err"?"msg-err":"msg-ok"}>{msg.text}</p>}
      </div>
    </div>
  );
}
// ── Pre-Tournament Predictions ────────────────────────────────────────────────
function PreTournament({ user }) {
  const [subTab, setSubTab] = useState("groups");
  const [groupPreds, setGroupPreds] = useState({});
  const [savedGroups, setSavedGroups] = useState({});
  const [savingGroup, setSavingGroup] = useState({});
  const [thirdPreds, setThirdPreds] = useState([]);
  const [thirdsSaved, setThirdsSaved] = useState(false);
  const [savingThirds, setSavingThirds] = useState(false);
  const locked = isPreTournamentLocked();

  useEffect(() => {
    sb.from("pretournament_predictions").select("*").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      const gp = {};
      const tp = [];
      data.forEach(p => {
        if (p.prediction_type === "group_standing") {
          if (!gp[p.group_name]) gp[p.group_name] = {};
          gp[p.group_name][p.position] = p.team;
        } else if (p.prediction_type === "third_place") {
  const teamGroup = Object.entries(GROUPS).find(([, teams]) => teams.some(t => t.name === p.team))?.[0];
  const groupAlreadyAdded = tp.some(t => Object.entries(GROUPS).find(([, teams]) => teams.some(tm => tm.name === t))?.[0] === teamGroup);
  if (!groupAlreadyAdded) tp.push(p.team);
}
      });
      setGroupPreds(gp);
      setSavedGroups(Object.fromEntries(Object.keys(gp).map(k => [k, true])));
      setThirdPreds(tp);
      if (tp.length === 8) setThirdsSaved(true);
    });
  }, [user.id]);

  async function saveGroup(groupName) {
    const preds = groupPreds[groupName] || {};
    if (!preds[1] || !preds[2]) return;
    if (preds[1] === preds[2]) return;
    setSavingGroup(s => ({ ...s, [groupName]: true }));
    for (const pos of [1, 2]) {
      await sb.from("pretournament_predictions").upsert({
        user_id: user.id, prediction_type: "group_standing",
        group_name: groupName, position: pos, team: preds[pos],
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,prediction_type,group_name,position" });
    }
    setSavedGroups(s => ({ ...s, [groupName]: true }));
    setSavingGroup(s => ({ ...s, [groupName]: false }));
  }

  async function saveThirds() {
    if (thirdPreds.length !== 8) return;
    setSavingThirds(true);
    // Borrar solo los terceros que el usuario ya NO tiene seleccionados (no borramos todo)
    await sb.from("pretournament_predictions")
      .delete()
      .eq("user_id", user.id)
      .eq("prediction_type", "third_place")
      .not("team", "in", `(${thirdPreds.map(t => `"${t}"`).join(",")})`);
    // Upsert: gracias a la constraint unique_user_prediction_team nunca duplica,
    // aunque se ejecute dos veces seguidas
    for (const team of thirdPreds) {
      const groupEntry = Object.entries(GROUPS).find(([, teams]) => teams.some(t => t.name === team));
      const groupName = groupEntry ? groupEntry[0] : null;
      await sb.from("pretournament_predictions").upsert({
        user_id: user.id, prediction_type: "third_place", group_name: groupName, team,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,prediction_type,team" });
    }
    setThirdsSaved(true); setSavingThirds(false);
  }

  function toggleThird(teamName) {
    if (locked) return;
    setThirdPreds(prev => {
      if (prev.includes(teamName)) return prev.filter(t => t !== teamName);
      if (prev.length >= 8) return prev;
      return [...prev, teamName];
    });
    setThirdsSaved(false);
  }

  const completedGroups = Object.keys(savedGroups).length;
  const allGroupsComplete = completedGroups === 12;

  return (<>
    <div className="sec-hdr"><h2>PRE-TORNEO</h2><span>Se cierran el {localDate(TOURNAMENT_START)} · {localTime(TOURNAMENT_START)} ({localTzName()})</span></div>

    {locked
      ? <div className="pre-alert locked">🔒 Las predicciones pre-torneo están cerradas. El torneo ya comenzó.</div>
      : allGroupsComplete && thirdsSaved
        ? <div className="pre-alert complete">✅ ¡Todas tus predicciones pre-torneo están completas!</div>
        : <div className="pre-alert warning">⏰ Completa tus predicciones antes del {localDate(TOURNAMENT_START)} a las {localTime(TOURNAMENT_START)} ({localTzName()}). Grupos completados: {completedGroups}/12 · Terceros: {thirdPreds.length}/8</div>}

    <div className="pre-tabs">
      <button className={`pre-tab ${subTab==="groups"?"active":""}`} onClick={() => setSubTab("groups")}>🏆 1ro y 2do de Grupo ({completedGroups}/12)</button>
      <button className={`pre-tab ${subTab==="thirds"?"active":""}`} onClick={() => setSubTab("thirds")}>🥉 Terceros Clasificados ({thirdPreds.length}/8)</button>
    </div>

    {subTab === "groups" && (
      <div className="groups-grid">
        {Object.entries(GROUPS).map(([groupName, teams]) => {
          const preds = groupPreds[groupName] || {};
          const isComplete = savedGroups[groupName];
          const isSaving = savingGroup[groupName];
          return (
            <div key={groupName} className={`group-card ${isComplete?"complete":""}`}>
              <div className="group-card-hdr">
                <h4>GRUPO {groupName}</h4>
                {isComplete && <span className="group-complete-badge">✓ Guardado</span>}
              </div>
              <div className="group-card-body">
                {[1, 2].map(pos => (
                  <div key={pos} className="group-select-row">
                    <span className={`pos-badge pos-${pos}`}>{pos}°</span>
                    <select
                      className="group-select"
                      value={preds[pos] || ""}
                      onChange={e => {
                        setGroupPreds(p => ({ ...p, [groupName]: { ...p[groupName], [pos]: e.target.value } }));
                        setSavedGroups(s => ({ ...s, [groupName]: false }));
                      }}
                      disabled={locked}
                    >
                      <option value="">— Seleccionar —</option>
                      {teams.map(t => (
                        <option key={t.name} value={t.name} disabled={Object.values(preds).includes(t.name) && preds[pos] !== t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {!locked && (
                  <button className="group-save-btn" onClick={() => saveGroup(groupName)} disabled={!preds[1] || !preds[2] || preds[1]===preds[2] || isSaving}>
                    {isSaving ? "Guardando..." : isComplete ? "✓ Actualizar" : "Guardar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

    {subTab === "thirds" && (
      <div>
        <p className="thirds-counter">
          Elige <strong>1 equipo por grupo</strong> que crees terminará 3ro y clasificará. Selecciona <strong>8 de los 12 grupos</strong>. ({thirdPreds.length}/8 seleccionados)
        </p>
        <div className="thirds-grid">
          {Object.entries(GROUPS).map(([groupName, teams]) => {
            const selectedTeam = teams.find(t => thirdPreds.includes(t.name));
            const isGroupSelected = !!selectedTeam;
            const isDisabled = !isGroupSelected && thirdPreds.length >= 8;
            return (
              <div
                key={groupName}
                className={`third-card ${isGroupSelected ? "selected" : ""} ${isDisabled && !locked ? "disabled" : ""} ${locked ? "locked-card" : ""}`}
                style={{ flexDirection: "column", alignItems: "stretch", gap: 8, cursor: "default" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Bebas Neue", fontSize: 15, color: isGroupSelected ? "var(--green)" : "var(--muted)", letterSpacing: 1 }}>
                    GRUPO {groupName}
                  </span>
                  <div className="third-check" style={{ width: 18, height: 18, fontSize: 10 }}>{isGroupSelected ? "✓" : ""}</div>
                </div>
                <select
                  className="group-select"
                  style={{ fontSize: 12, padding: "7px 10px" }}
                  value={selectedTeam?.name || ""}
                  disabled={locked || (isDisabled)}
                  onChange={e => {
                    const newTeam = e.target.value;
                    setThirdPreds(prev => {
                      const withoutGroup = prev.filter(t => !teams.map(tm => tm.name).includes(t));
                      if (!newTeam) return withoutGroup;
                      return [...withoutGroup, newTeam];
                    });
                    setThirdsSaved(false);
                  }}
                >
                  <option value="">— No seleccionado —</option>
                  {teams.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        {!locked && (
          <button className="thirds-save-btn" onClick={saveThirds} disabled={thirdPreds.length !== 8 || savingThirds}>
            {savingThirds ? "GUARDANDO..." : thirdsSaved ? "✓ Actualizar" : `GUARDAR (${thirdPreds.length}/8 grupos seleccionados)`}
          </button>
        )}
      </div>
    )}
  </>);
}

// ── Tarjeta compartible (canvas) + Web Share ─────────────────────────────────
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fitText(ctx, text, maxW) {
  let t = String(text || "");
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}
function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 4500);
  });
}
function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}
function nameLayout(ctx, name, maxW) {
  name = String(name || "Jugador");
  for (let size = 76; size >= 48; size -= 2) {
    ctx.font = `800 ${size}px Arial, sans-serif`;
    if (ctx.measureText(name).width <= maxW) return { lines: [name], size, lineH: size * 1.12 };
  }
  let size = 56;
  ctx.font = `800 ${size}px Arial, sans-serif`;
  const words = name.split(/\s+/);
  let l1 = "", l2 = "";
  for (const w of words) {
    const t1 = l1 ? l1 + " " + w : w;
    if (!l2 && ctx.measureText(t1).width <= maxW) l1 = t1;
    else l2 = l2 ? l2 + " " + w : w;
  }
  while (size > 34 && (ctx.measureText(l1).width > maxW || ctx.measureText(l2).width > maxW)) {
    size -= 2; ctx.font = `800 ${size}px Arial, sans-serif`;
  }
  if (ctx.measureText(l1).width > maxW) l1 = fitText(ctx, l1, maxW);
  if (l2 && ctx.measureText(l2).width > maxW) l2 = fitText(ctx, l2, maxW);
  return { lines: l2 ? [l1, l2] : [l1], size, lineH: size * 1.16 };
}
function drawPill(ctx, text, rightX, centerY, color, dim) {
  ctx.font = "700 31px Arial, sans-serif";
  const tw = ctx.measureText(text).width;
  const h = 48, w = tw + 38, x = rightX - w, y = centerY - h / 2;
  ctx.fillStyle = dim; rrPath(ctx, x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, centerY + 2);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
}
async function buildStatsCardCanvas(d) {
  const W = 1080, pad = 70, cardW = W - pad * 2;
  const av = await loadImage(d.avatarUrl);
  // Medir layout del nombre para dimensionar el lienzo
  const mcanvas = document.createElement("canvas");
  const mctx = mcanvas.getContext("2d");
  const avR = 96;
  const headerBottom = 56 + avR * 2 + 14; // bajo el avatar
  const nameMaxW = cardW;
  const nl = nameLayout(mctx, d.name, nameMaxW);
  const nameTop = headerBottom + 30;
  const nameBottom = nameTop + nl.lineH * nl.lines.length;
  const cardY = nameBottom + 24, cardH = 240;
  const gridY = cardY + cardH + 46, gap = 28, tileW = (cardW - gap) / 2, tileH = 210;
  const gridBottom = gridY + tileH * 2 + gap;
  const H = Math.round(gridBottom + 116);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  // Fondo
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#0e1626"); g.addColorStop(0.55, "#080b12"); g.addColorStop(1, "#0a0e18");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // halo dorado suave arriba
  const halo = ctx.createRadialGradient(W * 0.5, -120, 60, W * 0.5, -120, 620);
  halo.addColorStop(0, "rgba(245,183,49,.16)"); halo.addColorStop(1, "rgba(245,183,49,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, 360);
  ctx.fillStyle = "#f5b731"; ctx.fillRect(0, 0, W, 8);

  // Header
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f5b731"; ctx.font = "800 42px Arial, sans-serif";
  ctx.fillText("🏆 QUINIELA MUNDIAL 2026", pad, 98);
  ctx.fillStyle = "#8a93a8"; ctx.font = "400 30px Arial, sans-serif";
  ctx.fillText("Mi resumen", pad, 144);

  // Avatar arriba a la derecha (grande, con aro dorado)
  const cx = W - pad - avR, cy = 56 + avR;
  ctx.beginPath(); ctx.arc(cx, cy, avR + 8, 0, Math.PI * 2); ctx.fillStyle = "#f5b731"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, avR + 3, 0, Math.PI * 2); ctx.fillStyle = "#0a0e18"; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, avR, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  if (av) {
    const ar = av.width / av.height;
    let dw = avR * 2, dh = avR * 2, dx = cx - avR, dy = cy - avR;
    if (ar > 1) { dh = avR * 2; dw = dh * ar; dx = cx - dw / 2; } else { dw = avR * 2; dh = dw / ar; dy = cy - dh / 2; }
    ctx.drawImage(av, dx, dy, dw, dh);
  } else {
    ctx.fillStyle = "#1b2233"; ctx.fillRect(cx - avR, cy - avR, avR * 2, avR * 2);
  }
  ctx.restore();
  if (!av) {
    ctx.fillStyle = "#f5b731"; ctx.font = "800 76px Arial, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(initialsOf(d.name), cx, cy + 4);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  // Nombre completo (1 o 2 líneas, autoajustado)
  ctx.fillStyle = "#ffffff"; ctx.font = `800 ${nl.size}px Arial, sans-serif`; ctx.textAlign = "left";
  nl.lines.forEach((ln, i) => ctx.fillText(ln, pad, nameTop + nl.size + i * nl.lineH));

  // Card posición + puntos
  ctx.fillStyle = "#101725"; rrPath(ctx, pad, cardY, cardW, cardH, 28); ctx.fill();
  ctx.strokeStyle = "#222b3d"; ctx.lineWidth = 2; rrPath(ctx, pad, cardY, cardW, cardH, 28); ctx.stroke();
  const cxPos = pad + cardW * 0.27, cxPts = pad + cardW * 0.73;
  ctx.textAlign = "center";
  ctx.fillStyle = "#8a93a8"; ctx.font = "600 30px Arial"; ctx.fillText("POSICIÓN", cxPos, cardY + 66);
  ctx.fillStyle = "#ffffff"; ctx.font = "800 118px Arial"; ctx.fillText("#" + d.pos, cxPos, cardY + 182);
  ctx.fillStyle = "#8a93a8"; ctx.font = "400 26px Arial"; ctx.fillText("de " + d.totalPlayers, cxPos, cardY + 216);
  ctx.strokeStyle = "#222b3d"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, cardY + 42); ctx.lineTo(W / 2, cardY + cardH - 42); ctx.stroke();
  ctx.fillStyle = "#8a93a8"; ctx.font = "600 30px Arial"; ctx.fillText("PUNTOS", cxPts, cardY + 66);
  ctx.fillStyle = "#f5b731"; ctx.font = "800 118px Arial"; ctx.fillText(String(d.pts), cxPts, cardY + 182);
  const diff = d.pts - d.avg;
  ctx.fillStyle = diff >= 0 ? "#2adf7a" : "#ff4d6d"; ctx.font = "700 26px Arial";
  ctx.fillText((diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) + " vs promedio", cxPts, cardY + 216);

  // 4 tiles con píldora de puntos
  const wcCol = d.wcPts > 0 ? "#2adf7a" : d.wcPts < 0 ? "#ff4d6d" : "#8a93a8";
  const wcDim = d.wcPts > 0 ? "rgba(42,223,122,.16)" : d.wcPts < 0 ? "rgba(255,77,109,.16)" : "rgba(138,147,168,.18)";
  const tiles = [
    { label: "EXACTOS", val: d.exact, sub: d.exactPts + " pts", color: "#f5b731", dim: "rgba(245,183,49,.16)" },
    { label: "GANADOR", val: d.winner, sub: d.winnerPts + " pts", color: "#2adf7a", dim: "rgba(42,223,122,.16)" },
    { label: "GOLES", val: d.goles, sub: d.golesPts + " pts", color: "#4a9eff", dim: "rgba(74,158,255,.16)" },
    { label: "COMODINES", val: d.wcRemaining + "/" + d.wcMax, sub: (d.wcPts > 0 ? "+" : "") + d.wcPts + " pts", color: "#f5b731", pillColor: wcCol, dim: wcDim },
  ];
  tiles.forEach((t, i) => {
    const x = pad + (i % 2) * (tileW + gap);
    const y = gridY + Math.floor(i / 2) * (tileH + gap);
    ctx.fillStyle = "#101725"; rrPath(ctx, x, y, tileW, tileH, 22); ctx.fill();
    ctx.strokeStyle = "#222b3d"; ctx.lineWidth = 2; rrPath(ctx, x, y, tileW, tileH, 22); ctx.stroke();
    // acento de color
    ctx.fillStyle = t.color; rrPath(ctx, x + 30, y + 34, 50, 7, 4); ctx.fill();
    ctx.textAlign = "left"; ctx.fillStyle = "#8a93a8"; ctx.font = "600 27px Arial"; ctx.fillText(t.label, x + 30, y + 84);
    ctx.fillStyle = t.color; ctx.font = "800 90px Arial"; ctx.fillText(String(t.val), x + 30, y + 172);
    drawPill(ctx, t.sub, x + tileW - 28, y + 146, t.pillColor || t.color, t.dim);
  });

  // Footer
  ctx.textAlign = "center"; ctx.fillStyle = "#5a6278"; ctx.font = "400 28px Arial";
  ctx.fillText("mundial2026-plum.vercel.app", W / 2, H - 50);
  return canvas;
}
function shareCanvas(canvas, filename, shareText) {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(false); return; }
      const file = new File([blob], filename, { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText });
          resolve(true); return;
        }
      } catch (e) { /* cancelado o no soportado → descarga */ }
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (e) {}
      resolve(true);
    }, "image/png");
  });
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, matches, predictions, onGoTab, onGoCompare, achievements, equippedBadge, onEquip }) {
  const [ultimaCronica, setUltimaCronica] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // día elegido en el bloque "Tus pronósticos"
  const [myWc, setMyWc] = useState([]);
  const [maxWc, setMaxWc] = useState(5);
  const [tableProfiles, setTableProfiles] = useState([]);
  const [tablePre, setTablePre] = useState([]);
  useEffect(() => {
    sb.from("chronicles").select("titulo,match_date,created_at").eq("published", true).order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => { if (data && data.length) setUltimaCronica(data[0]); });
  }, []);
  useEffect(() => {
    sb.from("wildcards").select("*").eq("user_id", user.id).then(({ data }) => setMyWc(data || []));
    sb.from("scoring_rules").select("rule_value").eq("rule_key", "max_wildcards").single().then(({ data }) => { if (data && data.rule_value != null) setMaxWc(data.rule_value); });
    sb.from("profiles").select("id, name, avatar_url").then(({ data }) => setTableProfiles(data || []));
    sb.from("pretournament_predictions").select("user_id, points").then(({ data }) => setTablePre(data || []));
  }, [user.id]);
  const myPreds = predictions.filter(p => p.user_id === user.id);
  const totalPts = myPreds.reduce((s, p) => s + (p.points || 0), 0);
  const pending = matches.filter(m => !myPreds.find(p => p.match_id === m.id) && !isLocked(m.kickoff_at, matches, m.match_date)).length;
  const locked = isPreTournamentLocked();

  const played = myPreds
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(p => p.match && p.match.home_score !== null && p.match.home_score !== undefined && p.match.away_score !== null && p.match.away_score !== undefined);
  const exact = played.filter(p => isExactPred(p, p.match));
  const winner = played.filter(p => predOutcome(p, p.match) === "winner");
  const goles = played.filter(p => predOutcome(p, p.match) === "goals");
  const pctExact  = played.length > 0 ? Math.round(exact.length  / played.length * 100) : 0;
  const pctWinner = played.length > 0 ? Math.round(winner.length / played.length * 100) : 0;
  const pctGoles  = played.length > 0 ? Math.round(goles.length  / played.length * 100) : 0;
  // Puntos por bucket disjunto (exacto/ganador/goles) + comodín suman el total
  const sumPts = (arr) => arr.reduce((s, p) => s + (p.points || 0), 0);
  const ptsExact  = sumPts(exact);
  const ptsWinner = sumPts(winner);
  const ptsGoles  = sumPts(goles);
  // Comodines: usados/máximo y puntos en los partidos donde se usó comodín
  const usedWc = myWc.length;
  const remainingWc = Math.max(0, (maxWc || 0) - usedWc);
  const wcMatchIds = new Set(myWc.map(w => w.match_id));
  const ptsWc = myPreds.filter(p => wcMatchIds.has(p.match_id)).reduce((s, p) => s + (p.points || 0), 0);

  // Puntos por usuario en una sola pasada (O(n) en vez de O(n²))
  const matchPtsByUser = {};
  for (const p of predictions) matchPtsByUser[p.user_id] = (matchPtsByUser[p.user_id] || 0) + (p.points || 0);
  const prePtsByUser = {};
  for (const p of tablePre) prePtsByUser[p.user_id] = (prePtsByUser[p.user_id] || 0) + (p.points || 0);
  const allUserIds = Object.keys(matchPtsByUser);
  const avgPts = allUserIds.length > 0
    ? Math.round(allUserIds.reduce((s, uid) => s + matchPtsByUser[uid], 0) / allUserIds.length)
    : 0;

  // Posición y total como en la tabla de Posiciones (puntos de partidos + pre-torneo)
  const tableBase = tableProfiles.length ? tableProfiles.map(p => p.id) : allUserIds;
  const tableRows = tableBase
    .map(id => ({ id, pts: (matchPtsByUser[id] || 0) + (prePtsByUser[id] || 0) }))
    .sort((a, b) => b.pts - a.pts);
  const myRankPos = tableRows.findIndex(r => r.id === user.id) + 1;
  const totalPlayers = tableRows.length;
  const myTablePts = tableRows.find(r => r.id === user.id)?.pts ?? totalPts;
  const myName = (tableProfiles.find(p => p.id === user.id) || {}).name || "Jugador";
  const myAvatar = (tableProfiles.find(p => p.id === user.id) || {}).avatar_url || null;

  const [sharing, setSharing] = useState(false);
  async function handleShareStats() {
    setSharing(true);
    try {
      const canvas = await buildStatsCardCanvas({
        name: myName, avatarUrl: myAvatar,
        pos: myRankPos || "-", totalPlayers,
        pts: myTablePts, avg: avgPts,
        exact: exact.length, exactPts: ptsExact,
        winner: winner.length, winnerPts: ptsWinner,
        goles: goles.length, golesPts: ptsGoles,
        wcRemaining: remainingWc, wcMax: maxWc, wcPts: ptsWc,
      });
      await shareCanvas(canvas, "quiniela-mis-stats.png", "Mis stats en la Quiniela Mundial 2026 ⚽🏆");
    } catch (e) {}
    setSharing(false);
  }

  const finishedPreds = [...played]
    .sort((a, b) => new Date(a.match.kickoff_at) - new Date(b.match.kickoff_at));

  let racha = 0;
  for (let i = finishedPreds.length - 1; i >= 0; i--) {
    if (finishedPreds[i].points > 0) racha++;
    else break;
  }

  const ptsByDay = {};
  finishedPreds.forEach(p => {
    const d = p.match.match_date;
    ptsByDay[d] = (ptsByDay[d] || 0) + (p.points || 0);
  });
  const bestDay = Object.entries(ptsByDay).sort((a, b) => b[1] - a[1])[0];

  // ── Tus pronósticos por jornada, con navegación entre fechas ──
  const dayKeyOf = (m) => m.match_date || new Date(m.kickoff_at).toISOString().slice(0,10);
  const dayFirstKick = {};
  matches.forEach(m => {
    const k = dayKeyOf(m);
    const t = new Date(m.kickoff_at).getTime();
    if (dayFirstKick[k] === undefined || t < dayFirstKick[k]) dayFirstKick[k] = t;
  });
  const allDays = [...new Set(matches.map(dayKeyOf))].sort((a, b) => (dayFirstKick[a] || 0) - (dayFirstKick[b] || 0));
  // Día por defecto: la próxima jornada por jugarse (o la última si ya terminó todo)
  const upcoming = matches
    .filter(m => new Date(m.kickoff_at).getTime() > nowMs())
    .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at));
  const defaultDayKey = upcoming.length ? dayKeyOf(upcoming[0]) : (allDays.length ? allDays[allDays.length - 1] : null);
  const activeDay = (selectedDay && allDays.includes(selectedDay)) ? selectedDay : defaultDayKey;
  const dayIdx = activeDay ? allDays.indexOf(activeDay) : -1;
  const dayMatches = activeDay
    ? matches.filter(m => dayKeyOf(m) === activeDay).sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))
    : [];

  return (<>
    <div className="banner">
      <h3>BIENVENIDO, {user.profile?.name?.toUpperCase() || "JUGADOR"} 👋</h3>
      {!locked
        ? <p>⏰ <strong style={{color:"var(--gold)"}}>¡El torneo arranca el 11 de junio!</strong> Completa tus predicciones pre-torneo antes de que cierren.</p>
        : ultimaCronica
          ? <div onClick={()=>onGoTab && onGoTab("cronica")} style={{cursor:"pointer",display:"flex",alignItems:"flex-start",gap:8,marginTop:4,background:"rgba(245,197,24,.06)",border:"1px solid rgba(245,197,24,.2)",borderRadius:10,padding:"8px 12px"}}>
              <span style={{fontSize:16,flexShrink:0}}>📰</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Última crónica</div>
                <div style={{fontSize:13,color:"var(--txt)",fontWeight:600,lineHeight:1.3}}>{ultimaCronica.titulo}</div>
              </div>
              <span style={{color:"var(--gold)",fontSize:12,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>Leer ›</span>
            </div>
          : <p>¡Bienvenido! Seguí de cerca la tabla de posiciones.</p>}
    </div>

    <div className="dash-grid">
      <div className="stat-card"><span className="stat-label">Tus puntos</span><span className="stat-value">{totalPts}</span><span className="stat-sub">Promedio del grupo: {avgPts}</span></div>
      <div className="stat-card"><span className="stat-label">Predicciones</span><span className="stat-value">{myPreds.length}</span><span className="stat-sub">de {matches.length} partidos</span></div>
      <div className="stat-card"><span className="stat-label">Pendientes</span><span className="stat-value" style={{color:pending>0?"var(--red)":"var(--green)"}}>{pending}</span><span className="stat-sub">{pending>0?"¡A predecir!":"Todo listo ✓"}</span></div>
    </div>

    {allDays.length > 0 && (
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1}}>⚽ TUS PRONÓSTICOS</span>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button onClick={()=>{ if (dayIdx>0) setSelectedDay(allDays[dayIdx-1]); }} disabled={dayIdx<=0} title="Día anterior" style={{width:26,height:26,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:dayIdx<=0?"var(--muted)":"var(--gold)",fontSize:16,cursor:dayIdx<=0?"default":"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:dayIdx<=0?0.4:1,flexShrink:0}}>‹</button>
              <span style={{fontFamily:"Bebas Neue",fontSize:15,color:"var(--txt)",minWidth:54,textAlign:"center",letterSpacing:.5}}>{activeDay}</span>
              <button onClick={()=>{ if (dayIdx<allDays.length-1) setSelectedDay(allDays[dayIdx+1]); }} disabled={dayIdx>=allDays.length-1} title="Día siguiente" style={{width:26,height:26,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:dayIdx>=allDays.length-1?"var(--muted)":"var(--gold)",fontSize:16,cursor:dayIdx>=allDays.length-1?"default":"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:dayIdx>=allDays.length-1?0.4:1,flexShrink:0}}>›</button>
            </div>
          </div>
          <button onClick={()=>onGoTab && onGoTab("predicciones")} style={{background:"none",border:"none",color:"var(--gold)",fontSize:12,cursor:"pointer",fontWeight:600}}>Editar ›</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {dayMatches.map(m => {
            const mp = myPreds.find(p => p.match_id === m.id);
            const finished = m.home_score != null && m.away_score != null;
            const pts = mp?.points || 0;
            const ptsColor = pts > 0 ? "var(--green)" : pts < 0 ? "var(--red)" : "var(--muted)";
            const ptsBg = pts > 0 ? "var(--green-dim)" : pts < 0 ? "var(--red-dim)" : "var(--surface)";
            return (
              <div key={m.id} onClick={()=>onGoCompare && onGoCompare(m.id)} title="Ver qué pronosticó cada uno" style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--surface)",borderRadius:8,cursor:"pointer"}}>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,fontSize:13,color:"var(--txt)"}}>
                  <span style={{textAlign:"right"}}>{m.home}</span>
                  <img src={m.home_flag} alt={m.home} style={{width:20,height:15,objectFit:"cover",borderRadius:2,flexShrink:0}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:60}}>
                  {mp
                    ? <span style={{fontFamily:"Bebas Neue",fontSize:18,color:"var(--gold)",textAlign:"center"}}>{mp.home_score}–{mp.away_score}</span>
                    : <span style={{fontSize:11,color:"var(--red)",textAlign:"center"}}>sin cargar</span>}
                  {finished
                    ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,marginTop:2}}>
                        <span style={{fontSize:10,color:"var(--muted)"}}>Final <strong style={{color:"var(--txt)"}}>{m.home_score}–{m.away_score}</strong></span>
                        {mp
                          ? <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:ptsBg,color:ptsColor,whiteSpace:"nowrap"}}>{pts>0?"+":""}{pts} pts</span>
                          : <span style={{fontSize:10,color:"var(--muted)"}}>sin pts</span>}
                      </div>
                    : <span style={{fontSize:10,color:"var(--muted)",marginTop:2}}>🕐 {localTime(m.kickoff_at)}</span>}
                </div>
                <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"flex-start",gap:6,fontSize:13,color:"var(--txt)"}}>
                  <img src={m.away_flag} alt={m.away} style={{width:20,height:15,objectFit:"cover",borderRadius:2,flexShrink:0}}/>
                  <span style={{textAlign:"left"}}>{m.away}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1}}>📊 TUS ESTADÍSTICAS</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {myRankPos > 0 && <span style={{fontFamily:"Bebas Neue",fontSize:18,color:"var(--txt)",letterSpacing:.5}}>#{myRankPos}<span style={{fontSize:12,color:"var(--muted)"}}> de {totalPlayers}</span></span>}
          <span style={{fontFamily:"Bebas Neue",fontSize:20,color:"var(--gold)",letterSpacing:.5}}>{myTablePts} pts</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:4}}>
            <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Exactos</span>
            <span style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:.5,color:"var(--gold)",background:"var(--gold-dim)",padding:"1px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{ptsExact} pts</span>
          </div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--gold)"}}>{exact.length} <span style={{fontSize:14,color:"var(--muted)"}}>({pctExact}%)</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>de {played.length} jugados</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:4}}>
            <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Ganador correcto</span>
            <span style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:.5,color:"var(--green)",background:"var(--green-dim)",padding:"1px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{ptsWinner} pts</span>
          </div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--green)"}}>{winner.length} <span style={{fontSize:14,color:"var(--muted)"}}>({pctWinner}%)</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>de {played.length} jugados</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:4}}>
            <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Goles exactos</span>
            <span style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:.5,color:"var(--blue)",background:"rgba(74,158,255,.12)",padding:"1px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{ptsGoles} pts</span>
          </div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--blue)"}}>{goles.length} <span style={{fontSize:14,color:"var(--muted)"}}>({pctGoles}%)</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>de {played.length} jugados</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,marginBottom:4}}>
            <span style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5}}>Comodines</span>
            <span style={{fontFamily:"Bebas Neue",fontSize:15,letterSpacing:.5,whiteSpace:"nowrap",padding:"1px 8px",borderRadius:20,color:ptsWc>0?"var(--green)":ptsWc<0?"var(--red)":"var(--muted)",background:ptsWc>0?"var(--green-dim)":ptsWc<0?"var(--red-dim)":"var(--surface)",border:ptsWc===0?"1px solid var(--border)":"none"}}>{ptsWc>0?"+":""}{ptsWc} pts</span>
          </div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--gold)"}}>{remainingWc}<span style={{fontSize:16,color:"var(--muted)"}}>/{maxWc}</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>🃏 {usedWc} usado{usedWc!==1?"s":""}</div>
        </div>
      </div>
      <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
        <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Tus puntos vs promedio del grupo</div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,background:"var(--border)",borderRadius:20,height:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:20,background:"var(--gold)",width:`${Math.min(100, avgPts > 0 ? totalPts/Math.max(totalPts,avgPts)*100 : (totalPts > 0 ? 100 : 0))}%`,transition:"width .5s"}}/>
          </div>
          <span style={{fontFamily:"Bebas Neue",fontSize:16,color:"var(--gold)",minWidth:60}}>{totalPts} pts</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:6}}>
          <div style={{flex:1,background:"var(--border)",borderRadius:20,height:8,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:20,background:"var(--muted)",width:`${Math.min(100, totalPts > 0 ? avgPts/Math.max(totalPts,avgPts)*100 : (avgPts > 0 ? 100 : 0))}%`,transition:"width .5s"}}/>
          </div>
          <span style={{fontSize:13,color:"var(--muted)",minWidth:60}}>{avgPts} avg</span>
        </div>
        <div style={{fontSize:11,color:totalPts>=avgPts?"var(--green)":"var(--red)",marginTop:6}}>
          {totalPts === 0 && avgPts === 0 ? "Sin partidos jugados aún" : totalPts >= avgPts ? `▲ ${totalPts - avgPts} pts por encima del promedio` : `▼ ${avgPts - totalPts} pts por debajo del promedio`}
        </div>
      </div>
      <button onClick={handleShareStats} disabled={sharing} style={{marginTop:16,width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,fontSize:14,cursor:sharing?"default":"pointer",opacity:sharing?0.6:1}}>{sharing ? "Generando…" : "📤 Compartir mis stats"}</button>
    </div>

    {!locked && (
      <div style={{background:"var(--card)",border:"1px solid rgba(245,183,49,.3)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1}}>📋 PREDICCIONES PRE-TORNEO</div><div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>1ro y 2do de grupo + 8 terceros clasificados</div></div>
        <button className="save-btn" onClick={() => onGoTab("predicciones")}>Completar →</button>
      </div>
    )}
    <AchievementsSection userId={user.id} achievements={achievements} equippedBadge={equippedBadge} onEquip={onEquip} />
    <div className="sec-hdr"><h2>PRÓXIMOS SIN PREDECIR</h2></div>
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)"}}>
      {matches.filter(m => !myPreds.find(p => p.match_id === m.id) && !isLocked(m.kickoff_at, matches, m.match_date)).slice(0,5).map((m,i,arr) => (
        <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
          <span style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><img src={m.home_flag} alt={m.home} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/>{m.home} <span style={{color:"var(--muted)"}}>vs</span> {m.away} <img src={m.away_flag} alt={m.away} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/></span>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:8}}>
            <MatchCountdown kickoff={m.kickoff_at} matchDate={m.match_date} matches={matches} />
            <span style={{fontSize:12,color:"var(--muted)",whiteSpace:"nowrap"}}>{localDate(m.kickoff_at)} · {localTime(m.kickoff_at)}</span>
          </div>
        </div>
      ))}
      {pending===0 && <div style={{padding:"20px 18px",color:"var(--muted)",fontSize:14}}>¡Todos los partidos disponibles ya tienen predicción! 🎉</div>}
    </div>
  </>);
}

// ── Matches ──────────────────────────────────────────────────────────────────
function Matches({ user, matches, predictions, allPredictions, onSave, profiles }) {
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [saved, setSaved] = useState({});
  const [wildcards, setWildcards] = useState([]);
  const [savingWildcard, setSavingWildcard] = useState({});
  const [maxWildcards, setMaxWildcards] = useState(4);
  const [wildcardCost, setWildcardCost] = useState(1);
  const [history, setHistory] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const [polls, setPolls] = useState({});
  const [matchSub, setMatchSub] = useState("porcargar");

  useEffect(() => {
    // Merge: solo agrega/actualiza desde la base lo que NO estás editando,
    // para no borrar pronósticos escritos y aún sin guardar en otros partidos.
    setScores(prev => {
      const merged = { ...prev };
      predictions.forEach(p => {
        if (merged[p.match_id] === undefined) {
          merged[p.match_id] = { home: String(p.home_score), away: String(p.away_score) };
        }
      });
      return merged;
    });
  }, [predictions]);

  useEffect(() => {
    sb.from("wildcards").select("*").eq("user_id", user.id).then(({ data }) => { if (data) setWildcards(data); });
    sb.from("scoring_rules").select("*").then(({ data }) => {
      if (data) {
        const maxW = data.find(r => r.rule_key === "max_wildcards");
        const costW = data.find(r => r.rule_key === "wildcard_cost");
        if (maxW) setMaxWildcards(maxW.rule_value);
        if (costW) setWildcardCost(costW.rule_value);
      }
    });
    // Cargar historial de cambios
    sb.from("prediction_history").select("*").eq("user_id", user.id).order("changed_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const h = {};
        data.forEach(r => {
          if (!h[r.match_id]) h[r.match_id] = [];
          h[r.match_id].push(r);
        });
        setHistory(h);
      });
    // Cargar encuestas (todas las predicciones para calcular % de ganador)
    fetchAllPredictions("match_id, home_score, away_score")
      .then((data) => {
        if (!data) return;
        const p = {};
        data.forEach(pr => {
          if (!p[pr.match_id]) p[pr.match_id] = { home: 0, away: 0, draw: 0, total: 0 };
          p[pr.match_id].total++;
          if (pr.home_score > pr.away_score) p[pr.match_id].home++;
          else if (pr.away_score > pr.home_score) p[pr.match_id].away++;
          else p[pr.match_id].draw++;
        });
        setPolls(p);
      });
  }, [user.id]);

  function setScore(matchId, side, val) {
    const v = val.replace(/[^0-9]/g,"").slice(0,2);
    setScores(s => ({ ...s, [matchId]: { ...s[matchId], [side]: v } }));
    setSaved(s => ({ ...s, [matchId]: false }));
  }

  async function save(match) {
    const sc = scores[match.id] || {};
    if (sc.home===undefined||sc.away===undefined||sc.home===""||sc.away==="") return;
    setSaving(s => ({ ...s, [match.id]: true }));
    const existing = predictions.find(p => p.match_id === match.id);
    const homeScore = parseInt(sc.home);
    const awayScore = parseInt(sc.away);
    if (existing) {
      // Guardar historial antes de actualizar
      await sb.from("prediction_history").insert({
        prediction_id: existing.id, user_id: user.id, match_id: match.id,
        home_score: existing.home_score, away_score: existing.away_score,
      });
      await sb.from("predictions").update({ home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await sb.from("predictions").insert({ user_id: user.id, match_id: match.id, home_score: homeScore, away_score: awayScore });
    }
    setSaved(s => ({ ...s, [match.id]: true }));
    setSaving(s => ({ ...s, [match.id]: false }));
    onSave();
  }

  // Pronósticos completos y todavía sin guardar (o cambiados) entre los partidos abiertos
  function pendientesGuardar() {
    return matches
      .filter(m => !isLocked(m.kickoff_at, matches, m.match_date))
      .filter(m => {
        const sc = scores[m.id];
        if (!sc || sc.home === undefined || sc.away === undefined || sc.home === "" || sc.away === "") return false;
        const ex = predictions.find(p => p.match_id === m.id);
        if (!ex) return true;
        return String(ex.home_score) !== String(sc.home) || String(ex.away_score) !== String(sc.away);
      });
  }

  async function saveAll() {
    const pend = pendientesGuardar();
    if (!pend.length) return;
    setSavingAll(true);
    for (const m of pend) {
      const sc = scores[m.id];
      const homeScore = parseInt(sc.home), awayScore = parseInt(sc.away);
      const existing = predictions.find(p => p.match_id === m.id);
      try {
        if (existing) {
          await sb.from("prediction_history").insert({
            prediction_id: existing.id, user_id: user.id, match_id: m.id,
            home_score: existing.home_score, away_score: existing.away_score,
          });
          await sb.from("predictions").update({ home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await sb.from("predictions").insert({ user_id: user.id, match_id: m.id, home_score: homeScore, away_score: awayScore });
        }
        setSaved(s => ({ ...s, [m.id]: true }));
      } catch (e) { /* sigue con los demás */ }
    }
    setSavingAll(false);
    onSave();
  }

  async function toggleWildcard(match) {
    const hasWildcard = wildcards.find(w => w.match_id === match.id);
    setSavingWildcard(s => ({ ...s, [match.id]: true }));
    if (hasWildcard) {
      await sb.from("wildcards").delete().eq("id", hasWildcard.id);
      setWildcards(w => w.filter(x => x.match_id !== match.id));
    } else {
      if (wildcards.length >= maxWildcards) {
        setSavingWildcard(s => ({ ...s, [match.id]: false }));
        return;
      }
      await sb.from("wildcards").insert({ user_id: user.id, match_id: match.id });
      const { data } = await sb.from("wildcards").select("*").eq("user_id", user.id);
      if (data) setWildcards(data);
    }
    setSavingWildcard(s => ({ ...s, [match.id]: false }));
  }

  const usedWildcards = wildcards.length;
const remainingWildcards = maxWildcards - usedWildcards;
const isEliminated = !!profiles?.find(p => p.id === user.id)?.is_eliminated;

  return (<>
    <div className="sec-hdr" style={{justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:12}}>
        <h2>MIS PREDICCIONES</h2><span>Horarios en {localTzName()}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"6px 12px"}}>
        <span style={{fontSize:18}}>🃏</span>
        <span style={{fontFamily:"Bebas Neue",fontSize:18,color:remainingWildcards>0?"var(--gold)":"var(--red)"}}>{remainingWildcards}</span>
        <span style={{fontSize:11,color:"var(--muted)"}}>restantes</span>
      </div>
    </div>
    <div style={{background:"rgba(245,183,49,.08)",border:"1px solid rgba(245,183,49,.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--muted)"}}>
      🃏 <strong style={{color:"var(--gold)"}}>Comodín:</strong> Cuesta {wildcardCost} pt. Exacto <strong style={{color:"var(--gold)"}}>+8</strong> · Ganador <strong style={{color:"var(--gold)"}}>+5</strong> · Goles <strong style={{color:"var(--gold)"}}>+2</strong> · Falla <strong style={{color:"var(--red)"}}>0</strong>
    </div>
    {(() => {
      const porCargar = matches.filter(m => !isLocked(m.kickoff_at, matches, m.match_date));
      const cargados  = matches.filter(m =>  isLocked(m.kickoff_at, matches, m.match_date));
      return (
        <div className="pre-tabs" style={{marginBottom:16}}>
          <button className={`pre-tab ${matchSub==="porcargar"?"active":""}`} onClick={()=>setMatchSub("porcargar")}>⚽ Por cargar {porCargar.length>0?`(${porCargar.length})`:""}</button>
          <button className={`pre-tab ${matchSub==="cargados"?"active":""}`} onClick={()=>setMatchSub("cargados")}>🔒 Cargados {cargados.length>0?`(${cargados.length})`:""}</button>
          <button className={`pre-tab ${matchSub==="puntos"?"active":""}`} onClick={()=>setMatchSub("puntos")}>🏆 Tus puntos</button>
        </div>
      );
    })()}
    {matchSub==="porcargar" && (() => {
      const pend = pendientesGuardar();
      if (!pend.length) return null;
      return (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",background:"var(--gold-dim)",border:"1px solid var(--gold)",borderRadius:10,padding:"10px 14px",marginBottom:16}}>
          <span style={{fontSize:13,color:"var(--txt)"}}>Tenés <strong style={{color:"var(--gold)"}}>{pend.length}</strong> pronóstico{pend.length!==1?"s":""} sin guardar.</span>
          <button onClick={saveAll} disabled={savingAll} style={{padding:"9px 16px",borderRadius:8,border:"none",background:"var(--gold)",color:"#000",fontWeight:700,fontSize:13,cursor:savingAll?"default":"pointer",opacity:savingAll?0.6:1,whiteSpace:"nowrap"}}>{savingAll?"Guardando…":`💾 Guardar todos (${pend.length})`}</button>
        </div>
      );
    })()}
    {matchSub!=="puntos" && <div className="matches-grid">
      {matches
        .filter(m => matchSub==="cargados"
          ? isLocked(m.kickoff_at, matches, m.match_date)
          : !isLocked(m.kickoff_at, matches, m.match_date))
        .sort((a,b) => matchSub==="cargados"
          ? new Date(b.kickoff_at) - new Date(a.kickoff_at)   // Cargados: más reciente primero
          : new Date(a.kickoff_at) - new Date(b.kickoff_at))  // Por cargar: más próximo primero
        .map((m, _idx, _arr) => {
        // Encabezado de fecha: se muestra cuando cambia el día respecto al partido anterior
        const _dayKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0,10);
        const _prev = _idx > 0 ? _arr[_idx-1] : null;
        const _prevKey = _prev ? (_prev.match_date || new Date(_prev.kickoff_at).toISOString().slice(0,10)) : null;
        const _showDateHeader = _dayKey !== _prevKey;
        const locked = isLocked(m.kickoff_at, matches, m.match_date) || isEliminated;
        const myPred = predictions.find(p => p.match_id === m.id);
        const sc = scores[m.id] || {};
        const hasScore = sc.home!==undefined&&sc.away!==undefined&&sc.home!==""&&sc.away!=="";
        const wasSaved = saved[m.id];
        const hasWildcard = !!wildcards.find(w => w.match_id === m.id);
        const canBuyWildcard = !locked && myPred && !hasWildcard && remainingWildcards > 0;
        // Urgente: faltan <24h para el cierre de la jornada y NO cargué el pronóstico
        const dKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0,10);
        const sameDay = matches.filter(x => (x.match_date || new Date(x.kickoff_at).toISOString().slice(0,10)) === dKey);
        const firstKick = Math.min(...sameDay.map(x => new Date(x.kickoff_at).getTime()));
        const msToDeadline = (firstKick - 24*60*60*1000) - nowMs();
        const isUrgent = !locked && !myPred && !wasSaved && msToDeadline > 0 && msToDeadline < 24*60*60*1000;
        return (
          <React.Fragment key={m.id}>
          {_showDateHeader && (
            <div style={{gridColumn:"1 / -1",display:"flex",alignItems:"center",gap:8,margin:"6px 2px 2px"}}>
              <span style={{fontFamily:"Bebas Neue",fontSize:15,color:"var(--gold)",letterSpacing:1}}>📅 {m.match_date}</span>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
          )}
          <div>
            <div className={`match-card ${locked?"locked":(myPred||wasSaved)?"saved":""}`} style={{borderColor: hasWildcard ? "var(--gold)" : isUrgent ? "var(--red)" : undefined, borderWidth: (hasWildcard||isUrgent) ? 2 : undefined}}>
              <div className="team"><img className="team-flag" src={m.home_flag} alt={m.home}/><span className="team-name">{m.home}</span></div>
              <div className="match-center">
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
                  <span className="group-badge">{m.group_name ? `Grupo ${m.group_name}` : m.phase}</span>
                  <span className="match-meta">{localDate(m.kickoff_at)} · {localTime(m.kickoff_at)}</span>
                  {hasWildcard && <span style={{fontSize:14}}>🃏</span>}
                  {!locked && <MatchCountdown kickoff={m.kickoff_at} matchDate={m.match_date} matches={matches} />}
                </div>
                {!locked && <div style={{textAlign:"center",marginTop:2}}><DeadlineLabel kickoff={m.kickoff_at} matchDate={m.match_date} matches={matches} /></div>}
                {locked ? (
                  myPred
                    ? <div className="score-display"><span>{myPred.home_score}</span><span style={{color:"var(--muted)",fontSize:16}}>–</span><span>{myPred.away_score}</span></div>
                    : <span className="no-pred">Sin predicción</span>
                ) : (
                  <div className="score-inputs">
                    <input className="score-input" value={sc.home??""} onChange={e=>setScore(m.id,"home",e.target.value)} placeholder="–" inputMode="numeric"/>
                    <span className="score-sep">–</span>
                    <input className="score-input" value={sc.away??""} onChange={e=>setScore(m.id,"away",e.target.value)} placeholder="–" inputMode="numeric"/>
                  </div>
                )}
                {locked
                  ? <span className="locked-tag">🔒 Partido iniciado</span>
                  : hasScore
                    ? <button className="save-btn" onClick={()=>save(m)} disabled={saving[m.id]}>{saving[m.id]?"...":wasSaved?"✓ GUARDADO":myPred?"ACTUALIZAR":"GUARDAR"}</button>
                    : myPred ? <span className="saved-tag">✓ Guardado</span>
                      : <span style={{fontSize:11,color:"var(--muted)",fontStyle:"italic"}}>✏️ Cargá tu pronóstico</span>}
                {!locked && myPred && (
                  <button
                    onClick={() => toggleWildcard(m)}
                    disabled={savingWildcard[m.id] || (!hasWildcard && remainingWildcards === 0)}
                    style={{
                      padding:"3px 10px", borderRadius:20, border:"1px solid",
                      borderColor: hasWildcard ? "var(--gold)" : remainingWildcards===0 ? "var(--border)" : "rgba(245,183,49,.4)",
                      background: hasWildcard ? "var(--gold-dim)" : "none",
                      color: hasWildcard ? "var(--gold)" : remainingWildcards===0 ? "var(--muted)" : "rgba(245,183,49,.7)",
                      fontSize:11, cursor: remainingWildcards===0&&!hasWildcard ? "not-allowed" : "pointer",
                      opacity: remainingWildcards===0&&!hasWildcard ? 0.5 : 1
                    }}
                  >
                    {savingWildcard[m.id] ? "..." : hasWildcard ? "🃏 Comodín activo · Cancelar" : "🃏 Usar comodín (-" + wildcardCost + "pt)"}
                  </button>
                )}
                {/* Encuesta: % de quién gana según predicciones */}
                {isLocked(m.kickoff_at, matches, m.match_date) && polls[m.id] && polls[m.id].total >= 2 && (
                  <div style={{width:"100%",marginTop:4}}>
                    {(() => {
                      const p = polls[m.id];
                      const homePct = Math.round(p.home/p.total*100);
                      const drawPct = Math.round(p.draw/p.total*100);
                      const awayPct = 100 - homePct - drawPct;
                      return (
                        <div style={{fontSize:9,color:"var(--muted)",display:"flex",gap:2,alignItems:"center"}}>
                          <span style={{color:"var(--txt)",minWidth:24,textAlign:"right"}}>{homePct}%</span>
                          <div style={{flex:1,height:4,background:"var(--border)",borderRadius:20,overflow:"hidden",display:"flex"}}>
                            <div style={{width:`${homePct}%`,background:"var(--blue)",transition:"width .5s"}}/>
                            <div style={{width:`${drawPct}%`,background:"var(--muted)",transition:"width .5s"}}/>
                            <div style={{width:`${awayPct}%`,background:"var(--red)",transition:"width .5s"}}/>
                          </div>
                          <span style={{color:"var(--txt)",minWidth:24}}>{awayPct}%</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Historial de cambios */}
                {history[m.id] && history[m.id].length > 0 && (
                  <div style={{width:"100%",marginTop:2}}>
                    <button onClick={() => setShowHistory(s => ({...s,[m.id]:!s[m.id]}))} style={{background:"none",border:"none",color:"var(--muted)",fontSize:10,cursor:"pointer",padding:0}}>
                      {showHistory[m.id] ? "▲" : "▼"} {history[m.id].length} cambio{history[m.id].length!==1?"s":""}
                    </button>
                    {showHistory[m.id] && (
                      <div style={{marginTop:4,display:"flex",flexDirection:"column",gap:2}}>
                        {history[m.id].slice(0,5).map((h,i) => (
                          <div key={i} style={{fontSize:10,color:"var(--muted)",display:"flex",gap:6,alignItems:"center"}}>
                            <span style={{fontFamily:"Bebas Neue",fontSize:12,color:"var(--border2)"}}>{h.home_score}–{h.away_score}</span>
                            <span>{new Date(h.changed_at).toLocaleDateString("es",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="team away"><img className="team-flag" src={m.away_flag} alt={m.away}/><span className="team-name">{m.away}</span></div>
            </div>
          </div>
          </React.Fragment>
        );
      })}
      {matches.filter(m => matchSub==="cargados" ? isLocked(m.kickoff_at, matches, m.match_date) : !isLocked(m.kickoff_at, matches, m.match_date)).length === 0 && (
        <div style={{textAlign:"center",padding:"32px 16px",color:"var(--muted)",fontSize:13}}>
          {matchSub==="cargados" ? "Todavía no empezó ningún partido." : "¡No te queda nada por cargar! 🎉"}
        </div>
      )}
    </div>}
    {matchSub==="puntos" && <TusPuntosView matches={matches} predictions={predictions} allPredictions={allPredictions} profiles={profiles} userId={user.id} wildcards={wildcards} />}
  </>);
}


// ── Vista "Tus puntos": partidos finalizados con los puntos del usuario ──
function TusPuntosView({ matches, predictions, allPredictions, profiles, userId, wildcards }) {
  const finished = matches
    .filter(m => m.status === "finished" && m.home_score != null && m.away_score != null)
    .sort((a, b) => new Date(b.kickoff_at) - new Date(a.kickoff_at));

  const rows = finished.map(m => {
    const pred = predictions.find(p => p.user_id === userId && p.match_id === m.id);
    const wc = wildcards.find(w => w.match_id === m.id);
    return { m, pred, wc };
  });

  const totalPts = rows.reduce((s, r) => s + (r.pred?.points || 0), 0);

  // Posición en la tabla (por puntos totales de partidos)
  const allP = allPredictions || [];
  const ptsByUser = {};
  allP.forEach(p => { ptsByUser[p.user_id] = (ptsByUser[p.user_id] || 0) + (p.points || 0); });
  const ranking = Object.entries(ptsByUser).sort((a, b) => b[1] - a[1]);
  const miPos = ranking.findIndex(([uid]) => uid === userId) + 1;
  const totalJug = (profiles || []).length || ranking.length;

  // Resumen de aciertos
  let nExact = 0, nWinner = 0, nGoals = 0, nFail = 0;
  rows.forEach(r => {
    if (!r.pred) return;
    const o = predOutcome(r.pred, r.m);
    if (o === "exact") nExact++;
    else if (o === "winner") nWinner++;
    else if (o === "goals") nGoals++;
    else nFail++;
  });

  if (finished.length === 0) {
    return <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)", fontSize: 13 }}>Todavía no hay partidos finalizados.</div>;
  }

  // Agrupar por fecha
  let lastDay = null;

  return (
    <div className="matches-grid">
      <div style={{ background: "linear-gradient(90deg, rgba(245,197,24,.12), rgba(245,197,24,.02))", border: "1px solid rgba(245,197,24,.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Total en partidos jugados</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            {miPos > 0 && <span style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "var(--txt)" }}>#{miPos}<span style={{ fontSize: 12, color: "var(--muted)" }}> de {totalJug}</span></span>}
            <span style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--gold)" }}>{totalPts} pts</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, flexWrap: "wrap" }}>
          <span style={{ color: "var(--gold)" }}>⭐ {nExact} exactos</span>
          <span style={{ color: "var(--green)" }}>✓ {nWinner} ganador</span>
          <span style={{ color: "var(--blue)" }}>◐ {nGoals} goles</span>
          <span style={{ color: "var(--muted)" }}>✗ {nFail} fallos</span>
        </div>
      </div>
      {rows.map((r, idx) => {
        const { m, pred, wc } = r;
        const dayKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
        const showHeader = dayKey !== lastDay;
        lastDay = dayKey;
        const pts = pred?.points || 0;
        const outcome = pred ? predOutcome(pred, m) : null;
        // Color por valor de puntos (contempla comodín: +7/+4/0/-1)
        let color, glow = false;
        if (pts >= 7) { color = "var(--gold)"; glow = true; }
        else if (pts === 5) color = "var(--gold)";
        else if (pts === 4) color = "#7bed9f";        // verde lima (comodín ganador)
        else if (pts === 3) color = "var(--green)";
        else if (pts === 1) color = "var(--blue)";
        else if (pts < 0)   color = "var(--red)";     // -1 comodín fallado
        else                color = "var(--muted)";   // 0
        const label = !pred ? "Sin predicción"
          : outcome === "exact" ? "¡Exacto!"
          : outcome === "winner" ? "Ganador"
          : outcome === "goals" ? "Goles"
          : (pts < 0 ? "Comodín fallado" : "Sin acierto");
        return (
          <React.Fragment key={m.id}>
            {showHeader && <div style={{ display: "flex", alignItems: "center", gap: 8, margin: idx === 0 ? "0 0 10px" : "18px 0 10px" }}><span style={{ fontSize: 12 }}>📅</span><span style={{ fontFamily: "Bebas Neue", fontSize: 16, color: "var(--gold)", letterSpacing: 1 }}>{m.match_date}</span></div>}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, flexWrap: "wrap" }}>
                    <img src={m.home_flag} alt={m.home} style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                    <span>{m.home}</span>
                    <span style={{ color: "var(--gold)", fontFamily: "Bebas Neue", fontSize: 17 }}>{m.home_score}-{m.away_score}</span>
                    <span>{m.away}</span>
                    <img src={m.away_flag} alt={m.away} style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    {pred ? <>Tu pronóstico: <strong style={{ color: "var(--txt)" }}>{pred.home_score}-{pred.away_score}</strong></> : <span style={{ color: "var(--red)" }}>No cargaste pronóstico</span>}
                    {wc && <span style={{ marginLeft: 8, color: "var(--gold)" }}>🃏 Comodín</span>}
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0, minWidth: 64 }}>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 24, color, lineHeight: 1, textShadow: glow ? `0 0 10px ${color}` : "none" }}>{pts > 0 ? "+" + pts : pts}</div>
                  <div style={{ fontSize: 10, color, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Standings ────────────────────────────────────────────────────────────────
function Standings({ user, predictions, matches, profiles, onRefresh, isAdmin, allAchievements, autoOpenUserId, onAutoOpened }) {
  const [prePreds, setPrePreds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [allWildcards, setAllWildcards] = useState([]);
  const [maxWild, setMaxWild] = useState(4);
  useEffect(() => {
    sb.from("wildcards").select("*").then(({ data }) => setAllWildcards(data || []));
    sb.from("scoring_rules").select("rule_value").eq("rule_key", "max_wildcards").single().then(({ data }) => { if (data && data.rule_value != null) setMaxWild(data.rule_value); });
    sb.from("ranking_snapshots").select("*").order("snapshot_date").then(({ data }) => setSnapshots(data || []));
  }, []);
  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [sortBy, setSortBy] = useState("pts"); // pts | exact | winner | goals
  const [userAchievements, setUserAchievements] = useState({});
  const [h2hUser, setH2hUser] = useState(null);
  const [showH2hPicker, setShowH2hPicker] = useState(false);
  const [showAllAchs, setShowAllAchs] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);
  const [h2hMatchData, setH2hMatchData] = useState([]);
  const [loadingH2h, setLoadingH2h] = useState(false);

  function calcPts(userId) {
    const matchPts = predictions.filter(p => p.user_id === userId).reduce((s, p) => s + (p.points || 0), 0);
    const prePts = prePreds.filter(p => p.user_id === userId).reduce((s, p) => s + (p.points || 0), 0);
    return matchPts + prePts;
  }

  async function openHistory(prof) {
    setHistoryUser({ ...prof, pts: calcPts(prof.id) });
    setH2hUser(null);
    setShowH2hPicker(false);
    setLoadingSnaps(true);
    const [{ data: snaps }, { data: achData }] = await Promise.all([
      sb.from("ranking_snapshots").select("*").order("snapshot_date"),
      sb.from("achievements").select("*"),
    ]);
    setSnapshots(snaps || []);
    // Group achievements by user
    const byUser = {};
    (achData || []).forEach(a => {
      if (!byUser[a.user_id]) byUser[a.user_id] = new Set();
      byUser[a.user_id].add(a.achievement_key);
    });
    setUserAchievements(byUser);
    setLoadingSnaps(false);
  }

  useEffect(() => {
    if (autoOpenUserId) {
      const prof = profiles.find(p => p.id === autoOpenUserId);
      if (prof) openHistory(prof);
      onAutoOpened && onAutoOpened();
    }
  }, [autoOpenUserId]);

  async function openH2h(opponent) {
    setShowH2hPicker(false);
    setLoadingH2h(true);
    const { data: allMatches } = await sb.from("matches").select("*").eq("status", "finished").order("kickoff_at");
    const userA = historyUser.id;
    const userB = opponent.id;
    const predsA = predictions.filter(p => p.user_id === userA);
    const predsB = predictions.filter(p => p.user_id === userB);
    const rows = (allMatches || []).map(m => {
      const pa = predsA.find(p => p.match_id === m.id);
      const pb = predsB.find(p => p.match_id === m.id);
      if (!pa && !pb) return null;
      return { match: m, predA: pa || null, predB: pb || null };
    }).filter(Boolean);
    setH2hMatchData(rows);
    setH2hUser({ ...opponent, pts: calcPts(opponent.id) });
    setLoadingH2h(false);
  }

  async function loadPrePreds() {
    const { data } = await sb.from("pretournament_predictions").select("*");
    if (data) setPrePreds(data);
  }

  useEffect(() => { loadPrePreds(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await sb.rpc("recalculate_points");
    await loadPrePreds();
    onRefresh();
    setRefreshing(false);
  }

  // Movimiento de posición: comparar posición actual vs snapshot anterior
  const snapDates = [...new Set((snapshots || []).map(s => s.snapshot_date))].sort();
  const prevSnapDate = snapDates.length >= 1 ? snapDates[snapDates.length - 1] : null;
  const prevPosByUser = {};
  if (prevSnapDate) (snapshots || []).forEach(s => { if (s.snapshot_date === prevSnapDate) prevPosByUser[s.user_id] = s.position; });

  let rows = profiles.map(p => {
    const preds = predictions.filter(pr => pr.user_id === p.id);
    const matchPts = preds.reduce((s, pr) => s + (pr.points || 0), 0);
    const prePts = prePreds.filter(pr => pr.user_id === p.id).reduce((s, pr) => s + (pr.points || 0), 0);
    const pts = matchPts + prePts;
    let exact = 0, winner = 0, goals = 0, played = 0;
    for (const pr of preds) {
      const m = (matches || []).find(mm => mm.id === pr.match_id);
      if (!m || m.home_score == null || m.away_score == null) continue;
      played++;
      const o = predOutcome(pr, m);
      if (o === "exact") exact++;
      else if (o === "winner") winner++;
      else if (o === "goals") goals++;
    }
    return { ...p, pts, exact, winner, goals, played };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);

  // Posición "real" por puntos (para movimiento y dif con líder), ANTES de reordenar por columna
  const liderPts = rows.length ? rows[0].pts : 0;
  rows.forEach((r, idx) => {
    r.posReal = idx + 1;
    r.difLider = r.pts - liderPts; // 0 o negativo
    const prev = prevPosByUser[r.id];
    r.mov = (prev != null) ? (prev - (idx + 1)) : 0; // positivo = subió
  });

  // Orden configurable por columna (sin perder la posición real ya calculada)
  if (sortBy !== "pts") {
    rows = [...rows].sort((a, b) => (b[sortBy] - a[sortBy]) || (b.pts - a.pts));
  }

  function renderH2h() {
    const uA = historyUser;
    const uB = h2hUser;
    const snapsA = snapshots.filter(s => s.user_id === uA.id).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    const snapsB = snapshots.filter(s => s.user_id === uB.id).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    const allDates = [...new Set(snapshots.map(s => s.snapshot_date))].sort();

    let winsA = 0, winsB = 0, ties = 0;
    h2hMatchData.forEach(({ predA, predB }) => {
      const pA = predA ? (predA.points || 0) : 0;
      const pB = predB ? (predB.points || 0) : 0;
      if (pA > pB) winsA++;
      else if (pB > pA) winsB++;
      else ties++;
    });

    const chartW = 320; const chartH = 130; const pad = 22;
    const maxPts = Math.max(...snapsA.map(s => s.points), ...snapsB.map(s => s.points), 1);

    function buildPath(snaps) {
      if (snaps.length === 0) return "";
      return snaps.map((s, i) => {
        const x = pad + (i / Math.max(snaps.length - 1, 1)) * (chartW - pad * 2);
        const y = chartH - pad - (s.points / maxPts) * (chartH - pad * 2);
        return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
    }

    function buildPoints(snaps) {
      return snaps.map((s, i) => {
        const x = pad + (i / Math.max(snaps.length - 1, 1)) * (chartW - pad * 2);
        const y = chartH - pad - (s.points / maxPts) * (chartH - pad * 2);
        return [x, y, s];
      });
    }

    const ptsA = buildPoints(snapsA);
    const ptsB = buildPoints(snapsB);
    const hasChart = snapsA.length > 0 || snapsB.length > 0;

    return (
      <div className="modal-overlay" onClick={() => { setH2hUser(null); setH2hMatchData([]); }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={() => { setH2hUser(null); setH2hMatchData([]); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>← Volver</button>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "var(--gold)", letterSpacing: 1 }}>⚔️ HEAD TO HEAD</div>
            <button onClick={() => { setHistoryUser(null); setH2hUser(null); setH2hMatchData([]); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Avatar profile={uA} />
              <div style={{ textAlign: "center" }}>
                <ChampionName profile={uA} name={uA.name} style={{ fontSize: 12, fontWeight: 600 }} />
                <TitleBadges profile={uA} size={12} />
              </div>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "var(--gold)" }}>{uA.pts} pts</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: winsA > winsB ? "var(--gold)" : winsB > winsA ? "var(--muted)" : "var(--txt)" }}>{winsA}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>VS</div>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: winsB > winsA ? "var(--gold)" : winsA > winsB ? "var(--muted)" : "var(--txt)" }}>{winsB}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Avatar profile={uB} />
              <div style={{ textAlign: "center" }}>
                <ChampionName profile={uB} name={uB.name} style={{ fontSize: 12, fontWeight: 600 }} />
                <TitleBadges profile={uB} size={12} />
              </div>
              <div style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "var(--blue)" }}>{uB.pts} pts</div>
            </div>
          </div>
          {ties > 0 && <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: -10, marginBottom: 12 }}>{ties} partido{ties !== 1 ? "s" : ""} empatados en puntos</div>}
          {loadingH2h ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>Cargando...</div>
          ) : (<>
            {hasChart && (
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Evolución de puntos</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 16, height: 2.5, background: "var(--gold)", borderRadius: 2 }} /><span style={{ color: "var(--muted)" }}>{uA.name.split(" ")[0]}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}><div style={{ width: 16, height: 2.5, background: "var(--blue)", borderRadius: 2 }} /><span style={{ color: "var(--muted)" }}>{uB.name.split(" ")[0]}</span></div>
                </div>
                <svg viewBox={"0 0 " + chartW + " " + chartH} style={{ width: "100%", height: chartH }}>
                  {buildPath(snapsA) && <path d={buildPath(snapsA)} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" />}
                  {buildPath(snapsB) && <path d={buildPath(snapsB)} fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinejoin="round" />}
                  {ptsA.map((p, i) => <circle key={"a" + i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--gold)" />)}
                  {ptsB.map((p, i) => <circle key={"b" + i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--blue)" />)}
                  {allDates.map((d, i) => { const x = pad + (i / Math.max(allDates.length - 1, 1)) * (chartW - pad * 2); return <text key={i} x={x} y={chartH - 2} textAnchor="middle" fontSize="9" fill="var(--muted)">{d.slice(5)}</text>; })}
                </svg>
              </div>
            )}
            {!hasChart && <div style={{ textAlign: "center", padding: "12px 0", color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>Sin snapshots aún para comparar evolución.</div>}
            {h2hMatchData.length > 0 ? (
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Partido a partido</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {h2hMatchData.map(({ match: m, predA, predB }, idx) => {
                    const pA = predA ? (predA.points || 0) : null;
                    const pB = predB ? (predB.points || 0) : null;
                    const winA = pA !== null && pB !== null && pA > pB;
                    const winB = pA !== null && pB !== null && pB > pA;
                    const tieMatch = pA !== null && pB !== null && pA === pB;
                    return (
                      <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, padding: "7px 0", borderBottom: idx < h2hMatchData.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                          {predA ? (<><span style={{ fontFamily: "Bebas Neue", fontSize: 15, color: winA ? "var(--gold)" : tieMatch ? "var(--txt)" : "var(--muted)" }}>{predA.home_score}–{predA.away_score}</span>{pA > 0 && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 20, background: winA ? "rgba(245,183,49,.15)" : "var(--green-dim)", color: winA ? "var(--gold)" : "var(--green)" }}>+{pA}</span>}</>) : <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}><img src={m.home_flag} alt="" style={{ width: 13, height: 10, objectFit: "cover", borderRadius: 1 }} /><span style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap" }}>{m.home.split(" ")[0]}</span><span style={{ fontSize: 9, color: "var(--muted)" }}>vs</span><span style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap" }}>{m.away.split(" ")[0]}</span><img src={m.away_flag} alt="" style={{ width: 13, height: 10, objectFit: "cover", borderRadius: 1 }} /></div>
                          <span style={{ fontSize: 9, color: "var(--gold)", fontFamily: "Bebas Neue" }}>{m.home_score}–{m.away_score}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {predB ? (<>{pB > 0 && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 20, background: winB ? "rgba(74,158,255,.15)" : "var(--green-dim)", color: winB ? "var(--blue)" : "var(--green)" }}>+{pB}</span>}<span style={{ fontFamily: "Bebas Neue", fontSize: 15, color: winB ? "var(--blue)" : tieMatch ? "var(--txt)" : "var(--muted)" }}>{predB.home_score}–{predB.away_score}</span></>) : <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <div style={{ textAlign: "center", padding: "12px 0", color: "var(--muted)", fontSize: 13 }}>Ninguno de los dos tiene predicciones en partidos jugados aún.</div>}
          </>)}
        </div>
      </div>
    );
  }

  function renderHistory() {
    const prof = historyUser;
    const userSnaps = snapshots.filter(s => s.user_id === prof.id).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    const allDates = [...new Set(snapshots.map(s => s.snapshot_date))].sort();
    const daysFirst = snapshots.filter(s => s.position === 1 && s.user_id === prof.id).length;
    const totalDays = allDates.length;
    const chartW = 320; const chartH = 120; const pad = 20;
    const pts = userSnaps.map(s => s.points);
    const maxP = Math.max(...pts, 1);
    const points = userSnaps.map((s, i) => {
      const x = pad + (i / (Math.max(userSnaps.length - 1, 1))) * (chartW - pad * 2);
      const y = chartH - pad - (s.points / maxP) * (chartH - pad * 2);
      return [x, y];
    });
    const pathD = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const others = profiles.filter(p => p.id !== prof.id);
    const profTitles = prof.titles || [];
    const profAchievements = userAchievements[prof.id] || new Set();
    const unlockedAchs = ACHIEVEMENTS.filter(a => profAchievements.has(a.key));
    const myRow = rows.find(r => r.id === prof.id) || prof;
    const curPos = rows.findIndex(r => r.id === prof.id) + 1;
    const aciertos = (myRow.exact || 0) + (myRow.winner || 0) + (myRow.goals || 0);
    const pctAcierto = myRow.played ? Math.round(aciertos / myRow.played * 100) : 0;
    const myWc = allWildcards.filter(w => w.user_id === prof.id);
    let wcOk = 0, wcFail = 0, wcPend = 0;
    myWc.forEach(w => {
      const m = (matches || []).find(mm => mm.id === w.match_id);
      const pr = predictions.find(p => p.user_id === prof.id && p.match_id === w.match_id);
      if (!m || m.home_score == null || m.away_score == null || !pr || pr.home_score == null) { wcPend++; return; }
      const o = predOutcome(pr, m);
      if (o === "exact" || o === "winner" || o === "goals") wcOk++; else wcFail++;
    });
    const wcUsed = myWc.length;
    const wcLeft = Math.max(0, (maxWild || 0) - wcUsed);

    return (
      <div className="modal-overlay" onClick={() => { setHistoryUser(null); setShowH2hPicker(false); }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar profile={prof} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChampionName profile={prof} name={prof.name} style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: 1 }} />
                  <TitleBadges profile={prof} size={16} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{curPos > 0 ? "#" + curPos + " · " : ""}{prof.pts} pts actuales</div>
              </div>
            </div>
            <button onClick={() => { setHistoryUser(null); setShowH2hPicker(false); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>

          {/* Cartas destacadas (NFT) */}
          {Array.isArray(prof.featured_nfts) && prof.featured_nfts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--gold)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>⭐ Cartas destacadas</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {prof.featured_nfts.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ width: prof.featured_nfts.length === 1 ? 120 : 96 }}>
                    <NFTCard nft={c} edition={c.rareza === "limited" ? c.edition : null} />
                    <div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Títulos anteriores */}
          {profTitles.length > 0 && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(245,183,49,.2)" }}>
              <div style={{ fontSize: 11, color: "var(--gold)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>🏆 Títulos anteriores</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {profTitles.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span>{t.position === 1 ? "👑" : "🥈"}</span>
                    <span style={{ color: t.position === 1 ? "var(--gold)" : "#b0bcd0", fontWeight: 600 }}>{t.position === 1 ? "Campeón" : "Subcampeón"}</span>
                    <span style={{ color: "var(--muted)" }}>· {t.tournament}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logros desbloqueados (colapsable a 1 fila) */}
          {unlockedAchs.length > 0 && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>
                  🏅 Logros ({unlockedAchs.length}/{ACHIEVEMENTS.length})
                </div>
                {unlockedAchs.length > 3 && (
                  <button onClick={() => setShowAllAchs(v => !v)} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 11, cursor: "pointer", padding: 0 }}>
                    {showAllAchs ? "Ver menos ▴" : "Ver todos ▾"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: showAllAchs ? "wrap" : "nowrap", gap: 6, overflow: showAllAchs ? "visible" : "hidden" }}>
                {(showAllAchs ? unlockedAchs : unlockedAchs.slice(0, 3)).map(a => {
                  const tier = TIER_COLORS[a.tier];
                  const isEquipped = prof.equipped_badge === a.key;
                  return (
                    <div key={a.key} title={a.name + " — " + a.desc} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", borderRadius: 20, flexShrink: 0,
                      background: tier.bg, border: `1px solid ${tier.border}`,
                      fontSize: 12, color: tier.color,
                      boxShadow: isEquipped ? `0 0 8px ${tier.border}` : "none",
                    }}>
                      <span>{a.icon}</span>
                      <span style={{ fontSize: 10 }}>{a.name}</span>
                      {isEquipped && <span style={{ fontSize: 9 }}>✓</span>}
                    </div>
                  );
                })}
                {!showAllAchs && unlockedAchs.length > 3 && (
                  <div onClick={() => setShowAllAchs(true)} style={{ display: "flex", alignItems: "center", padding: "3px 8px", borderRadius: 20, background: "var(--card)", border: "1px solid var(--border)", fontSize: 10, color: "var(--muted)", flexShrink: 0, cursor: "pointer" }}>+{unlockedAchs.length - 3}</div>
                )}
              </div>
            </div>
          )}

          {/* Perfil del participante (cronista_perfil, visible para todos) */}
          {(prof.cronista_perfil || "").trim().length > 0 && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, border: "1px solid rgba(139,92,246,.25)" }}>
              <button onClick={() => setShowPerfil(v => !v)} style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#a78bfa", textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 }}>🎭 Perfil del participante</span>
                <span style={{ color: "#a78bfa", fontSize: 13 }}>{showPerfil ? "▴" : "▾"}</span>
              </button>
              {showPerfil && (
                <div style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.55, marginTop: 10, whiteSpace: "pre-wrap" }}>{prof.cronista_perfil}</div>
              )}
            </div>
          )}

          {/* Comparar */}
          {others.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {!showH2hPicker ? (
                <button onClick={() => setShowH2hPicker(true)} style={{ width: "100%", padding: "9px 14px", background: "rgba(74,158,255,.1)", border: "1px solid rgba(74,158,255,.3)", borderRadius: 8, color: "var(--blue)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>⚔️ Comparar con...</button>
              ) : (
                <div style={{ background: "rgba(74,158,255,.07)", border: "1px solid rgba(74,158,255,.2)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "var(--blue)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Elegir rival</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {others.map(o => (
                      <button key={o.id} onClick={() => openH2h(o)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, cursor: "pointer", color: "var(--txt)", fontSize: 13 }}>
                        <div className={`avatar sm ${championAvatarClass(o)}`}>{initials(o.name)}</div>
                        <ChampionName profile={o} name={o.name} />
                        <TitleBadges profile={o} size={12} />
                        <span style={{ marginLeft: "auto", fontFamily: "Bebas Neue", fontSize: 14, color: "var(--muted)" }}>{calcPts(o.id)} pts</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowH2hPicker(false)} style={{ marginTop: 8, background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                </div>
              )}
            </div>
          )}

          {/* Rendimiento de pronósticos */}
          <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>📊 Rendimiento</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
              <div><div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--gold)" }}>{myRow.exact || 0}</div><div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Exactos</div></div>
              <div><div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--green)" }}>{myRow.winner || 0}</div><div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Ganador</div></div>
              <div><div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--txt)" }}>{pctAcierto}%</div><div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Acierto</div></div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>{aciertos} de {myRow.played || 0} partidos jugados con puntos</div>
          </div>

          {/* Comodines */}
          <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>🃏 Comodines</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, color: "var(--txt)" }}><strong style={{ color: "var(--gold)" }}>{wcUsed}</strong> usados · <strong style={{ color: "var(--gold)" }}>{wcLeft}</strong> disponibles</div>
              <div style={{ fontSize: 12, display: "flex", gap: 10 }}>
                <span style={{ color: "var(--green)" }}>✅ {wcOk}</span>
                <span style={{ color: "var(--red)" }}>❌ {wcFail}</span>
                {wcPend > 0 && <span style={{ color: "var(--muted)" }}>⏳ {wcPend}</span>}
              </div>
            </div>
          </div>

          {/* Snapshots */}
          {loadingSnaps ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>Cargando...</div>
          ) : userSnaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)", fontSize: 13 }}>Sin snapshots aún. El admin debe tomar el primer 📸 snapshot.</div>
          ) : (<>
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Evolución de puntos</div>
              {(() => {
                const padL = 26, padR = 12, padT = 18, padB = 18;
                const w = chartW, h = chartH;
                const niceMax = Math.max(...pts, 1);
                const xFor = (i) => padL + (i / Math.max(userSnaps.length - 1, 1)) * (w - padL - padR);
                const yFor = (v) => h - padB - (v / niceMax) * (h - padT - padB);
                const pts2 = userSnaps.map((sn, i) => [xFor(i), yFor(sn.points)]);
                const d = pts2.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
                const ticks = [...new Set([0, Math.round(niceMax / 2), niceMax])];
                return (
                  <svg viewBox={"0 0 " + w + " " + h} style={{ width: "100%", height: h }}>
                    {ticks.map((t, i) => (
                      <g key={"t" + i}>
                        <line x1={padL} y1={yFor(t)} x2={w - padR} y2={yFor(t)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 3" />
                        <text x={padL - 4} y={yFor(t) + 3} textAnchor="end" fontSize="8" fill="var(--muted)">{t}</text>
                      </g>
                    ))}
                    <path d={d} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" />
                    {pts2.map((p, i) => <circle key={"c" + i} cx={p[0]} cy={p[1]} r="4" fill="var(--gold)" />)}
                    {pts2.map((p, i) => <text key={"v" + i} x={p[0]} y={p[1] - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--gold)">{userSnaps[i].points}</text>)}
                    {userSnaps.map((sn, i) => <text key={"d" + i} x={pts2[i][0]} y={h - 4} textAnchor="middle" fontSize="8" fill="var(--muted)">{sn.snapshot_date.slice(5)}</text>)}
                  </svg>
                );
              })()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}><div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Días en 1er lugar</div><div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "var(--gold)" }}>{daysFirst}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>de {totalDays} snapshots</div></div>
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}><div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Mejor posición</div><div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "var(--gold)" }}>#{userSnaps.length > 0 ? Math.min(...userSnaps.map(s => s.position)) : "-"}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>histórico</div></div>
            </div>
            <div style={{ marginTop: 12, background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Historial de posiciones</div>
              {userSnaps.slice().reverse().slice(0, 5).map(s => (
                <div key={s.snapshot_date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.snapshot_date}</span>
                  <div style={{ display: "flex", gap: 12 }}><span style={{ fontFamily: "Bebas Neue", fontSize: 15, color: s.position === 1 ? "var(--gold)" : "var(--txt)" }}>#{s.position}</span><span style={{ fontSize: 12, color: "var(--muted)" }}>{s.points} pts</span></div>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>
    );
  }

  return (<>
    <div className="sec-hdr" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}><h2>TABLA DE POSICIONES</h2><span>{profiles.length} participantes</span></div>
      {isAdmin && <button className="btn-small" onClick={handleRefresh} disabled={refreshing} style={{ fontSize: 11 }}>{refreshing ? "..." : "🔄 Actualizar"}</button>}
    </div>
    {historyUser && h2hUser && renderH2h()}
    {historyUser && !h2hUser && renderHistory()}
    <div className="standings-wrap">
      <div className="standings-scroll">
      <table className="standings-table">
        <thead>
          <tr>
            <th className="sticky" style={{minWidth:30}}>#</th>
            <th className="sticky2" style={{minWidth:140}}>Jugador</th>
            <th className="c desktop-col" style={{cursor:"pointer"}} onClick={()=>setSortBy("pts")}>PTS{sortBy==="pts"?" ▾":""}</th>
            <th className="c desktop-col" style={{cursor:"pointer"}} onClick={()=>setSortBy("exact")}>Exactos{sortBy==="exact"?" ▾":""}</th>
            <th className="c desktop-col" style={{cursor:"pointer"}} onClick={()=>setSortBy("winner")}>Ganador{sortBy==="winner"?" ▾":""}</th>
            <th className="c desktop-col" style={{cursor:"pointer"}} onClick={()=>setSortBy("goals")}>Goles{sortBy==="goals"?" ▾":""}</th>
            <th className="c desktop-col">Partidos</th>
            <th className="c mobile-col" onClick={()=>setSortBy("pts")}>PTS{sortBy==="pts"?"▾":""}</th>
            <th className="c mobile-col" onClick={()=>setSortBy("exact")}>Ext{sortBy==="exact"?"▾":""}</th>
            <th className="c mobile-col" onClick={()=>setSortBy("winner")}>Gan{sortBy==="winner"?"▾":""}</th>
            <th className="c mobile-col" onClick={()=>setSortBy("goals")}>Gols{sortBy==="goals"?"▾":""}</th>
            <th className="c mobile-col">Part</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} onClick={() => openHistory(row)} style={{ cursor: "pointer", background: row.id === user.id ? "rgba(245,197,24,.07)" : (sortBy === "pts" && row.posReal === 1 ? "linear-gradient(90deg, rgba(245,197,24,.16), rgba(245,197,24,.02))" : sortBy === "pts" && row.posReal === 2 ? "linear-gradient(90deg, rgba(176,188,208,.16), rgba(176,188,208,.02))" : sortBy === "pts" && row.posReal === 3 ? "linear-gradient(90deg, rgba(205,127,50,.16), rgba(205,127,50,.02))" : "transparent"), boxShadow: row.id === user.id ? "inset 3px 0 0 var(--gold)" : "none" }}>
              <td className="sticky">
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span className={"rank-num rank-" + row.posReal}>{row.posReal}</span>
                  {sortBy === "pts" && row.mov !== 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: row.mov > 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
                      {row.mov > 0 ? "▲" : "▼"}{Math.abs(row.mov)}
                    </span>
                  )}
                </div>
              </td>
              <td className="sticky2">
                <div className="user-cell">
                  <Avatar profile={row} size="sm" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      <ChampionName profile={row} name={row.name} style={(row.is_eliminated || row.is_difunto) ? {textDecoration:"line-through",opacity:.5} : {}} />
                      <TitleBadges profile={row} size={13} />
                      {row.id === user.id && <span className="me-badge">TÚ</span>}
                      {row.equipped_badge && (() => { const a = ACHIEVEMENTS.find(a => a.key === row.equipped_badge); return a ? <span title={a.name} style={{fontSize:16,cursor:"default"}}>{a.icon}</span> : null; })()}
                    </div>
                    {row.is_difunto && (
                      <div style={{fontSize:10,marginTop:2,lineHeight:1.4}}>
                        <span style={{color:"#a78bfa"}}>🪦 Descansa en paz</span>
                        {row.difunto_since && <span style={{color:"var(--muted)"}}> · ✝ {new Date(row.difunto_since).toLocaleDateString("es",{day:"2-digit",month:"short"})}</span>}
                        {row.epitafio && <span style={{color:"var(--muted)",fontStyle:"italic"}}> · "{row.epitafio}"</span>}
                      </div>
                    )}
                    {row.is_eliminated && (
  <div style={{fontSize:10,color:"var(--red)",marginTop:2,display:"flex",alignItems:"center",gap:4}}>
    <span>💀 Eliminado por mala paga</span>
  </div>
)}
{row.is_debtor && !row.is_eliminated && <DebtorCounter profile={row} />}
{row.is_debtor && !row.is_eliminated && <span className="mobile-col"><DebtorBadge profile={row} /></span>}
                  </div>
                </div>
              </td>
              <td className="c desktop-col">
                {row.is_debtor
                  ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span className="pts-big" style={{ color: "var(--muted)", textDecoration: "line-through", opacity: .5 }}>{row.pts}</span>
                      <span style={{ fontSize: 14 }}>❌</span>
                    </div>
                  : <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span className="pts-big">{row.pts}</span>
                      {row.difLider < 0 && <span style={{ fontSize: 9, color: "var(--muted)" }}>{row.difLider}</span>}
                    </div>}
              </td>
              <td className="c desktop-col"><span className="pill">{row.exact}</span></td>
              <td className="c desktop-col"><span className="pill">{row.winner}</span></td>
              <td className="c desktop-col"><span className="pill">{row.goals}</span></td>
              <td className="c desktop-col" style={{ color: "var(--muted)", fontSize: 13 }}>{row.played}</td>
              <td className="c mobile-col">
                {row.is_debtor
                  ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      <span className="pts-big" style={{ color: "var(--muted)", textDecoration: "line-through", opacity: .5, fontSize: 18 }}>{row.pts}</span>
                      <span style={{ fontSize: 12 }}>❌</span>
                    </div>
                  : <span className="pts-big" style={{fontSize:18}}>{row.pts}</span>}
              </td>
              <td className="c mobile-col"><span className="pill">{row.exact}</span></td>
              <td className="c mobile-col"><span className="pill">{row.winner}</span></td>
              <td className="c mobile-col"><span className="pill">{row.goals}</span></td>
              <td className="c mobile-col" style={{ color: "var(--muted)", fontSize: 12 }}>{row.played}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
    <Cementerio profiles={profiles} user={user} />
  </>);
}

// ── Cementerio (con libro de mensajes) ────────────────────────────────────────
function Cementerio({ profiles, user }) {
  const difuntos = (profiles || []).filter(p => p.is_difunto);
  const [mensajes, setMensajes] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [posting, setPosting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  async function load() {
    const { data } = await sb.from("cementerio_mensajes").select("*").order("created_at", { ascending: true });
    setMensajes(data || []);
  }
  useEffect(() => { if (difuntos.length) load(); }, [difuntos.length]);

  if (!difuntos.length) return null;

  async function post(difuntoId) {
    const txt = (drafts[difuntoId] || "").trim();
    if (!txt) return;
    if (mensajes.some(m => m.difunto_id === difuntoId && m.user_id === user.id)) return; // ya dejó el suyo
    setPosting(difuntoId);
    const { error } = await sb.from("cementerio_mensajes").insert({ difunto_id: difuntoId, user_id: user.id, mensaje: txt });
    if (!error) {
      setDrafts(d => ({ ...d, [difuntoId]: "" }));
      await load();
    }
    setPosting(null);
  }
  async function saveEdit(m) {
    const txt = editText.trim();
    if (!txt) return;
    setPosting(m.id);
    const { error } = await sb.from("cementerio_mensajes").update({ mensaje: txt }).eq("id", m.id);
    if (!error) { setEditingId(null); setEditText(""); await load(); }
    setPosting(null);
  }
  async function remove(m) {
    setPosting(m.id);
    const { error } = await sb.from("cementerio_mensajes").delete().eq("id", m.id);
    if (!error) await load();
    setPosting(null);
  }
  const nameOf = (uid) => (profiles.find(p => p.id === uid)?.name) || "Alguien";

  return (
    <div className="card" style={{ marginTop: 20, padding: "18px 20px" }}>
      <div className="sec-hdr" style={{ marginBottom: 12 }}><h2>⚰️ CEMENTERIO</h2><span>{difuntos.length} caído{difuntos.length !== 1 ? "s" : ""}</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {difuntos.map(p => {
          const msgs = mensajes.filter(m => m.difunto_id === p.id);
          const mine = msgs.find(m => m.user_id === user.id);
          return (
            <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar profile={p} size="md" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textDecoration: "line-through", opacity: .65 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>🪦 Descansa en paz{p.difunto_since ? ` · ✝ ${new Date(p.difunto_since).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}` : ""}</div>
                  {p.epitafio && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginTop: 3 }}>"{p.epitafio}"</div>}
                </div>
              </div>
              <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {msgs.length === 0
                  ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Todavía nadie dejó un mensaje. Sé el primero en despedirlo. 🕯️</div>
                  : msgs.map(m => {
                      const esMio = m.user_id === user.id;
                      if (esMio && editingId === m.id) {
                        return (
                          <div key={m.id} style={{ display: "flex", gap: 8 }}>
                            <input
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(m); }}
                              maxLength={200} autoFocus
                              style={{ flex: 1, minWidth: 0, padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}
                            />
                            <button onClick={() => saveEdit(m)} disabled={posting === m.id || !editText.trim()} style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: "#3b2f5e", color: "#c4b5fd", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: (posting === m.id || !editText.trim()) ? .5 : 1 }}>{posting === m.id ? "…" : "Guardar"}</button>
                            <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                          </div>
                        );
                      }
                      return (
                        <div key={m.id} style={{ fontSize: 13, color: "var(--txt)", display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                          <span style={{ color: "#a78bfa", fontWeight: 600, flexShrink: 0 }}>{nameOf(m.user_id)}:</span>
                          <span style={{ wordBreak: "break-word" }}>{m.mensaje}</span>
                          {esMio && (
                            <span style={{ display: "inline-flex", gap: 10, marginLeft: 4 }}>
                              <button onClick={() => { setEditingId(m.id); setEditText(m.mensaje); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: 0 }}>✏️ editar</button>
                              <button onClick={() => remove(m)} disabled={posting === m.id} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", padding: 0 }}>🗑️ borrar</button>
                            </span>
                          )}
                        </div>
                      );
                    })}
                {!mine && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <input
                      value={drafts[p.id] || ""}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") post(p.id); }}
                      placeholder="Dejá tu mensaje de despedida…"
                      maxLength={200}
                      style={{ flex: 1, minWidth: 0, padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}
                    />
                    <button
                      onClick={() => post(p.id)}
                      disabled={posting === p.id || !(drafts[p.id] || "").trim()}
                      style={{ padding: "8px 14px", borderRadius: 7, border: "none", background: "#3b2f5e", color: "#c4b5fd", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", opacity: (posting === p.id || !(drafts[p.id] || "").trim()) ? .5 : 1 }}
                    >
                      {posting === p.id ? "…" : "🕯️ Enviar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compare View ─────────────────────────────────────────────────────────────
// ── Comparar Pre-Torneo ───────────────────────────────────────────────────────
function PreTournamentCompare({ user, profiles }) {
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("participante");
  const [expanded, setExpanded] = useState({});
  const locked = isPreTournamentLocked();

  useEffect(() => {
    if (!locked) { setLoading(false); return; }
    sb.from("pretournament_predictions").select("*").then(({ data }) => {
      if (data) setPreds(data);
      setLoading(false);
    });
  }, []);

  function toggle(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }
  const teamGroup = name => (ALL_TEAMS.find(t => t.name === name) || {}).group;
  const teamFlag = name => (ALL_TEAMS.find(t => t.name === name) || {}).flag;
  const userPts = id => preds.filter(p => p.user_id === id).reduce((sm, p) => sm + (p.points || 0), 0);
  const flagImg = name => { const f = teamFlag(name); return f ? <img src={f} alt="" style={{ width: 15, height: 11, objectFit: "cover", borderRadius: 2, verticalAlign: "middle", marginRight: 3 }} /> : null; };
  const teamSpan = pred => pred ? <span style={{ color: pred.points > 0 ? "var(--green)" : "var(--txt)" }}>{flagImg(pred.team)}{pred.team}{pred.points > 0 ? " ✓" : ""}</span> : <span style={{ color: "var(--muted)" }}>—</span>;

  if (!locked) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "20px 18px", textAlign: "center", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
        🔒 Las predicciones de pre-torneo de todos se revelan cuando cierre el pre-torneo<br/>
        <span style={{ color: "var(--gold)", fontWeight: 600 }}>{localDate(TOURNAMENT_START)} · {localTime(TOURNAMENT_START)} ({localTzName()})</span>
      </div>
    );
  }
  if (loading) return <div style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 13 }}>Cargando…</div>;

  const participants = profiles.filter(p => preds.some(pr => pr.user_id === p.id));
  const sorted = [...participants].sort((a, b) => userPts(b.id) - userPts(a.id));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["participante","👤 Por participante"],["grupo","🏆 Por grupo"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", borderColor: mode === k ? "var(--gold)" : "var(--border)", background: mode === k ? "var(--gold-dim)" : "var(--card)", color: mode === k ? "var(--gold)" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {participants.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 13 }}>Todavía nadie cargó predicciones de pre-torneo.</div>
      ) : mode === "participante" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map(p => {
            const mine = preds.filter(pr => pr.user_id === p.id);
            const thirds = mine.filter(pr => pr.prediction_type === "third_place");
            const isOpen = expanded[p.id];
            const pts = userPts(p.id);
            const isMe = p.id === user.id;
            return (
              <div key={p.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div onClick={() => toggle(p.id)} style={{ padding: "11px 16px", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar profile={p} size="sm" /><ChampionName profile={p} name={p.name} style={{fontSize:13}}/><TitleBadges profile={p} size={12}/>{isMe && <span className="me-badge">TÚ</span>}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{pts > 0 && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "var(--green-dim)", color: "var(--green)" }}>+{pts}</span>}<span style={{ color: "var(--muted)", fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span></div>
                </div>
                {isOpen && (
                  <div style={{ padding: "8px 16px 12px" }}>
                    {Object.keys(GROUPS).map(g => {
                      const first = mine.find(pr => pr.prediction_type === "group_standing" && pr.group_name === g && pr.position === 1);
                      const second = mine.find(pr => pr.prediction_type === "group_standing" && pr.group_name === g && pr.position === 2);
                      return (
                        <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                          <span className="group-badge" style={{ minWidth: 54, flexShrink: 0 }}>Grupo {g}</span>
                          <span style={{ flex: 1 }}><span style={{ color: "var(--muted)" }}>1° </span>{teamSpan(first)}</span>
                          <span style={{ flex: 1 }}><span style={{ color: "var(--muted)" }}>2° </span>{teamSpan(second)}</span>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <span style={{ color: "var(--gold)", fontWeight: 600 }}>🥉 Terceros: </span>
                      {thirds.length ? thirds.map((t, i) => <span key={t.id} style={{ color: t.points > 0 ? "var(--green)" : "var(--txt)" }}>{flagImg(t.team)}{t.team}{t.points > 0 ? " ✓" : ""}{i < thirds.length - 1 ? ",  " : ""}</span>) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(GROUPS).map(([g, teams]) => {
            const isOpen = expanded["g_" + g];
            return (
              <div key={g} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div onClick={() => toggle("g_" + g)} style={{ padding: "11px 16px", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}><span className="group-badge" style={{ flexShrink: 0 }}>Grupo {g}</span><span style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teams.map(t => t.name).join(" · ")}</span></span>
                  <span style={{ color: "var(--muted)", fontSize: 13, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div>
                    {sorted.map((p, idx) => {
                      const first = preds.find(pr => pr.user_id === p.id && pr.prediction_type === "group_standing" && pr.group_name === g && pr.position === 1);
                      const second = preds.find(pr => pr.user_id === p.id && pr.prediction_type === "group_standing" && pr.group_name === g && pr.position === 2);
                      const third = preds.find(pr => pr.user_id === p.id && pr.prediction_type === "third_place" && teamGroup(pr.team) === g);
                      const isMe = p.id === user.id;
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 16px", borderBottom: idx < sorted.length - 1 ? "1px solid var(--border)" : "none", background: isMe ? "rgba(245,183,49,.04)" : "transparent", fontSize: 11 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: "0 0 38%" }}><Avatar profile={p} size="sm" /><ChampionName profile={p} name={p.name} style={{fontSize:12}}/>{isMe && <span className="me-badge">TÚ</span>}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end", flex: 1, minWidth: 0 }}>
                            <span><span style={{ color: "var(--muted)" }}>1° </span>{teamSpan(first)}</span>
                            <span><span style={{ color: "var(--muted)" }}>2° </span>{teamSpan(second)}</span>
                            <span><span style={{ color: "var(--muted)" }}>3° </span>{teamSpan(third)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Compare({ user, matches, allPredictions, profiles, autoOpenMatchId, onAutoOpened }) {
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState({});
  const [reactions, setReactions] = useState({});
  const [emojiPicker, setEmojiPicker] = useState(null);
  const [wildcards, setWildcards] = useState([]);
  const [view, setView] = useState("partidos");
  const visibleProfiles = (profiles || []).filter(p => !p.is_eliminated);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    sb.from("reactions").select("*").then(({ data }) => {
      if (!data) return;
      const r = {};
      data.forEach(rx => {
        if (!r[rx.match_id]) r[rx.match_id] = [];
        r[rx.match_id].push(rx);
      });
      setReactions(r);
    });
  }, []);

  useEffect(() => {
    sb.from("wildcards").select("*").then(({ data }) => { if (data) setWildcards(data); });
  }, []);

  async function setReaction(matchId, emoji) {
    const existing = (reactions[matchId] || []).find(r => r.user_id === user.id);
    if (existing) {
      if (existing.emoji === emoji) {
        await sb.from("reactions").delete().eq("id", existing.id);
      } else {
        await sb.from("reactions").update({ emoji }).eq("id", existing.id);
      }
    } else {
      await sb.from("reactions").insert({ user_id: user.id, match_id: matchId, emoji });
    }
    const { data } = await sb.from("reactions").select("*").eq("match_id", matchId);
    setReactions(r => ({ ...r, [matchId]: data || [] }));
    setEmojiPicker(null);
  }

  function getReactionCounts(matchId) {
    const counts = {};
    (reactions[matchId] || []).forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    return counts;
  }

  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });

  const byDay = {};
  matches.forEach(m => {
    const d = m.match_date;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(m);
  });

  const allDays = Object.keys(byDay);
  // Día actual = la fecha de hoy en el mismo formato que match_date (YYYY-MM-DD, UTC).
  // Si hoy no hay partidos, cae a la última jugada o a la próxima a jugarse.
  const todayKey = new Date(nowMs()).toISOString().slice(0, 10);
  const todayDay = byDay[todayKey] ? todayKey : null;
  const lockedDays = allDays.filter(d => byDay[d].some(m => isLocked(m.kickoff_at, matches, m.match_date)));
  const lastLockedDay = lockedDays.length ? lockedDays[lockedDays.length - 1] : null;
  const firstUnlockedDay = allDays.find(d => !byDay[d].some(m => isLocked(m.kickoff_at, matches, m.match_date)));
  const defaultDay = todayDay || lastLockedDay || firstUnlockedDay || allDays[0];
  const [activeDay, setActiveDay] = useState(null);
  useEffect(() => {
    if (!autoOpenMatchId) return;
    const targetDay = allDays.find(d => (byDay[d] || []).some(m => m.id === autoOpenMatchId));
    setView("partidos");
    if (targetDay) setActiveDay(targetDay);
    setExpanded(prev => ({ ...prev, [autoOpenMatchId]: true }));
    const id = autoOpenMatchId;
    setTimeout(() => { const el = document.getElementById("cmp-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 280);
    if (onAutoOpened) onAutoOpened();
  }, [autoOpenMatchId]);
  const dayBarRef = React.useRef(null);

  useEffect(() => {
    if (!activeDay && defaultDay) setActiveDay(defaultDay);
  }, [matches]);

  // Auto-scroll del selector hasta la fecha activa
  useEffect(() => {
    if (activeDay && dayBarRef.current) {
      const btn = dayBarRef.current.querySelector(`[data-day="${activeDay}"]`);
      if (btn) btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [activeDay]);

  function toggleExpand(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }

  function timeUntilReveal(kickoff, matchDateStr) {
    const dateKey = matchDateStr || new Date(kickoff).toISOString().slice(0, 10);
    const sameDayMatches = matches.filter(m => {
      const mKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
      return mKey === dateKey;
    });
    const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
    const deadline = new Date(firstKickoff - 24 * 60 * 60 * 1000);
    const diff = deadline - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  }

  function resultIcon(pred, match) {
    const o = predOutcome(pred, match);
    if (o === null) return null;
    if (o === "exact") return <span style={{ color: "var(--gold)", fontSize: 13 }}>★</span>;
    if (o === "winner") return <span style={{ color: "var(--green)", fontSize: 13 }}>✓</span>;
    return <span style={{ color: "var(--red)", fontSize: 13 }}>✗</span>;
  }

  const dayMatches = activeDay ? (byDay[activeDay] || []) : [];
  const dayIsLocked = dayMatches.some(m => isLocked(m.kickoff_at, matches, m.match_date));
  const countdown = dayMatches.length > 0 ? timeUntilReveal(dayMatches[0].kickoff_at, dayMatches[0].match_date) : null;

  return (<>
    <div className="sec-hdr"><h2>👁️ COMPARAR</h2></div>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {[["partidos","⚽ Partidos"],["pretorneo","📋 Pre-Torneo"]].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid", borderColor: view === k ? "var(--gold)" : "var(--border)", background: view === k ? "var(--gold-dim)" : "var(--card)", color: view === k ? "var(--gold)" : "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{l}</button>
      ))}
    </div>
    {view === "partidos" && (<>
    <div ref={dayBarRef} style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
      {allDays.map(d => {
        const locked = byDay[d].some(m => isLocked(m.kickoff_at, matches, m.match_date));
        return (
          <button key={d} data-day={d} onClick={() => setActiveDay(d)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: activeDay === d ? "var(--gold)" : "var(--border)", background: activeDay === d ? "var(--gold-dim)" : "none", color: activeDay === d ? "var(--gold)" : locked ? "var(--txt)" : "var(--muted)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {locked ? "✓ " : "🔒 "}{d}
          </button>
        );
      })}
    </div>
    {activeDay && (<>
      {!dayIsLocked ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>🔒 Predicciones se revelan en</span>
            <span style={{ fontFamily: "Bebas Neue", fontSize: 20, color: "var(--gold)", letterSpacing: 1 }}>{countdown || "¡Pronto!"}</span>
          </div>
          {dayMatches.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < dayMatches.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}><img src={m.home_flag} alt={m.home} style={{ width: 18, height: 14, objectFit: "cover", borderRadius: 2 }} />{m.home} <span style={{ color: "var(--muted)" }}>vs</span> {m.away}<img src={m.away_flag} alt={m.away} style={{ width: 18, height: 14, objectFit: "cover", borderRadius: 2 }} /></div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{localTime(m.kickoff_at)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dayMatches.map(m => {
            const matchPreds = allPredictions.filter(p => p.match_id === m.id);
            // Pronóstico más popular (marcador más repetido)
            const scoreTally = {};
            matchPreds.forEach(p => {
              if (p.home_score == null || p.away_score == null) return;
              const k = `${p.home_score}-${p.away_score}`;
              scoreTally[k] = (scoreTally[k] || 0) + 1;
            });
            let topScore = null, topCount = 0;
            Object.entries(scoreTally).forEach(([k, c]) => { if (c > topCount) { topScore = k; topCount = c; } });
            const hasResult = m.home_score !== null && m.away_score !== null;
            const isOpen = expanded[m.id];
            const matchWildcardUsers = new Set(wildcards.filter(w => w.match_id === m.id).map(w => w.user_id));
            const sortedProfiles = [...visibleProfiles].sort((a, b) => {
              const pa = matchPreds.find(p => p.user_id === a.id);
              const pb = matchPreds.find(p => p.user_id === b.id);
              if (!pa && !pb) return 0;
              if (!pa) return 1;
              if (!pb) return -1;
              if (hasResult) {
                // Partido terminado: 1º los que sumaron (desc), 2º comodines fallados (-1), 3º los que fallaron (0)
                const ra = (pa.points || 0) > 0 ? 1 : (pa.points || 0) < 0 ? 2 : 3;
                const rb = (pb.points || 0) > 0 ? 1 : (pb.points || 0) < 0 ? 2 : 3;
                if (ra !== rb) return ra - rb;
                return (pb.points || 0) - (pa.points || 0);
              }
              // Partido sin terminar: agrupar por resultado pronosticado (local desc, visitante asc)
              if (pb.home_score !== pa.home_score) return pb.home_score - pa.home_score;
              if (pa.away_score !== pb.away_score) return pa.away_score - pb.away_score;
              return 0;
            });
            const iPredicted = matchPreds.some(p => p.user_id === user.id);
            const canSee = iPredicted || matchPreds.length > 0;
            return (
              <div key={m.id} id={"cmp-" + m.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div onClick={() => toggleExpand(m.id)} style={{ padding: "12px 16px", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="group-badge">{m.group_name ? `Grupo ${m.group_name}` : m.phase}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <img src={m.home_flag} alt={m.home} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />{m.home} <span style={{ color: "var(--muted)" }}>vs</span> {m.away}<img src={m.away_flag} alt={m.away} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasResult
                      ? <span style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "var(--gold)" }}>{m.home_score}–{m.away_score}</span>
                      : (topScore && topCount >= 2
                          ? <span style={{ fontSize: 11, color: "var(--gold)", whiteSpace: "nowrap" }} title="Pronóstico más popular">🔥 {topScore} <span style={{ color: "var(--muted)" }}>({topCount})</span></span>
                          : <span style={{ fontSize: 11, color: "var(--gold)" }}>⚽</span>)}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{matchPreds.length} pred.</span>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
                {hasResult && !isOpen && (
                  <div onClick={e => e.stopPropagation()} style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(getReactionCounts(m.id)).map(([emoji, count]) => {
                      const mine = (reactions[m.id] || []).find(r => r.user_id === user.id && r.emoji === emoji);
                      const reactors = (reactions[m.id] || []).filter(r => r.emoji === emoji).map(r => profileMap[r.user_id]?.name || "?");
                      return (
                        <div key={emoji} style={{ position: "relative" }} className="reaction-wrap">
                          <button onClick={() => setReaction(m.id, emoji)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid", borderColor: mine ? "var(--gold)" : "var(--border)", background: mine ? "var(--gold-dim)" : "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", gap: 4 }}>
                            {emoji} <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span>
                          </button>
                          <div className="reaction-tooltip">{reactors.join(", ")}</div>
                        </div>
                      );
                    })}
                    {emojiPicker === m.id ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {["😂","🔥","😱","🎉","😤","🤯","👏","💀","🥶","😭","🤩","😴"].map(e => (
                          <button key={e} onClick={() => setReaction(m.id, e)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "2px" }}>{e}</button>
                        ))}
                        <button onClick={() => setEmojiPicker(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 20, color: "var(--muted)", fontSize: 11, cursor: "pointer", padding: "2px 8px" }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setEmojiPicker(m.id)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)" }}>+ 😊</button>
                    )}
                  </div>
                )}
                {isOpen && (<>
                  {canSee ? (<>
                  {sortedProfiles.map((prof, idx) => {
                    const pred = matchPreds.find(p => p.user_id === prof.id);
                    const isMe = prof.id === user.id;
                    return (
                      <div key={prof.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: idx < sortedProfiles.length - 1 ? "1px solid var(--border)" : "none", background: isMe ? "rgba(245,183,49,.04)" : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar profile={prof} size="sm" /><div style={{ display: "flex", flexDirection: "column", gap: 2 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><ChampionName profile={prof} name={prof.name} style={{fontSize:13}}/><TitleBadges profile={prof} size={12}/>{isMe && <span className="me-badge">TÚ</span>}</div>{matchWildcardUsers.has(prof.id) && <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>Comodín activado 🃏</span>}</div></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {pred ? (<>{resultIcon(pred, m)}<span style={{ fontFamily: "Bebas Neue", fontSize: 18 }}>{pred.home_score}–{pred.away_score}</span>{pred.points != null && pred.points !== 0 && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: pred.points > 0 ? "var(--green-dim)" : "rgba(220,60,60,.18)", color: pred.points > 0 ? "var(--green)" : "#ff8080" }}>{pred.points > 0 ? "+" : ""}{pred.points}</span>}</>) : <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin pred.</span>}
                        </div>
                      </div>
                    );
                  })}
                  {hasResult && <div style={{ padding: "6px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}><span><span style={{ color: "var(--gold)" }}>★</span> Exacto</span><span><span style={{ color: "var(--green)" }}>✓</span> Correcto</span><span><span style={{ color: "var(--red)" }}>✗</span> Falló</span></div>}
                  </>) : (
                    <div style={{ padding: "18px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>🙈 No cargaste tu pronóstico para este partido,<br/>así que no podés ver los de los demás.</div>
                  )}
                  {hasResult && (
                    <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(getReactionCounts(m.id)).map(([emoji, count]) => {
                        const mine = (reactions[m.id] || []).find(r => r.user_id === user.id && r.emoji === emoji);
                        const reactors = (reactions[m.id] || []).filter(r => r.emoji === emoji).map(r => profileMap[r.user_id]?.name || "?");
                        return (
                          <div key={emoji} style={{ position: "relative" }} className="reaction-wrap">
                            <button onClick={() => setReaction(m.id, emoji)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid", borderColor: mine ? "var(--gold)" : "var(--border)", background: mine ? "var(--gold-dim)" : "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", gap: 4 }}>
                              {emoji} <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span>
                            </button>
                            <div className="reaction-tooltip">{reactors.join(", ")}</div>
                          </div>
                        );
                      })}
                      {emojiPicker === m.id ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          {["😂","🔥","😱","🎉","😤","🤯","👏","💀","🥶","😭","🤩","😴"].map(e => (
                            <button key={e} onClick={() => setReaction(m.id, e)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "2px" }}>{e}</button>
                          ))}
                          <button onClick={() => setEmojiPicker(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 20, color: "var(--muted)", fontSize: 11, cursor: "pointer", padding: "2px 8px" }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setEmojiPicker(m.id)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)" }}>+ 😊</button>
                      )}
                    </div>
                  )}
                </>)}
              </div>
            );
          })}
        </div>
      )}
    </>)}
    </>)}
    {view === "pretorneo" && <PreTournamentCompare user={user} profiles={visibleProfiles} />}
  </>);
}

// ── Debtor Admin ──────────────────────────────────────────────────────────────
function DebtorAdmin({ profiles, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState("");
  const [since, setSince] = useState("");
  const [saving, setSaving] = useState(null);
  const [editingDif, setEditingDif] = useState(null);
  const [epitaph, setEpitaph] = useState("");
  const [intervalSecs, setIntervalSecs] = useState(120);
  const [savingInterval, setSavingInterval] = useState(false);
  const [intervalSaved, setIntervalSaved] = useState(false);
  const [secOpen, setSecOpen] = useState(false);

  useEffect(() => {
    sb.from("scoring_rules").select("rule_value").eq("rule_key", "debtor_video_interval").single()
      .then(({ data }) => { if (data) setIntervalSecs(data.rule_value); });
  }, []);

  async function saveInterval() {
    setSavingInterval(true);
    await sb.from("scoring_rules").upsert(
      { rule_key: "debtor_video_interval", rule_value: parseInt(intervalSecs) || 120, description: 'Intervalo entre videos de morosos (segundos)' },
      { onConflict: "rule_key" }
    );
    setSavingInterval(false);
    setIntervalSaved(true);
    setTimeout(() => setIntervalSaved(false), 2000);
  }

  async function toggleEliminated(prof) {
  setSaving(prof.id);
  await sb.from("profiles").update({ 
    is_eliminated: !prof.is_eliminated,
    is_debtor: !prof.is_eliminated ? true : prof.is_debtor,
  }).eq("id", prof.id);
  setSaving(null);
  onRefresh();
}

  async function toggleDebtor(prof) {
    setSaving(prof.id);
    if (prof.is_debtor) {
      await sb.from("profiles").update({ is_debtor: false, debt_amount: 0, debt_since: null }).eq("id", prof.id);
    } else {
      setEditing(prof.id);
      setAmount("");
      setSince(new Date().toISOString().slice(0, 10));
      setSaving(null);
      return;
    }
    setSaving(null);
    onRefresh();
  }

  async function saveDebtor(profId) {
    setSaving(profId);
    await sb.from("profiles").update({
      is_debtor: true,
      debt_amount: parseFloat(amount) || 0,
      debt_since: since || new Date().toISOString().slice(0, 10),
    }).eq("id", profId);
    setEditing(null);
    setSaving(null);
    onRefresh();
  }

  const debtors = profiles.filter(p => p.is_debtor);
  const difuntos = profiles.filter(p => p.is_difunto);

  async function toggleDifunto(prof) {
    if (prof.is_difunto) {
      setSaving(prof.id);
      await sb.from("profiles").update({ is_difunto: false, difunto_since: null }).eq("id", prof.id);
      setSaving(null);
      onRefresh();
    } else {
      setEditingDif(prof.id);
      setEpitaph(prof.epitafio || "");
    }
  }
  async function saveDifunto(profId) {
    setSaving(profId);
    await sb.from("profiles").update({
      is_difunto: true,
      difunto_since: new Date().toISOString(),
      epitafio: epitaph.trim() || null,
    }).eq("id", profId);
    setEditingDif(null);
    setSaving(null);
    onRefresh();
  }

  return (
    <div className="admin-section">
      <div className="admin-section-hdr" style={{ flexWrap: "wrap", gap: 8, cursor: "pointer" }} onClick={()=>setSecOpen(o=>!o)}>
        <h3>💸 MOROSOS {secOpen?"▴":"▾"}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }} onClick={e=>e.stopPropagation()}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>📺 Video cada</span>
          <input
            type="number" min="10" max="3600" value={intervalSecs}
            onChange={e => setIntervalSecs(e.target.value)}
            style={{ width: 52, padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--gold)", fontFamily: "Bebas Neue", fontSize: 18, textAlign: "center", outline: "none" }}
          />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>seg</span>
          <button className="btn-small" onClick={saveInterval} disabled={savingInterval}
            style={{ fontSize: 11, padding: "4px 10px" }}>
            {intervalSaved ? "✓" : savingInterval ? "..." : "Guardar"}
          </button>
          <span style={{ fontSize: 12, color: "var(--red)" }}>{debtors.length} en deuda</span>
          {difuntos.length > 0 && <span style={{ fontSize: 12, color: "#a78bfa" }}>🪦 {difuntos.length}</span>}
        </div>
      </div>
      {secOpen && <div className="admin-section-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {profiles.map(prof => {
            const isDebtor = prof.is_debtor;
            const isEditing = editing === prof.id;
            const days = prof.debt_since
              ? Math.floor((new Date() - new Date(prof.debt_since)) / 86400000)
              : 0;
            return (
              <div key={prof.id} style={{
                background: isDebtor ? "rgba(255,77,109,.05)" : "var(--surface)",
                border: `1px solid ${isDebtor ? "rgba(255,77,109,.3)" : "var(--border)"}`,
                borderRadius: 8, overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar sm" style={{ background: isDebtor ? "linear-gradient(135deg,var(--red),#c0001a)" : undefined }}>
                      {initials(prof.name)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{prof.name}</span>
                        {isDebtor && <DebtorBadge profile={prof} />}
                      </div>
                      {isDebtor && <DebtorCounter profile={prof} />}
                    </div>
                  </div>
                 <div style={{display:"flex",gap:6}}>
  <button
    className={`btn-small ${isDebtor ? "" : "red"}`}
    onClick={() => toggleDebtor(prof)}
    disabled={saving === prof.id}
    style={isDebtor ? { background: "var(--green-dim)", borderColor: "var(--green)", color: "var(--green)" } : {}}
  >
    {saving === prof.id ? "..." : isDebtor ? "✓ Perdonar deuda" : "💸 Marcar moroso"}
  </button>
  <button
    className="btn-small red"
    onClick={() => toggleEliminated(prof)}
    disabled={saving === prof.id}
    style={prof.is_eliminated ? { background: "var(--red)", color: "#fff" } : {}}
  >
    {prof.is_eliminated ? "💀 Reintegrar" : "💀 Eliminar"}
  </button>
  <button
    className="btn-small"
    onClick={() => toggleDifunto(prof)}
    disabled={saving === prof.id}
    style={prof.is_difunto ? { background: "#3b2f5e", borderColor: "#6d28d9", color: "#c4b5fd" } : { borderColor: "#6d28d9", color: "#a78bfa" }}
  >
    {prof.is_difunto ? "🪦 Revivir" : "🪦 Difunto"}
  </button>
</div>
                </div>
                {isEditing && (
                  <div style={{ padding: "0 14px 14px", display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>MONTO ($)</div>
                      <input
                        type="number" value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00" style={{ width: "100%", padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>DESDE</div>
                      <input
                        type="date" value={since} onChange={e => setSince(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}
                      />
                    </div>
                    <button className="btn-small red" onClick={() => saveDebtor(prof.id)} disabled={saving === prof.id}>
                      {saving === prof.id ? "..." : "Confirmar"}
                    </button>
                    <button className="btn-small" onClick={() => setEditing(null)} style={{ background: "none" }}>Cancelar</button>
                  </div>
                )}
                {editingDif === prof.id && (
                  <div style={{ padding: "0 14px 14px", display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>🪦 EPITAFIO (opcional)</div>
                      <input value={epitaph} onChange={e => setEpitaph(e.target.value)} placeholder='Ej: "Abandonó el grupo antes que el Mundial"' style={{ width: "100%", padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }} />
                    </div>
                    <button className="btn-small" onClick={() => saveDifunto(prof.id)} disabled={saving === prof.id} style={{ background: "#3b2f5e", borderColor: "#6d28d9", color: "#c4b5fd" }}>{saving === prof.id ? "..." : "🪦 Enterrar"}</button>
                    <button className="btn-small" onClick={() => setEditingDif(null)} style={{ background: "none" }}>Cancelar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>}
    </div>
  );
}

// ── Titles Admin ─────────────────────────────────────────────────────────────
const TOURNAMENTS = ["Qatar 2022", "Copa América & Euro 2024", "Champions 2024", "Mundial de Clubes 2025", "Primer Campeón"];

function CronistaPerfilesAdmin({ profiles, onRefresh }) {
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    profiles.forEach(p => { d[p.id] = p.cronista_perfil || ""; });
    return d;
  });
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [secOpen, setSecOpen] = useState(false);

  async function savePerfil(userId) {
    setSavingId(userId);
    await sb.from("profiles").update({ cronista_perfil: drafts[userId] || null }).eq("id", userId);
    setSavingId(null);
    setSavedId(userId);
    setTimeout(() => setSavedId(null), 1500);
    onRefresh && onRefresh();
  }

  return (
    <div className="admin-section" style={{marginTop:20}}>
      <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>setSecOpen(o=>!o)}><h3>🎭 PERFILES DEL CRONISTA {secOpen?"▴":"▾"}</h3><span style={{fontSize:12,color:"var(--muted)"}}>munición secreta</span></div>
      {secOpen && <div className="admin-section-body">
        <div style={{fontSize:12,color:"var(--muted)",marginBottom:12,lineHeight:1.5}}>
          Datos jugosos de cada jugador para que el Cronista los cargue con onda (apodo, equipo, laburo, personalidad, anécdotas, rivalidades). <strong>No se muestran en la app</strong>, son solo para las crónicas. Cuanto más específico, más filosa la cargada.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {profiles.map(prof => {
            const isOpen = openId === prof.id;
            const tienePerfil = (prof.cronista_perfil || "").trim().length > 0;
            return (
              <div key={prof.id} style={{background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",overflow:"hidden"}}>
                <div onClick={()=>setOpenId(isOpen?null:prof.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar profile={prof} size="sm" />
                    <span style={{fontSize:14,fontWeight:500}}>{prof.name}</span>
                    {tienePerfil
                      ? <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"var(--green-dim)",color:"var(--green)"}}>✓ perfil</span>
                      : <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"var(--border)",color:"var(--muted)"}}>sin perfil</span>}
                  </div>
                  <span style={{color:"var(--muted)",fontSize:13}}>{isOpen?"▴":"▾"}</span>
                </div>
                {isOpen && (
                  <div style={{padding:"0 14px 12px"}}>
                    <textarea
                      value={drafts[prof.id] || ""}
                      onChange={e=>setDrafts(d=>({...d,[prof.id]:e.target.value}))}
                      placeholder={'Ej: Le dicen "El Bocina". Taxista, fanático de Boca. Se la pasa explicando fútbol pero nunca acierta. Agrandado. Rival del Hipster.'}
                      rows={4}
                      style={{width:"100%",padding:"10px 12px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--txt)",fontSize:13,resize:"vertical",fontFamily:"inherit",outline:"none",marginBottom:8}}
                    />
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <button className="btn-small" onClick={()=>savePerfil(prof.id)} disabled={savingId===prof.id}>
                        {savingId===prof.id?"...":savedId===prof.id?"✓ Guardado":"Guardar perfil"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>}
    </div>
  );
}

function TitlesAdmin({ profiles, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [tournament, setTournament] = useState(TOURNAMENTS[0]);
  const [position, setPosition] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [secOpen, setSecOpen] = useState(false);

  async function addTitle() {
    if (!selectedUser) return;
    setSaving(true); setMsg(null);
    const prof = profiles.find(p => p.id === selectedUser);
    const current = prof?.titles || [];
    const updated = [...current, { tournament, position: parseInt(position) }];
    await sb.from("profiles").update({ titles: updated }).eq("id", selectedUser);
    setMsg({ type: "ok", text: `✅ Título agregado a ${prof.name}` });
    setSaving(false);
    onRefresh();
    setTimeout(() => setMsg(null), 3000);
  }

  async function removeTitle(userId, index) {
    const prof = profiles.find(p => p.id === userId);
    const updated = (prof?.titles || []).filter((_, i) => i !== index);
    await sb.from("profiles").update({ titles: updated }).eq("id", userId);
    onRefresh();
  }

  const titledProfiles = profiles.filter(p => p.titles?.length > 0);

  return (
    <div className="admin-section">
      <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>setSecOpen(o=>!o)}><h3>🏆 TÍTULOS ANTERIORES {secOpen?"▴":"▾"}</h3></div>
      {secOpen && <div className="admin-section-body">
        {/* Agregar título */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, marginBottom: 16, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>JUGADOR</div>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}>
              <option value="">— Seleccionar —</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>TORNEO</div>
            <select value={tournament} onChange={e => setTournament(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}>
              {TOURNAMENTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>POSICIÓN</div>
            <select value={position} onChange={e => setPosition(e.target.value)}
              style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }}>
              <option value={1}>👑 1ro</option>
              <option value={2}>🥈 2do</option>
            </select>
          </div>
          <button className="btn-small" onClick={addTitle} disabled={saving || !selectedUser}
            style={{ background: "var(--gold-dim)", borderColor: "var(--gold)", color: "var(--gold)" }}>
            {saving ? "..." : "+ Agregar"}
          </button>
        </div>
        {msg && <div style={{ fontSize: 12, color: "var(--green)", marginBottom: 12 }}>{msg.text}</div>}

        {/* Lista de títulos actuales */}
        {titledProfiles.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Ningún jugador tiene títulos asignados aún.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {titledProfiles.map(prof => (
              <div key={prof.id} style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Avatar profile={prof} size="sm" />
                  <ChampionName profile={prof} name={prof.name} style={{ fontSize: 14, fontWeight: 600 }} />
                  <TitleBadges profile={prof} size={14} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(prof.titles || []).map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "var(--card)", borderRadius: 6 }}>
                      <span style={{ fontSize: 12 }}>
                        {t.position === 1 ? "👑" : "🥈"} <span style={{ color: t.position === 1 ? "var(--gold)" : "#b0bcd0" }}>{t.position === 1 ? "Campeón" : "Subcampeón"}</span>
                        <span style={{ color: "var(--muted)", marginLeft: 6 }}>{t.tournament}</span>
                      </span>
                      <button onClick={() => removeTitle(prof.id, i)}
                        style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ matches, profiles, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState({});
  const [savedMatch, setSavedMatch] = useState({});
  const [resultError, setResultError] = useState({});
  const [rules, setRules] = useState([]);
  const [ruleVals, setRuleVals] = useState({});
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);
  const [invites, setInvites] = useState([]);
  const [newCode, setNewCode] = useState("");
  const [editMatch, setEditMatch] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [savingAdmin, setSavingAdmin] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(null);
  const [showMatches, setShowMatches] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [groupResults, setGroupResults] = useState({});
  const [apPlayer, setApPlayer] = useState("");
  const [apPreds, setApPreds] = useState({});
  const [apSaving, setApSaving] = useState({});
  const [apSaved, setApSaved] = useState({});
  const [optim, setOptim] = useState(false);
  const [optProg, setOptProg] = useState({ done: 0, total: 0 });
  const [optMsg, setOptMsg] = useState("");
  async function optimizarImagenes() {
    const conFoto = (profiles || []).filter(p => p.cromo_foto || p.avatar_url);
    const { data: nftList } = await sb.from("nfts").select("id, imagen_url");
    const cartas = (nftList || []).filter(n => n.imagen_url);
    const total = cartas.length + conFoto.length;
    if (total === 0) { setOptMsg("No hay imágenes para optimizar."); return; }
    setOptim(true); setOptMsg(""); setOptProg({ done: 0, total });
    let done = 0;

    // 1) Cartas NFT (las más pesadas)
    for (const n of cartas) {
      setOptProg({ done, total });
      try {
        const r = await fetch(n.imagen_url, { cache: "no-store" });
        if (r.ok) {
          const blob = await compressImg(await r.blob(), 600, 0.82);
          const path = `nfts/opt-${n.id}-${Date.now()}.jpg`;
          const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
          if (!up.error) {
            const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
            await sb.from("nfts").update({ imagen_url: pub.publicUrl }).eq("id", n.id);
          }
        }
      } catch (e) {}
      done++;
    }

    // 2) Avatares y cromos de cada participante
    for (const p of conFoto) {
      setOptProg({ done, total });
      if (p.avatar_url) {
        try {
          const r = await fetch(p.avatar_url, { cache: "no-store" });
          if (r.ok) {
            const blob = await compressImg(await r.blob(), 400, 0.82);
            const path = `${p.id}-${Date.now()}.jpg`;
            const up = await sb.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
            if (!up.error) {
              const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
              await sb.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", p.id);
            }
          }
        } catch (e) {}
      }
      if (p.cromo_foto) {
        try {
          const r = await fetch(p.cromo_foto, { cache: "no-store" });
          if (r.ok) {
            const blob = await compressImg(await r.blob(), 512, 0.82);
            const path = `cromos/opt-${p.id}-${Date.now()}.jpg`;
            const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
            if (!up.error) {
              const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
              await sb.rpc("set_cromo_foto", { p_user_id: p.id, p_url: pub.publicUrl });
            }
          }
        } catch (e) {}
      }
      done++;
    }

    setOptProg({ done: total, total });
    setOptim(false);
    setOptMsg(`Listo: ${cartas.length} cartas + ${conFoto.length} participantes optimizados.`);
    if (onRefresh) await onRefresh();
  }

  const [limpiando, setLimpiando] = useState(false);
  const [limpMsg, setLimpMsg] = useState("");
  async function limpiarImagenesViejas() {
    setLimpiando(true); setLimpMsg("");
    try {
      const { data: files, error: le } = await sb.storage.from("tienda").list("nfts", { limit: 2000 });
      if (le) throw le;
      const { data: nftRows, error: ne } = await sb.from("nfts").select("imagen_url");
      if (ne) throw ne;
      // Red de seguridad: si no pude leer las cartas, no borro nada
      if (!nftRows || nftRows.length === 0) { setLimpMsg("No pude leer las cartas; cancelado por seguridad."); setLimpiando(false); return; }
      const enUso = new Set(nftRows.map(n => n.imagen_url).filter(Boolean));
      const aBorrar = [];
      for (const f of (files || [])) {
        if (!f.name || f.id === null) continue;
        const path = "nfts/" + f.name;
        const url = sb.storage.from("tienda").getPublicUrl(path).data.publicUrl;
        if (!enUso.has(url)) aBorrar.push(path);
      }
      if (aBorrar.length === 0) { setLimpMsg("No hay imágenes viejas para borrar. Todo limpio."); setLimpiando(false); return; }
      let borradas = 0;
      for (let i = 0; i < aBorrar.length; i += 50) {
        const chunk = aBorrar.slice(i, i + 50);
        const { error } = await sb.storage.from("tienda").remove(chunk);
        if (!error) borradas += chunk.length;
      }
      setLimpMsg(`Listo: ${borradas} imágenes viejas borradas.`);
    } catch (e) {
      setLimpMsg("Error: " + (e.message || e));
    }
    setLimpiando(false);
  }
  async function loadPlayerPreds(uid) {
    setApSaved({}); setApPreds({});
    const { data } = await sb.from("predictions").select("match_id, home_score, away_score").eq("user_id", uid);
    const map = {};
    (data || []).forEach(p => { map[p.match_id] = { home: p.home_score, away: p.away_score }; });
    setApPreds(map);
  }
  async function savePlayerPred(m) {
    const v = apPreds[m.id] || {};
    if (v.home === undefined || v.away === undefined || v.home === "" || v.away === "") return;
    setApSaving(s => ({ ...s, [m.id]: true }));
    const { data, error } = await sb.rpc("admin_guardar_pred", { p_user: apPlayer, p_match: m.id, p_home: parseInt(v.home), p_away: parseInt(v.away) });
    setApSaving(s => ({ ...s, [m.id]: false }));
    if (error || !data || !data.ok) { alert((data && data.error) || (error && error.message) || "No se pudo guardar."); return; }
    setApSaved(s => ({ ...s, [m.id]: true }));
    if (onRefresh) onRefresh();
  }
  const [savingGroupResults, setSavingGroupResults] = useState(false);
  const [groupResultsMsg, setGroupResultsMsg] = useState(null);
  const [calculatingPts, setCalculatingPts] = useState(false);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [openSec, setOpenSec] = useState(null);
  const toggleSec = (k) => setOpenSec(prev => prev === k ? null : k);
  const [healthPreds, setHealthPreds] = useState([]);

  async function takeSnapshot() {
    setTakingSnapshot(true);
    const today = new Date().toISOString().slice(0,10);
    const preds = await fetchAllPredictions();
    const { data: prePreds } = await sb.from("pretournament_predictions").select("*");
    const { data: profs } = await sb.from("profiles").select("*");
    const rows = (profs||[]).map(p => {
      const matchPts = (preds||[]).filter(pr => pr.user_id===p.id).reduce((s,pr)=>s+(pr.points||0),0);
      const prePts = (prePreds||[]).filter(pr => pr.user_id===p.id).reduce((s,pr)=>s+(pr.points||0),0);
      return { user_id: p.id, points: matchPts+prePts };
    }).sort((a,b)=>b.points-a.points);
    for (let i=0; i<rows.length; i++) {
      await sb.from("ranking_snapshots").upsert(
        { snapshot_date: today, user_id: rows[i].user_id, points: rows[i].points, position: i+1 },
        { onConflict: "snapshot_date,user_id" }
      );
    }
    setTakingSnapshot(false);
  }

  async function syncScores() {
    setSyncing(true); setSyncMsg(null);
    try {
      const { data: apiData, error: syncErr } = await sb.functions.invoke("sync-matches");
      if (syncErr || !apiData || !apiData.matches) { setSyncMsg({ type: "err", text: "No se pudo conectar con la API" }); setSyncing(false); return; }

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
      const FLAGS = {
        "Mexico":"mx","South Africa":"za","South Korea":"kr","Czechia":"cz","Canada":"ca",
        "Bosnia and Herzegovina":"ba","Qatar":"qa","Switzerland":"ch","Brazil":"br","Morocco":"ma",
        "Haiti":"ht","Scotland":"gb-sct","USA":"us","United States":"us","Paraguay":"py",
        "Australia":"au","Turkey":"tr","Türkiye":"tr","Germany":"de","Curaçao":"cw",
        "Ivory Coast":"ci","Ecuador":"ec","Netherlands":"nl","Japan":"jp","Sweden":"se",
        "Tunisia":"tn","Belgium":"be","Egypt":"eg","Iran":"ir","New Zealand":"nz",
        "Spain":"es","Cape Verde":"cv","Saudi Arabia":"sa","Uruguay":"uy","France":"fr",
        "Senegal":"sn","Iraq":"iq","Norway":"no","Argentina":"ar","Algeria":"dz",
        "Austria":"at","Jordan":"jo","Portugal":"pt","DR Congo":"cd","Uzbekistan":"uz",
        "Colombia":"co","England":"gb-eng","Croatia":"hr","Ghana":"gh","Panama":"pa",
      };
      const PHASE_MAP = {"GROUP_STAGE":"Grupos","LAST_32":"Octavos","LAST_16":"Cuartos","QUARTER_FINALS":"Cuartos","SEMI_FINALS":"Semifinal","THIRD_PLACE":"3er Lugar","FINAL":"Final"};
      const tName = n => NAMES_ES[n] || n;
      const tFlag = n => FLAGS[n] ? `https://flagcdn.com/24x18/${FLAGS[n]}.png` : "";

      const { data: dbMatches } = await sb.from("matches").select("*");
      const { data: rules } = await sb.from("scoring_rules").select("*");
      const ruleMap = {};
      (rules||[]).forEach(r => { ruleMap[r.rule_key] = r.rule_value; });

      let updated = 0;

      for (const m of apiData.matches) {
        if (m.status !== "FINISHED") continue;
        const homeName = m.homeTeam?.name;
        const awayName = m.awayTeam?.name;
        if (!homeName || !awayName) continue;
        const homeScore = m.score?.fullTime?.home;
        const awayScore = m.score?.fullTime?.away;
        if (homeScore === null || homeScore === undefined) continue;
        const phase = PHASE_MAP[m.stage] || "Grupos";

        const existing = (dbMatches||[]).find(db =>
          db.home === tName(homeName) && db.away === tName(awayName)
        );
        if (!existing || existing.status === "finished") continue;

        await sb.from("matches").update({
          home_score: homeScore, away_score: awayScore, status: "finished",
          home_flag: tFlag(homeName), away_flag: tFlag(awayName),
        }).eq("id", existing.id);

        const isKnockout = phase !== "Grupos";
        const exactPts = isKnockout ? (ruleMap["exact_score_knockout"]||3) : (ruleMap["exact_score_groups"]||3);
        const resultPts = isKnockout ? (ruleMap["correct_result_knockout"]||1) : (ruleMap["correct_result_groups"]||1);
        const goalsPts = isKnockout ? (ruleMap["correct_goals_knockout"]||2) : (ruleMap["correct_goals_groups"]||1);
        const wcExact = ruleMap["wildcard_exact"]||8;
        const wcGoals = ruleMap["wildcard_goals"]||5;
        const wcWinner = ruleMap["wildcard_winner"]||2;
        const wcCost = ruleMap["wildcard_cost"]||1;
        const realResult = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";
        const realTotalGoals = homeScore + awayScore;

        const { data: preds } = await sb.from("predictions").select("*").eq("match_id", existing.id);
        const { data: matchWildcards } = await sb.from("wildcards").select("*").eq("match_id", existing.id);
        const wildcardUserIds = new Set((matchWildcards||[]).map(w => w.user_id));
        for (const pred of (preds||[])) {
          const hasWildcard = wildcardUserIds.has(pred.user_id);
          let pts = 0;
          const isExact = pred.home_score === homeScore && pred.away_score === awayScore;
          const predResult = pred.home_score > pred.away_score ? "home" : pred.away_score > pred.home_score ? "away" : "draw";
          const isCorrectResult = predResult === realResult;
          const isCorrectGoals = (pred.home_score + pred.away_score) === realTotalGoals;
          if (hasWildcard) {
            let base = 0;
            if (isExact) base = wcExact;
            else if (isCorrectResult) base = wcWinner;
            else if (isCorrectGoals) base = wcGoals;
            pts = base - wcCost;
          } else {
            if (isExact) pts = exactPts;
            else if (isCorrectResult) pts = resultPts;
            else if (isCorrectGoals) pts = goalsPts;
          }
          await sb.from("predictions").update({ points: pts }).eq("id", pred.id);
        }
        updated++;
      }

      const msg = updated > 0
        ? `✅ ${updated} partido${updated !== 1 ? "s" : ""} actualizado${updated !== 1 ? "s" : ""}`
        : "✅ Todo al día, sin cambios";
      setSyncMsg({ type: "ok", text: msg });
      onRefresh();
    } catch (e) {
      setSyncMsg({ type: "err", text: "Error: " + e.message });
    }
    setSyncing(false);
  }

  async function toggleAdmin(userId, isCurrentlyAdmin) {
    setSavingAdmin(userId);
    if (isCurrentlyAdmin) { await sb.from("admins").delete().eq("user_id", userId); }
    else { await sb.from("admins").insert({ user_id: userId }); }
    const { data } = await sb.from("admins").select("*");
    if (data) setAdminList(data.map(a => a.user_id));
    setSavingAdmin(null);
  }

  async function saveEditName(userId) {
    if (!editName.trim()) return;
    setSavingName(userId);
    await sb.from("profiles").update({ name: editName.trim() }).eq("id", userId);
    setSavingName(null); setEditingUser(null); onRefresh();
  }

  async function deleteUser(userId) {
    setDeletingUser(userId);
    await sb.rpc("delete_user", { target_user_id: userId });
    setConfirmDelete(null); setDeletingUser(null); onRefresh();
  }

  useEffect(() => {
    sb.from("admins").select("*").then(({ data }) => { if (data) setAdminList(data.map(a => a.user_id)); });
    sb.from("scoring_rules").select("*").then(({ data }) => {
      if (data) { setRules(data); const v={}; data.forEach(r=>{v[r.rule_key]=r.rule_value;}); setRuleVals(v); }
    });
    sb.from("invite_codes").select("*").then(({ data }) => { if (data) setInvites(data); });
    sb.from("group_results").select("*").then(({ data }) => {
      if (data) {
        const gr = {};
        data.forEach(r => { if (!gr[r.group_name]) gr[r.group_name] = {}; gr[r.group_name][r.position] = r.team; });
        setGroupResults(gr);
      }
    });
    fetchAllPredictions("user_id, match_id").then((data) => setHealthPreds(data || []));
  }, []);

  async function saveGroupResults() {
    setSavingGroupResults(true); setGroupResultsMsg(null);
    for (const group of Object.keys(groupResults)) {
      for (const pos of [1, 2, 3]) {
        const team = groupResults[group]?.[pos];
        if (!team) continue;
        await sb.from("group_results").upsert({ group_name: group, position: pos, team }, { onConflict: "group_name,position" });
      }
    }
    setSavingGroupResults(false);
    setGroupResultsMsg({ type: "ok", text: "✅ Resultados guardados" });
    setTimeout(() => setGroupResultsMsg(null), 2000);
  }

  async function calculatePreTournamentPoints() {
    setCalculatingPts(true); setGroupResultsMsg(null);

    // 1) Guardar primero lo cargado en pantalla
    let saveErr = null;
    for (const group of Object.keys(groupResults)) {
      for (const pos of [1, 2, 3]) {
        const team = groupResults[group]?.[pos];
        if (!team) continue;
        const { error } = await sb.from("group_results").upsert({ group_name: group, position: pos, team }, { onConflict: "group_name,position" });
        if (error) saveErr = error;
      }
    }
    if (saveErr) {
      setCalculatingPts(false);
      setGroupResultsMsg({ type: "error", text: `❌ No se pudieron guardar los resultados: ${saveErr.message}` });
      return;
    }

    // 2) Calcular en el servidor (bypassa RLS y actualiza a TODOS los jugadores)
    const { data, error } = await sb.rpc("calcular_clasificados");
    setCalculatingPts(false);
    if (error || !data || !data.ok) {
      setGroupResultsMsg({ type: "error", text: (data && data.error) || (error && error.message) || "No se pudo calcular." });
      return;
    }
    if ((data.aciertos || 0) === 0) {
      setGroupResultsMsg({ type: "error", text: "Calculado, pero 0 aciertos. Revisá que cargaste los resultados correctos y que los jugadores ya hicieron sus predicciones." });
    } else {
      setGroupResultsMsg({ type: "ok", text: `✅ ${data.aciertos} aciertos · +${data.total} pts repartidos entre ${data.jugadores} jugador${data.jugadores === 1 ? "" : "es"}` });
    }
    if (onRefresh) onRefresh();
    setTimeout(() => setGroupResultsMsg(null), 6000);
  }

  async function saveResult(match) {
    const r = results[match.id] || {};
    if (r.home===undefined||r.away===undefined||r.home===""||r.away==="") return;
    setSaving(s=>({...s,[match.id]:true}));
    setResultError(e=>({...e,[match.id]:null}));
    const homeScore=parseInt(r.home), awayScore=parseInt(r.away);
    const { error: matchErr } = await sb.from("matches").update({home_score:homeScore,away_score:awayScore,status:"finished"}).eq("id",match.id);
    if (matchErr) {
      setResultError(e=>({...e,[match.id]:`❌ No se guardó el resultado: ${matchErr.message}`}));
      setSaving(s=>({...s,[match.id]:false}));
      return;
    }
    // Calcular puntos del lado del servidor (comodín, costo y orden exacto>ganador>goles)
    const { error: rpcErr } = await sb.rpc("recalc_match_points", { p_match_id: match.id });
    if (rpcErr) {
      setResultError(e=>({...e,[match.id]:`⚠️ Resultado guardado pero FALLÓ el cálculo de puntos: ${rpcErr.message}. Tocá "Actualizar" para reintentar.`}));
      setSaving(s=>({...s,[match.id]:false}));
      onRefresh();
      return;
    }
    const { data: preds } = await sb.from("predictions").select("*").eq("match_id", match.id);
    setSavedMatch(s=>({...s,[match.id]:true})); setSaving(s=>({...s,[match.id]:false})); onRefresh();
    sendPushNotification("all", null, { title: "⚽ Resultado cargado", body: `${match.home} ${homeScore}–${awayScore} ${match.away}`, tag: `result-${match.id}`, url: "/" });
    if (preds) {
      const winners = preds.filter(p => p.points > 0);
      for (const pred of winners) {
        sendPushNotification("users", [pred.user_id], { title: "🎉 ¡Ganaste puntos!", body: `${match.home} vs ${match.away} — +${pred.points} pts`, tag: `points-${match.id}-${pred.user_id}`, url: "/" });
      }
    }
  }

  async function saveRules() {
    setSavingRules(true);
    for (const key of Object.keys(ruleVals)) { await sb.from("scoring_rules").update({rule_value:parseInt(ruleVals[key])}).eq("rule_key",key); }
    setSavingRules(false); setRulesSaved(true); setTimeout(()=>setRulesSaved(false),2000);
  }

  async function addInvite() {
    if (!newCode.trim()) return;
    await sb.from("invite_codes").insert({code:newCode.trim().toLowerCase(),active:true});
    setNewCode(""); const {data}=await sb.from("invite_codes").select("*"); if(data) setInvites(data);
  }

  async function toggleInvite(code,active) {
    await sb.from("invite_codes").update({active:!active}).eq("code",code);
    const {data}=await sb.from("invite_codes").select("*"); if(data) setInvites(data);
  }

  async function saveEditMatch() {
    await sb.from("matches").update({home:editForm.home,away:editForm.away,home_flag:editForm.home_flag,away_flag:editForm.away_flag,match_date:editForm.match_date,match_time:editForm.match_time,kickoff_at:editForm.kickoff_at}).eq("id",editMatch.id);
    setEditMatch(null); onRefresh();
  }

  async function resetMatch(match) {
    if (!window.confirm("Resetear " + match.home + " vs " + match.away + "? Se borrarán el resultado y los puntos.")) return;
    await sb.from("matches").update({ home_score: null, away_score: null, status: "pending" }).eq("id", match.id);
    await sb.from("predictions").update({ points: null }).eq("match_id", match.id);
    onRefresh();
  }

  const filtered = filter==="all"?matches:filter==="finished"?matches.filter(m=>m.status==="finished"):matches.filter(m=>m.status!=="finished");
  const ruleLabels = {
    exact_score_groups:"Marcador exacto — Grupos",exact_score_knockout:"Marcador exacto — Eliminatorias",
    correct_result_groups:"Ganador — Grupos",correct_result_knockout:"Ganador — Eliminatorias",
    correct_goals_groups:"Goles totales correctos — Grupos",correct_goals_knockout:"Goles totales correctos — Eliminatorias",
    group_first:"1ro de grupo",group_second:"2do de grupo",third_place_qualifier:"3er clasificado",
    max_wildcards:"Máximo de comodines por torneo",wildcard_cost:"Costo del comodín (pts)",
    wildcard_exact:"Comodín: marcador exacto",wildcard_goals:"Comodín: goles totales correctos",wildcard_winner:"Comodín: ganador correcto",
  };

  return (
    <div className="admin-wrap">
      {editMatch && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✏️ EDITAR PARTIDO</h3>
            <div className="field"><label>Equipo Local</label><input value={editForm.home||""} onChange={e=>setEditForm(f=>({...f,home:e.target.value}))}/></div>
            <div className="field"><label>Bandera Local</label><input value={editForm.home_flag||""} onChange={e=>setEditForm(f=>({...f,home_flag:e.target.value}))}/></div>
            <div className="field"><label>Equipo Visitante</label><input value={editForm.away||""} onChange={e=>setEditForm(f=>({...f,away:e.target.value}))}/></div>
            <div className="field"><label>Bandera Visitante</label><input value={editForm.away_flag||""} onChange={e=>setEditForm(f=>({...f,away_flag:e.target.value}))}/></div>
            <div className="field"><label>Fecha</label><input value={editForm.match_date||""} onChange={e=>setEditForm(f=>({...f,match_date:e.target.value}))}/></div>
            <div className="field"><label>Hora</label><input value={editForm.match_time||""} onChange={e=>setEditForm(f=>({...f,match_time:e.target.value}))}/></div>
            <div className="field"><label>Kickoff UTC</label><input value={editForm.kickoff_at||""} onChange={e=>setEditForm(f=>({...f,kickoff_at:e.target.value}))}/></div>
            <div className="modal-btns"><button className="btn-cancel" onClick={()=>setEditMatch(null)}>Cancelar</button><button className="btn-confirm" onClick={saveEditMatch}>Guardar</button></div>
          </div>
        </div>
      )}

      <div className="sec-hdr" style={{justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12}}><h2>🔧 PANEL ADMIN</h2><span>Solo visible para administradores</span></div>
        <button className="btn-small" onClick={takeSnapshot} disabled={takingSnapshot} style={{background:"var(--blue)",borderColor:"var(--blue)",color:"#fff"}}>{takingSnapshot?"...":"📸 Snapshot"}</button>
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr" style={{flexWrap:"wrap",gap:8}}>
          <h3>⚽ RESULTADOS</h3>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button className="btn-small" onClick={()=>setShowMatches(s=>!s)}>{showMatches ? "▲ Contraer" : "▼ Ver partidos"}</button>
            <div style={{fontSize:12,color:"var(--muted)"}}>{matches.filter(m=>m.status==="finished").length}/{matches.length}</div>
          </div>
        </div>
        {showMatches && (
          <div className="admin-section-body">
            <div className="match-filter">
              {[["all","Todos"],["pending","Pendientes"],["finished","Finalizados"]].map(([k,l])=>(
                <button key={k} className={`filter-btn ${filter===k?"active":""}`} onClick={()=>setFilter(k)}>{l}</button>
              ))}
            </div>
            <div className="admin-matches-list">
              {filtered.map(m => {
                const r=results[m.id]||{home:m.home_score!==null?String(m.home_score):"",away:m.away_score!==null?String(m.away_score):""};
                const finished=m.status==="finished";
                const kickoffPassed = new Date(m.kickoff_at) <= new Date();
                return (
                  <div key={m.id} className="admin-match-row">
                    <div style={{fontSize:11,color:"var(--muted)"}}>{m.match_date}<br/><span style={{color:"var(--txt)"}}>Grupo {m.group_name}</span></div>
                    <div style={{fontSize:13,fontWeight:500,display:"flex",flexDirection:"column",gap:3}}>
                      <span style={{display:"flex",alignItems:"center",gap:5}}><img src={m.home_flag} alt={m.home} style={{width:18,height:14,objectFit:"cover",borderRadius:2}}/>{m.home}</span>
                      <span style={{display:"flex",alignItems:"center",gap:5}}><img src={m.away_flag} alt={m.away} style={{width:18,height:14,objectFit:"cover",borderRadius:2}}/>{m.away}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <input className="admin-score-input" value={r.home??""} onChange={e=>setResults(s=>({...s,[m.id]:{...s[m.id],home:e.target.value.replace(/[^0-9]/g,"").slice(0,2)}}))} placeholder="0" disabled={!kickoffPassed}/>
                      <span style={{color:"var(--muted)",fontFamily:"Bebas Neue",fontSize:16}}>–</span>
                      <input className="admin-score-input" value={r.away??""} onChange={e=>setResults(s=>({...s,[m.id]:{...s[m.id],away:e.target.value.replace(/[^0-9]/g,"").slice(0,2)}}))} placeholder="0" disabled={!kickoffPassed}/>
                    </div>
                    <div>{finished?<span className="result-badge">✓ {m.home_score}–{m.away_score}</span>:savedMatch[m.id]?<span style={{fontSize:11,color:"var(--green)"}}>✓</span>:!kickoffPassed?<span style={{fontSize:10,color:"var(--muted)"}}>⏳ No iniciado</span>:null}</div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="admin-save-btn" onClick={()=>saveResult(m)} disabled={saving[m.id]||!kickoffPassed}>{saving[m.id]?"...":finished?"Actualizar":"Guardar"}</button>
                      <button className="admin-edit-btn" onClick={()=>{setEditMatch(m);setEditForm({...m});}}>✏️</button>
                      {finished && <button className="admin-edit-btn" onClick={()=>resetMatch(m)} style={{color:"var(--red)",borderColor:"var(--red)"}}>↺</button>}
                    </div>
                    {resultError[m.id] && <div style={{gridColumn:"1 / -1",fontSize:11,color:"#ff8a8a",background:"rgba(220,60,60,0.12)",border:"1px solid rgba(220,60,60,0.4)",borderRadius:7,padding:"6px 9px",marginTop:5,width:"100%"}}>{resultError[m.id]}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {(() => {
        const healthPredSet = new Set(healthPreds.map(p => p.user_id + "|" + p.match_id));
        const healthActiveIds = new Set(healthPreds.map(p => p.user_id));
        const dKey = (m) => m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
        // 1) Resultados finalizados sin cargar (pasaron +2h30 del kickoff y no tienen marcador)
        const pendingResults = matches.filter(m => {
          const noScore = m.home_score == null || m.away_score == null;
          return noScore && (nowMs() - new Date(m.kickoff_at).getTime()) > 9000000;
        }).sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at));
        // 2) Jornada por cerrar: jugadores con pronósticos faltantes
        const openMatches = matches.filter(m => new Date(m.kickoff_at).getTime() > nowMs() && !isLocked(m.kickoff_at, matches, m.match_date));
        const openSorted = [...openMatches].sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at));
        const closingKey = openSorted.length ? dKey(openSorted[0]) : null;
        const closingMatches = closingKey ? openMatches.filter(m => dKey(m) === closingKey) : [];
        const missingPlayers = closingMatches.length ? (profiles || []).map(pr => {
          const missing = closingMatches.filter(m => !healthPredSet.has(pr.id + "|" + m.id)).length;
          return { id: pr.id, name: pr.name, missing };
        }).filter(p => p.missing > 0).sort((a, b) => b.missing - a.missing) : [];
        // 3) Cuentas sin ningún pronóstico en todo el torneo
        const inactivePlayers = (profiles || []).filter(pr => !healthActiveIds.has(pr.id));
        const healthIssues = pendingResults.length + missingPlayers.length + inactivePlayers.length;
        const rowHdr = (icon, ok, label, n) => (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 18 }}>{ok ? "✅" : icon}</span><span style={{ fontWeight: 600, color: "var(--txt)" }}>{label}</span></div>
            <span style={{ fontFamily: "Bebas Neue", fontSize: 18, color: ok ? "var(--green)" : "var(--red)" }}>{n}</span>
          </div>
        );
        return (
          <div className="admin-section">
            <div className="admin-section-hdr" style={{ cursor: "pointer" }} onClick={() => toggleSec("salud")}>
              <h3>🩺 CHEQUEO DE SALUD {openSec === "salud" ? "▴" : "▾"}</h3>
              <span style={{ fontFamily: "Bebas Neue", fontSize: 16, color: healthIssues > 0 ? "var(--red)" : "var(--green)" }}>{healthIssues > 0 ? `${healthIssues} ⚠️` : "Todo OK ✅"}</span>
            </div>
            {openSec === "salud" && <div className="admin-section-body">
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Chequeos automáticos para mantener la quiniela al día. Se actualizan solos con los datos cargados.</p>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                {rowHdr("⚠️", pendingResults.length === 0, "Resultados finalizados sin cargar", pendingResults.length)}
                {pendingResults.length > 0
                  ? <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {pendingResults.map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, color: "var(--txt)", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                          <span>{m.home} vs {m.away}</span>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>{dKey(m)} · {localTime(m.kickoff_at)}</span>
                        </div>
                      ))}
                    </div>
                  : <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>Todos los partidos jugados tienen su marcador.</div>}
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                {rowHdr("⚠️", missingPlayers.length === 0, "Pronósticos faltantes (jornada por cerrar)", missingPlayers.length)}
                {closingKey
                  ? <>
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>Cierra: <strong style={{ color: "var(--gold)" }}>{closingKey}</strong> · {localTime(openSorted[0].kickoff_at)} ({closingMatches.length} partido{closingMatches.length !== 1 ? "s" : ""})</div>
                      {missingPlayers.length > 0
                        ? <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            {missingPlayers.map(p => (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, color: "var(--txt)", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                                <span>{p.name}</span>
                                <span style={{ fontSize: 12, color: "var(--red)" }}>faltan {p.missing} de {closingMatches.length}</span>
                              </div>
                            ))}
                          </div>
                        : <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)" }}>Todos cargaron sus pronósticos. 🎉</div>}
                    </>
                  : <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>No hay jornada abierta próxima a cerrar.</div>}
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                {rowHdr("⚠️", inactivePlayers.length === 0, "Cuentas sin ningún pronóstico", inactivePlayers.length)}
                {inactivePlayers.length > 0
                  ? <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {inactivePlayers.map(p => (
                        <span key={p.id} style={{ fontSize: 12, color: "var(--txt)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px" }}>{p.name}</span>
                      ))}
                    </div>
                  : <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>Todos los participantes pronosticaron al menos una vez.</div>}
              </div>
            </div>}
          </div>
        );
      })()}

      <div className="admin-section">
        <div className="admin-section-hdr" style={{ cursor: "pointer" }} onClick={() => toggleSec("optimg")}>
          <h3>🗜️ OPTIMIZAR IMÁGENES {openSec === "optimg" ? "▴" : "▾"}</h3>
        </div>
        {openSec === "optimg" && <div className="admin-section-body">
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Comprime las fotos de todos los participantes (avatares y cromos) para bajar el consumo de datos. Es una sola vez. Hacelo con buena señal y no cierres la pantalla mientras corre.</p>
          <button className="btn-small" onClick={optimizarImagenes} disabled={optim} style={{ background: "var(--gold-dim)", borderColor: "var(--gold)", color: "var(--gold)" }}>
            {optim ? `Optimizando… ${optProg.done}/${optProg.total}` : "♻️ Optimizar todas las imágenes"}
          </button>
          {optMsg && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 10 }}>{optMsg}</div>}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Una vez optimizadas, borrá las imágenes viejas pesadas que ya no usa ninguna carta, para liberar espacio. (Seguro: solo borra archivos que no estén enlazados.)</p>
            <button className="btn-small" onClick={limpiarImagenesViejas} disabled={limpiando} style={{ background: "var(--red-dim)", borderColor: "var(--red)", color: "var(--red)" }}>
              {limpiando ? "Limpiando…" : "🗑️ Limpiar imágenes viejas"}
            </button>
            {limpMsg && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}>{limpMsg}</div>}
          </div>
        </div>}
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr" style={{ cursor: "pointer" }} onClick={() => toggleSec("cargarpred")}>
          <h3>✍️ CARGAR PREDICCIONES POR JUGADOR {openSec === "cargarpred" ? "▴" : "▾"}</h3>
        </div>
        {openSec === "cargarpred" && <div className="admin-section-body">
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Elegí un jugador y cargá sus pronósticos (por ejemplo si te los pasó por mensaje). Se guardan <strong style={{ color: "var(--gold)" }}>a su nombre</strong>. Sirve también para partidos ya cerrados.</p>
          <select value={apPlayer} onChange={e => { setApPlayer(e.target.value); if (e.target.value) loadPlayerPreds(e.target.value); }}
            style={{ width: "100%", maxWidth: 360, padding: "9px 12px", borderRadius: 8, background: "var(--surface)", color: "var(--txt)", border: "1px solid var(--border)", fontSize: 14, marginBottom: 16 }}>
            <option value="">— Elegí jugador —</option>
            {[...profiles].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {apPlayer && (() => {
            const upcoming = (matches || []).filter(m => m.status !== "finished");
            const byDate = {};
            upcoming.forEach(m => { const d = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10); (byDate[d] = byDate[d] || []).push(m); });
            const dates = Object.keys(byDate).sort();
            if (dates.length === 0) return <div style={{ fontSize: 13, color: "var(--muted)" }}>No hay partidos pendientes.</div>;
            return dates.map(d => {
              let label = d;
              try { label = new Date(d + "T12:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }); } catch (e) {}
              return (
                <div key={d} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", textTransform: "capitalize", marginBottom: 8 }}>{label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {byDate[d].sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at)).map(m => {
                      const v = apPreds[m.id] || {};
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "var(--surface)", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 120, justifyContent: "flex-end" }}>
                            <span style={{ fontSize: 13, textAlign: "right" }}>{m.home}</span>
                            <img src={m.home_flag} alt="" style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                          </div>
                          <input type="number" inputMode="numeric" value={v.home ?? ""} onChange={e => setApPreds(s => ({ ...s, [m.id]: { ...s[m.id], home: e.target.value } }))} style={{ width: 42, textAlign: "center", padding: "6px 4px", borderRadius: 6, background: "var(--bg)", color: "var(--txt)", border: "1px solid var(--border)", fontSize: 14 }} />
                          <span style={{ color: "var(--muted)" }}>-</span>
                          <input type="number" inputMode="numeric" value={v.away ?? ""} onChange={e => setApPreds(s => ({ ...s, [m.id]: { ...s[m.id], away: e.target.value } }))} style={{ width: 42, textAlign: "center", padding: "6px 4px", borderRadius: 6, background: "var(--bg)", color: "var(--txt)", border: "1px solid var(--border)", fontSize: 14 }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 120 }}>
                            <img src={m.away_flag} alt="" style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13 }}>{m.away}</span>
                          </div>
                          <button className="btn-small" onClick={() => savePlayerPred(m)} disabled={apSaving[m.id]} style={apSaved[m.id] ? { background: "var(--green-dim)", borderColor: "var(--green)", color: "var(--green)" } : {}}>{apSaving[m.id] ? "..." : apSaved[m.id] ? "✓" : "Guardar"}</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>}
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>toggleSec("clasificados")}>
          <h3>🏆 CLASIFICADOS DE GRUPOS {openSec==="clasificados"?"▴":"▾"}</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
            {groupResultsMsg && <span style={{fontSize:12,color:groupResultsMsg.type==="ok"?"var(--green)":"var(--red)"}}>{groupResultsMsg.text}</span>}
            <button className="btn-small" onClick={saveGroupResults} disabled={savingGroupResults}>{savingGroupResults?"...":"Guardar"}</button>
            <button className="btn-small" onClick={calculatePreTournamentPoints} disabled={calculatingPts} style={{background:"var(--green-dim)",borderColor:"var(--green)",color:"var(--green)"}}>{calculatingPts?"Calculando...":"🧮 Calcular puntos"}</button>
          </div>
        </div>
        {openSec==="clasificados" && <div className="admin-section-body">
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Ingresa quién quedó 1ro y 2do de cada grupo. Para los <strong style={{color:"var(--gold)"}}>3eros clasificados</strong>: ingresa <strong style={{color:"var(--gold)"}}>solo los 8 mejores terceros</strong> que clasificaron a octavos — deja vacío los 4 que no clasificaron.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {["A","B","C","D","E","F","G","H","I","J","K","L"].map(group => {
              const teams = GROUPS[group] || [];
              return (
                <div key={group} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:12}}>
                  <div style={{fontFamily:"Bebas Neue",fontSize:16,color:"var(--gold)",marginBottom:8}}>GRUPO {group}</div>
                  {[1,2,3].map(pos => (
                    <div key={pos} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <span style={{fontFamily:"Bebas Neue",fontSize:14,color:pos===1?"var(--gold)":pos===2?"#b0bcd0":"#cd7f32",width:16}}>{pos}°</span>
                      <select value={groupResults[group]?.[pos] || ""} onChange={e => setGroupResults(r => ({...r,[group]:{...r[group],[pos]:e.target.value}}))
                      } style={{flex:1,padding:"5px 8px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:6,color:"var(--txt)",fontSize:12,outline:"none"}}>
                        <option value="">— Seleccionar —</option>
                        {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      <CronistaPerfilesAdmin profiles={profiles} onRefresh={onRefresh} />

      <div className="admin-section">
        <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>toggleSec("usuarios")}><h3>👥 GESTIÓN DE USUARIOS {openSec==="usuarios"?"▴":"▾"}</h3><span style={{fontSize:12,color:"var(--muted)"}}>{profiles.length} participantes</span></div>
        {openSec==="usuarios" && <div className="admin-section-body">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {profiles.map(prof => {
              const isAdminUser = adminList.includes(prof.id);
              const isEditing = editingUser === prof.id;
              return (
                <div key={prof.id} style={{background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar profile={prof} size="sm" />
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14,fontWeight:500}}>{prof.name}</span>
                          {isAdminUser && <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"var(--red-dim)",color:"var(--red)"}}>ADMIN</span>}
                        </div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(prof.created_at).toLocaleDateString("es",{day:"2-digit",month:"short",year:"numeric"})}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <label style={{padding:"7px 14px",background:"var(--gold-dim)",border:"1px solid var(--gold)",borderRadius:7,color:"var(--gold)",fontSize:12,cursor:"pointer"}}>
  🖼️
  <input type="file" accept="image/*" style={{display:"none"}} onChange={async(e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const blob = await compressImg(file, 400, 0.82);
    const path = `${prof.id}-${Date.now()}.jpg`;
    await sb.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
    const { data: { publicUrl } } = sb.storage.from("avatars").getPublicUrl(path);
    await sb.from("profiles").update({ avatar_url: publicUrl }).eq("id", prof.id);
    onRefresh();
  }}/>
</label>
<button className="btn-small" onClick={()=>{ setEditingUser(isEditing?null:prof.id); setEditName(prof.name); }}>✏️</button>
                      <button className={`btn-small ${isAdminUser?"red":""}`} onClick={()=>toggleAdmin(prof.id, isAdminUser)} disabled={savingAdmin===prof.id}>{savingAdmin===prof.id?"...":(isAdminUser?"− Admin":"+ Admin")}</button>
                      <button className="btn-small red" onClick={()=>setConfirmDelete(confirmDelete===prof.id?null:prof.id)}>🗑️</button>
                    </div>
                  </div>
                  {isEditing && (
                    <div style={{padding:"0 14px 12px",display:"flex",gap:8}}>
                      <input value={editName} onChange={e=>setEditName(e.target.value)} style={{flex:1,padding:"8px 12px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--txt)",fontSize:13,outline:"none"}} placeholder="Nuevo nombre..."/>
                      <button className="btn-small" onClick={()=>saveEditName(prof.id)} disabled={savingName===prof.id}>{savingName===prof.id?"...":"Guardar"}</button>
                      <button className="btn-small red" onClick={()=>setEditingUser(null)}>×</button>
                    </div>
                  )}
                  {confirmDelete === prof.id && (
                    <div style={{padding:"0 14px 12px",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,color:"var(--red)",flex:1}}>¿Eliminar a {prof.name}? Esto no se puede deshacer.</span>
                      <button className="btn-small" onClick={()=>setConfirmDelete(null)}>Cancelar</button>
                      <button className="btn-small red" onClick={()=>deleteUser(prof.id)} disabled={deletingUser===prof.id}>{deletingUser===prof.id?"...":"Confirmar"}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>}
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>toggleSec("puntos")}><h3>⚙️ SISTEMA DE PUNTOS {openSec==="puntos"?"▴":"▾"}</h3><button className="btn-small" onClick={(e)=>{e.stopPropagation();saveRules();}} disabled={savingRules}>{rulesSaved?"✓ Guardado":savingRules?"...":"Guardar"}</button></div>
        {openSec==="puntos" && <div className="admin-section-body">
          <div className="rules-grid">
            {rules.map(r=>(
              <div key={r.rule_key} className="rule-card">
                <span className="rule-label">{r.description || ruleLabels[r.rule_key] || r.rule_key}</span>
                <input className="rule-input" value={ruleVals[r.rule_key]??r.rule_value} onChange={e=>setRuleVals(v=>({...v,[r.rule_key]:e.target.value}))}/>
              </div>
            ))}
          </div>
        </div>}
      </div>

      <TitlesAdmin profiles={profiles} onRefresh={onRefresh} />

      <DebtorAdmin profiles={profiles} onRefresh={onRefresh} />

      <BreakingNewsAdmin onRefresh={onRefresh} profiles={profiles} />

      <div className="admin-section">
        <div className="admin-section-hdr" style={{cursor:"pointer"}} onClick={()=>toggleSec("codigos")}><h3>🔗 CÓDIGOS DE INVITACIÓN {openSec==="codigos"?"▴":"▾"}</h3></div>
        {openSec==="codigos" && <div className="admin-section-body">
          <div className="invite-list">
            {invites.map(inv=>(
              <div key={inv.code} className="invite-row">
                <span className="invite-code">{inv.code}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span className={`invite-status ${inv.active?"active":"inactive"}`}>{inv.active?"Activo":"Inactivo"}</span>
                  <button className={`btn-small ${inv.active?"red":""}`} onClick={()=>toggleInvite(inv.code,inv.active)}>{inv.active?"Desactivar":"Activar"}</button>
                </div>
              </div>
            ))}
          </div>
          <div className="new-invite-row">
            <input className="new-invite-input" value={newCode} onChange={e=>setNewCode(e.target.value)} placeholder="Nuevo código..." onKeyDown={e=>e.key==="Enter"&&addInvite()}/>
            <button className="btn-small" onClick={addInvite}>Agregar</button>
          </div>
        </div>}
      </div>


    </div>
  );
}

// ── Reset Password Screen ─────────────────────────────────────────────────────
function ResetPasswordScreen({ onDone }) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (pass.length < 6) { setMsg({ type: "err", text: "La contraseña debe tener al menos 6 caracteres" }); return; }
    if (pass !== pass2) { setMsg({ type: "err", text: "Las contraseñas no coinciden" }); return; }
    setLoading(true); setMsg(null);
    const { error } = await sb.auth.updateUser({ password: pass });
    if (error) { setMsg({ type: "err", text: error.message }); setLoading(false); return; }
    setMsg({ type: "ok", text: "✅ Contraseña actualizada correctamente" });
    setLoading(false);
    setTimeout(() => onDone(), 1500);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo"><span className="icon">🔑</span><h1>QUINIELA 2026</h1><p>Crear nueva contraseña</p></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Mínimo 6 caracteres" onKeyDown={e => e.key === "Enter" && handleReset()} /></div>
        <div className="field"><label>Confirmar contraseña</label><input type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Repite la contraseña" onKeyDown={e => e.key === "Enter" && handleReset()} /></div>
        <button className="btn-gold" onClick={handleReset} disabled={loading}>{loading ? "GUARDANDO..." : "GUARDAR CONTRASEÑA"}</button>
        {msg && <p className={msg.type === "err" ? "msg-err" : "msg-ok"}>{msg.text}</p>}
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
// ── Recordatorio de predicciones pendientes ───────────────────────────────────
const PRED_REMINDER_MINUTES = 30;

function getPendingPredReminder(matches, allPredictions, userId) {
  if (!matches || !matches.length || !userId) return null;
  const now = Date.now();
  const byDate = {};
  matches.forEach(m => { (byDate[m.match_date] = byDate[m.match_date] || []).push(m); });
  let best = null;
  Object.entries(byDate).forEach(([date, ms]) => {
    const firstKickoff = Math.min(...ms.map(m => new Date(m.kickoff_at).getTime()));
    const deadline = firstKickoff - 24 * 60 * 60 * 1000;
    const msToClose = deadline - now;
    if (msToClose > 0 && msToClose < 24 * 60 * 60 * 1000) {
      const missing = ms.filter(m => !allPredictions.some(p => p.user_id === userId && p.match_id === m.id));
      if (missing.length > 0 && (!best || msToClose < best.msToClose)) {
        best = { date, missing: missing.length, total: ms.length, msToClose };
      }
    }
  });
  return best;
}

// Snooze del recordatorio por bandas de tiempo restante (12h / 6h / 3h).
const PRED_SNOOZE_KEY = (date) => "predrem-snooze-" + date;
function predReminderSnoozed(date) {
  const until = parseInt(localStorage.getItem(PRED_SNOOZE_KEY(date)) || "0", 10);
  return until > Date.now();
}
function snoozePredReminder(date, untilMs) {
  localStorage.setItem(PRED_SNOOZE_KEY(date), String(Math.round(untilMs)));
}
// Próxima banda a la que postergar según las horas que faltan (null = sin snooze)
function nextSnoozeBand(msToClose) {
  const h = msToClose / 3600000;
  if (h > 12) return 12;
  if (h > 6) return 6;
  if (h > 3) return 3;
  return null;
}

function PredReminderPopup({ reminder, onGo, onClose, onSnooze }) {
  const [confirming, setConfirming] = useState(false);
  const hours = Math.floor(reminder.msToClose / 3600000);
  const mins = Math.floor((reminder.msToClose % 3600000) / 60000);
  const band = nextSnoozeBand(reminder.msToClose);
  // Tiempo hasta el próximo aviso (cuando falten `band` horas para el cierre)
  const untilNextMs = band != null ? Math.max(0, reminder.msToClose - band * 3600000) : 0;
  const unH = Math.floor(untilNextMs / 3600000);
  const unM = Math.floor((untilNextMs % 3600000) / 60000);
  const untilLabel = unH > 0 ? `${unH}h ${unM}m` : `${unM}m`;
  const handleLater = () => {
    if (band != null && onSnooze) {
      setConfirming(true); // pedir confirmación antes de postergar
    } else {
      onClose();
    }
  };
  const confirmSnooze = () => {
    // postergar hasta que falten `band` horas para el cierre
    onSnooze(reminder.date, Date.now() + reminder.msToClose - band * 3600000);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--card)", border: "1px solid var(--gold)", borderRadius: 16, maxWidth: 360, width: "100%", padding: "26px 22px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}>
        {confirming ? (<>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🔕</div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "var(--gold)", letterSpacing: 1, marginBottom: 10 }}>¿Pausar el recordatorio?</div>
          <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.5, marginBottom: 6 }}>Vas a desactivar el aviso por las próximas <strong style={{ color: "var(--gold)" }}>{untilLabel}</strong>.</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Te volveremos a avisar cuando falten <strong style={{ color: "var(--red)" }}>{band}h</strong> para el cierre.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>No, cancelar</button>
            <button onClick={confirmSnooze} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sí, desactivar</button>
          </div>
        </>) : (<>
          <div style={{ fontSize: 42, marginBottom: 6 }}>⏰</div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 25, color: "var(--gold)", letterSpacing: 1, marginBottom: 8 }}>¡No te quedes afuera!</div>
          <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.5, marginBottom: 6 }}>Te faltan <strong style={{ color: "var(--gold)" }}>{reminder.missing}</strong> de {reminder.total} pronósticos de la próxima jornada.</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Cierran en <strong style={{ color: "var(--red)" }}>{hours}h {mins}m</strong>. ¡Después no se pueden cargar!</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleLater} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>{band != null ? `⏰ Faltando ${band}h` : "Más tarde"}</button>
            <button onClick={onGo} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cargar ahora ⚽</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

// ── Última hora: popup que muestra una imagen a pantalla completa ──────────────
function BreakingNewsPopup({ news, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, zIndex: 2, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
      {news.title && (
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 2, fontFamily: "Bebas Neue", fontSize: 18, color: "var(--gold)", letterSpacing: 1, background: "rgba(0,0,0,.5)", padding: "4px 12px", borderRadius: 20, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⚡ {news.title}</div>
      )}
      <img onClick={e => e.stopPropagation()} src={news.image_url} alt={news.title || "Última hora"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
    </div>
  );
}

// Sección admin para subir/gestionar las noticias de última hora
function BreakingNewsAdmin({ onRefresh, profiles }) {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const [showCount, setShowCount] = useState("3");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [secOpen, setSecOpen] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState([]); // vacío = todos
  const [showTargets, setShowTargets] = useState(false);
  const allProfiles = profiles || [];

  async function load() {
    const { data } = await sb.from("breaking_news").select("*").order("created_at", { ascending: false });
    setList(data || []);
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    if (!file) { setMsg({ type: "err", text: "Elegí una imagen primero" }); return; }
    const veces = Math.max(1, parseInt(showCount) || 1);
    setUploading(true); setMsg(null);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `news-${Date.now()}.${ext}`;
      const up = await sb.storage.from("news").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (up.error) { setMsg({ type: "err", text: "Error subiendo imagen: " + up.error.message }); setUploading(false); return; }
      const { data: pub } = sb.storage.from("news").getPublicUrl(path);
      const targets = (selectedTargets.length > 0 && selectedTargets.length < allProfiles.length) ? selectedTargets : null;
      const { error } = await sb.from("breaking_news").insert({ title: title.trim() || null, image_url: pub.publicUrl, image_path: path, show_count: veces, active: true, target_users: targets });
      if (error) { setMsg({ type: "err", text: "Error guardando: " + error.message }); setUploading(false); return; }
      setTitle(""); setFile(null); setShowCount("3"); setSelectedTargets([]); setShowTargets(false);
      setMsg({ type: "ok", text: "✅ Noticia publicada" });
      await load(); onRefresh && onRefresh();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setMsg({ type: "err", text: "Error: " + (e && e.message ? e.message : e) });
    }
    setUploading(false);
  }

  async function toggleActive(n) {
    await sb.from("breaking_news").update({ active: !n.active }).eq("id", n.id);
    await load(); onRefresh && onRefresh();
  }
  async function changeCount(n, veces) {
    const v = Math.max(1, parseInt(veces) || 1);
    await sb.from("breaking_news").update({ show_count: v }).eq("id", n.id);
    await load(); onRefresh && onRefresh();
  }
  async function remove(n) {
    if (!window.confirm("¿Eliminar esta noticia?")) return;
    if (n.image_path) await sb.storage.from("news").remove([n.image_path]);
    await sb.from("breaking_news").delete().eq("id", n.id);
    await load(); onRefresh && onRefresh();
  }

  const activas = list.filter(n => n.active).length;

  return (
    <div className="admin-section">
      <div className="admin-section-hdr" style={{ cursor: "pointer" }} onClick={() => setSecOpen(o => !o)}>
        <h3>⚡ ÚLTIMA HORA {secOpen ? "▴" : "▾"}</h3>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{activas} activa{activas !== 1 ? "s" : ""}</span>
      </div>
      {secOpen && <div className="admin-section-body">
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
          Subí una imagen (JPG/PNG) y se mostrará a pantalla completa como popup al abrir la app. En <strong style={{ color: "var(--gold)" }}>"Veces"</strong> ponés cuántas veces se le muestra a cada jugador; después de esa cantidad deja de aparecerle.
        </div>
        {/* Crear */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título (opcional, ej: 🚨 Cambio de horario Fecha 7)" style={{ width: "100%", padding: "9px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }} />
          {/* Destinatarios */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7 }}>
            <div onClick={() => setShowTargets(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>👥 Mostrar a: <strong style={{ color: "var(--gold)" }}>{(selectedTargets.length === 0 || selectedTargets.length === allProfiles.length) ? "Todos" : `${selectedTargets.length} seleccionado${selectedTargets.length !== 1 ? "s" : ""}`}</strong></span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{showTargets ? "▴" : "▾"}</span>
            </div>
            {showTargets && <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button className="btn-small" onClick={() => setSelectedTargets(allProfiles.map(p => p.id))}>Todos</button>
                <button className="btn-small" onClick={() => setSelectedTargets([])}>Ninguno</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {allProfiles.map(p => {
                  const on = selectedTargets.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setSelectedTargets(s => on ? s.filter(x => x !== p.id) : [...s, p.id])}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${on ? "var(--gold)" : "var(--border)"}`, background: on ? "var(--gold-dim)" : "var(--surface)", color: on ? "var(--gold)" : "var(--nav)" }}>
                      <span>{on ? "✓" : "+"}</span>{p.name}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Si no elegís a nadie (o elegís a todos), la noticia va para todos.</div>
            </div>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ flex: 1, minWidth: 140, padding: "9px 12px", background: "var(--card)", border: "1px dashed var(--border)", borderRadius: 7, color: file ? "var(--txt)" : "var(--muted)", fontSize: 12, cursor: "pointer", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file ? "🖼️ " + file.name : "📎 Elegir imagen"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFile(e.target.files[0] || null)} />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Veces</span>
              <input type="number" min="1" max="99" value={showCount} onChange={e => setShowCount(e.target.value)} style={{ width: 56, padding: "9px 8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--gold)", fontFamily: "Bebas Neue", fontSize: 18, textAlign: "center", outline: "none" }} />
            </div>
            <button className="btn-small" onClick={publish} disabled={uploading} style={{ background: "var(--gold-dim)", borderColor: "var(--gold)", color: "var(--gold)" }}>{uploading ? "Subiendo..." : "Publicar"}</button>
          </div>
          {msg && <div style={{ fontSize: 12, color: msg.type === "ok" ? "var(--green)" : "var(--red)" }}>{msg.text}</div>}
        </div>
        {/* Lista */}
        {list.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No hay noticias cargadas.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map(n => (
              <div key={n.id} style={{ background: "var(--surface)", border: `1px solid ${n.active ? "rgba(245,183,49,.4)" : "var(--border)"}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <a href={n.image_url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                    <img src={n.image_url} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)", display: "block" }} />
                  </a>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{n.active ? "🟢" : "⚪"}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title || "Sin título"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(n.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {n.show_count} vez{n.show_count !== 1 ? "es" : ""} · {(!n.target_users || !Array.isArray(n.target_users) || n.target_users.length === 0) ? "👥 Todos" : `🎯 ${n.target_users.length} jugador${n.target_users.length !== 1 ? "es" : ""}`}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Veces</span>
                    <input type="number" min="1" max="99" defaultValue={n.show_count} onBlur={e => { if (parseInt(e.target.value) !== n.show_count) changeCount(n, e.target.value); }} style={{ width: 46, padding: "5px 6px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--gold)", fontFamily: "Bebas Neue", fontSize: 15, textAlign: "center", outline: "none" }} />
                  </div>
                  <button className={`btn-small ${n.active ? "red" : ""}`} onClick={() => toggleActive(n)}>{n.active ? "Desactivar" : "Activar"}</button>
                  <button className="btn-small red" onClick={() => remove(n)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}

// ── Tabla de grupos / clasificación del Mundial (en vivo desde resultados) ─────
function GroupStandings({ matches }) {
  const tieneScore = (m) => m.home_score != null && m.away_score != null;
  const groupsData = Object.entries(GROUPS).map(([g, teams]) => {
    const stats = {};
    teams.forEach(t => { stats[t.name] = { name: t.name, flag: t.flag, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 }; });
    (matches || []).forEach(m => {
      if (m.group_name !== g || !tieneScore(m)) return;
      const h = stats[m.home], a = stats[m.away];
      if (!h || !a) return;
      h.pj++; a.pj++;
      h.gf += m.home_score; h.gc += m.away_score;
      a.gf += m.away_score; a.gc += m.home_score;
      if (m.home_score > m.away_score) { h.g++; a.p++; }
      else if (m.home_score < m.away_score) { a.g++; h.p++; }
      else { h.e++; a.e++; }
    });
    const rows = Object.values(stats)
      .map(s => ({ ...s, dg: s.gf - s.gc, pts: s.g * 3 + s.e }))
      .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.name.localeCompare(y.name));
    const jugados = rows.reduce((sum, r) => sum + r.pj, 0) > 0;
    return { g, rows, jugados };
  });

  // Los 8 mejores terceros entre los 12 grupos (ranking por pts → DG → GF).
  // Solo se resaltan una vez que arrancó el torneo (si no, serían 8 ceros arbitrarios).
  const anyPlayed = groupsData.some(gd => gd.jugados);
  const terceros = groupsData
    .map(gd => gd.rows[2] ? { ...gd.rows[2], g: gd.g } : null)
    .filter(Boolean)
    .sort((x, y) => y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.g.localeCompare(y.g));
  const qualifyingThirds = anyPlayed ? new Set(terceros.slice(0, 8).map(t => t.name)) : new Set();

  const thNum = { textAlign: "center", padding: "5px 3px", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 };
  const tdNum = { padding: "7px 3px", textAlign: "center", color: "var(--muted)", fontSize: 12 };

  return (
    <div>
      <div className="sec-hdr" style={{ marginBottom: 12 }}><h2>📊 GRUPOS Y CLASIFICACIÓN</h2></div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
        Clasificación en vivo de la fase de grupos, calculada con cada resultado cargado. Los <strong style={{ color: "var(--green)" }}>2 primeros</strong> de cada grupo clasifican (más los 8 mejores terceros).
      </div>
      <div className="groups-grid">
        {groupsData.map(({ g, rows, jugados }) => (
          <div key={g} className="group-card">
            <div className="group-card-hdr">
              <h4>GRUPO {g}</h4>
              {!jugados && <span style={{ fontSize: 10, color: "var(--muted)" }}>sin jugar</span>}
            </div>
            <div style={{ padding: "2px 8px 8px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thNum, width: 18 }}></th>
                    <th style={{ textAlign: "left", padding: "5px 4px", fontSize: 10, color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Equipo</th>
                    <th style={thNum}>PJ</th>
                    <th style={thNum} className="desktop-col">G</th>
                    <th style={thNum} className="desktop-col">E</th>
                    <th style={thNum} className="desktop-col">P</th>
                    <th style={thNum}>DG</th>
                    <th style={{ ...thNum, color: "var(--gold)" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const directo = i < 2;
                    const mejorTercero = i === 2 && qualifyingThirds.has(r.name);
                    const bg = directo ? "var(--green-dim)" : mejorTercero ? "rgba(74,158,255,.12)" : "transparent";
                    const posColor = directo ? "var(--green)" : mejorTercero ? "var(--blue)" : "var(--muted)";
                    return (
                      <tr key={r.name} style={{ borderTop: "1px solid var(--border)", background: bg }}>
                        <td style={{ padding: "7px 4px", textAlign: "center", fontFamily: "Bebas Neue", fontSize: 14, color: posColor }}>{i + 1}</td>
                        <td style={{ padding: "7px 4px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <img src={r.flag} alt="" style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                          </span>
                        </td>
                        <td style={tdNum}>{r.pj}</td>
                        <td style={tdNum} className="desktop-col">{r.g}</td>
                        <td style={tdNum} className="desktop-col">{r.e}</td>
                        <td style={tdNum} className="desktop-col">{r.p}</td>
                        <td style={{ ...tdNum, color: r.dg > 0 ? "var(--green)" : r.dg < 0 ? "var(--red)" : "var(--muted)" }}>{r.dg > 0 ? "+" + r.dg : r.dg}</td>
                        <td style={{ padding: "7px 4px", textAlign: "center", fontFamily: "Bebas Neue", fontSize: 16, color: "var(--gold)" }}>{r.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--green-dim)", border: "1px solid rgba(42,223,122,.4)", display: "inline-block" }} /> Clasificación directa (1° y 2°)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(74,158,255,.12)", border: "1px solid rgba(74,158,255,.45)", display: "inline-block" }} /> 8 mejores terceros (provisorio)
        </span>
      </div>
    </div>
  );
}

function PrediccionesTab({ user, matches, myPredictions, allPredictions, profiles, onSave }) {
  const [subTab, setSubTab] = useState("matches");
  return (<>
    <div className="pre-tabs" style={{marginBottom:20}}>
      <button className={`pre-tab ${subTab==="matches"?"active":""}`} onClick={()=>setSubTab("matches")}>⚽ Partidos</button>
      <button className={`pre-tab ${subTab==="pre"?"active":""}`} onClick={()=>setSubTab("pre")}>📋 Pre-Torneo</button>
      <button className={`pre-tab ${subTab==="grupos"?"active":""}`} onClick={()=>setSubTab("grupos")}>📊 Grupos y clasificación</button>
    </div>
    {subTab==="matches" && <Matches user={user} matches={matches} predictions={myPredictions} allPredictions={allPredictions} onSave={onSave} profiles={profiles}/>}
    {subTab==="pre"     && <PreTournament user={user}/>}
    {subTab==="grupos"  && <GroupStandings matches={matches}/>}
  </>);
}

// ── Pestaña Crónica (sale de Info a barra propia; conserva imagen patrocinantes) ──
const PUBLICIDAD_FRANJAS = [
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/info/pub-oficiales.jpg",
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/info/pub-gold.jpg",
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/info/pub-silver.jpg",
  "https://bheziohaquiwnvbzrlio.supabase.co/storage/v1/object/public/info/Pub-aliados.jpg",
];

function PublicidadCarrusel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PUBLICIDAD_FRANJAS.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",overflow:"hidden"}}>
      <div style={{position:"relative",width:"100%"}}>
        {PUBLICIDAD_FRANJAS.map((url, i) => (
          <img
            key={url}
            src={url}
            alt="Patrocinantes"
            style={{
              width:"100%", display:"block",
              ...(i === idx
                ? { position:"relative", opacity:1, transition:"opacity .6s ease" }
                : { position:"absolute", top:0, left:0, opacity:0, transition:"opacity .6s ease", pointerEvents:"none" }),
            }}
          />
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:6,padding:"8px 0",background:"var(--card)"}}>
        {PUBLICIDAD_FRANJAS.map((_, i) => (
          <span key={i} style={{width:7,height:7,borderRadius:"50%",background:i===idx?"var(--gold)":"var(--border)",transition:"background .3s"}}/>
        ))}
      </div>
    </div>
  );
}

function CronicaTab({ user, isAdmin, matches, allPredictions, profiles }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div className="sec-hdr"><h2>📰 CRÓNICA</h2></div>
      <PublicidadCarrusel />
      <CronistaTab user={user} isAdmin={isAdmin} matches={matches} allPredictions={allPredictions} profiles={profiles} />
    </div>
  );
}

// ── Skeletons de carga ───────────────────────────────────────────────────────
function Skel({ w = "100%", h = 16, r = 8, style = {} }) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
function SkelCard({ children, style = {} }) {
  return <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20, ...style }}>{children}</div>;
}
function SkeletonDashboard() {
  return (
    <div>
      <Skel w="55%" h={26} style={{ marginBottom: 18 }} />
      <SkelCard>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><Skel w="40%" h={18} /><Skel w={70} h={18} /></div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--surface)", borderRadius: 8, marginBottom: 8 }}>
            <Skel w="34%" h={14} /><Skel w={54} h={22} style={{ margin: "0 auto" }} r={6} /><Skel w="34%" h={14} />
          </div>
        ))}
      </SkelCard>
      <SkelCard>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><Skel w="45%" h={18} /><Skel w={90} h={18} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px" }}>
              <Skel w="55%" h={12} style={{ marginBottom: 10 }} /><Skel w="40%" h={28} style={{ marginBottom: 8 }} /><Skel w="50%" h={11} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}><Skel w="100%" h={8} r={20} style={{ marginBottom: 8 }} /><Skel w="100%" h={8} r={20} /></div>
      </SkelCard>
    </div>
  );
}
function SkeletonStandings() {
  return (
    <div>
      <Skel w="45%" h={26} style={{ marginBottom: 18 }} />
      <SkelCard style={{ padding: "10px 12px" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 6px", borderBottom: i < 8 ? "1px solid var(--border)" : "none" }}>
            <Skel w={22} h={22} r={6} />
            <Skel w={34} h={34} r="50%" />
            <Skel w="45%" h={16} />
            <Skel w={44} h={20} r={6} style={{ marginLeft: "auto" }} />
          </div>
        ))}
      </SkelCard>
    </div>
  );
}

// ── Ruleta de la caja misteriosa ──────────────────────────────────────────────
function Ruleta({ pool, won, onFinish }) {
  const CELL = 88, GAP = 8, STEP = CELL + GAP, VIEW = 300, WIN = 44;
  const reel = useMemo(() => {
    const base = (pool && pool.length) ? pool : [{ nada: true }];
    const cells = [];
    for (let i = 0; i < 52; i++) {
      cells.push(Math.random() < 0.25 ? { nada: true } : base[Math.floor(Math.random() * base.length)]);
    }
    cells[WIN] = won ? won : { nada: true };
    return cells;
  }, []);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const jitter = Math.random() * 36 - 18;
    const final = -(WIN * STEP) + jitter;
    const t1 = setTimeout(() => setOffset(final), 80);
    const t2 = setTimeout(() => onFinish && onFinish(), 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", letterSpacing: 1, marginBottom: 12 }}>🎰 Girando…</div>
      <div style={{ position: "relative", width: VIEW, maxWidth: "100%", margin: "0 auto", overflow: "hidden", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", padding: "14px 0" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 2, background: "var(--gold)", transform: "translateX(-1px)", zIndex: 2, boxShadow: "0 0 8px var(--gold)" }} />
        <div style={{ position: "absolute", top: 1, left: "50%", transform: "translateX(-50%)", zIndex: 3, color: "var(--gold)", fontSize: 12 }}>▼</div>
        <div style={{ display: "flex", gap: GAP, paddingLeft: (VIEW / 2 - CELL / 2), transform: `translateX(${offset}px)`, transition: offset ? "transform 4s cubic-bezier(.10,.75,.15,1)" : "none" }}>
          {reel.map((c, i) => (
            <div key={i} style={{ width: CELL, flexShrink: 0, height: CELL, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: 4 }}>
              {c.nada
                ? <div style={{ fontSize: 30, opacity: .5 }}>❌</div>
                : c.imagen_url
                  ? <img src={c.imagen_url} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }} />
                  : <div style={{ fontSize: 32 }}>{c.emoji || "🎁"}</div>}
              <div style={{ fontSize: 9, color: "var(--muted)", textAlign: "center", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{c.nada ? "Nada" : c.nombre}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ícono de la moneda Petro ──────────────────────────────────────────────────
function PetroCoin({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "inline-block", verticalAlign: "-0.18em", flexShrink: 0 }} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#cdb24e" />
      <text x="16" y="22.5" textAnchor="middle" fontSize="21" fontWeight="800" fill="#fff" fontFamily="Arial, system-ui, sans-serif">₽</text>
    </svg>
  );
}

// ── Tienda (perks con Petros) ─────────────────────────────────────────────────
const TIENDA_RATE = 1; // Petros por punto de partidos
const STORE_FRAMES = [
  { key: "fuego", nombre: "Fuego", color: "#ff6b35" },
  { key: "neon", nombre: "Neón", color: "#00e5ff" },
  { key: "rosa", nombre: "Rosa", color: "#ff4fa3" },
  { key: "violeta", nombre: "Violeta", color: "#a78bfa" },
  { key: "verde", nombre: "Verde", color: "#2adf7a" },
  { key: "azul", nombre: "Azul", color: "#4a9eff" },
];
const TIPO_INFO = {
  frame:    { label: "Marco de avatar (selector de color)" },
  espiar:   { label: "Espiar pronósticos (humo)" },
  gag:      { label: "Estafa con mensaje (gag)" },
  poster:   { label: "Póster (con imagen)" },
  caja:     { label: "Caja misteriosa (premio al azar)" },
  sobre:    { label: "Sobre de cromos (álbum)" },
  generico: { label: "Genérico (solo descuenta Petros)" },
};

const PETRO_PACKS = [
  { cant: 30, precio: "$2.49" },
  { cant: 80, precio: "$5.99" },
  { cant: 170, precio: "$11.99", badge: "POPULAR" },
  { cant: 360, precio: "$23.99" },
  { cant: 950, precio: "$59.99" },
  { cant: 2000, precio: "$119.99", badge: "MEJOR VALOR" },
];

// ── Álbum de cromos de participantes ──────────────────────────────────────────
function Album({ user, profiles, allPredictions, isAdmin, onRefresh }) {
  const [col, setCol] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFotos, setShowFotos] = useState(false);
  const [subiendoId, setSubiendoId] = useState(null);
  const [fotoMsg, setFotoMsg] = useState("");
  const [optim, setOptim] = useState(false);
  const [optProg, setOptProg] = useState({ done: 0, total: 0 });
  const [optMsg, setOptMsg] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await sb.from("album_cromos").select("cromo_id, cantidad").eq("user_id", user.id);
      const m = {};
      (data || []).forEach(r => { m[r.cromo_id] = r.cantidad; });
      setCol(m);
      setLoading(false);
    })();
  }, []);

  async function subirCromoFoto(p, file) {
    if (!file) return;
    setFotoMsg("");
    setSubiendoId(p.id);
    try {
      const blob = await compressImg(file, 512, 0.82);
      const path = `cromos/${p.id}-${Date.now()}.jpg`;
      const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
      const { data, error } = await sb.rpc("set_cromo_foto", { p_user_id: p.id, p_url: pub.publicUrl });
      if (error || !data || !data.ok) throw new Error((data && data.error) || "No se pudo guardar");
      if (onRefresh) await onRefresh();
    } catch (e) {
      setFotoMsg("No se pudo subir la foto de " + (p.name || "") + ": " + (e.message || e));
    }
    setSubiendoId(null);
  }

  async function optimizarFotos() {
    const conFoto = (profiles || []).filter(p => p.cromo_foto);
    if (conFoto.length === 0) { setOptMsg("No hay fotos cargadas para optimizar."); return; }
    setOptim(true); setOptMsg(""); setOptProg({ done: 0, total: conFoto.length });
    let ok = 0, fail = 0;
    for (let i = 0; i < conFoto.length; i++) {
      const p = conFoto[i];
      setOptProg({ done: i, total: conFoto.length });
      try {
        const resp = await fetch(p.cromo_foto, { cache: "no-store" });
        if (!resp.ok) throw new Error("fetch");
        const orig = await resp.blob();
        const blob = await compressImg(orig, 512, 0.82);
        const path = `cromos/opt-${p.id}-${Date.now()}.jpg`;
        const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
        if (up.error) throw up.error;
        const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
        const { data, error } = await sb.rpc("set_cromo_foto", { p_user_id: p.id, p_url: pub.publicUrl });
        if (error || !data || !data.ok) throw new Error("rpc");
        ok++;
      } catch (e) { fail++; }
    }
    setOptProg({ done: conFoto.length, total: conFoto.length });
    setOptim(false);
    setOptMsg(`Listo: ${ok} optimizadas${fail ? ` · ${fail} fallaron` : ""}.`);
    if (onRefresh) await onRefresh();
  }

  const cromos = [...(profiles || [])].sort((a, b) => (a.cromo_numero || 999) - (b.cromo_numero || 999));
  const total = cromos.length;
  const tengo = cromos.filter(c => (col[c.id] || 0) > 0).length;
  const pct = total ? Math.round((tengo / total) * 100) : 0;
  const repes = cromos.reduce((s, c) => s + Math.max(0, (col[c.id] || 0) - 1), 0);

  return (
    <div>
      <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 26, color: "var(--gold)", letterSpacing: 1 }}>📒 Álbum del Mundial</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Tenés <b style={{ color: "var(--gold)" }}>{tengo}</b> de {total} · {repes} repetidos</div>
        </div>
        <div style={{ marginTop: 10, height: 10, borderRadius: 6, background: "var(--surface)", overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,var(--gold),#ffe066)", transition: "width .5s" }} />
        </div>
        {pct === 100
          ? <div style={{ marginTop: 10, fontSize: 13, color: "var(--gold)", fontWeight: 700, textAlign: "center" }}>🏆 ¡Álbum completo! Sos un capo.</div>
          : <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>Conseguí sobres en la 🛒 Tienda para completar la colección.</div>}
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: "14px 16px", marginBottom: 16 }}>
          <button onClick={() => setShowFotos(s => !s)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: "var(--txt)", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0 }}>
            <span>📸 Fotos de cromos (admin)</span>
            <span style={{ color: "var(--muted)" }}>{showFotos ? "▲" : "▼"}</span>
          </button>
          {showFotos && (<>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Subí la foto de cada cromo. Si no cargás ninguna, se usa el avatar (o las iniciales).</div>
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Comprimí de una todas las fotos ya subidas para bajar el consumo de datos. (Tardá unos segundos; no cierres la pantalla.)</div>
              <button onClick={optimizarFotos} disabled={optim} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid var(--gold)", background: "var(--gold-dim)", color: "var(--gold)", fontSize: 13, fontWeight: 700, cursor: optim ? "wait" : "pointer" }}>
                {optim ? `Optimizando… ${optProg.done}/${optProg.total}` : "♻️ Optimizar fotos existentes"}
              </button>
              {optMsg && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 8 }}>{optMsg}</div>}
            </div>
            {fotoMsg && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{fotoMsg}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 420, overflowY: "auto" }}>
              {cromos.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px" }}>
                  <CromoFoto profile={p} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>#{p.cromo_numero || "?"} · {p.name}</div>
                    <div style={{ fontSize: 11, color: p.cromo_foto ? "var(--green)" : "var(--muted)", marginTop: 2 }}>{p.cromo_foto ? "Foto cargada ✓" : (p.avatar_url ? "Usando avatar" : "Sin foto")}</div>
                  </div>
                  <label style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--gold)", background: "var(--gold-dim)", color: "var(--gold)", fontSize: 12, fontWeight: 700, cursor: subiendoId === p.id ? "wait" : "pointer" }}>
                    {subiendoId === p.id ? "Subiendo…" : "Subir"}
                    <input type="file" accept="image/*" disabled={subiendoId === p.id} onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; subirCromoFoto(p, f); }} style={{ display: "none" }} />
                  </label>
                </div>
              ))}
            </div>
          </>)}
        </div>
      )}

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
          {cromos.map(c => {
            const n = col[c.id] || 0;
            const tiene = n > 0;
            const raro = c.cromo_rareza === "raro";
            return (
              <div key={c.id} style={{ position: "relative", borderRadius: 12, padding: "14px 6px 12px", textAlign: "center", border: raro ? "1px solid var(--gold)" : "1px solid var(--border)", background: tiene ? (raro ? "linear-gradient(160deg,rgba(245,183,49,.18),var(--card))" : "var(--card)") : "var(--surface)", opacity: tiene ? 1 : 0.55 }}>
                <div style={{ position: "absolute", top: 6, left: 8, fontSize: 10, fontWeight: 800, color: "var(--muted)" }}>#{c.cromo_numero || "?"}</div>
                {raro && <div style={{ position: "absolute", top: 6, right: 8, fontSize: 11 }} title="Raro">⭐</div>}
                {tiene ? (<>
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}><CromoFoto profile={c} size={62} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  {n > 1 && <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, fontWeight: 800, color: "var(--green)" }}>x{n}</div>}
                </>) : (<>
                  <div style={{ width: 62, height: 62, borderRadius: 10, background: "var(--border)", margin: "4px auto 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--muted)" }}>?</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>—</div>
                </>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tienda({ user, matches, allPredictions, profiles, onRefresh, isAdmin }) {
  const [sub, setSub] = useState("comprar");
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [framePicker, setFramePicker] = useState(null);
  const [spyPicker, setSpyPicker] = useState(null);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [comprasView, setComprasView] = useState("mias");
  const [allPurchases, setAllPurchases] = useState([]);
  const [packsOpen, setPacksOpen] = useState(false);
  const [packPick, setPackPick] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [canjeando, setCanjeando] = useState(false);
  const [codigos, setCodigos] = useState([]);
  const [nuevoCodCant, setNuevoCodCant] = useState(30);
  const [generando, setGenerando] = useState(false);

  // gestión (admin)
  const [precioEdits, setPrecioEdits] = useState({});
  const [nuevo, setNuevo] = useState({ key: "", nombre: "", emoji: "", tipo: "generico", precio: 10, descripcion: "", titulo: "", texto: "", imagen_url: "" });
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubiendo, setEditSubiendo] = useState(false);
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  const myPts = (allPredictions || []).filter(p => p.user_id === user.id).reduce((s, p) => s + (p.points || 0), 0);
  const bonus = user.profile?.monedas_bonus || 0;
  const earned = myPts * TIENDA_RATE + bonus;
  const spent = purchases.reduce((s, p) => s + (p.precio || 0), 0);
  const saldo = earned - spent;
  const miMarco = user.profile?.avatar_frame || null;

  async function loadAll() {
    const promesas = [
      sb.from("store_items").select("*").order("precio", { ascending: true }),
      sb.from("store_purchases").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ];
    if (isAdmin) promesas.push(sb.from("store_purchases").select("*").order("created_at", { ascending: false }));
    const res = await Promise.all(promesas);
    setItems(res[0].data || []);
    setPurchases(res[1].data || []);
    if (isAdmin) setAllPurchases(res[2].data || []);
    if (isAdmin) {
      const { data: cods } = await sb.from("petro_codigos").select("*").order("created_at", { ascending: false });
      setCodigos(cods || []);
    }
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);

  async function canjear(cod) {
    const code = (cod || "").trim();
    if (!code) return;
    setCanjeando(true);
    const { data, error } = await sb.rpc("canjear_codigo", { p_codigo: code });
    setCanjeando(false);
    if (error || !data || !data.ok) {
      setModal({ type: "error", msg: (data && data.error) || "No se pudo canjear el código." });
      return;
    }
    setPacksOpen(false); setPackPick(null); setCodigo("");
    if (onRefresh) onRefresh();
    setModal({ type: "canje_ok", cantidad: data.cantidad });
  }
  function randomCode() {
    const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 5; i++) c += s[Math.floor(Math.random() * s.length)];
    return "PETRO-" + c;
  }
  async function generarCodigo() {
    const cant = Number(nuevoCodCant) || 0;
    if (cant <= 0) { setModal({ type: "error", msg: "Poné una cantidad mayor a 0." }); return; }
    setGenerando(true);
    const { error } = await sb.from("petro_codigos").insert({ codigo: randomCode(), cantidad: cant });
    setGenerando(false);
    if (error) { setModal({ type: "error", msg: "No se pudo generar: " + error.message }); return; }
    loadAll();
  }
  async function borrarCodigo(cod) {
    await sb.from("petro_codigos").delete().eq("codigo", cod);
    loadAll();
  }

  const visibles = items.filter(it => it.activo);

  function spyPool() {
    const sinResultado = (matches || []).filter(m =>
      m.status !== "finished" && m.home_score == null && m.away_score == null
    );
    const bloqueados = sinResultado.filter(m => isLocked(m.kickoff_at, matches, m.match_date));
    const base = bloqueados.length
      ? bloqueados
      : sinResultado.filter(m => new Date(m.kickoff_at).getTime() > nowMs());
    return base.sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at)).slice(0, 5);
  }

  function seedScore(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }
  function spyFakes(pid) {
    return spyPool().map(m => ({
      m,
      h: seedScore(String(pid) + "H" + m.id) % 4,
      a: seedScore(String(pid) + "A" + m.id) % 4,
    }));
  }
  function reSpy(p) {
    const targetName = (p.metadata && p.metadata.target_name) || "alguien";
    setModal({ type: "espiar", target: { name: targetName }, fakes: spyFakes(p.id) });
  }

  async function comprar(itemKey, metadata = {}) {
    setBusy(itemKey);
    const { data, error } = await sb.rpc("comprar_item", { p_item_key: itemKey, p_metadata: metadata });
    setBusy(null);
    if (error || !data || !data.ok) {
      setModal({ type: "error", msg: (data && data.error) || "No se pudo completar la compra." });
      return null;
    }
    await loadAll();
    return data;
  }

  function txtCosto(precio) {
    return isAdmin ? "Sos admin: no se te descuentan Petros." : `Se descontarán ₽${precio} de tu saldo.`;
  }
  function comprarItem(it) {
    setDetail(null);
    if (it.tipo === "frame") { setFramePicker(it.key); setSpyPicker(null); return; }
    if (it.tipo === "espiar") { setSpyPicker(it.key); setFramePicker(null); return; }
    if (it.tipo === "caja") { abrirCaja(it); return; }
    if (it.tipo === "sobre") { abrirSobre(it); return; }
    setConfirm({
      titulo: `¿Comprar "${it.nombre}"?`,
      texto: txtCosto(it.precio),
      onOk: async () => {
        setConfirm(null);
        const r = await comprar(it.key);
        if (r && r.ok) setModal(it.tipo === "gag" ? { type: "gag", item: it } : { type: "generic", item: it });
      },
    });
  }
  function abrirCaja(it) {
    setConfirm({
      titulo: `¿Abrir "${it.nombre}"?`,
      texto: txtCosto(it.precio),
      onOk: async () => {
        setConfirm(null);
        setBusy(it.key);
        const { data, error } = await sb.rpc("abrir_caja", { p_box_key: it.key });
        setBusy(null);
        if (error || !data || !data.ok) {
          setModal({ type: "error", msg: (data && data.error) || "No se pudo abrir la caja." });
          return;
        }
        await loadAll();
        if (onRefresh) onRefresh();
        setModal({ type: "caja", won: data.won, fase: "ruleta" });
      },
    });
  }
  function abrirSobre(it) {
    setConfirm({
      titulo: `¿Abrir "${it.nombre}"?`,
      texto: txtCosto(it.precio),
      onOk: async () => {
        setConfirm(null);
        setBusy(it.key);
        const { data, error } = await sb.rpc("abrir_sobre", { p_sobre_key: it.key });
        setBusy(null);
        if (error || !data || !data.ok) {
          setModal({ type: "error", msg: (data && data.error) || "No se pudo abrir el sobre." });
          return;
        }
        await loadAll();
        if (onRefresh) onRefresh();
        setModal({ type: "sobre_ok", cromos: data.cromos || [] });
      },
    });
  }
  function comprarFrame(itemKey, frameKey, precio) {
    setConfirm({
      titulo: `¿Comprar el marco "${frameKey}"?`,
      texto: txtCosto(precio),
      onOk: async () => {
        setConfirm(null);
        const r = await comprar(itemKey, { frame: frameKey });
        if (r && r.ok) { setFramePicker(null); if (onRefresh) onRefresh(); setModal({ type: "frame_ok", frameKey }); }
      },
    });
  }
  function comprarEspiar(itemKey, target, precio) {
    setConfirm({
      titulo: `¿Espiar a ${target.name}?`,
      texto: txtCosto(precio),
      onOk: async () => {
        setConfirm(null);
        const r = await comprar(itemKey, { target_id: target.id, target_name: target.name });
        if (r && r.ok) {
          setSpyPicker(null);
          const { data: last } = await sb.from("store_purchases").select("id")
            .eq("user_id", user.id).eq("item_key", itemKey)
            .order("created_at", { ascending: false }).limit(1);
          const pid = (last && last[0] && last[0].id) || (String(target.id) + itemKey);
          setModal({ type: "espiar", target, fakes: spyFakes(pid) });
          if (target.id !== user.id) {
            sb.rpc("avisar_espionaje", { p_target_id: target.id });
            sendPushNotification("users", [target.id], {
              title: "🕵️ Te quisieron espiar",
              body: `${user.profile?.name || "Alguien"} intentó espiar tus resultados pero no tuvo suerte`,
              tag: `spy-${target.id}-${Date.now()}`, url: "/",
            });
          }
        }
      },
    });
  }

  // ── gestión admin ──
  async function subirImagen(file) {
    setSubiendo(true);
    const blob = await compressImg(file, 700, 0.82);
    const path = `poster_${Date.now()}.jpg`;
    const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
    if (up.error) { setSubiendo(false); setModal({ type: "error", msg: "No se pudo subir la imagen: " + up.error.message }); return; }
    const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
    setNuevo(n => ({ ...n, imagen_url: pub.publicUrl }));
    setSubiendo(false);
  }
  async function guardarNuevo() {
    if (!nuevo.key.trim() || !nuevo.nombre.trim()) { setModal({ type: "error", msg: "Completá clave y nombre." }); return; }
    setGuardando(true);
    const payload = nuevo.tipo === "gag" ? { titulo: nuevo.titulo, texto: nuevo.texto } : null;
    const { error } = await sb.from("store_items").insert({
      key: nuevo.key.trim(), nombre: nuevo.nombre.trim(), emoji: nuevo.emoji || null,
      precio: Number(nuevo.precio) || 0, tipo: nuevo.tipo, descripcion: nuevo.descripcion || null,
      imagen_url: nuevo.imagen_url || null, payload, activo: true,
    });
    setGuardando(false);
    if (error) { setModal({ type: "error", msg: "No se pudo crear: " + error.message }); return; }
    setNuevo({ key: "", nombre: "", emoji: "", tipo: "generico", precio: 10, descripcion: "", titulo: "", texto: "", imagen_url: "" });
    loadAll();
  }
  async function guardarPrecio(key) {
    const v = Number(precioEdits[key]);
    if (isNaN(v)) return;
    await sb.from("store_items").update({ precio: v }).eq("key", key);
    setPrecioEdits(e => { const c = { ...e }; delete c[key]; return c; });
    loadAll();
  }
  async function toggleActivo(it) {
    await sb.from("store_items").update({ activo: !it.activo }).eq("key", it.key);
    loadAll();
  }
  async function borrarItem(key) {
    await sb.from("store_items").delete().eq("key", key);
    loadAll();
  }
  function startEdit(it) {
    setEditando(it.key);
    setEditForm({
      nombre: it.nombre || "", emoji: it.emoji || "", tipo: it.tipo || "generico",
      precio: it.precio, descripcion: it.descripcion || "",
      titulo: (it.payload && it.payload.titulo) || "", texto: (it.payload && it.payload.texto) || "",
      imagen_url: it.imagen_url || "",
    });
  }
  async function subirImagenEdit(file) {
    setEditSubiendo(true);
    const blob = await compressImg(file, 700, 0.82);
    const path = `item_${Date.now()}.jpg`;
    const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
    if (up.error) { setEditSubiendo(false); setModal({ type: "error", msg: "No se pudo subir la imagen: " + up.error.message }); return; }
    const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
    setEditForm(f => ({ ...f, imagen_url: pub.publicUrl }));
    setEditSubiendo(false);
  }
  async function guardarEdicion() {
    if (!editForm.nombre.trim()) { setModal({ type: "error", msg: "El nombre no puede quedar vacío." }); return; }
    setGuardandoEdit(true);
    const payload = editForm.tipo === "gag" ? { titulo: editForm.titulo, texto: editForm.texto } : null;
    const { error } = await sb.from("store_items").update({
      nombre: editForm.nombre.trim(), emoji: editForm.emoji || null,
      precio: Number(editForm.precio) || 0, tipo: editForm.tipo,
      descripcion: editForm.descripcion || null, imagen_url: editForm.imagen_url || null, payload,
    }).eq("key", editando);
    setGuardandoEdit(false);
    if (error) { setModal({ type: "error", msg: "No se pudo guardar: " + error.message }); return; }
    setEditando(null); setEditForm(null);
    loadAll();
  }

  const otros = (profiles || []).filter(p => p.id !== user.id);
  const inp = { padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none", width: "100%" };

  return (
    <div className="container">
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>🛒 Tienda</h2>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Ganás 1 Petro por cada punto que sumás en los partidos.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ textAlign: "right", background: "rgba(245,183,49,0.12)", border: "1px solid rgba(245,183,49,0.35)", borderRadius: 12, padding: "8px 14px" }}>
              <div style={{ fontSize: 12, color: "var(--txt)", fontWeight: 700, letterSpacing: 0.5 }}>TUS PETROS</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gold)", lineHeight: 1.1, marginTop: 3, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}><PetroCoin size={24} /> {isAdmin ? "∞" : saldo}</div>
            </div>
            <button onClick={() => setPacksOpen(true)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>＋ Conseguí más Petros</button>
          </div>
        </div>
        <div className="pre-tabs" style={{ marginTop: 14 }}>
          <button className={`pre-tab ${sub === "comprar" ? "active" : ""}`} onClick={() => setSub("comprar")}>🛍️ Comprar</button>
          <button className={`pre-tab ${sub === "compras" ? "active" : ""}`} onClick={() => setSub("compras")}>🎒 Mis compras</button>
          {isAdmin && <button className={`pre-tab ${sub === "gestion" ? "active" : ""}`} onClick={() => setSub("gestion")}>⚙️ Gestión</button>}
        </div>
      </div>

      {sub === "comprar" && (
        <div className="tienda-grid">
          {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando…</div>
            : visibles.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No hay ítems disponibles por ahora.</div>
            : visibles.map(it => {
            const noPlata = !isAdmin && saldo < it.precio;
            const cargando = busy === it.key;
            return (
              <div key={it.key} className="tienda-item">
                <div className="tienda-row">
                  <div onClick={() => setDetail(it)} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, cursor: "pointer" }}>
                    {it.imagen_url
                      ? <img src={it.imagen_url} alt="" className="tienda-thumb" />
                      : <div className="tienda-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, background: "var(--surface)" }}>{it.emoji || "🎁"}</div>}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{it.nombre}</div>
                      {it.descripcion && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{it.descripcion}</div>}
                      {it.tipo === "frame" && miMarco && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 4 }}>Tenés equipado: {miMarco}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span className="tienda-price"><PetroCoin size={14} /> {it.precio}</span>
                    <button onClick={() => comprarItem(it)} disabled={noPlata || cargando} className="tienda-buy"
                      style={{ background: noPlata ? "var(--surface)" : "linear-gradient(135deg,#f5d36b,#e0a92e)", color: noPlata ? "var(--muted)" : "#1a1a1a", cursor: noPlata ? "not-allowed" : "pointer", opacity: cargando ? .6 : 1 }}>
                      {cargando ? "…" : noPlata ? "Sin Petros" : it.tipo === "frame" ? "Elegir" : it.tipo === "espiar" ? "Espiar" : (it.tipo === "caja" || it.tipo === "sobre") ? "Abrir" : "Comprar"}
                    </button>
                  </div>
                </div>

                {it.tipo === "frame" && framePicker === it.key && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Elegí un color (se descuentan <PetroCoin size={13} /> {it.precio}):</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {STORE_FRAMES.map(f => (
                        <button key={f.key} onClick={() => comprarFrame(it.key, f.key, it.precio)} disabled={busy === it.key} title={f.nombre}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface)", boxShadow: `0 0 0 2px ${f.color}, 0 0 10px ${f.color}99`, display: "block" }} />
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>{f.nombre}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setFramePicker(null)} style={{ marginTop: 10, background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: 0 }}>Cancelar</button>
                  </div>
                )}

                {it.tipo === "espiar" && spyPicker === it.key && (
                  <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>¿A quién querés espiar? (se descuentan <PetroCoin size={13} /> {it.precio})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                      {otros.map(o => (
                        <button key={o.id} onClick={() => comprarEspiar(it.key, o, it.precio)} disabled={busy === it.key}
                          style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", textAlign: "left" }}>
                          <Avatar profile={o} size="sm" />
                          <span style={{ fontSize: 13, color: "var(--txt)" }}>{o.name}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setSpyPicker(null)} style={{ marginTop: 10, background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", padding: 0 }}>Cancelar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sub === "compras" && (() => {
        const itemByKey = {}; items.forEach(i => { itemByKey[i.key] = i; });
        const profileById = {}; (profiles || []).forEach(p => { profileById[p.id] = p; });
        const lista = (isAdmin && comprasView === "todas") ? allPurchases : purchases;
        const fmt = (d) => new Date(d).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <div>
            {isAdmin && (
              <div className="pre-tabs" style={{ marginBottom: 14 }}>
                <button className={`pre-tab ${comprasView === "mias" ? "active" : ""}`} onClick={() => setComprasView("mias")}>Mías</button>
                <button className={`pre-tab ${comprasView === "todas" ? "active" : ""}`} onClick={() => setComprasView("todas")}>Todas ({allPurchases.length})</button>
              </div>
            )}
            {lista.length === 0
              ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Todavía no hay compras por acá.</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lista.map(p => {
                    const it = itemByKey[p.item_key];
                    const buyer = profileById[p.user_id];
                    const esEspia = it && it.tipo === "espiar";
                    return (
                      <div key={p.id} onClick={esEspia ? () => reSpy(p) : undefined} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: esEspia ? "pointer" : "default" }}>
                        {it && it.imagen_url
                          ? <img src={it.imagen_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ fontSize: 26, width: 40, textAlign: "center", flexShrink: 0 }}>{(it && it.emoji) || "🎁"}</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{(it && it.nombre) || p.item_key}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                            {isAdmin && comprasView === "todas" ? `${(buyer && buyer.name) || "?"} · ` : ""}{fmt(p.created_at)}
                          </div>
                          {esEspia && <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 3, fontWeight: 600 }}>👁️ Tocá para volver a ver lo espiado</div>}
                        </div>
                        <span className="tienda-price"><PetroCoin size={13} /> {p.precio}</span>
                      </div>
                    );
                  })}
                </div>}
          </div>
        );
      })()}

      {sub === "gestion" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎟️ Códigos de Petros</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Generar código por</span>
              <input type="number" value={nuevoCodCant} onChange={e => setNuevoCodCant(e.target.value)} style={{ width: 90, padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none" }} />
              <span style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}><PetroCoin size={14} /> Petros</span>
              <button onClick={generarCodigo} disabled={generando} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{generando ? "…" : "Generar"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {codigos.length === 0
                ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Todavía no generaste códigos.</div>
                : codigos.map(c => {
                    const buyer = (profiles || []).find(p => p.id === c.usado_por);
                    return (
                      <div key={c.codigo} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", flexWrap: "wrap", opacity: c.usado_por ? .55 : 1 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, letterSpacing: 1, color: c.usado_por ? "var(--muted)" : "var(--gold)" }}>{c.codigo}</span>
                        <span style={{ fontSize: 12, color: "var(--txt)", display: "flex", alignItems: "center", gap: 3 }}><PetroCoin size={12} /> {c.cantidad}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: "var(--muted)", textAlign: "right" }}>{c.usado_por ? `Usado por ${(buyer && buyer.name) || "alguien"}` : "Sin usar"}</span>
                        {!c.usado_por && (<>
                          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(c.codigo); }} title="Copiar" style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--blue)", fontSize: 12, cursor: "pointer" }}>📋</button>
                          <button onClick={() => borrarCodigo(c.codigo)} title="Borrar" style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "none", color: "var(--red)", fontSize: 14, cursor: "pointer" }}>🗑️</button>
                        </>)}
                      </div>
                    );
                  })}
            </div>
          </div>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>➕ Nuevo ítem</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input style={{ ...inp, flex: "1 1 120px" }} placeholder="clave (sin espacios)" value={nuevo.key} onChange={e => setNuevo(n => ({ ...n, key: e.target.value.replace(/\s/g, "_") }))} />
                <input style={{ ...inp, flex: "2 1 160px" }} placeholder="Nombre visible" value={nuevo.nombre} onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input style={{ ...inp, flex: "0 1 80px" }} placeholder="emoji" value={nuevo.emoji} onChange={e => setNuevo(n => ({ ...n, emoji: e.target.value }))} />
                <input style={{ ...inp, flex: "0 1 100px" }} type="number" placeholder="precio" value={nuevo.precio} onChange={e => setNuevo(n => ({ ...n, precio: e.target.value }))} />
                <select style={{ ...inp, flex: "1 1 160px" }} value={nuevo.tipo} onChange={e => setNuevo(n => ({ ...n, tipo: e.target.value }))}>
                  {Object.entries(TIPO_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <input style={inp} placeholder="Descripción (opcional)" value={nuevo.descripcion} onChange={e => setNuevo(n => ({ ...n, descripcion: e.target.value }))} />
              {nuevo.tipo === "gag" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input style={{ ...inp, flex: "1 1 140px" }} placeholder='Título del cartel (ej: "¡Ohh, era falso!!")' value={nuevo.titulo} onChange={e => setNuevo(n => ({ ...n, titulo: e.target.value }))} />
                  <input style={{ ...inp, flex: "1 1 140px" }} placeholder="Texto del cartel" value={nuevo.texto} onChange={e => setNuevo(n => ({ ...n, texto: e.target.value }))} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--txt)", fontSize: 13, cursor: "pointer" }}>
                  {subiendo ? "Subiendo…"
                    : nuevo.imagen_url ? (nuevo.tipo === "poster" ? "🖼️ Cambiar imagen" : "🖼️ Cambiar miniatura")
                    : (nuevo.tipo === "poster" ? "🖼️ Subir imagen del póster" : "🖼️ Subir miniatura (opcional)")}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) subirImagen(e.target.files[0]); }} />
                </label>
                {nuevo.imagen_url && <img src={nuevo.imagen_url} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }} />}
                {nuevo.imagen_url && <button onClick={() => setNuevo(n => ({ ...n, imagen_url: "" }))} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer" }}>Quitar</button>}
              </div>
              <button onClick={guardarNuevo} disabled={guardando} style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{guardando ? "Guardando…" : "Crear ítem"}</button>
            </div>
          </div>

          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📦 Ítems ({items.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map(it => (
                <div key={it.key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", flexWrap: "wrap" }}>
                    {it.imagen_url
                      ? <img src={it.imagen_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                      : <span style={{ fontSize: 20 }}>{it.emoji || "🎁"}</span>}
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{it.nombre}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{it.key} · {it.tipo}{!it.activo ? " · inactivo" : ""}</div>
                    </div>
                    <input type="number" value={precioEdits[it.key] !== undefined ? precioEdits[it.key] : it.precio}
                      onChange={e => setPrecioEdits(p => ({ ...p, [it.key]: e.target.value }))}
                      style={{ width: 70, padding: "5px 8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--txt)", fontSize: 13, outline: "none" }} />
                    {precioEdits[it.key] !== undefined && precioEdits[it.key] != it.precio && (
                      <button onClick={() => guardarPrecio(it.key)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "var(--green)", color: "#07140c", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💾</button>
                    )}
                    <button onClick={() => editando === it.key ? (setEditando(null), setEditForm(null)) : startEdit(it)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: editando === it.key ? "var(--gold)" : "none", color: editando === it.key ? "#1a1a1a" : "var(--blue)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✏️ Editar</button>
                    <button onClick={() => toggleActivo(it)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: it.activo ? "var(--green)" : "var(--muted)", fontSize: 12, cursor: "pointer" }}>{it.activo ? "Activo" : "Off"}</button>
                    <button onClick={() => borrarItem(it.key)} style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "none", color: "var(--red)", fontSize: 14, cursor: "pointer" }}>🗑️</button>
                  </div>
                  {editando === it.key && editForm && (
                    <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <input style={inp} placeholder="Nombre visible" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input style={{ ...inp, flex: "0 1 80px" }} placeholder="emoji" value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} />
                        <input style={{ ...inp, flex: "0 1 100px" }} type="number" placeholder="precio" value={editForm.precio} onChange={e => setEditForm(f => ({ ...f, precio: e.target.value }))} />
                        <select style={{ ...inp, flex: "1 1 160px" }} value={editForm.tipo} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}>
                          {Object.entries(TIPO_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <input style={inp} placeholder="Descripción (opcional)" value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                      {editForm.tipo === "gag" && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input style={{ ...inp, flex: "1 1 140px" }} placeholder="Título del cartel" value={editForm.titulo} onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
                          <input style={{ ...inp, flex: "1 1 140px" }} placeholder="Texto del cartel" value={editForm.texto} onChange={e => setEditForm(f => ({ ...f, texto: e.target.value }))} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--txt)", fontSize: 13, cursor: "pointer" }}>
                          {editSubiendo ? "Subiendo…" : editForm.imagen_url ? "🖼️ Cambiar imagen" : "🖼️ Subir imagen (opcional)"}
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) subirImagenEdit(e.target.files[0]); }} />
                        </label>
                        {editForm.imagen_url && <img src={editForm.imagen_url} alt="" style={{ width: 40, height: 40, borderRadius: 7, objectFit: "cover" }} />}
                        {editForm.imagen_url && <button onClick={() => setEditForm(f => ({ ...f, imagen_url: "" }))} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer" }}>Quitar</button>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={guardarEdicion} disabled={guardandoEdit} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--green)", color: "#07140c", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{guardandoEdit ? "Guardando…" : "Guardar cambios"}</button>
                        <button onClick={() => { setEditando(null); setEditForm(null); }} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {packsOpen && (
        <div onClick={() => { setPacksOpen(false); setPackPick(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1050, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 520, width: "100%", padding: 22, maxHeight: "86vh", overflowY: "auto" }}>
            {!packPick ? (<>
              <div style={{ textAlign: "center", fontSize: 20, fontWeight: 800 }}>💰 Conseguí más Petros</div>
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 4, marginBottom: 16 }}>Elegí un pack y canjealo con tu código.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                {PETRO_PACKS.map(pk => (
                  <button key={pk.cant} onClick={() => { setPackPick(pk); setCodigo(""); }}
                    style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "stretch", background: "linear-gradient(160deg,#f5d36b,#cf9620)", border: "none", borderRadius: 14, padding: 0, cursor: "pointer", overflow: "hidden", color: "#3a2c05" }}>
                    <div style={{ background: pk.badge ? "#e53950" : "transparent", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 0", letterSpacing: 0.5, textAlign: "center", minHeight: 15 }}>{pk.badge || ""}</div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 8px 10px" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, textShadow: "0 1px 0 rgba(255,255,255,.45)" }}>{pk.cant}</div>
                      <PetroCoin size={38} />
                    </div>
                    <div style={{ background: "rgba(0,0,0,.4)", color: "#fff", fontWeight: 800, fontSize: 15, padding: "8px 0", textAlign: "center" }}>{pk.precio}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setPacksOpen(false)} style={{ marginTop: 16, width: "100%", padding: "9px 0", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
            </>) : (<>
              <div style={{ textAlign: "center", fontSize: 19, fontWeight: 800 }}>Canjear código</div>
              <div style={{ textAlign: "center", margin: "12px 0 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 800, color: "var(--gold)", fontSize: 18 }}><PetroCoin size={20} /> Pack de {packPick.cant} · {packPick.precio}</div>
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>Ingresá el código que te dio el admin.</div>
              <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === "Enter") canjear(codigo); }} placeholder="PETRO-XXXXX" maxLength={40} autoFocus
                style={{ width: "100%", padding: "11px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, color: "var(--txt)", fontSize: 16, letterSpacing: 1, textAlign: "center", outline: "none" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button onClick={() => canjear(codigo)} disabled={canjeando || !codigo.trim()} style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: (canjeando || !codigo.trim()) ? .6 : 1 }}>{canjeando ? "Canjeando…" : "Canjear"}</button>
                <button onClick={() => setPackPick(null)} style={{ padding: "11px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Volver</button>
              </div>
            </>)}
          </div>
        </div>
      )}
      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 420, width: "100%", padding: "22px 22px", textAlign: "center" }}>
            {detail.imagen_url
              ? <img src={detail.imagen_url} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14 }} />
              : <div style={{ fontSize: 64 }}>{detail.emoji || "🎁"}</div>}
            <div style={{ fontSize: 21, fontWeight: 800 }}>{detail.nombre}</div>
            {detail.descripcion && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{detail.descripcion}</div>}
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--gold)", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><PetroCoin size={18} /> {detail.precio}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
              <button onClick={() => comprarItem(detail)} disabled={!isAdmin && saldo < detail.precio}
                style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: (!isAdmin && saldo < detail.precio) ? "var(--surface)" : "var(--gold)", color: (!isAdmin && saldo < detail.precio) ? "var(--muted)" : "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: (!isAdmin && saldo < detail.precio) ? "not-allowed" : "pointer" }}>
                {(!isAdmin && saldo < detail.precio) ? "Sin Petros" : detail.tipo === "frame" ? "Elegir" : detail.tipo === "espiar" ? "Espiar" : (detail.tipo === "caja" || detail.tipo === "sobre") ? "Abrir" : "Comprar"}
              </button>
              <button onClick={() => setDetail(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: "100%", padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{confirm.titulo}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>{confirm.texto}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
              <button onClick={confirm.onOk} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Confirmar</button>
              <button onClick={() => setConfirm(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 380, width: "100%", padding: "24px 22px", textAlign: "center" }}>
            {modal.type === "canje_ok" && (<>
              <div style={{ fontSize: 52 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>¡Código canjeado!</div>
              <div style={{ fontSize: 15, color: "var(--gold)", fontWeight: 800, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><PetroCoin size={18} /> +{modal.cantidad} Petros</div>
            </>)}
            {modal.type === "gag" && (<>
              <div style={{ fontSize: 52 }}>{modal.item.emoji || "🃏"}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>{(modal.item.payload && modal.item.payload.titulo) || "¡Ohh, era falso!!"}</div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>{(modal.item.payload && modal.item.payload.texto) || "Suerte para la próxima :("}</div>
            </>)}
            {modal.type === "frame_ok" && (<>
              <div style={{ fontSize: 52 }}>🖼️</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>¡Marco equipado!</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Tu avatar ahora tiene el marco <b>{modal.frameKey}</b>.</div>
            </>)}
            {modal.type === "espiar" && (<>
              <div style={{ fontSize: 40 }}>🕵️</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6 }}>Pronósticos de {modal.target.name}</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
                {modal.fakes.length === 0
                  ? <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>No hay partidos bloqueados para espiar ahora… o te están escondiendo algo. 👀</div>
                  : modal.fakes.map((f, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px" }}>
                        <span style={{ color: "var(--txt)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.m.home} vs {f.m.away}</span>
                        <span style={{ color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>{f.h} - {f.a}</span>
                      </div>
                    ))}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 10, fontStyle: "italic" }}>Fuentes 100% confiables 🤞</div>
            </>)}
            {modal.type === "generic" && (<>
              {modal.item.imagen_url
                ? <img src={modal.item.imagen_url} alt="" style={{ maxWidth: "100%", borderRadius: 10, marginBottom: 10 }} />
                : <div style={{ fontSize: 52 }}>{modal.item.emoji || "🎁"}</div>}
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 8 }}>¡Lo conseguiste!</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{modal.item.nombre}</div>
            </>)}
            {modal.type === "error" && (<>
              <div style={{ fontSize: 44 }}>😬</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{modal.msg}</div>
            </>)}
            {modal.type === "caja" && (<>
              <style>{`@keyframes cajaPop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}`}</style>
              {modal.fase === "ruleta"
                ? <Ruleta pool={visibles.filter(i => i.tipo !== "caja")} won={modal.won} onFinish={() => setModal(m => (m && m.type === "caja") ? { ...m, fase: "premio" } : m)} />
                : !modal.won ? (<>
                    <div style={{ fontSize: 56 }}>🍃</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>¡Nada! 😢</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Esta vez la caja salió vacía. ¡La próxima será!</div>
                  </>) : (<>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", letterSpacing: 1.5 }}>¡TE TOCÓ!</div>
                    <div style={{ animation: "cajaPop .5s ease-out", marginTop: 10 }}>
                      {modal.won.imagen_url
                        ? <img src={modal.won.imagen_url} alt="" style={{ maxWidth: "70%", borderRadius: 12 }} />
                        : <div style={{ fontSize: 66 }}>{modal.won.emoji || "🎁"}</div>}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{modal.won.nombre}</div>
                    {modal.won.tipo === "frame" && modal.won.frame && <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 6 }}>Marco <b>{modal.won.frame}</b> equipado en tu avatar.</div>}
                  </>)}
            </>)}
            {modal.type === "sobre_ok" && (<>
              <style>{`@keyframes cajaPop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}`}</style>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", letterSpacing: 1.5 }}>¡ABRISTE UN SOBRE!</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 14 }}>
                {modal.cromos.map((cr, i) => {
                  const p = (profiles || []).find(x => x.id === cr.id);
                  if (!p) return null;
                  const raro = p.cromo_rareza === "raro";
                  return (
                    <div key={i} style={{ position: "relative", width: 84, borderRadius: 10, padding: "12px 4px 8px", textAlign: "center", border: raro ? "1px solid var(--gold)" : "1px solid var(--border)", background: raro ? "linear-gradient(160deg,rgba(245,183,49,.2),var(--card))" : "var(--card)", animation: `cajaPop .4s ease-out ${i * 0.12}s both` }}>
                      <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, fontWeight: 800, color: "var(--muted)" }}>#{p.cromo_numero || "?"}</div>
                      {raro && <div style={{ position: "absolute", top: 4, right: 6, fontSize: 10 }}>⭐</div>}
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}><CromoFoto profile={p} size={48} /></div>
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 9, fontWeight: 800, marginTop: 3, color: cr.nuevo ? "var(--green)" : "var(--muted)" }}>{cr.nuevo ? "¡NUEVO!" : "REPE"}</div>
                    </div>
                  );
                })}
              </div>
            </>)}
            {!(modal.type === "caja" && modal.fase === "ruleta") && (
              <button onClick={() => setModal(null)} style={{ marginTop: 18, padding: "9px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NFT: carta con efectos por rareza y número dinámico ───────────────────────
function NFTCard({ nft, edition = null, big = false }) {
  const rc = nft.rareza === "legendary" ? "r-legendary" : nft.rareza === "limited" ? "r-limited" : "r-common";
  const ref = React.useRef(null);
  function onMove(e) {
    if (!big) return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", ((0.5 - py) * 18).toFixed(2) + "deg");
    el.style.setProperty("--ry", ((px - 0.5) * 22).toFixed(2) + "deg");
    el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
    el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
  }
  function onLeave() {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
  }
  const st = { "--nx": nft.num_x != null ? nft.num_x : 50, "--ny": nft.num_y != null ? nft.num_y : 90, "--ns": nft.num_size != null ? nft.num_size : 9 };
  return (
    <div ref={ref} className={`${big ? "nftbig" : "nftcard"} ${rc}`} onPointerMove={onMove} onPointerLeave={onLeave} style={st}>
      <div className={big ? "nftbig-art" : "nftimg"} style={{ backgroundImage: `url(${nft.imagen_url})` }} />
      {nft.rareza !== "common" && <div className="nft-holo" />}
      {nft.rareza !== "common" && <div className="nft-sheen" />}
      {big && <div className="nft-glare" />}
      {nft.rareza !== "common" && [0, 1, 2, 3].map(i => <span key={i} className={`nft-spark s${i}`} />)}
      <div className="nft-frame" />
      {nft.rareza === "limited" && edition != null && (() => {
        const ns = nft.num_size != null ? Number(nft.num_size) : 8;
        const nx = nft.num_x != null ? Number(nft.num_x) : 50;
        const ny = nft.num_y != null ? Number(nft.num_y) : 90;
        return (
          <svg className="nft-num-svg" viewBox="0 0 100 133.93" preserveAspectRatio="none">
            <text x={nx} y={(ny / 100) * 133.93} fontSize={ns} textAnchor="middle" dominantBaseline="central"
              fontFamily="'DejaVu Serif',Georgia,'Times New Roman',serif" fontWeight="700"
              fill="#eef7fa" stroke="#0a0f1e" strokeWidth={ns * 0.06} paintOrder="stroke" style={{ letterSpacing: ".3px" }}>
              {String(edition).padStart(2, "0")}<tspan fontSize={ns * 0.62} fill="#c4d2ee">/{nft.supply_max || 19}</tspan>
            </text>
          </svg>
        );
      })()}
    </div>
  );
}

// ── Colección de NFT ──────────────────────────────────────────────────────────
const NFT_RAR = { common: { t: "Común", c: "#9fb0c9" }, limited: { t: "Limited", c: "#bcd0f5" }, legendary: { t: "Legendary", c: "#f5d97a" } };
const REACT_EMOJIS = ["🔥", "❤️", "😍", "👀", "😂", "🐐"];

// Agrupación de las subpestañas de Colección en secciones con toggle interno
const NFT_GRUPOS = [
  { key: "mis", label: "Mis cartas", emoji: "🎒", subs: [["sobres", "🎁", "Sobres"], ["mia", "🃏", "Mi colección"]] },
  { key: "explorar", label: "Explorar", emoji: "🔎", subs: [["galeria", "🌐", "Galería"], ["ranking", "🏆", "Ranking"]] },
  { key: "mercado", label: "Mercado", emoji: "🔁", subs: [["trades", "🔄", "Intercambios"], ["subastas", "🔨", "Subastas"]] },
  { key: "gestion", label: "Gestión", emoji: "⚙️", adminOnly: true, subs: [["admin", "⚙️", "Gestión"]] },
];

// Agrupación de la barra principal en secciones con toggle interno
const APP_GRUPOS = [
  { key: "inicio", label: "Inicio", emoji: "🏠", tabs: [["home", "🏠", "Inicio"]] },
  { key: "jugar", label: "Predicciones", emoji: "🎯", tabs: [["predicciones", "🎯", "Predicciones"]] },
  { key: "resultados", label: "Resultados", emoji: "🏆", tabs: [["standings", "📊", "Posiciones"], ["stats", "🌟", "Stats"], ["compare", "👁️", "Comparar"]] },
  { key: "comunidad", label: "Comunidad", emoji: "📰", tabs: [["cronica", "📰", "Crónica"], ["fame", "🏅", "Salón de la Fama"]] },
  { key: "coleccionables", label: "Coleccionables", emoji: "🃏", tabs: [["coleccion", "🃏", "Colección"], ["tienda", "🛒", "Tienda"]] },
  { key: "info", label: "Info", emoji: "📋", tabs: [["info", "📋", "Info"]] },
  { key: "adminG", label: "Admin", emoji: "🔧", adminOnly: true, tabs: [["admin", "🔧", "Admin"]] },
];

// ms hasta la próxima medianoche de Aruba (UTC-4), que es cuando se resetean los sobres
function msUntilArubaMidnight() {
  const now = new Date();
  const aruba = new Date(now.getTime() - 4 * 3600 * 1000);
  const nextMid = Date.UTC(aruba.getUTCFullYear(), aruba.getUTCMonth(), aruba.getUTCDate() + 1, 0, 0, 0);
  return (nextMid + 4 * 3600 * 1000) - now.getTime();
}
function ResetCountdown({ style }) {
  const [ms, setMs] = useState(() => msUntilArubaMidnight());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilArubaMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return <span style={style}>{h}h {String(m).padStart(2, "0")}m {String(sec).padStart(2, "0")}s</span>;
}

// Cuenta regresiva a un instante puntual (ms epoch)
function Countdown({ targetMs, style }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return <span style={style}>{h}h {String(m).padStart(2, "0")}m {String(sec).padStart(2, "0")}s</span>;
}

// Sobre de cartas dibujado (foil con borde crimpado), tematizado por variante
function PackIcon({ variant }) {
  const themes = {
    cinco: { c1: "#60a5fa", c2: "#1d4ed8", crimp: "#bfdbfe", band: "#1e3a8a", star: "#eaf2ff" },
    triple: { c1: "#f472b6", c2: "#7c3aed", crimp: "#fbcfe8", band: "#6d28d9", star: "#fde68a" },
  };
  const t = themes[variant] || themes.cinco;
  const id = "pk_" + variant;
  let zig = "M6,7 L60,7 L60,14 ";
  let down = true;
  for (let x = 60; x >= 6; x -= 4) { zig += `L${x},${down ? 17.5 : 14} `; down = !down; }
  zig += "Z";
  return (
    <svg viewBox="0 0 66 86" width="66" height="86" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id + "_b"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c2} />
        </linearGradient>
        <linearGradient id={id + "_s"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.55" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="54" height="74" rx="8" fill={`url(#${id}_b)`} stroke="rgba(255,255,255,.28)" strokeWidth="1" />
      <path d={zig} fill={t.crimp} />
      <rect x="6" y="40" width="54" height="13" fill={t.band} opacity="0.55" />
      <path d="M33 41.3 l1.8 3.9 l4.2 .4 l-3.2 2.8 l1 4.1 l-3.8-2.3 l-3.8 2.3 l1-4.1 l-3.2-2.8 l4.2-.4 Z" fill={t.star} />
      <path d="M12 6 L22 6 L13 80 L6 80 L6 70 Z" fill={`url(#${id}_s)`} />
    </svg>
  );
}
const rarRank = { legendary: 0, limited: 1, common: 2 };

// ── Dorso de carta (boca abajo) ───────────────────────────────────────────────
function CardBack({ rareza }) {
  const col = rareza === "limited" ? "190,215,255" : "245,217,122";
  return (
    <div className="cardback">
      <svg viewBox="0 0 100 133.93" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="50" cy="50" r="19" fill="none" stroke={`rgba(${col},.7)`} strokeWidth="1.1" />
        <text x="50" y="50.5" textAnchor="middle" dominantBaseline="central" fontFamily="'Bebas Neue',sans-serif" fontSize="24" fill={`rgb(${col})`}>?</text>
        <text x="50" y="84" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="6.5" letterSpacing="1.2" fill={`rgba(${col},.85)`}>QUINIELA MUNDIAL</text>
        <text x="50" y="122" textAnchor="middle" fontFamily="sans-serif" fontSize="4.6" fill="rgba(255,255,255,.5)">Tocá para revelar</text>
      </svg>
    </div>
  );
}

// ── Modal de apertura de sobre con volteo + animaciones por rareza ────────────
// ── Sonidos de apertura (Web Audio API, sin archivos · anda en iPhone con un toque) ──
let _ac = null;
function _audio() {
  try {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === "suspended") _ac.resume();
    return _ac;
  } catch (e) { return null; }
}
function _sndOn() { try { return localStorage.getItem("snd_off") !== "1"; } catch (e) { return true; } }
function playTear() {
  if (!_sndOn()) return;
  const ac = _audio(); if (!ac) return;
  const t = ac.currentTime, dur = 0.45;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = ac.createBufferSource(); src.buffer = buf;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(1300, t); bp.frequency.exponentialRampToValueAtTime(380, t + dur); bp.Q.value = 0.8;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(t); src.stop(t + dur);
}
function playFlip() {
  if (!_sndOn()) return;
  const ac = _audio(); if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(840, t + 0.08);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.13);
}
function playLegendary() {
  if (!_sndOn()) return;
  const ac = _audio(); if (!ac) return;
  const t = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach(function (f, i) {
    const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = ac.createGain(); const st = t + i * 0.1;
    g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.24, st + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.9);
    o.connect(g); g.connect(ac.destination); o.start(st); o.stop(st + 0.95);
  });
  const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 1568;
  const g2 = ac.createGain(); g2.gain.setValueAtTime(0.0001, t + 0.22); g2.gain.exponentialRampToValueAtTime(0.11, t + 0.32); g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  o2.connect(g2); g2.connect(ac.destination); o2.start(t + 0.22); o2.stop(t + 1.35);
}

function RevealModal({ items, godpack, tipo, onClose }) {
  const [flipped, setFlipped] = useState(() => items.map(() => false));
  const [epic, setEpic] = useState(false);
  const [big, setBig] = useState(null);
  const [phase, setPhase] = useState(items.length ? "pack" : "cards");
  const [tearing, setTearing] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [mute, setMute] = useState(() => { try { return localStorage.getItem("snd_off") === "1"; } catch (e) { return false; } });
  const w = items.length >= 3 ? 102 : items.length === 2 ? 150 : 230;
  const packType = godpack ? "god" : (tipo === "triple" ? "triple" : "cinco");

  function fireConfetti() { setConfetti(false); requestAnimationFrame(() => setConfetti(true)); setTimeout(() => setConfetti(false), 2200); }
  function toggleMute() { const nv = !mute; setMute(nv); try { localStorage.setItem("snd_off", nv ? "1" : "0"); } catch (e) {} }
  function openPack() {
    if (tearing) return;
    setTearing(true);
    playTear();
    if (godpack) {
      setTimeout(playLegendary, 380);
      setTimeout(fireConfetti, 360);
      setTimeout(fireConfetti, 1700);
      setTimeout(() => setPhase("god"), 820);
      setTimeout(() => setPhase("cards"), 3200);
    } else {
      setTimeout(() => setPhase("cards"), 820);
    }
    try { if (navigator.vibrate) navigator.vibrate(godpack ? [0, 30, 30, 70, 40, 130] : 30); } catch (e) {}
  }
  function fireEpic() { setEpic(false); requestAnimationFrame(() => setEpic(true)); setTimeout(() => setEpic(false), 1800); fireConfetti(); try { if (navigator.vibrate) navigator.vibrate([0, 45, 35, 95]); } catch (e) {} }
  function flip(i) {
    setFlipped(prev => { if (prev[i]) return prev; const n = prev.slice(); n[i] = true; return n; });
    if (items[i] && items[i].rareza === "legendary") { fireEpic(); playLegendary(); } else playFlip();
  }
  function clickCard(i) {
    if (flipped[i]) setBig(items[i]); else flip(i);
  }
  function flipAll() {
    setFlipped(items.map(() => true));
    if (items.some(it => it.rareza === "legendary")) { fireEpic(); playLegendary(); } else playFlip();
  }
  const allFlipped = flipped.every(Boolean);

  return (
    <>
    <div onClick={phase === "cards" ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 18 }}>
      {godpack && <div className="nft-godray" />}
      {confetti && (
        <div className="confetti">
          {[...Array(34)].map((_, i) => {
            const cols = ["#f5d97a", "#fff3c4", "#ffd23f", "#ffffff", "#e8b94a"];
            const sz = 6 + Math.random() * 5;
            return <span key={i} style={{ left: (Math.random() * 100).toFixed(1) + "%", width: sz.toFixed(1) + "px", height: (sz * 1.6).toFixed(1) + "px", background: cols[i % cols.length], animationDelay: (Math.random() * 0.35).toFixed(2) + "s", animationDuration: (1.3 + Math.random() * 0.9).toFixed(2) + "s" }} />;
          })}
        </div>
      )}
      {epic && (
        <div className="epic-overlay">
          <div className="epic-flash" />
          <div className="epic-rays">{[...Array(12)].map((_, i) => <span key={i} style={{ transform: `rotate(${i * 30}deg)` }} />)}</div>
          <div className="epic-word">¡LEGENDARY!</div>
        </div>
      )}
      {phase === "god" && (
        <div className="god-cine">
          <div className="god-flash" />
          <div className="god-rays">{[...Array(16)].map((_, i) => <span key={i} style={{ transform: `rotate(${i * 22.5}deg)` }} />)}</div>
          <div className="god-title">GOD PACK</div>
          <div className="god-sub">EL SOBRE LEGENDARIO</div>
        </div>
      )}
      {phase !== "god" && (
      <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 540, width: "100%", padding: "22px 18px", textAlign: "center", position: "relative", zIndex: 3 }}>
        <button onClick={toggleMute} aria-label="sonido" style={{ position: "absolute", top: 10, right: 12, width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: 14, cursor: "pointer", zIndex: 6, lineHeight: 1 }}>{mute ? "🔇" : "🔊"}</button>
        {phase === "pack" ? (
          <div className="pack-stage">
            <div className={`pack pk-${packType}${tearing ? " tear" : ""}`} onClick={openPack}>
              <div className="pack-shine" />
              <div className="pack-label">{godpack ? "GOD PACK" : tipo === "triple" ? "TRIPLE" : "SOBRE"}</div>
              <div className="pack-top" />
              <div className="pack-burst" />
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{tearing ? "¡Abriendo!" : "Tocá el sobre para abrir 👆"}</div>
          </div>
        ) : (<>
        {godpack && <div style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "var(--gold)", letterSpacing: 2, textShadow: "0 0 16px rgba(245,200,90,.7)" }}>✨ GOD PACK ✨</div>}
        <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>{allFlipped ? "Tocá una carta para verla en grande" : "Tocá las cartas para revelarlas"}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {items.map((it, i) => (
            <div key={i} style={{ width: w }}>
              <div className={`flipwrap back-${it.rareza} ${flipped[i] ? "done" : ""}`} onClick={() => clickCard(i)}>
                <div className={`flipinner ${flipped[i] ? "flipped" : ""}`}>
                  <div className="flipface"><CardBack rareza={it.rareza} /></div>
                  <div className="flipface flipfront-nft">
                    <NFTCard nft={it} edition={it.rareza === "limited" ? it.edition : null} />
                    {flipped[i] && it.rareza !== "common" && <div className={`reveal-burst burst-${it.rareza}`} />}
                  </div>
                </div>
              </div>
              {flipped[i] ? (
                <>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.nombre}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: NFT_RAR[it.rareza].c }}>{NFT_RAR[it.rareza].t}{it.rareza === "limited" ? ` · #${String(it.edition).padStart(2, "0")}` : ""}{it.nuevo ? " · ¡NUEVO!" : ""}</div>
                </>
              ) : <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>¿?</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
          {!allFlipped && <button onClick={flipAll} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--txt)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Dar vuelta todas</button>}
          {allFlipped && <button onClick={onClose} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>¡Joya!</button>}
        </div>
        </>)}
      </div>
      )}
    </div>
    {big && (
      <div onClick={() => setBig(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1400, padding: 18 }}>
        <button onClick={() => setBig(null)} style={{ position: "absolute", top: 14, right: 16, width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border)", background: "rgba(0,0,0,.4)", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 2 }}>✕</button>
        <div onClick={e => e.stopPropagation()} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><NFTCard nft={big} edition={big.rareza === "limited" ? big.edition : null} big /></div>
          <div style={{ marginTop: 14, fontSize: 19, fontWeight: 800 }}>{big.nombre}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: NFT_RAR[big.rareza].c, marginTop: 2 }}>{NFT_RAR[big.rareza].t}{big.rareza === "limited" ? ` · #${String(big.edition).padStart(2, "0")}` : big.rareza === "legendary" ? " · 1 de 1" : ""}</div>
        </div>
      </div>
    )}
    </>
  );
}

// ── Intercambios: publicás una carta y recibís ofertas (carta y/o Petros) ─────
function Trades({ user, nfts, owned, allOwned, profiles, saldo, isAdmin, onRefresh }) {
  const [trades, setTrades] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listSel, setListSel] = useState(null);     // {nft, owned_id, edition, eds}
  const [targetUser, setTargetUser] = useState(""); // destinatario opcional del intercambio
  const [offerModal, setOfferModal] = useState(null); // trade
  const [offerCard, setOfferCard] = useState(null);   // {nft, owned_id, edition, eds}
  const [offerPetros, setOfferPetros] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const nftById = {}; nfts.forEach(n => { nftById[n.id] = n; });
  const nameOf = (uid) => (profiles.find(p => p.id === uid)?.name) || "Alguien";

  async function loadTrades() {
    const { data: tr } = await sb.from("nft_trades").select("*").eq("status", "open").order("created_at", { ascending: false });
    const list = tr || [];
    setTrades(list);
    if (list.length) {
      const { data: of } = await sb.from("nft_offers").select("*").in("trade_id", list.map(t => t.id)).eq("status", "pending");
      setOffers(of || []);
    } else setOffers([]);
    setLoading(false);
  }
  useEffect(() => { loadTrades(); }, []);

  // agrupar mis cartas por nft
  const grouped = {};
  owned.forEach(o => { if (!o.nft) return; if (!grouped[o.nft_id]) grouped[o.nft_id] = { nft: o.nft, eds: [] }; grouped[o.nft_id].eds.push({ id: o.id, edition: o.edition }); });
  Object.values(grouped).forEach(g => g.eds.sort((a, b) => a.edition - b.edition));
  const sortG = (arr) => arr.sort((a, b) => (rarRank[a.nft.rareza] - rarRank[b.nft.rareza]) || a.nft.nombre.localeCompare(b.nft.nombre));
  const dupList = sortG(Object.values(grouped).filter(d => d.eds.length >= 2));
  const allMine = sortG(Object.values(grouped));
  const visibleTrades = trades.filter(t => !t.target_user || t.from_user === user.id || t.target_user === user.id);

  async function publicar() {
    if (!listSel) return;
    setBusy(true);
    const { data, error } = await sb.rpc("proponer_trade", { p_offer_owned_id: listSel.owned_id, p_target: targetUser || null });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo publicar."); return; }
    const wasDirected = !!targetUser;
    setListSel(null); setTargetUser(""); await loadTrades(); if (onRefresh) onRefresh();
    setMsg(wasDirected ? "🎯 ¡Carta ofrecida! Le avisamos a la persona." : "✅ ¡Carta publicada! Ahora pueden hacerte ofertas.");
  }
  async function enviarOferta() {
    const p = parseInt(offerPetros) || 0;
    if (!offerCard && p <= 0) { setMsg("Ofrecé una carta o algunos Petros."); return; }
    setBusy(true);
    const { data, error } = await sb.rpc("hacer_oferta", { p_trade_id: offerModal.id, p_offer_owned_id: offerCard ? offerCard.owned_id : null, p_petros: p });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo ofertar."); return; }
    setOfferModal(null); setOfferCard(null); setOfferPetros("");
    await loadTrades(); if (onRefresh) onRefresh();
    setMsg("📨 ¡Oferta enviada! Esperá que la acepten.");
  }
  async function aceptar(offerId) {
    setBusy(true);
    const { data, error } = await sb.rpc("aceptar_oferta", { p_offer_id: offerId });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo aceptar."); return; }
    await loadTrades(); if (onRefresh) onRefresh();
    setMsg("🤝 ¡Intercambio cerrado!");
  }
  async function retirar(offerId) { setBusy(true); await sb.rpc("cancelar_oferta", { p_offer_id: offerId }); setBusy(false); await loadTrades(); if (onRefresh) onRefresh(); }
  async function cancelarPub(t) { setBusy(true); await sb.rpc("cancelar_trade", { p_trade_id: t.id }); setBusy(false); await loadTrades(); if (onRefresh) onRefresh(); }

  function openOffer(t) { setOfferCard(null); setOfferPetros(""); setOfferModal(t); }

  // mini para describir lo que ofrece una oferta
  function OfferContents({ o, size = 54 }) {
    const c = o.offer_nft_id ? nftById[o.offer_nft_id] : null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {c && <div style={{ width: size }}><NFTCard nft={c} edition={c.rareza === "limited" ? o.offer_edition : null} /></div>}
        {o.petros > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4 }}><PetroCoin size={14} />{o.petros}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Publicar */}
      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🔄 Publicar una carta</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Ofrecé cualquier carta tuya. La gente te hace ofertas (otra carta, Petros, o las dos) y vos elegís.</div>
        {allMine.length === 0
          ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Todavía no tenés cartas para publicar.</div>
          : <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
              {allMine.map(d => {
                const sel = listSel && listSel.nft.id === d.nft.id;
                return (
                  <div key={d.nft.id} onClick={() => setListSel({ nft: d.nft, owned_id: d.eds[0].id, edition: d.eds[0].edition, eds: d.eds })}
                    style={{ width: 84, flexShrink: 0, cursor: "pointer", border: "2px solid " + (sel ? "var(--gold)" : "transparent"), borderRadius: 12, padding: 2 }}>
                    <NFTCard nft={d.nft} edition={d.nft.rareza === "limited" ? d.eds[0].edition : null} />
                    <div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nft.nombre}</div>
                    <div style={{ fontSize: 9, color: NFT_RAR[d.nft.rareza].c, textAlign: "center", fontWeight: 800 }}>{d.eds.length > 1 ? `x${d.eds.length}` : NFT_RAR[d.nft.rareza].t}</div>
                  </div>
                );
              })}
            </div>}
        {listSel && listSel.nft.rareza === "limited" && listSel.eds.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Publicás la edición:</span>
            {listSel.eds.map(e => (
              <button key={e.id} onClick={() => setListSel(s => ({ ...s, owned_id: e.id, edition: e.edition }))}
                style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid " + (listSel.owned_id === e.id ? "var(--gold)" : "var(--border)"), background: listSel.owned_id === e.id ? "var(--gold)" : "none", color: listSel.owned_id === e.id ? "#1a1a1a" : "var(--txt)" }}>#{String(e.edition).padStart(2, "0")}</button>
            ))}
          </div>
        )}
        {listSel && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>🎯 ¿Dirigir a alguien? (opcional)</span>
            <select value={targetUser} onChange={e => setTargetUser(e.target.value)}
              style={{ background: "var(--surface)", color: "var(--txt)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
              <option value="">Abierto a todos</option>
              {profiles.filter(p => p.id !== user.id).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={publicar} disabled={!listSel || busy}
          style={{ marginTop: 14, padding: "9px 20px", borderRadius: 8, border: "none", background: !listSel ? "var(--surface)" : "var(--gold)", color: !listSel ? "var(--muted)" : "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: !listSel ? "not-allowed" : "pointer" }}>
          {busy ? "..." : (targetUser ? "Ofrecer a esa persona" : "Publicar")}
        </button>
      </div>

      {/* Publicaciones abiertas */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Publicaciones abiertas {visibleTrades.length > 0 ? `(${visibleTrades.length})` : ""}</div>
        {loading ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Cargando…</div>
          : visibleTrades.length === 0 ? <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No hay publicaciones. ¡Publicá la primera!</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleTrades.map(t => {
                const card = nftById[t.offer_nft_id];
                if (!card) return null;
                const mine = t.from_user === user.id;
                const tOffers = offers.filter(o => o.trade_id === t.id);
                const myOffer = tOffers.find(o => o.from_user === user.id);
                return (
                  <div key={t.id} className="card" style={{ padding: "14px 16px", border: t.target_user === user.id ? "1px solid var(--gold)" : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 78, flexShrink: 0 }}><NFTCard nft={card} edition={card.rareza === "limited" ? t.offer_edition : null} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.nombre}</div>
                        {t.target_user && <div style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)", marginTop: 2 }}>{t.target_user === user.id ? "🎯 Para vos" : mine ? `🎯 Dirigida a ${nameOf(t.target_user)}` : ""}</div>}
                        <div style={{ fontSize: 11, color: NFT_RAR[card.rareza].c, fontWeight: 700 }}>{NFT_RAR[card.rareza].t}{card.rareza === "limited" ? ` · #${String(t.offer_edition).padStart(2, "0")}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{mine ? "Tu publicación" : "de " + nameOf(t.from_user)}{tOffers.length ? ` · ${tOffers.length} oferta${tOffers.length > 1 ? "s" : ""}` : ""}</div>
                      </div>
                      {!mine && (
                        myOffer
                          ? <button onClick={() => retirar(myOffer.id)} disabled={busy} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Retirar</button>
                          : <button onClick={() => openOffer(t)} disabled={busy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>Ofertar</button>
                      )}
                    </div>

                    {/* Mi oferta enviada (vista del ofertante) */}
                    {!mine && myOffer && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Tu oferta:</div>
                        <OfferContents o={myOffer} size={46} />
                      </div>
                    )}

                    {/* Ofertas recibidas (vista del dueño) */}
                    {mine && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        {tOffers.length === 0
                          ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Todavía no recibiste ofertas.</div>
                          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {tOffers.map(o => (
                                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{nameOf(o.from_user)} ofrece:</div>
                                    <OfferContents o={o} size={50} />
                                  </div>
                                  <button onClick={() => aceptar(o.id)} disabled={busy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>Aceptar</button>
                                </div>
                              ))}
                            </div>}
                        <button onClick={() => cancelarPub(t)} disabled={busy} style={{ marginTop: 10, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "none", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar publicación</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>}
      </div>

      {/* Modal: hacer oferta */}
      {offerModal && (() => {
        const card = nftById[offerModal.offer_nft_id];
        const p = parseInt(offerPetros) || 0;
        return (
          <div onClick={() => setOfferModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: 18, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 460, width: "100%", padding: "20px 18px", margin: "auto" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Tu oferta</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>por <b>{card?.nombre}</b></div>

              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Ofrecés una carta (opcional):</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
                <div onClick={() => setOfferCard(null)} style={{ width: 70, flexShrink: 0, cursor: "pointer", borderRadius: 10, border: "2px solid " + (!offerCard ? "var(--gold)" : "var(--border)"), display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1792/2400", fontSize: 11, color: "var(--muted)", textAlign: "center" }}>Sin carta</div>
                {allMine.map(d => {
                  const sel = offerCard && offerCard.nft.id === d.nft.id;
                  return (
                    <div key={d.nft.id} onClick={() => setOfferCard({ nft: d.nft, owned_id: d.eds[0].id, edition: d.eds[0].edition, eds: d.eds })}
                      style={{ width: 70, flexShrink: 0, cursor: "pointer", border: "2px solid " + (sel ? "var(--gold)" : "transparent"), borderRadius: 10, padding: 2 }}>
                      <NFTCard nft={d.nft} edition={d.nft.rareza === "limited" ? d.eds[0].edition : null} />
                      <div style={{ fontSize: 8, fontWeight: 700, textAlign: "center", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nft.nombre}</div>
                    </div>
                  );
                })}
              </div>
              {offerCard && offerCard.nft.rareza === "limited" && offerCard.eds.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Das la #:</span>
                  {offerCard.eds.map(e => (
                    <button key={e.id} onClick={() => setOfferCard(s => ({ ...s, owned_id: e.id, edition: e.edition }))}
                      style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid " + (offerCard.owned_id === e.id ? "var(--gold)" : "var(--border)"), background: offerCard.owned_id === e.id ? "var(--gold)" : "none", color: offerCard.owned_id === e.id ? "#1a1a1a" : "var(--txt)" }}>#{String(e.edition).padStart(2, "0")}</button>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 6 }}>Y/o Petros:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min="0" value={offerPetros} onChange={e => setOfferPetros(e.target.value)} placeholder="0"
                  style={{ width: 120, padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--txt)", fontSize: 14, outline: "none" }} />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Tu saldo: {isAdmin ? "∞" : saldo}</span>
              </div>
              {!isAdmin && p > saldo && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>No te alcanzan los Petros.</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={enviarOferta} disabled={busy || (!offerCard && p <= 0) || (!isAdmin && p > saldo)}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: (!offerCard && p <= 0) ? "var(--surface)" : "var(--gold)", color: (!offerCard && p <= 0) ? "var(--muted)" : "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: (!offerCard && p <= 0) ? "not-allowed" : "pointer" }}>{busy ? "..." : "Enviar oferta"}</button>
                <button onClick={() => setOfferModal(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {msg && (
        <div onClick={() => setMsg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1350, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: "100%", padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{msg}</div>
            <button onClick={() => setMsg(null)} style={{ marginTop: 16, padding: "8px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subastas de NFT ───────────────────────────────────────────────────────────
function Subastas({ user, nfts, owned, profiles, saldo, isAdmin, onRefresh }) {
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [sel, setSel] = useState(null);        // {nft, owned_id, edition, eds}
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState(24);
  const [bidModal, setBidModal] = useState(null); // auction
  const [bidAmount, setBidAmount] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const nftById = {}; nfts.forEach(n => { nftById[n.id] = n; });
  const nameOf = (uid) => (profiles.find(p => p.id === uid)?.name) || "Alguien";

  async function loadAll() {
    let { data: au } = await sb.from("nft_auctions").select("*").eq("status", "open").order("end_at", { ascending: true });
    let list = au || [];
    // cierre automático: finalizo las vencidas y recargo
    const vencidas = list.filter(a => new Date(a.end_at).getTime() <= Date.now());
    if (vencidas.length) {
      await Promise.all(vencidas.map(a => sb.rpc("finalizar_subasta", { p_auction_id: a.id })));
      const r = await sb.from("nft_auctions").select("*").eq("status", "open").order("end_at", { ascending: true });
      list = r.data || [];
      if (onRefresh) onRefresh();
    }
    setAuctions(list);
    if (list.length) {
      const { data: bd } = await sb.from("nft_bids").select("*").in("auction_id", list.map(a => a.id));
      setBids(bd || []);
    } else setBids([]);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);

  const grouped = {};
  owned.forEach(o => { if (!o.nft) return; if (!grouped[o.nft_id]) grouped[o.nft_id] = { nft: o.nft, eds: [] }; grouped[o.nft_id].eds.push({ id: o.id, edition: o.edition }); });
  Object.values(grouped).forEach(g => g.eds.sort((a, b) => a.edition - b.edition));
  const allMine = Object.values(grouped).sort((a, b) => (rarRank[a.nft.rareza] - rarRank[b.nft.rareza]) || a.nft.nombre.localeCompare(b.nft.nombre));

  const topBid = (aid) => { const bs = bids.filter(b => b.auction_id === aid); return bs.length ? Math.max(...bs.map(b => b.amount)) : null; };
  const topBidder = (aid) => { const bs = bids.filter(b => b.auction_id === aid).sort((a, b) => b.amount - a.amount || new Date(a.created_at) - new Date(b.created_at)); return bs.length ? bs[0].bidder : null; };
  function remaining(end) { const ms = new Date(end).getTime() - now; if (ms <= 0) return null; const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; }

  async function crear() {
    if (!sel) return;
    setBusy(true);
    const { data, error } = await sb.rpc("crear_subasta", { p_owned_id: sel.owned_id, p_min_price: parseInt(price) || 1, p_hours: hours });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo crear."); return; }
    setSel(null); setPrice(""); await loadAll(); if (onRefresh) onRefresh();
    setMsg("🔨 ¡Subasta creada!");
  }
  async function ofertar() {
    const amt = parseInt(bidAmount) || 0;
    setBusy(true);
    const { data, error } = await sb.rpc("ofertar_subasta", { p_auction_id: bidModal.id, p_amount: amt });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo ofertar."); return; }
    setBidModal(null); setBidAmount(""); await loadAll(); if (onRefresh) onRefresh();
    setMsg("✅ ¡Oferta enviada!");
  }
  async function finalizar(a) {
    setBusy(true);
    const { data, error } = await sb.rpc("finalizar_subasta", { p_auction_id: a.id });
    setBusy(false);
    if (error || !data || !data.ok) { setMsg((data && data.error) || (error && error.message) || "No se pudo finalizar."); return; }
    await loadAll(); if (onRefresh) onRefresh();
    setMsg(data.sold ? "🔨 ¡Subasta vendida!" : "La subasta terminó sin ofertas válidas.");
  }
  async function cancelar(a) { setBusy(true); const { data } = await sb.rpc("cancelar_subasta", { p_auction_id: a.id }); setBusy(false); if (data && !data.ok) setMsg(data.error); await loadAll(); if (onRefresh) onRefresh(); }

  const minBid = bidModal ? ((topBid(bidModal.id) != null ? topBid(bidModal.id) + 1 : bidModal.min_price)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Crear subasta */}
      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🔨 Subastar una carta</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Elegí una carta, poné el precio inicial y la duración. Gana la oferta más alta.</div>
        {allMine.length === 0
          ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Todavía no tenés cartas para subastar.</div>
          : <>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
              {allMine.map(d => {
                const s = sel && sel.nft.id === d.nft.id;
                return (
                  <div key={d.nft.id} onClick={() => setSel({ nft: d.nft, owned_id: d.eds[0].id, edition: d.eds[0].edition, eds: d.eds })}
                    style={{ width: 84, flexShrink: 0, cursor: "pointer", border: "2px solid " + (s ? "var(--gold)" : "transparent"), borderRadius: 12, padding: 2 }}>
                    <NFTCard nft={d.nft} edition={d.nft.rareza === "limited" ? d.eds[0].edition : null} />
                    <div style={{ fontSize: 9, fontWeight: 700, textAlign: "center", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nft.nombre}</div>
                  </div>
                );
              })}
            </div>
            {sel && sel.nft.rareza === "limited" && sel.eds.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Subastás la #:</span>
                {sel.eds.map(e => (
                  <button key={e.id} onClick={() => setSel(x => ({ ...x, owned_id: e.id, edition: e.edition }))}
                    style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid " + (sel.owned_id === e.id ? "var(--gold)" : "var(--border)"), background: sel.owned_id === e.id ? "var(--gold)" : "none", color: sel.owned_id === e.id ? "#1a1a1a" : "var(--txt)" }}>#{String(e.edition).padStart(2, "0")}</button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
              <label style={{ fontSize: 11, color: "var(--muted)" }}>Precio inicial (Petros)
                <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="1"
                  style={{ display: "block", marginTop: 4, width: 130, padding: "8px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--txt)", fontSize: 14, outline: "none" }} /></label>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Duración</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[6, 12, 24, 48].map(h => (
                    <button key={h} onClick={() => setHours(h)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid " + (hours === h ? "var(--gold)" : "var(--border)"), background: hours === h ? "var(--gold)" : "none", color: hours === h ? "#1a1a1a" : "var(--txt)" }}>{h}h</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={crear} disabled={!sel || busy} style={{ marginTop: 14, padding: "9px 20px", borderRadius: 8, border: "none", background: !sel ? "var(--surface)" : "var(--gold)", color: !sel ? "var(--muted)" : "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: !sel ? "not-allowed" : "pointer" }}>{busy ? "..." : "Crear subasta"}</button>
          </>}
      </div>

      {/* Subastas activas */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Subastas activas {auctions.length > 0 ? `(${auctions.length})` : ""}</div>
        {loading ? <div style={{ fontSize: 12, color: "var(--muted)" }}>Cargando…</div>
          : auctions.length === 0 ? <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No hay subastas activas. ¡Creá la primera!</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {auctions.map(a => {
                const card = nftById[a.nft_id]; if (!card) return null;
                const mine = a.seller === user.id;
                const tb = topBid(a.id), tbr = topBidder(a.id);
                const rem = remaining(a.end_at);
                const ended = rem === null;
                const aBids = bids.filter(b => b.auction_id === a.id).sort((x, y) => y.amount - x.amount);
                return (
                  <div key={a.id} className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 78, flexShrink: 0 }}><NFTCard nft={card} edition={card.rareza === "limited" ? a.edition : null} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.nombre}</div>
                        <div style={{ fontSize: 11, color: NFT_RAR[card.rareza].c, fontWeight: 700 }}>{NFT_RAR[card.rareza].t}{card.rareza === "limited" ? ` · #${String(a.edition).padStart(2, "0")}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{mine ? "Tu subasta" : "de " + nameOf(a.seller)} · {ended ? <b style={{ color: "var(--red)" }}>Finalizada</b> : <>⏳ {rem}</>}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <PetroCoin size={14} /> {tb != null ? tb : a.min_price}<span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>{tb != null ? ` · ${nameOf(tbr)}` : " (base)"}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {ended
                          ? <button onClick={() => finalizar(a)} disabled={busy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Finalizar</button>
                          : mine
                            ? (aBids.length === 0 && <button onClick={() => cancelar(a)} disabled={busy} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>)
                            : <button onClick={() => { setBidAmount(""); setBidModal(a); }} disabled={busy} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Ofertar</button>}
                      </div>
                    </div>
                    {mine && aBids.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Ofertas ({aBids.length}):</div>
                        {aBids.slice(0, 5).map(b => (
                          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                            <span>{nameOf(b.bidder)}</span>
                            <span style={{ color: "var(--gold)", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><PetroCoin size={12} />{b.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>}
      </div>

      {/* Modal ofertar */}
      {bidModal && (() => {
        const card = nftById[bidModal.id ? bidModal.nft_id : null];
        return (
          <div onClick={() => setBidModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: 18 }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 360, width: "100%", padding: "20px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Tu oferta</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>por <b>{card?.nombre}</b></div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Oferta mínima: <b style={{ color: "var(--gold)" }}>{minBid}</b> · Tu saldo: {isAdmin ? "∞" : saldo}</div>
              <input type="number" min={minBid} value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={String(minBid)} autoFocus
                style={{ width: "100%", padding: "10px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--txt)", fontSize: 16, outline: "none", textAlign: "center", marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={ofertar} disabled={busy || (parseInt(bidAmount) || 0) < minBid || (!isAdmin && (parseInt(bidAmount) || 0) > saldo)}
                  style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{busy ? "..." : "Ofertar"}</button>
                <button onClick={() => setBidModal(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {msg && (
        <div onClick={() => setMsg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1350, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: "100%", padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{msg}</div>
            <button onClick={() => setMsg(null)} style={{ marginTop: 16, padding: "8px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Coleccion({ user, profiles, allPredictions, isAdmin, onRefresh, mercadoPend = 0 }) {
  const [sub, setSub] = useState("sobres");
  const [lastSub, setLastSub] = useState({ mis: "sobres", explorar: "galeria", mercado: "trades", gestion: "admin" });
  function pickSub(k) {
    const g = NFT_GRUPOS.find(gr => gr.subs.some(s => s[0] === k));
    setSub(k);
    if (g) setLastSub(prev => ({ ...prev, [g.key]: k }));
  }
  const [galFiltro, setGalFiltro] = useState("legendary");
  const [rankSort, setRankSort] = useState("valor");
  const [featured, setFeatured] = useState(Array.isArray(user.profile?.featured_nfts) ? user.profile.featured_nfts : []);
  const [nfts, setNfts] = useState([]);
  const [owned, setOwned] = useState([]);
  const [allOwned, setAllOwned] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [spent, setSpent] = useState(0);
  const [usedToday, setUsedToday] = useState({ cinco: 0, triple: 0 });
  const [est, setEst] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [modal, setModal] = useState(null);

  // admin
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", rareza: "common", supply: 19, num_x: 84, num_y: 27, num_size: 8, imagen_url: "" });
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [probEdit, setProbEdit] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [recConfirm, setRecConfirm] = useState(null);
  const [recPick, setRecPick] = useState(false);
  const [recRar, setRecRar] = useState("common");
  const [recSel, setRecSel] = useState([]);
  const [profCol, setProfCol] = useState(null); // uid del coleccionista que estoy mirando
  const [saldos, setSaldos] = useState(null);
  const [wishTop, setWishTop] = useState([]);
  const [miRar, setMiRar] = useState("todas");
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  async function cargarSaldos() {
    setLoadingSaldos(true);
    const { data, error } = await sb.rpc("saldos_todos");
    setLoadingSaldos(false);
    if (error) { setModal({ msg: "Error saldos: " + (error.message || "") + " | " + (error.code || "") + " | " + (error.details || "") + " | " + (error.hint || "") }); return; }
    setSaldos(data || []);
  }
  const [nftReacts, setNftReacts] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const myPts = (allPredictions || []).filter(p => p.user_id === user.id).reduce((s, p) => s + (p.points || 0), 0);
  const bonus = user.profile?.monedas_bonus || 0;
  const saldo = myPts + bonus - spent;
  const nameOf = (uid) => (profiles.find(p => p.id === uid)?.name) || "Alguien";

  async function loadAll() {
    const [nRes, oRes, aRes, cRes, pRes, rRes, wRes, eRes, tRes] = await Promise.all([
      sb.from("nfts").select("*").order("created_at", { ascending: true }),
      sb.from("nft_owned").select("*, nft:nfts(*)").eq("user_id", user.id),
      sb.from("nft_owned").select("nft_id,user_id,edition"),
      sb.from("nft_config").select("*").eq("id", 1).maybeSingle(),
      sb.from("store_purchases").select("precio, item_key, created_at").eq("user_id", user.id),
      sb.from("nft_reactions").select("nft_id,user_id,emoji"),
      sb.from("nft_wishlist").select("nft_id").eq("user_id", user.id),
      sb.rpc("estado_sobres"),
      sb.rpc("wishlist_top", { p_limit: 6 }),
    ]);
    setNfts(nRes.data || []);
    setOwned(oRes.data || []);
    setAllOwned(aRes.data || []);
    setCfg(cRes.data || null);
    setNftReacts(rRes.data || []);
    setWishlist((wRes.data || []).map(r => r.nft_id));
    setEst(eRes.data || null);
    setWishTop(tRes.data || []);
    const compras = pRes.data || [];
    setSpent(compras.reduce((s, p) => s + (p.precio || 0), 0));
    // sobres abiertos hoy (medianoche de Aruba, UTC-4)
    const an = new Date(Date.now() - 4 * 3600 * 1000);
    const dayStart = new Date(Date.UTC(an.getUTCFullYear(), an.getUTCMonth(), an.getUTCDate(), 4, 0, 0));
    const hoy = compras.filter(c => c.created_at && new Date(c.created_at) >= dayStart);
    setUsedToday({
      cinco: hoy.filter(c => c.item_key === "nft_sobre_cinco").length,
      triple: hoy.filter(c => c.item_key === "nft_sobre_triple").length,
    });
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (cfg && !probEdit) setProbEdit({ ...cfg }); }, [cfg]);
  const [detEd, setDetEd] = useState(null);
  useEffect(() => {
    if (!detail) { setDetEd(null); return; }
    if (detail.rareza === "limited") {
      const myEds = owned.filter(o => o.nft_id === detail.id).map(o => o.edition).sort((a, b) => a - b);
      const anyEd = (allOwned.find(o => o.nft_id === detail.id) || {}).edition;
      setDetEd(myEds[0] != null ? myEds[0] : (anyEd != null ? anyEd : 1));
    } else setDetEd(null);
  }, [detail]);

  const countOwned = (nftId) => allOwned.filter(o => o.nft_id === nftId).length;

  async function abrirSobre(tipo) {
    setOpening(tipo);
    const { data, error } = await sb.rpc("abrir_sobre_nft", { p_tipo: tipo });
    setOpening(null);
    if (error || !data || !data.ok) {
      setModal({ msg: (data && data.error) || (error && error.message) || "No se pudo abrir el sobre." });
      return;
    }
    await loadAll();
    if (onRefresh) onRefresh();
    setReveal({ items: data.items || [], godpack: !!data.godpack, tipo });
  }

  // ── admin ──
  async function subirImagen(file) {
    setSubiendo(true);
    const blob = await compressImg(file, 600, 0.82);
    const path = `nfts/${Date.now()}.jpg`;
    const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
    if (up.error) { setSubiendo(false); setModal({ msg: "No se pudo subir la imagen: " + up.error.message }); return; }
    const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
    setNuevo(n => ({ ...n, imagen_url: pub.publicUrl }));
    setSubiendo(false);
  }
  async function crearNft() {
    if (!nuevo.nombre.trim() || !nuevo.imagen_url) { setModal({ msg: "Falta el nombre o la imagen." }); return; }
    setGuardando(true);
    const supply = nuevo.rareza === "legendary" ? 1 : nuevo.rareza === "limited" ? (Number(nuevo.supply) || 19) : null;
    const payload = {
      nombre: nuevo.nombre.trim(), descripcion: nuevo.descripcion || null, imagen_url: nuevo.imagen_url,
      rareza: nuevo.rareza, supply_max: supply, activo: true,
      num_x: nuevo.rareza === "limited" ? Number(nuevo.num_x) : null,
      num_y: nuevo.rareza === "limited" ? Number(nuevo.num_y) : null,
      num_size: nuevo.rareza === "limited" ? Number(nuevo.num_size) : null,
    };
    const { error } = await sb.from("nfts").insert(payload);
    setGuardando(false);
    if (error) { setModal({ msg: "No se pudo crear: " + error.message }); return; }
    setNuevo({ nombre: "", descripcion: "", rareza: "common", supply: 19, num_x: 84, num_y: 27, num_size: 8, imagen_url: "" });
    loadAll();
  }
  function openEdit(n) {
    setEditForm({
      id: n.id, nombre: n.nombre || "", descripcion: n.descripcion || "", rareza: n.rareza,
      supply: n.supply_max || (n.rareza === "limited" ? 19 : 1),
      num_x: n.num_x != null ? n.num_x : 84, num_y: n.num_y != null ? n.num_y : 27, num_size: n.num_size != null ? n.num_size : 8,
      imagen_url: n.imagen_url,
    });
  }
  async function subirArteEdit(file) {
    setSubiendo(true);
    const blob = await compressImg(file, 600, 0.82);
    const path = `nfts/${Date.now()}.jpg`;
    const up = await sb.storage.from("tienda").upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "31536000" });
    if (up.error) { setSubiendo(false); setModal({ msg: "No se pudo subir la imagen: " + up.error.message }); return; }
    const { data: pub } = sb.storage.from("tienda").getPublicUrl(path);
    setEditForm(f => ({ ...f, imagen_url: pub.publicUrl }));
    setSubiendo(false);
  }
  async function toggleWishlist(nftId) {
    const has = wishlist.includes(nftId);
    if (has) {
      setWishlist(w => w.filter(x => x !== nftId));
      await sb.from("nft_wishlist").delete().eq("user_id", user.id).eq("nft_id", nftId);
    } else {
      setWishlist(w => [...w, nftId]);
      await sb.from("nft_wishlist").insert({ user_id: user.id, nft_id: nftId });
    }
  }
  async function toggleReaction(nftId, emoji) {
    const mine = nftReacts.some(r => r.nft_id === nftId && r.user_id === user.id && r.emoji === emoji);
    if (mine) {
      setNftReacts(rs => rs.filter(r => !(r.nft_id === nftId && r.user_id === user.id && r.emoji === emoji)));
      await sb.from("nft_reactions").delete().eq("nft_id", nftId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      setNftReacts(rs => [...rs, { nft_id: nftId, user_id: user.id, emoji }]);
      await sb.from("nft_reactions").insert({ nft_id: nftId, user_id: user.id, emoji });
    }
  }
  async function toggleFeatured(nft) {
    const exists = featured.some(f => f.nft_id === nft.id);
    let next;
    if (exists) next = featured.filter(f => f.nft_id !== nft.id);
    else {
      if (featured.length >= 3) { setModal({ msg: "Solo podés destacar 3 cartas. Sacá una primero." }); return; }
      const myEds = owned.filter(o => o.nft_id === nft.id).map(o => o.edition).sort((a, b) => a - b);
      next = [...featured, { nft_id: nft.id, nombre: nft.nombre, imagen_url: nft.imagen_url, rareza: nft.rareza, num_x: nft.num_x, num_y: nft.num_y, num_size: nft.num_size, supply_max: nft.supply_max, edition: nft.rareza === "limited" ? (myEds[0] != null ? myEds[0] : null) : null }];
    }
    setFeatured(next);
    await sb.from("profiles").update({ featured_nfts: next }).eq("id", user.id);
    if (onRefresh) onRefresh();
  }
  async function reciclar(ownedId) {
    setGuardando(true);
    const { data, error } = await sb.rpc("reciclar_una", { p_owned_id: ownedId });
    setGuardando(false);
    setRecConfirm(null);
    if (error || !data || !data.ok) { setModal({ msg: (data && data.error) || (error && error.message) || "No se pudo reciclar." }); return; }
    setDetail(null); setRecPick(false); setRecSel([]);
    await loadAll(); if (onRefresh) onRefresh();
    setModal({ msg: `♻️ Reciclaste la carta por ${data.reward} Petros.` });
  }
  async function reciclarComunesSel(ids) {
    setGuardando(true);
    const { data, error } = await sb.rpc("reciclar_comunes_sel", { p_ids: ids });
    setGuardando(false);
    setRecConfirm(null);
    if (error || !data || !data.ok) { setModal({ msg: (data && data.error) || (error && error.message) || "No se pudo reciclar." }); return; }
    setRecPick(false); setRecSel([]);
    await loadAll(); if (onRefresh) onRefresh();
    setModal({ msg: `♻️ Reciclaste 5 comunes por ${data.reward} Petros.` });
  }
  async function guardarEdit() {
    const f = editForm;
    if (!f.nombre.trim() || !f.imagen_url) { setModal({ msg: "Falta el nombre o la imagen." }); return; }
    const supply = f.rareza === "legendary" ? 1 : f.rareza === "limited" ? (Number(f.supply) || 19) : null;
    const payload = {
      nombre: f.nombre.trim(), descripcion: f.descripcion || null, imagen_url: f.imagen_url, rareza: f.rareza, supply_max: supply,
      num_x: f.rareza === "limited" ? Number(f.num_x) : null,
      num_y: f.rareza === "limited" ? Number(f.num_y) : null,
      num_size: f.rareza === "limited" ? Number(f.num_size) : null,
    };
    const { error } = await sb.from("nfts").update(payload).eq("id", f.id);
    if (error) { setModal({ msg: "No se pudo guardar: " + error.message }); return; }
    setEditForm(null); loadAll();
  }
  async function toggleActivo(n) { await sb.from("nfts").update({ activo: !n.activo }).eq("id", n.id); loadAll(); }
  async function borrarNft(n) { if (countOwned(n.id) > 0) { setModal({ msg: "No se puede borrar: ya hay ediciones en circulación. Desactivalo en su lugar." }); return; } await sb.from("nfts").delete().eq("id", n.id); loadAll(); }
  async function guardarProb() {
    const p = probEdit;
    const payload = {
      w_common: Number(p.w_common), w_limited: Number(p.w_limited), w_legendary: Number(p.w_legendary),
      godpack_chance: Number(p.godpack_chance), godpack_legendary: Number(p.godpack_legendary), godpack_limited: Number(p.godpack_limited),
      precio_simple: Number(p.precio_simple), precio_triple: Number(p.precio_triple),
    };
    const { error } = await sb.from("nft_config").update(payload).eq("id", 1);
    if (error) { setModal({ msg: "No se pudo guardar: " + error.message }); return; }
    setModal({ msg: "✅ Probabilidades y precios guardados." });
    loadAll();
  }

  const inp = { padding: "7px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--txt)", fontSize: 13, outline: "none", width: "100%" };
  const precioSimple = cfg ? cfg.precio_simple : 15;
  const precioTriple = cfg ? cfg.precio_triple : 40;

  // mi colección agrupada por nft
  const mine = {};
  owned.forEach(o => { if (!o.nft) return; if (!mine[o.nft_id]) mine[o.nft_id] = { nft: o.nft, eds: [] }; mine[o.nft_id].eds.push(o.edition); });
  const mineList = Object.values(mine).sort((a, b) => (rarRank[a.nft.rareza] - rarRank[b.nft.rareza]) || a.nft.nombre.localeCompare(b.nft.nombre));
  mineList.forEach(m => m.eds.sort((x, y) => x - y));

  const galLista = (isAdmin ? nfts : nfts.filter(n => n.activo)).slice().sort((a, b) => (rarRank[a.rareza] - rarRank[b.rareza]) || a.nombre.localeCompare(b.nombre));

  return (
    <div className="container">
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>🃏 Colección NFT</h2>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Abrí sobres con Petros y junta cartas: comunes, limited numeradas y legendary 1 de 1.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>TUS PETROS</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--gold)", lineHeight: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}><PetroCoin size={22} /> {isAdmin ? "∞" : saldo}</div>
          </div>
        </div>
        {(() => {
          const grupoActivo = NFT_GRUPOS.find(g => g.subs.some(s => s[0] === sub)) || NFT_GRUPOS[0];
          return (
            <>
              <div className="pre-tabs" style={{ marginTop: 14, flexWrap: "wrap" }}>
                {NFT_GRUPOS.filter(g => !g.adminOnly || isAdmin).map(g => (
                  <button key={g.key} className={`pre-tab ${grupoActivo.key === g.key ? "active" : ""}`} onClick={() => pickSub(lastSub[g.key] || g.subs[0][0])} style={{ position: "relative" }}>{g.emoji} {g.label}{g.key === "mercado" && mercadoPend > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />}</button>
                ))}
              </div>
              {grupoActivo.subs.length > 1 && (
                <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999, padding: 3, marginTop: 12, gap: 2, flexWrap: "wrap" }}>
                  {grupoActivo.subs.map(([k, emo, lab]) => {
                    const on = sub === k;
                    return <button key={k} onClick={() => pickSub(k)} style={{ padding: "7px 15px", borderRadius: 999, border: "none", background: on ? "var(--gold)" : "transparent", color: on ? "#1a1a1a" : "var(--muted)", fontSize: 13, fontWeight: on ? 800 : 600, cursor: "pointer", whiteSpace: "nowrap" }}>{emo} {lab}</button>;
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {loading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando…</div> : <>

      {sub === "sobres" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[{ tipo: "cinco", nombre: "Sobre de 5", emoji: "🎁", cant: "5 cartas", precio: precioSimple, desc: "Cinco cartas al azar.", lim: 1, badge: "linear-gradient(160deg,#3b82f6,#1e3a8a)", glow: "#3b82f6", tint: "rgba(59,130,246,.16)" },
            { tipo: "triple", nombre: "Sobre Triple", emoji: "🎴", cant: "3 cartas", precio: precioTriple, desc: "Tres cartas al azar.", lim: 2, badge: "linear-gradient(160deg,#ec4899,#7c3aed)", glow: "#ec4899", tint: "rgba(236,72,153,.16)" }].map(pk => {
            const isTri = pk.tipo === "triple";
            const max = isTri ? (est ? est.tri_max : 2) : (est ? est.cinco_lim : 1);
            const avail = isTri ? (est ? est.tri_charges : 2) : (est ? (est.cinco_lim - est.cinco_used) : 1);
            const nextAt = isTri ? (est && est.tri_next_at ? Date.parse(est.tri_next_at) : null) : null;
            const sinLimite = avail <= 0;
            const noPlata = !isAdmin && saldo < pk.precio;
            const dis = sinLimite || noPlata || opening === pk.tipo;
            return (
              <div key={pk.tipo} className="card" style={{ position: "relative", overflow: "hidden", padding: 18 }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pk.tint}, transparent 62%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: -44, right: -34, width: 150, height: 150, borderRadius: "50%", background: pk.glow, filter: "blur(42px)", opacity: 0.32, pointerEvents: "none" }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 66, height: 86, flexShrink: 0, filter: "drop-shadow(0 8px 16px rgba(0,0,0,.45))" }}><PackIcon variant={pk.tipo} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 17, fontWeight: 800 }}>{pk.nombre}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", background: "var(--surface)", borderRadius: 999, padding: "2px 9px" }}>{pk.cant}</span>
                      {pk.tipo === "triple" && <span style={{ fontSize: 10, fontWeight: 800, color: "#1a1a1a", background: "linear-gradient(90deg,#f7d774,#f5b731)", borderRadius: 999, padding: "2px 9px" }}>✨ chance de God Pack</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{pk.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                      {Array.from({ length: max }).map((_, i) => (
                        <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < avail ? pk.glow : "var(--muted)", opacity: i < avail ? 1 : 0.4, boxShadow: i < avail ? `0 0 6px ${pk.glow}` : "none" }} />
                      ))}
                      <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 3 }}>
                        {isTri ? (avail > 0 ? `${avail} cargado${avail > 1 ? "s" : ""}` : "sin cargas") : (avail > 0 ? "disponible hoy" : "agotado por hoy")}
                        {isTri && avail < max && nextAt ? <> · +1 en <Countdown targetMs={nextAt} style={{ color: "var(--gold)", fontWeight: 700 }} /></> : null}
                      </span>
                    </div>
                    {isTri && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, opacity: 0.8 }}>1 sobre cada 6 h · se acumulan hasta 2</div>}
                  </div>
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, gap: 10, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--gold)", display: "flex", alignItems: "center", gap: 6 }}><PetroCoin size={16} />{isAdmin ? "Gratis (admin)" : pk.precio}</div>
                  {sinLimite
                    ? <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>⏳ Próximo sobre en</div>
                        {isTri
                          ? (nextAt ? <Countdown targetMs={nextAt} style={{ fontSize: 16, fontWeight: 800, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }} /> : <span style={{ fontSize: 13, color: "var(--muted)" }}>—</span>)
                          : <ResetCountdown style={{ fontSize: 16, fontWeight: 800, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }} />}
                      </div>
                    : <button onClick={() => abrirSobre(pk.tipo)} disabled={dis}
                        style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: dis ? "var(--surface)" : "var(--gold)", color: dis ? "var(--muted)" : "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: dis ? "not-allowed" : "pointer", whiteSpace: "nowrap", boxShadow: dis ? "none" : "0 4px 14px rgba(245,183,49,.35)" }}>
                        {opening === pk.tipo ? "Abriendo…" : noPlata ? "Sin Petros" : "Abrir sobre"}
                      </button>}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 2 }}>El Sobre Triple tiene una chance secreta de convertirse en <b style={{ color: "var(--gold)" }}>God Pack</b> ✨</div>
        </div>
      )}

      {sub === "mia" && (
        mineList.length === 0
          ? <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Todavía no tenés cartas. Abrí un sobre para empezar tu colección. 🎁</div>
          : <>
              {(() => {
                const comunes = owned.filter(o => o.nft && o.nft.rareza === "common").length;
                const rew = (cfg && cfg.reciclar_common != null) ? cfg.reciclar_common : 3;
                const puede = comunes >= 5;
                return (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>Reciclaje: 5 comunes → {rew} · 1 limited → {(cfg && cfg.reciclar_limited) || 10} · 1 legendary → {(cfg && cfg.reciclar_legendary) || 1000} Petros</div>
                    <button onClick={() => { setRecRar("common"); setRecSel([]); setRecPick(true); }}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                      ♻️ Reciclar cartas
                    </button>
                  </div>
                );
              })()}
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>⭐ Tocá la estrella para destacar hasta 3 cartas en tu perfil ({featured.length}/3).</div>
              {(() => {
                const cnt = (r) => mineList.filter(m => m.nft.rareza === r).length;
                const tabs = [["todas", "Todas", mineList.length], ["common", "Comunes", cnt("common")], ["limited", "Limited", cnt("limited")], ["legendary", "Legendary", cnt("legendary")]];
                return (
                  <div className="pre-tabs" style={{ marginBottom: 12, flexWrap: "wrap" }}>
                    {tabs.map(([k, l, n]) => (
                      <button key={k} className={`pre-tab ${miRar === k ? "active" : ""}`} onClick={() => setMiRar(k)}>{l} ({n})</button>
                    ))}
                  </div>
                );
              })()}
              <div className="nftgrid">
                {(miRar === "todas" ? mineList : mineList.filter(m => m.nft.rareza === miRar)).map(m => (
                  <div key={m.nft.id} onClick={() => setDetail(m.nft)} style={{ cursor: "pointer", position: "relative" }}>
                    <NFTCard nft={m.nft} edition={m.eds[0]} />
                    <button onClick={(e) => { e.stopPropagation(); toggleFeatured(m.nft); }} title="Destacar en tu perfil"
                      style={{ position: "absolute", top: 6, right: 6, width: 27, height: 27, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.55)", color: featured.some(f => f.nft_id === m.nft.id) ? "#f5d97a" : "#fff", fontSize: 15, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
                      {featured.some(f => f.nft_id === m.nft.id) ? "★" : "☆"}
                    </button>
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nft.nombre}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: NFT_RAR[m.nft.rareza].c }}>{NFT_RAR[m.nft.rareza].t}{m.eds.length > 1 ? ` · x${m.eds.length}` : ""}</div>
                    {m.nft.rareza === "limited" && <div style={{ fontSize: 10, color: "var(--muted)" }}>{m.eds.map(e => "#" + String(e).padStart(2, "0")).join(" ")}</div>}
                  </div>
                ))}
              </div>
            </>
      )}

      {sub === "galeria" && (
        <>
        {wishTop.filter(w => w.n > 0).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>🔥 Más codiciadas del grupo</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              {wishTop.filter(w => w.n > 0).map(w => {
                const n = nfts.find(x => x.id === w.nft_id);
                if (!n) return null;
                return (
                  <div key={w.nft_id} onClick={() => setDetail(n)} style={{ cursor: "pointer", flex: "0 0 auto", width: 92, position: "relative" }}>
                    <NFTCard nft={n} edition={null} />
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,.7)", color: "#ff8a5c", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "2px 7px" }}>🔥 {w.n}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nombre}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="pre-tabs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
          {[["common", "Common"], ["limited", "Limited"], ["legendary", "Legendary"]].map(([k, l]) => {
            const cnt = (isAdmin ? nfts : nfts.filter(x => x.activo)).filter(x => x.rareza === k).length;
            return <button key={k} className={`pre-tab ${galFiltro === k ? "active" : ""}`} onClick={() => setGalFiltro(k)}>{l} ({cnt})</button>;
          })}
        </div>
        {galLista.filter(n => n.rareza === galFiltro).length === 0
          ? <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No hay cartas de esta rareza todavía.</div>
          : <div className="nftgrid">
          {galLista.filter(n => n.rareza === galFiltro).map(n => {
            const owners = allOwned.filter(o => o.nft_id === n.id);
            let info;
            if (n.rareza === "legendary") info = owners.length ? "👑 " + nameOf(owners[0].user_id) : "Sin dueño aún";
            else if (n.rareza === "limited") info = `${owners.length}/${n.supply_max || 19} repartidas`;
            else info = `${owners.length} en circulación`;
            return (
              <div key={n.id} onClick={() => setDetail(n)} style={{ cursor: "pointer", opacity: n.activo ? 1 : 0.5 }}>
                <NFTCard nft={n} edition={n.rareza === "limited" && owners.length ? owners[0].edition : null} />
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nombre}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: NFT_RAR[n.rareza].c }}>{NFT_RAR[n.rareza].t}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info}</div>
              </div>
            );
          })}
        </div>}
        </>
      )}

      {sub === "ranking" && (() => {
        const nbi = {}; nfts.forEach(n => { nbi[n.id] = n; });
        const total = nfts.length;
        const stats = {};
        allOwned.forEach(o => {
          const n = nbi[o.nft_id]; if (!n) return;
          if (!stats[o.user_id]) stats[o.user_id] = { leg: 0, lim: 0, com: 0, set: new Set(), valor: 0 };
          const s = stats[o.user_id];
          if (n.rareza === "legendary") { s.leg++; s.valor += 100; }
          else if (n.rareza === "limited") { s.lim++; s.valor += 10; }
          else { s.com++; s.valor += 1; }
          s.set.add(o.nft_id);
        });
        let rows = Object.entries(stats).map(([uid, s]) => ({ uid, name: (profiles.find(p => p.id === uid)?.name) || "Alguien", leg: s.leg, lim: s.lim, com: s.com, distintas: s.set.size, total: s.leg + s.lim + s.com, valor: s.valor }));
        const key = rankSort === "leg" ? "leg" : rankSort === "completitud" ? "completitud" : "valor";
        const metric = r => key === "valor" ? r.valor : key === "leg" ? r.leg : r.distintas;
        rows.sort((a, b) => (metric(b) - metric(a)) || (b.valor - a.valor));
        const maxMetric = rows.length ? (metric(rows[0]) || 1) : 1;
        return (
          <div>
            <div className="pre-tabs" style={{ marginBottom: 14, flexWrap: "wrap" }}>
              <button className={`pre-tab ${rankSort === "valor" ? "active" : ""}`} onClick={() => setRankSort("valor")}>Valor</button>
              <button className={`pre-tab ${rankSort === "leg" ? "active" : ""}`} onClick={() => setRankSort("leg")}>Legendarias</button>
              <button className={`pre-tab ${rankSort === "completitud" ? "active" : ""}`} onClick={() => setRankSort("completitud")}>Completitud</button>
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>Valor = común 1 · limited 10 · legendary 100{total > 0 ? ` · álbum: ${total} cartas` : ""}</div>
            {rows.length === 0
              ? <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Todavía nadie tiene cartas.</div>
              : <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {rows.map((r, i) => {
                    const me = r.uid === user.id;
                    const prof = profiles.find(p => p.id === r.uid);
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                    const pct = total > 0 ? Math.round(r.distintas / total * 100) : 0;
                    const pctBar = Math.max(3, Math.round(metric(r) / maxMetric * 100));
                    const bigDisplay = key === "completitud" ? `${pct}%` : metric(r);
                    const bigLabel = key === "valor" ? "valor" : key === "leg" ? "legendarias" : "del álbum";
                    return (
                      <div key={r.uid} onClick={() => setProfCol(r.uid)} title="Ver su colección" style={{ position: "relative", overflow: "hidden", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, background: me ? "var(--gold-dim)" : "var(--surface)", border: "1px solid " + (me ? "var(--gold)" : "var(--border)") }}>
                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${pctBar}%`, background: "var(--gold)", opacity: me ? 0.15 : 0.09, pointerEvents: "none" }} />
                        <div style={{ position: "relative", width: 22, textAlign: "center", fontWeight: 800, fontSize: i < 3 ? 18 : 13, color: "var(--muted)", flexShrink: 0 }}>{medal}</div>
                        <div style={{ position: "relative", flexShrink: 0 }}><Avatar profile={prof} size="sm" /></div>
                        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}{me ? " (vos)" : ""}</div>
                          {r.valor > 0 && (
                            <div style={{ display: "flex", height: 5, borderRadius: 99, overflow: "hidden", margin: "5px 0 3px", width: 150, maxWidth: "55vw", background: "var(--border)" }}>
                              {r.leg > 0 && <div style={{ flexBasis: `${r.leg * 100 / r.valor}%`, background: "#f5d97a" }} />}
                              {r.lim > 0 && <div style={{ flexBasis: `${r.lim * 10 / r.valor}%`, background: "#60a5fa" }} />}
                              {r.com > 0 && <div style={{ flexBasis: `${r.com * 1 / r.valor}%`, background: "var(--muted)" }} />}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>🟡 {r.leg} · 🔵 {r.lim} · ⚪ {r.com} · {r.distintas} distintas{total > 0 ? ` · ${pct}% del álbum` : ""}</div>
                        </div>
                        <div style={{ position: "relative", textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--gold)", lineHeight: 1 }}>{bigDisplay}</div>
                          <div style={{ fontSize: 9, color: "var(--muted)" }}>{bigLabel}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 10, color: "var(--muted)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#f5d97a" }} />legendary</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "#60a5fa" }} />limited</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--muted)" }} />común</span>
                </div>
              </>}
          </div>
        );
      })()}

      {sub === "trades" && <Trades user={user} nfts={nfts} owned={owned} allOwned={allOwned} profiles={profiles} saldo={saldo} isAdmin={isAdmin} onRefresh={loadAll} />}
      {sub === "subastas" && <Subastas user={user} nfts={nfts} owned={owned} profiles={profiles} saldo={saldo} isAdmin={isAdmin} onRefresh={loadAll} />}

      {sub === "admin" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Petros de cada uno */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>💰 Petros de cada uno</div>
              <button onClick={cargarSaldos} disabled={loadingSaldos} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{loadingSaldos ? "..." : (saldos ? "Actualizar" : "Cargar")}</button>
            </div>
            {!saldos && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Tocá "Cargar" para ver el saldo de Petros de todos los jugadores.</div>}
            {saldos && (saldos.length === 0
              ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Sin datos.</div>
              : <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  {saldos.map((s, i) => (
                    <div key={s.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: s.user_id === user.id ? "var(--gold-dim)" : "var(--surface)" }}>
                      <div style={{ width: 22, textAlign: "center", fontSize: 12, fontWeight: 800, color: "var(--muted)" }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name || "—"}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)" }}>+{Math.round(s.ganados)} jugando · +{Math.round(s.bonus)} bonus · −{Math.round(s.gastado)} gastado</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", flexShrink: 0 }}><PetroCoin size={14} /> {Math.round(s.petros)}</div>
                    </div>
                  ))}
                </div>)}
          </div>

          {/* Probabilidades */}
          {probEdit && (
            <div className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>⚙️ Probabilidades y precios</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["w_common", "Peso común"], ["w_limited", "Peso limited"], ["w_legendary", "Peso legendary"]].map(([k, l]) => (
                  <label key={k} style={{ fontSize: 11, color: "var(--muted)" }}>{l}
                    <input type="number" style={inp} value={probEdit[k]} onChange={e => setProbEdit(p => ({ ...p, [k]: e.target.value }))} /></label>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>% God Pack (ej 0.5)
                  <input type="number" step="0.1" style={inp} value={probEdit.godpack_chance} onChange={e => setProbEdit(p => ({ ...p, godpack_chance: e.target.value }))} /></label>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>God: legendary
                  <input type="number" style={inp} value={probEdit.godpack_legendary} onChange={e => setProbEdit(p => ({ ...p, godpack_legendary: e.target.value }))} /></label>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>God: limited
                  <input type="number" style={inp} value={probEdit.godpack_limited} onChange={e => setProbEdit(p => ({ ...p, godpack_limited: e.target.value }))} /></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>Precio Sobre Simple
                  <input type="number" style={inp} value={probEdit.precio_simple} onChange={e => setProbEdit(p => ({ ...p, precio_simple: e.target.value }))} /></label>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>Precio Sobre Triple
                  <input type="number" style={inp} value={probEdit.precio_triple} onChange={e => setProbEdit(p => ({ ...p, precio_triple: e.target.value }))} /></label>
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8 }}>Los pesos son relativos (ej 88 / 11 / 1). El % de God Pack es sobre el Sobre Triple.</div>
              <button onClick={guardarProb} style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Guardar</button>
            </div>
          )}

          {/* Crear NFT */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>➕ Nueva carta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input style={inp} placeholder="Nombre" value={nuevo.nombre} onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))} />
              <input style={inp} placeholder="Descripción (opcional)" value={nuevo.descripcion} onChange={e => setNuevo(n => ({ ...n, descripcion: e.target.value }))} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select style={{ ...inp, flex: "1 1 140px" }} value={nuevo.rareza} onChange={e => setNuevo(n => ({ ...n, rareza: e.target.value }))}>
                  <option value="common">Común (ilimitada)</option>
                  <option value="limited">Limited (numerada)</option>
                  <option value="legendary">Legendary (1 de 1)</option>
                </select>
                {nuevo.rareza === "limited" && (
                  <input type="number" style={{ ...inp, flex: "0 1 130px" }} placeholder="cantidad (19)" value={nuevo.supply} onChange={e => setNuevo(n => ({ ...n, supply: e.target.value }))} />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--txt)", fontSize: 13, cursor: "pointer" }}>
                  {subiendo ? "Subiendo…" : "🖼️ Subir arte"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) subirImagen(e.target.files[0]); }} />
                </label>
                {nuevo.imagen_url && <span style={{ fontSize: 11, color: "var(--green)" }}>Imagen lista ✓</span>}
              </div>

              {nuevo.imagen_url && nuevo.rareza === "limited" && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Ubicá el número (movés los sliders y mirás la vista previa):</div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ width: 150 }}>
                      <NFTCard nft={{ imagen_url: nuevo.imagen_url, rareza: "limited", supply_max: Number(nuevo.supply) || 19, num_x: Number(nuevo.num_x), num_y: Number(nuevo.num_y), num_size: Number(nuevo.num_size) }} edition={1} />
                    </div>
                    <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <label style={{ fontSize: 11, color: "var(--muted)" }}>Horizontal: {nuevo.num_x}%
                        <input type="range" min="0" max="100" step="0.5" value={nuevo.num_x} onChange={e => setNuevo(n => ({ ...n, num_x: e.target.value }))} style={{ width: "100%" }} /></label>
                      <label style={{ fontSize: 11, color: "var(--muted)" }}>Vertical: {nuevo.num_y}%
                        <input type="range" min="0" max="100" step="0.5" value={nuevo.num_y} onChange={e => setNuevo(n => ({ ...n, num_y: e.target.value }))} style={{ width: "100%" }} /></label>
                      <label style={{ fontSize: 11, color: "var(--muted)" }}>Tamaño: {nuevo.num_size}
                        <input type="range" min="2" max="16" step="0.5" value={nuevo.num_size} onChange={e => setNuevo(n => ({ ...n, num_size: e.target.value }))} style={{ width: "100%" }} /></label>
                    </div>
                  </div>
                </div>
              )}
              <button onClick={crearNft} disabled={guardando} style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>{guardando ? "Creando…" : "Crear carta"}</button>
            </div>
          </div>

          {/* Lista NFT */}
          <div className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🃏 Cartas ({nfts.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nfts.map(n => {
                const cnt = countOwned(n.id);
                const cap = n.rareza === "common" ? "∞" : (n.supply_max || (n.rareza === "legendary" ? 1 : 19));
                return (
                  <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", flexWrap: "wrap" }}>
                    <img src={n.imagen_url} alt="" style={{ width: 34, height: 44, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nombre}</div>
                      <div style={{ fontSize: 10, color: NFT_RAR[n.rareza].c, fontWeight: 700 }}>{NFT_RAR[n.rareza].t} · {cnt}/{cap}{!n.activo ? " · off" : ""}</div>
                    </div>
                    <button onClick={() => openEdit(n)} style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>✏️</button>
                    <button onClick={() => toggleActivo(n)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: n.activo ? "var(--green)" : "var(--muted)", fontSize: 12, cursor: "pointer" }}>{n.activo ? "Activo" : "Off"}</button>
                    <button onClick={() => borrarNft(n)} style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "none", color: "var(--red)", fontSize: 14, cursor: "pointer" }}>🗑️</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </>}

      {/* Editar carta */}
      {editForm && (() => {
        const ownedN = countOwned(editForm.id);
        return (
          <div onClick={() => setEditForm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1250, padding: 18, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 460, width: "100%", padding: "20px 18px", margin: "auto" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>✏️ Editar carta</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input style={inp} placeholder="Nombre" value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                <input style={inp} placeholder="Descripción (opcional)" value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select style={{ ...inp, flex: "1 1 140px", opacity: ownedN > 0 ? 0.5 : 1 }} disabled={ownedN > 0} value={editForm.rareza} onChange={e => setEditForm(f => ({ ...f, rareza: e.target.value }))}>
                    <option value="common">Común (ilimitada)</option>
                    <option value="limited">Limited (numerada)</option>
                    <option value="legendary">Legendary (1 de 1)</option>
                  </select>
                  {editForm.rareza === "limited" && <input type="number" disabled={ownedN > 0} style={{ ...inp, flex: "0 1 130px", opacity: ownedN > 0 ? 0.5 : 1 }} placeholder="cantidad" value={editForm.supply} onChange={e => setEditForm(f => ({ ...f, supply: e.target.value }))} />}
                </div>
                {ownedN > 0 && <div style={{ fontSize: 10, color: "var(--muted)" }}>Ya hay {ownedN} edición(es) en circulación: no se puede cambiar rareza ni cupo.</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--txt)", fontSize: 13, cursor: "pointer" }}>
                    {subiendo ? "Subiendo…" : "🖼️ Cambiar arte"}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) subirArteEdit(e.target.files[0]); }} />
                  </label>
                  {editForm.imagen_url && <img src={editForm.imagen_url} alt="" style={{ width: 30, height: 38, borderRadius: 5, objectFit: "cover" }} />}
                </div>
                {editForm.rareza === "limited" && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Posición del número:</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                      <div style={{ width: 150 }}>
                        <NFTCard nft={{ imagen_url: editForm.imagen_url, rareza: "limited", supply_max: Number(editForm.supply) || 19, num_x: Number(editForm.num_x), num_y: Number(editForm.num_y), num_size: Number(editForm.num_size) }} edition={7} />
                      </div>
                      <div style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <label style={{ fontSize: 11, color: "var(--muted)" }}>Horizontal: {editForm.num_x}%
                          <input type="range" min="0" max="100" step="0.5" value={editForm.num_x} onChange={e => setEditForm(f => ({ ...f, num_x: e.target.value }))} style={{ width: "100%" }} /></label>
                        <label style={{ fontSize: 11, color: "var(--muted)" }}>Vertical: {editForm.num_y}%
                          <input type="range" min="0" max="100" step="0.5" value={editForm.num_y} onChange={e => setEditForm(f => ({ ...f, num_y: e.target.value }))} style={{ width: "100%" }} /></label>
                        <label style={{ fontSize: 11, color: "var(--muted)" }}>Tamaño: {editForm.num_size}
                          <input type="range" min="2" max="16" step="0.5" value={editForm.num_size} onChange={e => setEditForm(f => ({ ...f, num_size: e.target.value }))} style={{ width: "100%" }} /></label>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={guardarEdit} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Guardar cambios</button>
                  <button onClick={() => setEditForm(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reveal de sobre (cartas volteadas) */}
      {reveal && <RevealModal items={reveal.items} godpack={reveal.godpack} tipo={reveal.tipo} onClose={() => setReveal(null)} />}

      {/* Detalle de carta */}
      {/* perfil de coleccionista (al tocar una fila del ranking) */}
      {profCol && (() => {
        const prof = profiles.find(p => p.id === profCol);
        const nbi = {}; nfts.forEach(n => { nbi[n.id] = n; });
        const grouped = {};
        allOwned.filter(o => o.user_id === profCol).forEach(o => {
          const n = nbi[o.nft_id]; if (!n) return;
          if (!grouped[o.nft_id]) grouped[o.nft_id] = { nft: n, eds: [] };
          grouped[o.nft_id].eds.push(o.edition);
        });
        const rank = { legendary: 0, limited: 1, common: 2 };
        const list = Object.values(grouped).sort((a, b) => (rank[a.nft.rareza] - rank[b.nft.rareza]) || (a.nft.nombre || "").localeCompare(b.nft.nombre || ""));
        let leg = 0, lim = 0, com = 0, valor = 0;
        list.forEach(g => { const c = g.eds.length; if (g.nft.rareza === "legendary") { leg += c; valor += c * 100; } else if (g.nft.rareza === "limited") { lim += c; valor += c * 10; } else { com += c; valor += c; } });
        const distintas = list.length, total = nfts.length, pct = total > 0 ? Math.round(distintas / total * 100) : 0;
        const me = profCol === user.id;
        const featured = Array.isArray(prof?.featured_nfts) ? prof.featured_nfts : [];
        const Stat = ({ v, l }) => <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)" }}>{v}</div><div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .4 }}>{l}</div></div>;
        return (
          <div onClick={() => setProfCol(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1080, padding: 16, overflowY: "auto" }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar profile={prof} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(prof && prof.name) || "Coleccionista"}{me ? " (vos)" : ""}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>🟡 {leg} · 🔵 {lim} · ⚪ {com}</div>
                  </div>
                  <button onClick={() => setProfCol(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14 }}>
                  <Stat v={valor} l="valor" /><Stat v={distintas} l="distintas" /><Stat v={`${pct}%`} l="del álbum" />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
                {featured.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, marginBottom: 8 }}>⭐ DESTACADAS</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {featured.slice(0, 3).map((c, i) => <div key={i} style={{ width: 84 }}><NFTCard nft={c} edition={c.rareza === "limited" ? c.edition : null} /></div>)}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>COLECCIÓN ({distintas})</div>
                {list.length === 0
                  ? <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>Todavía no tiene cartas.</div>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(82px, 1fr))", gap: 10 }}>
                      {list.map(g => (
                        <div key={g.nft.id} onClick={() => { setProfCol(null); setDetail(g.nft); }} style={{ cursor: "pointer" }}>
                          <NFTCard nft={g.nft} edition={g.eds[0]} />
                          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.nft.nombre}{g.eds.length > 1 ? ` ·x${g.eds.length}` : ""}</div>
                        </div>
                      ))}
                    </div>}
              </div>
            </div>
          </div>
        );
      })()}

      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: "fixed", inset: 0, background: detail.rareza === "legendary" ? "radial-gradient(circle at 50% 36%, rgba(74,55,12,.94), rgba(0,0,0,.93) 62%)" : detail.rareza === "limited" ? "radial-gradient(circle at 50% 36%, rgba(28,44,74,.94), rgba(0,0,0,.93) 62%)" : "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 18, overflowY: "auto" }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 380, width: "100%", padding: "20px 18px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div className={`hero-glow hero-${detail.rareza}`} />
              <div style={{ position: "relative", zIndex: 1 }}><NFTCard nft={detail} edition={detail.rareza === "limited" ? detEd : null} big /></div>
            </div>
            {detail.rareza !== "common" && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>✋ Arrastrá la carta para inclinarla</div>}
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 14 }}>{detail.nombre}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: NFT_RAR[detail.rareza].c, marginTop: 2 }}>{NFT_RAR[detail.rareza].t}{detail.rareza === "limited" ? ` · ${countOwned(detail.id)}/${detail.supply_max || 19}` : detail.rareza === "legendary" ? " · 1 de 1" : ` · ${countOwned(detail.id)} en circulación`}</div>
            {(() => {
              const myEds = owned.filter(o => o.nft_id === detail.id).map(o => o.edition).sort((a, b) => a - b);
              if (detail.rareza !== "limited" || myEds.length < 2) return null;
              return (
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Tus ediciones:</span>
                  {myEds.map(e => (
                    <button key={e} onClick={() => setDetEd(e)}
                      style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        border: "1px solid " + (detEd === e ? "var(--gold)" : "var(--border)"),
                        background: detEd === e ? "var(--gold)" : "none",
                        color: detEd === e ? "#1a1a1a" : "var(--txt)" }}>#{String(e).padStart(2, "0")}</button>
                  ))}
                </div>
              );
            })()}
            {detail.descripcion && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{detail.descripcion}</div>}
            {(detail.rareza === "limited" || detail.rareza === "legendary") && (() => {
              const myRows = owned.filter(o => o.nft_id === detail.id);
              if (myRows.length === 0) return null;
              const recRow = detail.rareza === "limited" ? (myRows.find(o => o.edition === detEd) || myRows[0]) : myRows[0];
              const fb = { limited: 10, legendary: 1000 };
              const reward = (cfg && cfg[`reciclar_${detail.rareza}`] != null) ? cfg[`reciclar_${detail.rareza}`] : fb[detail.rareza];
              return (
                <button onClick={() => setRecConfirm({ tipo: "una", ownedId: recRow.id, edition: recRow.edition, reward, nombre: detail.nombre, rareza: detail.rareza })}
                  style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--txt)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  ♻️ Reciclar {detail.rareza === "limited" ? `la #${String(recRow.edition).padStart(2, "0")}` : "esta legendary"} por {reward} Petros
                </button>
              );
            })()}
            <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {REACT_EMOJIS.map(em => {
                const cnt = nftReacts.filter(r => r.nft_id === detail.id && r.emoji === em).length;
                const mine = nftReacts.some(r => r.nft_id === detail.id && r.user_id === user.id && r.emoji === em);
                return (
                  <button key={em} onClick={() => toggleReaction(detail.id, em)} title={mine ? "Sacar reacción" : "Reaccionar"}
                    style={{ padding: "5px 11px", borderRadius: 999, fontSize: 15, cursor: "pointer", border: "1px solid " + (mine ? "var(--gold)" : "var(--border)"), background: mine ? "rgba(245,183,49,.16)" : "var(--surface)", display: "flex", alignItems: "center", gap: 5, lineHeight: 1 }}>
                    <span>{em}</span>{cnt > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: mine ? "var(--gold)" : "var(--muted)" }}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => toggleWishlist(detail.id)}
              style={{ marginTop: 12, padding: "7px 14px", borderRadius: 999, border: "1px solid " + (wishlist.includes(detail.id) ? "var(--gold)" : "var(--border)"), background: wishlist.includes(detail.id) ? "rgba(245,183,49,.16)" : "var(--surface)", color: wishlist.includes(detail.id) ? "var(--gold)" : "var(--txt)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {wishlist.includes(detail.id) ? "📌 En tu wishlist ✓" : "📌 Agregar a wishlist"}
            </button>
            <div style={{ marginTop: 14, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 6 }}>DUEÑOS</div>
              {allOwned.filter(o => o.nft_id === detail.id).sort((a, b) => a.edition - b.edition).map((o, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{nameOf(o.user_id)}</span>
                  <span style={{ color: NFT_RAR[detail.rareza].c, fontWeight: 700 }}>{detail.rareza === "common" ? "✓" : "#" + String(o.edition).padStart(2, "0")}</span>
                </div>
              ))}
              {allOwned.filter(o => o.nft_id === detail.id).length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>Nadie la tiene todavía.</div>}
            </div>
            <button onClick={() => setDetail(null)} style={{ marginTop: 16, padding: "9px 22px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* selector de reciclaje */}
      {recPick && (() => {
        const ownedByRar = { common: [], limited: [], legendary: [] };
        owned.forEach(o => { if (o.nft && ownedByRar[o.nft.rareza]) ownedByRar[o.nft.rareza].push(o); });
        Object.values(ownedByRar).forEach(arr => arr.sort((a, b) => (a.nft.nombre || "").localeCompare(b.nft.nombre || "") || (a.edition - b.edition)));
        const need = recRar === "common" ? 5 : 1;
        const reward = recRar === "common" ? (cfg && cfg.reciclar_common != null ? cfg.reciclar_common : 3) : recRar === "limited" ? (cfg && cfg.reciclar_limited != null ? cfg.reciclar_limited : 10) : (cfg && cfg.reciclar_legendary != null ? cfg.reciclar_legendary : 1000);
        const list = ownedByRar[recRar];
        const canDo = recSel.length === need;
        const tabs = [["common", "Comunes", ownedByRar.common.length], ["limited", "Limited", ownedByRar.limited.length], ["legendary", "Legendary", ownedByRar.legendary.length]];
        return (
          <div onClick={() => setRecPick(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1310, padding: 16 }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 520, width: "100%", maxHeight: "86vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>♻️ Reciclar cartas</div>
                  <button onClick={() => setRecPick(false)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Elegí cuáles reciclar. {recRar === "common" ? "Comunes van de a 5." : "De a 1."} Recompensa: <b style={{ color: "var(--gold)" }}>{reward} Petros</b>.</div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  {tabs.map(([r, lab, n]) => (
                    <button key={r} onClick={() => { setRecRar(r); setRecSel([]); }}
                      style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: "1px solid " + (recRar === r ? "var(--gold)" : "var(--border)"), background: recRar === r ? "rgba(245,183,49,.14)" : "var(--surface)", color: recRar === r ? "var(--gold)" : "var(--txt)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {lab} <span style={{ opacity: .7 }}>({n})</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 12px" }}>
                {list.length === 0
                  ? <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>No tenés cartas {recRar === "common" ? "comunes" : recRar}.</div>
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 10 }}>
                      {list.map(o => {
                        const seld = recSel.includes(o.id);
                        return (
                          <div key={o.id} onClick={() => setRecSel(prev => prev.includes(o.id) ? prev.filter(x => x !== o.id) : (recRar === "common" ? (prev.length >= 5 ? prev : [...prev, o.id]) : [o.id]))}
                            style={{ cursor: "pointer", borderRadius: 12, padding: 3, border: "2px solid " + (seld ? "var(--gold)" : "transparent"), position: "relative" }}>
                            <NFTCard nft={o.nft} edition={o.nft.rareza === "limited" ? o.edition : null} />
                            {seld && <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "var(--gold)", color: "#1a1a1a", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>}
                          </div>
                        );
                      })}
                    </div>}
              </div>
              <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Elegidas: <b style={{ color: canDo ? "var(--gold)" : "var(--txt)" }}>{recSel.length}/{need}</b></div>
                <button disabled={!canDo}
                  onClick={() => { if (!canDo) return; if (recRar === "common") setRecConfirm({ tipo: "comunes_sel", ids: [...recSel], reward }); else { const row = list.find(o => o.id === recSel[0]); if (row) setRecConfirm({ tipo: "una", ownedId: row.id, edition: row.edition, reward, nombre: row.nft.nombre, rareza: row.nft.rareza }); } }}
                  style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: canDo ? "var(--gold)" : "var(--surface)", color: canDo ? "#1a1a1a" : "var(--muted)", fontWeight: 800, fontSize: 14, cursor: canDo ? "pointer" : "not-allowed" }}>
                  Reciclar (+{reward})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* confirmar reciclaje */}
      {recConfirm && (
        <div onClick={() => setRecConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1320, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: "100%", padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>♻️</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{recConfirm.tipo === "una" ? "¿Reciclar esta carta?" : "¿Reciclar estas 5 comunes?"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
              {recConfirm.tipo === "una"
                ? <>Vas a quemar <b style={{ color: "var(--txt)" }}>{recConfirm.nombre}{recConfirm.rareza === "limited" ? ` #${String(recConfirm.edition).padStart(2, "0")}` : ""}</b> y recibís <b style={{ color: "var(--gold)" }}>{recConfirm.reward} Petros</b>. Esto no se puede deshacer.</>
                : <>Vas a quemar <b style={{ color: "var(--txt)" }}>las 5 cartas comunes que elegiste</b> y recibís <b style={{ color: "var(--gold)" }}>{recConfirm.reward} Petros</b>. Esto no se puede deshacer.</>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={() => recConfirm.tipo === "una" ? reciclar(recConfirm.ownedId) : reciclarComunesSel(recConfirm.ids)} disabled={guardando} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{guardando ? "..." : "Sí, reciclar"}</button>
              <button onClick={() => setRecConfirm(null)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* mensajes */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: "100%", padding: "22px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{modal.msg}</div>
            <button onClick={() => setModal(null)} style={{ marginTop: 16, padding: "8px 22px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#1a1a1a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [mercadoPend, setMercadoPend] = useState(0);
  useEffect(() => { (async () => { try { const { data } = await sb.rpc("mercado_pendientes"); setMercadoPend(data || 0); } catch (e) {} })(); }, [tab]);
  const [booting, setBooting] = useState(true);
  const [matches, setMatches] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [loaded, setLoaded] = useState(false); // true tras la primera carga (para skeletons)
  const [myPredictions, setMyPredictions] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [mySpent, setMySpent] = useState(0);
  const [avisos, setAvisos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileToOpen, setProfileToOpen] = useState(null);
  const [compareMatchId, setCompareMatchId] = useState(null);
  function openMyProfile() { setProfileToOpen(user.id); goTab("standings"); }
  function goToCompare(matchId) { setCompareMatchId(matchId); goTab("compare"); }
  const [notifStatus, setNotifStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);
  const [notifDebug, setNotifDebug] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  const [showDebtorOverlay, setShowDebtorOverlay] = useState(false);
  const [showDebtorVideo, setShowDebtorVideo] = useState(false);
  const [debtorVideoIndex, setDebtorVideoIndex] = useState(0);
  const [showPredReminder, setShowPredReminder] = useState(false);
  const [breakingNews, setBreakingNews] = useState(null);       // noticia activa (o null)
  const [showNews, setShowNews] = useState(false);
  const newsHandledRef = React.useRef(null);                     // id de noticia ya procesada en esta sesión
  const [latestChronicleKey, setLatestChronicleKey] = useState(null); // identificador de la última crónica publicada
  const [chronicaSeenKey, setChronicaSeenKey] = useState(() => localStorage.getItem("cronica-seen") || null);

  // Activar overlay solo si el usuario es moroso, cuando los profiles cargan
  useEffect(() => {
    if (!user || !profiles.length) return;
    const myProfile = profiles.find(p => p.id === user.id);
    if (myProfile?.is_debtor === true) {
      setShowDebtorOverlay(true);
    } else {
      setShowDebtorOverlay(false);
    }
  }, [user, profiles]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastRank, setLastRank] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);
  const [savedAchKeys, setSavedAchKeys] = useState(null);
  const [wildcards, setWildcards] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [prePreds, setPrePreds] = useState([]);

  const hasNewChronicle = !!latestChronicleKey && latestChronicleKey !== chronicaSeenKey;
  const [appLastTab, setAppLastTab] = useState({ inicio: "home", jugar: "predicciones", resultados: "standings", comunidad: "cronica", coleccionables: "coleccion", info: "info", adminG: "admin" });
  const [openGroup, setOpenGroup] = useState(null);
  function goTab(t) {
    setTab(t);
    setMenuOpen(false);
    const g = APP_GRUPOS.find(gr => gr.tabs.some(x => x[0] === t));
    if (g) setAppLastTab(prev => ({ ...prev, [g.key]: t }));
    if (t === "cronica" && latestChronicleKey) {
      setChronicaSeenKey(latestChronicleKey);
      localStorage.setItem("cronica-seen", latestChronicleKey);
    }
  }
  const grupoActivoApp = APP_GRUPOS.find(g => g.tabs.some(t => t[0] === tab)) || APP_GRUPOS[0];

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Video periódico para morosos — intervalo configurable desde admin
  useEffect(() => {
    if (!user || !profiles.length) return;
    const isDebtor = profiles.find(p => p.id === user.id)?.is_debtor;
    const isElim = profiles.find(p => p.id === user.id)?.is_eliminated;
    if (!isDebtor && !isElim) return;
    sb.from("scoring_rules").select("rule_value").eq("rule_key", "debtor_video_interval").single()
      .then(({ data }) => {
        const mins = data?.rule_value || 120;
        const interval = setInterval(() => {
          setDebtorVideoIndex(i => i + 1);
          setShowDebtorVideo(true);
        }, mins * 1000);
        window._debtorInterval = interval;
      });
    return () => { if (window._debtorInterval) clearInterval(window._debtorInterval); };
  }, [user, profiles]);

  // Recordatorio de predicciones pendientes — cada PRED_REMINDER_MINUTES min mientras falte <24h para cerrar
  useEffect(() => {
    if (!user || !matches.length) return;
    const check = () => {
      const r = getPendingPredReminder(matches, allPredictions, user.id);
      if (r && !predReminderSnoozed(r.date)) setShowPredReminder(true);
    };
    check();
    const interval = setInterval(check, PRED_REMINDER_MINUTES * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, matches, allPredictions]);

  // Confetti cuando subís en la tabla
  useEffect(() => {
    if (!profiles.length || !allPredictions.length) return;
    const myPts = allPredictions.filter(p => p.user_id === user?.id).reduce((s,p) => s+(p.points||0),0);
    const rank = profiles.map(p => ({
      id: p.id,
      pts: allPredictions.filter(pr => pr.user_id === p.id).reduce((s,pr) => s+(pr.points||0),0)
    })).sort((a,b) => b.pts-a.pts).findIndex(p => p.id === user?.id) + 1;
    if (lastRank !== null && rank < lastRank && rank > 0) setShowConfetti(true);
    if (rank > 0) setLastRank(rank);
  }, [allPredictions]);

  // ── FIX iOS: Register SW + guard Notification API ──────────────────────────
  useEffect(() => {
    // Registrar SW (silencioso, no bloquea nada)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(reg => reg.update())
        .catch(console.warn);
    }

    // Guard crítico: Notification NO existe en iOS Safari sin PWA instalada
    if (typeof Notification === "undefined") {
      setNotifStatus("unsupported");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") setNotifStatus("granted");
    else if (perm === "denied") setNotifStatus("denied");
    // si es "default" → queda en "idle"
  }, []);

  // ── FIX iOS: enableNotifications con guard completo ────────────────────────
  async function enableNotifications() {
    // Sin API de Notification → no hacer nada
    if (typeof Notification === "undefined") {
      setNotifDebug("Notificaciones no soportadas en este navegador");
      setNotifStatus("unsupported");
      return;
    }

    // En iOS: solo funciona si la app está instalada como PWA
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    if (isIOS && !isStandalone) {
      setNotifDebug("En iPhone: primero instalá la app (Compartir → Agregar a inicio)");
      setNotifStatus("unsupported");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setNotifDebug("SW no soportado");
      setNotifStatus("unsupported");
      return;
    }

    setNotifStatus("requesting");
    setNotifDebug("Solicitando permiso...");

    try {
      // Pedir permiso explícitamente primero
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifStatus("denied");
        setNotifDebug("Permiso denegado");
        return;
      }

      setNotifDebug("Cargando Firebase...");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
      setNotifDebug("Firebase cargado. Iniciando...");

      const firebaseApp = window.firebase.apps.length === 0
        ? window.firebase.initializeApp(FIREBASE_CONFIG)
        : window.firebase.apps[0];
      const messaging = window.firebase.messaging();
      setNotifDebug("Esperando SW...");

      const swReg = await navigator.serviceWorker.ready;
      setNotifDebug("SW listo. Obteniendo token...");

      const token = await messaging.getToken({
        vapidKey: FCM_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) { setNotifStatus("denied"); setNotifDebug("Token vacío"); return; }
      setNotifDebug("Token: " + token.slice(0, 20) + "...");

      await sb.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: token,
        p256dh: "fcm",
        auth: "fcm",
        fcm_token: token,
      }, { onConflict: "user_id,endpoint" });

      setNotifStatus("granted");
      setNotifDebug("✅ Notificaciones activadas");
    } catch (e) {
      console.warn("FCM error:", e);
      setNotifDebug("Error: " + e.message);
      setNotifStatus("denied");
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function disableNotifications() {
    try {
      await sb.from("push_subscriptions").delete().eq("user_id", user.id);
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.pushManager.getSubscription().then(sub => sub && sub.unsubscribe());
      }
      setNotifStatus("idle");
    } catch (e) {
      console.warn("Disable notifications error:", e);
      setNotifStatus("idle");
    }
  }

  useEffect(() => {
    // Sincronizar el reloj con el servidor al arrancar y cada 5 min (compensa teléfonos con la hora corrida)
    syncServerClock(sb);
    const clockTimer = setInterval(() => syncServerClock(sb), 5 * 60 * 1000);

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setIsAdmin(false); setBooting(false); return; }
      if (event === "PASSWORD_RECOVERY") { setResettingPassword(true); setBooting(false); return; }
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ ...session.user, profile });
      } else { setUser(null); setIsAdmin(false); }
      setBooting(false);
    });

    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ ...session.user, profile });
      }
      setBooting(false);
    });

    return () => { subscription.unsubscribe(); clearInterval(clockTimer); };
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [mq, myPq, allPq, profq, adminq, purchq] = await Promise.all([
      sb.from("matches").select("*").order("kickoff_at"),
      sb.from("predictions").select("*").eq("user_id", user.id),
      (async () => ({ data: await fetchAllPredictions() }))(),
      sb.from("profiles").select("*"),
      sb.from("admins").select("*").eq("user_id", user.id),
      sb.from("store_purchases").select("precio").eq("user_id", user.id),
    ]);
    const firstErr = mq.error || myPq.error || allPq.error || profq.error || adminq.error;
    if (firstErr) {
      console.error("loadData error:", firstErr);
      setLoadError(true);
    } else {
      setLoadError(false);
    }
    // Solo pisar el estado con datos que llegaron bien (no vaciar la app por un fallo transitorio)
    if (mq.data) setMatches(mq.data);
    if (myPq.data) setMyPredictions(myPq.data);
    if (allPq.data) setAllPredictions(allPq.data);
    if (profq.data) setProfiles(profq.data);
    {
      const { data: av } = await sb.from("avisos").select("*")
        .eq("user_id", user.id).eq("leido", false).order("created_at", { ascending: true });
      if (av) setAvisos(av);
    }
    if (purchq && purchq.data) setMySpent(purchq.data.reduce((s, p) => s + (p.precio || 0), 0));
    if (adminq.data) setIsAdmin(adminq.data.length>0);
    setLoaded(true);
    // Última crónica publicada (para el puntito de aviso en la pestaña Crónica)
    const { data: lastChron } = await sb.from("chronicles")
      .select("id, updated_at").eq("published", true)
      .order("updated_at", { ascending: false }).limit(1);
    if (lastChron && lastChron.length) setLatestChronicleKey(String(lastChron[0].id));
    // Noticia de última hora activa más reciente que aplique a este jugador
    const { data: news } = await sb.from("breaking_news")
      .select("*").eq("active", true)
      .order("created_at", { ascending: false }).limit(8);
    const applicable = (news || []).find(n => {
      const t = n.target_users;
      if (!t || !Array.isArray(t) || t.length === 0) return true; // para todos
      return t.includes(user.id);
    });
    setBreakingNews(applicable || null);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load extra data needed for achievements
  const loadAchievementData = useCallback(async () => {
    if (!user) return;
    const [{ data: wc }, { data: snaps }, { data: pp }, { data: prof }, { data: savedAch }] = await Promise.all([
      sb.from("wildcards").select("*"),
      sb.from("ranking_snapshots").select("*").order("snapshot_date"),
      sb.from("pretournament_predictions").select("*"),
      sb.from("profiles").select("equipped_badge").eq("id", user.id).single(),
      sb.from("achievements").select("achievement_key").eq("user_id", user.id),
    ]);
    setWildcards(wc || []);
    setSnapshots(snaps || []);
    setPrePreds(pp || []);
    if (prof?.equipped_badge) setEquippedBadge(prof.equipped_badge);
    setSavedAchKeys(new Set((savedAch || []).map(a => a.achievement_key)));
  }, [user]);

  useEffect(() => { loadAchievementData(); }, [loadAchievementData]);

  // Recalculate achievements whenever data changes
  useEffect(() => {
    if (!user || !allPredictions.length && !matches.length) return;
    const unlocked = calcAchievements({
      predictions: allPredictions, matches, wildcards, snapshots, prePreds, userId: user.id
    });
    setUnlockedAchievements(unlocked);
    // Esperar a tener los logros ya guardados en la DB antes de comparar
    if (savedAchKeys === null) return;
    // Nuevos = desbloqueados pero todavía NO guardados en la DB
    const newKeys = [...unlocked].filter(k => !savedAchKeys.has(k));
    if (newKeys.length === 0) return;
    // Guardar los nuevos en la DB (DIAGNÓSTICO: muestra el error si falla)
    (async () => {
      for (const k of newKeys) {
        const { error } = await sb
          .from("achievements")
          .upsert({ user_id: user.id, achievement_key: k }, { onConflict: "user_id,achievement_key" })
          .select();
        if (error) {
          console.error("No se pudo guardar el logro", k, error);
          break;
        }
      }
    })();
    // Mostrar popup del primer logro nuevo
    const ach = ACHIEVEMENTS.find(a => a.key === newKeys[0]);
    if (ach) setAchievementToast(ach);
    // Marcar como conocidos para no repetir el popup
    setSavedAchKeys(prev => {
      const next = new Set(prev);
      newKeys.forEach(k => next.add(k));
      return next;
    });
  }, [allPredictions, matches, wildcards, snapshots, prePreds, user, savedAchKeys]);

  async function handleEquipBadge(key) {
    setEquippedBadge(key);
    await sb.from("profiles").update({ equipped_badge: key }).eq("id", user.id);
    // Update local profiles list so standings refreshes
    setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, equipped_badge: key } : p));
  }

  async function handleLogout() { await sb.auth.signOut(); setUser(null); }

  // Decide si mostrar el popup de última hora: a cada jugador se le muestra
  // show_count veces (contador guardado en su dispositivo). Se procesa una vez
  // por sesión y por noticia, así un refresh de datos no lo vuelve a disparar.
  useEffect(() => {
    if (!breakingNews) { setShowNews(false); return; }
    if (newsHandledRef.current === breakingNews.id) return;
    newsHandledRef.current = breakingNews.id;
    const key = "news-count-" + breakingNews.id;
    const shown = parseInt(localStorage.getItem(key) || "0", 10);
    const max = breakingNews.show_count == null ? Infinity : Number(breakingNews.show_count);
    if (shown < max) {
      localStorage.setItem(key, String(shown + 1));
      setShowNews(true);
    } else {
      setShowNews(false);
    }
  }, [breakingNews]);
  function dismissNews() { setShowNews(false); }

  if (booting) return (<><style>{css}</style><div className="spinner"><div className="spin"/><span>Cargando...</span></div></>);
  if (resettingPassword) return (<><style>{css}</style><ResetPasswordScreen onDone={() => setResettingPassword(false)}/></>);
  if (!user) return (<><style>{css}</style><AuthScreen onAuth={setUser}/></>);

  const myWalletPts = (allPredictions || []).filter(p => p.user_id === user.id).reduce((s, p) => s + (p.points || 0), 0);
  const myWallet = myWalletPts * TIENDA_RATE + (user.profile?.monedas_bonus || 0) - mySpent;

  async function cerrarAvisos() {
    const ids = avisos.map(a => a.id);
    setAvisos([]);
    if (ids.length) await sb.from("avisos").update({ leido: true }).in("id", ids);
  }

  return (<><style>{css}</style>
    <div className={`shell${darkMode ? "" : " light-mode"}`}>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      {loadError && (
        <div style={{background:"rgba(180,40,40,0.95)",color:"#fff",padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:13,position:"sticky",top:0,zIndex:200}}>
          <span>⚠️ Error de conexión: algunos datos no cargaron.</span>
          <button onClick={loadData} style={{background:"#fff",color:"#8a1f1f",border:"none",borderRadius:7,padding:"5px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>Reintentar</button>
        </div>
      )}
      {user && notifStatus !== "unsupported" && notifStatus !== "granted" && !notifBannerDismissed && (
        <div style={{background:"linear-gradient(90deg, rgba(245,183,49,0.18), rgba(245,183,49,0.08))",borderBottom:"1px solid rgba(245,183,49,0.3)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontSize:13,flexWrap:"wrap"}}>
          <span style={{color:"var(--txt)"}}>🔔 {notifStatus === "denied" ? "Tenés las notificaciones bloqueadas. Activalas en los ajustes del navegador para que te avisemos antes del cierre." : "Activá las notificaciones y te avisamos antes de que cierre cada jornada."}</span>
          {notifStatus !== "denied" && (
            <button onClick={enableNotifications} disabled={notifStatus === "requesting"} style={{background:"var(--gold)",color:"#1a1a1a",border:"none",borderRadius:7,padding:"6px 16px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {notifStatus === "requesting" ? "Activando..." : "Activar"}
            </button>
          )}
          <button onClick={()=>setNotifBannerDismissed(true)} style={{background:"none",border:"none",color:"var(--muted)",fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
        </div>
      )}
      <nav className="nav">
        <div className="nav-brand">🏆 QUINIELA 2026</div>
        <div className="nav-tabs" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {APP_GRUPOS.filter(g => !g.adminOnly || isAdmin).map(g => {
              const on = grupoActivoApp.key === g.key;
              const dot = (g.tabs.some(t => t[0] === "cronica") && hasNewChronicle) || (g.key === "coleccionables" && mercadoPend > 0);
              return (
                <button key={g.key} className={`nav-tab ${g.adminOnly ? "admin-tab " : ""}${on ? "active" : ""}`} onClick={() => goTab(appLastTab[g.key] || g.tabs[0][0])} style={{ position: "relative" }}>
                  {g.emoji} {g.label}{dot && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 0 2px var(--bg)" }} />}
                </button>
              );
            })}
          </div>
          {grupoActivoApp.tabs.length > 1 && (
            <div style={{ display: "inline-flex", background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 999, padding: 3, gap: 2, flexWrap: "wrap" }}>
              {grupoActivoApp.tabs.map(([k, emo, lab]) => {
                const on = tab === k; const dot = k === "cronica" && hasNewChronicle;
                return (
                  <button key={k} onClick={() => goTab(k)} style={{ position: "relative", padding: "6px 13px", borderRadius: 999, border: "none", background: on ? "var(--gold)" : "transparent", color: on ? "#1a1a1a" : "var(--muted)", fontSize: 12, fontWeight: on ? 800 : 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {emo} {lab}{dot && <span style={{ position: "absolute", top: 2, right: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="nav-user">
          <button onClick={()=>goTab("tienda")} title="Mi cartera" style={{display:"inline-flex",alignItems:"center",gap:5,background:"var(--gold-dim)",border:"1px solid var(--gold)",borderRadius:8,cursor:"pointer",padding:"6px 10px",color:"var(--gold)",fontWeight:800,fontSize:14,lineHeight:1}}><PetroCoin size={16}/> {isAdmin ? "∞" : myWallet}</button>
          <button className="mobile-only" onClick={()=>goTab("tienda")} title="Tienda" style={{background:"var(--gold-dim)",border:"1px solid var(--gold)",borderRadius:8,cursor:"pointer",padding:"7px 9px",fontSize:18,lineHeight:1,alignItems:"center"}}>🛒</button>
          <button onClick={()=>goTab("coleccion")} title="Colección NFT" style={{background:"var(--gold-dim)",border:"1px solid var(--gold)",borderRadius:8,cursor:"pointer",padding:"7px 11px",color:"var(--gold)",fontWeight:800,fontSize:13,lineHeight:1,letterSpacing:0.5,alignItems:"center"}}>NFT</button>
          <div onClick={openMyProfile} style={{cursor:"pointer"}} title="Ver mi perfil">
            <Avatar profile={user.profile} />
          </div>
          <span style={{fontSize:13}} className="desktop-only">{user.profile?.name||user.email}</span>
          <button className="theme-toggle desktop-only" onClick={toggleTheme} title={darkMode ? "Modo claro" : "Modo oscuro"}>{darkMode ? "☀️" : "🌙"}</button>
          <button className="btn-logout desktop-only" onClick={handleLogout}>Salir</button>
          {notifStatus !== "unsupported" && notifStatus !== "granted" && (
            <button className="desktop-only" onClick={enableNotifications} disabled={notifStatus === "requesting" || notifStatus === "denied"} style={{padding:"6px 13px",background:"none",border:"1px solid var(--gold)",borderRadius:7,color:"var(--gold)",fontSize:12,cursor:notifStatus==="denied"?"not-allowed":"pointer",opacity:notifStatus==="denied"?0.5:1}}>
              {notifStatus === "requesting" ? "..." : notifStatus === "denied" ? "🔕 Bloqueado" : "🔔 Activar"}
            </button>
          )}
          {notifStatus === "granted" && (
            <button className="desktop-only" onClick={disableNotifications} style={{padding:"6px 13px",background:"none",border:"1px solid var(--green)",borderRadius:7,color:"var(--green)",fontSize:12,cursor:"pointer"}}>🔔 Activado</button>
          )}
          <button className="hamburger" onClick={()=>setMenuOpen(o=>!o)}><span/><span/><span/></button>
        </div>
      </nav>

      {avisos.length > 0 && (
        <div onClick={cerrarAvisos} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--card)", border: "1px solid var(--gold)", borderRadius: 16, maxWidth: 360, width: "100%", padding: "26px 22px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}>
            <div style={{ fontSize: 42, marginBottom: 6 }}>{avisos.length === 1 ? (avisos[0].emoji || "📩") : "🔔"}</div>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 25, color: "var(--gold)", letterSpacing: 1, marginBottom: 10 }}>
              {avisos.length === 1 ? (avisos[0].titulo || "¡Tenés un aviso!") : `¡Tenés ${avisos.length} avisos!`}
            </div>
            {avisos.length === 1
              ? <p style={{ fontSize: 14.5, color: "var(--txt)", lineHeight: 1.55, marginBottom: 18 }}>{avisos[0].texto}</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", marginBottom: 18 }}>
                  {avisos.map(a => (
                    <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px" }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{a.emoji || "📩"}</span>
                      <span style={{ fontSize: 13.5, color: "var(--txt)", lineHeight: 1.4 }}>{a.texto}</span>
                    </div>
                  ))}
                </div>}
            <button onClick={cerrarAvisos} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "var(--gold)", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Entendido</button>
          </div>
        </div>
      )}
      <div className={`mobile-menu ${menuOpen?"open":""}`}>
        {APP_GRUPOS.filter(g => !g.adminOnly || isAdmin).map(g => {
          const on = grupoActivoApp.key === g.key;
          const multi = g.tabs.length > 1;
          const expanded = openGroup === null ? on : (openGroup === g.key);
          const dot = (g.tabs.some(t => t[0] === "cronica") && hasNewChronicle) || (g.key === "coleccionables" && mercadoPend > 0);
          return (
            <React.Fragment key={g.key}>
              <button className={`mobile-nav-tab ${g.adminOnly ? "admin-tab " : ""}${on ? "active" : ""}`}
                onClick={() => multi ? setOpenGroup(expanded ? "" : g.key) : goTab(g.tabs[0][0])}
                style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{g.emoji} {g.label}</span>
                {multi && <span style={{ fontSize: 12, color: "var(--muted)", transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>}
                {dot && <span style={{ position: "absolute", top: 8, right: 32, width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />}
              </button>
              {multi && expanded && g.tabs.map(([k, emo, lab]) => (
                <button key={k} className={`mobile-nav-tab ${tab === k ? "active" : ""}`} onClick={() => goTab(k)} style={{ paddingLeft: 34, fontSize: 14, position: "relative" }}>{emo} {lab}{k === "cronica" && hasNewChronicle && <span style={{ position: "absolute", top: 8, right: 14, width: 8, height: 8, borderRadius: "50%", background: "var(--red)" }} />}</button>
              ))}
            </React.Fragment>
          );
        })}
        <div style={{borderTop:"1px solid var(--border)",marginTop:4,paddingTop:8,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px"}}>
          <span style={{fontSize:13,color:"var(--muted)"}}>{user.profile?.name||user.email}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {notifStatus !== "unsupported" && notifStatus !== "granted" && (
              <button onClick={enableNotifications} disabled={notifStatus === "requesting" || notifStatus === "denied"} style={{padding:"6px 13px",background:"none",border:"1px solid var(--gold)",borderRadius:7,color:"var(--gold)",fontSize:12,cursor:notifStatus==="denied"?"not-allowed":"pointer",opacity:notifStatus==="denied"?0.5:1}}>
                {notifStatus === "requesting" ? "..." : notifStatus === "denied" ? "🔕 Bloqueado" : "🔔 Activar avisos"}
              </button>
            )}
            {notifStatus === "granted" && (
              <button onClick={disableNotifications} style={{padding:"6px 13px",background:"none",border:"1px solid var(--green)",borderRadius:7,color:"var(--green)",fontSize:12,cursor:"pointer"}}>🔔 Activado</button>
            )}
            <button className="btn-logout" onClick={handleLogout}>Salir</button>
          </div>
          {notifDebug ? <div style={{fontSize:11,color:"var(--muted)",padding:"4px 0 4px 14px",wordBreak:"break-all"}}>{notifDebug}</div> : null}
        </div>
      </div>
      <main className="main">
        {achievementToast && <AchievementToast achievement={achievementToast} onClose={() => setAchievementToast(null)} />}
        {tab==="home"      && (loaded ? <Dashboard user={user} matches={matches} predictions={allPredictions} onGoTab={goTab} onGoCompare={goToCompare} achievements={unlockedAchievements} equippedBadge={equippedBadge} onEquip={handleEquipBadge}/> : <SkeletonDashboard/>)}
        {tab==="predicciones" && <PrediccionesTab user={user} matches={matches} myPredictions={myPredictions} allPredictions={allPredictions} profiles={profiles} onSave={loadData}/>}
        {tab==="cronica"   && <CronicaTab user={user} isAdmin={isAdmin} matches={matches} allPredictions={allPredictions} profiles={profiles}/>}
        {tab==="compare"   && <Compare user={user} matches={matches} allPredictions={allPredictions} profiles={profiles} autoOpenMatchId={compareMatchId} onAutoOpened={()=>setCompareMatchId(null)}/>}
        {tab==="standings" && (loaded ? <Standings user={user} predictions={allPredictions} matches={matches} profiles={profiles} onRefresh={loadData} isAdmin={isAdmin} allAchievements={unlockedAchievements} autoOpenUserId={profileToOpen} onAutoOpened={()=>setProfileToOpen(null)}/> : <SkeletonStandings/>)}
        {tab==="stats"     && <StatsDeep user={user} matches={matches} predictions={allPredictions} snapshots={snapshots} profiles={profiles}/>}
        {tab==="fame"      && <HallOfFame profiles={profiles} predictions={allPredictions} matches={matches} snapshots={snapshots}/>}
{tab==="info"      && <InfoTab user={user} isAdmin={isAdmin} matches={matches} allPredictions={allPredictions} profiles={profiles} />}
        {tab==="coleccion" && <Coleccion user={user} profiles={profiles} allPredictions={allPredictions} isAdmin={isAdmin} onRefresh={loadData} mercadoPend={mercadoPend} />}
        {/* Álbum oculto temporalmente — para reactivar, descomentá esta línea y volvé a agregar ["album","📒 Álbum"] en los dos menús de arriba */}
        {/* {tab==="album"     && <Album user={user} profiles={profiles} allPredictions={allPredictions} isAdmin={isAdmin} onRefresh={loadData} />} */}
        {tab==="tienda"    && <Tienda user={user} matches={matches} allPredictions={allPredictions} profiles={profiles} onRefresh={loadData} isAdmin={isAdmin}/>}
        {/* Overlay moroso — se muestra al abrir la app si el usuario tiene deuda */}
        {user && profiles.find(p => p.id === user.id)?.is_debtor && showDebtorOverlay && (
          <DebtorOverlay
            profile={profiles.find(p => p.id === user.id)}
            onDismiss={() => setShowDebtorOverlay(false)}
          />
        )}
        {user && profiles.find(p => p.id === user.id)?.is_debtor && showDebtorVideo && (
          <DebtorVideoPopup
            profile={profiles.find(p => p.id === user.id)}
            videoIndex={debtorVideoIndex}
            onClose={() => setShowDebtorVideo(false)}
          />
        )}
        {user && showPredReminder && (() => {
          const r = getPendingPredReminder(matches, allPredictions, user.id);
          return r ? <PredReminderPopup reminder={r} onGo={() => { goTab("predicciones"); setShowPredReminder(false); }} onClose={() => setShowPredReminder(false)} onSnooze={(date, until) => { snoozePredReminder(date, until); setShowPredReminder(false); }} /> : null;
        })()}
        {user && showNews && !showDebtorOverlay && (
          <BreakingNewsPopup news={breakingNews} onClose={dismissNews} />
        )}
        {tab==="admin"     && isAdmin && <AdminPanel matches={matches} profiles={profiles} onRefresh={loadData}/>}
      </main>
    </div>
  </>);
}
