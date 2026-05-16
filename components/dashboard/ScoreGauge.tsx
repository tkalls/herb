interface ScoreGaugeProps {
  score: number;
  label: string;
  subScores?: { label: string; value: number }[];
}

export default function ScoreGauge({ score, label, subScores }: ScoreGaugeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  // emerald ≥80, amber 60–79, red <60
  const strokeColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 md:w-40 md:h-40">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-3xl font-black tabular-nums ${textColor}`}
            aria-label={`${score} out of 100`}
          >
            {score}
          </span>
          <span className="text-xs text-zinc-600 font-mono">/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">
        {label}
      </div>

      {subScores && subScores.length > 0 && (
        <div className="mt-4 w-full space-y-2">
          {subScores.map((s) => {
            const barColor =
              s.value >= 80
                ? "bg-emerald-500"
                : s.value >= 60
                ? "bg-amber-500"
                : "bg-red-500";
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">{s.label}</span>
                  <span className="text-xs font-mono text-zinc-400 tabular-nums">
                    {s.value}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className={`${barColor} h-1.5 rounded-full transition-all duration-700`}
                    style={{ width: `${s.value}%` }}
                    role="progressbar"
                    aria-valuenow={s.value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={s.label}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
