export interface VpnServer {
  id: string;
  name: string;
  countryCode: string;
  flag: string;
  quality: 'fast' | 'medium' | 'slow';
  ip: string;
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  isExcluded: boolean;
}

export interface ConfigParams {
  serverIp: string;
  port: number;
  ssPort: number;
  privateKey: string;
  publicKey: string;
  dnsServer: string;
  mtu: number;
  tunnelName: string;
}
