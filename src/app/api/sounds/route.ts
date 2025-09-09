import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Lists available cycle sounds from public/sounds/cycle
export async function GET() {
  try {
    const cycleDir = path.join(process.cwd(), "public", "sounds", "cycle");
    const entries = await fs.readdir(cycleDir, { withFileTypes: true });
    const sounds = entries
      .filter((e) => e.isFile() && /\.(mp3|wav|ogg)$/i.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ sounds });
  } catch (err) {
    // On error, still respond with an empty list to avoid client crashes
    return NextResponse.json({ sounds: [] }, { status: 200 });
  }
}

