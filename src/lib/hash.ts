// ---------- ハッシュ関数（教材用のかんたんなもの） ----------

/** 文字列から 32 ビットの値を求める（FNV-1a） */
function fnv1a(text: string, seed: number) {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // 最後によくかき混ぜて、1文字の違いが全体に広がるようにする
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** 文書のハッシュ値（12 けたの 16 進数を 4 けたずつ区切る） */
export function hashOf(text: string) {
  const hex = (fnv1a(text, 0x811c9dc5).toString(16).padStart(8, "0") + fnv1a(text, 0x01234567).toString(16).padStart(8, "0")).toUpperCase().slice(0, 12);
  return hex.match(/.{4}/g)!.join(" ");
}

/** 送る文書 */
export const DOC = "代金 10,000円 を支払います。Aより";
/** 途中で書きかえられた文書 */
export const DOC_TAMPERED = "代金 1,000,000円 を支払います。Aより";
