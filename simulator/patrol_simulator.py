import sys
import time
import argparse
import requests

BASE_URL = "http://localhost:8000"

# Pre-seeded locations for easy scanner emulation
KNOWN_LOCATIONS = [
    {"name": "North Gate", "tag": "tag_gate_north"},
    {"name": "South Gate", "tag": "tag_gate_south"},
    {"name": "Parking Lot", "tag": "tag_parking"},
    {"name": "Main Lobby", "tag": "tag_lobby"},
    {"name": "Server Room", "tag": "tag_server_room"}
]

def header():
    print("=" * 60)
    print("          NFC PATROL SECURITY LOGGER SIMULATOR           ")
    print("=" * 60)

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

def run_auto_demo():
    header()
    print("[*] Starting automated security patrol walkthrough...")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/login"
    login_data = {"username": "officer1", "password": "officerpass1"}
    try:
        r = requests.post(login_url, data=login_data)
        if r.status_code != 200:
            print(f"[-] Login failed (Code: {r.status_code}): {r.text}")
            return
        token = r.json()["access_token"]
        officer_name = r.json()["username"]
        print(f"[+] Authenticated successfully as '{officer_name}'")
    except Exception as e:
        print(f"[-] Connection error. Is the FastAPI server running on {BASE_URL}? Details: {e}")
        return

    # 2. Check if active session already exists and Auto-End/Clean up it
    try:
        chk = requests.get(f"{BASE_URL}/patrol/active", headers=auth_headers(token))
        if chk.status_code == 200 and chk.json() is not None:
            print("[*] Active patrol session found. Closing previous session first...")
            requests.post(f"{BASE_URL}/patrol/end", headers=auth_headers(token))
            print("[+] Previous session closed.")
    except Exception:
        pass

    # 3. Start Patrol Session
    print("[*] Instantiating new patrol session...")
    start_r = requests.post(f"{BASE_URL}/patrol/start", headers=auth_headers(token))
    if start_r.status_code != 201:
        print(f"[-] Failed to start session: {start_r.text}")
        return
    session = start_r.json()
    session_id = session["id"]
    print(f"[+] Patrol Session #{session_id} successfully created. Status: active")
    
    # 4. Loop scans
    for idx, loc in enumerate(KNOWN_LOCATIONS, 1):
        print(f"\n[*] Officer heading to Checkpoint {idx}/{len(KNOWN_LOCATIONS)}: {loc['name']} ...")
        time.sleep(2) # Enforce a 2-second patrol travel delay
        
        print(f"[*] Scanning NFC Chip (Tag ID: {loc['tag']})...")
        scan_data = {"nfc_tag_id": loc['tag']}
        scan_r = requests.post(f"{BASE_URL}/patrol/scan", json=scan_data, headers=auth_headers(token))
        if scan_r.status_code == 201:
            res = scan_r.json()
            print(f"[+] SCAN LOGGED: Checkpoint '{res['location']['name']}' registered.")
            print(f"    Sequence Order: #{res['sequence_order']} | Timestamp: {res['timestamp']}")
        else:
            print(f"[-] Scan error ({scan_r.status_code}): {scan_r.json().get('detail', scan_r.text)}")

    # 5. End Patrol Session
    time.sleep(1.5)
    print("\n[*] Completing security patrol run...")
    end_r = requests.post(f"{BASE_URL}/patrol/end", headers=auth_headers(token))
    if end_r.status_code == 200:
        res = end_r.json()
        print(f"[+] Patrol session finalized successfully. End time: {res['end_time']} | Status: completed")
    else:
        print(f"[-] End session failed: {end_r.text}")
        
    print("\n[+] Demo patrol dataset populated successfully.")
    print("=" * 60)

