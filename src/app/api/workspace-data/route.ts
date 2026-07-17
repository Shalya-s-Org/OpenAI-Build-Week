import { db } from "@/lib/db";

export async function GET() {
  try {
    const [members, actions, decisions, blockers] = await Promise.all([
      db.workspaceMember.findMany(),
      db.actionItem.findMany(),
      db.decision.findMany(),
      db.blocker.findMany(),
    ]);

    return Response.json({
      members,
      actions,
      decisions,
      blockers,
    });
  } catch (error) {
    console.error("Failed to fetch workspace data:", error);
    return Response.json({ error: "Failed to fetch workspace data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid body." }, { status: 400 });
    
    const { type, id, updates } = body as { type?: unknown; id?: unknown; updates?: unknown };
    if (typeof type !== "string" || typeof id !== "string" || !updates || typeof updates !== "object") {
      return Response.json({ error: "Invalid parameters." }, { status: 400 });
    }

    if (type === "action") {
      const castUpdates = updates as Record<string, any>;
      const prismaUpdates: Record<string, any> = {};

      if (castUpdates.title !== undefined) prismaUpdates.title = castUpdates.title;
      if (castUpdates.dueDate !== undefined) prismaUpdates.dueDate = castUpdates.dueDate;
      if (castUpdates.status !== undefined) prismaUpdates.status = castUpdates.status;
      
      // Handle resolving owner ID
      if (castUpdates.owner !== undefined) {
        if (castUpdates.owner === null || castUpdates.owner === "") {
          prismaUpdates.ownerId = null;
        } else {
          const member = await db.workspaceMember.findFirst({
            where: { name: { equals: castUpdates.owner } },
          });
          prismaUpdates.ownerId = member?.id || null;
        }
      } else if (castUpdates.ownerId !== undefined) {
        prismaUpdates.ownerId = castUpdates.ownerId;
      }

      await db.actionItem.update({
        where: { id },
        data: prismaUpdates,
      });
    } else if (type === "decision") {
      const castUpdates = updates as Record<string, any>;
      await db.decision.update({
        where: { id },
        data: {
          statement: castUpdates.statement,
        },
      });
    } else if (type === "blocker") {
      const castUpdates = updates as Record<string, any>;
      const prismaUpdates: Record<string, any> = {};

      if (castUpdates.description !== undefined) prismaUpdates.description = castUpdates.description;
      
      if (castUpdates.owner !== undefined) {
        if (castUpdates.owner === null || castUpdates.owner === "") {
          prismaUpdates.ownerId = null;
        } else {
          const member = await db.workspaceMember.findFirst({
            where: { name: { equals: castUpdates.owner } },
          });
          prismaUpdates.ownerId = member?.id || null;
        }
      } else if (castUpdates.ownerId !== undefined) {
        prismaUpdates.ownerId = castUpdates.ownerId;
      }

      if (castUpdates.actionId !== undefined) {
        if (castUpdates.actionId === null || castUpdates.actionId === "") {
          prismaUpdates.actionItemId = null;
        } else {
          const validAction = await db.actionItem.findUnique({
            where: { id: castUpdates.actionId },
          });
          prismaUpdates.actionItemId = validAction ? castUpdates.actionId : null;
        }
      } else if (castUpdates.actionItemId !== undefined) {
        prismaUpdates.actionItemId = castUpdates.actionItemId;
      }

      await db.blocker.update({
        where: { id },
        data: prismaUpdates,
      });
    } else {
      return Response.json({ error: "Unsupported mutation type." }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Mutation failed:", error);
    return Response.json({ error: "Failed to update record." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
