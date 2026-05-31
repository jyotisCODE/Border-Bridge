import { useState, useEffect, useRef } from "react";
import countries from "./countries.json";

const graph = Object.fromEntries(countries.map(c => [c.id, c.borders]));
const nameById = Object.fromEntries(countries.map(c => [c.id, c.name]));
const flagById = Object.fromEntries(countries.map(c => [c.id, c.flag]));
const idByName = Object.fromEntries(countries.map(c => [c.name.toLowerCase(), c.id]));
const countryNames = countries.map(c => c.name).sort();

function bfs(startId, endId) {
  if (startId === endId) return [startId];
  const queue = [[startId]];
  const visited = new Set([startId]);
  while (queue.length) {
    const path = queue.shift();
    const current = path.at(-1);
    for (const neighbor of graph[current] ?? []) {
      if (!visited.has(neighbor)) {
        if (neighbor === endId) return [...path, neighbor];
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

const EXAMPLES = [
  ["Portugal", "China"],
  ["India", "France"],
  ["Brazil", "Argentina"],
  ["Norway", "Iran"],
];

const SESSION_KEY = "bb_session";
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || { solved: 0, hops: 0, longest: 0, longestRoute: "" }; }
  catch { return { solved: 0, hops: 0, longest: 0, longestRoute: "" }; }
}
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }

export default function App() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [userPath, setUserPath] = useState([]);
  const [guess, setGuess] = useState("");
  const [mode, setMode] = useState("auto");
  const [won, setWon] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [shake, setShake] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [session, setSession] = useState(getSession());
  const timerRef = useRef(null);
  const guessRef = useRef(null);

  useEffect(() => {
    if (timerActive) timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  function getIds() {
    return {
      sId: idByName[start.trim().toLowerCase()],
      eId: idByName[end.trim().toLowerCase()]
    };
  }

  function triggerError(msg) {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  }

  function handleSolve() {
    setError(""); setResult(null); setUserPath([]); setWon(false); setRevealedSteps(0);
    const { sId, eId } = getIds();
    if (!sId) return triggerError(`Can't find "${start}"`);
    if (!eId) return triggerError(`Can't find "${end}"`);
    const path = bfs(sId, eId);
    if (!path) return triggerError("No land path exists between these countries.");
    setResult(path);
    let i = 0;
    const iv = setInterval(() => { i++; setRevealedSteps(i); if (i >= path.length) clearInterval(iv); }, 280);
  }

  function handleStartManual() {
    setError(""); setResult(null); setWon(false); setTimer(0);
    const { sId, eId } = getIds();
    if (!sId) return triggerError(`Can't find "${start}"`);
    if (!eId) return triggerError(`Can't find "${end}"`);
    setUserPath([sId]);
    setTimerActive(true);
    setTimeout(() => guessRef.current?.focus(), 100);
  }

  function handleGuess() {
    const gId = idByName[guess.trim().toLowerCase()];
    if (!gId) return triggerError(`Can't find "${guess}"`);
    setError("");
    const current = userPath.at(-1);
    if (!graph[current]?.includes(gId)) {
      triggerError(`${nameById[gId]} doesn't border ${nameById[current]}`);
      setShake(true); setTimeout(() => setShake(false), 500);
      return;
    }
    const newPath = [...userPath, gId];
    setUserPath(newPath);
    setGuess("");
    guessRef.current?.focus();
    const { eId } = getIds();
    if (gId === eId) {
      const optimal = bfs(idByName[start.trim().toLowerCase()], eId);
      setTimerActive(false);
      setWon(true);
      setResult({ userPath: newPath, optimal });
      const hops = newPath.length - 1;
      const newSession = {
        solved: session.solved + 1,
        hops: session.hops + hops,
        longest: hops > session.longest ? hops : session.longest,
        longestRoute: hops > session.longest ? `${start} → ${end}` : session.longestRoute
      };
      setSession(newSession);
      saveSession(newSession);
    }
  }

  function loadExample(s, e) {
    setStart(s); setEnd(e);
    setResult(null); setUserPath([]); setWon(false); setError("");
  }

  function reset() {
    setResult(null); setUserPath([]); setWon(false);
    setStart(""); setEnd(""); setError(""); setTimer(0); setTimerActive(false);
  }

  const isManualActive = mode === "manual" && userPath.length > 0 && !won;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cyan: #4dd9e8;
          --cyan-dim: rgba(77,217,232,0.18);
          --cyan-glow: rgba(77,217,232,0.35);
          --gold: #c9a84c;
          --gold-dim: rgba(201,168,76,0.18);
          --gold-glow: rgba(201,168,76,0.4);
          --green: #4ade80;
          --green-dim: rgba(74,222,128,0.15);
          --danger: #ff6b6b;
          --text: #e8dfc8;
          --text-dim: rgba(232,223,200,0.5);
          --text-faint: rgba(232,223,200,0.25);
          --panel-bg: rgba(8,16,28,0.82);
          --panel-border: rgba(77,217,232,0.22);
          --input-bg: rgba(4,10,20,0.75);
          --screw: rgba(77,217,232,0.4);
        }

        html, body { width: 100%; height: 100%; overflow-x: hidden; }

        body {
          font-family: 'Rajdhani', sans-serif;
          background: #06080d;
          color: var(--text);
          min-height: 100vh;
        }

        /* ── BACKGROUND ── */
        .bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('/map-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .bg::after {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(4,12,24,0.45) 0%, rgba(4,12,24,0.88) 100%),
            linear-gradient(180deg, rgba(4,12,24,0.6) 0%, transparent 30%, transparent 70%, rgba(4,12,24,0.7) 100%);
        }

        /* ── LAYOUT ── */
        .app {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px 48px;
        }

        /* ── HEADER ── */
        .header {
          text-align: center;
          margin-bottom: 28px;
          animation: fadeDown 0.7s cubic-bezier(.22,1,.36,1) both;
        }

        .title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .compass {
          width: 54px; height: 54px;
          position: relative;
          filter: drop-shadow(0 0 12px var(--cyan-glow));
        }

        .compass svg { width: 100%; height: 100%; }

        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 900;
          letter-spacing: 0.06em;
          color: var(--cyan);
          text-shadow: 0 0 30px var(--cyan-glow), 0 0 60px rgba(77,217,232,0.2);
        }

        .subtitle {
          font-size: 1rem;
          font-weight: 400;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        /* ── HUD PANEL ── */
        .panel {
          width: 100%;
          max-width: 700px;
          background: var(--panel-bg);
          border: 1px solid var(--panel-border);
          border-radius: 4px;
          padding: 28px 28px 24px;
          position: relative;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 0 0 1px rgba(77,217,232,0.08),
            0 0 40px rgba(77,217,232,0.06),
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 24px 64px rgba(0,0,0,0.7);
          animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both;
        }

        /* Corner screws */
        .panel::before, .panel::after,
        .panel-inner::before, .panel-inner::after {
          content: '◈';
          position: absolute;
          font-size: 10px;
          color: var(--screw);
          line-height: 1;
        }
        .panel::before  { top: 8px;  left: 10px; }
        .panel::after   { top: 8px;  right: 10px; }
        .panel-inner::before { bottom: 8px; left: 10px; }
        .panel-inner::after  { bottom: 8px; right: 10px; }

        /* Top edge line */
        .panel-topbar {
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          box-shadow: 0 0 8px var(--cyan);
        }

        /* ── MODE TOGGLE ── */
        .mode-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 24px;
        }

        .mode-btn {
          padding: 11px 16px;
          background: rgba(10,20,36,0.6);
          border: 1px solid rgba(77,217,232,0.15);
          border-radius: 3px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .mode-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(77,217,232,0.04) 100%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .mode-btn:hover::before { opacity: 1; }
        .mode-btn:hover { border-color: rgba(77,217,232,0.35); color: var(--text); }

        .mode-btn.active {
          background: rgba(77,217,232,0.08);
          border-color: var(--cyan);
          color: var(--cyan);
          box-shadow: 0 0 12px rgba(77,217,232,0.15), inset 0 0 12px rgba(77,217,232,0.05);
        }

        .mode-btn.active-green {
          background: rgba(74,222,128,0.08);
          border-color: var(--green);
          color: var(--green);
          box-shadow: 0 0 12px rgba(74,222,128,0.15), inset 0 0 12px rgba(74,222,128,0.05);
        }

        /* ── INPUTS ── */
        .inputs-row {
          display: grid;
          grid-template-columns: 1fr 48px 1fr;
          align-items: end;
          gap: 8px;
          margin-bottom: 16px;
        }

        .field { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cyan);
          opacity: 0.7;
        }

        .field-input {
          background: var(--input-bg);
          border: 1px solid rgba(77,217,232,0.2);
          border-radius: 3px;
          color: var(--text);
          padding: 12px 14px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          outline: none;
          width: 100%;
          transition: all 0.2s;
          /* Hex corner cuts */
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }

        .field-input:focus {
          border-color: var(--cyan);
          box-shadow: 0 0 0 1px var(--cyan), 0 0 12px rgba(77,217,232,0.2);
          background: rgba(4,20,36,0.9);
        }

        .field-input::placeholder { color: var(--text-faint); }

        .arrow-mid {
          display: flex; align-items: flex-end;
          justify-content: center;
          padding-bottom: 14px;
          color: var(--cyan);
          font-size: 1.1rem;
          opacity: 0.6;
        }

        /* ── EXAMPLES ── */
        .examples-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 18px;
          align-items: center;
        }

        .ex-label {
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-faint);
          margin-right: 2px;
        }

        .ex-chip {
          background: rgba(10,20,36,0.7);
          border: 1px solid rgba(77,217,232,0.14);
          border-radius: 2px;
          padding: 5px 11px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.15s;
        }

        .ex-chip:hover {
          border-color: var(--cyan);
          color: var(--cyan);
          background: var(--cyan-dim);
        }

        /* ── ACTION BUTTON ── */
        .action-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, rgba(30,80,120,0.6), rgba(10,40,80,0.8));
          border: 1px solid var(--cyan);
          border-radius: 3px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--cyan);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
          box-shadow: 0 0 16px rgba(77,217,232,0.15), inset 0 0 20px rgba(77,217,232,0.04);
        }

        .action-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(77,217,232,0.08), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .action-btn:hover { box-shadow: 0 0 28px rgba(77,217,232,0.3), inset 0 0 20px rgba(77,217,232,0.08); }
        .action-btn:hover::before { opacity: 1; }
        .action-btn:active { transform: scale(0.995); }

        /* ── ERROR ── */
        .error {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,100,100,0.3);
          border-radius: 3px;
          color: var(--danger);
          font-size: 0.88rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          animation: fadeIn 0.2s ease;
        }

        /* ── RESULT BOX ── */
        .result-box {
          margin-top: 20px;
          background: rgba(4,12,24,0.7);
          border: 1px solid rgba(77,217,232,0.18);
          border-radius: 3px;
          padding: 20px;
          animation: fadeUp 0.3s ease both;
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .result-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--cyan);
          opacity: 0.6;
        }

        .hop-badge {
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--gold);
          background: var(--gold-dim);
          border: 1px solid rgba(201,168,76,0.3);
          padding: 3px 10px;
          border-radius: 2px;
        }

        /* ── PATH ── */
        .path-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }

        .path-step {
          display: flex; align-items: center; gap: 6px;
          animation: popIn 0.3s cubic-bezier(.34,1.56,.64,1) both;
        }

        .chip {
          display: flex; align-items: center; gap: 5px;
          background: rgba(10,24,40,0.8);
          border: 1px solid rgba(77,217,232,0.2);
          border-radius: 2px;
          padding: 5px 12px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text);
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px));
        }

        .chip.start { border-color: var(--cyan); color: var(--cyan); background: var(--cyan-dim); }
        .chip.end { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }
        .chip.won { border-color: var(--green); color: var(--green); background: var(--green-dim); }
        .chip.unknown {
          border-color: var(--cyan);
          color: var(--cyan);
          background: var(--cyan-dim);
          animation: pulse 1.4s ease infinite;
        }

        .path-arrow { color: var(--text-faint); font-size: 0.8rem; }

        /* ── BORDERS HINT ── */
        .hint-box {
          margin-top: 14px;
          padding: 12px 14px;
          background: rgba(4,12,24,0.6);
          border: 1px solid rgba(77,217,232,0.1);
          border-radius: 3px;
        }

        .hint-label {
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-faint);
          margin-bottom: 8px;
        }

        .hint-tags { display: flex; flex-wrap: wrap; gap: 5px; }

        .hint-tag {
          background: rgba(10,20,36,0.7);
          border: 1px solid rgba(77,217,232,0.12);
          border-radius: 2px;
          padding: 4px 9px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.15s;
        }

        .hint-tag:hover { border-color: var(--cyan); color: var(--cyan); }

        /* ── GUESS ROW ── */
        .guess-row { display: flex; gap: 8px; margin-top: 14px; }

        .guess-input {
          flex: 1;
          background: var(--input-bg);
          border: 1px solid rgba(77,217,232,0.2);
          border-radius: 3px;
          color: var(--text);
          padding: 11px 14px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }

        .guess-input:focus { border-color: var(--cyan); box-shadow: 0 0 10px rgba(77,217,232,0.15); }
        .guess-input.shake { animation: shake 0.4s ease; }

        .go-btn {
          background: linear-gradient(135deg, rgba(10,50,30,0.8), rgba(4,30,18,0.9));
          border: 1px solid var(--green);
          border-radius: 3px;
          color: var(--green);
          padding: 11px 20px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 10px rgba(74,222,128,0.1);
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }

        .go-btn:hover { box-shadow: 0 0 18px rgba(74,222,128,0.25); }

        /* ── TIMER ── */
        .timer {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--text-faint);
        }

        .timer.active { color: var(--cyan); }

        /* ── WIN BOX ── */
        .win-box {
          margin-top: 20px;
          background: rgba(4,16,10,0.75);
          border: 1px solid rgba(74,222,128,0.3);
          border-radius: 3px;
          padding: 28px 24px;
          text-align: center;
          animation: fadeUp 0.4s ease both;
          position: relative;
          overflow: hidden;
        }

        .win-box::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 0%, rgba(74,222,128,0.08), transparent 70%);
          pointer-events: none;
        }

        .win-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--green);
          letter-spacing: 0.1em;
          margin-bottom: 4px;
          filter: drop-shadow(0 0 10px rgba(74,222,128,0.4));
        }

        .win-sub { font-size: 0.82rem; color: var(--text-faint); letter-spacing: 0.1em; margin-bottom: 20px; }

        .win-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-bottom: 20px;
        }

        .stat { display: flex; flex-direction: column; align-items: center; gap: 3px; }

        .stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1;
        }

        .stat-lbl {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        .perfect-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--gold-dim);
          border: 1px solid rgba(201,168,76,0.35);
          color: var(--gold);
          padding: 5px 14px;
          border-radius: 2px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          margin-bottom: 18px;
        }

        .play-again {
          background: rgba(10,20,36,0.8);
          border: 1px solid rgba(77,217,232,0.25);
          border-radius: 3px;
          color: var(--text-dim);
          padding: 10px 28px;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
        }

        .play-again:hover { border-color: var(--cyan); color: var(--cyan); }

        /* ── SESSION STATS ── */
        .session-bar {
          display: flex;
          justify-content: center;
          gap: 28px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(77,217,232,0.08);
          animation: fadeUp 0.7s ease 0.3s both;
        }

        .sess-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }

        .sess-val {
          font-family: 'Playfair Display', serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--cyan);
        }

        .sess-lbl {
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        /* ── DIVIDER ── */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(77,217,232,0.15), transparent);
          margin: 20px 0;
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes popIn {
          0%  { opacity: 0; transform: scale(0.6); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-7px); }
          40%     { transform: translateX(7px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }

        datalist { display: none; }

        @media (max-width: 600px) {
          .panel { padding: 20px 16px; }
          .win-stats { gap: 18px; }
          .session-bar { gap: 16px; }
        }
      `}</style>

      {/* Background */}
      <div className="bg" />

      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="title-row">
            <div className="compass">
              <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="27" cy="27" r="25" stroke="rgba(77,217,232,0.5)" strokeWidth="1.5"/>
                <circle cx="27" cy="27" r="19" stroke="rgba(77,217,232,0.25)" strokeWidth="1"/>
                <polygon points="27,6 30,24 27,22 24,24" fill="#4dd9e8"/>
                <polygon points="27,48 24,30 27,32 30,30" fill="rgba(77,217,232,0.35)"/>
                <polygon points="6,27 24,24 22,27 24,30" fill="rgba(201,168,76,0.6)"/>
                <polygon points="48,27 30,30 32,27 30,24" fill="rgba(201,168,76,0.3)"/>
                <circle cx="27" cy="27" r="3" fill="#4dd9e8" opacity="0.8"/>
                {[0,45,90,135,180,225,270,315].map(a => (
                  <line key={a}
                    x1={27 + 16 * Math.cos(a * Math.PI/180)}
                    y1={27 + 16 * Math.sin(a * Math.PI/180)}
                    x2={27 + 20 * Math.cos(a * Math.PI/180)}
                    y2={27 + 20 * Math.sin(a * Math.PI/180)}
                    stroke="rgba(77,217,232,0.4)" strokeWidth="1"
                  />
                ))}
              </svg>
            </div>
            <h1>Border Bridge</h1>
          </div>
          <p className="subtitle">Navigate the world through land borders</p>
        </div>

        {/* Main HUD Panel */}
        <div className="panel">
          <div className="panel-inner">
            <div className="panel-topbar" />

            {/* Mode toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === "auto" ? "active" : ""}`}
                onClick={() => { setMode("auto"); reset(); }}
              >⚡ Auto Solve</button>
              <button
                className={`mode-btn ${mode === "manual" ? "active-green" : ""}`}
                onClick={() => { setMode("manual"); reset(); }}
              >✦ Play Yourself</button>
            </div>

            {/* Inputs */}
            <div className="inputs-row">
              <div className="field">
                <span className="field-label">Start</span>
                <input
                  className="field-input"
                  list="clist"
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  placeholder="e.g. Portugal"
                />
              </div>
              <div className="arrow-mid">→</div>
              <div className="field">
                <span className="field-label">End</span>
                <input
                  className="field-input"
                  list="clist"
                  value={end}
                  onChange={e => setEnd(e.target.value)}
                  placeholder="e.g. China"
                />
              </div>
            </div>

            <datalist id="clist">
              {countryNames.map(n => <option key={n} value={n} />)}
            </datalist>

            {/* Examples */}
            <div className="examples-row">
              <span className="ex-label">Try</span>
              {EXAMPLES.map(([s, e]) => (
                <button key={s+e} className="ex-chip" onClick={() => loadExample(s, e)}>
                  {s} → {e}
                </button>
              ))}
            </div>

            {/* Action button */}
            {mode === "auto" && (
              <button className="action-btn" onClick={handleSolve}>
                [ Find Shortest Path ]
              </button>
            )}
            {mode === "manual" && !isManualActive && !won && (
              <button className="action-btn" onClick={handleStartManual}>
                [ Start Puzzle ]
              </button>
            )}

            {/* Error */}
            {error && <div className="error">⚠ {error}</div>}

            {/* Auto result */}
            {mode === "auto" && result && (
              <div className="result-box">
                <div className="result-header">
                  <span className="result-label">Shortest Path</span>
                  <span className="hop-badge">{result.length - 1} {result.length - 1 === 1 ? "hop" : "hops"}</span>
                </div>
                <div className="path-row">
                  {result.slice(0, revealedSteps).map((id, i) => (
                    <div key={id} className="path-step">
                      <div className={`chip ${i === 0 ? "start" : i === result.length - 1 ? "end" : ""}`}>
                        <span>{flagById[id]}</span>{nameById[id]}
                      </div>
                      {i < result.length - 1 && <span className="path-arrow">›</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual active */}
            {isManualActive && (
              <div className="result-box">
                <div className="result-header">
                  <span className="result-label">Your Path</span>
                  <span className={`timer ${timerActive ? "active" : ""}`}>⏱ {fmt(timer)}</span>
                </div>
                <div className="path-row">
                  {userPath.map((id, i) => (
                    <div key={id} className="path-step">
                      <div className={`chip ${i === 0 ? "start" : ""}`}>
                        <span>{flagById[id]}</span>{nameById[id]}
                      </div>
                      <span className="path-arrow">›</span>
                    </div>
                  ))}
                  <div className="chip unknown">?</div>
                </div>

                <div className="hint-box">
                  <div className="hint-label">Borders of {nameById[userPath.at(-1)]}</div>
                  <div className="hint-tags">
                    {(graph[userPath.at(-1)] ?? []).length === 0
                      ? <span style={{color:"var(--text-faint)",fontSize:"0.82rem"}}>Island — no land borders</span>
                      : (graph[userPath.at(-1)] ?? []).map(b => (
                        <span key={b} className="hint-tag"
                          onClick={() => { setGuess(nameById[b] ?? b); guessRef.current?.focus(); }}>
                          {flagById[b]} {nameById[b] ?? b}
                        </span>
                      ))
                    }
                  </div>
                </div>

                <div className="guess-row">
                  <input
                    ref={guessRef}
                    className={`guess-input ${shake ? "shake" : ""}`}
                    list="clist"
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleGuess()}
                    placeholder="Type next country or click above..."
                  />
                  <button className="go-btn" onClick={handleGuess}>Go →</button>
                </div>
              </div>
            )}

            {/* Win */}
            {won && result && (
              <div className="win-box">
                <div className="win-title">Mission Complete</div>
                <div className="win-sub">PATH SECURED</div>
                <div className="win-stats">
                  <div className="stat">
                    <span className="stat-val">{result.userPath.length - 1}</span>
                    <span className="stat-lbl">Your Hops</span>
                  </div>
                  <div className="stat">
                    <span className="stat-val">{result.optimal.length - 1}</span>
                    <span className="stat-lbl">Optimal</span>
                  </div>
                  <div className="stat">
                    <span className="stat-val">{fmt(timer)}</span>
                    <span className="stat-lbl">Time</span>
                  </div>
                </div>
                {result.userPath.length === result.optimal.length
                  ? <div className="perfect-badge">✦ OPTIMAL ROUTE ACHIEVED</div>
                  : <p style={{color:"var(--text-faint)",fontSize:"0.82rem",marginBottom:"14px",letterSpacing:"0.03em"}}>
                      Optimal: {result.optimal.map(id => nameById[id]).join(" → ")}
                    </p>
                }
                <div className="path-row" style={{justifyContent:"center",marginBottom:"20px",flexWrap:"wrap"}}>
                  {result.userPath.map((id, i) => (
                    <div key={id} className="path-step">
                      <div className="chip won"><span>{flagById[id]}</span>{nameById[id]}</div>
                      {i < result.userPath.length - 1 && <span className="path-arrow">›</span>}
                    </div>
                  ))}
                </div>
                <button className="play-again" onClick={reset}>[ Play Again ]</button>
              </div>
            )}

            {/* Session stats */}
            <div className="divider" />
            <div className="session-bar">
              <div className="sess-item">
                <span className="sess-val">{session.solved}</span>
                <span className="sess-lbl">Puzzles Solved</span>
              </div>
              <div className="sess-item">
                <span className="sess-val">{session.hops}</span>
                <span className="sess-lbl">Total Hops</span>
              </div>
              <div className="sess-item">
                <span className="sess-val">{session.longest || "—"}</span>
                <span className="sess-lbl">Longest Bridge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
