import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

type UserProfile = {
  id: string;
  tenant_id: number | null;
  school_id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'STAFF' | 'MANAGER' | 'ADMIN';
  account_status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
};

type SessionContextType = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const setData = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentSession.user.id)
          .single<UserProfile>();
        
        if (userProfile?.account_status === 'INACTIVE') {
          navigate('/inactive');
          signOut();
        } else {
          setProfile(userProfile);
        }
      }
      setLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_IN' && newSession?.user) {
        setLoading(true);
        supabase
          .from('users')
          .select('*')
          .eq('id', newSession.user.id)
          .single<UserProfile>()
          .then(({ data }) => {
            if (data?.account_status === 'INACTIVE') {
              navigate('/inactive');
              signOut();
            } else {
              setProfile(data);
            }
            setLoading(false);
          });
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        if (location.pathname !== '/inactive') {
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.account_status === 'PENDING_ACTIVATION' && location.pathname !== '/set-password') {
        navigate('/set-password');
      } else if (profile.account_status === 'ACTIVE' && (location.pathname === '/login' || location.pathname === '/set-password')) {
        if (profile.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [profile, loading, navigate, location.pathname]);

  const refetchProfile = async () => {
    if (session?.user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single<UserProfile>();
      setProfile(userProfile);
    }
  };

  const value = { session, profile, loading, signOut, refetchProfile };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};