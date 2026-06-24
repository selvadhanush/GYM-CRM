import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Server-backed FitPrime session store.
 *
 * Unlike the previous local-only timer, the countdown is derived from a
 * server-provided `sessionEndsAt` timestamp (so the server clock + the gym's
 * configured duration are the source of truth, not the device). The active
 * session's end time is persisted in SecureStore so a timer survives an app
 * kill/restart and the user can't dodge an active session by closing the app.
 */

const ACTIVE_KEY = 'fitprime_session_ends';
const COOLDOWN_KEY = 'fitprime_cooldown_ends';
const REMAINING_KEY = 'fitprime_sessions_remaining';

interface SessionState {
  active: boolean;
  sessionEndsAt: number | null; // epoch ms
  cooldownEndsAt: number | null; // epoch ms
  sessionsRemaining: number;
  // Hydrate from SecureStore on app launch.
  hydrate: () => Promise<void>;
  // Apply a fresh status payload from GET /sessions/status.
  applyStatus: (s: { active: boolean; sessionEndsAt: string | null; cooldownEndsAt: string | null; sessionsRemaining: number }) => Promise<void>;
  // Apply the result of a successful POST /sessions/check-in.
  applyCheckIn: (r: { sessionEndsAt: string; cooldownEndsAt: string; sessionsRemaining: number }) => Promise<void>;
  clear: () => Promise<void>;
  getRemainingSeconds: () => number;
}

const toMs = (v: string | null) => (v ? new Date(v).getTime() : null);

export const useSessionStore = create<SessionState>((set, get) => ({
  active: false,
  sessionEndsAt: null,
  cooldownEndsAt: null,
  sessionsRemaining: 0,

  hydrate: async () => {
    try {
      const ends = await SecureStore.getItemAsync(ACTIVE_KEY);
      const cd = await SecureStore.getItemAsync(COOLDOWN_KEY);
      const rem = await SecureStore.getItemAsync(REMAINING_KEY);
      const endsMs = ends ? Number(ends) : null;
      const cdMs = cd ? Number(cd) : null;
      const now = Date.now();
      set({
        sessionEndsAt: endsMs,
        // If the persisted session already ended while the app was closed, it's
        // not "active" anymore (the server will reconcile on the next status fetch).
        active: !!endsMs && endsMs > now,
        cooldownEndsAt: cdMs && cdMs > now ? cdMs : null,
        sessionsRemaining: rem ? Number(rem) : 0,
      });
    } catch {
      /* non-fatal */
    }
  },

  applyStatus: async (s) => {
    const endsMs = toMs(s.sessionEndsAt);
    const cdMs = toMs(s.cooldownEndsAt);
    if (endsMs) await SecureStore.setItemAsync(ACTIVE_KEY, String(endsMs));
    else await SecureStore.deleteItemAsync(ACTIVE_KEY);
    if (cdMs) await SecureStore.setItemAsync(COOLDOWN_KEY, String(cdMs));
    else await SecureStore.deleteItemAsync(COOLDOWN_KEY);
    await SecureStore.setItemAsync(REMAINING_KEY, String(s.sessionsRemaining ?? 0));
    set({
      active: !!s.active && !!endsMs && endsMs > Date.now(),
      sessionEndsAt: endsMs,
      cooldownEndsAt: cdMs && cdMs > Date.now() ? cdMs : null,
      sessionsRemaining: s.sessionsRemaining ?? 0,
    });
  },

  applyCheckIn: async (r) => {
    const endsMs = toMs(r.sessionEndsAt)!;
    const cdMs = toMs(r.cooldownEndsAt)!;
    await SecureStore.setItemAsync(ACTIVE_KEY, String(endsMs));
    await SecureStore.setItemAsync(COOLDOWN_KEY, String(cdMs));
    await SecureStore.setItemAsync(REMAINING_KEY, String(r.sessionsRemaining ?? 0));
    set({
      active: true,
      sessionEndsAt: endsMs,
      cooldownEndsAt: cdMs,
      sessionsRemaining: r.sessionsRemaining ?? 0,
    });
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(ACTIVE_KEY);
    await SecureStore.deleteItemAsync(COOLDOWN_KEY);
    set({ active: false, sessionEndsAt: null, cooldownEndsAt: null });
  },

  getRemainingSeconds: () => {
    const { sessionEndsAt } = get();
    if (!sessionEndsAt) return 0;
    return Math.max(0, Math.floor((sessionEndsAt - Date.now()) / 1000));
  },
}));
