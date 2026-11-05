import type { NextApiRequest, NextApiResponse } from 'next';
import { getIO, initSocketServer } from '@/lib/socket-server';
import type { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';

type SocketServer = HttpServer & { io?: SocketIOServer };
type SocketApiResponse = NextApiResponse & { socket: NextApiResponse['socket'] & { server: SocketServer } };

export const config = { api: { bodyParser: false } };

export default function socketHandler(_req: NextApiRequest, res: SocketApiResponse) {
  if (!res.socket.server.io) {
    initSocketServer(res.socket.server);
    const io = getIO();
    if (io) res.socket.server.io = io;
  }
  res.end();
}
