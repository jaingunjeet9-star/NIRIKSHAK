import { FormEvent, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Shield } from 'lucide-react';
import { ApiClientError } from '../lib/api';
import { activateDemo, completePasswordReset, loginAccount, registerAccount, requestPasswordReset, verifyPasswordReset } from '../lib/authApi';
import { useUserSession } from '../lib/userSession';

type AuthMode = 'login' | 'signup' | 'forgot';
type ForgotStep = 'email' | 'code' | 'password';

interface InspectorLoginProps {
  returnTo: string;
  initialMode?: AuthMode;
  onEnterConsumerMode?: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : 'Unable to connect to the authentication service.';
}

function PasswordField({ id, value, onChange, label, show, onToggle }: { id: string; value: string; onChange: (value: string) => void; label: string; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#535953] mb-2">{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className="w-full h-11 px-3.5 pr-11 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F] focus:ring-2 focus:ring-[#C7DECF]" />
        <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#7A827B] hover:bg-[#F2F0E8] hover:text-[#335E46] flex items-center justify-center cursor-pointer">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function InspectorLogin({ returnTo, initialMode = 'login', onEnterConsumerMode }: InspectorLoginProps) {
  const { completeInspectorLogin, enterDemoMode } = useUserSession();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    window.history.replaceState({}, '', nextMode === 'login' ? '/login' : nextMode === 'signup' ? '/signup' : '/forgot-password');
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Enter your User ID or email and password.');
      return;
    }
    setIsBusy(true);
    try {
      const result = await loginAccount(identifier.trim(), password, rememberMe);
      window.history.replaceState({}, '', returnTo || '/');
      completeInspectorLogin(result.user);
    } catch (loginError) {
      setError(errorMessage(loginError));
      setIsBusy(false);
    }
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !userId.trim() || !password || !confirmPassword) {
      setError('Complete all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsBusy(true);
    try {
      const result = await registerAccount({ fullName, email, userId, password, confirmPassword, designation, department });
      window.history.replaceState({}, '', returnTo || '/');
      completeInspectorLogin(result.user);
    } catch (signupError) {
      setError(errorMessage(signupError));
      setIsBusy(false);
    }
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsBusy(true);
    try {
      if (forgotStep === 'email') {
        const result = await requestPasswordReset(email);
        setRequestId(result.requestId);
        setDevelopmentCode(result.developmentCode || '');
        setForgotStep('code');
        setSuccess(result.message);
      } else if (forgotStep === 'code') {
        await verifyPasswordReset(requestId, code);
        setForgotStep('password');
        setSuccess('Verification code accepted. Create a new password.');
      } else {
        const result = await completePasswordReset(requestId, code, password, confirmPassword);
        setSuccess(result.message);
        setForgotStep('email');
        setPassword('');
        setConfirmPassword('');
        setCode('');
      }
    } catch (forgotError) {
      setError(errorMessage(forgotError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDemo() {
    setError('');
    setIsBusy(true);
    try {
      const result = await activateDemo();
      window.history.replaceState({}, '', returnTo || '/');
      enterDemoMode(result.user);
    } catch (demoError) {
      setError(errorMessage(demoError));
      setIsBusy(false);
    }
  }

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#2D322E] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#52796F] text-white flex items-center justify-center shadow-xs"><Shield className="w-5 h-5" /></div>
          <div><div className="text-[22px] font-bold tracking-tight leading-none">NIRIKSHAK</div><div className="text-[10px] font-semibold uppercase tracking-wider text-[#7A827B] mt-1">Statutory Verification &amp; Compliance Platform</div></div>
        </div>
        <div className="bg-white border border-[#E7E3DC] rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#52796F]">Inspector Mode</p><h1 className="text-2xl font-semibold mt-2">{isSignup ? 'Create your account' : isForgot ? 'Reset your password' : 'Sign in to your workspace'}</h1><p className="text-sm text-[#7A827B] mt-2">{isSignup ? 'Register for secure inspector access.' : isForgot ? 'Recover access to your NIRIKSHAK account.' : 'Secure access for authorized inspectors'}</p></div>

          {isLogin && <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div><label htmlFor="identifier" className="block text-xs font-semibold text-[#535953] mb-2">User ID / Email</label><input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F] focus:ring-2 focus:ring-[#C7DECF]" /></div>
            <PasswordField id="login-password" label="Password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
            <div className="flex items-center justify-between gap-3 text-xs"><label className="flex items-center gap-2 text-[#535953] cursor-pointer"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="w-4 h-4 accent-[#52796F]" />Remember me</label><button type="button" onClick={() => switchMode('forgot')} className="font-semibold text-[#335E46] hover:underline cursor-pointer">Forgot Password?</button></div>
            <button type="submit" disabled={isBusy} className="w-full h-11 rounded-xl bg-[#52796F] hover:bg-[#456B62] disabled:opacity-70 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">{isBusy && <LoaderCircle className="w-4 h-4 animate-spin" />}{isBusy ? 'Authenticating...' : 'Login'}</button>
            <div className="text-center text-xs text-[#9A9E9B]">or</div>
            <button type="button" disabled={isBusy} onClick={() => void handleDemo()} className="w-full h-11 rounded-xl border border-[#C7DECF] bg-[#EBF3EE] text-[#335E46] text-sm font-semibold hover:bg-[#E3EBE5] cursor-pointer">Try Demo</button>
            <button type="button" disabled={isBusy} onClick={onEnterConsumerMode} className="w-full h-11 rounded-xl border border-[#DFDBD3] bg-white text-[#52796F] text-sm font-semibold hover:bg-[#FAF8F5] cursor-pointer flex items-center justify-center gap-2 transition-colors">Sign In as Consumer</button>
            <p className="text-center text-xs text-[#7A827B]">New inspector? <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-[#335E46] hover:underline cursor-pointer">Create Account</button></p>
          </form>}

          {isSignup && <form onSubmit={handleSignup} noValidate className="space-y-4"><div><label htmlFor="full-name" className="block text-xs font-semibold text-[#535953] mb-2">Full Name</label><input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /></div><div><label htmlFor="signup-email" className="block text-xs font-semibold text-[#535953] mb-2">Email Address</label><input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /></div><div><label htmlFor="signup-user-id" className="block text-xs font-semibold text-[#535953] mb-2">Inspector / User ID</label><input id="signup-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /></div><PasswordField id="signup-password" label="Password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /><PasswordField id="confirm-password" label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><input aria-label="Organization / Department" placeholder="Organization / Department" value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /><input aria-label="Designation" placeholder="Designation" value={designation} onChange={(event) => setDesignation(event.target.value)} className="h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /></div><button type="submit" disabled={isBusy} className="w-full h-11 rounded-xl bg-[#52796F] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">{isBusy && <LoaderCircle className="w-4 h-4 animate-spin" />}{isBusy ? 'Creating account...' : 'Create Account'}</button><p className="text-center text-xs text-[#7A827B]">Already registered? <button type="button" onClick={() => switchMode('login')} className="font-semibold text-[#335E46] hover:underline cursor-pointer">Login</button></p></form>}

          {isForgot && <form onSubmit={handleForgot} className="space-y-5"><p className="text-xs text-[#7A827B]">{forgotStep === 'email' ? 'Enter your registered email address.' : forgotStep === 'code' ? 'Enter the verification code sent to your email.' : 'Create a new password for your account.'}</p>{forgotStep === 'email' && <div><label htmlFor="reset-email" className="block text-xs font-semibold text-[#535953] mb-2">Registered Email Address</label><input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm outline-none focus:border-[#52796F]" /></div>}{forgotStep === 'code' && <div><label htmlFor="reset-code" className="block text-xs font-semibold text-[#535953] mb-2">Verification Code</label><input id="reset-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-[#DFDBD3] bg-[#FAF8F5] text-sm font-mono tracking-widest outline-none focus:border-[#52796F]" />{developmentCode && <p className="text-xs text-[#8C5E2D] mt-2">Development code: {developmentCode}</p>}</div>}{forgotStep === 'password' && <><PasswordField id="reset-password" label="New Password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((visible) => !visible)} /><PasswordField id="reset-confirm-password" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} /></>}<button type="submit" disabled={isBusy} className="w-full h-11 rounded-xl bg-[#52796F] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70">{isBusy && <LoaderCircle className="w-4 h-4 animate-spin" />}{forgotStep === 'email' ? 'Send Verification Code' : forgotStep === 'code' ? 'Verify Code' : 'Reset Password'}</button><p className="text-center text-xs"><button type="button" onClick={() => switchMode('login')} className="font-semibold text-[#335E46] hover:underline cursor-pointer">Back to Login</button></p></form>}

          {error && <p role="alert" className="mt-5 text-xs font-medium text-[#9E432A] bg-[#FAECE7] border border-[#F7D0C4] rounded-xl px-3 py-2.5">{error}</p>}
          {success && <p role="status" className="mt-5 text-xs font-medium text-[#335E46] bg-[#EBF3EE] border border-[#C7DECF] rounded-xl px-3 py-2.5">{success}</p>}
        </div>
      </section>
    </main>
  );
}
