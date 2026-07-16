export interface VpnConfig {
  server_id: string;
  server_name: string;
  country_code: string;
  endpoint_ip: string;
  endpoint_port: number;
  server_public_key: string;
  dns: string;
  obfuscation: {
    jc: number;
    jv: number;
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    s1: number;
    s2: number;
  };
}

export type ChameleonState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

export async function fetchAllVpnProfiles(): Promise<VpnConfig[]> {
  const rawConfigUrl = "https://githubusercontent.com";
  const CACHE_KEY = "litron_cached_vpn_array";

  try {
    const response = await fetch(rawConfigUrl);
    if (!response.ok) throw new Error("Multi-server sync failed");
    
    const serverList: VpnConfig[] = await response.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(serverList));
    return serverList;
  } catch (error) {
    console.warn("Pulling server network layout map from local cache memory...", error);
    const cachedData = localStorage.getItem(CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : [];
  }
}

export class VpnTimerManager {
  private static STORAGE_KEY = "litron_tunnel_balance_seconds";
  
  static getRemainingTime(): number {
    const savedTime = localStorage.getItem(this.STORAGE_KEY);
    return savedTime ? parseInt(savedTime, 10) : 0;
  }

  static saveRemainingTime(seconds: number) {
    localStorage.setItem(this.STORAGE_KEY, seconds.toString());
  }

  static addRewardTime(): number {
    const currentBalance = this.getRemainingTime();
    const newBalance = currentBalance + 7200;
    this.saveRemainingTime(newBalance);
    return newBalance;
  }
}
