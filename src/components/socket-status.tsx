"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

type SocketState = "connecting" | "connected" | "disconnected" | "error";

export function SocketStatus() {
  const [state, setState] = useState<SocketState>("connecting");
  const [message, setMessage] = useState("Connecting to live updates...");
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setState("connected");
      socket.emit("client:ping");
    });

    socket.on("server:ready", (payload: { message: string }) => {
      setMessage(payload.message);
    });

    socket.on("server:pong", (payload: { at: string }) => {
      setLastPong(payload.at);
    });

    socket.on("disconnect", () => {
      setState("disconnected");
      setMessage("Disconnected from live updates");
    });

    socket.on("connect_error", () => {
      setState("error");
      setMessage("Could not connect to the live update server");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <section
      aria-labelledby="socket-status-heading"
      className="panel"
    >
      <h2 id="socket-status-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
        Live connection
      </h2>
      <p className="mt-2 text-base">{message}</p>
      <dl className="mt-3 grid gap-2 text-sm text-muted">
        <div className="flex gap-2">
          <dt className="font-medium text-foreground">Status:</dt>
          <dd>{state}</dd>
        </div>
        {lastPong ? (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground">Last ping:</dt>
            <dd>
              <time dateTime={lastPong}>{lastPong}</time>
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="sr-only" aria-live="polite">
        Socket status: {state}. {message}
      </p>
    </section>
  );
}
