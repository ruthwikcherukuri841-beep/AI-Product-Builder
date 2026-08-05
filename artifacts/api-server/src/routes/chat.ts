import { Router, type IRouter } from "express";
import { eq, and, count, max, sql } from "drizzle-orm";
import { db, chatSessionsTable, chatMessagesTable, profilesTable } from "@workspace/db";
import {
  ListChatSessionsResponse,
  CreateChatSessionResponse,
  CreateChatSessionBody,
  GetChatSessionResponse,
  DeleteChatSessionResponse,
  SendChatMessageBody,
  SendChatMessageResponse,
  GetChatStatsResponse,
} from "@workspace/api-zod";
import { generateCareerResponse } from "../lib/gemini";

const router: IRouter = Router();

// GET /chat/sessions
router.get("/chat/sessions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const sessions = await db
    .select({
      id: chatSessionsTable.id,
      userId: chatSessionsTable.userId,
      title: chatSessionsTable.title,
      createdAt: chatSessionsTable.createdAt,
      messageCount: count(chatMessagesTable.id),
    })
    .from(chatSessionsTable)
    .leftJoin(chatMessagesTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(eq(chatSessionsTable.userId, userId))
    .groupBy(chatSessionsTable.id)
    .orderBy(sql`${chatSessionsTable.createdAt} DESC`);

  const mapped = sessions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    messageCount: s.messageCount ?? 0,
  }));

  res.json(ListChatSessionsResponse.parse(mapped));
});

// POST /chat/sessions
router.post("/chat/sessions", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const parsed = CreateChatSessionBody.safeParse(req.body);
  const title = parsed.success && parsed.data.title ? parsed.data.title : "New Chat";

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ userId, title })
    .returning();

  res.status(201).json(CreateChatSessionResponse.parse({
    ...session,
    createdAt: session.createdAt.toISOString(),
  }));
});

// GET /chat/sessions/:sessionId
router.get("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  const result = {
    ...session,
    createdAt: session.createdAt.toISOString(),
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  res.json(GetChatSessionResponse.parse(result));
});

// DELETE /chat/sessions/:sessionId
router.delete("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.sessionId, sessionId));
  await db.delete(chatSessionsTable).where(eq(chatSessionsTable.id, sessionId));

  res.json(DeleteChatSessionResponse.parse({ success: true }));
});

// POST /chat/sessions/:sessionId/messages
router.post("/chat/sessions/:sessionId/messages", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { content } = parsed.data;

  // Fetch user profile for context
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  // Fetch existing messages for history
  const existingMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  // Save user message
  const [userMessage] = await db
    .insert(chatMessagesTable)
    .values({ sessionId, role: "user", content })
    .returning();

  // Auto-generate session title from first user message
  if (existingMessages.length === 0) {
    const titleText = content.slice(0, 60) + (content.length > 60 ? "..." : "");
    await db
      .update(chatSessionsTable)
      .set({ title: titleText })
      .where(eq(chatSessionsTable.id, sessionId));
  }

  // Build Gemini history (exclude the current message we just saved)
  const history = existingMessages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  // Generate AI response
  const aiText = await generateCareerResponse(
    content,
    history,
    profile?.resume,
    profile?.jobDescription
  );

  // Save assistant message
  const [assistantMessage] = await db
    .insert(chatMessagesTable)
    .values({ sessionId, role: "assistant", content: aiText })
    .returning();

  res.json(
    SendChatMessageResponse.parse({
      userMessage: { ...userMessage, createdAt: userMessage.createdAt.toISOString() },
      assistantMessage: { ...assistantMessage, createdAt: assistantMessage.createdAt.toISOString() },
    })
  );
});

// GET /chat/stats
router.get("/chat/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  const [sessionStats] = await db
    .select({
      totalSessions: count(chatSessionsTable.id),
      latestSessionAt: max(chatSessionsTable.createdAt),
    })
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId));

  const [messageStats] = await db
    .select({ totalMessages: count(chatMessagesTable.id) })
    .from(chatMessagesTable)
    .innerJoin(chatSessionsTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(eq(chatSessionsTable.userId, userId));

  res.json(
    GetChatStatsResponse.parse({
      totalSessions: sessionStats?.totalSessions ?? 0,
      totalMessages: messageStats?.totalMessages ?? 0,
      latestSessionAt: sessionStats?.latestSessionAt?.toISOString() ?? null,
    })
  );
});

export default router;
