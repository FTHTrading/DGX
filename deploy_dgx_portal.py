#!/usr/bin/env python3
r"""
Deploy DGX Global Gold Sovereign L1 Web Platform to Cloudflare Pages
Uses canonical token from C:\Users\Kevan\OneDrive - FTH Trading\11-Downloads\cloudflare.env
Target Project: unykorn-gold-portal (Custom Domains: gold.unykorn.org, xrplmint.unykorn.ai)
"""

import os
import sys
import subprocess

ENV_PATH = r"C:\Users\Kevan\OneDrive - FTH Trading\11-Downloads\cloudflare.env"
GLOBAL_ENV_PATH = r"C:\Users\Kevan\.gemini\config\cloudflare.env"
DIST_DIR = r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\DGX\web"
PROJECT_NAME = "unykorn-gold-portal"
ACCOUNT_ID = "07bcc4a189ef176261b818409c95891f"

def extract_token():
    for p in [GLOBAL_ENV_PATH, ENV_PATH]:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("cfut_"):
                        return line
                    if "Bearer " in line:
                        parts = line.split("Bearer ")
                        if len(parts) > 1:
                            return parts[1].strip().strip('"').strip("'")
    return os.environ.get("CLOUDFLARE_API_TOKEN", "")

def main():
    token = extract_token()
    print(f"[*] Deploying DGX Web Portal to Cloudflare Pages project '{PROJECT_NAME}'...")
    print(f"[*] Token: {token[:10]}...{token[-6:]}")

    env = os.environ.copy()
    env["CLOUDFLARE_API_TOKEN"] = token
    env["CLOUDFLARE_ACCOUNT_ID"] = ACCOUNT_ID

    cmd = [
        "npx", "-y", "wrangler", "pages", "deploy",
        DIST_DIR,
        f"--project-name={PROJECT_NAME}",
        "--branch=main",
        "--commit-dirty=true"
    ]

    print(f"[*] Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=env, shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    
    print("--- WRANGLER OUTPUT ---")
    print(result.stdout.encode("ascii", "replace").decode("ascii"))
    if result.stderr:
        print("STDERR:", result.stderr.encode("ascii", "replace").decode("ascii"))

    if result.returncode == 0:
        print("\n[OK] DEPLOYMENT SUCCESSFUL!")
        print(f"[+] Custom Domain: https://gold.unykorn.org")
        print(f"[+] Pages URL: https://{PROJECT_NAME}.pages.dev")
    else:
        print(f"\n[!] Deployment exited with code {result.returncode}")

if __name__ == "__main__":
    main()
