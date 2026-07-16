import React, { useState, useEffect, useRef } from 'react';
import { fetchAllVpnProfiles, VpnTimerManager, ChameleonState, VpnConfig } from './mobileLogicCode';
import { registerPlugin } from '@capacitor/core';

const AmneziaVpnBridge = registerPlugin<any>('AmneziaVpnBridge');

export default function App() {
  const [uiState, setUiState] = useState<ChameleonState>('DISCONNECTED');
  const [timeRemaining, setTimeRemaining] = useState<number>(VpnTimerManager.getRemainingTime());
  const [servers, setServers] = useState<VpnConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<VpnConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const themeStyles = {
    DISCONNECTED: { bg: '#121214', accent: '#F59E0B', statusText: 'Your connection is unprotected', pulseClass: '' },
    CONNECTING: { bg: '#040E14', accent: '#22D3EE', statusText: 'Establishing handshake...', pulseClass: 'animate-pulse' },
    CONNECTED: { bg: '#05130C', accent: '#10B981', statusText: 'Secured & Encrypted', pulseClass: '' }
  };

  useEffect(() => {
    async function loadNetwork() {
      const data = await fetchAllVpnProfiles();
      setServers(data);
      if (data.length > 0) setSelectedServer(data[0]);
    }
    loadNetwork();
  }, []);

  useEffect(() => {
    if (uiState === 'CONNECTED' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
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
      try {
        await AmneziaVpnBridge.stopSystemTunnel();
        setUiState('DISCONNECTED');
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (!selectedServer) {
      alert("Please select a target server location node first!");
      return;
    }

    setUiState('CONNECTING');
    
    try {
      await AmneziaVpnBridge.startSystemTunnel({
        endpoint_ip: selectedServer.endpoint_ip,
        server_public_key: selectedServer.server_public_key,
        client_private_key: "2C8UF8DFpEsvmCngFlkg7WsS6gwpY3YJpuvpD5foPEI=",
        jc: selectedServer.obfuscation.jc,
        jv: selectedServer.obfuscation.jv
      });
      
      setTimeout(() => {
        setUiState('CONNECTED');
      }, 1500);
    } catch (error) {
      alert("Native bridge routing lookup failure.");
      setUiState('DISCONNECTED');
    }
  };

  const currentTheme = themeStyles[uiState];

  return (
    <div style={{ backgroundColor: currentTheme.bg, color: '#FFFFFF', minHeight: '100vh', transition: 'all 0.5s ease' }} className="flex flex-col items-center justify-between p-6 font-sans relative overflow-hidden">
      
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
        </div>
      </div>

      <button 
        disabled={uiState !== 'DISCONNECTED'}
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center space-x-3 bg-neutral-900/80 border border-neutral-800 rounded-xl px-5 py-3 hover:bg-neutral-800 transition-all text-sm font-medium tracking-wide active:scale-95 disabled:opacity-50"
      >
        <span>🌐 {selectedServer ? selectedServer.server_name : "FETCHING LOCATIONS..."}</span>
        <svg xmlns="http://w3.org" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-md rounded-2xl p-5 border border-neutral-800 text-center mb-6 z-10">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Secure Tunnel Duration Remaining</p>
        <p className="text-3xl font-mono font-bold mt-2 text-white tracking-widest">
          {Math.floor(timeRemaining / 3600).toString().padStart(2, '0')}:
          {Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0')}:
          {(timeRemaining % 60).toString().padStart(2, '0')}
        </p>
        <button onClick={() => setTimeRemaining((prev) => prev + 7200)} className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs py-3 px-4 rounded-xl uppercase tracking-wider transition-colors">
          +2 Hours Free (Watch Ad)
        </button>
      </div>

      {isDrawerOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end transition-all duration-300">
          <div className="bg-neutral-950 border-t border-neutral-800 rounded-t-3xl w-full p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Select Edge Gateway Node</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-500 hover:text-white font-bold text-sm">CLOSE</button>
            </div>
            <div className="space-y-2">
              {servers.map((srv) => (
                <button
                  key={srv.server_id}
                  onClick={() => {
                    setSelectedServer(srv);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedServer?.server_id === srv.server_id ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{srv.server_name}</span>
                    <span className="text-xs text-gray-500 mt-0.5">IP: {srv.endpoint_ip}</span>
                  </div>
                  {selectedServer?.server_id === srv.server_id && <span className="text-xs font-bold uppercase tracking-widest">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
