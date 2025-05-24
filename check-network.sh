#!/bin/bash

echo "=== Network Configuration Check ==="
echo

# Check server's local IP
echo "Server's local IP:"
ip addr show | grep "inet " | grep -v "127.0.0.1"

echo
echo "=== Port Availability Check ==="
echo "Checking if ports 80 and 3001 are listening:"
netstat -tuln | grep -E ':80|:3001'

echo
echo "=== Docker Container Status ==="
docker ps

echo
echo "=== Testing Local Connectivity ==="
echo "Testing localhost:80..."
curl -I http://localhost:80
echo
echo "Testing localhost:3001..."
curl -I http://localhost:3001

echo
echo "=== External IP Check ==="
echo "Your external IP (as seen by the internet):"
curl -s https://api.ipify.org

echo
echo "=== DNS Resolution Check ==="
echo "Checking DNS resolution for chatrix.xyz:"
nslookup chatrix.xyz

echo
echo "=== No-IP Client Status ==="
systemctl status noip2 || echo "No-IP client not found or not running"

echo
echo "=== Router Configuration Instructions ==="
echo "1. On your ISP Router:"
echo "   - Forward ports 80 and 3001 to your second router's WAN IP"
echo "2. On your second router:"
echo "   - Forward ports 80 and 3001 to your server's local IP"
echo "3. Verify no-ip client is running and updating your domain" 