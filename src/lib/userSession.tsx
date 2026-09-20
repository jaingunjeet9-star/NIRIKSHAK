/**
 * NIRIKSHAK User Session Context
 * Simulates a role-based user session. In a production deployment this would
 * be backed by real authentication (JWT, OAuth, etc.). For the demo build it
 * stores the active user in React context so every component can read the
 * current role and the API client can forward it as a request header.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getAuthSession, logoutAccount } from './authApi';

export type UserRole = 'ADMINISTRATOR' | 'SUPERVISOR' | 'INSPECTOR' | 'REVIEWER';

export interface NirikshakUser {
  id: string;
  name: string;
  officerId: string;
  role: UserRole;
  stationNode: string;
  email?: string;
  designation?: string;
  department?: string;
  organization?: string;
  region?: string;
  isDemo?: boolean;
}

// Demo users — one per role
export const DEMO_USERS: NirikshakUser[] = [
  {
    id: 'usr-001',
    name: 'Priya Mehta',
    officerId: 'DL-ADM-001',
    role: 'ADMINISTRATOR',
    stationNode: 'NIC-METROLOGY-NODE: #DELHI-HQ',
  },
  {
    id: 'usr-002',
    name: 'Devendra Sharma',
    officerId: 'DL-LM-408',
    role: 'SUPERVISOR',
    stationNode: 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
  },
  {
    id: 'usr-003',
    name: 'Ravi Nair',
    officerId: 'MH-LM-219',
    role: 'INSPECTOR',
    stationNode: 'NIC-METROLOGY-NODE: #MUMBAI-02',
  },
  {
    id: 'usr-004',
    name: 'Sunita Rao',
    officerId: 'KA-LM-031',
    role: 'REVIEWER',
    stationNode: 'NIC-METROLOGY-NODE: #BENGALURU-01',
  },
];

interface UserSessionContextValue {
  currentUser: NirikshakUser;
  setCurrentUser: (user: NirikshakUser) => void;
  canDelete: boolean;
  isInspectorAuthenticated: boolean;
  authReady: boolean;
  completeInspectorLogin: (user: AuthUser) => void;
  enterDemoMode: (user: AuthUser) => void;
  logoutInspector: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<NirikshakUser>(DEMO_USERS[1]);
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const toSessionUser = (user: AuthUser): NirikshakUser => ({
    id: user.id,
    name: user.fullName,
    officerId: user.userId,
    role: user.role,
    stationNode: user.region ? `NIRIKSHAK-NODE: #${user.region.toUpperCase().replace(/\s+/g, '-')}` : 'NIC-METROLOGY-NODE: #DELHI-WEST-04',
    email: user.email,
    designation: user.designation,
    department: user.department,
    organization: user.organization,
    region: user.region,
    isDemo: user.isDemo,
  });

  useEffect(() => {
    getAuthSession()
      .then((session) => {
        if (session.authenticated && session.user) {
          setCurrentUser(toSessionUser(session.user));
          setAuthenticated(true);
        }
      })
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
  }, []);

  const canDelete =
    currentUser.role === 'ADMINISTRATOR' || currentUser.role === 'SUPERVISOR';

  const completeInspectorLogin = (user: AuthUser) => {
    setCurrentUser(toSessionUser(user));
    setAuthenticated(true);
  };

  const enterDemoMode = (user: AuthUser) => {
    setCurrentUser(toSessionUser(user));
    setAuthenticated(true);
  };

  const handleLogout = () => {
    void logoutAccount().catch(() => undefined);
    setAuthenticated(false);
  };

  return (
    <UserSessionContext.Provider value={{ currentUser, setCurrentUser, canDelete, isInspectorAuthenticated: authenticated, authReady, completeInspectorLogin, enterDemoMode, logoutInspector: handleLogout }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession(): UserSessionContextValue {
  const ctx = useContext(UserSessionContext);
  if (!ctx) throw new Error('useUserSession must be used within UserSessionProvider');
  return ctx;
}

/** Role display helpers */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRATOR: 'Administrator',
  SUPERVISOR: 'Supervisor',
  INSPECTOR: 'Inspector',
  REVIEWER: 'Reviewer',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  ADMINISTRATOR: { bg: '#FAECE7', text: '#9E432A', border: '#F7D0C4' },
  SUPERVISOR:    { bg: '#EBF3EE', text: '#335E46', border: '#C7DECF' },
  INSPECTOR:     { bg: '#EEF3FB', text: '#2E4C8C', border: '#C4D2F0' },
  REVIEWER:      { bg: '#F6F4EE', text: '#5B4F2E', border: '#DDD9CE' },
};
