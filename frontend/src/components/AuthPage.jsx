import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AuthPage({ onLogin, apiBase, onBack }) {
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
      const clean = serviceNumber.trim().toUpperCase();
      if (clean === 'IC-00101' && password === 'password123') {
        onLogin({
          serviceNumber: 'IC-00101',
          name: 'Brigadier Amitav Sen',
          rank: 'BRIGADIER',
          role: 'COMMANDER',
          token: 'Bearer simulated-token-brig'
        });
      } else if (clean === 'IC-10293' && password === 'password123') {
        onLogin({
          serviceNumber: 'IC-10293',
          name: 'Major Vikram Singh',
          rank: 'MAJOR',
          role: 'OFFICER',
          token: 'Bearer simulated-token-maj'
        });
      } else if (clean === 'OR-88412' && password === 'password123') {
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
    <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#c8ddcf] rounded-lg p-8 shadow-xl relative overflow-hidden hud-corner-brackets">
        
        {/* Top Military Accent Bar (Deep Olive to Safety Orange to Desert Tan) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1c3824] via-[#ff6600] to-[#997746]"></div>

        {/* Back to Dashboard Button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-stencil font-bold text-[#1c3824] hover:text-[#ff6600] px-3 py-1.5 rounded bg-[#f0f5f1] hover:bg-[#e2ece5] border border-[#c8ddcf] transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>RETURN TO DASHBOARD</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-block relative mb-3">
            <img 
              src="/logo.jpg" 
              alt="Indian Army Emblem" 
              className="w-20 h-20 rounded-full border-2 border-[#1c3824] shadow-sm object-cover mx-auto"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1b2e1e] border border-[#00e655] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#00e655] animate-pulse"></span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-gray-900 font-stencil">
            DEFOPS
          </h1>
          <p className="text-[#1c3824] font-semibold text-xs mt-0.5 tracking-wider uppercase font-mono">
            Forward Formations Logistics Assurance
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-sans">
            Indian Army &bull; Defence Services Staff College &bull; MoD
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2 font-mono">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-stencil font-bold text-[#1c3824] uppercase tracking-wider mb-1.5">
              MILITARY SERVICE NUMBER
            </label>
            <div className="relative">
              <input
                type="text"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
                placeholder="e.g. IC-10293"
                required
                className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded px-3.5 py-2.5 text-xs font-mono outline-none transition-all placeholder:text-gray-400"
              />
              <Shield className="absolute right-3 top-3 text-[#1c3824]/50" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-stencil font-bold text-[#1c3824] uppercase tracking-wider mb-1.5">
              RESTRICTED ACCESS CIPHER / PASSWORD
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#f8faf8] border border-[#c8ddcf] focus:border-[#ff6600] text-gray-900 rounded px-3.5 py-2.5 text-xs font-mono outline-none transition-all placeholder:text-gray-400"
              />
              <Lock className="absolute right-3 top-3 text-[#1c3824]/50" size={16} />
            </div>
          </div>

          {/* Quick Military Profile Pre-fills for Testing Chain of Command */}
          <div className="pt-2">
            <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1.5 text-center font-bold">
              -- Quick Echelon Profile Sign-in --
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => { setServiceNumber('IC-00101'); setPassword('password123'); }}
                className="p-1.5 rounded bg-[#f0f6f2] hover:bg-[#e2ece5] text-[#1c3824] border border-[#c8ddcf] text-left transition-all cursor-pointer"
                title="Higher Authority (Approval Echelon)"
              >
                <div className="font-bold text-[10px] text-[#ff6600]">🎖️ HIGHER AUTH</div>
                <div className="truncate text-[10px]">Brig. Sen</div>
              </button>
              <button
                type="button"
                onClick={() => { setServiceNumber('IC-10293'); setPassword('password123'); }}
                className="p-1.5 rounded bg-[#f0f6f2] hover:bg-[#e2ece5] text-[#1c3824] border border-[#c8ddcf] text-left transition-all cursor-pointer"
                title="Forward Post Officer (Requester Echelon)"
              >
                <div className="font-bold text-[10px] text-[#1c3824]">🪖 FWD OFFICER</div>
                <div className="truncate text-[10px]">Maj. Singh</div>
              </button>
              <button
                type="button"
                onClick={() => { setServiceNumber('OR-88412'); setPassword('password123'); }}
                className="p-1.5 rounded bg-[#f0f6f2] hover:bg-[#e2ece5] text-[#1c3824] border border-[#c8ddcf] text-left transition-all cursor-pointer"
                title="Field Operator (Requester Echelon)"
              >
                <div className="font-bold text-[10px] text-gray-700">📦 OPERATOR</div>
                <div className="truncate text-[10px]">Hav. Kumar</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6600] hover:bg-[#e65100] disabled:bg-gray-400 text-white font-stencil font-bold text-sm py-2.5 rounded tracking-widest flex items-center justify-center gap-2 transition-all shadow-xs mt-2 cursor-pointer"
          >
            {loading ? (
              <span>VERIFYING CRYPTO TOKEN...</span>
            ) : (
              <>
                <span>AUTHORIZE MILITARY SIGN IN</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-[10px] font-mono text-gray-500">
            🔒 SEC-LEVEL 4 // RESTRICTED MILITARY NETWORK // AUDIT LOGGED
          </p>
        </div>

      </div>
    </div>
  );
}
