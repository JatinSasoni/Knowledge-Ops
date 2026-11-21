import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Citation } from "../../types";
import * as chatApi from "./api";
import { createTypewriter } from "./typewriter";

export const chatKeys = {
  conversations: (workspaceId: string) => ["workspace", workspaceId, "conversations"],
  messages: (workspaceId: string, conversationId: string) => [
    "workspace",
    workspaceId,
    "conversations",
    conversationId,
  ],
};

export function useConversations(workspaceId: string) {
  return useQuery({
    queryKey: chatKeys.conversations(workspaceId),
    queryFn: () => chatApi.getConversations(workspaceId),
  });
}

export function useMessages(workspaceId: string, conversationId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(workspaceId, conversationId ?? ""),
    queryFn: () => chatApi.getMessages(workspaceId, conversationId!),
    enabled: Boolean(conversationId), // a new chat has nothing to load yet
    // Messages only change when we ask a question, and we reload them ourselves then.
    // (A background refetch in the middle of an answer would show the question twice.)
    staleTime: Infinity,
  });
}

// The question being answered right now. It lives only in this component's state
// until the answer is finished; then the saved messages are loaded from the server.
export type PendingTurn = {
  question: string;
  answer: string;
  citations: Citation[];
  steps: string[]; // what the model did so far, e.g. ["Listing documents", "Searching for \"Redis\""]
};

/*
 * Asking a question
 * -----------------
 * 1. Show the question right away, with an empty answer.
 * 2. Stream: tool steps and citations arrive first, then the answer grows token by token.
 * 3. When it ends (finished or stopped), reload the saved messages from the
 *    server and drop the pending turn, so the screen shows exactly what was stored.
 * 4. If this was a new chat, tell the page its id so it can move to its URL.
 *
 * It's a mutation so that a 401 "session over" is handled like everywhere else
 * (queryClient's onError signs the user out).
 */
export function useAsk(
  workspaceId: string,
  conversationId: string | undefined,
  onCreated: (conversationId: string) => void,
) {
  const queryClient = useQueryClient();
  const [turn, setTurn] = useState<PendingTurn | null>(null);
  const stopController = useRef<AbortController | null>(null);
  const leftPage = useRef(false);

  // Leaving the chat (or opening another conversation) stops the answer.
  // The server notices and saves the part that was already written.
  useEffect(() => {
    leftPage.current = false;
    return () => {
      leftPage.current = true;
      stopController.current?.abort();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const stop = new AbortController();
      stopController.current = stop;
      setTurn({ question, answer: "", citations: [], steps: [] });

      // Tokens go to the typewriter, which puts them on screen at a reading pace.
      const typewriter = createTypewriter((answer) =>
        setTurn((current) => current && { ...current, answer }),
      );
      stop.signal.addEventListener("abort", typewriter.cancel);

      let id = conversationId;
      let failure: unknown = null;
      try {
        await chatApi.streamChat(
          workspaceId,
          { question, conversationId },
          {
            onConversation: (conversation) => {
              id = conversation.id;
            },
            onStatus: (label) => {
              setTurn((current) => current && { ...current, steps: [...current.steps, label] });
            },
            onCitations: (citations) => {
              setTurn((current) => current && { ...current, citations });
            },
            onToken: typewriter.add,
          },
          stop.signal,
        );
      } catch (error) {
        // Pressing Stop is not an error.
        if (!stop.signal.aborted) failure = error;
      }

      // Let the typewriter finish showing what arrived. Stop stays clickable until then
      // (it ends the typing at once; the full saved text appears on reload below).
      await typewriter.finish();
      stopController.current = null;

      if (leftPage.current) return;

      // On failure, keep the question (and any partial answer) on screen next to the
      // error message. The next successful answer reloads everything anyway.
      if (failure) throw failure;

      // The server saved the question (and the answer, or the part of it we got).
      if (id) {
        await queryClient.fetchQuery({
          queryKey: chatKeys.messages(workspaceId, id),
          queryFn: () => chatApi.getMessages(workspaceId, id!),
          staleTime: 0, // always load fresh, even if something is cached
        });
        queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(workspaceId),
          exact: true,
        });
      }
      setTurn(null);
      if (id && id !== conversationId) onCreated(id);
    },
  });

  return {
    ask: (question: string) => mutation.mutate(question),
    stop: () => stopController.current?.abort(),
    turn,
    isAnswering: mutation.isPending,
    error: mutation.error,
  };
}