def run_interactive():
    token = None
    role = None
    
    while True:
        header()
        if not token:
            print("1. Log in (Officer / Admin)")
            print("2. Run Auto-Demo (Fills patrol sequence data)")
            print("3. Exit")
            opt = input("\nSelect custom option: ").strip()
            
            if opt == "1":
                username = input("Username: ").strip()
                password = input("Password: ").strip()
                try:
                    r = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
                    if r.status_code == 200:
                        res = r.json()
                        token = res["access_token"]
                        role = res["role"]
                        print(f"\n[+] Authentication success! Welcome {res['username']} [{role}]")
                    else:
                        print(f"\n[-] Authentication error: {r.json().get('detail', r.text)}")
                except Exception as e:
                    print(f"\n[-] Server connection failed: {e}")
                input("\nPress enter to continue...")
            elif opt == "2":
                run_auto_demo()
                input("\nPress enter to continue...")
            elif opt == "3":
                break
        else:
            print(f"Logged Status: Active [{role}]")
            print("1. Start Patrol Session")
            print("2. Scan Checkpoint NFC tag")
            print("3. End Patrol Session")
            print("4. Log out")
            print("5. Exit")
            opt = input("\nSelect patrol action: ").strip()
            
            if opt == "1":
                if role != "officer":
                    print("\n[-] Error: Admin cannot perform patrols. Please log in as an Officer.")
                else:
                    try:
                        r = requests.post(f"{BASE_URL}/patrol/start", headers=auth_headers(token))
                        if r.status_code == 201:
                            print(f"\n[+] Patrol session started. Session ID: {r.json()['id']}")
                        else:
                            print(f"\n[-] Error starting session: {r.json().get('detail', r.text)}")
                    except Exception as e:
                        print(f"\n[-] Connection error: {e}")
                input("\nPress enter to continue...")
                
            elif opt == "2":
                if role != "officer":
                    print("\n[-] Error: Admin cannot scan checkpoints.")
                else:
                    print("\nSelect location to simulate NFC scan:")
                    for idx, loc in enumerate(KNOWN_LOCATIONS, 1):
                        print(f"{idx}. {loc['name']} (Tag: {loc['tag']})")
                    print(f"{len(KNOWN_LOCATIONS) + 1}. [Custom tag input]")
                    
                    choice = input("Select number: ").strip()
                    tag_to_send = None
                    
                    try:
                        ch_idx = int(choice) - 1
                        if 0 <= ch_idx < len(KNOWN_LOCATIONS):
                            tag_to_send = KNOWN_LOCATIONS[ch_idx]["tag"]
                        elif ch_idx == len(KNOWN_LOCATIONS):
                            tag_to_send = input("Type custom tag: ").strip()
                    except ValueError:
                        pass
                        
                    if tag_to_send:
                        try:
                            r = requests.post(
                                f"{BASE_URL}/patrol/scan",
                                json={"nfc_tag_id": tag_to_send},
                                headers=auth_headers(token)
                            )
                            if r.status_code == 201:
                                res = r.json()
                                print(f"\n[+] Checkpoint Scanned!")
                                print(f"    Name: {res['location']['name']}")
                                print(f"    Seq: #{res['sequence_order']} | Timestamp: {res['timestamp']}")
                            else:
                                print(f"\n[-] Scan rejected: {r.json().get('detail', r.text)}")
                        except Exception as e:
                            print(f"\n[-] Connection error: {e}")
                    else:
                        print("\n[-] Invalid option selected.")
                input("\nPress enter to continue...")
                
            elif opt == "3":
                if role != "officer":
                    print("\n[-] Error: Workflows restricted to officers.")
                else:
                    try:
                        r = requests.post(f"{BASE_URL}/patrol/end", headers=auth_headers(token))
                        if r.status_code == 200:
                            print(f"\n[+] Patrol completed. End time: {r.json()['end_time']}")
                        else:
                            print(f"\n[-] Error ending patrol: {r.json().get('detail', r.text)}")
                    except Exception as e:
                        print(f"\n[-] Connection error: {e}")
                input("\nPress enter to continue...")
                
            elif opt == "4":
                token = None
                role = None
                print("\n[+] Logged out.")
                input("\nPress enter to continue...")
                
            elif opt == "5":
                break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NFC Security Patrol Simulator Client")
    parser.add_argument("--auto", action="store_true", help="Runs automated patrol loop logs entry generation.")
    args = parser.parse_args()
    
    if args.auto:
        run_auto_demo()
    else:
        run_interactive()
