import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      // console.log('⚡ Connected to Agentflow Socket.IO server');
    });

    socket.on('disconnect', () => {
      // console.log('⚠️ Disconnected from Agentflow Socket.IO server');
    });
  }

  return socket;
}

export function subscribeToExecution(executionId, onTimeline, onStatus, onProgress) {
  const s = getSocket();
  if (!s || !executionId) return () => {};

  s.emit('join:execution', executionId);

  if (onTimeline) s.on('agent:timeline', onTimeline);
  if (onStatus) s.on('execution:status', onStatus);
  if (onProgress) s.on('execution:progress', onProgress);

  return () => {
    s.emit('leave:execution', executionId);
    if (onTimeline) s.off('agent:timeline', onTimeline);
    if (onStatus) s.off('execution:status', onStatus);
    if (onProgress) s.off('execution:progress', onProgress);
  };
}

export function subscribeToUser(userId, onNotification) {
  const s = getSocket();
  if (!s || !userId) return () => {};

  s.emit('join:user', userId);
  if (onNotification) s.on('notification:new', onNotification);

  return () => {
    if (onNotification) s.off('notification:new', onNotification);
  };
}
