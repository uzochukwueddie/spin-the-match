import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Team {
  name: string;
  color: string;
}

interface Outcome {
  label: string;
  type: "team1" | "team2" | "draw";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FootballPredictor() {
  const [team1, setTeam1] = useState<Team>({
    name: "Team 1",
    color: "#4AA1F3",
  });
  const [team2, setTeam2] = useState<Team>({
    name: "Team 2",
    color: "#C8102E",
  });

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Outcome | null>(null);
  const [showResult, setShowResult] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);

  // Used to compute responsive wheel size safely (no window usage in render)
  const wheelAreaRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(380); // will be updated responsively

  const disable =
    spinning ||
    team1.name.trim() === "" ||
    team1.name.trim() === "Team 1" ||
    team2.name.trim() === "" ||
    team2.name.trim() === "Team 2";

  useEffect(() => {
    const el = wheelAreaRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry?.contentRect?.width ?? 0;

      // Wheel should fit nicely inside its column with some padding.
      const target = clamp(Math.floor(w * 0.98), 320, 640);
      setWheelSize(target);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const outcomes: Outcome[] = useMemo(
    () => [
      { label: team1.name, type: "team1" },
      { label: "DRAW", type: "draw" },
      { label: team2.name, type: "team2" },
    ],
    [team1.name, team2.name]
  );

  const step = 360 / outcomes.length;

  const getColor = useCallback(
    (type: Outcome["type"]) => {
      if (type === "team1") return team1.color;
      if (type === "team2") return team2.color;
      return "#1e293b";
    },
    [team1.color, team2.color]
  );

  const gradient = useMemo(() => {
    const seg = 360 / outcomes.length;
    return `conic-gradient(from 0deg, ${outcomes
      .map((o, i) => `${getColor(o.type)} ${i * seg}deg ${(i + 1) * seg}deg`)
      .join(", ")})`;
  }, [outcomes, getColor]);

  function spin() {
    if (spinning) return;

    setSpinning(true);
    setWinner(null);
    setShowResult(false);

    // Generate a truly random final rotation
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6-8 full rotations
    const randomAngle = Math.random() * 360; // Random angle within one rotation
    const targetRotation = rotation + (fullSpins * 360) + randomAngle;

    const wheel = wheelRef.current;
    if (wheel) {
      wheel.style.transition = "transform 5s cubic-bezier(.15,.85,.25,1)";
      wheel.style.transform = `rotate(${targetRotation}deg)`;
    }

    const handleDone = () => {
      setRotation(targetRotation);
      
      // Determine winner based on final rotation
      const segments = outcomes.length;
      const segStep = 360 / segments;
      const normalizedRotation = ((targetRotation % 360) + 360) % 360;
      const winningIndex = Math.floor(((360 - normalizedRotation) % 360) / segStep) % segments;
      
      setWinner(outcomes[winningIndex]);
      setSpinning(false);
      setTimeout(() => setShowResult(true), 250);
      wheel?.removeEventListener("transitionend", handleDone);
    };

    wheel?.addEventListener("transitionend", handleDone);
  }

  function reset() {
    setWinner(null);
    setShowResult(false);
  }

  // Label radius scales with wheel size
  const labelRadius = Math.round(wheelSize * 0.38);
  const labelWidth = clamp(Math.round(wheelSize * 0.34), 105, 160);
  const labelFont = clamp(Math.round(wheelSize * 0.048), 14, 22);


  return (
    <div className="min-h-screen bg-linear-to-b from-green-900 via-green-800 to-slate-900 text-white overflow-hidden">
      {/* Stadium lights effect */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl" />
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1) Spin the match */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">
            ⚽ SPIN THE MATCH ⚽
          </h1>
          <p className="text-green-300 text-sm sm:text-base font-medium">
            WHO WILL WIN?
          </p>
        </div>

        {/* 2) VS Display */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8">
          <div className="text-center flex-1 max-w-55">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full border-4 border-white shadow-lg mb-2 flex items-center justify-center text-2xl font-black"
              style={{ backgroundColor: team1.color }}
            >
              {team1.name.charAt(0)}
            </div>
            <p className="font-bold text-xs sm:text-sm truncate px-2">
              {team1.name}
            </p>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-yellow-400 animate-pulse">
            VS
          </div>

          <div className="text-center flex-1 max-w-55">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full border-4 border-white shadow-lg mb-2 flex items-center justify-center text-2xl font-black"
              style={{ backgroundColor: team2.color }}
            >
              {team2.name.charAt(0)}
            </div>
            <p className="font-bold text-xs sm:text-sm truncate px-2">
              {team2.name}
            </p>
          </div>
        </div>

        {/* 3) SET UP MATCH (moved to top) */}
        <div className="mb-10">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <h3 className="text-center font-bold mb-4 text-yellow-400">
              ⚙️ SET UP MATCH
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={team1.color}
                  onChange={(e) => setTeam1({ ...team1, color: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/30"
                  aria-label="Team 1 color"
                />
                <input
                  type="text"
                  value={team1.name}
                  onChange={(e) => setTeam1({ ...team1, name: e.target.value })}
                  placeholder="Team 1 name"
                  className={`flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 font-bold placeholder-white/50 ${
                    team1.name.trim() === "Team 1" ? "text-gray-300" : ""
                  }`}
                />
              </div>

              {/* Team 2 */}
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={team2.color}
                  onChange={(e) => setTeam2({ ...team2, color: e.target.value })}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/30"
                  aria-label="Team 2 color"
                />
                <input
                  type="text"
                  value={team2.name}
                  onChange={(e) => setTeam2({ ...team2, name: e.target.value })}
                  placeholder="Team 2 name"
                  className={`flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 font-bold placeholder-white/50 ${
                    team2.name.trim() === "Team 2" ? "text-gray-300" : ""
                  }`}
                />
              </div>
            </div>

            <div className="pt-3 text-xs text-white/70 leading-relaxed text-center">
              Tip: Keep names short so they fit nicely on the wheel.
            </div>
          </div>
        </div>

        {/* Wheel + Button */}
        <div ref={wheelAreaRef} className="min-w-0">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {/* Pointer */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                <svg width="50" height="60" viewBox="0 0 50 60">
                  <defs>
                    <linearGradient
                      id="pointerGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#fcd34d" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="25,55 8,15 25,25 42,15"
                    fill="url(#pointerGrad)"
                    stroke="#b45309"
                    strokeWidth="2"
                  />
                  <circle
                    cx="25"
                    cy="12"
                    r="8"
                    fill="#fcd34d"
                    stroke="#b45309"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${team1.color}, ${team2.color})`,
                  transform: "scale(1.1)",
                }}
              />

              {/* Wheel Frame */}
              <div
                className="relative rounded-full p-2"
                style={{
                  width: wheelSize + 16,
                  height: wheelSize + 16,
                  background: "linear-gradient(135deg, #fcd34d, #f59e0b, #d97706)",
                  boxShadow: "0 0 40px rgba(251, 191, 36, 0.5)",
                }}
              >
                {/* Spinning Wheel */}
                <div
                  ref={wheelRef}
                  className="relative rounded-full overflow-hidden"
                  style={{
                    width: wheelSize,
                    height: wheelSize,
                    background: gradient,
                    transform: `rotate(${rotation}deg)`,
                    boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* Labels */}
                  {outcomes.map((o, i) => {
                    const angle = i * step + step / 2;
                    const isTeamName = o.type !== "draw";

                    return (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white"
                        style={{
                          fontSize: `${labelFont}px`,
                          transform: `
                            rotate(${angle}deg)
                            translateY(-${labelRadius}px)
                            rotate(-${angle}deg)
                          `,
                          width: labelWidth,
                          textAlign: "center",
                          lineHeight: "1.15",
                          transformOrigin: "center center",
                          textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                          pointerEvents: "none",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {o.type === "draw" ? "🤝" : "⚽"}
                        <br />
                        <span
                          style={{
                            display: "inline-block",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "wrap",
                            verticalAlign: "top",
                          }}
                        >
                          {o.label}
                        </span>
                        {!isTeamName && <span className="sr-only">Draw</span>}
                      </div>
                    );
                  })}

                  {/* Center */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-slate-800 to-slate-900 border-4 border-amber-400 flex items-center justify-center"
                    style={{
                      width: clamp(Math.round(wheelSize * 0.19), 64, 92),
                      height: clamp(Math.round(wheelSize * 0.19), 64, 92),
                    }}
                  >
                    <span className="text-3xl">⚽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={disable}
            className="w-full cursor-pointer py-4 rounded-xl text-lg sm:text-xl font-black transition-all disabled:opacity-70"
            style={{
              background: disable
                ? "linear-gradient(135deg, #5BC181, #5BC181)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: disable ? "none" : "0 4px 20px rgba(34, 197, 94, 0.5)",
            }}
          >
            {spinning ? "⚽ SPINNING... ⚽" : "🎯 SPIN TO PREDICT! 🎯"}
          </button>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && winner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Prediction result"
          onClick={() => setShowResult(false)} // click backdrop to close
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-900/90 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking card
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-yellow-300 text-sm font-bold mb-1">
                  🏆 PREDICTION 🏆
                </p>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  {winner.type === "draw" ? "🤝 DRAW! 🤝" : `${winner.label} WINS!`}
                </h2>
              </div>

              <button
                className="shrink-0 rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 font-black"
                onClick={() => setShowResult(false)}
                aria-label="Close result"
              >
                ✕
              </button>
            </div>

            <div
              className="mt-4 rounded-2xl border-2 border-yellow-400 p-4 text-center"
              style={{
                backgroundColor: getColor(winner.type),
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.35)",
              }}
            >
              <div className="text-sm font-bold text-yellow-200 mb-1">
                Final pick
              </div>
              <div className="text-xl font-black">
                {winner.type === "draw" ? "DRAW" : winner.label}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setShowResult(false);
                  reset();
                }}
                className="flex-1 py-3 rounded-xl text-lg font-black bg-linear-to-r from-purple-600 to-pink-600"
              >
                🔄 SPIN AGAIN
              </button>
              <button
                onClick={() => setShowResult(false)}
                className="px-4 py-3 rounded-xl font-black bg-white/10 hover:bg-white/15 border border-white/20"
              >
                Close
              </button>
            </div>

            <div className="mt-3 text-xs text-white/70 text-center">
              Tap outside the box to dismiss.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
