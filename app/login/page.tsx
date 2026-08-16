'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, signup, verifyOtp, signInWithGoogle } from './actions'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    const [view, setView] = useState<'login' | 'signup' | 'verify'>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(message)

    // Form fields
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')
    const [city, setCity] = useState('')
    const [otp, setOtp] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        
        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        
        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/')
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('name', name)
        formData.append('city', city)

        const res = await signup(formData)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            // Success, switch to verify view
            setError(null)
            setView('verify')
            setLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const res = await verifyOtp(email, otp)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/')
        }
    }

    const GoogleIcon = () => (
        <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )

    return (
        <div className="login-card">
            {/* Logo / Title */}
            <div className="login-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <a href="/" style={{ display: 'flex', textDecoration: 'none' }}>
                        <img src="/logo.png" alt="Japa Counter Logo" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
                    </a>
                    <h1 className="login-title" style={{ margin: 0 }}>
                        <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>JAPA COUNTER</a>
                    </h1>
                </div>
                <p className="login-subtitle">Hare Krishna Mantra Sadhana</p>
            </div>

            {view === 'login' && (
                <form className="login-form" onSubmit={handleLogin}>
                    <div className="auth-tabs">
                        <button type="button" className="auth-tab active">Sign In</button>
                        <button type="button" className="auth-tab" onClick={() => { setView('signup'); setError(null); }}>Sign Up</button>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    
                    <div className="login-actions" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                    
                    <div className="divider"><span>or</span></div>
                    
                    <button type="button" onClick={() => signInWithGoogle()} className="btn-google" style={{ width: '100%' }}>
                        <GoogleIcon />
                        Continue with Google
                    </button>
                    
                    {error && <div className="login-error">{error}</div>}
                </form>
            )}

            {view === 'signup' && (
                <form className="login-form" onSubmit={handleSignup}>
                    <div className="auth-tabs">
                        <button type="button" className="auth-tab" onClick={() => { setView('login'); setError(null); }}>Sign In</button>
                        <button type="button" className="auth-tab active">Sign Up</button>
                    </div>

                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <input id="name" type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="city">City</label>
                        <input id="city" type="text" placeholder="E.g. Mumbai, New York" value={city} onChange={e => setCity(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>
                    
                    <div className="login-actions" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                    
                    <div className="divider"><span>or</span></div>
                    
                    <button type="button" onClick={() => signInWithGoogle()} className="btn-google" style={{ width: '100%' }}>
                        <GoogleIcon />
                        Continue with Google
                    </button>
                    
                    {error && <div className="login-error">{error}</div>}
                </form>
            )}

            {view === 'verify' && (
                <form className="login-form" onSubmit={handleVerify}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        We've sent a 6-digit verification code to <br/><strong style={{ color: '#fff' }}>{email}</strong><br/>
                        Please enter it below to verify your account.
                    </div>

                    <div className="input-group">
                        <label htmlFor="otp" style={{ textAlign: 'center' }}>Verification Code</label>
                        <input 
                            id="otp" 
                            type="text" 
                            placeholder="123456" 
                            value={otp} 
                            onChange={e => setOtp(e.target.value)} 
                            required 
                            style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', fontWeight: 600, padding: '1rem' }} 
                            maxLength={6} 
                        />
                    </div>
                    
                    <div className="login-actions" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => setView('signup')} disabled={loading} style={{ width: '100%', background: 'transparent' }}>
                            Back
                        </button>
                    </div>
                    {error && <div className="login-error">{error}</div>}
                </form>
            )}
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="login-page-container">
            {/* Cosmic Background */}
            <div className="cosmic-background">
                <div className="stars"></div>
                <div className="nebula"></div>
            </div>
            
            <Suspense fallback={<div className="login-card" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spin" style={{ border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', width: '24px', height: '24px' }} /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
