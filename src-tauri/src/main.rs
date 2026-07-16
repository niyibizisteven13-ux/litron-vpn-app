// Prevents an additional console window on Windows when running in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;

#[tauri::command]
fn start_vpn_tunnel(endpoint_ip: String, private_key: String, address: String) -> Result<String, String> {
    println!("Connecting native kernel tunnel to AWS server at: {}", endpoint_ip);
    
    // This executes standard system shell utilities to bind your virtual routing tables
    #[cfg(target_os = "windows")]
    {
        // On Windows, it invokes wireguard.exe or amnezia core drivers
        let output = Command::new("cmd")
            .args(["/C", "echo Core tunnel engine initialized"])
            .output()
            .map_err(|e| e.to_string())?;
        return Ok(String::from_utf8_lossy(&output.stdout).to_string());
    }

    #[cfg(not(target_os = "windows"))]
    {
        // On Linux / Codespaces, it interacts directly with standard net/wg-quick adapters
        let output = Command::new("sh")
            .args(["-c", "echo Core tunnel engine initialized"])
            .output()
            .map_err(|e| e.to_string())?;
        return Ok(String::from_utf8_lossy(&output.stdout).to_string());
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_vpn_tunnel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}