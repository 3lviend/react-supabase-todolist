import { Session, SupabaseClient, createClient } from '@supabase/supabase-js';

export type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type SupabaseConnectorListener = {
  initialized: () => void;
  sessionStarted: (session: Session) => void;
};

/**
 * Shared Supabase connector that handles auth-only responsibilities.
 */
export class SupabaseConnector {
  readonly client: SupabaseClient;
  readonly config: SupabaseConfig;

  protected listeners = new Set<Partial<SupabaseConnectorListener>>();

  ready: boolean;
  currentSession: Session | null;

  constructor() {
    this.config = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    };

    this.client = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
      auth: {
        persistSession: true
      }
    });
    this.currentSession = null;
    this.ready = false;
  }

  registerListener(listener: Partial<SupabaseConnectorListener>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected iterateListeners(cb: (listener: Partial<SupabaseConnectorListener>) => void) {
    this.listeners.forEach(cb);
  }

  async init() {
    if (this.ready) {
      return;
    }

    const sessionResponse = await this.client.auth.getSession();
    this.updateSession(sessionResponse.data.session);

    this.ready = true;
    this.iterateListeners((cb) => cb.initialized?.());
  }

  async login(username: string, password: string) {
    const {
      data: { session },
      error
    } = await this.client.auth.signInWithPassword({
      email: username,
      password: password
    });

    if (error) {
      throw error;
    }

    this.updateSession(session);
  }

  updateSession(session: Session | null) {
    this.currentSession = session;
    if (!session) {
      return;
    }
    this.iterateListeners((cb) => cb.sessionStarted?.(session));
  }
}
