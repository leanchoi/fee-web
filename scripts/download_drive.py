import urllib.request
import re
import json
import os

url = "https://drive.google.com/drive/folders/1hfDSYLXQmfKl4ID6dkSaZZy0wzDM812q?usp=sharing"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})

out_dir = os.path.join(os.getcwd(), "downloaded_images")
os.makedirs(out_dir, exist_ok=True)

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        
        # Look for _DRIVE_BOOTSTRAP_DATA or init data in HTML
        print("HTML length:", len(html))
        
        # Look for file items
        file_pattern = re.findall(r'\["([a-zA-Z0-9_-]{28,35})",\["([^"]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))"', html)
        print("Matches found (id, filename):", len(file_pattern))
        for fid, fname in file_pattern:
            print(f"File: {fname} -> {fid}")
            
        if not file_pattern:
            # Alternate search
            filenames = re.findall(r'\["([^"]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))"', html)
            print("Found filenames:", filenames)
            ids = re.findall(r'https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)', html)
            print("Found links:", ids)
except Exception as e:
    print("Error:", e)
