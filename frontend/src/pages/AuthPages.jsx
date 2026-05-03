import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Vote } from 'lucide-react';
import { STATES, CHECKLIST_ITEMS } from '../data';
import { supabase } from '../supabaseClient';

// --- BRAND LOGO ---
export function BrandLogo({ size = 'lg' }) {
  const sz = size === 'lg' ? 'text-[16px]' : 'text-[13px]';
  const iconSz = size === 'lg' ? 18 : 14;
  return (
    <span className={`inline-flex items-center gap-1.5 ${sz}`} style={{ fontFamily: "'DM Serif Display',serif" }}>
      <Vote size={iconSz} className="text-[#E8690A]" />
      <span className="text-[#111] font-bold">Election</span>
      <span className="text-[#E8690A] font-bold">Sathi</span>
    </span>
  );
}

// --- LANDING ---
export function LandingPage({ navigate }) {
  return (
    <div 
      className="min-h-screen flex flex-col justify-center px-6 md:px-16"
      style={{
        backgroundImage: "linear-gradient(rgba(245, 243, 239, 0.4), rgba(245, 243, 239, 0.4)), url('/landing-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-[1400px] mx-auto w-full pt-32 pb-20">
        <h1 style={{ fontSize: 'clamp(3rem,10vw,8rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95 }} className="text-[#0D0D0D] font-sans">ELECTION<br />SATHI</h1>
        <div className="mt-16 grid md:grid-cols-2 gap-12 max-w-3xl">
          <p className="text-[15px] font-light leading-[1.8] text-[#444]">Your guide to voting in India. We break down the election process into simple, clear steps — so every citizen can participate with confidence.</p>
          <p className="text-[15px] font-light leading-[1.8] text-[#444]">Non-partisan, factual, and designed for first-time voters and seasoned citizens alike. Built on official ECI guidelines and the Representation of the People Act.</p>
        </div>
        <button onClick={() => navigate("auth")} className="mt-12 border border-[#0D0D0D] px-8 py-3 text-[13px] uppercase tracking-[0.1em] font-medium hover:bg-[#0D0D0D] hover:text-white transition-colors">Get Started <span className="ml-2">→</span></button>
      </div>
      <div className="border-t border-[#E0E0E0] max-w-[1400px] mx-auto w-full py-16">
        <p className="text-center text-[15px] font-light leading-[1.8] text-[#666] max-w-2xl mx-auto">Understand the democratic process, check your eligibility, find your polling booth, and learn how India's elections work — all in one place.</p>
      </div>
    </div>
  );
}

// Removed insecure upsertUser helper; identity now handled by Supabase Auth (JWTs).
// --- AUTH ---
export function AuthPage({ setState }) {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [regStep, setRegStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const GOOGLE_CLIENT_ID = '643017678595-khekv3rirtj85os1avi6kv5ssdiam0pa.apps.googleusercontent.com';

  // Google credential callback — shared handler
  const onGoogleCredential = async (response) => {
    setAuthLoading(true);
    try {
      // 1. Authenticate with Supabase using the Google ID token
      const { data: authData, error: authErr } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (authErr) throw authErr;

      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      // 2. Upsert profile into public.users using the secure auth.uid()
      const { data: dbUser, error: dbErr } = await supabase
        .from('users')
        .upsert(
          { id: authData.session.user.id, name: payload.name || 'Google User', email: payload.email, profile_image: payload.picture || null },
          { onConflict: 'id' }
        )
        .select()
        .single();
      
      if (dbErr) throw dbErr;
      
      const hasOnboarded = !!(dbUser.age && dbUser.state && dbUser.voter_status);
      setState(p => ({
        ...p,
        isAuthenticated: true,
        currentPage: hasOnboarded ? "dashboard" : "onboarding",
        hasCompletedOnboarding: hasOnboarded,
        user: { id: dbUser.id, name: dbUser.name, email: dbUser.email, picture: dbUser.profile_image, age: dbUser.age, state: dbUser.state, voterStatus: dbUser.voter_status }
      }));
    } catch (e) {
      console.error("Auth error details:", e);
      setError('Authentication failed: ' + (e.message || 'Unknown error'));
    }
    setGoogleLoading(false);
    setAuthLoading(false);
  };

  // Load GIS SDK and render hidden button
  useEffect(() => {
    const loadGIS = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Render a hidden Google button we can programmatically click
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard', theme: 'outline', size: 'large', width: 400, text: 'continue_with',
        });
      }
    };
    // If GIS already loaded
    if (window.google?.accounts?.id) { loadGIS(); return; }
    // Otherwise load the script
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = loadGIS;
      document.head.appendChild(s);
    } else {
      existing.addEventListener('load', loadGIS);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    if (!email || pass.length < 6) { setError('Email required, password min 6 chars'); return; }
    setAuthLoading(true);
    
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (authErr) { setError(authErr.message); setAuthLoading(false); return; }

    const { data: dbUser, error: dbErr } = await supabase.from('users').select('*').eq('id', authData.session.user.id).single();
    setAuthLoading(false);
    
    if (dbErr && dbErr.code !== 'PGRST116') { setError('Failed to fetch user profile.'); return; }
    const userProfile = dbUser || { id: authData.session.user.id, name: email.split('@')[0], email };

    const hasOnboarded = !!(userProfile.age && userProfile.state && userProfile.voter_status);
    setState(p => ({
      ...p,
      isAuthenticated: true,
      currentPage: hasOnboarded ? "dashboard" : "onboarding",
      hasCompletedOnboarding: hasOnboarded,
      user: { id: userProfile.id, name: userProfile.name, email: userProfile.email, age: userProfile.age, state: userProfile.state, voterStatus: userProfile.voter_status }
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (regStep === 1) { if (!email.includes('@')) { setError('Enter a valid email'); return; } setRegStep(2); }
    else if (regStep === 2) { if (otp !== '123456') { setError('Invalid OTP. Use 123456 for demo.'); return; } setRegStep(3); }
    else if (regStep === 3) {
      if (pass.length < 6) { setError('Password min 6 chars'); return; }
      if (pass !== confirmPass) { setError('Passwords do not match'); return; }
      setAuthLoading(true);
      
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password: pass });
      if (authErr) { setError(authErr.message); setAuthLoading(false); return; }

      const { data: dbUser, error: dbErr } = await supabase.from('users').upsert({ id: authData.session.user.id, name: email.split('@')[0], email }).select().single();
      setAuthLoading(false);

      if (dbErr) { setError('Failed to create user profile.'); return; }

      setState(p => ({
        ...p,
        isAuthenticated: true,
        currentPage: "onboarding",
        hasCompletedOnboarding: false,
        user: { id: dbUser.id, name: dbUser.name, email: dbUser.email }
      }));
    }
  };

  const handleGoogle = () => {
    // Click the hidden rendered Google button to trigger native popup
    if (googleBtnRef.current) {
      const btn = googleBtnRef.current.querySelector('[role="button"]') || googleBtnRef.current.querySelector('div[style]');
      if (btn) { btn.click(); return; }
    }
    // Fallback: try prompt
    if (window.google?.accounts?.id) {
      setGoogleLoading(true);
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
          setError('Google Sign-In popup was blocked. Allow popups for this site and try again.');
        }
      });
    } else {
      setError('Google Sign-In is loading. Please try again in a moment.');
    }
  };

  const inputCls = "w-full py-3 border-b border-[#ccc] bg-transparent text-[15px] focus:border-[#0D0D0D] focus:outline-none placeholder:text-[#999] transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EF] px-6 pt-20">
      {/* Hidden Google GIS rendered button — triggered programmatically */}
      <div ref={googleBtnRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }} />
      <div className="w-full max-w-md">
        <div className="mb-8"><BrandLogo size="lg" /></div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-12">SIGN IN</h1>
        <div className="flex gap-8 mb-10 border-b border-[#E0E0E0]">
          <button className={`pb-3 text-[13px] uppercase tracking-[0.08em] transition-colors ${tab === 'login' ? 'text-[#0D0D0D] border-b border-[#0D0D0D]' : 'text-[#999]'}`} onClick={() => { setTab('login'); setError(''); setRegStep(1); }}>Login</button>
          <button className={`pb-3 text-[13px] uppercase tracking-[0.08em] transition-colors ${tab === 'register' ? 'text-[#0D0D0D] border-b border-[#0D0D0D]' : 'text-[#999]'}`} onClick={() => { setTab('register'); setError(''); setRegStep(1); }}>Register</button>
        </div>
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            <input type="password" placeholder="Password (min 6 chars)" value={pass} onChange={e => setPass(e.target.value)} className={inputCls} />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-[#0D0D0D] text-white py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors disabled:opacity-50">{authLoading ? 'Signing in...' : 'Login'}</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#999]">Step {regStep} of 3</p>
            {regStep === 1 && <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />}
            {regStep === 2 && (<><input type="text" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} className={inputCls} /><p className="text-[12px] text-[#999]">Demo hint: use 123456</p></>)}
            {regStep === 3 && (<><input type="password" placeholder="Create password (min 6)" value={pass} onChange={e => setPass(e.target.value)} className={inputCls} /><input type="password" placeholder="Confirm password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} /></>)}
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <button type="submit" disabled={authLoading} className="w-full bg-[#0D0D0D] text-white py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors disabled:opacity-50">{authLoading ? 'Processing...' : regStep === 1 ? 'Send OTP' : regStep === 2 ? 'Verify OTP' : 'Create Account'}</button>
          </form>
        )}
        <div className="mt-10 pt-8 border-t border-[#E0E0E0]">
          <button onClick={handleGoogle} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 border border-[#ddd] py-3 text-[13px] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z" /><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" /></svg>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ONBOARDING (citizenship removed, 2 steps now) ---
export function OnboardingPage({ state, setState, updateUser }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: state.user?.name || '', age: '', state: '', voterStatus: '' });
  const handleNext = async () => {
    if (step === 1 && data.name && data.age && data.state) setStep(2);
    else if (step === 2 && data.voterStatus) {
      if (state.user?.id) {
        // Persist to DB so returning user doesn't have to fill this again
        await supabase.from('users').update({
          age: parseInt(data.age),
          state: data.state,
          voter_status: data.voterStatus
        }).eq('id', state.user.id);
      }
      updateUser({ ...data, age: parseInt(data.age), voterStatus: data.voterStatus });
      setState(p => ({ ...p, hasCompletedOnboarding: true, currentPage: "dashboard" }));
    }
  };
  const inputCls = "w-full py-3 border-b border-[#ccc] bg-transparent text-[15px] focus:border-[#0D0D0D] focus:outline-none placeholder:text-[#999]";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EF] px-6 pt-20">
      <div className="w-full max-w-lg">
        <div className="mb-6"><BrandLogo size="sm" /></div>
        <div className="flex gap-2 mb-12">{[1, 2].map(i => <div key={i} className={`h-[2px] flex-1 ${i <= step ? 'bg-[#0D0D0D]' : 'bg-[#ddd]'}`} />)}</div>
        <p className="text-[12px] uppercase tracking-[0.1em] text-[#999] mb-4">Step {step} of 2</p>
        {step === 1 && (<>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-8">YOUR DETAILS</h2>
          <div className="space-y-6">
            <input type="text" placeholder="Full Name" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Age" value={data.age} onChange={e => setData({ ...data, age: e.target.value })} className={inputCls} />
            <select value={data.state} onChange={e => setData({ ...data, state: e.target.value })} className={inputCls + " bg-[#F5F3EF]"}>
              <option value="">Select State / UT</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </>)}
        {step === 2 && (<>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D] mb-8">VOTER STATUS</h2>
          <p className="text-[15px] font-light text-[#666] mb-6">Are you registered to vote?</p>
          {['Registered', 'Not Registered', 'Not Sure'].map(s => (
            <label key={s} className={`flex items-center gap-3 py-4 border-b border-[#E0E0E0] cursor-pointer hover:text-[#E8690A] transition-colors ${data.voterStatus === s ? 'text-[#E8690A]' : ''}`}>
              <input type="radio" name="vs" value={s} checked={data.voterStatus === s} onChange={e => setData({ ...data, voterStatus: e.target.value })} className="accent-[#E8690A]" />
              <span className="text-[15px]">{s}</span>
            </label>
          ))}
        </>)}
        <button onClick={handleNext} className="mt-10 bg-[#0D0D0D] text-white px-10 py-3 text-[13px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors">{step === 2 ? 'Complete' : 'Continue'}</button>
      </div>
    </div>
  );
}

