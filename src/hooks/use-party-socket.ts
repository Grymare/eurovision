"use client";

import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type VoteSubmittedPayload,
  type VotingStatusPayload,
} from "@/lib/socket/party-events";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

type UsePartySocketOptions = {
  partyId: string;
  onVotingStatus: (payload: VotingStatusPayload) => void;
  onVoteSubmitted?: (payload: VoteSubmittedPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function usePartySocket({
  partyId,
  onVotingStatus,
  onVoteSubmitted,
  onConnectionChange,
}: UsePartySocketOptions) {
  const onVotingStatusRef = useRef(onVotingStatus);
  const onVoteSubmittedRef = useRef(onVoteSubmitted);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onVotingStatusRef.current = onVotingStatus;
  }, [onVotingStatus]);

  useEffect(() => {
    onVoteSubmittedRef.current = onVoteSubmitted;
  }, [onVoteSubmitted]);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  useEffect(() => {
    const socket: Socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    function joinPartyRoom() {
      socket.emit(CLIENT_EVENTS.joinParty, { partyId });
    }

    function handleConnect() {
      onConnectionChangeRef.current?.(true);
      joinPartyRoom();
    }

    function handleDisconnect() {
      onConnectionChangeRef.current?.(false);
    }

    function handleVotingStatus(payload: VotingStatusPayload) {
      if (payload.partyId !== partyId) {
        return;
      }

      onVotingStatusRef.current(payload);
    }

    function handleVoteSubmitted(payload: VoteSubmittedPayload) {
      if (payload.partyId !== partyId) {
        return;
      }

      onVoteSubmittedRef.current?.(payload);
    }

    socket.on("connect", handleConnect);
    socket.io.on("reconnect", joinPartyRoom);
    socket.on(SERVER_EVENTS.votingStatus, handleVotingStatus);
    socket.on(SERVER_EVENTS.voteSubmitted, handleVoteSubmitted);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.io.off("reconnect", joinPartyRoom);
      socket.off(SERVER_EVENTS.votingStatus, handleVotingStatus);
      socket.off(SERVER_EVENTS.voteSubmitted, handleVoteSubmitted);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [partyId]);
}
