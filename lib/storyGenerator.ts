import crypto from "node:crypto";

export type HorrorStoryRequest = {
  theme: string;
  intensity: number;
  duration: number;
  style: "found-footage" | "supernatural" | "psychological";
};

export type HorrorScene = {
  id: string;
  heading: string;
  narration: string;
  visualCue: string;
  soundscape: string[];
  colorPalette: {
    background: string;
    accent: string;
  };
  screenDirection: string;
};

export type HorrorStory = {
  title: string;
  synopsis: string;
  hook: string;
  durationSeconds: number;
  voiceProfile: {
    pitch: number;
    rate: number;
    reverb: number;
    timbre: "cavern" | "void" | "whisper";
  };
  scenes: HorrorScene[];
  fxNotes: string[];
};

const adjectives = [
  "unnerving",
  "suffocating",
  "nightmarish",
  "ravenous",
  "sepulchral",
  "dread-soaked",
  "blood-flecked",
  "phantasmal"
];

const settings = [
  "abandoned research facility",
  "forgotten coastal town",
  "snow-choked highway",
  "submerged cathedral",
  "derelict amusement pier",
  "blacked-out commuter train",
  "ritual-filled farmhouse",
  "deserted luxury tower"
];

const entities = [
  "echoing mimic",
  "bone orchard wraith",
  "cicada choir",
  "hollow-eyed pilgrim",
  "perpetual hunger",
  "static child",
  "velocity leech",
  "spiral-faced saint"
];

const sensoryDetails = [
  "metallic tang of rusted air vents",
  "pulsing emergency strobes",
  "floorboards that inhale and exhale",
  "distant chanting that reverses on itself",
  "static voices stitched through loudspeakers",
  "frozen breath curling into sigils",
  "shadows pooling upward",
  "water dripping in perfect metronome cadence"
];

const visualMotifs = [
  "grainy VHS flicker",
  "fractured mirror reflections",
  "spiraling floodlights",
  "floating dust embers",
  "failing holographic billboards",
  "ink-black silhouettes",
  "crimson tracers",
  "hands pressing against the inside of the screen"
];

const soundLayers = [
  "subsonic drone",
  "reverse heartbeat",
  "wet dragging limbs",
  "metal cables thrumming",
  "distant child laughter cracking",
  "glass harmonica shrieks",
  "industrial fans slowing",
  "flooded hallway reverb"
];

const screenDirections = [
  "Slow-zoom toward a lone doorway as steam curls upward",
  "Wide shot rotates 15° while silhouettes stretch across walls",
  "Handheld pan across flickering monitors with static interference",
  "Top-down angle reveals sigils traced in condensation",
  "Over-the-shoulder shot of a figure dissolving into smoke",
  "Rapid dolly-in synced with heartbeat stutter",
  "Orbiting drone view of blood-red tide encroaching",
  "Push-in as lights extinguish sequentially"
];

const endings = [
  "When the sun finally rose, the town was already hollow.",
  "They never found the footage—only the teeth marks on the camera frame.",
  "The emergency broadcast still runs, begging the watchers not to respond.",
  "Every mirror in the city fogged over, whispering the protagonist's new name.",
  "Something knocks from inside the viewers' screens, asking to be let out.",
  "The static child now hums lullabies through the protagonist's lungs.",
  "The ritual continues every night: view, remember, surrender.",
  "The camera keeps recording, but no one is holding it anymore."
];