// --- DASHBOARD (citizenship removed from eligibility) ---
export function DashboardPage({ state, navigate }) {
  const { user } = state;
  const [checks, setChecks] = useState(Array(8).fill(false));
  const isEligible = user?.age >= 18;
  const isRegistered = user?.voterStatus === 'Registered';
  const eligibility = [
    { label: "Age 18 or above", pass: isEligible, note: isEligible ? `You are ${user?.age}` : `You are ${user?.age} — eligible in ${18 - user?.age} years` },
    { label: "Ordinary resident of constituency", pass: true, note: "Assumed based on your state selection" },
    { label: "Not disqualified under RPA 1950", pass: true, note: "No disqualification declared" },
    { label: "Name on Electoral Roll", pass: isRegistered, note: isRegistered ? "Registered" : "Check or apply at voters.eci.gov.in" }
  ];
  const allPass = eligibility.every(e => e.pass);
  const tools = [
    { title: "Voter ID Guide", key: "voter-id", accent: "border-l-[#1A5C3A]" },
    { title: "Civic Quiz", key: "quiz", accent: "border-l-[#7B61FF]" },
    { title: "Booth Finder", key: "booth-finder", accent: "border-l-[#E8690A]" },
    { title: "AI Sathi Chat", key: "ai-chat", accent: "border-l-[#0072B9]" },
    { title: "Election Simulator", key: "polls", accent: "border-l-[#D32F2F]" },
    { title: "Problem Scenarios", key: "scenarios", accent: "border-l-[#FF6F00]" },
    { title: "Civic Library", key: "learn", accent: "border-l-[#0D0D0D]" }
  ];
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-32">
      <p className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-4">Dashboard</p>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: 900, letterSpacing: '-0.03em' }} className="text-[#0D0D0D]">NAMASTE, {user?.name?.toUpperCase()}</h1>
      <p className="text-[15px] font-light text-[#666] mt-2">{user?.state}, India</p>
      <div className="border-t border-[#E0E0E0] mt-16 pt-12">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">Eligibility Status</h3>
            {eligibility.map((e, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#f0f0f0]">
                {e.pass ? <CheckCircle2 size={16} className="text-[#1A5C3A] mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="text-[#E8690A] mt-0.5 flex-shrink-0" />}
                <div><p className="text-[14px] font-medium text-[#0D0D0D]">{e.label}</p><p className="text-[13px] text-[#999]">{e.note}</p></div>
              </div>
            ))}
            {allPass && <p className="mt-4 text-[14px] text-[#1A5C3A] font-medium">You are fully eligible to vote.</p>}
          </div>
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-6">Pre-Election Checklist</h3>
            {CHECKLIST_ITEMS.map((txt, i) => (
              <label key={i} className="flex items-start gap-3 py-3 border-b border-[#f0f0f0] cursor-pointer group">
                <input type="checkbox" checked={checks[i]} onChange={() => { const c = [...checks]; c[i] = !c[i]; setChecks(c); }} className="mt-1 accent-[#E8690A]" />
                <span className={`text-[14px] transition-colors ${checks[i] ? 'line-through text-[#bbb]' : 'text-[#444] group-hover:text-[#0D0D0D]'}`}>{txt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#E0E0E0] mt-16 pt-4 text-center"><p className="text-[13px] font-light text-[#999]">General Elections 2024 — 96.8 crore registered voters across India</p></div>
      <div className="border-t border-[#E0E0E0] mt-16 pt-12">
        <h3 className="text-[12px] uppercase tracking-[0.15em] text-[#999] mb-8">Explore</h3>
        <div className="grid sm:grid-cols-2 gap-0">
          {tools.map(t => (
            <button key={t.key} onClick={() => navigate(t.key)} className={`text-left p-6 border-b border-r border-[#E0E0E0] border-l-2 ${t.accent} hover:bg-[#f0ede8] transition-colors group`}>
              <span className="text-[15px] font-medium text-[#0D0D0D] group-hover:text-[#E8690A] transition-colors">{t.title}</span>
              <span className="ml-2 text-[#ccc] group-hover:text-[#E8690A] transition-colors">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
