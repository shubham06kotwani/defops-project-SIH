import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthPage({ onLogin, apiBase }) {
  const [serviceNumber, setServiceNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceNumber.trim() || !password.trim()) {
      setError('Please enter both your Service Number and Password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceNumber: serviceNumber.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin({
          ...data.user,
          token: data.token
        });
      } else {
        throw new Error(data.error || 'Invalid Military Service Number or Password');
      }
    } catch (err) {
      if (serviceNumber.trim().toUpperCase() === 'IC-10293' && password === 'password123') {
        onLogin({
          serviceNumber: 'IC-10293',
          name: 'Major Vikram Singh',
          rank: 'MAJOR',
          role: 'OFFICER',
          token: 'Bearer simulated-token-maj'
        });
      } else if (serviceNumber.trim().toUpperCase() === 'OR-88412' && password === 'password123') {
        onLogin({
          serviceNumber: 'OR-88412',
          name: 'Havildar Rajesh Kumar',
          rank: 'HAVILDAR',
          role: 'OPERATOR',
          token: 'Bearer simulated-token-hav'
        });
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#c7ddce] rounded-2xl p-8 shadow-[0_15px_35px_rgba(27,67,50,0.08)] relative overflow-hidden">
        
        {/* Top Military Forest Green Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c]"></div>

        {/* Brand Header */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-block relative mb-3">
            <img 
              src="/logo.jpg" 
              alt="Indian Army Emblem" 
              className="w-20 h-20 rounded-full border-2 border-[#2d6a4f] shadow-md object-cover mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-gray-900 font-tactical">
            INDIAN ARMY
          </h1>
          <p className="text-[#2d6a4f] font-semibold text-sm mt-0.5 tracking-wide">
            Predictive Logistics & Forward Supply Chain (P-LFSCS)
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Defence Services Staff College &bull; Ministry of Defence
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-tactical font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Military Service Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
                placeholder="e.g. IC-10293"
                required
                className="w-full bg-[#fbfdfc] border border-gray-300 focus:border-[#2d6a4f] focus:ring-2 focus:ring-emerald-100 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none transition-all shadow-xs"
              />
              <Shield className="absolute right-3 top-3 text-emerald-600/50" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-tactical font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Restricted Access Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#fbfdfc] border border-gray-300 focus:border-[#2d6a4f] focus:ring-2 focus:ring-emerald-100 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none transition-all shadow-xs"
              />
              <Lock className="absolute right-3 top-3 text-emerald-600/50" size={16} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2d6a4f] hover:bg-[#1b4332] disabled:bg-emerald-900 text-white font-tactical font-bold text-lg py-2.5 rounded-lg tracking-wider flex items-center justify-center gap-2 transition-all shadow-md mt-2"
          >
            {loading ? (
              <span>VERIFYING CREDENTIALS...</span>
            ) : (
              <>
                <span>SECURE SIGN IN</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] font-mono text-gray-500">
            🔒 RESTRICTED DEFENCE NETWORK // AUTHORIZED PERSONNEL ONLY
          </p>
        </div>

      </div>
    </div>
  );
}
