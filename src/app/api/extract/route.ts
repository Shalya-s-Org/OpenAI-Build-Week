import { ExtractionInputError, extractMeeting } from "@/lib/extraction";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid request body." }, { status: 400 });
    const { title, transcript } = body as { title?: unknown; transcript?: unknown };
    if (typeof title !== "string" || typeof transcript !== "string") {
      return Response.json({ error: "Title and transcript must be text." }, { status: 400 });
    }

    const extraction = await extractMeeting(title, transcript);

    // Save to SQLite database
    await db.meeting.upsert({
      where: { id: extraction.id },
      update: {
        title: extraction.meetingTitle,
        transcript: extraction.transcript,
        summary: extraction.summary,
        occurredAt: extraction.createdAt,
      },
      create: {
        id: extraction.id,
        title: extraction.meetingTitle,
        transcript: extraction.transcript,
        summary: extraction.summary,
        occurredAt: extraction.createdAt,
      },
    });

    // Save Decisions
    for (const dec of extraction.decisions) {
      await db.decision.upsert({
        where: { id: dec.id },
        update: {
          statement: dec.statement,
          confidence: dec.confidence,
          sourceQuote: dec.sourceQuote,
          meetingId: extraction.id,
        },
        create: {
          id: dec.id,
          statement: dec.statement,
          confidence: dec.confidence,
          sourceQuote: dec.sourceQuote,
          meetingId: extraction.id,
        },
      });
    }

    // Save Actions
    for (const act of extraction.actions) {
      const member = act.owner
        ? await db.workspaceMember.findFirst({
            where: { name: { equals: act.owner } },
          })
        : null;

      await db.actionItem.upsert({
        where: { id: act.id },
        update: {
          title: act.title,
          ownerId: member?.id || null,
          dueDate: act.dueDate,
          status: act.status || "in_progress",
          confidence: act.confidence,
          sourceQuote: act.sourceQuote,
          meetingId: extraction.id,
        },
        create: {
          id: act.id,
          title: act.title,
          ownerId: member?.id || null,
          dueDate: act.dueDate,
          status: act.status || "in_progress",
          confidence: act.confidence,
          sourceQuote: act.sourceQuote,
          meetingId: extraction.id,
        },
      });
    }

    // Save Blockers
    for (const blk of extraction.blockers) {
      const member = blk.owner
        ? await db.workspaceMember.findFirst({
            where: { name: { equals: blk.owner } },
          })
        : null;

      const validAction = blk.actionId
        ? await db.actionItem.findUnique({
            where: { id: blk.actionId },
          })
        : null;

      await db.blocker.upsert({
        where: { id: blk.id },
        update: {
          description: blk.description,
          ownerId: member?.id || null,
          actionItemId: validAction ? blk.actionId : null,
          meetingId: extraction.id,
        },
        create: {
          id: blk.id,
          description: blk.description,
          ownerId: member?.id || null,
          actionItemId: validAction ? blk.actionId : null,
          meetingId: extraction.id,
        },
      });
    }

    return Response.json(extraction);
  } catch (error) {
    const message = error instanceof ExtractionInputError ? error.message : "We could not extract momentum from these notes.";
    console.error("API extract error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
export const dynamic = "force-dynamic";
