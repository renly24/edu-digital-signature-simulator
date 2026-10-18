// ---------- 鍵（送信者の公開鍵・秘密鍵、なりすました人の秘密鍵） ----------

export const PUB_COLOR = "#1565c0";
export const PRIV_COLOR = "#2e7d32";

export type KeyId = "Apub" | "Apriv" | "Cpriv";

export interface KeyInfo {
  kind: "pub" | "priv";
  label: string;
  short: string;
  icon: string;
  color: string;
}

export const KEYS: Record<KeyId, KeyInfo> = {
  Apub: { kind: "pub", label: "Aさんの公開鍵", short: "A公開鍵", icon: "🔑", color: PUB_COLOR },
  Apriv: { kind: "priv", label: "Aさんの秘密鍵", short: "A秘密鍵", icon: "🗝️", color: PRIV_COLOR },
  Cpriv: { kind: "priv", label: "Cさんの秘密鍵", short: "C秘密鍵", icon: "🗝️", color: "#8d6e63" },
};
