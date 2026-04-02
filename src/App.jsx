import { useState, useEffect, useRef } from "react";

// ─── GAME DATA ───────────────────────────────────────────────────────────────

const SPACES = [
  { id: 0,  name: "Piazza San Marco",      type: "start",    icon: "🏛️", desc: "Your reign begins. Venice awaits." },
  { id: 1,  name: "Great Council",         type: "council",  icon: "📜", desc: "Propose a law by doffing your hat." },
  { id: 2,  name: "Arsenal Docks",         type: "trade",    icon: "⚓", desc: "Venice's naval heart. Trade routes expand." },
  { id: 3,  name: "Rialto Bridge",         type: "trade",    icon: "💰", desc: "Merchants haggle. Ducats flow." },
  { id: 4,  name: "Doge's Palace",         type: "palace",   icon: "🏰", desc: "Affairs of state demand your presence." },
  { id: 5,  name: "Rival Noble's Palazzo", type: "danger",   icon: "🗡️", desc: "The Contarini family plots against you." },
  { id: 6,  name: "St. Mark's Basilica",   type: "church",   icon: "⛪", desc: "Divine favor blesses your reign." },
  { id: 7,  name: "Marriage to the Sea",   type: "ritual",   icon: "💍", desc: "Toss the ring. Venice is yours." },
  { id: 8,  name: "Senate Chamber",        type: "council",  icon: "🏛️", desc: "Diplomats press for war. You must decide." },
  { id: 9,  name: "Piombi Prison",         type: "danger",   icon: "⛓️", desc: "Enemies whisper treason in your name." },
  { id: 10, name: "Dalmatian Coast",       type: "conquest", icon: "⚔️", desc: "Expand the Republic's dominion." },
  { id: 11, name: "The Bucentaur",         type: "ritual",   icon: "🚢", desc: "Board the golden galley. Prestige soars." },
  { id: 12, name: "Contarini Feast",       type: "intrigue", icon: "🍷", desc: "A lavish dinner — or a trap?" },
  { id: 13, name: "Post-Death Audit",      type: "danger",   icon: "⚖️", desc: "Your estate faces scrutiny. Pay or suffer." },
  { id: 14, name: "Election Committee",    type: "council",  icon: "🎲", desc: "41 voters decide a law. Maneuver wisely." },
  { id: 15, name: "Adriatic Trade Wind",   type: "trade",    icon: "🌊", desc: "Favorable winds fill merchant sails." },
  { id: 16, name: "Crusade Diversion",     type: "conquest", icon: "✝️", desc: "Like Dandolo — turn holy war to profit." },
  { id: 17, name: "Monastery Exile",       type: "danger",   icon: "🕌", desc: "Rivals demand you be 'retired' to God." },
  { id: 18, name: "Silk Road Alliance",    type: "trade",    icon: "🎁", desc: "Eastern merchants offer a lucrative deal." },
  { id: 19, name: "Sestieri Council",      type: "council",  icon: "🗺️", desc: "Six district counselors share the blame." },
  { id: 20, name: "Victory: Doge Eternal", type: "win",      icon: "👑", desc: "Venice remembers your name forever." },
];

