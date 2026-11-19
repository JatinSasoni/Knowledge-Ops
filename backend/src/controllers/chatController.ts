import { asyncHandler } from "../util/asyncHandler.js";
import { AppError } from "../util/AppError.js";
import { prisma } from "../lib/prisma.js";
import { openai } from "../lib/openai.js";
import { searchPassages, MIN_SIMILARITY } from "../lib/retrieval.js";
import { openEventStream, sendEvent } from "../lib/sse.js";
import { env } from "../config/env.js";
import { conversationParams, type ChatInput } from "../schemas/chat.js";
import { buildPrompt, MAX_ANSWER_TOKENS, NOT_FOUND } from "../lib/chat.js";

// POST /api/v1/workspaces/:workspaceId/chat
export const chat = asyncHandler(async (req, res) => {
  const { question, conversationId } = req.body as ChatInput;
  const workspaceId = req.membership!.workspaceId;
  const userId = req.user!.id;

  // 1. Continue one of MY conversations in this workspace, or start a new one.
  const conversation = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, workspaceId, userId } })
    : await prisma.conversation.create({
        data: { workspaceId, userId, title: question.slice(0, 80) },
      });
  if (!conversation) throw AppError.notFound("Conversation not found");

  // 2. The last few messages, so follow-up questions make sense.
  const recent = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const history = recent.reverse();

  // 3. Find the passages, and drop the ones too unrelated to help.
  const passages = (await searchPassages(workspaceId, question, 5)).filter(
    (p) => p.similarity >= MIN_SIMILARITY,
  );
  const citations = passages.map((p, i) => ({
    n: i + 1,
    documentId: p.documentId,
    documentTitle: p.documentTitle,
    index: p.index,
    content: p.content,
    similarity: p.similarity,
  }));

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: question },
  });

  // 4. Start streaming. From here on the status code is already sent (200),
  //    so problems are reported as an "error" event, not as JSON.
  openEventStream(res);
  sendEvent(res, "conversation", { id: conversation.id, title: conversation.title });
  sendEvent(res, "citations", citations);

  // If the user closes the page, stop paying for an answer nobody will read.
  const stop = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) stop.abort();
  });

  let answer = "";
  try {
    if (passages.length === 0) {
      answer = NOT_FOUND; // nothing relevant: answer honestly without calling the model
      sendEvent(res, "token", { text: answer });
    } else {
      const stream = await openai.chat.completions.create(
        {
          model: env.CHAT_MODEL,
          messages: buildPrompt(question, passages, history),
          stream: true,
          max_completion_tokens: MAX_ANSWER_TOKENS,
        },
        { signal: stop.signal },
      );
      for await (const part of stream) {
        const text = part.choices[0]?.delta?.content;
        if (text) {
          answer += text;
          sendEvent(res, "token", { text });
        }
      }
    }
  } catch (error) {
    if (!stop.signal.aborted) {
      console.error("[chat] generation failed", error);
      sendEvent(res, "error", { message: "The answer couldn't be generated. Please try again." });
    }
  } finally {
    // Save whatever was produced, even a partial answer if the user left mid-way.
    if (answer) {
      await prisma.message.create({
        data: { conversationId: conversation.id, role: "ASSISTANT", content: answer, citations },
      });
    }
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    if (!res.writableEnded) {
      sendEvent(res, "done", {});
      res.end();
    }
  }
});

// GET /api/v1/workspaces/:workspaceId/conversations  (only MY conversations)
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: req.membership!.workspaceId, userId: req.user!.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });
  res.json({ conversations });
});

// GET /api/v1/workspaces/:workspaceId/conversations/:conversationId/messages
export const getMessages = asyncHandler(async (req, res) => {
  const { workspaceId, conversationId } = conversationParams.parse(req.params);
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId, userId: req.user!.id },
  });
  if (!conversation) throw AppError.notFound("Conversation not found");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  res.json({ conversation, messages });
});
