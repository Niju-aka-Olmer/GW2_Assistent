import subprocess
result = subprocess.run(['cat', '/tmp/gw2_backend.log'], capture_output=True, text=True)
lines = result.stdout.split('\n')
for line in lines:
    if 'error' in line.lower() or 'traceback' in line.lower() or 'exception' in line.lower():
        print(line)
# Also show last 20 lines
print("=== LAST 20 LINES ===")
for line in lines[-20:]:
    print(line)
