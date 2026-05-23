import { randomBytes, randomUUID } from "node:crypto";
import { PARTY_CODE_LENGTH } from "./constants";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createId(): string {
  return randomUUID();
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function createPartyCode(): string {
  const bytes = randomBytes(PARTY_CODE_LENGTH);
  let code = "";

  for (let i = 0; i < PARTY_CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }

  return code;
}
