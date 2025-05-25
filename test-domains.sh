#!/bin/bash

echo "=== Testing Domain Resolution ==="
echo "Testing www.chatrix.xyz..."
nslookup www.chatrix.xyz
echo
echo "Testing www.www.chatrix.xyz..."
nslookup www.www.chatrix.xyz
echo
echo "Testing bojansof.ddns.net..."
nslookup bojansof.ddns.net

echo
echo "=== Testing HTTP Connectivity ==="
echo "Testing www.chatrix.xyz..."
curl -I http://www.chatrix.xyz
echo
echo "Testing www.www.chatrix.xyz..."
curl -I http://www.www.chatrix.xyz
echo
echo "Testing bojansof.ddns.net..."
curl -I http://bojansof.ddns.net

echo
echo "=== Testing WebSocket Port ==="
echo "Testing port 3001 on www.chatrix.xyz..."
nc -zv www.chatrix.xyz 3001 