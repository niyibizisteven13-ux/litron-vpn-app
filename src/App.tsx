import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  Settings, 
  Plus, 
  Check, 
  Sparkles, 
  HelpCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Radio, 
  Layers, 
  Smartphone, 
  Cpu, 
  Copy, 
  ExternalLink, 
  Code,
  FileCode,
  RefreshCw,
  Eye,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSetupScript } from './setupScript';
import { mobileDashboardCode } from './mobileDashboardCode';
import { mobileLogicCode } from './mobileLogicCode';
import { VpnServer, AppItem, ConfigParams } from './types';

export default function App() {
  // Navigation / Tab layout
  const [activeTab, setActiveTab] = useState<'sim' | 'server' | 'code'>('sim');
  const [codeSubTab, setCodeSubTab] = useState<'ui' | 'network'>('ui');

  // --- CONFIG / STATE PARAMS ---
  const [config, setConfig] = useState<ConfigParams>({
    serverIp: '168.138.22.84', // Standard Oracle Cloud IP
    port: 51820,
    ssPort: 8388,
    privateKey: 'eL9+S789p=fakeServerPrivateKeyForDemonstrationOnly=',
    publicKey: 'uB2+W345p=fakeServerPublicKeyForDemonstrationOnly=',
    dnsServer: '1.1.1.1',
    mtu: 1420,
    tunnelName: 'LitronAmneziaWGTunnel'
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // --- VPN SIMULATION STATES ---
  const [vpnState, setVpnState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [selectedServer, setSelectedServer] = useState<VpnServer>({
    id: 'us',
    name: 'United States - Oregon',
    countryCode: 'US',
    flag: '🇺🇸',
    quality: 'fast',
    ip: '168.138.22.84'
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(7200); // 2 hours in seconds
  const [isServerSheetOpen, setIsServerSheetOpen] = useState(false);
  const [isSplitTunnelOpen, setIsSplitTunnelOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Servers List
  const servers: VpnServer[] = [
    { id: 'us', name: 'United States - Oregon', countryCode: 'US', flag: '🇺🇸', quality: 'fast', ip: '168.138.22.84' },
    { id: 'gb', name: 'United Kingdom - London', countryCode: 'GB', flag: '🇬🇧', quality: 'fast', ip: '152.67.121.9' },
    { id: 'de', name: 'Germany - Frankfurt', countryCode: 'DE', flag: '🇩🇪', quality: 'medium', ip: '130.162.20.10' },
    { id: 'jp', name: 'Japan - Tokyo', countryCode: 'JP', flag: '🇯🇵', quality: 'medium', ip: '140.238.12.44' },
    { id: 'sg', name: 'Singapore - Changi', countryCode: 'SG', flag: '🇸🇬', quality: 'slow', ip: '129.146.90.3' }
  ];

  // Apps List for split tunneling simulation
  const [apps, setApps] = useState<AppItem[]>([
    { id: '1', name: 'Netflix', packageName: 'com.netflix.mediaclient', icon: '🍿', isExcluded: false },
    { id: '2', name: 'Spotify', packageName: 'com.spotify.music', icon: '🎵', isExcluded: true },
    { id: '3', name: 'YouTube', packageName: 'com.google.android.youtube', icon: '📺', isExcluded: false },
    { id: '4', name: 'Telegram', packageName: 'org.telegram.messenger', icon: '✈️', isExcluded: false },
    { id: '5', name: 'Chrome Browser', packageName: 'com.android.chrome', icon: '🌐', isExcluded: false },
    { id: '6', name: 'PUBG Mobile', packageName: 'com.tencent.ig', icon: '🎮', isExcluded: true }
  ]);

  const [searchAppQuery, setSearchAppQuery] = useState('');

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Clipboard copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Timer Countdown Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (vpnState === 'connected' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setVpnState('disconnected');
            showToast('Connection expired! Watch an ad to regain access.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [vpnState, timeRemaining]);

  // Connect Simulation Sequence with Time-Locking
  const toggleVpn = () => {
    if (timeRemaining <= 0) {
      showToast('Access Locked: Remaining time is 0. Tap "WATCH FREE AD TO ADD TIME" first!');
      return;
    }
    if (vpnState === 'connected') {
      setVpnState('disconnected');
      showToast('VPN disconnected.');
    } else if (vpnState === 'disconnected') {
      setVpnState('connecting');
      setTimeout(() => {
        setVpnState('connected');
        showToast(`Connected to ${selectedServer.name}!`);
      }, 2000);
    }
  };

  const handleAddMinutes = () => {
    // Simulating completion of rewarded ad
    setTimeRemaining(prev => prev + 7200); // Add 2 hours (7200 seconds)
    showToast('Success! Rewarded Video Completed: +2 Hours active duration granted.');
  };

  const handleSelectServer = (srv: VpnServer) => {
    setSelectedServer(srv);
    setIsServerSheetOpen(false);
    if (vpnState === 'connected') {
      setVpnState('connecting');
      setTimeout(() => {
        setVpnState('connected');
        showToast(`Re-routed to ${srv.name}`);
      }, 1500);
    } else {
      showToast(`Selected hub: ${srv.name}`);
    }
  };

  const toggleExcludeApp = (appId: string) => {
    setApps(prev => prev.map(app => 
      app.id === appId ? { ...app, isExcluded: !app.isExcluded } : app
    ));
  };

  const formatDuration = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Filter apps
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchAppQuery.toLowerCase()) || 
    app.packageName.toLowerCase().includes(searchAppQuery.toLowerCase())
  );

  const scriptContent = getSetupScript({
    port: config.port,
    ssPort: config.ssPort,
    dns: config.dnsServer,
    mtu: config.mtu,
    tunnelName: config.tunnelName
  });

  return (
    <div className="min-h-screen bg-[#080A0F] text-white flex flex-col font-sans selection:bg-[#00F0A0] selection:text-black">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#00F0A0] text-[#080A0F] px-5 py-3 rounded-xl shadow-[0_0_30px_rgba(0,240,160,0.4)] font-black text-sm tracking-wide flex items-center space-x-2"
          >
            <Sparkles size={16} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Row */}
      <header className="border-b border-white/5 bg-[#080A0F]/90 backdrop-blur sticky top-0 z-30 px-6 py-5 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#00F0A0] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,160,0.3)] transition-transform hover:scale-105">
            <div className="w-5 h-5 border-2 border-[#080A0F] rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl font-black tracking-tighter italic text-white">LITRON.</span>
              <span className="text-[9px] uppercase tracking-[0.25em] bg-[#00F0A0]/10 text-[#00F0A0] font-extrabold px-2 py-0.5 rounded border border-[#00F0A0]/20">System v1.0</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Interactive setup automation, code explorer & design simulator</p>
          </div>
        </div>

        {/* Tab switchers in Center Header block */}
        <div className="flex items-center bg-[#161B26] p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('sim')} 
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${activeTab === 'sim' ? 'bg-[#00F0A0] text-[#080A0F] shadow-lg shadow-[#00F0A0]/10' : 'text-gray-400 hover:text-white'}`}
          >
            <Smartphone size={14} />
            <span>Interactive Simulator</span>
          </button>
          <button 
            onClick={() => setActiveTab('server')} 
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${activeTab === 'server' ? 'bg-[#00F0A0] text-[#080A0F] shadow-lg shadow-[#00F0A0]/10' : 'text-gray-400 hover:text-white'}`}
          >
            <Terminal size={14} />
            <span>Ubuntu Provisioner</span>
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${activeTab === 'code' ? 'bg-[#00F0A0] text-[#080A0F] shadow-lg shadow-[#00F0A0]/10' : 'text-gray-400 hover:text-white'}`}
          >
            <Code size={14} />
            <span>Client Mobile Source</span>
          </button>
        </div>

        {/* Ad support pill flag right */}
        <div className="flex items-center gap-2 bg-[#161B26] px-4 py-2 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-xs font-bold tracking-widest uppercase text-white/80">Ad-Supported Tier</span>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
        
        {/* TAB 1: INTERACTIVE SIMULATOR */}
        {activeTab === 'sim' && (
          <>
            {/* Left side: Configuration tweaks */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              
              <div className="bg-[#161B26] border border-white/5 rounded-3xl p-6 flex flex-col space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Settings className="text-[#00F0A0]" size={16} />
                    <h2 className="font-black text-white text-xs tracking-[0.2em] uppercase">Tunnel Options</h2>
                  </div>
                  <HelpCircle size={14} className="text-gray-500 cursor-help" title="These dynamically populate the server configuration profiles and setup scripts in real-time." />
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed">Modify key parameters to watch the auto-generated configuration profile and simulator status adjust dynamically.</p>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">Default Ingress UDP Port</label>
                    <input 
                      type="number" 
                      value={config.port} 
                      onChange={e => setConfig({...config, port: parseInt(e.target.value) || 51820})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">Shadowsocks SS-2022 Port</label>
                    <input 
                      type="number" 
                      value={config.ssPort} 
                      onChange={e => setConfig({...config, ssPort: parseInt(e.target.value) || 8388})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">System MTU</label>
                      <input 
                        type="number" 
                        value={config.mtu} 
                        onChange={e => setConfig({...config, mtu: parseInt(e.target.value) || 1420})}
                        className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">DNS Resolver</label>
                      <input 
                        type="text" 
                        value={config.dnsServer} 
                        onChange={e => setConfig({...config, dnsServer: e.target.value})}
                        className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">Internal Tunnel ID</label>
                    <input 
                      type="text" 
                      value={config.tunnelName} 
                      onChange={e => setConfig({...config, tunnelName: e.target.value})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Selected Hub:</span>
                  <span className="font-mono text-[#00F0A0] font-bold">{selectedServer.flag} {selectedServer.ip}:{config.port}</span>
                </div>
              </div>

              {/* Status checklist metrics */}
              <div className="bg-[#161B26] border border-white/5 rounded-3xl p-6 space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-black text-white text-xs tracking-[0.2em] uppercase">Active Protection Health</h3>
                  
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center space-x-3 text-xs">
                      <div className={`p-1.5 rounded-lg ${vpnState === 'connected' ? 'bg-[#00F0A0]/10 text-[#00F0A0]' : 'bg-amber-500/10 text-amber-400'}`}>
                        {vpnState === 'connected' ? <Check size={12} /> : <div className="w-3 h-3 border-2 border-current rounded-full border-t-transparent animate-spin" />}
                      </div>
                      <span className="text-gray-300 font-medium">Virtual Location Routed</span>
                      <span className="ml-auto font-mono text-gray-400 font-bold">{vpnState === 'connected' ? selectedServer.name : 'None'}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className={`p-1.5 rounded-lg ${vpnState === 'connected' ? 'bg-[#00F0A0]/10 text-[#00F0A0]' : 'bg-white/5 text-gray-500'}`}>
                        <Check size={12} />
                      </div>
                      <span className="text-gray-300 font-medium">TCP BBR Optimization</span>
                      <span className="ml-auto text-[#00F0A0] font-mono font-bold">Active</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className={`p-1.5 rounded-lg ${vpnState === 'connected' ? 'bg-[#00F0A0]/10 text-[#00F0A0]' : 'bg-white/5 text-gray-500'}`}>
                        <Check size={12} />
                      </div>
                      <span className="text-gray-300 font-medium">Device Tunneling Engine</span>
                      <span className="ml-auto text-gray-400 font-mono font-bold">WireGuard IP</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className="p-1.5 rounded-lg bg-[#00F0A0]/10 text-[#00F0A0]">
                        <Check size={12} />
                      </div>
                      <span className="text-gray-300 font-medium">Excluded Split-Tunnel apps</span>
                      <span className="ml-auto font-mono text-gray-400 font-bold">{apps.filter(a => a.isExcluded).length} Apps</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 bg-[#080A0F] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center space-x-2 text-xs font-black text-white mb-1">
                    <BookOpen size={14} className="text-[#00F0A0]" />
                    <span className="tracking-wide uppercase text-[10px]">Real-World Security warning</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    This client is an offline simulation showcasing structural layout. Running tunnels and loading actual rewarded advertisements are governed by Android VpnService & Google AdMob SDK. See <b>Client Mobile Source</b> tab.
                  </p>
                </div>
              </div>

            </div>

            {/* Middle and Right: Premium Litron Mobile VPN Simulated Client Viewport */}
            <div className="lg:col-span-8 flex flex-col bg-[#161B26] border border-white/5 rounded-3xl p-6 relative overflow-hidden items-center justify-center min-h-[600px]">
              
              {/* Background watermark typography */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                <span className="text-[180px] font-black italic">AMNEZIA</span>
              </div>

              {/* Device Frame Wrapper to resemble high-fidelity mobile app */}
              <div className="w-full max-w-[340px] aspect-[9/19.5] bg-[#080A0F] rounded-[48px] border-[6px] border-[#161B26] shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col z-10">
                
                {/* Status Bar / Notch */}
                <div className={`w-full h-8 flex justify-between items-center px-6 relative z-10 text-[10px] text-gray-400 font-semibold font-mono transition-colors duration-1000 ${
                  vpnState === 'connected' 
                    ? 'bg-[#05130C]' 
                    : vpnState === 'connecting'
                      ? 'bg-[#040E14]'
                      : 'bg-[#121214]'
                }`}>
                  <span>9:41</span>
                  {/* Speaker pill notch */}
                  <div className="w-16 h-4 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
                  <div className="flex items-center space-x-1">
                    <span>5G</span>
                    <div className="w-3.5 h-2 border border-gray-400 rounded-sm relative p-0.5">
                      <div className="h-full bg-[#00F0A0] rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Simulated Screen Content - Dynamic color based on states */}
                <div className={`flex-1 px-4 py-5 flex flex-col justify-between relative overflow-hidden select-none transition-all duration-1000 ${
                  vpnState === 'connected' 
                    ? 'bg-[#05130C]' 
                    : vpnState === 'connecting'
                      ? 'bg-[#040E14]'
                      : 'bg-[#121214]'
                }`}>
                  
                  {/* Top Navigation Row */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-sm font-black tracking-tighter italic text-white">LITRON.</span>
                    <button 
                      onClick={() => setIsSplitTunnelOpen(true)}
                      className="p-1.5 bg-[#161B26] hover:bg-white/10 rounded-xl border border-white/5 text-white transition-colors"
                      title="Per-App Exclusions (Split Tunneling)"
                    >
                      <Layers size={14} />
                    </button>
                  </div>

                  {/* Server Selection Drawer Trigger Button */}
                  <div className="relative z-10 my-2">
                    <button 
                      onClick={() => setIsServerSheetOpen(true)}
                      className="w-full bg-[#161B26] border border-white/5 hover:border-[#00F0A0]/20 rounded-xl p-3 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-2.5 text-left">
                        <span className="text-xl leading-none">{selectedServer.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{selectedServer.name}</div>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedServer.quality === 'fast' ? 'bg-[#00F0A0]' : selectedServer.quality === 'medium' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            <span className="text-[9px] text-gray-400 font-mono">Ping: {selectedServer.quality === 'fast' ? '18ms' : selectedServer.quality === 'medium' ? '45ms' : '120ms'}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">▼</span>
                    </button>
                  </div>

                  {/* The central giant power button section */}
                  <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                    
                    {/* Ring aura around the button with pulsing dynamics */}
                    <div className="relative flex items-center justify-center">
                      
                      {/* Pulse Waveform outer */}
                      <AnimatePresence>
                        {vpnState === 'connecting' && (
                          <motion.div 
                            key="connecting-pulse"
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                            className="absolute w-44 h-44 rounded-full border-2 border-cyan-400/30"
                          />
                        )}
                        {vpnState === 'connected' && (
                          <motion.div 
                            key="connected-pulse"
                            initial={{ scale: 0.9, opacity: 0.3 }}
                            animate={{ scale: 1.3, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="absolute w-44 h-44 rounded-full border-2 border-[#00F0A0]/20"
                          />
                        )}
                      </AnimatePresence>

                      {/* Power button base background with dynamic border and shadow */}
                      <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 ${
                        vpnState === 'connected' 
                          ? 'bg-[#00F0A0]/5 border border-[#00F0A0]/30 shadow-[0_0_35px_rgba(0,240,160,0.15)]' 
                          : vpnState === 'connecting' 
                            ? 'bg-[#00E5FF]/5 border border-[#00E5FF]/30 shadow-[0_0_35px_rgba(0,229,255,0.15)]'
                            : 'bg-[#F59E0B]/5 border border-[#F59E0B]/30 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
                      }`}>
                        
                        <button 
                          onClick={toggleVpn}
                          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer ${
                            vpnState === 'connected' 
                              ? 'bg-[#00F0A0] text-[#080A0F]' 
                              : vpnState === 'connecting' 
                                ? 'bg-[#00E5FF] text-[#080A0F]'
                                : 'bg-[#F59E0B] text-white'
                          }`}
                        >
                          {vpnState === 'connected' ? (
                            <>
                              <svg className="w-10 h-10 text-[#080A0F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                              <span className="text-[#080A0F] text-[9px] font-black tracking-widest mt-1">DISCONNECT</span>
                            </>
                          ) : vpnState === 'connecting' ? (
                            <>
                              <RefreshCw className="w-10 h-10 text-[#080A0F] animate-spin" />
                              <span className="text-[#080A0F] text-[9px] font-black tracking-widest mt-1">ROUTING...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                              </svg>
                              <span className="text-white text-[9px] font-black tracking-widest mt-1">CONNECT</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                    {/* Status Texts under button */}
                    <div className="text-center mt-5">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${vpnState === 'connected' ? 'bg-[#00F0A0] shadow-[0_0_10px_#00F0A0]' : vpnState === 'connecting' ? 'bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]' : 'bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]'}`}></span>
                        <div className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors ${
                          vpnState === 'connected' ? 'text-[#00F0A0]' : vpnState === 'connecting' ? 'text-[#00E5FF]' : 'text-[#F59E0B]'
                        }`}>
                          {vpnState === 'connected' ? 'SECURED & ENCRYPTED' : vpnState === 'connecting' ? 'ESTABLISHING...' : 'UNPROTECTED'}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 max-w-[180px] mx-auto leading-relaxed">
                        {vpnState === 'connected' ? 'Location and IP safely masked' : vpnState === 'connecting' ? 'Configuring interfaces...' : 'Tap keys to secure routing'}
                      </div>
                    </div>

                  </div>

                  {/* Ad-Supported Rewarded Countdown Timer Unit */}
                  <div className="bg-[#161B26] border border-white/5 rounded-2xl p-4 text-center relative z-10">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-1">
                      Connection Time Remaining
                    </div>
                    <div className="font-mono text-3xl font-bold tracking-tighter text-white py-1">
                      {formatDuration(timeRemaining)}
                    </div>
                    
                    <button 
                      onClick={handleAddMinutes}
                      className="mt-3 w-full bg-white text-[#080A0F] hover:bg-[#00F0A0] text-[10px] font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <span className="bg-[#080A0F] text-white px-1.5 py-0.5 rounded text-[9px] font-bold">+2H</span>
                      <span>WATCH FREE AD TO ADD TIME</span>
                    </button>
                  </div>

                  {/* SERVER DRAWER SHEET (Simulated Slide Up Drawer) */}
                  <AnimatePresence>
                    {isServerSheetOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsServerSheetOpen(false)}
                          className="absolute inset-0 bg-black/70 z-20"
                        />
                        <motion.div 
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          className="absolute bottom-0 left-0 right-0 bg-[#161B26] border-t border-white/10 rounded-t-[32px] p-5 z-30 max-h-[75%] overflow-y-auto flex flex-col"
                        >
                          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                          <div className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">
                            SELECT OPTIMAL HUB
                          </div>
                          
                          <div className="space-y-2 overflow-y-auto pr-1">
                            {servers.map(srv => {
                              const isSelected = selectedServer.id === srv.id;
                              return (
                                <button
                                  key={srv.id}
                                  onClick={() => handleSelectServer(srv)}
                                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                    isSelected 
                                      ? 'bg-[#080A0F] border-[#00F0A0]/30 text-white font-bold' 
                                      : 'bg-[#080A0F]/60 border-transparent text-gray-300 hover:border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <span className="text-2xl leading-none">{srv.flag}</span>
                                    <div>
                                      <div className="text-xs font-bold">{srv.name}</div>
                                      <div className="flex items-center space-x-1.5 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${srv.quality === 'fast' ? 'bg-[#00F0A0]' : srv.quality === 'medium' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                                        <span className="text-[8px] text-gray-400 font-mono">Speed: {srv.quality.toUpperCase()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={14} className="text-[#00F0A0]" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* SPLIT TUNNELING EXCLUSIONS LIST (Simulated App List Toggle) */}
                  <AnimatePresence>
                    {isSplitTunnelOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsSplitTunnelOpen(false)}
                          className="absolute inset-0 bg-black/70 z-20"
                        />
                        <motion.div 
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          className="absolute bottom-0 left-0 right-0 bg-[#161B26] border-t border-white/10 rounded-t-[32px] p-5 z-30 h-[85%] flex flex-col"
                        >
                          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] px-1">
                              Split Tunnel Apps
                            </span>
                            <button onClick={() => setIsSplitTunnelOpen(false)} className="text-xs text-[#00F0A0] font-black uppercase">Done</button>
                          </div>
                          
                          <input 
                            type="text" 
                            placeholder="Search system packages..."
                            value={searchAppQuery}
                            onChange={e => setSearchAppQuery(e.target.value)}
                            className="bg-[#080A0F] text-xs border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0A0]/50 mb-4 transition-colors"
                          />

                          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredApps.map(app => (
                              <div 
                                key={app.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-[#080A0F] border border-white/5"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{app.icon}</span>
                                  <div>
                                    <div className="text-xs font-bold text-white">{app.name}</div>
                                    <div className="text-[9px] text-gray-500 font-mono leading-none mt-0.5">{app.packageName}</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => toggleExcludeApp(app.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase border transition-all ${
                                    app.isExcluded 
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                      : 'bg-[#00F0A0]/10 text-[#00F0A0] border-[#00F0A0]/20'
                                  }`}
                                >
                                  {app.isExcluded ? 'EXCLUDE' : 'ROUTED'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                </div>
              </div>

              {/* Watermark instructions */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-[10px] text-gray-500 font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="inline-block w-1.5 h-1.5 bg-[#00F0A0] rounded-full animate-ping" />
                <span>Simulated Client Active</span>
              </div>

            </div>

          </>
        )}

        {/* TAB 2: SYSTEM SETUP SCRIPT GENERATOR */}
        {activeTab === 'server' && (
          <div className="lg:col-span-12 flex flex-col space-y-6">
            
            <div className="bg-[#161B26] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2.5">
                  <Terminal className="text-[#00F0A0]" size={20} />
                  <span>Automated Setup Script Generator (`setup-vpn.sh`)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Ready to deploy directly on fresh Ubuntu instances. Uses native Docker containers, WireGuard kernel interfaces, and optimizes core Linux network variables.
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(scriptContent, 'Ubuntu Setup Script')}
                  className="bg-[#00F0A0] text-[#080A0F] font-black text-xs px-5 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-[#00F0A0]/10 hover:bg-[#00f0a0]/90 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copy Bash Script</span>
                </button>
              </div>
            </div>

            {/* Config & Code Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Settings tuning panel on the left */}
              <div className="lg:col-span-4 bg-[#161B26] border border-white/5 rounded-3xl p-6 space-y-5">
                <h3 className="font-black text-xs text-white tracking-[0.15em] uppercase">Script Variables</h3>
                <p className="text-xs text-gray-400 leading-relaxed">Adjust below configurations. Changes compile immediately within the system script block shown to the right.</p>

                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">AmneziaWG UDP Port</label>
                    <input 
                      type="number" 
                      value={config.port} 
                      onChange={e => setConfig({...config, port: parseInt(e.target.value) || 51820})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">Shadowsocks SS-2022 Port</label>
                    <input 
                      type="number" 
                      value={config.ssPort} 
                      onChange={e => setConfig({...config, ssPort: parseInt(e.target.value) || 8388})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">DNS Nameserver</label>
                    <input 
                      type="text" 
                      value={config.dnsServer} 
                      onChange={e => setConfig({...config, dnsServer: e.target.value})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">MTU Packet Size</label>
                    <input 
                      type="number" 
                      value={config.mtu} 
                      onChange={e => setConfig({...config, mtu: parseInt(e.target.value) || 1420})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-extrabold mb-1.5">Tunnel Name Identifier</label>
                    <input 
                      type="text" 
                      value={config.tunnelName} 
                      onChange={e => setConfig({...config, tunnelName: e.target.value})}
                      className="w-full bg-[#080A0F] border border-white/5 focus:border-[#00F0A0]/50 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 text-xs text-gray-400 space-y-2.5">
                  <div className="flex items-center space-x-1.5 font-bold text-white">
                    <Cpu size={14} className="text-[#00F0A0]" />
                    <span className="uppercase tracking-wider text-[10px]">Oracle Always-Free Specs</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] leading-relaxed">
                    <li>Supports ARM64 Ampere A1 (up to 4 OCPUs, 24 GB RAM)</li>
                    <li>Highly optimized kernel sysctl buffers</li>
                    <li>Includes auto NAT forwarding Rules</li>
                  </ul>
                </div>
              </div>

              {/* Script code code viewport on the right */}
              <div className="lg:col-span-8 flex flex-col bg-[#161B26] border border-white/5 rounded-3xl overflow-hidden min-h-[500px]">
                <div className="bg-[#080A0F] px-5 py-3 border-b border-white/5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                    <span className="text-gray-400 pl-2">setup-vpn.sh</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(scriptContent, 'Ubuntu Setup Script')}
                    className="text-gray-400 hover:text-[#00F0A0] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                </div>
                
                <div className="flex-1 p-5 font-mono text-xs overflow-auto bg-[#080A0F] leading-relaxed text-[#00F0A0]/90 whitespace-pre">
                  {scriptContent}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CLIENT SOURCE CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="lg:col-span-12 flex flex-col space-y-6">
            
            <div className="bg-[#161B26] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2.5">
                  <Smartphone className="text-[#00F0A0]" size={20} />
                  <span>Litron-Inspired Mobile Client Source Code Engine</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Explore production-grade native client architectures executing VPN interface routing, per-app split tunnel checks, and dynamic countdown ads triggers.
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(codeSubTab === 'ui' ? mobileDashboardCode : mobileLogicCode, codeSubTab === 'ui' ? 'Flutter UI Code' : 'Kotlin Network Logic')}
                  className="bg-[#00F0A0] text-[#080A0F] font-black text-xs px-5 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-[#00F0A0]/10 hover:bg-[#00F0A0]/90 transition-all active:scale-95 cursor-pointer"
                >
                  <Copy size={14} />
                  <span>Copy Source Code</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Sub-tab sidebar switcher */}
              <div className="lg:col-span-3 bg-[#161B26] border border-white/5 rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-xs text-white tracking-[0.15em] uppercase">Select Module</h3>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => setCodeSubTab('ui')}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-3 cursor-pointer ${
                      codeSubTab === 'ui' 
                        ? 'bg-[#00F0A0]/10 border-[#00F0A0]/30 text-white' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <FileCode size={16} className={codeSubTab === 'ui' ? 'text-[#00F0A0]' : 'text-gray-500'} />
                    <div>
                      <div className="text-xs font-bold">Flutter Home Dashboard</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Mobile Frontend Declarative UI</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCodeSubTab('network')}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-3 cursor-pointer ${
                      codeSubTab === 'network' 
                        ? 'bg-[#00F0A0]/10 border-[#00F0A0]/30 text-white' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Cpu size={16} className={codeSubTab === 'network' ? 'text-[#00F0A0]' : 'text-gray-500'} />
                    <div>
                      <div className="text-xs font-bold">Kotlin System VpnService</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Routing & Split Tunnel Controller</div>
                    </div>
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2.5">
                  <div className="text-[10px] font-black text-white uppercase tracking-wider">Features Implemented:</div>
                  <ul className="text-[11px] text-gray-400 space-y-2 list-disc pl-4 leading-relaxed">
                    <li><b>One-Tap Haptic:</b> Central power key pulse trigger sequences.</li>
                    <li><b>Split Tunnel:</b> Android-level disallowed application packing.</li>
                    <li><b>Dynamic Ads:</b> Google AdMob Rewarded SDK listeners.</li>
                  </ul>
                </div>
              </div>

              {/* Code Editor Frame */}
              <div className="lg:col-span-9 flex flex-col bg-[#161B26] border border-white/5 rounded-3xl overflow-hidden min-h-[500px]">
                <div className="bg-[#080A0F] px-5 py-3 border-b border-white/5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <FileCode size={14} className="text-[#00F0A0]" />
                    <span className="text-gray-300 font-semibold">{codeSubTab === 'ui' ? 'dashboard_screen.dart (Flutter)' : 'LitronVpnService.kt (Kotlin)'}</span>
                  </div>
                  <button 
                    onClick={() => handleCopy(codeSubTab === 'ui' ? mobileDashboardCode : mobileLogicCode, codeSubTab === 'ui' ? 'Flutter UI' : 'Kotlin Logic')}
                    className="text-gray-400 hover:text-[#00F0A0] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="flex-1 p-5 font-mono text-xs overflow-auto bg-[#080A0F] leading-relaxed text-gray-300/95 whitespace-pre">
                  {codeSubTab === 'ui' ? mobileDashboardCode : mobileLogicCode}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer copyright and instructions */}
      <footer className="border-t border-white/5 bg-[#080A0F] py-6 px-6 mt-12 text-center">
        <p className="text-xs text-gray-500">© 2026 Litron VPN Architect. Built with Google AI Studio. System code conforms to secure Android VpnService & AmneziaWG obfuscation protocols.</p>
        <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#00F0A0] mt-2">Protocol: AmneziaWG & Shadowsocks (SS-2022) • Obfuscation Active</p>
      </footer>

    </div>
  );
}