const CARDS = {
  council: [
    { title: "Bold Proposal",    effect: "+2 Prestige, +1 Stability", ps: 2,  st: 1,  dc: 0,  flavor: "You doff your hat. The council murmurs approval." },
    { title: "Counselors Overrule", effect: "-1 Prestige",            ps: -1, st: 0,  dc: 0,  flavor: "Six counselors remind you of your limits." },
    { title: "Senate Alliance",  effect: "+1 Stability, +5 Ducats",   ps: 0,  st: 1,  dc: 5,  flavor: "A senator owes you a favour — you collect." },
    { title: "Filibuster",       effect: "Lose 1 turn",               ps: 0,  st: 0,  dc: 0,  skip: true, flavor: "Debate runs until midnight. Nothing is decided." },
  ],
  trade: [
    { title: "Spice Route Windfall", effect: "+15 Ducats",              ps: 0,  st: 0,  dc: 15, flavor: "Cinnamon and pepper pour into the treasury." },
    { title: "Pirate Raid",          effect: "-10 Ducats",              ps: 0,  st: 0,  dc: -10, flavor: "Saracen pirates strike the merchant fleet." },
    { title: "Exclusive Charter",    effect: "+10 Ducats, +1 Prestige", ps: 1,  st: 0,  dc: 10, flavor: "Venice alone controls the Eastern routes." },
    { title: "Trade War",            effect: "-1 Stability",            ps: 0,  st: -1, dc: 0,  flavor: "Genoa retaliates. Markets tremble." },
  ],
  danger: [
    { title: "Assassination Plot",  effect: "-2 Stability, -1 Prestige", ps: -1, st: -2, dc: 0,  flavor: "A dagger gleams in the torchlight." },
    { title: "Treason Accusation",  effect: "-2 Prestige",               ps: -2, st: 0,  dc: 0,  flavor: "Anonymous notes flood the Lion's Mouth." },
    { title: "Rival Family Rises",  effect: "-1 Stability, -5 Ducats",   ps: 0,  st: -1, dc: -5, flavor: "The Morosini clan buys votes against you." },
    { title: "Survived the Night",  effect: "+1 Stability",              ps: 0,  st: 1,  dc: 0,  flavor: "Your guards held. For now." },
  ],
  ritual: [
    { title: "Ring Cast True",       effect: "+3 Prestige, +1 Stability", ps: 3,  st: 1,  dc: 0, flavor: "Venice and Sea are wed once more. The crowd roars." },
    { title: "Ceremony Disrupted",   effect: "-2 Prestige",               ps: -2, st: 0,  dc: 0, flavor: "Storm clouds break over the Bucentaur." },
  ],
  conquest: [
    { title: "Dalmatia Secured",  effect: "+3 Prestige, +10 Ducats",    ps: 3,  st: 0, dc: 10,  flavor: "The Adriatic coast bends the knee." },
    { title: "Campaign Fails",    effect: "-2 Prestige, -10 Ducats",    ps: -2, st: 0, dc: -10, flavor: "The army returns in disgrace." },
    { title: "Holy War Profit",   effect: "+15 Ducats, +2 Prestige",    ps: 2,  st: 0, dc: 15,  flavor: "As Dandolo knew — crusades serve Venice first." },
  ],
  intrigue: [
    { title: "Feast Allies Gained", effect: "+2 Stability, +5 Ducats", ps: 0, st: 2,  dc: 5,  flavor: "Wine loosened lips — and opened purses." },
    { title: "Poisoned Goblet",     effect: "-3 Stability",             ps: 0, st: -3, dc: 0,  flavor: "The wine tasted wrong. You suspect everything." },
    { title: "Secret Pact",         effect: "+2 Prestige",              ps: 2, st: 0,  dc: 0,  flavor: "An ancient family pledges quiet support." },
  ],
  church: [
    { title: "Papal Blessing",          effect: "+2 Prestige, +1 Stability", ps: 2,  st: 1, dc: 0, flavor: "The Bishop anoints your brow." },
    { title: "Excommunication Threat",  effect: "-1 Prestige",               ps: -1, st: 0, dc: 0, flavor: "Rome is displeased with Venetian affairs." },
  ],
  palace: [
    { title: "Efficient Administration", effect: "+1 Stability, +5 Ducats",    ps: 0, st: 1,  dc: 5, flavor: "A well-run palace is a well-run republic." },
    { title: "Diplomatic Crisis",        effect: "-1 Stability",                ps: 0, st: -1, dc: 0, flavor: "The Byzantine ambassador storms out." },
    { title: "Promissione Oath Renewed", effect: "+1 Stability, +1 Prestige",  ps: 1, st: 1,  dc: 0, flavor: "You swear again. The patricians relax." },
  ],
};

const TYPE_COLORS = {
  start:    { bg: "#c8a84b", text: "#1a0a00" },
  council:  { bg: "#1a3a6b", text: "#f0e0a0" },
  trade:    { bg: "#2a6b3a", text: "#d0f0d0" },
  palace:   { bg: "#6b1a1a", text: "#f0d0a0" },
  danger:   { bg: "#3a0a0a", text: "#ff9090" },
  church:   { bg: "#4a3a6b", text: "#e0d0f0" },
  ritual:   { bg: "#6b5a1a", text: "#fff0c0" },
  conquest: { bg: "#6b3a1a", text: "#f0c090" },
  intrigue: { bg: "#3a1a3a", text: "#f0c0f0" },
  win:      { bg: "#8b6914", text: "#fff8dc" },
};

// ─── PLAYER MODEL ────────────────────────────────────────────────────────────

const PLAYER_COLORS = ["#f0d060", "#60b0f8", "#f07060", "#60e890"];
const AI_NAMES = ["Contarini", "Morosini", "Dandolo", "Foscari"];

function makePlayer(id, name, isAI) {
  return {
    id, name, isAI,
    prestige: 10, stability: 10, ducats: 30,
    position: 0, skipTurn: false,
    eliminated: false, eliminationReason: null, won: false,
    color: PLAYER_COLORS[id],
  };
}


// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Die({ rolling, value }) {
  const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  return (
    <div style={{
      fontSize: "3rem", lineHeight: 1,
      animation: rolling ? "spin 0.5s linear infinite" : "none",
      display: "inline-block",
      filter: "drop-shadow(0 2px 6px #0008)",
    }}>
      {faces[(value || 1) - 1]}
    </div>
  );
}

function StatBar({ label, value, max = 20, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#c8a84b", marginBottom: 2, fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ background: "#1a0e05", borderRadius: 4, height: 7, border: "1px solid #4a3210" }}>
        <div style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, height: "100%", borderRadius: 4, transition: "width 0.6s ease", boxShadow: `0 0 6px ${color}88` }} />
      </div>
    </div>
  );
}

