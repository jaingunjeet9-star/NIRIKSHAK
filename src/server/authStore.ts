import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type AuthRole = 'ADMINISTRATOR' | 'SUPERVISOR' | 'INSPECTOR' | 'REVIEWER';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  userId: string;
  passwordHash: string;
  passwordSalt: string;
  designation: string;
  department: string;
  organization: string;
  region: string;
  role: AuthRole;
  officerId?: string;
  stationNode?: string;
  isDemo: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<AuthUser, 'passwordHash' | 'passwordSalt'>;

const dataDirectory = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDirectory, 'auth-users.json');
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const resetRequests = new Map<string, { userId: string; codeHash: string; expiresAt: number; attempts: number; used: boolean }>();
const resetRateLimits = new Map<string, number>();
const DEMO_USER_ID = 'demo-inspector';

let inMemoryUsers: AuthUser[] = [];

function ensureStore(): AuthUser[] {
  try {
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, '[]', 'utf8');
    }
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8');
      inMemoryUsers = JSON.parse(data) as AuthUser[];
      return inMemoryUsers;
    }
  } catch (_e) {
    // Read-only filesystem (e.g. Vercel Serverless environment), fallback to in-memory store
  }
  return inMemoryUsers;
}

function saveUsers(users: AuthUser[]) {
  inMemoryUsers = users;
  try {
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  } catch (_e) {
    // Read-only filesystem (e.g. Vercel Serverless environment) - saved in memory
  }
}

function publicUser(user: AuthUser): PublicUser {
  const { passwordHash: _hash, passwordSalt: _salt, ...safeUser } = user;
  return safeUser;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  return { hash: crypto.scryptSync(password, salt, 64).toString('hex'), salt };
}

function passwordsMatch(password: string, user: AuthUser): boolean {
  const candidate = hashPassword(password, user.passwordSalt).hash;
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  }
  return null;
}

export function createUser(input: {
  fullName: string;
  email: string;
  userId: string;
  password: string;
  designation?: string;
  department?: string;
  organization?: string;
}): PublicUser {
  const users = ensureStore();
  const email = normalize(input.email);
  const userId = input.userId.trim();
  if (users.some((user) => normalize(user.email) === email)) throw new Error('email_exists');
  if (users.some((user) => normalize(user.userId) === normalize(userId))) throw new Error('user_id_exists');
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error('weak_password');
  const password = hashPassword(input.password);
  const now = new Date().toISOString();
  const user: AuthUser = {
    id: `usr-${crypto.randomUUID()}`,
    fullName: input.fullName.trim(),
    email,
    userId,
    passwordHash: password.hash,
    passwordSalt: password.salt,
    designation: input.designation?.trim() || 'Inspector',
    department: input.department?.trim() || 'Legal Metrology Enforcement',
    organization: input.organization?.trim() || '',
    region: 'New Delhi',
    role: 'INSPECTOR',
    isDemo: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  saveUsers(users);
  return publicUser(user);
}

export function authenticate(identifier: string, password: string): PublicUser | null {
  const user = ensureStore().find((candidate) => normalize(candidate.email) === normalize(identifier) || normalize(candidate.userId) === normalize(identifier));
  if (!user || !user.isActive || !passwordsMatch(password, user)) return null;
  return publicUser(user);
}

export function createSession(userId: string, rememberMe: boolean): { token: string; maxAge: number } {
  const token = crypto.randomBytes(32).toString('hex');
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  sessions.set(token, { userId, expiresAt: Date.now() + maxAge * 1000 });
  return { token, maxAge };
}

export function getUserForSession(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  if (session.userId === DEMO_USER_ID) return getDemoUser();
  const user = ensureStore().find((candidate) => candidate.id === session.userId);
  return user?.isActive ? publicUser(user) : null;
}

export function deleteSession(token: string | undefined) {
  if (token) sessions.delete(token);
}

export function getDemoUser(): PublicUser {
  return {
    id: DEMO_USER_ID,
    fullName: 'Rajiv Mehta',
    email: 'demo.inspector@nirikshak.demo',
    userId: 'FSI-DEMO-2047',
    designation: 'Food Safety Inspector',
    department: 'Food Safety & Standards Inspection Division',
    organization: 'NIRIKSHAK Demonstration Office',
    region: 'New Delhi',
    role: 'SUPERVISOR',
    isDemo: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

export function createDemoSession(rememberMe: boolean): { user: PublicUser; token: string; maxAge: number } {
  const { token, maxAge } = createSession(DEMO_USER_ID, rememberMe);
  return { user: getDemoUser(), token, maxAge };
}

export function startPasswordReset(email: string): { requestId: string; code: string } | null {
  const normalizedEmail = normalize(email);
  const lastRequest = resetRateLimits.get(normalizedEmail) || 0;
  if (Date.now() - lastRequest < 60 * 1000) throw new Error('reset_rate_limited');
  const user = ensureStore().find((candidate) => normalize(candidate.email) === normalizedEmail);
  if (!user) return null;
  resetRateLimits.set(normalizedEmail, Date.now());
  const requestId = crypto.randomBytes(24).toString('hex');
  const code = String(crypto.randomInt(100000, 1000000));
  resetRequests.set(requestId, { userId: user.id, codeHash: crypto.createHash('sha256').update(code).digest('hex'), expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0, used: false });
  return { requestId, code };
}

export function verifyPasswordReset(requestId: string, code: string): boolean {
  const request = resetRequests.get(requestId);
  if (!request || request.used || request.expiresAt < Date.now() || request.attempts >= 5) return false;
  request.attempts += 1;
  return crypto.timingSafeEqual(Buffer.from(request.codeHash), Buffer.from(crypto.createHash('sha256').update(code).digest('hex')));
}

export function resetPassword(requestId: string, code: string, password: string): PublicUser | null {
  if (!verifyPasswordReset(requestId, code)) return null;
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error('weak_password');
  const users = ensureStore();
  const request = resetRequests.get(requestId)!;
  const user = users.find((candidate) => candidate.id === request.userId);
  if (!user) return null;
  const passwordData = hashPassword(password);
  user.passwordHash = passwordData.hash;
  user.passwordSalt = passwordData.salt;
  user.updatedAt = new Date().toISOString();
  request.used = true;
  saveUsers(users);
  return publicUser(user);
}

