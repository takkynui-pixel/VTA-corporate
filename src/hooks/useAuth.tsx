import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  getMyAccess,
  type PortalProfile,
} from "../features/permissions/permissionsApi";

type Aal = "aal1" | "aal2" | null;

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: PortalProfile | null;
  roles: string[];
  isAdmin: boolean;
  aal: Aal;
  refreshAal: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchAal(): Promise<Aal> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return (data?.currentLevel as Aal) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [aal, setAal] = useState<Aal>(null);

  const refreshAal = useCallback(async () => {
    setAal(await fetchAal());
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setRoles([]);
        setAal(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const a = await getMyAccess(userId);
        const level = await fetchAal();
        if (cancelled) return;
        setProfile(a.profile);
        setRoles(a.roles);
        setAal(level);
      } catch {
        if (cancelled) return;
        setProfile(null);
        setRoles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      roles,
      // ใช้เพื่อ UX เท่านั้น — ความปลอดภัยจริงอยู่ที่ RLS และ Edge Function
      isAdmin: !!profile?.is_active && roles.includes("portal_admin"),
      aal,
      refreshAal,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session, profile, roles, aal, refreshAal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
