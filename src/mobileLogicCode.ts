export type ChameleonState = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export class VpnTimerManager {
  private static STORAGE_KEY = "litron_rewarded_tunnel_seconds";

  static getRemainingTime(): number {
    const savedTime = localStorage.getItem(this.STORAGE_KEY);
    return savedTime ? parseInt(savedTime, 10) : 0;
  }
  static saveRemainingTime(seconds: number) {
    localStorage.setItem(this.STORAGE_KEY, seconds.toString());
  }
  static addRewardTime(): number {
    const currentBalance = this.getRemainingTime();
    const newBalance = currentBalance + 30 * 60;
    this.saveRemainingTime(newBalance);
    return newBalance;
  }
}
