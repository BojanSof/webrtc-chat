const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
];

const splitUrls = (value) =>
  value
    ?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);

const stunUrls = splitUrls(process.env.REACT_APP_STUN_URLS) || DEFAULT_STUN_SERVERS;
const turnUrls = splitUrls(process.env.REACT_APP_TURN_URLS);
const turnUsername = process.env.REACT_APP_TURN_USERNAME;
const turnPassword = process.env.REACT_APP_TURN_PASSWORD;

const ICE_SERVERS = [];

if (stunUrls.length) {
  ICE_SERVERS.push({ urls: stunUrls });
}

if (turnUrls?.length && turnUsername && turnPassword) {
  ICE_SERVERS.push({
    urls: turnUrls,
    username: turnUsername,
    credential: turnPassword,
  });
}

export { ICE_SERVERS };
