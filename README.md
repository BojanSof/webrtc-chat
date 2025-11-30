<center>
<img src="icon.png" width=128/>
<h1>Chatrix - WebRTC Chat Application</h1>
</center>

A real-time chat application built with React and WebRTC, featuring text messaging and file sharing capabilities.

## Features

- Real-time text messaging using WebRTC
- File sharing with progress tracking
- Room-based chat system
- Modern UI with responsive design
- Connection status monitoring

## Technologies Used

- React
- Redux
- WebRTC
- Socket.io
- Tailwind CSS
- Docker
- Nginx

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/BojanSof/webrtc-chat.git
cd webrtc-chat
```

2. Copy the environment template and edit the values when needed:
```bash
cp .env.example .env
```
- For local development, make sure `REACT_APP_SIGNALING_URL` points to your Node signaling server (typically `http://localhost:3001`).

3. Install dependencies:
```bash
npm install
# or
yarn install
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

5. Start the signaling server:
```bash
cd server
npm install
npm start
```

6. (Optional) Start the TURN server locally via Docker (requires the `.env` file to be populated).  
   If you rely on a dynamic DNS hostname, set `TURN_DDNS_HOST` in `.env` and run (requires `dig` from dnsutils/bind-utils):
```bash
./scripts/start-with-turn.sh up turn-server
```

The application will be available at `http://localhost:3000`.

### Docker Deployment

#### Local Testing with Docker

1. Make sure Docker and Docker Compose are installed on your system
2. Copy `.env.example` to `.env` and customize TURN/STUN credentials
3. Build and start the containers (the helper script keeps `TURN_EXTERNAL_IP` in sync with your DDNS hostname; make sure `dig` is installed):
```bash
./scripts/start-with-turn.sh up --build
```

The application will be available at:
- Client: `http://localhost`
- Signaling Server: `http://localhost:3001`
- TURN Server (UDP/TCP): `turn:localhost:3478`

Useful Docker commands:
```bash
# Stop the containers
docker-compose down

# View logs
docker-compose logs

# View logs for a specific service
docker-compose logs client
docker-compose logs signaling-server

# Rebuild and restart a specific service
docker-compose up -d --build client
docker-compose up -d --build signaling-server
docker-compose up -d --build turn-server
```

#### Production Deployment

1. Install Docker and Docker Compose on your server:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (Debian-based distro)
apt-get update
apt-get install docker-compose-plugin
```

2. Clone the repository on your server:
```bash
git clone https://github.com/BojanSof/webrtc-chat.git
cd webrtc-chat
```

3. Change the domains in `nginx.conf`

4. Copy `.env.example` to `.env`, set the TURN credentials, and set `TURN_EXTERNAL_IP` to the server's public IP

5. Build and start the containers (or use any other docker compose command through the helper script; make sure `dig` exists on the host):
```bash
./scripts/start-with-turn.sh up -d
```

The application will be available at:
- Client: `http://your-server-ip`
- Signaling Server: `http://your-server-ip:3001`
- TURN Server: `turn:your-server-ip:3478`

### SSL Certificate Setup

To enable HTTPS and secure WebSocket connections, follow these steps:

1. Install Certbot (Let's Encrypt client):
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificates for your domains:
```bash
sudo certbot --nginx -d <domain>
```

3. Certbot will automatically modify your Nginx configuration and set up automatic renewal.

4. Test the automatic renewal:
```bash
sudo certbot renew --dry-run
```

5. The certificates will be automatically renewed every 90 days. You can verify the renewal schedule:
```bash
sudo certbot certificates
```

After setting up SSL certificates, your application will be available at:
- Client: `https://domain`
- Signaling Server: `https://domain:3001`
- TURN Server: `turns:domain:5349`

### TURN Server

This project now bundles a [coturn](https://github.com/coturn/coturn) server for reliable NAT traversal when peers cannot connect directly via STUN.

1. Copy `.env.example` to `.env`.
2. Set `TURN_USERNAME`/`TURN_PASSWORD` (shared secret) and, for public deployments, set `TURN_EXTERNAL_IP` to the machine's public IP.
3. Adjust `REACT_APP_STUN_URLS`/`REACT_APP_TURN_URLS` if you use custom infrastructure.
4. Start the TURN server either by running `./scripts/start-with-turn.sh up turn-server` or by bringing up the whole stack with `./scripts/start-with-turn.sh up --build`.

The React client consumes the ICE configuration at build time (via `REACT_APP_*` variables) and automatically appends the TURN server to `RTCPeerConnection`. The default `.env.example` ships with working local values you can adapt.

Key environment variables:
- `TURN_USERNAME` / `TURN_PASSWORD`: credentials validated by coturn (`lt-cred-mech`).
- `TURN_REALM`: logical realm reported to clients (helps separate deployments).
- `TURN_EXTERNAL_IP`: required when the Docker host is behind NAT so coturn can relay the correct public IP. If you only know a DDNS hostname, set `TURN_DDNS_HOST` and call `./scripts/start-with-turn.sh ...` to resolve it automatically before launching Docker Compose.
- `TURN_DDNS_HOST`: optional DDNS hostname; the helper script resolves it via `dig +short`. Install `dnsutils`/`bind-utils` so `dig` is available.

#### Keeping TURN up-to-date with DDNS

If your public IP changes frequently, use a systemd timer to rerun the helper script on a schedule:

1. Copy the sample units:
   ```bash
   sudo cp deploy/systemd/webrtc-turn-update.* /etc/systemd/system/
   ```
2. Edit `/etc/systemd/system/webrtc-turn-update.service` if your repository path differs from `/home/bojan/webrtc-chat`.
3. Reload systemd and enable the timer:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now webrtc-turn-update.timer
   ```
4. Verify it’s running:
   ```bash
   systemctl list-timers | grep webrtc-turn-update
   journalctl -u webrtc-turn-update.service
   ```

The timer calls `./scripts/start-with-turn.sh up -d turn-server` every five minutes (configurable via `OnUnitActiveSec`), ensuring coturn always advertises the current DDNS-resolved IP.
- `REACT_APP_STUN_URLS`: comma-separated STUN URLs rendered into the client build.
- `REACT_APP_TURN_URLS`, `REACT_APP_TURN_USERNAME`, `REACT_APP_TURN_PASSWORD`: TURN entries bundled with the client so browsers can authenticate.

Note: Make sure your domain's DNS is properly configured to point to your server's IP address before requesting SSL certificates.

## Usage

1. Open the application in your browser
2. Create a new room or join an existing one using the room code
3. Share the room code with others to start chatting
4. Use the file upload button to share files with other participants

## Project Structure

```
webrtc-chat/
├── public/             # Static files
├── src/                # Source code
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── store/          # Redux store
│   ├── utils/          # Utility functions
│   └── App.js          # Main application component
├── server/             # Signaling server
├── package.json        # Project dependencies
├── Dockerfile          # Client Docker configuration
├── server/Dockerfile   # Server Docker configuration
├── docker-compose.yml  # Docker services orchestration
└── nginx.conf          # Nginx configuration

```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
