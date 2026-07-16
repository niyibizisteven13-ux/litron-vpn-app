export interface VpnConfig {
  server_id: string;
  server_name: string;
  endpoint_ip: string;
  endpoint_port: number;
  server_public_key: string;
  client_private_key: string;
  client_address: string;
  preshared_key?: string;
  dns: string;
}

export type ChameleonState = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export async function fetchAllVpnProfiles(): Promise<VpnConfig[]> {
  const rawConfigUrl = "/server-config.json";
  const CACHE_KEY = "litron_cached_vpn_profiles";
  try {
    const response = await fetch(rawConfigUrl);
    if (!response.ok) throw new Error("Public network synchronization failed");

    const data = await response.json();
    const list: VpnConfig[] = Array.isArray(data) ? data : [data];
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn("Using offline fallback cache node...", error);
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
