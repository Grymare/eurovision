import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { setSocketServer } from "@/lib/socket-server";

const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
  });

  setSocketServer(io);

  io.on("connection", (socket) => {
    socket.emit("server:ready", {
      message: "Connected to Grymare Eurovision party server",
    });

    socket.on("client:ping", () => {
      socket.emit("server:pong", { at: new Date().toISOString() });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
