"use client";

import { useState } from "react";

type StoryControlsProps = {
  onGenerate: (config: {
    theme: string;
    intensity: number;
    duration: number;
    style: "found-footage" | "supernatural" | "psychological";
  }) => Promise<void>;
  isGenerating: boolean;
};

const styleOptions: { label: string; value: "found-footage" | "supernatural" | "psychological"; hint: string }[] = [
  { label: "Found Footage Paranoia", value: "found-footage", hint: "Shaky cam, glitchy overlays, frantic pacing" },
  { label: "Supernatural Ritual", value: "supernatural", hint: "Occult energy, sigils, cosmic dread" },
  { label: "Psychological Spiral", value: "psychological", hint: "Whispers, unreliable narration, hallucinations" }
];

export function StoryControls({ onGenerate, isGenerating }: StoryControlsProps) {
  const [theme, setTheme] = useState("cursed signal");
  const [intensity, setIntensity] = useState(3);
  const [duration, setDuration] = useState(75);
  const [style, setStyle] = useState<"found-footage" | "supernatural" | "psychological">("supernatural");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError(null);
      await onGenerate({ theme, intensity, duration, style });
    } catch (err) {
      console.error(err);
      setError("Unable to craft story. Try again.");
    }
  };

  return (
    <form className="panel glass fade-in" onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <header>
          <div className="tag" style={{ marginBottom: "0.6rem" }}>
            <span aria-hidden>🩸</span>
            Horror Assembly Suite
          </div>
          <h1 style={{ fontSize: "1.9rem", margin: 0 }}>
            <span className="gradient-text">NightPulse Studio</span>
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Forge ultra-engaging horror shorts with deep synthetic narration, ritual soundbeds, and scene-by-scene visual
            direction—optimized for TikTok, Reels, and YouTube Shorts.
          </p>
        </header>

        <label className="control-label" htmlFor="theme">
          Signal Theme
          <span className="tag">Hook</span>
        </label>
        <input
          id="theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          className="control-field"
          placeholder="e.g. forgotten radio tower"
          maxLength={80}
        />
        <p className="control-hint">Drives the core mystery & repeated motifs.</p>

        <label className="control-label" htmlFor="intensity">
          Intensity Level
          <span>{intensity}</span>
        </label>
        <input
          id="intensity"
          type="range"
          min={1}
          max={5}
          step={1}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
        />
        <p className="control-hint">Higher intensity ramps jumps, pacing, and distortion.</p>

        <label className="control-label" htmlFor="duration">
          Target Duration (seconds)
          <span>{duration}</span>
        </label>
        <input
          id="duration"
          type="range"
          min={45}
          max={180}
          step={15}
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
        <p className="control-hint">Auto-calculates scenes and pacing for short-form loops.</p>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="control-label" style={{ marginBottom: "0.9rem" }}>
            Horror Modality
          </legend>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {styleOptions.map((option) => (
              <label
                key={option.value}
                className={`panel neon-border`}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                  cursor: "pointer",
                  background: style === option.value ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: style === option.value ? "1px solid rgba(255, 63, 142, 0.45)" : "1px solid rgba(255,255,255,0.04)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600 }}>{option.label}</div>
                  <input
                    type="radio"
                    name="style"
                    value={option.value}
                    checked={style === option.value}
                    onChange={() => setStyle(option.value)}
                    style={{ width: "1rem", height: "1rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="primary-button" type="submit" disabled={isGenerating}>
          {isGenerating ? "Summoning story..." : "Generate Horror Short"}
        </button>

        {error ? (
          <div className="details-panel" style={{ borderColor: "rgba(255,40,100,0.45)", color: "var(--error)" }}>
            {error}
          </div>
        ) : null}

        <details className="details-panel">
          <summary style={{ fontWeight: 600 }}>Export Tips</summary>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <li>Record the voiceover with Web Speech capture or pipe into your DAW.</li>
            <li>Layer recommended FX for instant tension-building atmospheres.</li>
            <li>Use the screen direction prompts to source or animate visuals.</li>
          </ul>
        </details>
      </div>
    </form>
  );
}
