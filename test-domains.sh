#!/bin/bash

echo "=== Testing Domain Resolution ==="
echo "Testing chatrix.xyz..."
nslookup chatrix.xyz
echo
echo "Testing www.chatrix.xyz..."
nslookup www.chatrix.xyz
echo
echo "Testing bojansof.ddns.net..."
nslookup bojansof.ddns.net

echo
echo "=== Testing HTTP Connectivity ==="
echo "Testing chatrix.xyz..."
curl -I http://chatrix.xyz
echo
echo "Testing www.chatrix.xyz..."
curl -I http://www.chatrix.xyz
echo
echo "Testing bojansof.ddns.net..."
curl -I http://bojansof.ddns.net

echo
echo "=== Testing WebSocket Port ==="
echo "Testing port 3001 on chatrix.xyz..."
nc -zv chatrix.xyz 3001 