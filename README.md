<center>
<img src="icon.png" width=128/>
<h1>WebRTC Chat Application</h1>
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

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Start the signaling server:
```bash
cd server
npm install
npm start
```

The application will be available at `http://localhost:3000`.

### Docker Deployment

#### Local Testing with Docker

1. Make sure Docker and Docker Compose are installed on your system
2. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at:
- Client: `http://localhost`
- Signaling Server: `http://localhost:3001`

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

3. Build and start the containers:
```bash
docker-compose up -d
```

The application will be available at:
- Client: `http://your-server-ip`
- Signaling Server: `http://your-server-ip:3001`

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