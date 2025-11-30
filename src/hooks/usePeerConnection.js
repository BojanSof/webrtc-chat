import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const usePeerConnection = ({
  roomId,
  iceServers,
  onConnectionStateChange,
  onDataChannelMessage,
  onDataChannelOpen,
  onDataChannelClose,
  socketUrl,
  socketPath,
}) => {
  const socketRef = useRef();
  const peerConnectionRef = useRef();
  const dataChannelRef = useRef();
  const [isOfferer, setIsOfferer] = useState(false);
  const isOffererRef = useRef(false);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 2000;
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  useEffect(() => {
    isOffererRef.current = isOfferer;
  }, [isOfferer]);

  const cleanup = useCallback(() => {
    socketRef.current?.disconnect();
    peerConnectionRef.current?.close();
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
  }, []);

  const initializeSocket = useCallback(() => {
    const endpoint = socketUrl || undefined;
    const isSecure = socketUrl
      ? socketUrl.startsWith('https')
      : window.location.protocol === 'https:';

    socketRef.current = io(endpoint, {
      path: socketPath,
      withCredentials: true,
      secure: isSecure,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', roomId);
      setConnectionAttempt(0);
    });

    socketRef.current.on('connect_error', () => {
      onConnectionStateChange('disconnected');
    });

    socketRef.current.on('disconnect', () => {
      onConnectionStateChange('disconnected');
    });

    socketRef.current.on('room-joined', () => {
      createPeerConnection();
    });

    socketRef.current.on('peer-joined', ({ peerId }) => {
      const shouldBeOfferer = socketRef.current.id < peerId;
      setIsOfferer(shouldBeOfferer);
      if (shouldBeOfferer) {
        createOffer();
      }
    });

    socketRef.current.on('offer', ({ offer }) => {
      handleReceiveOffer(offer);
    });

    socketRef.current.on('answer', ({ answer }) => {
      handleReceiveAnswer(answer);
    });

    socketRef.current.on('ice-candidate', ({ candidate }) => {
      handleReceiveIceCandidate(candidate);
    });
  }, [
    roomId,
    socketPath,
    socketUrl,
    onConnectionStateChange,
  ]);

  const attachDataChannelHandlers = (channel) => {
    channel.onopen = () => {
      onConnectionStateChange('connected');
      onDataChannelOpen?.();
    };
    channel.onclose = () => {
      onConnectionStateChange('disconnected');
      onDataChannelClose?.();
    };
    channel.onmessage = onDataChannelMessage;
    dataChannelRef.current = channel;
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          from: socketRef.current.id,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };

    pc.ondatachannel = (event) => {
      attachDataChannelHandlers(event.channel);
    };

    peerConnectionRef.current = pc;
    onConnectionStateChange('connecting');
  };

  const createOffer = async ({ iceRestart = false } = {}) => {
    if (!peerConnectionRef.current) return;
    if (!dataChannelRef.current || dataChannelRef.current.readyState === 'closed') {
      const dataChannel = peerConnectionRef.current.createDataChannel('chat', {
        ordered: true,
      });
      attachDataChannelHandlers(dataChannel);
    }

    const offer = await peerConnectionRef.current.createOffer({
      iceRestart,
    });
    await peerConnectionRef.current.setLocalDescription(offer);
    socketRef.current.emit('offer', { roomId, offer, from: socketRef.current.id });
  };

  const handleReceiveOffer = async (offer) => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socketRef.current.emit('answer', { roomId, answer, from: socketRef.current.id });
  };

  const handleReceiveAnswer = async (answer) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  };

  const handleReceiveIceCandidate = async (candidate) => {
    if (!peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  useEffect(() => {
    initializeSocket();
    return () => {
      cleanup();
    };
  }, [initializeSocket, cleanup]);

  useEffect(() => {
    if (connectionAttempt < MAX_RECONNECT_ATTEMPTS) {
      const timer = setTimeout(() => {
        setConnectionAttempt((prev) => prev + 1);
        cleanup();
        initializeSocket();
      }, RECONNECT_DELAY);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [connectionAttempt, initializeSocket, cleanup]);

  return {
    socket: socketRef,
    peerConnection: peerConnectionRef,
    dataChannel: dataChannelRef,
    createOffer,
    cleanup,
  };
};

export default usePeerConnection;
