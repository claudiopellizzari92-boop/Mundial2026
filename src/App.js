import React, { useState, useEffect, useCallback } from "react";
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

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// ─── World Cup 2026 Groups ────────────────────────────────────────────────────
const FLAG = (code) => `https://flagcdn.com/24x18/${code}.png`;
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

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#07090f;--surface:#0d1019;--card:#111520;--card2:#161b28;
  --border:#1c2235;--border2:#242a3a;
  --gold:#f5b731;--gold2:#e09820;--gold-dim:rgba(245,183,49,.12);
  --green:#2adf7a;--green-dim:rgba(42,223,122,.12);
  --red:#ff4d6d;--red-dim:rgba(255,77,109,.12);
  --blue:#4a9eff;--muted:#5a6278;--txt:#dde2f0;--r:12px;
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
.nav-tab{padding:7px 14px;border-radius:8px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;transition:all .2s;}
.nav-tab:hover{background:var(--card2);color:var(--txt);}
.nav-tab.active{background:var(--gold-dim);color:var(--gold);}
.nav-tab.admin-tab{color:var(--red);}
.nav-tab.admin-tab.active{background:var(--red-dim);color:var(--red);}
.nav-user{display:flex;align-items:center;gap:8px;}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#07090f;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.avatar.sm{width:28px;height:28px;font-size:10px;}
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
@keyframes popIn{0%{transform:scale(.5);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}
.light-mode{
  --bg:#f0f2f7;--surface:#ffffff;--card:#ffffff;--card2:#f5f7fc;
  --border:#dde2ee;--border2:#c8cfdf;
  --gold:#d4920a;--gold2:#b87c08;--gold-dim:rgba(212,146,10,.1);
  --green:#16a85a;--green-dim:rgba(22,168,90,.1);
  --red:#e03050;--red-dim:rgba(224,48,80,.1);
  --blue:#2478e8;--muted:#8892a4;--txt:#1a2035;
}
.theme-toggle{padding:6px 10px;background:none;border:1px solid var(--border);border-radius:7px;color:var(--muted);font-size:14px;cursor:pointer;transition:all .2s;}
.theme-toggle:hover{border-color:var(--gold);color:var(--gold);}
.confetti-piece{position:fixed;width:8px;height:8px;top:-10px;z-index:9999;pointer-events:none;animation:confettiFall linear forwards;border-radius:2px;}

/* ── Mobile ── */
.hamburger{display:none;flex-direction:column;gap:5px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:8px;cursor:pointer;padding:9px 11px;}
.hamburger span{display:block;width:22px;height:2.5px;background:var(--gold);border-radius:2px;}
.desktop-only{display:inline-flex;}
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
  .standings-table th.sticky2,.standings-table td.sticky2{left:32px;max-width:130px;}
  .standings-table td.sticky2 .user-cell{gap:4px;}
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
.pre-tab{padding:8px 16px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;}
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
.modal{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;}
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
`;

const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

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

function championAvatarClass(profile) {
  const { wins, silvers } = getTitleInfo(profile);
  if (wins > 0) return "champion-avatar";
  if (silvers > 0) return "silver-avatar";
  return "";
}

function isLocked(kickoff, allMatches, matchDate) {
  // Usar match_date de la DB si está disponible, sino derivar del kickoff en UTC
  const dateKey = matchDate || new Date(kickoff).toISOString().slice(0, 10);
  const sameDayMatches = (allMatches || []).filter(m => {
    const mDateKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
    return mDateKey === dateKey;
  });
  if (sameDayMatches.length === 0) return new Date(kickoff) <= new Date();
  const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
  const deadline = new Date(firstKickoff - 24 * 60 * 60 * 1000);
  return new Date() >= deadline;
}

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
  const debtors = profiles.filter(p => p.is_debtor).sort((a, b) => {
    const daysA = a.debt_since ? Math.floor((new Date() - new Date(a.debt_since)) / 86400000) : 0;
    const daysB = b.debt_since ? Math.floor((new Date() - new Date(b.debt_since)) / 86400000) : 0;
    return daysB - daysA;
  });

  if (debtors.length === 0) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 20, color: "var(--green)", letterSpacing: 1 }}>¡Todos al día!</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>No hay morosos en este torneo.</div>
    </div>
  );

  const totalDebt = debtors.reduce((s, p) => s + (parseFloat(p.debt_amount) || 0), 0);

  return (<>
    <div className="sec-hdr"><h2>🚨 HALL OF SHAME</h2><span>{debtors.length} moroso{debtors.length !== 1 ? "s" : ""}</span></div>

    {/* Resumen */}
    <div style={{ background: "var(--red-dim)", border: "1px solid rgba(255,77,109,.3)", borderRadius: "var(--r)", padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 11, color: "var(--red)", textTransform: "uppercase", letterSpacing: .5 }}>Deuda total del grupo</div>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: "var(--red)" }}>${totalDebt.toFixed(2)}</div>
      </div>
      <div style={{ fontSize: 40 }}>💸</div>
    </div>

    {/* Lista de morosos */}
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {debtors.map((p, i) => {
        const days = p.debt_since
          ? Math.floor((new Date() - new Date(p.debt_since)) / 86400000)
          : 0;
        return (
          <div key={p.id} style={{
            background: "var(--card)", border: "1px solid rgba(255,77,109,.3)",
            borderRadius: "var(--r)", padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Posición */}
            <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "var(--red)", minWidth: 30, textAlign: "center", opacity: .5 }}>
              {i + 1}
            </div>
            {/* Avatar */}
            <div className="avatar" style={{ background: "linear-gradient(135deg,var(--red),#c0001a)", flexShrink: 0 }}>
              {initials(p.name)}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                <DebtorBadge profile={p} />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10 }}>
                {p.debt_since && <span>Desde: {new Date(p.debt_since).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                {days > 0 && <span style={{ color: "var(--red)" }}>⏰ {days} día{days !== 1 ? "s" : ""} sin pagar</span>}
              </div>
            </div>
            {/* Monto */}
            {p.debt_amount > 0 && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "Bebas Neue", fontSize: 24, color: "var(--red)" }}>${p.debt_amount}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>pendiente</div>
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

  useEffect(() => {
    function calc() {
      const dateKey = matchDate || new Date(kickoff).toISOString().slice(0, 10);
      const sameDayMatches = (allMatches || []).filter(m => {
        const mKey = m.match_date || new Date(m.kickoff_at).toISOString().slice(0, 10);
        return mKey === dateKey;
      });
      const firstKickoff = Math.min(...sameDayMatches.map(m => new Date(m.kickoff_at).getTime()));
      const deadline = new Date(firstKickoff - 24 * 60 * 60 * 1000);
      const diff = deadline - new Date();
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
    .filter(p => p.points !== null && p.points !== undefined)
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(p => p.match)
    .sort((a, b) => new Date(a.match.kickoff_at) - new Date(b.match.kickoff_at));

  const unlocked = new Set();

  // 🎯 Francotirador — 5 exactos
  const exactCount = finishedPreds.filter(p => p.points >= 3).length;
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
    return p.home_score === p.away_score && m.home_score === m.away_score && p.points > 0;
  }).length;
  if (drawWins >= 3) unlocked.add("drawmaster");

  // 🎪 Comodín de oro — exacto con comodín
  const wcMatchIds = new Set(myWildcards.map(w => w.match_id));
  const wcExact = finishedPreds.some(p => wcMatchIds.has(p.match_id) && p.points >= 6);
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
    if (dayTotal > 0 && dayPreds.length === dayTotal && dayPreds.every(p => p.points > 0))
      unlocked.add("perfectday");
  }

  // 💀 Sin suerte — racha 5 incorrectas
  let maxBadRacha = 0, curBadRacha = 0;
  for (const p of finishedPreds) {
    if (p.points === 0) { curBadRacha++; maxBadRacha = Math.max(maxBadRacha, curBadRacha); }
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
function StatsDeep({ user, matches, predictions }) {
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

  // ── Mapa de calor por grupo ──────────────────────────────────────────────
  const groupStats = {};
  finished.forEach(p => {
    const g = p.match.group_name;
    if (!g) return;
    if (!groupStats[g]) groupStats[g] = { correct: 0, total: 0 };
    groupStats[g].total++;
    if (p.points > 0) groupStats[g].correct++;
  });
  const maxGroupPct = Math.max(...Object.values(groupStats).map(s => s.total > 0 ? s.correct / s.total : 0), 0.01);

  // ── Pred vs Realidad (últimos 10) ────────────────────────────────────────
  const lastTen = finished.slice(-10);

  if (finished.length === 0) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1, marginBottom: 8 }}>📊 ANÁLISIS DETALLADO</div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>Disponible cuando haya partidos finalizados con tus predicciones.</div>
    </div>
  );

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1, marginBottom: 16 }}>📊 ANÁLISIS DETALLADO</div>

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

      {/* Mapa de calor por grupo */}
      {Object.keys(groupStats).length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>🌡️ Mapa de calor por grupo</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {Object.entries(groupStats).sort().map(([g, s]) => {
              const pct = s.total > 0 ? s.correct / s.total : 0;
              const intensity = pct / maxGroupPct;
              const bg = `rgba(${Math.round(245 - intensity * 200)},${Math.round(80 + intensity * 143)},${Math.round(49 + intensity * 24)},${0.2 + intensity * 0.6})`;
              return (
                <div key={g} style={{ background: bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Bebas Neue", fontSize: 16, color: "var(--txt)" }}>G{g}</div>
                  <div style={{ fontSize: 10, color: "var(--txt)", opacity: .8 }}>{s.correct}/{s.total}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt)" }}>{Math.round(pct * 100)}%</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "rgba(245,80,49,.3)", width: 14, height: 14, borderRadius: 3 }} />
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Bajo</span>
            <div style={{ background: "rgba(45,223,73,.8)", width: 14, height: 14, borderRadius: 3 }} />
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Alto</span>
          </div>
        </div>
      )}

      {/* Predicción vs Realidad */}
      {lastTen.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>🎯 Predicción vs Realidad (últimos {lastTen.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lastTen.map((p, i) => {
              const m = p.match;
              const isExact = p.home_score === m.home_score && p.away_score === m.away_score;
              const predResult = p.home_score > p.away_score ? "H" : p.away_score > p.home_score ? "A" : "D";
              const realResult = m.home_score > m.away_score ? "H" : m.away_score > m.home_score ? "A" : "D";
              const isCorrect = predResult === realResult;
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
function HallOfFame({ profiles, predictions, snapshots, allAchievements }) {
  const rows = profiles.map(p => {
    const preds = predictions.filter(pr => pr.user_id === p.id);
    const pts = preds.reduce((s, pr) => s + (pr.points || 0), 0);
    const exact = preds.filter(pr => pr.points >= 3).length;
    const userSnaps = (snapshots || []).filter(s => s.user_id === p.id);
    const daysFirst = userSnaps.filter(s => s.position === 1).length;
    return { ...p, pts, exact, daysFirst };
  }).sort((a, b) => b.pts - a.pts);

  const categories = [
    { label: "🏆 Más puntos", key: "pts", winner: [...rows].sort((a,b) => b.pts - a.pts)[0] },
    { label: "⭐ Más exactos", key: "exact", winner: [...rows].sort((a,b) => b.exact - a.exact)[0] },
    { label: "👑 Días en 1°", key: "daysFirst", winner: [...rows].sort((a,b) => b.daysFirst - a.daysFirst)[0] },
  ];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 17, color: "var(--gold)", letterSpacing: 1, marginBottom: 16 }}>🌟 HALL OF FAME</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map(cat => cat.winner && (
          <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontFamily: "Bebas Neue", fontSize: 14, color: "var(--gold)", minWidth: 110 }}>{cat.label}</div>
            <div className="avatar sm">{initials(cat.winner.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.winner.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{cat.winner[cat.key]} {cat.key === "pts" ? "pts" : cat.key === "exact" ? "exactos" : "días"}</div>
            </div>
            {cat.winner.equipped_badge && (() => { const a = ACHIEVEMENTS.find(a => a.key === cat.winner.equipped_badge); return a ? <span style={{ fontSize: 20 }}>{a.icon}</span> : null; })()}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [name, setName] = useState(""); const [invite, setInvite] = useState("");
  const [msg, setMsg] = useState(null); const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setMsg(null);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { setMsg({ type: "err", text: "Email o contraseña incorrectos" }); setLoading(false); return; }
    const { data: profile } = await sb.from("profiles").select("*").eq("id", data.user.id).single();
    onAuth({ ...data.user, profile }); setLoading(false);
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
    const { data: codes } = await sb.from("invite_codes").select("*").eq("code", invite.trim().toLowerCase()).eq("active", true);
    if (!codes?.length) { setMsg({ type: "err", text: "Código de invitación inválido" }); setLoading(false); return; }
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
          tp.push(p.team);
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
    await sb.from("pretournament_predictions").delete().eq("user_id", user.id).eq("prediction_type", "third_place");
    for (const team of thirdPreds) {
      await sb.from("pretournament_predictions").insert({ user_id: user.id, prediction_type: "third_place", team });
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
            {savingThirds ? "GUARDANDO..." : thirdsSaved ? "✓ GUARDADO" : `GUARDAR (${thirdPreds.length}/8 grupos seleccionados)`}
          </button>
        )}
      </div>
    )}
  </>);
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, matches, predictions, onGoTab, achievements, equippedBadge, onEquip }) {
  const myPreds = predictions.filter(p => p.user_id === user.id);
  const totalPts = myPreds.reduce((s, p) => s + (p.points || 0), 0);
  const pending = matches.filter(m => !myPreds.find(p => p.match_id === m.id) && !isLocked(m.kickoff_at, matches, m.match_date)).length;
  const locked = isPreTournamentLocked();

  const played = myPreds.filter(p => p.points !== null && p.points !== undefined);
  const exact = played.filter(p => p.points >= 3);
  const correct = played.filter(p => p.points === 1 || p.points === 2);
  const pctExact = played.length > 0 ? Math.round(exact.length / played.length * 100) : 0;
  const pctCorrect = played.length > 0 ? Math.round(correct.length / played.length * 100) : 0;

  const allUserIds = [...new Set(predictions.map(p => p.user_id))];
  const avgPts = allUserIds.length > 0
    ? Math.round(allUserIds.reduce((s, uid) => {
        return s + predictions.filter(p => p.user_id === uid).reduce((ss, p) => ss + (p.points || 0), 0);
      }, 0) / allUserIds.length)
    : 0;

  const finishedPreds = played
    .map(p => ({ ...p, match: matches.find(m => m.id === p.match_id) }))
    .filter(p => p.match)
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

  return (<>
    <div className="banner">
      <h3>BIENVENIDO, {user.profile?.name?.toUpperCase() || "JUGADOR"} 👋</h3>
      <p>{!locked
        ? <>⏰ <strong style={{color:"var(--gold)"}}>¡El torneo arranca el 11 de junio!</strong> Completa tus predicciones pre-torneo antes de que cierren.</>
        : pending > 0
          ? <><strong style={{color:"var(--gold)"}}>{pending} partido{pending!==1?"s":""} pendiente{pending!==1?"s":""}</strong> de predecir. Se bloquean al inicio de cada partido.</>
          : <>¡Todo al día! Sigue de cerca la tabla de posiciones.</>}
      </p>
    </div>

    <div className="dash-grid">
      <div className="stat-card"><span className="stat-label">Tus puntos</span><span className="stat-value">{totalPts}</span><span className="stat-sub">Promedio del grupo: {avgPts}</span></div>
      <div className="stat-card"><span className="stat-label">Predicciones</span><span className="stat-value">{myPreds.length}</span><span className="stat-sub">de {matches.length} partidos</span></div>
      <div className="stat-card"><span className="stat-label">Pendientes</span><span className="stat-value" style={{color:pending>0?"var(--red)":"var(--green)"}}>{pending}</span><span className="stat-sub">{pending>0?"¡A predecir!":"Todo listo ✓"}</span></div>
    </div>

    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20}}>
      <div style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1,marginBottom:14}}>📊 TUS ESTADÍSTICAS</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:14}}>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Exactos</div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--gold)"}}>{exact.length} <span style={{fontSize:14,color:"var(--muted)"}}>({pctExact}%)</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>de {played.length} jugados</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Ganador correcto</div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--green)"}}>{correct.length} <span style={{fontSize:14,color:"var(--muted)"}}>({pctCorrect}%)</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>de {played.length} jugados</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Racha actual</div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:racha>0?"var(--green)":"var(--muted)"}}>{racha} <span style={{fontSize:14,color:"var(--muted)"}}>partido{racha!==1?"s":""}</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>{racha>0?"✓ consecutivos acertados":"Sin racha activa"}</div>
        </div>
        <div style={{background:"var(--surface)",borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Mejor jornada</div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"var(--gold)"}}>{bestDay ? bestDay[1] : 0} <span style={{fontSize:14,color:"var(--muted)"}}>pts</span></div>
          <div style={{fontSize:11,color:"var(--muted)"}}>{bestDay ? bestDay[0] : "—"}</div>
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
    </div>

    {!locked && (
      <div style={{background:"var(--card)",border:"1px solid rgba(245,183,49,.3)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1}}>📋 PREDICCIONES PRE-TORNEO</div><div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>1ro y 2do de grupo + 8 terceros clasificados</div></div>
        <button className="save-btn" onClick={() => onGoTab("pre")}>Completar →</button>
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
function Matches({ user, matches, predictions, onSave }) {
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [wildcards, setWildcards] = useState([]);
  const [savingWildcard, setSavingWildcard] = useState({});
  const [maxWildcards, setMaxWildcards] = useState(4);
  const [wildcardCost, setWildcardCost] = useState(1);
  const [history, setHistory] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const [polls, setPolls] = useState({});

  useEffect(() => {
    const init = {};
    predictions.forEach(p => { init[p.match_id] = { home: String(p.home_score), away: String(p.away_score) }; });
    setScores(init);
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
    sb.from("predictions").select("match_id, home_score, away_score")
      .then(({ data }) => {
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
    <div className="matches-grid">
      {matches.map(m => {
        const locked = isLocked(m.kickoff_at, matches, m.match_date);
        const myPred = predictions.find(p => p.match_id === m.id);
        const sc = scores[m.id] || {};
        const hasScore = sc.home!==undefined&&sc.away!==undefined&&sc.home!==""&&sc.away!=="";
        const wasSaved = saved[m.id];
        const hasWildcard = !!wildcards.find(w => w.match_id === m.id);
        const canBuyWildcard = !locked && myPred && !hasWildcard && remainingWildcards > 0;
        return (
          <div key={m.id}>
            <div className={`match-card ${locked?"locked":(myPred||wasSaved)?"saved":""}`} style={{borderColor: hasWildcard ? "var(--gold)" : undefined, borderWidth: hasWildcard ? 2 : undefined}}>
              <div className="team"><img className="team-flag" src={m.home_flag} alt={m.home}/><span className="team-name">{m.home}</span></div>
              <div className="match-center">
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
                  <span className="group-badge">{m.group_name ? `Grupo ${m.group_name}` : m.phase}</span>
                  <span className="match-meta">{localDate(m.kickoff_at)} · {localTime(m.kickoff_at)}</span>
                  {hasWildcard && <span style={{fontSize:14}}>🃏</span>}
                  {!locked && <MatchCountdown kickoff={m.kickoff_at} matchDate={m.match_date} matches={matches} />}
                </div>
                {locked ? (
                  myPred
                    ? <div className="score-display"><span>{myPred.home_score}</span><span style={{color:"var(--muted)",fontSize:16}}>–</span><span>{myPred.away_score}</span></div>
                    : <span className="no-pred">Sin predicción</span>
                ) : (
                  <div className="score-inputs">
                    <input className="score-input" value={sc.home??""} onChange={e=>setScore(m.id,"home",e.target.value)} placeholder="0"/>
                    <span className="score-sep">–</span>
                    <input className="score-input" value={sc.away??""} onChange={e=>setScore(m.id,"away",e.target.value)} placeholder="0"/>
                  </div>
                )}
                {locked
                  ? <span className="locked-tag">🔒 Partido iniciado</span>
                  : hasScore
                    ? <button className="save-btn" onClick={()=>save(m)} disabled={saving[m.id]}>{saving[m.id]?"...":wasSaved?"✓ GUARDADO":myPred?"ACTUALIZAR":"GUARDAR"}</button>
                    : myPred ? <span className="saved-tag">✓ Guardado</span> : null}
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
                {polls[m.id] && polls[m.id].total >= 2 && (
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
        );
      })}
    </div>
  </>);
}

// ── Standings ────────────────────────────────────────────────────────────────
function Standings({ user, predictions, profiles, onRefresh, isAdmin, allAchievements }) {
  const [prePreds, setPrePreds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnaps, setLoadingSnaps] = useState(false);
  const [userAchievements, setUserAchievements] = useState({});
  const [h2hUser, setH2hUser] = useState(null);
  const [showH2hPicker, setShowH2hPicker] = useState(false);
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

  const rows = profiles.map(p => {
    const preds = predictions.filter(pr => pr.user_id === p.id);
    const matchPts = preds.reduce((s, pr) => s + (pr.points || 0), 0);
    const prePts = prePreds.filter(pr => pr.user_id === p.id).reduce((s, pr) => s + (pr.points || 0), 0);
    const pts = matchPts + prePts;
    const exact = preds.filter(pr => pr.points >= 3).length;
    const winner = preds.filter(pr => pr.points === 2 || pr.points === 5).length;
    const goals = preds.filter(pr => pr.points === 1 || pr.points === 2).length;
    return { ...p, pts, exact, winner, goals, played: preds.length };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);

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
              <div className={`avatar ${championAvatarClass(uA)}`}>{initials(uA.name)}</div>
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
              <div className={`avatar ${championAvatarClass(uB)}`} style={{ background: "linear-gradient(135deg,#4a9eff,#1a6fd4)" }}>{initials(uB.name)}</div>
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

    return (
      <div className="modal-overlay" onClick={() => { setHistoryUser(null); setShowH2hPicker(false); }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className={`avatar ${championAvatarClass(prof)}`}>{initials(prof.name)}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChampionName profile={prof} name={prof.name} style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: 1 }} />
                  <TitleBadges profile={prof} size={16} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{prof.pts} pts actuales</div>
              </div>
            </div>
            <button onClick={() => { setHistoryUser(null); setShowH2hPicker(false); }} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>

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

          {/* Logros desbloqueados */}
          {unlockedAchs.length > 0 && (
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
                🏅 Logros ({unlockedAchs.length}/{ACHIEVEMENTS.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {unlockedAchs.map(a => {
                  const tier = TIER_COLORS[a.tier];
                  const isEquipped = prof.equipped_badge === a.key;
                  return (
                    <div key={a.key} title={a.name + " — " + a.desc} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", borderRadius: 20,
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
              </div>
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

          {/* Snapshots */}
          {loadingSnaps ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>Cargando...</div>
          ) : userSnaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--muted)", fontSize: 13 }}>Sin snapshots aún. El admin debe tomar el primer 📸 snapshot.</div>
          ) : (<>
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Evolución de puntos</div>
              <svg viewBox={"0 0 " + chartW + " " + chartH} style={{ width: "100%", height: chartH }}>
                <path d={pathD} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" />
                {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--gold)" />)}
                {userSnaps.map((s, i) => <text key={i} x={points[i][0]} y={chartH - 2} textAnchor="middle" fontSize="9" fill="var(--muted)">{s.snapshot_date.slice(5)}</text>)}
              </svg>
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
            <th className="c desktop-col">PTS</th>
            <th className="c desktop-col">Exactos</th>
            <th className="c desktop-col">Ganador</th>
            <th className="c desktop-col">Goles</th>
            <th className="c desktop-col">Partidos</th>
            <th className="c mobile-col">PTS</th>
            <th className="c mobile-col">Ext</th>
            <th className="c mobile-col">Gan</th>
            <th className="c mobile-col">Gols</th>
            <th className="c mobile-col">Part</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} onClick={() => openHistory(row)} style={{ cursor: "pointer" }}>
              <td className="sticky"><span className={"rank-num rank-" + (i + 1)}>{i + 1}</span></td>
              <td className="sticky2">
                <div className="user-cell">
                  <div className={`avatar sm ${championAvatarClass(row)}`} style={{flexShrink:0}}>{initials(row.name)}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      <ChampionName profile={row} name={row.name} />
                      <TitleBadges profile={row} size={13} />
                      {row.id === user.id && <span className="me-badge">TÚ</span>}
                      {row.equipped_badge && (() => { const a = ACHIEVEMENTS.find(a => a.key === row.equipped_badge); return a ? <span title={a.name} style={{fontSize:16,cursor:"default"}}>{a.icon}</span> : null; })()}
                    </div>
                    {row.is_debtor && <DebtorCounter profile={row} />}
                    {row.is_debtor && <span className="mobile-col"><DebtorBadge profile={row} /></span>}
                  </div>
                </div>
              </td>
              <td className="c desktop-col">
                {row.is_debtor
                  ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span className="pts-big" style={{ color: "var(--muted)", textDecoration: "line-through", opacity: .5 }}>{row.pts}</span>
                      <span style={{ fontSize: 14 }}>❌</span>
                    </div>
                  : <span className="pts-big">{row.pts}</span>}
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
  </>);
}

// ── Compare View ─────────────────────────────────────────────────────────────
function Compare({ user, matches, allPredictions, profiles }) {
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState({});
  const [reactions, setReactions] = useState({});
  const [emojiPicker, setEmojiPicker] = useState(null);

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
  const firstLockedDay = allDays.find(d => byDay[d].some(m => isLocked(m.kickoff_at, matches, m.match_date)));
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    if (!activeDay && firstLockedDay) setActiveDay(firstLockedDay);
    else if (!activeDay && allDays.length > 0) setActiveDay(allDays[0]);
  }, [matches]);

  function toggleExpand(id) { setExpanded(e => ({ ...e, [id]: !e[id] })); }

  function timeUntilReveal(kickoff) {
    const matchDate = new Date(kickoff).toISOString().slice(0, 10);
    const sameDayMatches = matches.filter(m => new Date(m.kickoff_at).toISOString().slice(0, 10) === matchDate);
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
    if (match.home_score === null || match.away_score === null) return null;
    if (pred.home_score === match.home_score && pred.away_score === match.away_score)
      return <span style={{ color: "var(--gold)", fontSize: 13 }}>★</span>;
    const real = match.home_score > match.away_score ? "H" : match.away_score > match.home_score ? "A" : "D";
    const predicted = pred.home_score > pred.away_score ? "H" : pred.away_score > pred.home_score ? "A" : "D";
    if (real === predicted) return <span style={{ color: "var(--green)", fontSize: 13 }}>✓</span>;
    return <span style={{ color: "var(--red)", fontSize: 13 }}>✗</span>;
  }

  const dayMatches = activeDay ? (byDay[activeDay] || []) : [];
  const dayIsLocked = dayMatches.some(m => isLocked(m.kickoff_at, matches, m.match_date));
  const countdown = dayMatches.length > 0 ? timeUntilReveal(dayMatches[0].kickoff_at) : null;

  return (<>
    <div className="sec-hdr"><h2>👁️ COMPARAR</h2></div>
    <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
      {allDays.map(d => {
        const locked = byDay[d].some(m => isLocked(m.kickoff_at, matches, m.match_date));
        return (
          <button key={d} onClick={() => setActiveDay(d)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: activeDay === d ? "var(--gold)" : "var(--border)", background: activeDay === d ? "var(--gold-dim)" : "none", color: activeDay === d ? "var(--gold)" : locked ? "var(--txt)" : "var(--muted)", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
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
            const hasResult = m.home_score !== null && m.away_score !== null;
            const isOpen = expanded[m.id];
            return (
              <div key={m.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
                <div onClick={() => toggleExpand(m.id)} style={{ padding: "12px 16px", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="group-badge">{m.group_name ? `Grupo ${m.group_name}` : m.phase}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <img src={m.home_flag} alt={m.home} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />{m.home} <span style={{ color: "var(--muted)" }}>vs</span> {m.away}<img src={m.away_flag} alt={m.away} style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 2 }} />
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasResult ? <span style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "var(--gold)" }}>{m.home_score}–{m.away_score}</span> : <span style={{ fontSize: 11, color: "var(--gold)" }}>⚽</span>}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{matchPreds.length} pred.</span>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isOpen && (<>
                  {profiles.map((prof, idx) => {
                    const pred = matchPreds.find(p => p.user_id === prof.id);
                    const isMe = prof.id === user.id;
                    return (
                      <div key={prof.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: idx < profiles.length - 1 ? "1px solid var(--border)" : "none", background: isMe ? "rgba(245,183,49,.04)" : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className={`avatar sm ${championAvatarClass(prof)}`}>{initials(prof.name)}</div><ChampionName profile={prof} name={prof.name} style={{fontSize:13}}/><TitleBadges profile={prof} size={12}/>{isMe && <span className="me-badge">TÚ</span>}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {pred ? (<>{resultIcon(pred, m)}<span style={{ fontFamily: "Bebas Neue", fontSize: 18 }}>{pred.home_score}–{pred.away_score}</span>{pred.points > 0 && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "var(--green-dim)", color: "var(--green)" }}>+{pred.points}</span>}</>) : <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin pred.</span>}
                        </div>
                      </div>
                    );
                  })}
                  {hasResult && <div style={{ padding: "6px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}><span><span style={{ color: "var(--gold)" }}>★</span> Exacto</span><span><span style={{ color: "var(--green)" }}>✓</span> Correcto</span><span><span style={{ color: "var(--red)" }}>✗</span> Falló</span></div>}
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
  </>);
}

// ── Debtor Admin ──────────────────────────────────────────────────────────────
function DebtorAdmin({ profiles, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [amount, setAmount] = useState("");
  const [since, setSince] = useState("");
  const [saving, setSaving] = useState(null);
  const [intervalSecs, setIntervalSecs] = useState(120);
  const [savingInterval, setSavingInterval] = useState(false);
  const [intervalSaved, setIntervalSaved] = useState(false);

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

  return (
    <div className="admin-section">
      <div className="admin-section-hdr" style={{ flexWrap: "wrap", gap: 8 }}>
        <h3>💸 MOROSOS</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
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
        </div>
      </div>
      <div className="admin-section-body">
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
                  <button
                    className={`btn-small ${isDebtor ? "" : "red"}`}
                    onClick={() => toggleDebtor(prof)}
                    disabled={saving === prof.id}
                    style={isDebtor ? { background: "var(--green-dim)", borderColor: "var(--green)", color: "var(--green)" } : {}}
                  >
                    {saving === prof.id ? "..." : isDebtor ? "✓ Perdonar deuda" : "💸 Marcar moroso"}
                  </button>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Titles Admin ─────────────────────────────────────────────────────────────
const TOURNAMENTS = ["Qatar 2022", "Copa América & Euro 2024", "Champions 2024", "Mundial de Clubes 2025", "Primer Campeón"];

function TitlesAdmin({ profiles, onRefresh }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [tournament, setTournament] = useState(TOURNAMENTS[0]);
  const [position, setPosition] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

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
      <div className="admin-section-hdr"><h3>🏆 TÍTULOS ANTERIORES</h3></div>
      <div className="admin-section-body">
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
                  <div className={`avatar sm ${championAvatarClass(prof)}`}>{initials(prof.name)}</div>
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
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ matches, profiles, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState({});
  const [savedMatch, setSavedMatch] = useState({});
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
  const [savingGroupResults, setSavingGroupResults] = useState(false);
  const [groupResultsMsg, setGroupResultsMsg] = useState(null);
  const [calculatingPts, setCalculatingPts] = useState(false);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  async function takeSnapshot() {
    setTakingSnapshot(true);
    const today = new Date().toISOString().slice(0,10);
    const { data: preds } = await sb.from("predictions").select("*");
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
      const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": "7b202a7eafec421fbfe1b5eb2d3749bb" }
      });
      const apiData = await res.json();
      if (!apiData.matches) { setSyncMsg({ type: "err", text: "No se pudo conectar con la API" }); setSyncing(false); return; }

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
        const exactPts = isKnockout ? (ruleMap["exact_score_knockout"]||6) : (ruleMap["exact_score_groups"]||3);
        const resultPts = isKnockout ? (ruleMap["correct_result_knockout"]||2) : (ruleMap["correct_result_groups"]||1);
        const realResult = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";

        const { data: preds } = await sb.from("predictions").select("*").eq("match_id", existing.id);
        for (const pred of (preds||[])) {
          let pts = 0;
          if (pred.home_score === homeScore && pred.away_score === awayScore) pts = exactPts;
          else {
            const pr = pred.home_score > pred.away_score ? "home" : pred.away_score > pred.home_score ? "away" : "draw";
            if (pr === realResult) pts = resultPts;
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
    const { data: preds } = await sb.from("pretournament_predictions").select("*");
    const { data: results } = await sb.from("group_results").select("*");
    const { data: rules2 } = await sb.from("scoring_rules").select("*");
    const rMap = {};
    (rules2||[]).forEach(r => { rMap[r.rule_key] = r.rule_value; });
    const pts1st = rMap["group_first"] || 2;
    const pts2nd = rMap["group_second"] || 2;
    const pts3rd = rMap["third_place_qualifier"] || 2;
    const resultMap = {};
    (results||[]).forEach(r => { if (!resultMap[r.group_name]) resultMap[r.group_name] = {}; resultMap[r.group_name][r.position] = r.team; });
    const userPreds = {};
    (preds||[]).forEach(p => { if (!userPreds[p.user_id]) userPreds[p.user_id] = []; userPreds[p.user_id].push(p); });
    let totalUpdated = 0;
    for (const userId of Object.keys(userPreds)) {
      for (const pred of userPreds[userId]) {
        let pts = 0;
        if (pred.prediction_type === "group_standing") {
          const real = resultMap[pred.group_name]?.[pred.position];
          if (real && real === pred.team) { pts = pred.position === 1 ? pts1st : pts2nd; }
        } else if (pred.prediction_type === "third_place") {
          const isClassified = Object.values(resultMap).some(g => g[3] === pred.team);
          if (isClassified) pts = pts3rd;
        }
        if (pts > 0) { await sb.from("pretournament_predictions").update({ points: pts }).eq("id", pred.id); }
      }
      totalUpdated++;
    }
    setCalculatingPts(false);
    setGroupResultsMsg({ type: "ok", text: `✅ Puntos calculados para ${totalUpdated} usuarios` });
    setTimeout(() => setGroupResultsMsg(null), 3000);
  }

  async function saveResult(match) {
    const r = results[match.id] || {};
    if (r.home===undefined||r.away===undefined||r.home===""||r.away==="") return;
    setSaving(s=>({...s,[match.id]:true}));
    const homeScore=parseInt(r.home), awayScore=parseInt(r.away);
    await sb.from("matches").update({home_score:homeScore,away_score:awayScore,status:"finished"}).eq("id",match.id);
    const { data: preds } = await sb.from("predictions").select("*").eq("match_id", match.id);
    const { data: matchWildcards } = await sb.from("wildcards").select("*").eq("match_id", match.id);
    const wildcardUserIds = new Set((matchWildcards||[]).map(w => w.user_id));
    if (preds) {
      const isKnockout = match.phase && match.phase !== "Grupos";
      const exactPts = isKnockout ? (ruleVals["exact_score_knockout"] || 3) : (ruleVals["exact_score_groups"] || 3);
      const resultPts = isKnockout ? (ruleVals["correct_result_knockout"] || 1) : (ruleVals["correct_result_groups"] || 1);
      const goalsPts = isKnockout ? (ruleVals["correct_goals_knockout"] || 2) : (ruleVals["correct_goals_groups"] || 1);
      const wcExact = ruleVals["wildcard_exact"] || 8;
      const wcGoals = ruleVals["wildcard_goals"] || 5;
      const wcWinner = ruleVals["wildcard_winner"] || 2;
      const wcCost = ruleVals["wildcard_cost"] || 1;
      const realResult = homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw";
      const realTotalGoals = homeScore + awayScore;
      for (const pred of preds) {
        const hasWildcard = wildcardUserIds.has(pred.user_id);
        let pts = 0;
        const isExact = pred.home_score === homeScore && pred.away_score === awayScore;
        const predResult = pred.home_score > pred.away_score ? "home" : pred.away_score > pred.home_score ? "away" : "draw";
        const isCorrectResult = predResult === realResult;
        const isCorrectGoals = (pred.home_score + pred.away_score) === realTotalGoals;
        if (hasWildcard) {
          if (isExact) pts = wcExact;
          else if (isCorrectGoals) pts = wcGoals;
          else if (isCorrectResult) pts = wcWinner;
          else pts = -wcCost;
        } else {
          if (isExact) pts = exactPts;
          else if (isCorrectGoals) pts = goalsPts;
          else if (isCorrectResult) pts = resultPts;
        }
        await sb.from("predictions").update({ points: pts }).eq("id", pred.id);
      }
    }
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
            {syncMsg && <span style={{fontSize:12,color:syncMsg.type==="ok"?"var(--green)":"var(--red)",width:"100%"}}>{syncMsg.text}</span>}
            <button className="btn-small" onClick={syncScores} disabled={syncing} style={{background:"var(--green-dim)",borderColor:"var(--green)",color:"var(--green)"}}>{syncing ? "⏳ Sync..." : "🔄 Sincronizar"}</button>
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr">
          <h3>🏆 CLASIFICADOS DE GRUPOS</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {groupResultsMsg && <span style={{fontSize:12,color:groupResultsMsg.type==="ok"?"var(--green)":"var(--red)"}}>{groupResultsMsg.text}</span>}
            <button className="btn-small" onClick={saveGroupResults} disabled={savingGroupResults}>{savingGroupResults?"...":"Guardar"}</button>
            <button className="btn-small" onClick={calculatePreTournamentPoints} disabled={calculatingPts} style={{background:"var(--green-dim)",borderColor:"var(--green)",color:"var(--green)"}}>{calculatingPts?"Calculando...":"🧮 Calcular puntos"}</button>
          </div>
        </div>
        <div className="admin-section-body">
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
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr"><h3>⚙️ SISTEMA DE PUNTOS</h3><button className="btn-small" onClick={saveRules} disabled={savingRules}>{rulesSaved?"✓ Guardado":savingRules?"...":"Guardar"}</button></div>
        <div className="admin-section-body">
          <div className="rules-grid">
            {rules.map(r=>(
              <div key={r.rule_key} className="rule-card">
                <span className="rule-label">{r.description || ruleLabels[r.rule_key] || r.rule_key}</span>
                <input className="rule-input" value={ruleVals[r.rule_key]??r.rule_value} onChange={e=>setRuleVals(v=>({...v,[r.rule_key]:e.target.value}))}/>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr"><h3>🔗 CÓDIGOS DE INVITACIÓN</h3></div>
        <div className="admin-section-body">
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
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr"><h3>👥 GESTIÓN DE USUARIOS</h3><span style={{fontSize:12,color:"var(--muted)"}}>{profiles.length} participantes</span></div>
        <div className="admin-section-body">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {profiles.map(prof => {
              const isAdminUser = adminList.includes(prof.id);
              const isEditing = editingUser === prof.id;
              return (
                <div key={prof.id} style={{background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div className="avatar sm">{initials(prof.name)}</div>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:14,fontWeight:500}}>{prof.name}</span>
                          {isAdminUser && <span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"var(--red-dim)",color:"var(--red)"}}>ADMIN</span>}
                        </div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(prof.created_at).toLocaleDateString("es",{day:"2-digit",month:"short",year:"numeric"})}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
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
        </div>
      </div>

      {/* ── Títulos ── */}
      <TitlesAdmin profiles={profiles} onRefresh={onRefresh} />
      <DebtorAdmin profiles={profiles} onRefresh={onRefresh} />

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
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [booting, setBooting] = useState(true);
  const [matches, setMatches] = useState([]);
  const [myPredictions, setMyPredictions] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifStatus, setNotifStatus] = useState("idle"); // idle | requesting | granted | denied | unsupported
  const [notifDebug, setNotifDebug] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  const [showDebtorOverlay, setShowDebtorOverlay] = useState(false);
  const [showDebtorVideo, setShowDebtorVideo] = useState(false);
  const [debtorVideoIndex, setDebtorVideoIndex] = useState(0);

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
  const [knownAchievements, setKnownAchievements] = useState(new Set());
  const [wildcards, setWildcards] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [prePreds, setPrePreds] = useState([]);

  function goTab(t) { setTab(t); setMenuOpen(false); }

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Video periódico para morosos — intervalo configurable desde admin
  useEffect(() => {
    if (!user || !profiles.length) return;
    const isDebtor = profiles.find(p => p.id === user.id)?.is_debtor;
    if (!isDebtor) return;
    // Leer intervalo configurado por admin
    sb.from("scoring_rules").select("rule_value").eq("rule_key", "debtor_video_interval").single()
      .then(({ data }) => {
        const mins = data?.rule_value || 120;
        const interval = setInterval(() => {
          setDebtorVideoIndex(i => i + 1);
          setShowDebtorVideo(true);
        }, mins * 1000);
        // Guardar ref para cleanup
        window._debtorInterval = interval;
      });
    return () => { if (window._debtorInterval) clearInterval(window._debtorInterval); };
  }, [user, profiles]);

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

    return () => subscription.unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: m }, { data: myP }, { data: allP }, { data: prof }, { data: adminCheck }] = await Promise.all([
      sb.from("matches").select("*").order("kickoff_at"),
      sb.from("predictions").select("*").eq("user_id", user.id),
      sb.from("predictions").select("*"),
      sb.from("profiles").select("*"),
      sb.from("admins").select("*").eq("user_id", user.id),
    ]);
    setMatches(m||[]); setMyPredictions(myP||[]); setAllPredictions(allP||[]); setProfiles(prof||[]);
    setIsAdmin((adminCheck||[]).length>0);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Load extra data needed for achievements
  const loadAchievementData = useCallback(async () => {
    if (!user) return;
    const [{ data: wc }, { data: snaps }, { data: pp }, { data: prof }] = await Promise.all([
      sb.from("wildcards").select("*"),
      sb.from("ranking_snapshots").select("*").order("snapshot_date"),
      sb.from("pretournament_predictions").select("*"),
      sb.from("profiles").select("equipped_badge").eq("id", user.id).single(),
    ]);
    setWildcards(wc || []);
    setSnapshots(snaps || []);
    setPrePreds(pp || []);
    if (prof?.equipped_badge) setEquippedBadge(prof.equipped_badge);
  }, [user]);

  useEffect(() => { loadAchievementData(); }, [loadAchievementData]);

  // Recalculate achievements whenever data changes
  useEffect(() => {
    if (!user || !allPredictions.length && !matches.length) return;
    const unlocked = calcAchievements({
      predictions: allPredictions, matches, wildcards, snapshots, prePreds, userId: user.id
    });
    // Check for newly unlocked
    unlocked.forEach(key => {
      if (!knownAchievements.has(key) && knownAchievements.size > 0) {
        const achievement = ACHIEVEMENTS.find(a => a.key === key);
        if (achievement) {
          setAchievementToast(achievement);
          // Save to DB
          sb.from("achievements").upsert({ user_id: user.id, achievement_key: key }, { onConflict: "user_id,achievement_key" });
        }
      }
    });
    setKnownAchievements(unlocked);
    setUnlockedAchievements(unlocked);
  }, [allPredictions, matches, wildcards, snapshots, prePreds, user]);

  async function handleEquipBadge(key) {
    setEquippedBadge(key);
    await sb.from("profiles").update({ equipped_badge: key }).eq("id", user.id);
    // Update local profiles list so standings refreshes
    setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, equipped_badge: key } : p));
  }

  async function handleLogout() { await sb.auth.signOut(); setUser(null); }

  if (booting) return (<><style>{css}</style><div className="spinner"><div className="spin"/><span>Cargando...</span></div></>);
  if (resettingPassword) return (<><style>{css}</style><ResetPasswordScreen onDone={() => setResettingPassword(false)}/></>);
  if (!user) return (<><style>{css}</style><AuthScreen onAuth={setUser}/></>);

  return (<><style>{css}</style>
    <div className={`shell${darkMode ? "" : " light-mode"}`}>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <nav className="nav">
        <div className="nav-brand">🏆 QUINIELA 2026</div>
        <div className="nav-tabs">
          {[["home","🏠 Inicio"],["pre","📋 Pre-Torneo"],["matches","⚽ Partidos"],["compare","👁️ Comparar"],["standings","📊 Posiciones"],["stats","🌟 Stats"],["shame","🚨 Morosos"]].map(([k,l])=>(
            <button key={k} className={`nav-tab ${tab===k?"active":""}`} onClick={()=>goTab(k)}>{l}</button>
          ))}
          {isAdmin && <button className={`nav-tab admin-tab ${tab==="admin"?"active":""}`} onClick={()=>goTab("admin")}>🔧 Admin</button>}
        </div>
        <div className="nav-user">
          <div className="avatar">{initials(user.profile?.name||user.email)}</div>
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
      <div className={`mobile-menu ${menuOpen?"open":""}`}>
        {[["home","🏠 Inicio"],["pre","📋 Pre-Torneo"],["matches","⚽ Partidos"],["compare","👁️ Comparar"],["standings","📊 Posiciones"],["stats","🌟 Stats"],["shame","🚨 Morosos"]].map(([k,l])=>(
          <button key={k} className={`mobile-nav-tab ${tab===k?"active":""}`} onClick={()=>goTab(k)}>{l}</button>
        ))}
        {isAdmin && <button className={`mobile-nav-tab admin-tab ${tab==="admin"?"active":""}`} onClick={()=>goTab("admin")}>🔧 Admin</button>}
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
        {tab==="home"      && <Dashboard user={user} matches={matches} predictions={allPredictions} onGoTab={goTab} achievements={unlockedAchievements} equippedBadge={equippedBadge} onEquip={handleEquipBadge}/>}
        {tab==="pre"       && <PreTournament user={user}/>}
        {tab==="matches"   && <Matches user={user} matches={matches} predictions={myPredictions} onSave={loadData}/>}
        {tab==="compare"   && <Compare user={user} matches={matches} allPredictions={allPredictions} profiles={profiles}/>}
        {tab==="standings" && <Standings user={user} predictions={allPredictions} profiles={profiles} onRefresh={loadData} isAdmin={isAdmin} allAchievements={unlockedAchievements}/>}
        {tab==="stats"     && <><StatsDeep user={user} matches={matches} predictions={allPredictions}/><HallOfFame profiles={profiles} predictions={allPredictions} snapshots={snapshots}/></>}
        {tab==="shame"     && <HallOfShame profiles={profiles} />}
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
        {tab==="admin"     && isAdmin && <AdminPanel matches={matches} profiles={profiles} onRefresh={loadData}/>}
      </main>
    </div>
  </>);
}
