"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HorrorStory } from "@/lib/storyGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { SceneCanvas } from "./SceneCanvas";

type StoryPlayerProps = {
  story: HorrorStory | null;
};

const browserSpeechVoices = () => {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return [];
  return window.speechSynthesis.getVoices();
};

const pickVoice = () => {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return undefined;
  const voices = browserSpeechVoices();
  if (!voices.length) return undefined;
  const deepCandidates = voices.filter((voice) => /male|bass|baritone|fred|alex|dan|arthur|dark/i.test(voice.name));
  return (deepCandidates[0] ?? voices[0]) || undefined;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function StoryPlayer({ story }: StoryPlayerProps) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceReady, setVoiceReady] = useState(false);

  const sceneTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const sceneStartTimeRef = useRef<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const ambienceNodesRef = useRef<{ master: GainNode; rumble: OscillatorNode; noise?: AudioBufferSourceNode } | null>(null);

  const sceneDuration = useMemo(() => {
    if (!story || story.scenes.length === 0) return 0;
    return Math.max(6, story.durationSeconds / story.scenes.length);
  }, [story]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
    const handleVoicesChanged = () => {
      setVoiceReady(true);
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    setVoiceReady(true);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
    window.speechSynthesis.cancel();
  }, []);

  const speakScene = useCallback(
    (sceneIndex: number) => {
      if (!story || typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
      const scene = story.scenes[sceneIndex];
      if (!scene) return;
      const utterance = new SpeechSynthesisUtterance(`${story.hook}. ${scene.narration}`);
      const voice = pickVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = clamp(story.voiceProfile.pitch, 0.1, 2);
      utterance.rate = clamp(story.voiceProfile.rate, 0.5, 1.2);
      utterance.volume = 1;
      utterance.onend = () => {
        if (!isPlaying) return;
        setTimeout(() => setProgress((prev) => (prev > 0.98 ? 0 : prev)), 0);
      };
      stopSpeech();
      window.speechSynthesis.speak(utterance);
    },
    [isPlaying, stopSpeech, story]
  );

  const haltAmbience = useCallback(async () => {
    const context = audioContextRef.current;
    const nodes = ambienceNodesRef.current;
    if (!context || !nodes) return;
    try {
      const now = context.currentTime;
      nodes.master.gain.cancelScheduledValues(now);
      nodes.master.gain.setTargetAtTime(0.0001, now, 0.6);
      setTimeout(() => {
        nodes.rumble.stop();
        nodes.noise?.stop();
        context.close();
        audioContextRef.current = null;
        ambienceNodesRef.current = null;
      }, 900);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const triggerAmbience = useCallback(() => {
    if (!story || typeof window === "undefined" || audioContextRef.current) return;

    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.001;
    master.connect(context.destination);

    const rumble = context.createOscillator();
    rumble.type = "sawtooth";
    rumble.frequency.value = 32 + story.voiceProfile.reverb * 12;

    const rumbleGain = context.createGain();
    rumbleGain.gain.value = 0.32;
    rumble.connect(rumbleGain);
    rumbleGain.connect(master);

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 14;
    lfo.connect(lfoGain);
    lfoGain.connect(rumble.frequency);

    const createNoiseBuffer = () => {
      const bufferSize = context.sampleRate * 4;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      return buffer;
    };

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = createNoiseBuffer();
    noiseSource.loop = true;

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 650;
    noiseFilter.Q.value = 3.2;

    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.12 * story.voiceProfile.reverb;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    rumble.start();
    lfo.start();
    noiseSource.start();

    const now = context.currentTime;
    master.gain.setTargetAtTime(0.22, now, 0.9);

    audioContextRef.current = context;
    ambienceNodesRef.current = { master, rumble, noise: noiseSource };
  }, [story]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    if (sceneTimerRef.current) {
      clearTimeout(sceneTimerRef.current);
      sceneTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopSpeech();
    haltAmbience();
  }, [haltAmbience, stopSpeech]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  useEffect(() => {
    if (!story) {
      stopPlayback();
      setActiveSceneIndex(0);
      return;
    }
    setActiveSceneIndex(0);
    setProgress(0);
  }, [story, stopPlayback]);

  const tickProgress = useCallback(() => {
    if (!isPlaying) return;
    const now = performance.now();
    const elapsed = (now - sceneStartTimeRef.current) / 1000;
    const ratio = clamp(elapsed / sceneDuration, 0, 1);
    setProgress(ratio);
    rafRef.current = requestAnimationFrame(tickProgress);
  }, [isPlaying, sceneDuration]);

  const scheduleNextScene = useCallback(() => {
    if (!story) return;
    if (sceneTimerRef.current) {
      clearTimeout(sceneTimerRef.current);
    }
    sceneTimerRef.current = window.setTimeout(() => {
      setActiveSceneIndex((prev) => {
        const next = prev + 1;
        if (next >= story.scenes.length) {
          stopPlayback();
          return prev;
        }
        speakScene(next);
        sceneStartTimeRef.current = performance.now();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tickProgress);
        scheduleNextScene();
        return next;
      });
    }, sceneDuration * 1000);
  }, [sceneDuration, speakScene, stopPlayback, story, tickProgress]);

  const startPlayback = useCallback(() => {
    if (!story) return;
    triggerAmbience();
    setIsPlaying(true);
    setActiveSceneIndex(0);
    setProgress(0);
    sceneStartTimeRef.current = performance.now();
    speakScene(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tickProgress);
    scheduleNextScene();
  }, [scheduleNextScene, speakScene, story, tickProgress, triggerAmbience]);

  const handlePlayPause = () => {
    if (!story) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleSceneJump = (targetIndex: number) => {
    if (!story) return;
    const boundedIndex = clamp(targetIndex, 0, story.scenes.length - 1);
    setActiveSceneIndex(boundedIndex);
    setProgress(0);
    if (isPlaying) {
      sceneStartTimeRef.current = performance.now();
      speakScene(boundedIndex);
      scheduleNextScene();
    }
  };

  useEffect(() => {
    if (!story || !isPlaying) return;
    speakScene(activeSceneIndex);
    sceneStartTimeRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tickProgress);
    scheduleNextScene();
  }, [activeSceneIndex, isPlaying, scheduleNextScene, speakScene, story, tickProgress]);

  if (!story) {
    return (
      <section className="panel glass fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.5rem" }}>Summon your first broadcast</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Configure a theme and intensity to generate a fully voiced horror short. Your scenes will appear here with animated
            atmospherics, narration, and FX cues.
          </p>
        </div>
      </section>
    );
  }

  const activeScene = story.scenes[activeSceneIndex];

  return (
    <section className="panel story-card fade-in" style={{ position: "relative", minHeight: "520px" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <SceneCanvas
          accent={activeScene.colorPalette.accent}
          background={activeScene.colorPalette.background}
          beat={activeSceneIndex}
        />
      </div>
      <span className="scene-pulse" aria-hidden />
      <div style={{ position: "absolute", top: "1.6rem", left: "1.6rem", right: "1.6rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div className="status-pill ready">{isPlaying ? "Broadcasting" : "Primed"}</div>
        <div className="status-pill" style={{ opacity: voiceReady ? 1 : 0.6 }}>
          {voiceReady ? "Deep Voice Linked" : "Loading Voices"}
        </div>
      </div>
      <div className="scene-info">
        <div className="tag" style={{ marginBottom: "0.7rem" }}>
          {story.title}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h3 className="scene-heading">{activeScene.heading}</h3>
            <p className="scene-text">{activeScene.narration}</p>
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
              <span className="tag">Visual: {activeScene.visualCue}</span>
              <span className="tag">FX: {activeScene.soundscape.join(" · ")}</span>
              <span className="tag">Camera: {activeScene.screenDirection}</span>
            </div>
          </motion.div>
        </AnimatePresence>
        <div style={{ marginTop: "1.6rem", display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <button type="button" className="primary-button" onClick={handlePlayPause}>
            {isPlaying ? "Pause Ritual" : "Play Narration"}
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {story.scenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleSceneJump(index)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: index === activeSceneIndex ? "rgba(255,63,142,0.35)" : "rgba(255,255,255,0.06)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="timeline">
        <div className="timeline-progress" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </section>
  );
}
