import type { Server } from "socket.io";

const globalForSocket = globalThis as typeof globalThis & {
  __grymareSocketIo?: Server;
};

export function setSocketServer(server: Server) {
  globalForSocket.__grymareSocketIo = server;
}

export function getSocketServer() {
  const io = globalForSocket.__grymareSocketIo;

  if (!io) {
    throw new Error("Socket.io server has not been initialized");
  }

  return io;
}
