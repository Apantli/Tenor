import * as crypto from "crypto";

export function uidToHex(uid: string, hashFuncName = "sha256"): string | null {
  try {
    const hash = crypto.createHash(hashFuncName);
    hash.update(uid, "utf-8");
    const hex = hash.digest("hex").substring(0, 6); // Take the first 6 hex characters

    // Ensure it's a valid 6-character hex code
    if (hex.length !== 6) {
      return null;
    }

    // Convert hex to RGB, darken, and convert back.
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Darken the RGB values (adjust the factor as needed)
    const darkenFactor = 0.7; // 0.0 - 1.0 (1.0 = no change, 0.0 = black)
    r = Math.floor(r * darkenFactor);
    g = Math.floor(g * darkenFactor);
    b = Math.floor(b * darkenFactor);

    // Convert back to hex
    const darkenedHex =
      ("0" + r.toString(16)).slice(-2) +
      ("0" + g.toString(16)).slice(-2) +
      ("0" + b.toString(16)).slice(-2);

    return darkenedHex;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unknown message digest")
    ) {
      return null; // Indicates invalid hash function
    }
    throw error; // Re-throw other errors
  }
}
