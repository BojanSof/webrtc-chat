#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${ENV_FILE:-.env}
COMPOSE_BIN=${COMPOSE_BIN:-docker compose}

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file '$ENV_FILE' not found. Create it from .env.example first." >&2
  exit 1
fi

# Load variables from the env file
set -a
source "$ENV_FILE"
set +a

if [ -n "${TURN_EXTERNAL_IP:-}" ]; then
  RESOLVED_IP="$TURN_EXTERNAL_IP"
elif [ -n "${TURN_DDNS_HOST:-}" ]; then
  if ! command -v dig >/dev/null 2>&1; then
    echo "'dig' command is required to resolve TURN_DDNS_HOST. Install dnsutils/bind-utils." >&2
    exit 1
  fi
  RESOLVED_IP=$(dig +short "$TURN_DDNS_HOST" | tail -n1)
  if [ -z "$RESOLVED_IP" ]; then
    echo "Failed to resolve TURN_DDNS_HOST ($TURN_DDNS_HOST) to an IP address." >&2
    exit 1
  fi
else
  {
    echo "Neither TURN_EXTERNAL_IP nor TURN_DDNS_HOST is set in $ENV_FILE." >&2
    echo "Set one of them so the TURN server can advertise a reachable public IP." >&2
  }
fi

if [ -z "${RESOLVED_IP:-}" ]; then
  echo "Unable to determine TURN external IP." >&2
  exit 1
fi

export TURN_EXTERNAL_IP="$RESOLVED_IP"
echo "Using TURN external IP: $TURN_EXTERNAL_IP"

if [ $# -eq 0 ]; then
  set -- up --build
fi

exec $COMPOSE_BIN "$@"
