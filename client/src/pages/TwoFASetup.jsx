import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const TwoFASetup = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const { token: authToken } = useSelector((state) => state.auth);

  useEffect(() => {
    const init2FA = async () => {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/auth/enable-2fa',
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setQrCode(response.data.qrCodeUrl);
        setSecret(response.data.secret);
      } catch (error) {
        toast.error('Failed to initialize 2FA setup');
      }
    };
    init2FA();
  }, [authToken]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/auth/verify-2fa',
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.success('Two-Factor Authentication enabled successfully!');
      setSetupComplete(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Secret copied to clipboard');
  };

  if (setupComplete) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 p-6">
        <div className="glass-dark p-12 rounded-[2.5rem] border border-emerald-500/30 text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="text-emerald-500" size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">2FA Enabled</h2>
          <p className="text-slate-400">
            Your account is now secured with Two-Factor Authentication. 
            You will be required to enter a verification code from your authenticator app when logging in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Setup Two-Factor Authentication</h2>
        <p className="text-slate-400">Add an extra layer of security to your account</p>
      </div>

      <div className="glass-dark p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">1</span>
              Install Authenticator App
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-10">
              Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your mobile device.
            </p>

            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mt-8">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">2</span>
              Scan the QR Code
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed ml-10">
              Open your authenticator app and scan this QR code, or manually enter the setup key below.
            </p>

            <div className="ml-10 mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Setup Key</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-emerald-400 font-mono text-sm tracking-wider break-all">{secret}</code>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Copy secret"
                >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white p-4 rounded-3xl shadow-xl">
            {qrCode ? (
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-2xl">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-8 mt-8">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">3</span>
            Verify Setup
          </h3>
          <form onSubmit={handleVerify} className="ml-10 flex gap-4">
            <div className="relative flex-1">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 text-white font-mono tracking-widest text-lg"
                required
                pattern="\d{6}"
                maxLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || token.length !== 6}
              className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TwoFASetup;
