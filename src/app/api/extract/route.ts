import { ExtractionInputError, extractMeeting } from "@/lib/extraction";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid request body." }, { status: 400 });
    const { title, transcript } = body as { title?: unknown; transcript?: unknown };
    if (typeof title !== "string" || typeof transcript !== "string") return Response.json({ error: "Title and transcript must be text." }, { status: 400 });
    return Response.json(extractMeeting(title, transcript));
  } catch (error) {
    const message = error instanceof ExtractionInputError ? error.message : "We could not extract momentum from these notes.";
    return Response.json({ error: message }, { status: 400 });
  }
}
