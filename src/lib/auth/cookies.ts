import { cookies } from "next/headers";
import {
  HOST_COOKIE,
  PARTICIPANT_COOKIE,
} from "@/lib/party/constants";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setHostSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(HOST_COOKIE, token, cookieOptions);
}

export async function setParticipantSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(PARTICIPANT_COOKIE, token, cookieOptions);
}

export async function getHostSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(HOST_COOKIE)?.value ?? null;
}

export async function getParticipantSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(PARTICIPANT_COOKIE)?.value ?? null;
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(HOST_COOKIE);
  cookieStore.delete(PARTICIPANT_COOKIE);
}
