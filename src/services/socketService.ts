import { io, type Socket } from 'socket.io-client';
import Config from 'react-native-config';
import type { SocketJoinPayload, SocketOrderEvent } from '@models/index';

const BASE_URL = Config.ORDERSTACK_API_URL ?? 'https://get-order-stack-restaurant-backend.onrender.com';

let socket: Socket | null = null;

type OrderEventHandler = (event: SocketOrderEvent) => void;

const listeners: {
  onNewOrder: OrderEventHandler[];
  onOrderUpdated: OrderEventHandler[];
} = {
  onNewOrder: [],
  onOrderUpdated: [],
};

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('order:new', (data: SocketOrderEvent) => {
    for (const handler of listeners.onNewOrder) {
      handler(data);
    }
  });

  socket.on('order:updated', (data: SocketOrderEvent) => {
    for (const handler of listeners.onOrderUpdated) {
      handler(data);
    }
  });

  return socket;
}

export function joinRestaurant(payload: SocketJoinPayload): void {
  socket?.emit('join-restaurant', payload);
}

export function leaveRestaurant(restaurantId: string, deviceId: string): void {
  socket?.emit('leave-restaurant', { restaurantId, deviceId });
}

export function sendHeartbeat(deviceId: string): void {
  socket?.emit('heartbeat', { deviceId });
}

export function onNewOrder(handler: OrderEventHandler): () => void {
  listeners.onNewOrder.push(handler);
  return () => {
    const idx = listeners.onNewOrder.indexOf(handler);
    if (idx >= 0) {
      listeners.onNewOrder.splice(idx, 1);
    }
  };
}

export function onOrderUpdated(handler: OrderEventHandler): () => void {
  listeners.onOrderUpdated.push(handler);
  return () => {
    const idx = listeners.onOrderUpdated.indexOf(handler);
    if (idx >= 0) {
      listeners.onOrderUpdated.splice(idx, 1);
    }
  };
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  listeners.onNewOrder.length = 0;
  listeners.onOrderUpdated.length = 0;
}

export function getSocket(): Socket | null {
  return socket;
}