function CardReveal({ card, onDismiss }) {
  if (!card) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0009", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.3s ease",
    }} onClick={onDismiss}>
      <div style={{
        background: "linear-gradient(160deg, #2a1800, #1a0e05)",
        border: "2px solid #c8a84b",
        borderRadius: 12,
        padding: "2rem 2.5rem",
        maxWidth: 360,
        textAlign: "center",
        boxShadow: "0 0 60px #c8a84b44, inset 0 0 40px #0006",
        animation: "slideUp 0.35s ease",
      }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "#c8a84b88", fontFamily: "Cinzel, serif", marginBottom: 8 }}>DECREE CARD</div>
        <div style={{ fontSize: "1.6rem", fontFamily: "Cinzel Decorative, serif", color: "#f0d080", marginBottom: 12 }}>{card.title}</div>
        <div style={{ fontSize: "0.85rem", color: "#d0b87a", fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>"{card.flavor}"</div>
        <div style={{
          background: "#0004", border: "1px solid #c8a84b44", borderRadius: 8,
          padding: "0.6rem 1rem", marginBottom: 16,
          fontSize: "0.8rem", color: "#f0e090", fontFamily: "Cinzel, serif",
        }}>{card.effect}</div>
        <div style={{ fontSize: "0.7rem", color: "#a07040" }}>Tap anywhere to continue</div>
      </div>
    </div>
  );
}

// Compact per-player stat card shown in the all-players grid
function PlayerCard({ player, isActive }) {
  const dim = player.eliminated;
  return (
    <div style={{
      background: isActive ? `linear-gradient(135deg, ${player.color}18, #1a0e05)` : "#120a02",
      border: `1px solid ${isActive ? player.color + "88" : "#2a1808"}`,
      borderRadius: 8,
      padding: "0.5rem 0.7rem",
      opacity: dim ? 0.45 : 1,
      transition: "all 0.35s ease",
      position: "relative",
    }}>
      {isActive && (
        <div style={{
          position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
          fontSize: "0.65rem", color: player.color, lineHeight: 1,
        }}>▼</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: player.color, boxShadow: `0 0 4px ${player.color}`, flexShrink: 0 }} />
          <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.68rem", color: isActive ? "#f0d080" : "#c8b060", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
            {player.isAI ? "⚙ " : ""}{player.name}
          </div>
        </div>
        <div style={{ fontSize: "0.58rem", color: "#5a4020", fontFamily: "Cinzel, serif" }}>
          {player.eliminated ? (player.eliminationReason || "out") : `${player.position}/20`}
        </div>
      </div>
      {!player.eliminated ? (
        <div style={{ display: "flex", gap: 7, fontSize: "0.65rem" }}>
          <span style={{ color: "#f0c030" }}>👑{player.prestige}</span>
          <span style={{ color: "#50d090" }}>⚖️{player.stability}</span>
          <span style={{ color: "#f0d050" }}>💰{player.ducats}</span>
        </div>
      ) : (
        <div style={{ fontSize: "0.62rem", color: "#ff6060", fontStyle: "italic" }}>
          {player.eliminationReason === "deposed" ? "Deposed" : player.eliminationReason === "exiled" ? "Exiled" : "Bankrupt"}
        </div>
      )}
    </div>
  );
}


// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function DogeGame() {

  // ── Setup state ──────────────────────────────────────────────────────────
  const [setupStep,   setSetupStep]   = useState(0);   // 0=counts  1=names
  const [humanCount,  setHumanCount]  = useState(1);
  const [aiCount,     setAiCount]     = useState(1);
  const [humanNames,  setHumanNames]  = useState(["","","",""]);

  // ── Game state ───────────────────────────────────────────────────────────
  const [phase,            setPhase]            = useState("setup");
  const [players,          setPlayers]          = useState([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [die,              setDie]              = useState(1);
  const [rolling,          setRolling]          = useState(false);
  const [activeCard,       setActiveCard]       = useState(null);
  const [log,              setLog]              = useState([]);
  const [turn,             setTurn]             = useState(1);
  const [outcome,          setOutcome]          = useState(null);

  // ── Refs (prevent stale-closure bugs in callbacks/timeouts) ──────────────
  const playersRef          = useRef([]);
  const currentPlayerIdxRef = useRef(0);
  const gameEndedRef        = useRef(false);
  const rollingRef          = useRef(false);
  const logRef              = useRef(null);

  useEffect(() => { playersRef.current          = players;          }, [players]);
  useEffect(() => { currentPlayerIdxRef.current = currentPlayerIdx; }, [currentPlayerIdx]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // ── AI: auto-roll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "play") return;
    const cp = players[currentPlayerIdx];
    if (!cp || !cp.isAI || rolling || activeCard || cp.eliminated || cp.won || gameEndedRef.current) return;
    const t = setTimeout(doRoll, 1600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIdx, phase, rolling, activeCard, players]);

  // ── AI: auto-dismiss card ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeCard || phase !== "play") return;
    const cp = playersRef.current[currentPlayerIdxRef.current];
    if (!cp?.isAI) return;
    const t = setTimeout(dismissCard, 2200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard, phase]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function addLog(msg) {
    setLog(prev => [...prev, { text: msg, id: Date.now() + Math.random() }]);
  }

  function drawCard(type) {
    const deck = CARDS[type] || CARDS.council;
    return deck[Math.floor(Math.random() * deck.length)];
  }

  // Find next active player index after fromIdx, searching through pList
  function getNextIdx(fromIdx, pList) {
    const n = pList.length;
    for (let i = 1; i <= n; i++) {
      const idx = (fromIdx + i) % n;
      if (!pList[idx].eliminated && !pList[idx].won) return idx;
    }
    return -1;
  }

  function advanceTurn(fromIdx, pList) {
    const nextIdx = getNextIdx(fromIdx, pList);
    if (nextIdx === -1) {
      if (!gameEndedRef.current) {
        gameEndedRef.current = true;
        setOutcome({ type: "all_eliminated" });
        setPhase("over");
      }
      return;
    }
    setCurrentPlayerIdx(nextIdx);
    setTurn(t => t + 1);
  }

  function dismissCard() {
    setActiveCard(null);
    if (!gameEndedRef.current) {
      advanceTurn(currentPlayerIdxRef.current, playersRef.current);
    }
  }


  // ── Roll + Move logic ─────────────────────────────────────────────────────

  function doRoll() {
    if (rollingRef.current || activeCard) return;
    const playerIdx = currentPlayerIdxRef.current;
    const cp = playersRef.current[playerIdx];
    if (!cp || cp.eliminated || cp.won) return;

    // Skip-turn case: announce and pass without rolling
    if (cp.skipTurn) {
      addLog(`\u23ed\ufe0f ${cp.name} is confined — no movement this turn.`);
      const updated = playersRef.current.map((p, i) =>
        i === playerIdx ? { ...p, skipTurn: false } : p
      );
      setPlayers(updated);
      advanceTurn(playerIdx, updated);
      return;
    }

    rollingRef.current = true;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDie(Math.ceil(Math.random() * 6));
      ticks++;
      if (ticks > 8) {
        clearInterval(interval);
        const finalRoll = Math.ceil(Math.random() * 6);
        setDie(finalRoll);
        setRolling(false);
        rollingRef.current = false;
        applyMove(finalRoll, playerIdx);
      }
    }, 80);
  }

  function applyMove(roll, playerIdx) {
    const pList = playersRef.current;
    const cp    = pList[playerIdx];

    const newPos = Math.min(cp.position + roll, SPACES.length - 1);
    const space  = SPACES[newPos];
    addLog(`\ud83c\udfb2 ${cp.name} rolled ${roll} \u2192 ${space.icon} ${space.name}`);

    // Win condition: reached final space
    if (space.type === "win") {
      const updated = pList.map((p, i) =>
        i === playerIdx ? { ...p, position: newPos, won: true } : p
      );
      setPlayers(updated);
      gameEndedRef.current = true;
      setOutcome({ type: "win", winner: { ...cp, position: newPos } });
      setPhase("over");
      return;
    }

    const card = drawCard(space.type);
    addLog(`\ud83d\udcdc ${card.title}: ${card.effect}`);

    let ucp = {
      ...cp,
      position: newPos,
      prestige:  Math.max(0, cp.prestige  + (card.ps || 0)),
      stability: Math.max(0, cp.stability + (card.st || 0)),
      ducats:    Math.max(0, cp.ducats    + (card.dc || 0)),
    };
    if (card.skip) ucp.skipTurn = true;

    // Check elimination
    if (ucp.prestige  <= 0) { ucp.eliminated = true; ucp.eliminationReason = "deposed"; }
    else if (ucp.stability <= 0) { ucp.eliminated = true; ucp.eliminationReason = "exiled"; }
    else if (ucp.ducats    <= 0) { ucp.eliminated = true; ucp.eliminationReason = "bankrupt"; }

    const updated = pList.map((p, i) => i === playerIdx ? ucp : p);
    setPlayers(updated);
    setActiveCard(card);

    if (ucp.eliminated) {
      addLog(`\ud83d\udc80 ${ucp.name} has fallen — ${ucp.eliminationReason}!`);
      const remaining = updated.filter(p => !p.eliminated && !p.won);
      if (remaining.length <= 1 && !gameEndedRef.current) {
        gameEndedRef.current = true;
        setOutcome(
          remaining.length === 1
            ? { type: "last_standing", winner: remaining[0] }
            : { type: "all_eliminated" }
        );
        setPhase("over");
      }
    }
  }

  // ── Start / Reset ─────────────────────────────────────────────────────────

  function startGame() {
    for (let i = 0; i < humanCount; i++) {
      if (!humanNames[i]?.trim()) return;
    }
    const newPlayers = [];
    for (let i = 0; i < humanCount; i++) {
      newPlayers.push(makePlayer(newPlayers.length, humanNames[i].trim(), false));
    }
    for (let i = 0; i < aiCount; i++) {
      newPlayers.push(makePlayer(newPlayers.length, `Doge ${AI_NAMES[i % AI_NAMES.length]}`, true));
    }
    setPlayers(newPlayers);
    setCurrentPlayerIdx(0);
    setPhase("play");
    setTurn(1);
    setLog([`\ud83c\udfd9\ufe0f ${newPlayers.length} Doges vie for the throne of Venice.`]);
    gameEndedRef.current = false;
    rollingRef.current   = false;
  }

  function resetGame() {
    setPlayers([]);
    setCurrentPlayerIdx(0);
    setPhase("setup");
    setSetupStep(0);
    setHumanCount(1);
    setAiCount(1);
    setHumanNames(["","","",""]);
    setLog([]);
    setTurn(1);
    setDie(1);
    setOutcome(null);
    setActiveCard(null);
    gameEndedRef.current = false;
    rollingRef.current   = false;
  }

  // ── Setup helpers ─────────────────────────────────────────────────────────

  function pickHuman(n) {
    setHumanCount(n);
    if (n + aiCount > 4) setAiCount(4 - n);
  }

  function pickAI(n) {
    if (humanCount + n > 4) return;
    setAiCount(n);
  }

  const namesValid = Array.from({ length: humanCount }, (_, i) => humanNames[i]?.trim()).every(Boolean);


  // ── Derived values ────────────────────────────────────────────────────────

  const currentPlayer = players[currentPlayerIdx];
  const currentSpace  = currentPlayer ? SPACES[currentPlayer.position] : SPACES[0];
  const spaceColor    = TYPE_COLORS[currentSpace?.type] || TYPE_COLORS.council;

  // ── CSS ───────────────────────────────────────────────────────────────────

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap');
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { transform: translateY(30px); opacity:0 } to { transform: translateY(0); opacity:1 } }
    @keyframes glow    { 0%,100%{box-shadow:0 0 20px #c8a84b44} 50%{box-shadow:0 0 40px #c8a84b88} }
    @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #1a0e05; }
    ::-webkit-scrollbar-thumb { background: #c8a84b44; border-radius: 2px; }
  `;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #2a1800 0%, #0d0700 60%)",
        fontFamily: "'IM Fell English', serif",
        color: "#e8d4a0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
      }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "#c8a84b88", fontFamily: "Cinzel, serif" }}>THE REPUBLIC OF VENICE PRESENTS</div>
          <h1 style={{
            fontFamily: "Cinzel Decorative, serif",
            fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
            color: "#f0d060",
            letterSpacing: "0.05em",
            textShadow: "0 0 30px #c8a84b88, 0 2px 4px #0006",
            lineHeight: 1.2,
            margin: "4px 0",
          }}>Doge: Life & Legacy</h1>
          <div style={{ fontSize: "0.7rem", color: "#a07040", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>A GAME OF SURVIVAL & STATECRAFT</div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SETUP SCREEN — STEP 0: choose player counts
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "setup" && setupStep === 0 && (
          <div style={{
            background: "linear-gradient(160deg, #2a1800, #1a0e05)",
            border: "1px solid #c8a84b",
            borderRadius: 16,
            padding: "2.5rem",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 0 60px #c8a84b22",
            animation: "glow 3s ease infinite",
          }}>
            <div style={{ fontSize: "2.8rem", marginBottom: "0.75rem", animation: "float 3s ease infinite" }}>⚔️</div>
            <h2 style={{ fontFamily: "Cinzel, serif", color: "#f0d080", marginBottom: "0.4rem", fontSize: "1.15rem" }}>Assemble the Council</h2>
            <p style={{ fontSize: "0.82rem", color: "#a09060", marginBottom: "1.75rem", lineHeight: 1.7 }}>
              Choose your rivals. Human players take turns at the same device. Computer opponents play automatically.
            </p>

            {/* Human count */}
            <div style={{ marginBottom: "1.4rem" }}>
              <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", color: "#c8a84b", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>HUMAN PLAYERS</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[1,2,3,4].map(n => (
                  <button key={n} onClick={() => pickHuman(n)} style={{
                    width: 48, height: 48,
                    background: humanCount === n ? "linear-gradient(135deg,#8b6914,#c8a84b)" : "#1a0e05",
                    border: `1px solid ${humanCount === n ? "#c8a84b" : "#4a3210"}`,
                    borderRadius: 8, color: humanCount === n ? "#1a0800" : "#c8b060",
                    fontFamily: "Cinzel, serif", fontSize: "1rem", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            {/* AI count */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", color: "#c8a84b", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>COMPUTER OPPONENTS</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {[0,1,2,3].map(n => {
                  const disabled = humanCount + n > 4;
                  return (
                    <button key={n} onClick={() => pickAI(n)} disabled={disabled} style={{
                      width: 48, height: 48,
                      background: aiCount === n && !disabled ? "linear-gradient(135deg,#1a4a6b,#2a6a9b)" : "#1a0e05",
                      border: `1px solid ${aiCount === n && !disabled ? "#60b0f8" : "#4a3210"}`,
                      borderRadius: 8, color: disabled ? "#3a2810" : aiCount === n ? "#a0d8f8" : "#6a8090",
                      fontFamily: "Cinzel, serif", fontSize: "1rem", fontWeight: 700,
                      cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
                      opacity: disabled ? 0.4 : 1,
                    }}>{n}</button>
                  );
                })}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#5a4020", marginTop: 8, fontFamily: "Cinzel, serif" }}>
                {humanCount + aiCount} player{humanCount + aiCount !== 1 ? "s" : ""} total (max 4)
              </div>
            </div>

            <button onClick={() => setSetupStep(1)} style={{
              width: "100%", padding: "0.8rem",
              background: "linear-gradient(135deg,#8b6914,#c8a84b)",
              border: "none", borderRadius: 8,
              color: "#1a0800", fontFamily: "Cinzel, serif",
              fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.1em",
              cursor: "pointer", boxShadow: "0 4px 20px #c8a84b44",
            }}>NAME YOUR DOGES →</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SETUP SCREEN — STEP 1: enter names
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "setup" && setupStep === 1 && (
          <div style={{
            background: "linear-gradient(160deg, #2a1800, #1a0e05)",
            border: "1px solid #c8a84b",
            borderRadius: 16,
            padding: "2.5rem",
            maxWidth: 440,
            width: "100%",
            boxShadow: "0 0 60px #c8a84b22",
          }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>👑</div>
              <h2 style={{ fontFamily: "Cinzel, serif", color: "#f0d080", fontSize: "1.1rem" }}>Name Your Doges</h2>
            </div>

            {/* Human player name inputs */}
            {Array.from({ length: humanCount }, (_, i) => (
              <div key={i} style={{ marginBottom: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAYER_COLORS[i], flexShrink: 0, boxShadow: `0 0 6px ${PLAYER_COLORS[i]}` }} />
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "#c8a84b", letterSpacing: "0.12em", minWidth: 60 }}>PLAYER {i + 1}</div>
                  <input
                    value={humanNames[i] || ""}
                    onChange={e => {
                      const next = [...humanNames];
                      next[i] = e.target.value;
                      setHumanNames(next);
                    }}
                    onKeyDown={e => e.key === "Enter" && namesValid && startGame()}
                    placeholder={`Enter Doge name…`}
                    style={{
                      flex: 1, padding: "0.55rem 0.8rem",
                      background: "#0a0600", border: "1px solid #c8a84b44",
                      borderRadius: 6, color: "#f0e090", fontSize: "0.9rem",
                      fontFamily: "IM Fell English, serif", outline: "none",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* AI player slots (read-only) */}
            {aiCount > 0 && (
              <div style={{ borderTop: "1px solid #2a1808", marginTop: "1rem", paddingTop: "1rem" }}>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "#5a7090", letterSpacing: "0.12em", marginBottom: "0.7rem" }}>COMPUTER OPPONENTS</div>
                {Array.from({ length: aiCount }, (_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.5rem", opacity: 0.7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAYER_COLORS[humanCount + i], flexShrink: 0 }} />
                    <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "#5a8090", letterSpacing: "0.12em", minWidth: 60 }}>AI {i + 1}</div>
                    <div style={{ flex: 1, padding: "0.55rem 0.8rem", background: "#080500", border: "1px solid #2a1808", borderRadius: 6, color: "#5a7060", fontSize: "0.88rem", fontFamily: "IM Fell English, serif" }}>
                      ⚙ Doge {AI_NAMES[i % AI_NAMES.length]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* How to play rules */}
            <div style={{ background: "#0d0800", border: "1px solid #2a1808", borderRadius: 8, padding: "0.8rem", marginTop: "1rem", marginBottom: "1.2rem" }}>
              <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", color: "#c8a84b", letterSpacing: "0.1em", marginBottom: 6 }}>HOW TO PLAY</div>
              {[
                "🎲 Take turns rolling the die to advance",
                "📜 Draw a Decree Card on every space",
                "👑 First to reach space 20 wins",
                "⚠️ Prestige, Stability or Ducats at 0 — you fall",
              ].map((r, i) => (
                <div key={i} style={{ fontSize: "0.75rem", color: "#a09060", marginBottom: 3 }}>{r}</div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSetupStep(0)} style={{
                padding: "0.75rem 1.2rem",
                background: "#1a0e05", border: "1px solid #4a3210",
                borderRadius: 8, color: "#a07040",
                fontFamily: "Cinzel, serif", fontSize: "0.85rem", fontWeight: 700,
                cursor: "pointer",
              }}>← BACK</button>
              <button onClick={startGame} disabled={!namesValid} style={{
                flex: 1, padding: "0.75rem",
                background: namesValid ? "linear-gradient(135deg,#8b6914,#c8a84b)" : "#2a1a08",
                border: "none", borderRadius: 8,
                color: namesValid ? "#1a0800" : "#4a3020",
                fontFamily: "Cinzel, serif", fontSize: "0.95rem", fontWeight: 700,
                letterSpacing: "0.1em", cursor: namesValid ? "pointer" : "not-allowed",
                boxShadow: namesValid ? "0 4px 20px #c8a84b44" : "none",
                transition: "all 0.2s",
              }}>BEGIN THE REPUBLIC</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            GAME SCREEN
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "play" && currentPlayer && (
          <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: "0.9rem" }}>

            {/* Current player banner */}
            <div style={{
              background: `linear-gradient(135deg, ${currentPlayer.color}18, #1a1008)`,
              border: `2px solid ${currentPlayer.color}66`,
              borderRadius: 10,
              padding: "0.6rem 1rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: "0.58rem", letterSpacing: "0.15em", color: currentPlayer.color, fontFamily: "Cinzel, serif" }}>
                  {currentPlayer.isAI ? "⚙ COMPUTER" : `PLAYER ${currentPlayer.id + 1}`} — YOUR TURN
                </div>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.95rem", color: "#f0d080" }}>{currentPlayer.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.62rem", color: "#6a5030", fontFamily: "Cinzel, serif" }}>Turn {turn}</div>
                <div style={{ fontSize: "0.62rem", color: "#6a5030" }}>Space {currentPlayer.position}/20</div>
              </div>
            </div>

            {/* All-players stat grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(players.length, 2)}, 1fr)`,
              gap: 8,
            }}>
              {players.map((p, i) => (
                <PlayerCard key={p.id} player={p} isActive={i === currentPlayerIdx} />
              ))}
            </div>

            {/* Board track */}
            <div style={{
              background: "#1a0e05",
              border: "1px solid #4a3210",
              borderRadius: 12,
              padding: "0.65rem",
              overflowX: "auto",
            }}>
              <div style={{ display: "flex", gap: 3, minWidth: "max-content" }}>
                {SPACES.map((s, i) => {
                  const col = TYPE_COLORS[s.type];
                  const isHere = currentPlayer.position === i;
                  const playersHere = players.filter(p => p.position === i && !p.eliminated);
                  return (
                    <div key={i} style={{
                      width: isHere ? 50 : 32,
                      height: 52,
                      background: isHere ? col.bg : "#140a02",
                      border: `1px solid ${isHere ? "#f0d060" : "#3a2010"}`,
                      borderRadius: 5,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 2,
                      fontSize: isHere ? "1.25rem" : "0.82rem",
                      transition: "all 0.4s ease",
                      boxShadow: isHere ? `0 0 14px ${col.bg}88` : "none",
                      flexShrink: 0,
                      position: "relative",
                    }}>
                      {s.icon}
                      {playersHere.length > 0 && (
                        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: "100%", padding: "0 2px" }}>
                          {playersHere.map(p => (
                            <div key={p.id} style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: p.color,
                              boxShadow: `0 0 3px ${p.color}`,
                              flexShrink: 0,
                            }} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current space info */}
            <div style={{
              background: `linear-gradient(135deg, ${spaceColor.bg}22, #1a0e05)`,
              border: `1px solid ${spaceColor.bg}88`,
              borderRadius: 10,
              padding: "0.85rem 1rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 3 }}>{currentSpace.icon}</div>
              <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.88rem", color: "#f0d080", marginBottom: 3 }}>{currentSpace.name}</div>
              <div style={{ fontSize: "0.78rem", color: "#a09060", fontStyle: "italic" }}>{currentSpace.desc}</div>
            </div>

            {/* Die + action area */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.7rem",
              background: "linear-gradient(135deg,#1a0e05,#2a1a08)",
              border: "1px solid #4a3210",
              borderRadius: 12, padding: "1.1rem",
            }}>
              <Die rolling={rolling} value={die} />
              {currentPlayer.skipTurn && !currentPlayer.isAI && (
                <div style={{ fontSize: "0.72rem", color: "#ff9090", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>⛓️ CONFINED — NEXT ROLL SKIPPED</div>
              )}
              {currentPlayer.isAI ? (
                <div style={{
                  fontSize: "0.78rem", color: "#6a8090", fontFamily: "Cinzel, serif",
                  letterSpacing: "0.1em", animation: "pulse 1.2s ease infinite",
                  padding: "0.4rem 1.2rem",
                }}>
                  ⚙ {currentPlayer.name} deliberates…
                </div>
              ) : (
                <button
                  onClick={doRoll}
                  disabled={rolling || !!activeCard}
                  style={{
                    padding: "0.75rem 2.5rem",
                    background: (rolling || activeCard) ? "#3a2a10" : "linear-gradient(135deg,#8b6914,#c8a84b)",
                    border: "none", borderRadius: 10,
                    color: (rolling || activeCard) ? "#806040" : "#1a0800",
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.88rem", fontWeight: 700,
                    letterSpacing: "0.1em",
                    cursor: (rolling || activeCard) ? "not-allowed" : "pointer",
                    boxShadow: (rolling || activeCard) ? "none" : "0 4px 20px #c8a84b44",
                    transition: "all 0.2s",
                  }}
                >
                  {rolling ? "CASTING FATE…" : currentPlayer.skipTurn ? "ENDURE CONFINEMENT" : "CAST THE DIE"}
                </button>
              )}
            </div>

            {/* Game log */}
            <div ref={logRef} style={{
              background: "#0d0700",
              border: "1px solid #2a1a08",
              borderRadius: 10, padding: "0.7rem",
              maxHeight: 130, overflowY: "auto",
            }}>
              {log.length === 0 && <div style={{ fontSize: "0.72rem", color: "#4a3210", textAlign: "center" }}>The chronicles await…</div>}
              {log.map(entry => (
                <div key={entry.id} style={{ fontSize: "0.72rem", color: "#a09060", borderBottom: "1px solid #1a0e05", paddingBottom: 3, marginBottom: 3, lineHeight: 1.4 }}>
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            GAME OVER SCREEN
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === "over" && outcome && (
          <div style={{
            background: "linear-gradient(160deg,#2a1800,#0d0700)",
            border: `2px solid ${outcome.type === "all_eliminated" ? "#8b2020" : "#c8a84b"}`,
            borderRadius: 16, padding: "2.5rem",
            maxWidth: 480, width: "100%",
            textAlign: "center",
            boxShadow: `0 0 80px ${outcome.type === "all_eliminated" ? "#8b202033" : "#c8a84b33"}`,
            animation: "slideUp 0.5s ease",
          }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "0.9rem", animation: "float 2s ease infinite" }}>
              {outcome.type === "win"           ? "👑"
               : outcome.type === "last_standing" ? "🏆"
               :                                    "💀"}
            </div>
            <h2 style={{
              fontFamily: "Cinzel Decorative, serif",
              fontSize: "1.35rem",
              color: outcome.type === "all_eliminated" ? "#ff8080" : "#f0d060",
              marginBottom: "0.6rem",
            }}>
              {outcome.type === "win"            ? "Venice Eternal!"
               : outcome.type === "last_standing" ? "Last Doge Standing"
               :                                    "The Republic Falls"}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#a09060", lineHeight: 1.8, marginBottom: "1.2rem", fontStyle: "italic" }}>
              {outcome.type === "win"
                ? `${outcome.winner.name} guided Venice to glory after ${turn} turns. History remembers.`
                : outcome.type === "last_standing"
                ? `${outcome.winner.name} outlasted all rivals. Venice is theirs by default.`
                : "Every Doge has fallen. The Republic drowns in chaos."}
            </p>

            {/* All players final results */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(players.length, 2)}, 1fr)`,
              gap: 8, marginBottom: "1.4rem",
            }}>
              {players.map(p => {
                const isWinner = outcome.winner?.id === p.id;
                return (
                  <div key={p.id} style={{
                    background: isWinner ? `${p.color}18` : "#0d0800",
                    border: `1px solid ${isWinner ? p.color + "88" : "#2a1808"}`,
                    borderRadius: 8, padding: "0.7rem",
                    textAlign: "left",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", color: isWinner ? "#f0d080" : "#c8b060" }}>
                        {isWinner ? "🏆 " : ""}{p.isAI ? "⚙ " : ""}{p.name}
                      </div>
                    </div>
                    {p.won || (!p.eliminated) ? (
                      <div style={{ display: "flex", gap: 8, fontSize: "0.65rem" }}>
                        <span style={{ color: "#f0c030" }}>👑{p.prestige}</span>
                        <span style={{ color: "#50d090" }}>⚖️{p.stability}</span>
                        <span style={{ color: "#f0d050" }}>💰{p.ducats}</span>
                        <span style={{ color: "#8a7050" }}>📍{p.position}/20</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.65rem", color: "#ff6060", fontStyle: "italic" }}>
                        {p.eliminationReason === "deposed"  ? "⚔️ Deposed"
                         : p.eliminationReason === "exiled"  ? "🕌 Exiled"
                         :                                     "💸 Bankrupt"}
                        {" "}at space {p.position}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={resetGame} style={{
              padding: "0.8rem 2rem", width: "100%",
              background: "linear-gradient(135deg,#6b2020,#a83030)",
              border: "none", borderRadius: 10,
              color: "#f0d0c0", fontFamily: "Cinzel, serif",
              fontSize: "0.88rem", fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer",
              boxShadow: "0 4px 20px #8b202044",
            }}>SEEK NEW ELECTION</button>
          </div>
        )}

        {/* Card modal */}
        <CardReveal card={activeCard} onDismiss={dismissCard} />

        <div style={{ marginTop: "1.5rem", fontSize: "0.62rem", color: "#4a3210", textAlign: "center", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>
          SERENISSIMA REPUBBLICA DI VENEZIA · EST. 697
        </div>
      </div>
    </>
  );
}
