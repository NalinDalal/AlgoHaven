'use client';
const verdicts = [
  { cls: "v-ac", text: "AC · tourist · 1847C · 89ms" },
  { cls: "v-wa", text: "WA #3 · kactl · 1849E" },
  { cls: "v-ac", text: "AC · ecnerwala · 1849F · 201ms" },
  { cls: "v-tle", text: "TLE · neal · 1849D · 3001ms" },
  { cls: "v-ac", text: "AC · Um_nik · 1848C · 44ms" },
  { cls: "v-mle", text: "MLE · jiangly · 1847D · 512MB" },
  { cls: "v-ac", text: "AC · Radewoosh · 1849A · 12ms" },
  { cls: "v-re", text: "RE · maroonrk · 1848E" },
];

// Duplicate for seamless infinite scroll
const allVerdicts = [...verdicts, ...verdicts];

export default function VerdictTicker() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "#0d0d0d",
        padding: "10px 0",
      }}
    >
      <div className="flex gap-10 whitespace-nowrap animate-scroll-left">
        {allVerdicts.map((v, i) => (
          <span key={i} className={`v-chip ${v.cls}`}>
            {v.text}
          </span>
        ))}
      </div>
    </div>
  );
}