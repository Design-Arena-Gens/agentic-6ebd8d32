import { NextResponse } from "next/server";
import { craftHorrorStory } from "@/lib/storyGenerator";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { theme = "forbidden signal", intensity = 3, duration = 75, style = "supernatural" } = payload ?? {};

    const story = craftHorrorStory({
      theme: String(theme).slice(0, 80) || "forbidden signal",
      intensity: Number.isFinite(intensity) ? Math.max(1, Math.min(5, Number(intensity))) : 3,
      duration: Number.isFinite(duration) ? Number(duration) : 75,
      style: ["found-footage", "supernatural", "psychological"].includes(style)
        ? style
        : "supernatural"
    });

    return NextResponse.json({
      status: "ok",
      story
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error", message: "Unable to craft horror story" }, { status: 400 });
  }
}
