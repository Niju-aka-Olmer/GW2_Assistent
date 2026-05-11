cd /home/vovka/GW2_Assist
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "vite --port 3000" 2>/dev/null
sleep 2
cd /home/vovka/GW2_Assist/backend && nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info > /tmp/backend.log 2>&1 &
sleep 2
cd /home/vovka/GW2_Assist/frontend && nohup npx vite --port 3000 --host > /tmp/frontend.log 2>&1 &
echo "Restarted OK"
