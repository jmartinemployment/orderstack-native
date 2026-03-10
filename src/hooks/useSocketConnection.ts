import { useEffect, useState } from 'react';
import { getSocket, connectSocket, joinRestaurant, onNewOrder, onOrderUpdated, disconnectSocket } from '@services/socketService';
import type { Order, SocketJoinPayload } from '@models/index';

type DeviceType = SocketJoinPayload['deviceType'];

interface UseSocketConnectionOptions {
  readonly restaurantId: string | null;
  readonly token: string | null;
  readonly deviceType: DeviceType;
  readonly addOrder: (order: Order) => void;
  readonly updateOrder: (order: Order) => void;
}

interface UseSocketConnectionReturn {
  isConnected: boolean;
}

export function useSocketConnection({
  restaurantId,
  token,
  deviceType,
  addOrder,
  updateOrder,
}: UseSocketConnectionOptions): UseSocketConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);

  // Connection status polling
  useEffect(() => {
    const checkConnection = () => {
      const sock = getSocket();
      setIsConnected(sock?.connected ?? false);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    if (!restaurantId || !token) { return; }

    const unsubNew = onNewOrder((event) => addOrder(event.order));
    const unsubUpdated = onOrderUpdated((event) => updateOrder(event.order));

    return () => {
      unsubNew();
      unsubUpdated();
      disconnectSocket();
    };
  }, [restaurantId, token, addOrder, updateOrder]);

  return { isConnected };
}

/**
 * Connect and join a restaurant room. Call this after loading device ID.
 */
export function connectAndJoin(token: string, restaurantId: string, deviceId: string, deviceType: DeviceType): void {
  connectSocket(token);
  joinRestaurant({ restaurantId, deviceId, deviceType });
}
