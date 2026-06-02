import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants';

export default function LoginPage({ role }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = role === 'admin' ? '/auth/login' : `/auth/${role}-login`;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate(`/${role}/dashboard`);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const colorStyles = {
    admin: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      hover: 'hover:bg-indigo-700',
      shadow: 'shadow-indigo-600/20',
    },
    teacher: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      hover: 'hover:bg-emerald-700',
      shadow: 'shadow-emerald-600/20',
    },
    student: {
      bg: 'bg-violet-600',
      text: 'text-violet-600',
      hover: 'hover:bg-violet-700',
      shadow: 'shadow-violet-600/20',
    },
  };

  const styles = colorStyles[role];

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 transition-colors duration-300">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className={`w-16 h-16 ${styles.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${styles.shadow}`}>
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold tracking-tight mb-2 ${styles.text}`}>Advantech Login</h1>
          <p className="text-zinc-500 dark:text-zinc-400 capitalize">{role} Portal Login</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl dark:bg-zinc-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/50 dark:border-zinc-800 relative overflow-hidden">
          {/* Subtle decorative blob */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 ${styles.bg} ${styles.hover} text-white font-semibold rounded-xl shadow-lg ${styles.shadow} flex items-center justify-center transition-all disabled:opacity-70`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Switch role?</p>
            <div className="flex justify-center space-x-4">
              {['teacher', 'student'].filter(r => r !== role).map(r => (
                <Link
                  key={r}
                  to={`/${r}/login`}
                  className="text-xs font-medium text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 capitalize transition-colors"
                >
                  Are you a {r} ?
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
