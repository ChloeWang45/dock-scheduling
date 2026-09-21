import { verifyFeedToken } from "@/lib/ical";
import { getAllFeed, icsResponse } from "@/lib/ical-feeds";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!verifyFeedToken("all", "all", token)) {
    return new Response("Not found", { status: 404 });
  }
  const feed = await getAllFeed();
  return icsResponse(feed.name, feed.events);
}
