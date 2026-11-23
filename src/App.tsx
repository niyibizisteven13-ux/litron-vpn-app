import React, { useState, useEffect, useRef } from 'react';
import { VpnTimerManager, type ChameleonState } from './mobileLogicCode';
import { Capacitor, registerPlugin } from '@capacitor/core';

type TunnelStatus = {
  state: 'UP' | 'DOWN';
  latestHandshake?: number;
  receivedBytes?: number;
  sentBytes?: number;
};

const Wireguard = registerPlugin<{
  connect(options: { config: string }): Promise<{ status: string }>;
  disconnect(): Promise<void>;
  getStatus(): Promise<TunnelStatus>;
}>('Wireguard');
const supportsTunnel = Capacitor.getPlatform() === 'android';

export default function App() {
  const [uiState, setUiState] = useState<ChameleonState>('DISCONNECTED');
  const [timeRemaining, setTimeRemaining] = useState<number>(VpnTimerManager.getRemainingTime());
  const [profile, setProfile] = useState<{ name: string; config: string } | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TunnelStatus | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const themeStyles = {
    DISCONNECTED: { bg: '#121214', accent: '#F59E0B', statusText: 'Your connection is unprotected', pulseClass: '' },
    CONNECTING: { bg: '#040E14', accent: '#22D3EE', statusText: 'Starting WireGuard tunnel...', pulseClass: 'animate-pulse' },
    CONNECTED: { bg: '#05130C', accent: '#10B981', statusText: 'WireGuard tunnel active', pulseClass: '' }
  };

  useEffect(() => {
    if (!supportsTunnel || uiState === 'CONNECTING') return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refreshStatus() {
      try {
        const current = await Wireguard.getStatus();
        if (stopped) return;
        setStatus(current);
        setUiState(current.state === 'UP' ? 'CONNECTED' : 'DISCONNECTED');
      } catch {
        if (!stopped) setStatus(null);
      } finally {
        if (!stopped) timer = setTimeout(refreshStatus, 2000);
      }
    }
    void refreshStatus();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [uiState]);

  useEffect(() => {
    if (uiState === 'CONNECTED' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            VpnTimerManager.saveRemainingTime(0);
            return 0;
          }
          const updatedTime = prev - 1;
          VpnTimerManager.saveRemainingTime(updatedTime);
          return updatedTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [uiState]);

  async function disconnect() {
    setUiState('CONNECTING');
    try {
      await Wireguard.disconnect();
      setUiState('DISCONNECTED');
    } catch {
      setUiState('CONNECTED');
      setError('Could not stop the tunnel. Use Android VPN settings to disconnect if needed.');
    }
  }

  useEffect(() => {
    if (uiState === 'CONNECTED' && timeRemaining === 0) {
      void disconnect();
    }
  }, [timeRemaining]);

  const handlePowerTap = async () => {
    setError('');
    if (uiState === 'CONNECTED') {
      await disconnect();
      return;
    }

    if (!profile || timeRemaining <= 0) return;
    setUiState('CONNECTING');
    try {
      const result = await Wireguard.connect({ config: profile.config });
      if (result.status !== 'connected') throw new Error();
      setUiState('CONNECTED');
    } catch {
      setError('Could not start WireGuard. Check the profile and allow Android VPN access.');
      setUiState('DISCONNECTED');
    }
  };

  const currentTheme = themeStyles[uiState];

  return (
    <div style={{ backgroundColor: currentTheme.bg, color: '#FFFFFF', minHeight: '100vh', transition: 'all 0.5s ease' }} className="flex flex-col items-center justify-between p-6 font-sans relative overflow-hidden">
      
      <div className="text-center mt-6">
        <h1 className="text-xs tracking-widest text-gray-500 font-bold uppercase">WIREGUARD</h1>
        <p className="text-xl font-extrabold tracking-tight mt-1 text-gray-200">LITRON PROTOCOL</p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <button 
          type="button"
          aria-label={uiState === 'CONNECTED' ? 'Disconnect WireGuard' : 'Connect WireGuard'}
          disabled={!supportsTunnel || uiState === 'CONNECTING' || (uiState === 'DISCONNECTED' && (!profile || timeRemaining <= 0))}
          onClick={handlePowerTap}
          style={{ borderColor: currentTheme.accent, boxShadow: uiState === 'CONNECTING' ? `0 0 25px ${currentTheme.accent}` : 'none' }}
          className={`w-44 h-44 rounded-full border-4 flex items-center justify-center bg-transparent transition-all duration-300 transform active:scale-95 ${currentTheme.pulseClass}`}
        >
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={currentTheme.accent} className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 1 1 12.728 0M12 3v9" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide" style={{ color: currentTheme.accent }}>
            {currentTheme.statusText.toUpperCase()}
          </p>
        </div>
      </div>

      {uiState === 'CONNECTED' && (
        <div className="text-center text-sm text-gray-300" aria-live="polite">
          {status?.state === 'UP' ? (
            <>
              <p>{status.latestHandshake
                ? `Last gateway handshake: ${new Date(status.latestHandshake).toLocaleTimeString()}`
                : 'Waiting for a gateway handshake. Open a page to generate traffic.'}</p>
              <p>Received {status.receivedBytes ?? 0} bytes · Sent {status.sentBytes ?? 0} bytes</p>
            </>
          ) : <p>Checking WireGuard gateway status…</p>}
        </div>
      )}

      {supportsTunnel ? (
        <label className="flex flex-col gap-2 text-sm">
          Import WireGuard profile (.conf)
          <input
            type="file"
            accept=".conf"
            disabled={uiState !== 'DISCONNECTED'}
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              setProfile(null);
              setError('');
              try {
                const config = await file.text();
                setProfile({ name: file.name, config });
              } catch {
                setError('Could not read the WireGuard profile.');
              }
            }}
          />
          {profile?.name}
        </label>
      ) : (
        <p className="text-sm">Open Litron on Android to import a profile and start WireGuard.</p>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-md rounded-2xl p-5 border border-neutral-800 text-center mb-6 z-10">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Secure Tunnel Duration Remaining</p>
        <p className="text-3xl font-mono font-bold mt-2 text-white tracking-widest">
          {Math.floor(timeRemaining / 3600).toString().padStart(2, '0')}:
          {Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0')}:
          {(timeRemaining % 60).toString().padStart(2, '0')}
        </p>
        <button onClick={() => setTimeRemaining(VpnTimerManager.addRewardTime())} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider transition-colors">
          +2 Hours Free (Watch Ad)
        </button>
      </div>

    </div>
  );
}
