import {
  createContext,
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

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: PortalProfile | null;
  roles: string[];
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

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
    getMyAccess(userId)
      .then((a) => {
        if (cancelled) return;
        setProfile(a.profile);
        setRoles(a.roles);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setRoles([]);
      })
      .finally(() => !cancelled && setLoading(false));
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
      // ใช้เพื่อ UX เท่านั้น — ความปลอดภัยจริงอยู่ที่ RLS
      isAdmin: !!profile?.is_active && roles.includes("portal_admin"),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session, profile, roles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
