import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { findEntryByEmail, generateSalt, hashPassword, verifyPassword } from '@/lib/participantAuth';
import { useParticipant } from '@/lib/ParticipantContext';

export default function ParticipantLogin() {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const { login } = useParticipant();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedEntry, setMatchedEntry] = useState(null);

  useEffect(() => { document.title = 'Cowtown Masters - Sign In'; }, []);

  const { data: entries = [] } = useQuery({
    queryKey: ['poolEntries', poolId],
    queryFn: () => base44.entities.PoolEntry.filter({ pool_id: poolId }),
    enabled: !!poolId,
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }

    const entry = findEntryByEmail(entries, email);
    if (!entry) {
      setError('No participant found with this email. Contact the pool admin to get added.');
      return;
    }

    setMatchedEntry(entry);
    try {
      const authRecords = await base44.entities.ParticipantAuth.filter({
        pool_id: poolId,
        email: email.trim().toLowerCase(),
      });
      setStep(authRecords.length > 0 ? 'login' : 'register');
    } catch {
      setStep('register');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      await base44.entities.ParticipantAuth.create({
        pool_id: poolId,
        email: email.trim().toLowerCase(),
        participant_name: matchedEntry.participant_name,
        entry_id: matchedEntry.id,
        password_hash: passwordHash,
        salt,
        created_date: new Date().toISOString(),
      });
      login({ participant_name: matchedEntry.participant_name, email: email.trim().toLowerCase(), entry_id: matchedEntry.id });
      navigate(`/pool/${poolId}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err?.message || 'Failed to create account. Please try again.');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter your password'); return; }

    setLoading(true);
    try {
      const authRecords = await base44.entities.ParticipantAuth.filter({ pool_id: poolId, email: email.trim().toLowerCase() });
      if (authRecords.length === 0) { setError('Account not found. Please register.'); setStep('register'); setLoading(false); return; }

      const authRecord = authRecords[0];
      const isValid = await verifyPassword(password, authRecord.salt, authRecord.password_hash);
      if (!isValid) { setError('Incorrect password'); setLoading(false); return; }

      login({ participant_name: authRecord.participant_name, email: email.trim().toLowerCase(), entry_id: authRecord.entry_id });
      navigate(`/pool/${poolId}`);
    } catch {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex flex-col items-center px-4">
      {/* Header */}
      <div className="w-full max-w-sm pt-6 mb-4">
        <button
          onClick={() => step === 'email' ? navigate(`/pool/${poolId}`) : setStep('email')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'email' ? 'Back to pool' : 'Change email'}
        </button>
      </div>

      {/* Logo + Title */}
      <div className="text-center mb-6">
        <img
          src="https://media.base44.com/images/public/69bd90cf71e1b676eaaeb41f/1752bc3ba_CowtownMastersLogo.png"
          alt="Cowtown Masters"
          className="w-16 h-16 mx-auto mb-3 object-contain"
        />
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
          {step === 'email' ? 'Sign In' : step === 'register' ? 'Set Up Account' : 'Welcome Back'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
          {step === 'email'
            ? 'Enter your registered email to access the pool'
            : step === 'register'
            ? `Creating account for ${matchedEntry?.participant_name}`
            : `Signing in as ${matchedEntry?.participant_name}`}
        </p>
      </div>

      {/* Forms */}
      <div className="w-full max-w-sm">
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="bg-card rounded-xl border border-border p-4">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center animate-fade-in-up">{error}</p>}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11">
              Continue
            </Button>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Your email must match one registered in this pool. Contact the admin if you need to be added.
            </p>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="bg-accent/8 rounded-xl border border-accent/20 p-3 flex items-center gap-2.5 animate-fade-in-up">
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">{matchedEntry?.participant_name}</p>
                <p className="text-[10px] text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-fade-in-up">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="At least 6 characters"
                    className="pl-10 pr-10 h-11"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Confirm password"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center animate-fade-in-up">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11">
              {loading ? 'Creating Account...' : 'Create Account & Enter Pool'}
            </Button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="bg-accent/8 rounded-xl border border-accent/20 p-3 flex items-center gap-2.5 animate-fade-in-up">
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">{matchedEntry?.participant_name}</p>
                <p className="text-[10px] text-muted-foreground">{email}</p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 animate-fade-in-up">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center animate-fade-in-up">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              Forgot your password? Contact your pool admin to reset it.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
