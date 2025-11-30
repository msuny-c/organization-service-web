import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useWebSocket = (topic, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const topicRef = useRef(topic);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    topicRef.current = topic;
    onMessageRef.current = onMessage;
  }, [topic, onMessage]);

  useEffect(() => {
    const wsUrl = '/ws';
    console.log('WebSocket URL:', wsUrl);
    
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log('WebSocket debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
      
      const subscription = client.subscribe(topicRef.current, (message) => {
        console.log('Received message:', message);
        if (onMessageRef.current) {
          onMessageRef.current(message.body);
        }
      });
      
      client.currentSubscription = subscription;
    };

    client.onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    };

    client.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame);
      console.error('Error details:', frame.headers['message']);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.deactivate();
      }
    };
  }, []);
  return { isConnected };
};
