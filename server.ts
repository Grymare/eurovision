import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getPartyById } from "@/lib/party/service";
import { emitVotingStatusToSocket } from "@/lib/socket/party-broadcast";
import {
  CLIENT_EVENTS,
  partyRoomId,
  SERVER_EVENTS,
  type JoinPartyPayload,
} from "@/lib/socket/party-events";
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
    socket.emit(SERVER_EVENTS.ready, {
      message: "Connected to Grymare Eurovision party server",
    });

    socket.on(CLIENT_EVENTS.ping, () => {
      socket.emit(SERVER_EVENTS.pong, { at: new Date().toISOString() });
    });

    socket.on(CLIENT_EVENTS.joinParty, async (payload: JoinPartyPayload) => {
      const partyId = payload?.partyId?.trim();

      if (!partyId) {
        socket.emit(SERVER_EVENTS.error, {
          code: "INVALID_PARTY_ID",
          message: "partyId is required",
        });
        return;
      }

      const party = await getPartyById(partyId);

      if (!party) {
        socket.emit(SERVER_EVENTS.error, {
          code: "PARTY_NOT_FOUND",
          message: "Party not found",
        });
        return;
      }

      const nextRoom = partyRoomId(partyId);

      for (const room of socket.rooms) {
        if (room.startsWith("party:") && room !== nextRoom) {
          socket.leave(room);
        }
      }

      socket.join(nextRoom);
      await emitVotingStatusToSocket(socket.id, partyId);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
