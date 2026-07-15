export const mobileDashboardCode = `
// ==============================================================================
// Litron VPN - Declarative Flutter UI Implementation for Home Dashboard Screen
// Theme: High-Contrast Dark Slate & Vibrantly Connected Status Colors
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';

class LitronDashboard extends StatefulWidget {
  const LitronDashboard({Key? key}) : super(key: key);

  @override
  _LitronDashboardState createState() => _LitronDashboardState();
}

class _LitronDashboardState extends State<LitronDashboard> with SingleTickerProviderStateMixin {
  // VPN states
  bool isConnected = false;
  bool isConnecting = false;
  
  // Simulation Values
  String activeServerName = "United States - Oregon";
  String activeServerFlag = "🇺🇸";
  String activeServerQuality = "Fast";
  
  // Timer State
  Duration remainingTime = const Duration(hours: 2, minutes: 0, seconds: 0);
  Timer? _countdownTimer;
  
  // Animation Controller for pulsing power button
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (isConnected) {
        if (remainingTime.inSeconds > 0) {
          setState(() {
            remainingTime = remainingTime - const Duration(seconds: 1);
          });
        } else {
          // Tunnel locked / expired sequence
          setState(() {
            isConnected = false;
            isConnecting = false;
          });
          _pulseController.stop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Connection Expired! Watch a free ad to get +2 hours."),
              backgroundColor: Colors.amber,
            ),
          );
        }
      }
    });
  }

  void _toggleConnection() {
    HapticFeedback.mediumImpact();
    
    // Access locked logic if countdown has expired
    if (remainingTime.inSeconds <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Access Locked: No remaining duration. Click 'Add Time' first!"),
          backgroundColor: Colors.amber,
        ),
      );
      return;
    }

    if (isConnected) {
      // Disconnecting
      setState(() {
        isConnected = false;
        isConnecting = false;
      });
      _pulseController.stop();
    } else {
      // Connecting sequence
      setState(() {
        isConnecting = true;
      });
      _pulseController.repeat(reverse: true);
      
      Timer(const Duration(seconds: 2), () {
        if (mounted) {
          if (remainingTime.inSeconds > 0) {
            setState(() {
              isConnecting = false;
              isConnected = true;
            });
          } else {
            setState(() {
              isConnecting = false;
            });
            _pulseController.stop();
          }
        }
      });
    }
  }

  void _addRewardedTime() {
    HapticFeedback.lightImpact();
    // Saves remainingTime securely, in real app triggers AdMob and updates Shared Preferences
    setState(() {
      remainingTime = remainingTime + const Duration(hours: 2);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Success! +2 Hours added safely by supporting us."),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Dynamic color determination based on VPN states
    Color getAccentColor() {
      if (isConnected) return const Color(0xFF00FF87); // Reassuring Emerald Green
      if (isConnecting) return const Color(0xFF00E5FF); // Pulsing Cyan
      return const Color(0xFFFFB300); // Soft Amber
    }

    Color getScreenBackgroundColor() {
      if (isConnected) return const Color(0xFF05130C); // Dark Emerald Green
      if (isConnecting) return const Color(0xFF040E14); // Dark Cyan
      return const Color(0xFF121214); // Deep Dark Grey
    }

    String getStatusTitle() {
      if (isConnected) return "Secured & Encrypted";
      if (isConnecting) return "Establishing Tunnel...";
      return "Your Connection is Unprotected";
    }

    return Scaffold(
      backgroundColor: getScreenBackgroundColor(), // Dynamically update based on connection states
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          "LITRON VPN",
          style: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: 2.0,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.security, color: Colors.white70),
            onPressed: () {},
          )
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 10),
              
              // Server Selector Drawer Launcher Button
              GestureDetector(
                onTap: () => _showServerSelectionSheet(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.1)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(activeServerFlag, style: const TextStyle(fontSize: 22)),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            activeServerName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF00FF87),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                "Ping: \${activeServerQuality}",
                                style: const TextStyle(
                                  color: Colors.white54,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.keyboard_arrow_down, color: Colors.white54),
                    ],
                  ),
                ),
              ),

              const Spacer(),

              // Animated Pulsing Core Tunnel Power Button
              GestureDetector(
                onTap: _toggleConnection,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer pulse glow ring
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Container(
                          width: 220 * _pulseAnimation.value,
                          height: 220 * _pulseAnimation.value,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: getAccentColor().withOpacity(0.04 * (2 - _pulseAnimation.value)),
                          ),
                        );
                      }
                    ),
                    // Middle solid glowing aura
                    Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: getAccentColor().withOpacity(0.1),
                        border: Border.all(
                          color: getAccentColor().withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                    ),
                    // Inner Interactive solid circle button
                    Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF141D33),
                        boxShadow: [
                          BoxShadow(
                            color: getAccentColor().withOpacity(0.4),
                            blurRadius: 30,
                            spreadRadius: 2,
                          )
                        ],
                      ),
                      child: Icon(
                        Icons.power_settings_new,
                        size: 60,
                        color: getAccentColor(),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Shield Status Text Display
              Text(
                getStatusTitle(),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: getAccentColor(),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isConnected 
                    ? "IP Address Hidden • Premium Routing active" 
                    : "Tap the power key to securely route your device",
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white38,
                  fontSize: 13,
                ),
              ),

              const Spacer(),

              // Reward Time Extension Counter Layout (Ad Supported)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF11182D),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  children: [
                    const Text(
                      "CONNECTION DURATION REMAINING",
                      style: TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Digital LCD glow countdown timer
                    Text(
                      _formatDuration(remainingTime),
                      style: TextStyle(
                        fontFamily: 'Courier',
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: getAccentColor(),
                        letterSpacing: 4.0,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Add Time CTA watcher button
                    ElevatedButton.icon(
                      onPressed: _addRewardedTime,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E294B),
                        foregroundColor: const Color(0xFF00FF87),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFF00FF87), width: 1),
                        ),
                      ),
                      icon: const Icon(Icons.play_circle_filled),
                      label: const Text(
                        "+2 HOURS (Watch Free Ad)",
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return "$hours:$minutes:$seconds";
  }

  // Slide-up Server Selection Sheet
  void _showServerSelectionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0E1424),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "SELECT OPTIMAL HUB",
                style: TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  children: [
                    _buildServerItem("United States - Oregon", "🇺🇸", "Fast", true),
                    _buildServerItem("United Kingdom - London", "🇬🇧", "Fast", false),
                    _buildServerItem("Germany - Frankfurt", "🇩🇪", "Medium", false),
                    _buildServerItem("Japan - Tokyo", "🇯🇵", "Medium", false),
                    _buildServerItem("Singapore - Changi", "🇸🇬", "Slow", false),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildServerItem(String name, String flag, String speed, bool isActive) {
    Color getSpeedColor() {
      if (speed == "Fast") return const Color(0xFF00FF87);
      if (speed == "Medium") return const Color(0xFFFFD166);
      return const Color(0xFFFF416C);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF1E294B) : const Color(0xFF141D33),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? const Color(0xFF00FF87).withOpacity(0.3) : Colors.white.withOpacity(0.05),
        ),
      ),
      child: ListTile(
        leading: Text(flag, style: const TextStyle(fontSize: 26)),
        title: Text(
          name,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        subtitle: Row(
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: getSpeedColor(),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              "Speed: $speed",
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            )
          ],
        ),
        trailing: isActive 
            ? const Icon(Icons.check_circle, color: Color(0xFF00FF87))
            : const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.white38),
        onTap: () {
          setState(() {
            activeServerName = name;
            activeServerFlag = flag;
            activeServerQuality = speed;
          });
          Navigator.pop(context);
        },
      ),
    );
  }
}
`;
