"use client";

import { useCallback, useState } from "react";
import { StoryControls } from "./StoryControls";
import { StoryPlayer } from "./StoryPlayer";
import type { HorrorStory } from "@/lib/storyGenerator";

export function HomeClient() {
  const [story, setStory] = useState<HorrorStory | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (config: {
      theme: string;
      intensity: number;
      duration: number;
      style: "found-footage" | "supernatural" | "psychological";
    }) => {
      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
        if (!response.ok) {
          throw new Error("Failed to generate horror story");
        }
        const data = await response.json();
        if (data?.story) {
          setStory(data.story as HorrorStory);
        }
      } catch (err) {
        console.error(err);
        setError("The spirits refused to answer. Please try another configuration.");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return (
    <main style={{ padding: "2rem 0 4rem" }}>
      <div className="studio-grid">
        <StoryControls onGenerate={handleGenerate} isGenerating={isGenerating} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <StoryPlayer story={story} />
          {story ? (
            <section className="panel glass">
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <h3 style={{ margin: 0 }}>Production Notes</h3>
                <span className="tag">Runtime ≈ {Math.round(story.durationSeconds)}s</span>
              </header>
              <p style={{ marginTop: "0.9rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{story.synopsis}</p>
              <ul style={{ marginTop: "1.1rem", paddingLeft: "1.25rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {story.fxNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {error ? (
            <section className="panel glass" style={{ border: "1px solid rgba(255,40,100,0.4)", color: "var(--error)" }}>
              {error}
            </section>
          ) : null}
        </div>
      </div>
      <footer>
        Crafted for viral horror storytelling — export your sequence to Vercel or your favorite editing suite.
      </footer>
    </main>
  );
}
