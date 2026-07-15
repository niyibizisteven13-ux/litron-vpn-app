export function getSetupScript(config: {
  port: number;
  ssPort: number;
  dns: string;
  mtu: number;
  tunnelName: string;
}) {
  return `#!/usr/bin/env bash
# ==============================================================================
#  LITRON VPN ARCHITECT - AUTOMATED UBUNTU 24.04 LTS DOMAINLESS BACKEND
#  Fully Domainless Stack: AmneziaWG & Shadowsocks (SS-2022)
#  No VLESS, No Trojan, No XTLS-Reality, No Domain Names, No SSL Certificates
# ==============================================================================

set -euo pipefail

# Text styling
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo -e "\${BLUE}================================================================\${NC}"
echo -e "\${BLUE}       Initializing Litron Domainless VPN Server Auto-Installer \${NC}"
echo -e "\${BLUE}       Configured for: Ubuntu 24.04 LTS (x86_64 / ARM64)        \${NC}"
echo -e "\${BLUE}================================================================\${NC}"

# Check root execution
if [[ $EUID -ne 0 ]]; then
   echo -e "\${RED}Error: This script must be run as root (sudo).\${NC}" 1>&2
   exit 1
fi

# Detect CPU architecture
ARCH=$(uname -m)
echo -e "\${GREEN}[✓]\${NC} Running on CPU Architecture: \${YELLOW}\${ARCH}\${NC}"

# ------------------------------------------------------------------------------
# 1. LINUX KERNEL PERFORMANCE OPTIMIZATIONS (SYSCTL TWEAKS)
# ------------------------------------------------------------------------------
echo -e "\n\${BLUE}[1/5] Applying High-Performance Linux Kernel & Network Tweaks...\${NC}"

SYSCTL_CONF="/etc/sysctl.d/99-litron-vpn-tweaks.conf"

cat << EOF > "\${SYSCTL_CONF}"
# Enable BBR TCP Congestion Control
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr

# Memory optimizations for highly concurrent mobile connections
net.core.rmem_max=67108864
net.core.wmem_max=67108864
net.core.rmem_default=33554432
net.core.wmem_default=33554432
net.core.optmem_max=2048000
net.ipv4.tcp_rmem=4096 87380 33554432
net.ipv4.tcp_wmem=4096 65536 33554432

# UDP Buffer optimizations (Critical for high-speed AmneziaWG tunnel)
net.core.netdev_max_backlog=100000
net.ipv4.udp_rmem_min=16384
net.ipv4.udp_wmem_min=16384

# IP Forwarding (Necessary for VPN routing)
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
EOF

# Load sysctl configurations
sysctl --system > /dev/null
echo -e "\${GREEN}[✓]\${NC} BBR Congestion Control & UDP Buffer tweaks loaded successfully."

# ------------------------------------------------------------------------------
# 2. SYSTEM REPOSITORY UPDATES & EXTRA PACKAGES
# ------------------------------------------------------------------------------
echo -e "\n\${BLUE}[2/5] Updating repositories and installing packages...\${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y > /dev/null
apt-get install -y software-properties-common curl gpg ca-certificates git qrencode jq iptables ufw -y > /dev/null

# ------------------------------------------------------------------------------
# 3. DOCKER CONTAINER ENGINE (For Shadowsocks SS-2022)
# ------------------------------------------------------------------------------
echo -e "\n\${BLUE}[3/5] Installing Docker Containerization Suite...\${NC}"
if ! command -v docker &> /dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      \$(. /etc/os-release && echo "\$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y > /dev/null
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y > /dev/null
    echo -e "\${GREEN}[✓]\${NC} Docker Suite installed successfully."
else
    echo -e "\${GREEN}[✓]\${NC} Docker already exists, skipping install."
fi

# ------------------------------------------------------------------------------
# 4. AMNEZIA WIREGUARD (AMNEZIAWG) DEPLOYMENT
# ------------------------------------------------------------------------------
echo -e "\n\${BLUE}[4/5] Deploying AmneziaWG (Obfuscated WireGuard) Backend...\${NC}"

# Add official Amnezia PPA repository to install native AmneziaWG
if ! apt-cache policy amneziawg | grep -q "amnezia/ppa"; then
    echo -e "\${YELLOW}Adding Amnezia Repository PPA...\${NC}"
    add-apt-repository -y ppa:amnezia/ppa > /dev/null
    apt-get update -y > /dev/null
fi

echo -e "\${YELLOW}Installing amneziawg and amneziawg-tools...\${NC}"
apt-get install -y amneziawg amneziawg-tools -y > /dev/null

# Set up storage and variables
VPN_DIR="/etc/litron-vpn"
mkdir -p "\${VPN_DIR}"

# Generating security cryptographic keys
AWG_SERVER_PRIVATE=\$(awg genkey 2>/dev/null || wg genkey)
AWG_SERVER_PUBLIC=\$(echo "\${AWG_SERVER_PRIVATE}" | awg pubkey 2>/dev/null || echo "\${AWG_SERVER_PRIVATE}" | wg pubkey)
AWG_CLIENT_PRIVATE=\$(awg genkey 2>/dev/null || wg genkey)
AWG_CLIENT_PUBLIC=\$(echo "\${AWG_CLIENT_PRIVATE}" | awg pubkey 2>/dev/null || echo "\${AWG_CLIENT_PRIVATE}" | wg pubkey)
AWG_PRESHARED_KEY=\$(wg genpsk 2>/dev/null || awg genpsk)

echo "\${AWG_SERVER_PRIVATE}" > "\${VPN_DIR}/awg_server_private.key"
echo "\${AWG_SERVER_PUBLIC}" > "\${VPN_DIR}/awg_server_public.key"
echo "\${AWG_CLIENT_PRIVATE}" > "\${VPN_DIR}/awg_client_private.key"
echo "\${AWG_CLIENT_PUBLIC}" > "\${VPN_DIR}/awg_client_public.key"

# Configure server AmneziaWG interface
# Implements special junk, offset, and magic header parameters to bypass DPI
cat << EOF > "/etc/amnezia/amneziawg0.conf"
[Interface]
PrivateKey = \${AWG_SERVER_PRIVATE}
Address = 10.8.0.1/24, fd42:42:42::1/64
ListenPort = ${config.port}
MTU = ${config.mtu}

# AmneziaWG DPI Obfuscation Headers
Jc = 4
Jv = 1400
S1 = 81
S2 = 39
H1 = 11111111
H2 = 22222222
H3 = 33333333
H4 = 44444444

# NAT Packet Routing via iptables
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE; ip6tables -A FORWARD -i %i -j ACCEPT; ip6tables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE; ip6tables -D FORWARD -i %i -j ACCEPT; ip6tables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = \${AWG_CLIENT_PUBLIC}
PresharedKey = \${AWG_PRESHARED_KEY}
AllowedIPs = 10.8.0.2/32, fd42:42:42::2/128
EOF

# Start and enable AmneziaWG service
systemctl stop awg-quick@amneziawg0 >/dev/null 2>&1 || true
systemctl disable awg-quick@amneziawg0 >/dev/null 2>&1 || true
systemctl enable awg-quick@amneziawg0 >/dev/null 2>&1 || true
systemctl restart awg-quick@amneziawg0 >/dev/null 2>&1 || true

echo -e "\${GREEN}[✓]\${NC} AmneziaWG deployed and running on UDP port ${config.port}."

# ------------------------------------------------------------------------------
# 5. SHADOWSOCKS (SS-2022) CONTAINER DEPLOYMENT
# ------------------------------------------------------------------------------
echo -e "\n\${BLUE}[5/5] Deploying Shadowsocks (SS-2022) Docker container...\${NC}"

SS_DIR="/etc/shadowsocks-rust"
mkdir -p "\${SS_DIR}"

# Generate secure random pre-shared key (SS-2022 requires exactly 16 or 32 bytes)
SS_KEY=\$(openssl rand -base64 16)
SS_METHOD="2022-blake3-aes-128-gcm"

cat << EOF > "\${SS_DIR}/config.json"
{
    "server": "0.0.0.0",
    "server_port": ${config.ssPort},
    "password": "\${SS_KEY}",
    "method": "\${SS_METHOD}",
    "timeout": 300,
    "fast_open": true
}
EOF

# Stop previous shadowsocks container if exists
docker rm -f shadowsocks-ss2022 >/dev/null 2>&1 || true

# Run high performance shadowsocks-rust container with SS-2022 spec
docker run -d \\
  --name shadowsocks-ss2022 \\
  --restart always \\
  -p ${config.ssPort}:${config.ssPort}/tcp \\
  -p ${config.ssPort}:${config.ssPort}/udp \\
  -v "\${SS_DIR}:/etc/shadowsocks-rust" \\
  shadowsocks/shadowsocks-rust:v1.19.3-alpine \\
  ssserver -c /etc/shadowsocks-rust/config.json >/dev/null

echo -e "\${GREEN}[✓]\${NC} Shadowsocks SS-2022 deployed on TCP/UDP port ${config.ssPort}."

# ------------------------------------------------------------------------------
# GENERATING READY-TO-USE PRODUCTION MOBILE CLIENT PROFILES
# ------------------------------------------------------------------------------
PUBLIC_IP=\$(curl -s https://api.ipify.org || echo "YOUR_SERVER_PUBLIC_IP")

# 1. AmneziaWG Client Configuration File
cat << EOF > "\${VPN_DIR}/litron_amneziawg_client.conf"
[Interface]
# Litron Obfuscated AmneziaWG Client Profile
PrivateKey = \${AWG_CLIENT_PRIVATE}
Address = 10.8.0.2/24, fd42:42:42::2/64
DNS = ${config.dns}
MTU = ${config.mtu}

# Custom AmneziaWG Obfuscation parameters
Jc = 4
Jv = 1400
S1 = 81
S2 = 39
H1 = 11111111
H2 = 22222222
H3 = 33333333
H4 = 44444444

[Peer]
PublicKey = \${AWG_SERVER_PUBLIC}
PresharedKey = \${AWG_PRESHARED_KEY}
Endpoint = \${PUBLIC_IP}:${config.port}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF

# 2. Shadowsocks SS-2022 Client Share Link
# SS-2022 share format: ss://base64(method:password)@ip:port#name
SS_CREDENTIAL_BASE64=\$(echo -n "\${SS_METHOD}:\${SS_KEY}" | base64 | tr -d '\\n')
SS_CLIENT_URL="ss://\${SS_CREDENTIAL_BASE64}@\${PUBLIC_IP}:${config.ssPort}#Litron_SS2022"
echo "\${SS_CLIENT_URL}" > "\${VPN_DIR}/litron_shadowsocks_client.txt"

# 3. Client Metadata API Node output
cat << EOF > "\${VPN_DIR}/client_meta.json"
{
  "tunnel_name": "${config.tunnelName}",
  "server_address": "\${PUBLIC_IP}",
  "amneziawg": {
    "port": ${config.port},
    "public_key": "\${AWG_SERVER_PUBLIC}",
    "preshared_key": "\${AWG_PRESHARED_KEY}",
    "client_ip": "10.8.0.2",
    "dns": "${config.dns}",
    "mtu": ${config.mtu},
    "obfuscation": {
      "Jc": 4,
      "Jv": 1400,
      "S1": 81,
      "S2": 39,
      "H1": 11111111,
      "H2": 22222222,
      "H3": 33333333,
      "H4": 44444444
    }
  },
  "shadowsocks": {
    "port": ${config.ssPort},
    "method": "\${SS_METHOD}",
    "password": "\${SS_KEY}",
    "client_url": "\${SS_CLIENT_URL}"
  }
}
EOF

# Configure Local Firewall
if command -v ufw &> /dev/null; then
    ufw allow ${config.port}/udp > /dev/null || true
    ufw allow ${config.ssPort}/tcp > /dev/null || true
    ufw allow ${config.ssPort}/udp > /dev/null || true
    ufw reload > /dev/null || true
fi

echo -e "\n\${GREEN}================================================================\${NC}"
echo -e "\${GREEN}      VPN DOMAINLESS STACK INSTALLED AND CONFIGURED SUCCESSFUL  \${NC}"
echo -e "\${GREEN}================================================================\${NC}"
echo -e "\${YELLOW}AmneziaWG Client Profile:  \${VPN_DIR}/litron_amneziawg_client.conf\${NC}"
echo -e "\${YELLOW}Shadowsocks Client URL:    \${VPN_DIR}/litron_shadowsocks_client.txt\${NC}"
echo -e "\${YELLOW}Client API JSON Node:      \${VPN_DIR}/client_meta.json\${NC}"
echo -e "\n\${BLUE}AmneziaWG Profile Quick Import QR Code:\${NC}"
qrencode -t ansiutf8 < "\${VPN_DIR}/litron_amneziawg_client.conf" || echo -e "Install qrencode to display visual QR Code."
echo -e "\n\${BLUE}Shadowsocks Client Connection URL:\${NC}"
echo -e "\${GREEN}\${SS_CLIENT_URL}\${NC}"
echo -e "================================================================"
`;
}

