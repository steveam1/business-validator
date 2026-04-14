import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/logger";

export async function GET() {
  const metrics = getMetrics();
  if (!metrics) {
    return NextResponse.json({ message: "No runs yet." });
  }
  return NextResponse.json(metrics);
}
