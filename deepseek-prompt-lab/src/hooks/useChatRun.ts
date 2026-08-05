import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatApiError, runChat, type ChatRunSnapshot } from '../api/client';
import type { ConnectionSettings } from '../storage/localStore';

export type ChatRunStatus = 'idle' | 'sending' | 'streaming' | 'success' | 'error' | 'cancelled';

export interface ChatRunState extends ChatRunSnapshot {
  runId: number;
  status: ChatRunStatus;
  durationMs: number;
  httpStatus?: number;
  requestId?: string;
  error?: string;
  errorBody?: string;
}

const emptySnapshot: ChatRunSnapshot = { text: '', rawFrames: [], toolCalls: [], parserErrors: [] };

export function useChatRun() {
  const [state, setState] = useState<ChatRunState>({ runId: 0, status: 'idle', durationMs: 0, ...emptySnapshot });
  const controllerRef = useRef<AbortController | null>(null);
  const startedAtRef = useRef(0);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (state.status !== 'sending' && state.status !== 'streaming') return;
    const timer = window.setInterval(() => {
      setState((current) => ({ ...current, durationMs: Math.max(current.durationMs, Date.now() - startedAtRef.current) }));
    }, 100);
    return () => window.clearInterval(timer);
  }, [state.status]);

  const send = useCallback(async (connection: ConnectionSettings, payload: Record<string, unknown>) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const runId = ++runIdRef.current;
    startedAtRef.current = Date.now();
    setState({ runId, status: 'sending', durationMs: 0, ...emptySnapshot });

    try {
      const result = await runChat(
        connection,
        payload,
        (snapshot) => setState((current) => current.runId === runId
          ? { ...current, ...snapshot, status: 'streaming', durationMs: Date.now() - startedAtRef.current }
          : current),
        controller.signal,
      );
      setState((current) => current.runId === runId ? {
        ...current,
        ...result,
        status: 'success',
        durationMs: Date.now() - startedAtRef.current,
      } : current);
    } catch (error) {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        setState((current) => current.runId === runId ? {
          ...current,
          status: 'cancelled',
          durationMs: Date.now() - startedAtRef.current,
        } : current);
      } else {
        const apiError = error instanceof ChatApiError ? error : undefined;
        setState((current) => current.runId === runId ? {
          ...current,
          status: 'error',
          durationMs: Date.now() - startedAtRef.current,
          error: error instanceof Error ? error.message : '请求失败。',
          errorBody: apiError?.body,
          httpStatus: apiError?.status,
          requestId: apiError?.requestId,
        } : current);
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return { state, send, cancel };
}