const styles: Record<HorrorStoryRequest["style"], { tone: string; cadence: number }> = {
  "found-footage": { tone: "raw & panicked", cadence: 0.96 },
  supernatural: { tone: "ominous & ritualistic", cadence: 0.85 },
  psychological: { tone: "whispered doubts", cadence: 0.78 }
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const pick = <T,>(items: T[], seed: number) => items[seed % items.length];

const shuffle = <T,>(items: T[], seed: number): T[] => {
  const result = [...items];
  let s = seed;
  for (let i = result.length - 1; i > 0; i -= 1) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function craftHorrorStory(request: HorrorStoryRequest): HorrorStory {
  const { theme, intensity, duration, style } = request;
  const normalizedDuration = clamp(duration, 45, 180);
  const sceneCount = clamp(Math.round(normalizedDuration / 20), 3, 7);
  const randomSeed = crypto.createHash("sha256").update(`${theme}-${Date.now()}`).digest().readUInt32BE(0);
  const tonePackage = styles[style];

  const shuffledAdjectives = shuffle(adjectives, randomSeed);
  const shuffledSettings = shuffle(settings, randomSeed * 13 + 31);
  const shuffledEntities = shuffle(entities, randomSeed * 7 + 17);
  const shuffledDetails = shuffle(sensoryDetails, randomSeed * 19 + 11);
  const shuffledMotifs = shuffle(visualMotifs, randomSeed * 5 + 53);
  const shuffledSounds = shuffle(soundLayers, randomSeed * 3 + 71);
  const shuffledDirections = shuffle(screenDirections, randomSeed * 23 + 97);

  const protagonist = `${pick(["investigative streamer", "nightshift paramedic", "urban explorer", "sleep-deprived archivist", "runaway medium", "retro-tech curator"], randomSeed)}`;

  const title = `${pick(["Night Pulse", "Signal in the Veil", "Room Below Channel 7", "Archive of Teeth", "The Swaying Hour", "Hollowcast"], randomSeed)}: ${pick(shuffledAdjectives, randomSeed)} ${pick(["Transmission", "Requiem", "Broadcast", "Litany", "Episode", "Confession"], randomSeed * 13)}`;

  const hook = `A ${protagonist} chases a ${pick(shuffledAdjectives, randomSeed * 2)} mystery in a ${pick(shuffledSettings, randomSeed * 3)} until the ${pick(shuffledEntities, randomSeed * 5)} notices the viewers.`;

  const synopsis = `Summoned by whispers of "${theme.toUpperCase()}" ${style.replace("-", " ")} lore, the ${protagonist} breaches a ${pick(shuffledAdjectives, randomSeed * 7)} ${pick(shuffledSettings, randomSeed * 11)}. Each frame reveals ${pick(shuffledDetails, randomSeed * 13)} while a ${pick(shuffledEntities, randomSeed * 17)} stitches itself into the signal.`;

  const scenes: HorrorScene[] = Array.from({ length: sceneCount }).map((_, index) => {
    const intensityScalar = clamp(intensity + index / sceneCount, 1, 5);
    const motif = pick(shuffledMotifs, randomSeed + index * 3);
    const entity = pick(shuffledEntities, randomSeed + index * 7);
    const detail = pick(shuffledDetails, randomSeed + index * 11);
    const direction = pick(shuffledDirections, randomSeed + index * 13);
    const soundscape = [
      pick(shuffledSounds, randomSeed + index * 17),
      pick(shuffledSounds, randomSeed + index * 19 + 5),
      intensityScalar > 3 ? pick(shuffledSounds, randomSeed + index * 23 + 7) : pick(shuffledMotifs, randomSeed + index * 29 + 9)
    ];

    return {
      id: `scene-${index + 1}`,
      heading: `${motif.charAt(0).toUpperCase() + motif.slice(1)}`,
      narration: `The ${protagonist} keeps the camera steady as ${detail}. ${direction}. The ${entity} bleeds through the edges of the frame, translating ${theme} into a threat only those watching can answer.`,
      visualCue: motif,
      soundscape,
      colorPalette: {
        background: index % 2 === 0 ? "#050508" : "#140714",
        accent: intensityScalar > 3 ? "#ff3f8e" : "#6a63ff"
      },
      screenDirection: direction
    };
  });

  const voiceProfile = {
    pitch: 0.62 - intensity * 0.06,
    rate: tonePackage.cadence - intensity * 0.03,
    reverb: clamp(0.45 + intensity * 0.08, 0.4, 0.95),
    timbre: pick(["cavern", "void", "whisper"], randomSeed * 31) as "cavern" | "void" | "whisper"
  };

  return {
    title,
    synopsis,
    hook,
    durationSeconds: normalizedDuration,
    voiceProfile,
    scenes,
    fxNotes: [
      `Layer ${pick(shuffledSounds, randomSeed * 37)} beneath narration for dread floor`,
      `Pulse ${pick(shuffledMotifs, randomSeed * 41)} between cuts to prime viewer anticipation`,
      `Accent jump-scares with ${pick(shuffledSounds, randomSeed * 43)} filtered through cavernous reverb`,
      endings[randomSeed % endings.length]
    ]
  };
}
