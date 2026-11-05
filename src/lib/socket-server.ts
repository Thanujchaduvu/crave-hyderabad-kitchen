import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

type SharedSocketState = typeof globalThis & { __companyASocketIO?: SocketIOServer };
const shared = globalThis as SharedSocketState;

export function initSocketServer(server: HttpServer) {
  if (!shared.__companyASocketIO) {
    shared.__companyASocketIO = new SocketIOServer(server, {
      path: '/api/socket',
      // Same-origin clients are used by the web app. Configure an explicit origin
      // allow-list if a separate trusted frontend is introduced.
      serveClient: false,
    });

    shared.__companyASocketIO.on('connection', (socket) => {
      socket.on('join_kitchen', (outletId: string) => {
        if (typeof outletId === 'string' && outletId.length <= 100) socket.join(`kitchen_${outletId}`);
      });
      socket.on('track_order', (orderId: string) => {
        if (typeof orderId === 'string' && orderId.length <= 100) socket.join(`order_${orderId}`);
      });
      socket.on('join_outlet_menu', (outletId: string) => {
        if (typeof outletId === 'string' && outletId.length <= 100) socket.join(`menu_${outletId}`);
      });
    });
  }
  return shared.__companyASocketIO;
}

export function getIO() {
  return shared.__companyASocketIO ?? null;
}
