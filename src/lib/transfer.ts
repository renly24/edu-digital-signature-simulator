// ---------- 送受信の場面（送信者 → 受信者、間で盗聴者がのぞき見る） ----------

import type { KeyId } from "./keys";

export type Who = "a" | "b" | "eve";
export type PacketKind = "plain" | "cipher" | "pubkey" | "sym";

export interface Bubble {
  text: string;
  /** 困ったことを赤で表示する */
  alert?: boolean;
}

export type KeyRing = Partial<Record<Who, KeyId[]>>;

export interface TransferStep {
  /** 下に出す説明 */
  text: string;
  /** このステップで流れるもの（dir が "toA" なら受信者 → 送信者、ふだんは送信者 → 受信者） */
  packet?: { label: string; kind: PacketKind; dir?: "toA" };
  /** 盗聴者が流れたものをコピーする */
  tapped?: boolean;
  bubbles?: Partial<Record<Who, Bubble>>;
  /** このステップの時点で、だれがどの鍵を持っているか */
  keys?: KeyRing;
}

export interface TransferScene {
  caption: string;
  intro: string;
  /** はじめにだれがどの鍵を持っているか */
  keys: KeyRing;
  steps: TransferStep[];
}

export type SceneId = "send";

const KEYS_A: KeyRing = { a: ["Apub", "Apriv"] };

export const SCENES: Record<SceneId, TransferScene> = {
  send: {
    caption: "⑤ 3つをまとめて送る",
    intro: "Aさんは、電子証明書・電子署名・文書の3つを Bさんに送ります。",
    keys: KEYS_A,
    steps: [
      {
        text: "電子証明書を送りました。中には、認証局が保証した Aさんの公開鍵が入っています。",
        packet: { label: "📜 電子証明書", kind: "pubkey" },
        keys: KEYS_A,
      },
      {
        text: "電子署名を送りました。文書のハッシュ値を、Aさんの秘密鍵で暗号化したものです。",
        packet: { label: "🔏 電子署名", kind: "cipher" },
        keys: KEYS_A,
      },
      {
        text: "文書を送りました。これで3つとも Bさんに届きました。次は、Bさんが確かめる番です。",
        packet: { label: "📄 文書", kind: "plain" },
        keys: KEYS_A,
        bubbles: { b: { text: "3つとも届いた" } },
      },
    ],
  },
};
