"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ART_STYLES, DEFAULT_ART_STYLE } from "@/lib/artStyles";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";

const HAIR = ["#4A3220", "#1a1a1a", "#C9962F", "#A8442A"];
const SKIN = ["#F2D2B0", "#C68A5E", "#9C6B3F", "#6E4525"];
const OUTFIT = ["#7E4FA8", "#E0654E", "#3A8AA6", "#6E9A6B", "#E8A33D"];
const VALUES = ["Bravery", "Kindness", "Curiosity", "Friendship", "Never giving up", "Believing in yourself"];
const WORLDS = [
  { em: "🌊", label: "Under the sea" },
  { em: "🚀", label: "Outer space" },
  { em: "🌲", label: "Magic forest" },
  { em: "🏰", label: "Faraway castle" },
  { em: "🦕", label: "Dino world" },
  { em: "🏙️", label: "Big city" },
];
const TONES = ["Magical", "Funny & silly", "Cozy & gentle", "Big adventure"];
const TOTAL = 8;
const LOAD_MSGS = [
  "Imagining the world…",
  "Writing page by page…",
  "Adding a touch of magic…",
  "Painting the cover…",
  "Almost ready…",
];

export default function CreateWizard() {
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState(LOAD_MSGS[0]);
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [hair, setHair] = useState(HAIR[0]);
  const [skin, setSkin] = useState(SKIN[1]);
  const [outfit, setOutfit] = useState(OUTFIT[0]);
  const [loves, setLoves] = useState("");
  const [value, setValue] = useState(VALUES[0]);
  const [world, setWorld] = useState(WORLDS[0].label);
  const [tone, setTone] = useState(TONES[0]);
  const [artStyle, setArtStyle] = useState(DEFAULT_ART_STYLE.key);
  const [storyDescription, setStoryDescription] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [dedication, setDedication] = useState("");

  const heroName = name.trim() || "your child";

  function next() {
    setErr("");
    if (step === 0 && !name.trim()) {
      setErr("Please enter your child's name.");
      return;
    }
    if (step === 2 && !loves.trim()) {
      setErr("Tell us one thing they love — it makes the story special.");
      return;
    }
    if (step < TOTAL - 1) {
      setStep(step + 1);
      return;
    }
    makeBook();
  }

  async function makeBook() {
    setLoading(true);
    let k = 0;
    const t = setInterval(() => {
      k++;
      setLoadMsg(LOAD_MSGS[k % LOAD_MSGS.length]);
    }, 2600);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: Number(age),
          hairColor: hair,
          skinTone: skin,
          outfitColor: outfit,
          loves: loves.trim(),
          value,
          world,
          tone,
          artStyle,
          storyDescription: storyDescription.trim(),
          language,
          dedication: dedication.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "generation failed");
      router.push(`/book/${data.bookId}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setErr("Something went wrong creating the book. Please try again.");
    } finally {
      clearInterval(t);
    }
  }

  if (loading) {
    return (
      <div className="loading fade-in">
        <div className="spinner"></div>
        <h2>Writing {heroName}&apos;s story…</h2>
        <p>{loadMsg}</p>
      </div>
    );
  }

  return (
    <div className="center-wrap fade-in">
      <div className="card">
        <div className="wiz-top">
          <span className="wiz-step-label">
            Step {step + 1} of {TOTAL}
          </span>
          <div className="progress">
            {Array.from({ length: TOTAL }).map((_, k) => (
              <div key={k} className={`seg ${k < step ? "done" : k === step ? "now" : ""}`}></div>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="fade-in">
            <h2 className="wiz-q">Who is this book for?</h2>
            <p className="wiz-sub">Let&apos;s start with your little hero.</p>
            <div className="row">
              <div className="field">
                <label>Child&apos;s name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya" />
              </div>
              <div className="field">
                <label>Age</label>
                <select value={age} onChange={(e) => setAge(e.target.value)}>
                  {["2", "3", "4", "5", "6", "7", "8"].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Book language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native}
                    {l.label !== l.native ? ` (${l.label})` : ""}
                  </option>
                ))}
              </select>
              <p style={{ color: "var(--ink-soft)", fontSize: ".82rem", marginTop: 6 }}>
                The whole story is written in this language.
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h2 className="wiz-q">What does {heroName} look like?</h2>
            <p className="wiz-sub">So we can draw them as the star of every page.</p>
            <div className="row">
              <div className="field">
                <label>Hair color</label>
                <div className="swatches">
                  {HAIR.map((c) => (
                    <div key={c} className={`sw ${hair === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setHair(c)} />
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Skin tone</label>
                <div className="swatches">
                  {SKIN.map((c) => (
                    <div key={c} className={`sw ${skin === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setSkin(c)} />
                  ))}
                </div>
              </div>
            </div>
            <div className="field">
              <label>Favorite color (their outfit)</label>
              <div className="swatches">
                {OUTFIT.map((c) => (
                  <div key={c} className={`sw ${outfit === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setOutfit(c)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 className="wiz-q">What does {heroName} love most?</h2>
            <p className="wiz-sub">We&apos;ll weave it right into the story.</p>
            <div className="field">
              <input
                value={loves}
                onChange={(e) => setLoves(e.target.value)}
                placeholder="e.g. dinosaurs, the ocean, drawing, their dog Biscuit"
              />
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>
              A favorite animal, hobby, toy, or person — anything that makes them light up.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 className="wiz-q">What should the story celebrate?</h2>
            <p className="wiz-sub">The little lesson woven gently through the adventure.</p>
            <div className="chips">
              {VALUES.map((v) => (
                <div key={v} className={`chip ${value === v ? "sel" : ""}`} onClick={() => setValue(v)}>
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <h2 className="wiz-q">Where does the adventure happen?</h2>
            <p className="wiz-sub">Pick a world, then the mood.</p>
            <div className="opt-grid" style={{ marginBottom: 24 }}>
              {WORLDS.map((w) => (
                <div key={w.label} className={`opt-tile ${world === w.label ? "sel" : ""}`} onClick={() => setWorld(w.label)}>
                  <span className="em">{w.em}</span>
                  {w.label}
                </div>
              ))}
            </div>
            <div className="field">
              <label>Story mood</label>
              <div className="chips">
                {TONES.map((t) => (
                  <div key={t} className={`chip ${tone === t ? "sel" : ""}`} onClick={() => setTone(t)}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="fade-in">
            <h2 className="wiz-q">Pick an art style</h2>
            <p className="wiz-sub">Every page of {heroName}&apos;s book will be illustrated in this style.</p>
            <div className="opt-grid">
              {ART_STYLES.map((s) => (
                <div
                  key={s.key}
                  className={`opt-tile ${artStyle === s.key ? "sel" : ""}`}
                  onClick={() => setArtStyle(s.key)}
                >
                  <span className="em">{s.emoji}</span>
                  {s.label}
                  <span style={{ display: "block", fontSize: ".78rem", color: "var(--ink-soft)", fontWeight: 400, marginTop: 2 }}>
                    {s.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="fade-in">
            <h2 className="wiz-q">Describe the story</h2>
            <p className="wiz-sub">Share any plot idea, special character, place, or moment you want included.</p>
            <div className="field">
              <textarea
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                placeholder="e.g. Maya finds a tiny moon key and helps a shy dragon get home before bedtime."
              />
            </div>
            <p style={{ color: "var(--ink-soft)", fontSize: ".88rem" }}>
              Optional — leave this blank if you want us to surprise you.
            </p>
          </div>
        )}

        {step === 7 && (
          <div className="fade-in">
            <h2 className="wiz-q">Add a personal touch</h2>
            <p className="wiz-sub">A dedication printed on the first page (optional), then review.</p>
            <div className="field">
              <textarea
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                placeholder="To Maya — never stop exploring. Love, Mom & Dad"
              />
            </div>
            <div className="review-list">
              <div>
                <b>Hero</b>
                <span>
                  {name.trim() || "Your child"}, age {age}
                </span>
              </div>
              <div>
                <b>Loves</b>
                <span>{loves.trim() || "—"}</span>
              </div>
              <div>
                <b>Celebrates</b>
                <span>{value}</span>
              </div>
              <div>
                <b>World</b>
                <span>{world}</span>
              </div>
              <div>
                <b>Mood</b>
                <span>{tone}</span>
              </div>
              <div>
                <b>Story idea</b>
                <span>{storyDescription.trim() || "Surprise me"}</span>
              </div>
              <div>
                <b>Art style</b>
                <span>{ART_STYLES.find((s) => s.key === artStyle)?.label}</span>
              </div>
              <div>
                <b>Language</b>
                <span>{LANGUAGES.find((l) => l.code === language)?.native}</span>
              </div>
            </div>
          </div>
        )}

        <div className="wiz-nav">
          <button
            className="btn btn-ghost"
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            ← Back
          </button>
          <button className="btn btn-primary" onClick={next}>
            {step === TOTAL - 1 ? "✦ Create the book" : "Next →"}
          </button>
        </div>
        <div className="err">{err}</div>
      </div>
    </div>
  );
}
