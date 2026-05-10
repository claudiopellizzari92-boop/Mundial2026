import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bheziohaquiwnvbzrlio.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZXppb2hhcXVpd252YnpybGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQzNzEsImV4cCI6MjA5Mzk0MDM3MX0.p53LDuRulCzO_ceRjS47jNbirEpfDTk5NYCi9AT92CM";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

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
.standings-table{width:100%;border-collapse:collapse;}
.standings-table thead tr{border-bottom:1px solid var(--border);}
.standings-table th{padding:10px 14px;font-size:11px;color:var(--muted);text-align:left;text-transform:uppercase;letter-spacing:.5px;}
.standings-table th.c,.standings-table td.c{text-align:center;}
.standings-table tbody tr{border-bottom:1px solid var(--border);transition:background .15s;}
.standings-table tbody tr:last-child{border-bottom:none;}
.standings-table tbody tr:hover{background:var(--card2);}
.standings-table td{padding:13px 14px;font-size:14px;}
.rank-num{font-family:'Bebas Neue';font-size:22px;color:var(--muted);}
.rank-1{color:var(--gold)!important;}.rank-2{color:#b0bcd0!important;}.rank-3{color:#cd7f32!important;}
.user-cell{display:flex;align-items:center;gap:10px;}
.me-badge{font-size:10px;padding:2px 7px;border-radius:20px;background:var(--gold-dim);color:var(--gold);}
.pts-big{font-family:'Bebas Neue';font-size:26px;color:var(--gold);}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;background:var(--surface);font-size:13px;}
.spinner{display:flex;align-items:center;justify-content:center;padding:80px;color:var(--muted);font-size:14px;gap:10px;}
.spin{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

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
`;

const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
const isLocked = (kickoff) => new Date(kickoff) <= new Date();

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
    <div className="sec-hdr"><h2>PRE-TORNEO</h2><span>Se cierran el 11 Jun · 15:00 ET</span></div>

    {locked
      ? <div className="pre-alert locked">🔒 Las predicciones pre-torneo están cerradas. El torneo ya comenzó.</div>
      : allGroupsComplete && thirdsSaved
        ? <div className="pre-alert complete">✅ ¡Todas tus predicciones pre-torneo están completas!</div>
        : <div className="pre-alert warning">⏰ Completa tus predicciones antes del 11 de junio a las 3:00 PM ET. Grupos completados: {completedGroups}/12 · Terceros: {thirdPreds.length}/8</div>}

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
          const hasChange = !isComplete || (preds[1] && preds[2]);
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
                          {t.flag} {t.name}
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
            // Find which team from this group is selected (if any)
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
                      // Remove any previously selected team from this group
                      const withoutGroup = prev.filter(t => !teams.map(tm => tm.name).includes(t));
                      if (!newTeam) return withoutGroup;
                      return [...withoutGroup, newTeam];
                    });
                    setThirdsSaved(false);
                  }}
                >
                  <option value="">— No seleccionado —</option>
                  {teams.map(t => (
                    <option key={t.name} value={t.name}>{t.flag} {t.name}</option>
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
function Dashboard({ user, matches, predictions, onGoTab }) {
  const myPreds = predictions.filter(p => p.user_id === user.id);
  const totalPts = myPreds.reduce((s, p) => s + (p.points || 0), 0);
  const pending = matches.filter(m => !myPreds.find(p => p.match_id === m.id) && !isLocked(m.kickoff_at)).length;
  const locked = isPreTournamentLocked();
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
      <div className="stat-card"><span className="stat-label">Tus puntos</span><span className="stat-value">{totalPts}</span><span className="stat-sub">Total acumulado</span></div>
      <div className="stat-card"><span className="stat-label">Predicciones</span><span className="stat-value">{myPreds.length}</span><span className="stat-sub">de {matches.length} partidos</span></div>
      <div className="stat-card"><span className="stat-label">Pendientes</span><span className="stat-value" style={{color:pending>0?"var(--red)":"var(--green)"}}>{pending}</span><span className="stat-sub">{pending>0?"¡A predecir!":"Todo listo ✓"}</span></div>
    </div>
    {!locked && (
      <div style={{background:"var(--card)",border:"1px solid rgba(245,183,49,.3)",borderRadius:"var(--r)",padding:"18px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gold)",letterSpacing:1}}>📋 PREDICCIONES PRE-TORNEO</div><div style={{fontSize:13,color:"var(--muted)",marginTop:3}}>1ro y 2do de grupo + 8 terceros clasificados</div></div>
        <button className="save-btn" onClick={() => onGoTab("pre")}>Completar →</button>
      </div>
    )}
    <div className="sec-hdr"><h2>PRÓXIMOS SIN PREDECIR</h2></div>
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--r)"}}>
      {matches.filter(m => !myPreds.find(p => p.match_id === m.id) && !isLocked(m.kickoff_at)).slice(0,5).map((m,i,arr) => (
        <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
          <span style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><img src={m.home_flag} alt={m.home} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/>{m.home} <span style={{color:"var(--muted)"}}>vs</span> {m.away} <img src={m.away_flag} alt={m.away} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/></span>
          <span style={{fontSize:12,color:"var(--muted)",whiteSpace:"nowrap",marginLeft:8}}>{m.match_date} · {m.match_time}</span>
        </div>
      ))}
      {pending===0 && <div style={{padding:"20px 18px",color:"var(--muted)",fontSize:14}}>¡Todos los partidos disponibles ya tienen predicción! 🎉</div>}
    </div>
  </>);
}

// ── Matches ──────────────────────────────────────────────────────────────────
function Matches({ user, matches, predictions, allPredictions, profiles, onSave }) {
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    const init = {};
    predictions.forEach(p => { init[p.match_id] = { home: String(p.home_score), away: String(p.away_score) }; });
    setScores(init);
  }, [predictions]);

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
    if (existing) {
      await sb.from("predictions").update({ home_score: parseInt(sc.home), away_score: parseInt(sc.away), updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await sb.from("predictions").insert({ user_id: user.id, match_id: match.id, home_score: parseInt(sc.home), away_score: parseInt(sc.away) });
    }
    setSaved(s => ({ ...s, [match.id]: true }));
    setSaving(s => ({ ...s, [match.id]: false }));
    onSave();
  }

  const profileMap = {};
  (profiles||[]).forEach(p => { profileMap[p.id] = p; });

  return (<>
    <div className="sec-hdr"><h2>MIS PREDICCIONES</h2><span>Fase de Grupos</span></div>
    <div className="matches-grid">
      {matches.map(m => {
        const locked = isLocked(m.kickoff_at);
        const myPred = predictions.find(p => p.match_id === m.id);
        const sc = scores[m.id] || {};
        const hasScore = sc.home!==undefined&&sc.away!==undefined&&sc.home!==""&&sc.away!=="";
        const wasSaved = saved[m.id];
        const othersReveal = locked ? (allPredictions||[]).filter(p => p.match_id === m.id) : [];
        return (
          <div key={m.id}>
            <div className={`match-card ${locked?"locked":(myPred||wasSaved)?"saved":""}`}>
              <div className="team"><img className="team-flag" src={m.home_flag} alt={m.home}/><span className="team-name">{m.home}</span></div>
              <div className="match-center">
                <div style={{display:"flex",gap:5,alignItems:"center"}}>
                  <span className="group-badge">Grupo {m.group_name}</span>
                  <span className="match-meta">{m.match_date} · {m.match_time}</span>
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
              </div>
              <div className="team away"><img className="team-flag" src={m.away_flag} alt={m.away}/><span className="team-name">{m.away}</span></div>
            </div>
            {locked && othersReveal.length > 0 && (
              <div className="reveal-card">
                <div className="reveal-title">🔓 Predicciones de todos</div>
                {othersReveal.map(op => {
                  const prof = profileMap[op.user_id];
                  return (
                    <div className="reveal-row" key={op.id}>
                      <div className="reveal-user"><div className="avatar sm">{initials(prof?.name||"?")}</div><span>{prof?.name||"Jugador"}</span>{op.user_id===user.id&&<span className="me-badge">TÚ</span>}</div>
                      <span className="reveal-score">{op.home_score} – {op.away_score}</span>
                      {op.points>0&&<span className="reveal-pts">+{op.points} pts</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </>);
}

// ── Standings ────────────────────────────────────────────────────────────────
function Standings({ user, predictions, profiles }) {
  const rows = profiles.map(p => {
    const preds = predictions.filter(pr => pr.user_id === p.id);
    const pts = preds.reduce((s,pr) => s+(pr.points||0),0);
    const exact = preds.filter(pr => pr.points>=3).length;
    const result = preds.filter(pr => pr.points>0&&pr.points<3).length;
    return { ...p, pts, exact, result, played: preds.length };
  }).sort((a,b) => b.pts-a.pts||b.exact-a.exact);

  return (<>
    <div className="sec-hdr"><h2>TABLA DE POSICIONES</h2><span>{profiles.length} participantes</span></div>
    <div className="standings-wrap">
      <table className="standings-table">
        <thead><tr><th>#</th><th>Jugador</th><th className="c">PTS</th><th className="c">Exactos</th><th className="c">Resultado</th><th className="c">Jugados</th></tr></thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={row.id}>
              <td><span className={`rank-num rank-${i+1}`}>{i+1}</span></td>
              <td><div className="user-cell"><div className="avatar sm">{initials(row.name)}</div><span>{row.name}</span>{row.id===user.id&&<span className="me-badge">TÚ</span>}</div></td>
              <td className="c"><span className="pts-big">{row.pts}</span></td>
              <td className="c"><span className="pill">{row.exact}</span></td>
              <td className="c"><span className="pill">{row.result}</span></td>
              <td className="c" style={{color:"var(--muted)",fontSize:13}}>{row.played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>);
}

// ── Compare View ─────────────────────────────────────────────────────────────
function Compare({ user, matches, allPredictions, profiles }) {
  const [filter, setFilter] = useState("all");
  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  const dates = [...new Set(matches.map(m => m.match_date))];
  const lockedDates = dates.filter(d => matches.filter(m => m.match_date === d).some(m => isLocked(m.kickoff_at)));
  const visibleMatches = filter === "all"
    ? matches.filter(m => isLocked(m.kickoff_at))
    : matches.filter(m => m.match_date === filter && isLocked(m.kickoff_at));

  function resultIcon(pred, match) {
    if (match.home_score === null || match.away_score === null) return null;
    if (pred.home_score === match.home_score && pred.away_score === match.away_score)
      return <span style={{ color: "var(--gold)", fontSize: 13 }}>★</span>;
    const real = match.home_score > match.away_score ? "H" : match.away_score > match.home_score ? "A" : "D";
    const predicted = pred.home_score > pred.away_score ? "H" : pred.away_score > pred.home_score ? "A" : "D";
    if (real === predicted) return <span style={{ color: "var(--green)", fontSize: 13 }}>✓</span>;
    return <span style={{ color: "var(--red)", fontSize: 13 }}>✗</span>;
  }

  return (<>
    <div className="sec-hdr"><h2>👁️ COMPARAR</h2><span>Predicciones reveladas al pitazo inicial</span></div>

    {visibleMatches.length === 0 && (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "50px 20px", textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
        <div style={{ fontSize: 15, marginBottom: 6, color: "var(--txt)" }}>Aún no hay partidos iniciados</div>
        <div style={{ fontSize: 13 }}>Las predicciones se revelan automáticamente al inicio de cada partido</div>
      </div>
    )}

    {visibleMatches.length > 0 && (<>
      <div className="match-filter" style={{ marginBottom: 20 }}>
        <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>Todos</button>
        {lockedDates.map(d => (
          <button key={d} className={`filter-btn ${filter === d ? "active" : ""}`} onClick={() => setFilter(d)}>{d}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {visibleMatches.map(m => {
          const matchPreds = allPredictions.filter(p => p.match_id === m.id);
          const hasResult = m.home_score !== null && m.away_score !== null;
          return (
            <div key={m.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
              {/* Match header */}
              <div style={{ padding: "13px 18px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="group-badge">Grupo {m.group_name}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, display:"flex", alignItems:"center", gap:6 }}><img src={m.home_flag} alt={m.home} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/>{m.home} <span style={{ color: "var(--muted)" }}>vs</span> {m.away} <img src={m.away_flag} alt={m.away} style={{width:20,height:15,objectFit:"cover",borderRadius:2}}/></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {hasResult
                    ? <span style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "var(--gold)" }}>{m.home_score} – {m.away_score}</span>
                    : <span style={{ fontSize: 11, color: "var(--gold)" }}>⚽ En curso</span>}
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.match_date} · {m.match_time}</span>
                </div>
              </div>

              {/* Predictions per user */}
              {matchPreds.length === 0
                ? <div style={{ padding: "14px 18px", color: "var(--muted)", fontSize: 13 }}>Nadie predijo este partido</div>
                : profiles.map((prof, idx) => {
                    const pred = matchPreds.find(p => p.user_id === prof.id);
                    const isMe = prof.id === user.id;
                    return (
                      <div key={prof.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 18px",
                        borderBottom: idx < profiles.length - 1 ? "1px solid var(--border)" : "none",
                        background: isMe ? "rgba(245,183,49,.04)" : "transparent"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="avatar sm">{initials(prof.name)}</div>
                          <span style={{ fontSize: 13 }}>{prof.name}</span>
                          {isMe && <span className="me-badge">TÚ</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {pred ? (<>
                            {resultIcon(pred, m)}
                            <span style={{ fontFamily: "Bebas Neue", fontSize: 20 }}>{pred.home_score} – {pred.away_score}</span>
                            {pred.points > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--green-dim)", color: "var(--green)" }}>+{pred.points} pts</span>}
                          </>) : (
                            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin predicción</span>
                          )}
                        </div>
                      </div>
                    );
                  })
              }

              {/* Legend */}
              {hasResult && (
                <div style={{ padding: "7px 18px", borderTop: "1px solid var(--border)", display: "flex", gap: 14, fontSize: 11, color: "var(--muted)" }}>
                  <span><span style={{ color: "var(--gold)" }}>★</span> Exacto</span>
                  <span><span style={{ color: "var(--green)" }}>✓</span> Resultado correcto</span>
                  <span><span style={{ color: "var(--red)" }}>✗</span> Falló</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>)}
  </>);
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

  async function deleteUser(userId) {
    setDeletingUser(userId);
    await sb.rpc("delete_user", { target_user_id: userId });
    setConfirmDelete(null);
    setDeletingUser(null);
    onRefresh();
  }

  useEffect(() => {
    sb.from("scoring_rules").select("*").then(({ data }) => {
      if (data) { setRules(data); const v={}; data.forEach(r=>{v[r.rule_key]=r.rule_value;}); setRuleVals(v); }
    });
    sb.from("invite_codes").select("*").then(({ data }) => { if (data) setInvites(data); });
  }, []);

  async function saveResult(match) {
    const r = results[match.id] || {};
    if (r.home===undefined||r.away===undefined||r.home===""||r.away==="") return;
    setSaving(s=>({...s,[match.id]:true}));
    const homeScore=parseInt(r.home), awayScore=parseInt(r.away);
    await sb.from("matches").update({home_score:homeScore,away_score:awayScore,status:"finished"}).eq("id",match.id);
    const {data:preds} = await sb.from("predictions").select("*").eq("match_id",match.id);
    if (preds) {
      const exactPts=ruleVals["exact_score"]||3, resultPts=ruleVals["correct_result"]||1;
      const realResult=homeScore>awayScore?"home":awayScore>homeScore?"away":"draw";
      for (const pred of preds) {
        let pts=0;
        if (pred.home_score===homeScore&&pred.away_score===awayScore) { pts=exactPts; }
        else { const pr=pred.home_score>pred.away_score?"home":pred.away_score>pred.home_score?"away":"draw"; if(pr===realResult) pts=resultPts; }
        await sb.from("predictions").update({points:pts}).eq("id",pred.id);
      }
    }
    setSavedMatch(s=>({...s,[match.id]:true})); setSaving(s=>({...s,[match.id]:false})); onRefresh();
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

  const filtered = filter==="all"?matches:filter==="finished"?matches.filter(m=>m.status==="finished"):matches.filter(m=>m.status!=="finished");
  const ruleLabels = {exact_score:"Marcador exacto",correct_result:"Resultado correcto",group_first:"1ro de grupo",group_second:"2do de grupo",third_place_qualifier:"Tercero clasifica"};

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
            <div className="modal-btns">
              <button className="btn-cancel" onClick={()=>setEditMatch(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={saveEditMatch}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="sec-hdr"><h2>🔧 PANEL ADMIN</h2><span>Solo visible para administradores</span></div>

      <div className="admin-section">
        <div className="admin-section-hdr">
          <h3>⚽ INGRESAR RESULTADOS</h3>
          <div style={{fontSize:12,color:"var(--muted)"}}>{matches.filter(m=>m.status==="finished").length}/{matches.length} completados</div>
        </div>
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
              return (
                <div key={m.id} className="admin-match-row">
                  <div style={{fontSize:11,color:"var(--muted)"}}>{m.match_date}<br/><span style={{color:"var(--txt)"}}>Grupo {m.group_name}</span></div>
                  <div style={{fontSize:13,fontWeight:500,display:"flex",flexDirection:"column",gap:3}}><span style={{display:"flex",alignItems:"center",gap:5}}><img src={m.home_flag} alt={m.home} style={{width:18,height:14,objectFit:"cover",borderRadius:2}}/>{m.home}</span><span style={{display:"flex",alignItems:"center",gap:5}}><img src={m.away_flag} alt={m.away} style={{width:18,height:14,objectFit:"cover",borderRadius:2}}/>{m.away}</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <input className="admin-score-input" value={r.home??""} onChange={e=>setResults(s=>({...s,[m.id]:{...s[m.id],home:e.target.value.replace(/[^0-9]/g,"").slice(0,2)}}))} placeholder="0"/>
                    <span style={{color:"var(--muted)",fontFamily:"Bebas Neue",fontSize:16}}>–</span>
                    <input className="admin-score-input" value={r.away??""} onChange={e=>setResults(s=>({...s,[m.id]:{...s[m.id],away:e.target.value.replace(/[^0-9]/g,"").slice(0,2)}}))} placeholder="0"/>
                  </div>
                  <div>{finished?<span className="result-badge">✓ {m.home_score}–{m.away_score}</span>:savedMatch[m.id]?<span style={{fontSize:11,color:"var(--green)"}}>✓</span>:null}</div>
                  <div style={{display:"flex",gap:5}}>
                    <button className="admin-save-btn" onClick={()=>saveResult(m)} disabled={saving[m.id]}>{saving[m.id]?"...":finished?"Actualizar":"Guardar"}</button>
                    <button className="admin-edit-btn" onClick={()=>{setEditMatch(m);setEditForm({...m});}}>✏️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-hdr">
          <h3>⚙️ SISTEMA DE PUNTOS</h3>
          <button className="btn-small" onClick={saveRules} disabled={savingRules}>{rulesSaved?"✓ Guardado":savingRules?"...":"Guardar"}</button>
        </div>
        <div className="admin-section-body">
          <div className="rules-grid">
            {rules.map(r=>(
              <div key={r.rule_key} className="rule-card">
                <span className="rule-label">{ruleLabels[r.rule_key]||r.rule_key}</span>
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
        <div className="admin-section-hdr">
          <h3>👥 GESTIÓN DE USUARIOS</h3>
          <span style={{fontSize:12,color:"var(--muted)"}}>{profiles.length} participantes</span>
        </div>
        <div className="admin-section-body">
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {profiles.map(prof => (
              <div key={prof.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="avatar sm">{initials(prof.name)}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:500}}>{prof.name}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{new Date(prof.created_at).toLocaleDateString("es", {day:"2-digit",month:"short",year:"numeric"})}</div>
                  </div>
                </div>
                {confirmDelete === prof.id ? (
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--red)"}}>¿Confirmar?</span>
                    <button className="btn-small" onClick={()=>setConfirmDelete(null)}>Cancelar</button>
                    <button className="btn-small red" onClick={()=>deleteUser(prof.id)} disabled={deletingUser===prof.id}>
                      {deletingUser===prof.id?"...":"Eliminar"}
                    </button>
                  </div>
                ) : (
                  <button className="btn-small red" onClick={()=>setConfirmDelete(prof.id)}>🗑️ Eliminar</button>
                )}
              </div>
            ))}
          </div>
        </div>
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

  useEffect(() => {
    // Handle password reset token in URL
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setBooting(false);
      return;
    }

    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ ...session.user, profile });
      }
      setBooting(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setBooting(false);
        return;
      }
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ ...session.user, profile });
      } else { setUser(null); setIsAdmin(false); }
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

  async function handleLogout() { await sb.auth.signOut(); setUser(null); }

  if (booting) return (<><style>{css}</style><div className="spinner"><div className="spin"/><span>Cargando...</span></div></>);
  if (!user) return (<><style>{css}</style><AuthScreen onAuth={setUser}/></>);

  return (<><style>{css}</style>
    <div className="shell">
      <nav className="nav">
        <div className="nav-brand">🏆 QUINIELA 2026</div>
        <div className="nav-tabs">
          {[["home","🏠 Inicio"],["pre","📋 Pre-Torneo"],["matches","⚽ Partidos"],["compare","👁️ Comparar"],["standings","📊 Posiciones"]].map(([k,l])=>(
            <button key={k} className={`nav-tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
          ))}
          {isAdmin && <button className={`nav-tab admin-tab ${tab==="admin"?"active":""}`} onClick={()=>setTab("admin")}>🔧 Admin</button>}
        </div>
        <div className="nav-user">
          <div className="avatar">{initials(user.profile?.name||user.email)}</div>
          <span style={{fontSize:13}}>{user.profile?.name||user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Salir</button>
        </div>
      </nav>
      <main className="main">
        {tab==="home"      && <Dashboard user={user} matches={matches} predictions={myPredictions} onGoTab={setTab}/>}
        {tab==="pre"       && <PreTournament user={user}/>}
        {tab==="matches"   && <Matches user={user} matches={matches} predictions={myPredictions} allPredictions={allPredictions} profiles={profiles} onSave={loadData}/>}
        {tab==="compare"   && <Compare user={user} matches={matches} allPredictions={allPredictions} profiles={profiles}/>}
        {tab==="standings" && <Standings user={user} predictions={allPredictions} profiles={profiles}/>}
        {tab==="admin"     && isAdmin && <AdminPanel matches={matches} profiles={profiles} onRefresh={loadData}/>}
      </main>
    </div>
  </>);
}
