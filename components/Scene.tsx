"use client";

/* CSS illustration fallback (used until the real generated art exists),
   ported from once-upon-app_2.html sceneHTML() */

interface Hero {
  hairColor: string;
  skinTone: string;
  outfitColor: string;
}

export default function Scene({
  setting,
  time,
  hero,
}: {
  setting: string;
  time: string;
  hero: Hero;
}) {
  const night = time === "night";
  const bgs: Record<string, string> = {
    bedroom: night
      ? "linear-gradient(180deg,#3a2c52,#241634)"
      : "linear-gradient(180deg,#cdb4e0,#a07fc0)",
    sea: `linear-gradient(180deg,${night ? "#1C2A4A,#143A4C" : "#7FB3C4,#2E6E86"})`,
    sky: `linear-gradient(180deg,${night ? "#1C2A4A,#33476F" : "#8fc6dd,#cdeaf2"})`,
    forest: `linear-gradient(180deg,${night ? "#16321f,#0d2014" : "#bfe0b8,#6E9A6B"})`,
    space: "linear-gradient(180deg,#150E2C,#2A2150)",
    meadow: `linear-gradient(180deg,${night ? "#26324a,#1a2436" : "#bfe3f0,#cfe9b8"})`,
  };
  const key = bgs[setting] ? setting : "meadow";
  const showMoon = night || key === "space";

  return (
    <div className="scene">
      <div style={{ position: "absolute", inset: 0, background: bgs[key] }} />
      {showMoon ? (
        <>
          <div
            style={{
              position: "absolute",
              width: 60,
              height: 60,
              top: "12%",
              right: "14%",
              borderRadius: "50%",
              background: "radial-gradient(circle at 38% 35%,#fffdf2,#f3e4b8)",
              boxShadow: "0 0 38px rgba(255,247,214,.7)",
            }}
          />
          {Array.from({ length: 20 }).map((_, k) => (
            <i
              key={k}
              style={{
                position: "absolute",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 0 4px #fff",
                left: `${(k * 47) % 100}%`,
                top: `${(k * 31) % 60}%`,
                opacity: 0.4 + ((k * 13) % 60) / 100,
              }}
            />
          ))}
        </>
      ) : (
        <div
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            top: "12%",
            right: "14%",
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 38%,#fff6d6,#f6b73c)",
            boxShadow: "0 0 46px rgba(246,183,60,.6)",
          }}
        />
      )}
      {key === "sea" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "46%",
            background: "linear-gradient(180deg,#2E6E86,#143A4C)",
          }}
        />
      )}
      {key === "forest" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "30%",
            background: "#3f6b3a",
            borderRadius: "50% 50% 0 0",
          }}
        />
      )}
      {key === "meadow" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "24%",
            background: night ? "#2f4a35" : "#7bb36f",
            borderRadius: "50% 50% 0 0",
          }}
        />
      )}
      {key === "bedroom" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "26%",
            background: night ? "#4a3a63" : "#8a6fb0",
          }}
        />
      )}
      {/* hero figure */}
      <div style={{ position: "absolute", width: 46, height: 70, bottom: "14%", left: "50%", transform: "translateX(-50%)" }}>
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 35,
            height: 18,
            zIndex: 1,
          }}
        >
          <span style={{ position: "absolute", top: 0, left: 0, width: 16, height: 17, borderRadius: "50%", background: hero.hairColor }} />
          <span style={{ position: "absolute", top: 0, right: 0, width: 16, height: 17, borderRadius: "50%", background: hero.hairColor }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 27,
            height: 27,
            borderRadius: "50%",
            zIndex: 2,
            background: hero.skinTone,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 36,
            height: 48,
            borderRadius: "40% 40% 28% 28%",
            background: hero.outfitColor,
          }}
        />
      </div>
    </div>
  );
}
