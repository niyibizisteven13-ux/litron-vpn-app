import React, { useState, useEffect, useRef } from 'react';
import { registerPlugin } from '@capacitor/core';
import { fetchLiveVpnProfile, VpnTimerManager, ChameleonState, VpnConfig } from './mobileLogicCode';

const Wireguard = registerPlugin<any>('Wireguard');

export default function App() {
  const [uiState, setUiState] = useState<ChameleonState>('DISCONNECTED');
  const [timeRemaining, setTimeRemaining] = useState<number>(VpnTimerManager.getRemainingTime());
  const [activeConfig, setActiveConfig] = useState<VpnConfig | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const themeStyles = {
    DISCONNECTED: { bg: '#121214', accent: '#F59E0B', statusText: 'Your connection is unprotected', pulseClass: '' },
    CONNECTING: { bg: '#040E14', accent: '#22D3EE', statusText: 'Establishing handshake...', pulseClass: 'animate-pulse' },
    CONNECTED: { bg: '#05130C', accent: '#10B981', statusText: 'Secured & Encrypted', pulseClass: '' }
  };

  useEffect(() => {
    if (uiState === 'CONNECTED' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev: number) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setUiState('DISCONNECTED');
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

  const handlePowerTap = async () => {
    if (timeRemaining <= 0) {
      alert("Tunnel Duration Expired! Watch a free rewarded ad to reload network access time.");
      return;
    }

    if (uiState === 'CONNECTED') {
      setUiState('DISCONNECTED');
      return;
    }

    setUiState('CONNECTING');
    const config = await fetchLiveVpnProfile();

    if (config) {
      setActiveConfig(config);
      
      if ((window as any).__TAURI_METADATA__) {
        setUiState('CONNECTED');
      } else {
        try {
          // Check if running inside the native app container environment
          if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
            const confText = [
              '[Interface]',
              `PrivateKey = ${config.client_private_key}`,
              `Address = ${config.client_address || '10.13.13.2/32'}`,
              'DNS = 1.1.1.1',
              '',
              '[Peer]',
              `PublicKey = ${config.server_public_key}`,
              config.preshared_key ? `PresharedKey = ${config.preshared_key}` : '',
              `Endpoint = ${config.endpoint_ip}:${config.endpoint_port || 51820}`,
              'AllowedIPs = 0.0.0.0/0, ::/0',
            ].filter(Boolean).join('\n');

            const result = await Wireguard.connect({ config: confText });
            if (result?.status !== 'connected') {
              throw new Error('Native plugin did not confirm connection');
            }
            setUiState('CONNECTED');
          } else {
            console.warn("VPN tunneling is not supported in the browser/web context.");
            alert("VPN connections require the Android or iOS app. This is not supported in a web browser.");
            setUiState('DISCONNECTED');
          }
        } catch (pluginError) {
          console.error('Native tunnel startup failed:', pluginError);
          alert("Failed to establish VPN connection: " + (pluginError instanceof Error ? pluginError.message : String(pluginError)));
          setUiState('DISCONNECTED');
        }
      }
    } else {
      alert("Connection failure. Unable to pull server routing configurations.");
      setUiState('DISCONNECTED');
    }
  };

  const handleAdWatchReward = () => {
    const updatedSeconds = VpnTimerManager.addRewardTime();
    setTimeRemaining(updatedSeconds);
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const currentTheme = themeStyles[uiState];

  return (
    <div style={{ backgroundColor: currentTheme.bg, color: '#FFFFFF', minHeight: '100vh', transition: 'all 0.5s ease' }} className="flex flex-col items-center justify-between p-6 font-sans">
      <div className="text-center mt-6">
        <h1 className="text-xs tracking-widest text-gray-500 font-bold uppercase">AMNEZIA BYPASS CORE</h1>
        <p className="text-xl font-extrabold tracking-tight mt-1 text-gray-200">LITRON PROTOCOL</p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <button 
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
          {uiState === 'CONNECTED' && activeConfig && (
            <p className="text-xs text-gray-400 mt-1">Node: {activeConfig.server_name} ({activeConfig.endpoint_ip})</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-md rounded-2xl p-5 border border-neutral-800 text-center mb-6">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Secure Tunnel Duration Remaining</p>
        <p className="text-3xl font-mono font-bold mt-2 text-white tracking-widest">{formatDisplayTime(timeRemaining)}</p>
        
        <button 
          onClick={handleAdWatchReward}
          className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider transition-colors"
        >
          +2 Hours Free (Watch Ad)
        </button>
      </div>
    </div>
  );
}
