import type { GameStatus, ScoreUpdate } from "../types";

type GameEventMap = {
  "score:changed": ScoreUpdate;
  "game:drag-active": boolean;
  "game:simulation-over": undefined;
  "ui:set-status": GameStatus;
  "ui:pause": undefined;
  "ui:resume": undefined;
  "ui:game-over": undefined;
  "ui:finish-wall": undefined;
  "ui:start-new-wall": undefined;
  "ui:rotate-active": -1 | 1;
};

type Listener<Payload> = (payload: Payload) => void;

class GameEventBus {
  private listeners = new Map<keyof GameEventMap, Set<Listener<unknown>>>();

  on<K extends keyof GameEventMap>(
    eventName: K,
    listener: Listener<GameEventMap[K]>,
  ) {
    const listenersForEvent = this.listeners.get(eventName) ?? new Set();
    listenersForEvent.add(listener as Listener<unknown>);
    this.listeners.set(eventName, listenersForEvent);

    return () => this.off(eventName, listener);
  }

  off<K extends keyof GameEventMap>(
    eventName: K,
    listener: Listener<GameEventMap[K]>,
  ) {
    this.listeners.get(eventName)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof GameEventMap>(
    eventName: K,
    ...payload: GameEventMap[K] extends undefined ? [] : [GameEventMap[K]]
  ) {
    const listenersForEvent = this.listeners.get(eventName);
    if (!listenersForEvent) {
      return;
    }

    listenersForEvent.forEach((listener) => listener(payload[0] as unknown));
  }
}

export const gameEvents = new GameEventBus();
