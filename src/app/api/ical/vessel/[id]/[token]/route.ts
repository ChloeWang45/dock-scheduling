import { verifyFeedToken } from "@/lib/ical";
import { getVesselFeed, icsResponse } from "@/lib/ical-feeds";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = await params;
  if (!verifyFeedToken("vessel", id, token)) {
    return new Response("Not found", { status: 404 });
  }
  const feed = await getVesselFeed(id);
  if (!feed) return new Response("Not found", { status: 404 });
  return icsResponse(`Dock Schedule — ${feed.name}`, feed.events);
}
