#!/usr/bin/env python3

import json
import sys
import time
import requests
from requests.auth import HTTPBasicAuth
from urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

NIFI_URL = "https://nifi:8443"
FLOW_FILE = "/flow/NiFi_Flow.json"
NIFI_USER = "admin"
NIFI_PASS = "thinhnguyen123"
MAX_WAIT = 300
WAIT_INTERVAL = 10

def wait_for_nifi():
    """Wait for NiFi to be ready"""
    print("=" * 50)
    print("NiFi Flow Auto-Import Script")
    print("=" * 50)
    print("\nWaiting for NiFi to be ready...")
    
    elapsed = 0
    while elapsed < MAX_WAIT:
        try:
            response = requests.get(
                f"{NIFI_URL}/nifi-api/system-diagnostics",
                auth=HTTPBasicAuth(NIFI_USER, NIFI_PASS),
                verify=False,
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ NiFi is ready! (waited {elapsed}s)")
                return True
        except Exception as e:
            pass
        
        print(f"⏳ Waiting for NiFi... ({elapsed}s/{MAX_WAIT}s)")
        time.sleep(WAIT_INTERVAL)
        elapsed += WAIT_INTERVAL
    
    print(f"❌ ERROR: NiFi did not become ready in time ({elapsed}s)")
    return False

def get_root_process_group_id():
    """Get root process group ID"""
    print("\nGetting root process group ID...")
    try:
        response = requests.get(
            f"{NIFI_URL}/nifi-api/flow/process-groups/root",
            auth=HTTPBasicAuth(NIFI_USER, NIFI_PASS),
            verify=False,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        root_pg_id = data.get("processGroupFlow", {}).get("id")
        
        if not root_pg_id:
            print("❌ ERROR: Could not find root process group ID in response")
            print(f"Response: {json.dumps(data, indent=2)}")
            return None
        
        print(f"✅ Root process group ID: {root_pg_id}")
        return root_pg_id
    except Exception as e:
        print(f"❌ ERROR: Failed to get root process group ID: {e}")
        return None

def read_flow_file():
    """Read flow file"""
    print(f"\nReading flow file: {FLOW_FILE}")
    try:
        with open(FLOW_FILE, 'r', encoding='utf-8') as f:
            flow_data = json.load(f)
        print(f"✅ Flow file read successfully")
        return flow_data
    except FileNotFoundError:
        print(f"❌ ERROR: Flow file not found at {FLOW_FILE}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON in flow file: {e}")
        return None
    except Exception as e:
        print(f"❌ ERROR: Failed to read flow file: {e}")
        return None

def import_flow(root_pg_id, flow_data):
    """Import flow into NiFi"""
    print("\nPreparing flow import payload...")
    
    if "flowContents" not in flow_data:
        print("❌ ERROR: Flow file does not contain 'flowContents'")
        return False
    
    flow_contents = flow_data["flowContents"]
    
    import_payload = {
        "version": 0,
        "processGroupRevision": {
            "version": 0
        },
        "flowContents": flow_contents
    }
    
    print("✅ Flow payload prepared")
    print(f"\nImporting flow into NiFi (root PG: {root_pg_id})...")
    
    try:
        response = requests.post(
            f"{NIFI_URL}/nifi-api/flow/process-groups/{root_pg_id}/process-groups/import",
            auth=HTTPBasicAuth(NIFI_USER, NIFI_PASS),
            json=import_payload,
            verify=False,
            timeout=30,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Flow imported successfully! (HTTP {response.status_code})")
            print("\nResponse:")
            try:
                response_data = response.json()
                print(json.dumps(response_data, indent=2))
            except:
                print(response.text)
            print("\n" + "=" * 50)
            print("✅ Import completed successfully!")
            print("=" * 50)
            return True
        else:
            print(f"❌ ERROR: Flow import failed (HTTP {response.status_code})")
            print("Response:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
    except Exception as e:
        print(f"❌ ERROR: Exception during import: {e}")
        return False

def main():
    if not wait_for_nifi():
        sys.exit(1)
    
    root_pg_id = get_root_process_group_id()
    if not root_pg_id:
        sys.exit(1)
    
    flow_data = read_flow_file()
    if not flow_data:
        sys.exit(1)
    
    if not import_flow(root_pg_id, flow_data):
        sys.exit(1)
    
    print("\n✅ All done!")
    sys.exit(0)

if __name__ == "__main__":
    main()
