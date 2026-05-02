'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      setAuth(data.token, data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      router.push('/products');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#f8fdf2' }}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-start gap-16 px-14 py-14">

        {/* Background image — colorful capsules/pills */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=900&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />

        {/* Dark overlay to remove bluish tone */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(10,25,5,0.97) 0%, rgba(20,45,8,0.75) 40%, rgba(30,60,10,0.45) 70%, rgba(10,20,5,0.55) 100%)',
            mixBlendMode: 'multiply',
          }} />

        {/* Green tint overlay — light on top, stronger at bottom */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(75, 132, 32, 0.92) 0%, rgba(88, 151, 36, 0.74) 40%, rgba(136, 196, 76, 0.64) 75%, rgba(184, 237, 123, 0.55) 100%)',
          }} />

        {/* TOP: Logo */}
        <div className={`relative z-10 flex items-center gap-3 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
          <Logo size="lg" variant="light" showText={false} />
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-white">
              HealthCare<span className="text-white/55 font-semibold"> Shop</span>
            </h1>
            <p className="text-white/45 font-semibold uppercase tracking-[0.32em] text-[9px] mt-1">Medical Platform</p>
          </div>
        </div>

        {/* MIDDLE: Main content */}
        <div className={`relative z-10 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white/80 text-xs font-semibold tracking-wide">Trusted by thousands</span>
          </div>

          <h2 className="text-white font-black leading-[1.15] mb-4" style={{ fontSize: '2.4rem' }}>
            Better Health<br />
            <span className="text-white/70">Starts Here.</span>
          </h2>

          <p className="text-white/65 text-[15px] leading-relaxed max-w-[300px]">
            Shop verified medical products, get AI-powered health guidance, and manage your wellness — all in one place.
          </p>
        </div>

        {/* BOTTOM: Stats row */}
        <div className={`relative z-10 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-white text-xl font-black leading-none">500+</p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">Products</p>
            </div>
            <div className="w-px h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p className="text-white text-xl font-black leading-none">24/7</p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">AI Support</p>
            </div>
            <div className="w-px h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p className="text-white text-xl font-black leading-none">100%</p>
              <p className="text-white/50 text-xs mt-1 tracking-wide">Secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">

        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,195,74,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className={`w-full max-w-sm relative z-10 ${mounted ? 'animate-slide-in-right' : 'opacity-0'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <Logo size="sm" variant="dark" />
          </div>

          {/* Card */}
          <div className="rounded-3xl p-6 sm:p-7"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(139,195,74,0.2)',
              boxShadow: '0 20px 60px rgba(139,195,74,0.1), 0 4px 16px rgba(0,0,0,0.04)',
            }}>

            {/* Tab switcher */}
            <div className="flex rounded-2xl p-1 mb-6"
              style={{ background: '#f0f7e6', border: '1px solid rgba(139,195,74,0.2)' }}>
              {['Sign In', 'Sign Up'].map((tab, i) => (
                <button key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    (i === 0) === isLogin ? 'text-white shadow-lg' : 'hover:text-green-700'
                  }`}
                  style={(i === 0) === isLogin ? {
                    background: 'linear-gradient(135deg, #8bc34a, #6a9e2f)',
                    boxShadow: '0 4px 16px rgba(154, 237, 60, 0.79)',
                    color: 'white',
                  } : { color: '#6a9e2f' }}>
                  {tab}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-black mb-0.5" style={{ color: '#1a3a06' }}>
              {isLogin ? 'Welcome back 👋' : 'Join HealthCare Shop'}
            </h2>
            <p className="text-xs mb-5" style={{ color: '#6b8f4a' }}>
              {isLogin ? 'Sign in to continue your health journey' : 'Start your wellness journey today'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="animate-slide-up">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6a9e2f' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={form.name}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl focus:outline-none font-medium transition-all duration-200"
                    style={{
                      background: '#f8fdf2',
                      border: `1.5px solid ${focused === 'name' ? '#8bc34a' : 'rgba(139,195,74,0.25)'}`,
                      boxShadow: focused === 'name' ? '0 0 0 3px rgba(139,195,74,0.15)' : 'none',
                      color: '#1a3a06',
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6a9e2f' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl focus:outline-none font-medium transition-all duration-200"
                  style={{
                    background: '#f8fdf2',
                    border: `1.5px solid ${focused === 'email' ? '#8bc34a' : 'rgba(139,195,74,0.25)'}`,
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(139,195,74,0.15)' : 'none',
                    color: '#1a3a06',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6a9e2f' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl focus:outline-none font-medium transition-all duration-200 pr-12"
                    style={{
                      background: '#f8fdf2',
                      border: `1.5px solid ${focused === 'password' ? '#8bc34a' : 'rgba(139,195,74,0.25)'}`,
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(139,195,74,0.15)' : 'none',
                      color: '#1a3a06',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#8bc34a' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex justify-end mt-1.5">
                   
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] mt-1 flex items-center justify-center gap-2 group"
                style={{
                  background: 'linear-gradient(135deg, #8bc34a 0%, #6a9e2f 100%)',
                  boxShadow: '0 8px 32px rgba(139,195,74,0.4)',
                }}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(139,195,74,0.2)' }} />
              <span className="text-xs font-medium" style={{ color: '#8bc34a' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(139,195,74,0.2)' }} />
            </div>

            <p className="mt-4 text-center text-sm" style={{ color: '#6b8f4a' }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-bold hover:underline underline-offset-2"
                style={{ color: '#6a9e2f' }}>
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
