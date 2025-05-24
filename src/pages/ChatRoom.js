import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
  setConnectionStatus,
  setRoomId,
  resetConnection,
} from '../store/slices/connectionSlice';
import {
  addMessage,
  setTyping,
  setRemoteTyping,
  clearMessages,
} from '../store/slices/chatSlice';
import {
  addTransfer,
  updateTransferProgress,
  completeTransfer,
  failTransfer,
  clearTransfers,
} from '../store/slices/fileTransferSlice';

const CHUNK_SIZE = 16 * 1024; // 16KB chunks

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socketRef = useRef();
  const peerConnectionRef = useRef();
  const dataChannelRef = useRef();
  const fileInputRef = useRef();
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);
  const [isHandlingOffer, setIsHandlingOffer] = useState(false);
  const [isOfferer, setIsOfferer] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [receivedFiles, setReceivedFiles] = useState({});
  const [completedFiles, setCompletedFiles] = useState({});

  const { status } = useSelector((state) => state.connection);
  const { messages, remoteTyping } = useSelector((state) => state.chat);
  const { activeTransfers, completedTransfers } = useSelector(
    (state) => state.fileTransfer
  );

  useEffect(() => {
    dispatch(setRoomId(roomId));
    initializeSocket();
    return () => {
      cleanup();
    };
  }, [roomId, dispatch]);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:3001', {
      withCredentials: true
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server with ID:', socketRef.current.id);
      socketRef.current.emit('join-room', roomId);
    });

    socketRef.current.on('room-joined', ({ roomId, socketId }) => {
      console.log(`Joined room ${roomId} with socket ID ${socketId}`);
      createPeerConnection();
    });

    socketRef.current.on('peer-joined', ({ peerId }) => {
      console.log(`Peer ${peerId} joined the room`);
      // Determine who should be the offerer based on socket IDs
      const shouldBeOfferer = socketRef.current.id < peerId;
      setIsOfferer(shouldBeOfferer);
      console.log(`I am ${shouldBeOfferer ? 'the offerer' : 'the answerer'}`);
      
      if (shouldBeOfferer) {
        createOffer();
      }
    });

    socketRef.current.on('offer', ({ offer, from }) => {
      console.log(`Received offer from ${from}`);
      handleReceiveOffer(offer);
    });

    socketRef.current.on('answer', ({ answer, from }) => {
      console.log(`Received answer from ${from}`);
      handleReceiveAnswer(answer);
    });

    socketRef.current.on('ice-candidate', ({ candidate, from }) => {
      console.log(`Received ICE candidate from ${from}`);
      handleReceiveIceCandidate(candidate);
    });
  };

  const createPeerConnection = () => {
    console.log('Creating peer connection');
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate.candidate);
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          from: socketRef.current.id,
        });
      } else {
        console.log('ICE gathering completed');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state changed:', pc.iceGatheringState);
    };

    pc.ondatachannel = (event) => {
      console.log('Received data channel');
      const dc = event.channel;
      dc.onopen = () => {
        console.log('Data channel opened');
        dispatch(setConnectionStatus('connected'));
        setIsDataChannelReady(true);
      };
      dc.onclose = () => {
        console.log('Data channel closed');
        dispatch(setConnectionStatus('disconnected'));
        setIsDataChannelReady(false);
      };
      dc.onerror = (error) => {
        console.error('Data channel error:', error);
      };
      dc.onmessage = handleDataChannelMessage;
      dataChannelRef.current = dc;
    };

    pc.onconnectionstatechange = () => {
      console.log('Peer connection state changed:', pc.connectionState);
      dispatch(setConnectionStatus(pc.connectionState));
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    dispatch(setConnectionStatus('connecting'));
  };

  const createDataChannel = (pc) => {
    console.log('Creating data channel');
    const dc = pc.createDataChannel('chat', {
      ordered: true,
    });

    dc.onopen = () => {
      console.log('Data channel opened');
      dispatch(setConnectionStatus('connected'));
      setIsDataChannelReady(true);
    };

    dc.onclose = () => {
      console.log('Data channel closed');
      dispatch(setConnectionStatus('disconnected'));
      setIsDataChannelReady(false);
    };

    dc.onerror = (error) => {
      console.error('Data channel error:', error);
    };

    dc.onmessage = handleDataChannelMessage;

    dataChannelRef.current = dc;
  };

  const createOffer = async () => {
    if (isHandlingOffer) {
      console.log('Skipping offer creation - already handling a remote offer');
      return;
    }

    try {
      // Create data channel before creating offer
      createDataChannel(peerConnectionRef.current);
      
      console.log('Creating offer');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      console.log('Setting local description');
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Sending offer');
      socketRef.current.emit('offer', {
        roomId,
        offer,
        from: socketRef.current.id,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleDataChannelMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received data channel message:', data);

      if (data.type === 'message') {
        dispatch(addMessage({ text: data.text, sender: 'remote' }));
      } else if (data.type === 'typing') {
        dispatch(setRemoteTyping(data.isTyping));
      } else if (data.type === 'file') {
        handleFileTransfer(data);
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
    }
  };

  const handleFileTransfer = async (data) => {
    try {
      if (data.action === 'start') {
        console.log('Starting file transfer:', data.fileName);
        // Add file as a message
        dispatch(addMessage({
          id: data.fileId,
          type: 'file',
          fileName: data.fileName,
          size: data.size,
          sender: 'remote',
          status: 'receiving',
          progress: 0,
          fileType: data.fileType
        }));

        setReceivedFiles(prev => ({
          ...prev,
          [data.fileId]: {
            chunks: new Array(data.totalChunks),
            fileName: data.fileName,
            fileType: data.fileType,
            totalChunks: data.totalChunks,
            receivedChunks: 0,
            size: data.size
          }
        }));
      } else if (data.action === 'chunk') {
        console.log(`Received chunk ${data.chunkIndex + 1}/${data.totalChunks} for file ${data.fileId}`);
        
        setReceivedFiles(prev => {
          const file = prev[data.fileId];
          if (!file) return prev;
          
          // Convert base64 back to binary data
          const binaryData = atob(data.data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          
          // Create a new array with the received chunk
          const newChunks = [...file.chunks];
          newChunks[data.chunkIndex] = bytes;
          
          const receivedChunks = newChunks.filter(chunk => chunk !== undefined).length;
          const progress = (receivedChunks / file.totalChunks) * 100;
          
          // If we've received all chunks, create the file immediately
          if (receivedChunks === file.totalChunks) {
            // Combine all chunks into a single Uint8Array
            const totalLength = newChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combinedArray = new Uint8Array(totalLength);
            let offset = 0;
            newChunks.forEach(chunk => {
              combinedArray.set(chunk, offset);
              offset += chunk.length;
            });
            
            // Create the Blob from the combined array
            const blob = new Blob([combinedArray], { type: file.fileType });
            const url = URL.createObjectURL(blob);
            
            console.log('File reconstruction complete:', {
              originalSize: file.size,
              reconstructedSize: blob.size,
              chunks: newChunks.length,
              totalLength
            });
            
            // Update message with download URL
            dispatch(addMessage({
              id: data.fileId,
              type: 'file',
              fileName: file.fileName,
              size: file.size,
              url: url,
              sender: 'remote',
              status: 'complete',
              progress: 100,
              fileType: file.fileType
            }));
            
            setCompletedFiles(prev => ({
              ...prev,
              [data.fileId]: {
                url,
                fileName: file.fileName,
                fileType: file.fileType,
                size: file.size
              }
            }));
          } else {
            // Update message progress
            dispatch(addMessage({
              id: data.fileId,
              type: 'file',
              fileName: file.fileName,
              size: file.size,
              sender: 'remote',
              status: 'receiving',
              progress,
              fileType: file.fileType
            }));
          }
          
          return {
            ...prev,
            [data.fileId]: {
              ...file,
              chunks: newChunks,
              receivedChunks
            }
          };
        });
      } else if (data.action === 'complete') {
        console.log('File transfer complete:', data.fileId);
        
        const file = receivedFiles[data.fileId];
        if (file && file.receivedChunks === file.totalChunks) {
          // Combine all chunks into a single Uint8Array
          const totalLength = file.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const combinedArray = new Uint8Array(totalLength);
          let offset = 0;
          file.chunks.forEach(chunk => {
            combinedArray.set(chunk, offset);
            offset += chunk.length;
          });
          
          // Create the Blob from the combined array
          const blob = new Blob([combinedArray], { type: file.fileType });
          const url = URL.createObjectURL(blob);
          
          console.log('File reconstruction complete:', {
            originalSize: file.size,
            reconstructedSize: blob.size,
            chunks: file.chunks.length,
            totalLength
          });
          
          // Update message with download URL
          dispatch(addMessage({
            id: data.fileId,
            type: 'file',
            fileName: file.fileName,
            size: file.size,
            url: url,
            sender: 'remote',
            status: 'complete',
            progress: 100,
            fileType: file.fileType
          }));
          
          setCompletedFiles(prev => ({
            ...prev,
            [data.fileId]: {
              url,
              fileName: file.fileName,
              fileType: file.fileType,
              size: file.size
            }
          }));
          
          setReceivedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[data.fileId];
            return newFiles;
          });
        }
      }
    } catch (error) {
      console.error('Error handling file transfer:', error);
      dispatch(failTransfer({ fileId: data.fileId }));
    }
  };

  const handleReceiveOffer = async (offer) => {
    try {
      setIsHandlingOffer(true);
      console.log('Received offer, setting remote description');
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      console.log('Creating answer');
      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      console.log('Setting local description');
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Sending answer');
      socketRef.current.emit('answer', {
        roomId,
        answer,
        from: socketRef.current.id,
      });
      setIsHandlingOffer(false);
    } catch (error) {
      console.error('Error handling offer:', error);
      setIsHandlingOffer(false);
    }
  };

  const handleReceiveAnswer = async (answer) => {
    try {
      console.log('Received answer, setting remote description');
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async (candidate) => {
    try {
      console.log('Adding ICE candidate');
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && dataChannelRef.current && isDataChannelReady) {
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'message',
          text: message,
        })
      );
      dispatch(addMessage({ text: message, sender: 'local' }));
      setMessage('');
    }
  };

  const handleTyping = () => {
    if (dataChannelRef.current && isDataChannelReady) {
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'typing',
          isTyping: true,
        })
      );
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      const timeout = setTimeout(() => {
        if (dataChannelRef.current && isDataChannelReady) {
          dataChannelRef.current.send(
            JSON.stringify({
              type: 'typing',
              isTyping: false,
            })
          );
        }
      }, 2000);
      setTypingTimeout(timeout);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !dataChannelRef.current || !isDataChannelReady) {
      console.log('Cannot send file:', { file, dataChannel: !!dataChannelRef.current, ready: isDataChannelReady });
      return;
    }

    try {
      const fileId = Date.now().toString();
      const chunkSize = CHUNK_SIZE;
      const totalChunks = Math.ceil(file.size / chunkSize);

      // Add file as a message immediately
      dispatch(addMessage({
        id: fileId,
        type: 'file',
        fileName: file.name,
        size: file.size,
        sender: 'local',
        status: 'sending',
        progress: 0,
        fileType: file.type
      }));

      // Send file start message
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'file',
          action: 'start',
          fileId,
          fileName: file.name,
          size: file.size,
          fileType: file.type,
          totalChunks,
        })
      );

      // Send file chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = () => {
            try {
              // Convert the ArrayBuffer to base64 for transmission
              const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(reader.result)));
              dataChannelRef.current.send(
                JSON.stringify({
                  type: 'file',
                  action: 'chunk',
                  fileId,
                  chunkIndex,
                  totalChunks,
                  data: base64Data,
                })
              );
              const progress = ((chunkIndex + 1) / totalChunks) * 100;
              dispatch(addMessage({
                id: fileId,
                type: 'file',
                fileName: file.name,
                size: file.size,
                sender: 'local',
                status: 'sending',
                progress,
                fileType: file.type
              }));
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(chunk);
        });
      }

      // Send file complete message
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'file',
          action: 'complete',
          fileId,
        })
      );

      // Create a copy of the file for local download
      const fileCopy = new File([file], file.name, { type: file.type });
      const localUrl = URL.createObjectURL(fileCopy);

      // Update message status to complete
      dispatch(addMessage({
        id: fileId,
        type: 'file',
        fileName: file.name,
        size: file.size,
        sender: 'local',
        status: 'complete',
        progress: 100,
        url: localUrl,
        fileType: file.type
      }));

      console.log('File transfer completed successfully');
    } catch (error) {
      console.error('Error during file transfer:', error);
      dispatch(failTransfer({ fileId: Date.now().toString() }));
    }
  };

  const handleDownload = (fileId) => {
    const message = messages.find(msg => msg.id === fileId);
    if (!message || !message.url) return;

    const a = document.createElement('a');
    a.href = message.url;
    a.download = message.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
    }
    dispatch(resetConnection());
    dispatch(clearMessages());
    dispatch(clearTransfers());
    setIsDataChannelReady(false);
    setIsHandlingOffer(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 bg-white shadow">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Room: {roomId}
                </h1>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    status === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : status === 'connecting'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {status}
                </span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                Leave Room
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'local' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'local'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    {msg.type === 'file' ? (
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <svg
                            className={`w-6 h-6 ${
                              msg.sender === 'local' ? 'text-white' : 'text-gray-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <div className="flex flex-col">
                            <span className={`font-medium ${
                              msg.sender === 'local' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {msg.fileName}
                            </span>
                            <span className={`text-sm ${
                              msg.sender === 'local' ? 'text-gray-200' : 'text-gray-500'
                            }`}>
                              {formatFileSize(msg.size || 0)}
                            </span>
                            {msg.status === 'sending' && (
                              <span className={`text-sm ${
                                msg.sender === 'local' ? 'text-gray-200' : 'text-gray-500'
                              }`}>
                                Sending... {Math.round(msg.progress || 0)}%
                              </span>
                            )}
                            {msg.status === 'receiving' && (
                              <span className={`text-sm ${
                                msg.sender === 'local' ? 'text-gray-200' : 'text-gray-500'
                              }`}>
                                Receiving... {Math.round(msg.progress || 0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {msg.status === 'complete' && (
                          <button
                            onClick={() => handleDownload(msg.id)}
                            className={`mt-2 text-sm flex items-center space-x-1 ${
                              msg.sender === 'local'
                                ? 'text-white hover:text-gray-200'
                                : 'text-primary-600 hover:text-primary-800'
                            }`}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {remoteTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 px-4 py-2 rounded-lg">
                    Typing...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom; 