import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from './api';

export class WebSocketService {
  constructor() {
    this.client = null;
  }

  connect(onMessage) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      onConnect: () => {
        console.log('WebSocket connected');
        this.client.subscribe('/topic/organizations', (message) => {
          const event = JSON.parse(message.body);
          onMessage(event);
        });
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}

export const wsService = new WebSocketService();

