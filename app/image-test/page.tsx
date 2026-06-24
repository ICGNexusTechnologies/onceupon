"use client";

import { useState } from "react";

const DEFAULT_PROMPT =
  "Premium children's picture-book illustration of a joyful five-year-old explorer in a magical forest, wearing a plum-purple jacket and yellow rain boots, discovering a tiny glowing door in an ancient tree. Hand-painted gouache, soft rounded shapes, delicate paper texture, warm cinematic sunset lighting, rich natural colors, expressive friendly character, polished editorial composition, full-bleed scene, no text.";

export default function ImageTestPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [imageUrl, setImageUrl] = useState("");
  const [model, setModel] = useState("fal-ai/nano-banana");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/image-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed.");
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-wrap fade-in">
      <div className="card">
        <h1 style={{ marginBottom: 8 }}>fal.ai image test</h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: 24 }}>
          Generate one portrait illustration using <b>{model}</b>. Each click uses fal.ai credits.
        </p>

        <div className="field">
          <label htmlFor="image-model">Model</label>
          <select id="image-model" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="fal-ai/nano-banana">nano-banana (current — fast/cheap)</option>
            <option value="fal-ai/recraft-v3">Recraft v3 (top illustration quality)</option>
            <option value="fal-ai/imagen4/preview">Imagen 4 (Google, premium)</option>
            <option value="fal-ai/flux-pro/v1.1-ultra">Flux Pro Ultra (premium)</option>
            <option value="fal-ai/flux/dev">Flux dev (cheaper premium)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="image-prompt">Image prompt</label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            style={{ minHeight: 180 }}
          />
        </div>

        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? "Generating image..." : "Generate test image"}
        </button>
        {error && <p className="err" style={{ marginTop: 18 }}>{error}</p>}

        {imageUrl && (
          <div style={{ marginTop: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Generated fal.ai test"
              style={{ display: "block", width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: 18 }}
            />
            <p style={{ textAlign: "center", marginTop: 14 }}>
              <a className="btn btn-ghost" href={imageUrl} target="_blank" rel="noreferrer">
                Open full image
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
