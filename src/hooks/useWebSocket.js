import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useWebSocket = (topic, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    // В production используем относительный URL, в development - полный
    const wsUrl = import.meta.env.PROD ? '/ws' : 'http://localhost:35000/ws';
    
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
      
      client.subscribe(topic, (message) => {
        console.log('Received message:', message);
        if (onMessage) {
          onMessage(message.body);
        }
      });
    };

    client.onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [topic, onMessage]);

  return { isConnected };
};
