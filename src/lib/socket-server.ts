import type { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function getSocketServer() {
  if (!io) {
    throw new Error("Socket.io server has not been initialized");
  }

  return io;
}
