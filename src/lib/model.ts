// ---------- モデル（スライドの内容） ----------

import type { SceneId } from "./transfer";

export const PLAIN_COLOR = "#37474f";
export const CIPHER_COLOR = "#6a1b9a";
export const EVE_COLOR = "#c62828";

export const CHAPTERS = [
  { id: 1, name: "電子署名とは", color: "#455a64" },
  { id: 2, name: "ハッシュ関数", color: "#00838f" },
  { id: 3, name: "認証局と電子証明書", color: "#1565c0" },
  { id: 4, name: "電子署名のしくみ", color: CIPHER_COLOR },
  { id: 5, name: "まとめ", color: "#2e7d32" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

// ---------- 問題 ----------

export interface ChoiceQuiz {
  kind: "choice";
  question: string;
  options: string[];
  answer: number;
  ok: string;
  ng: string;
  /** true の予想問題は、答えるまで次のスライドへ進めない */
  gate?: boolean;
}

export type Quiz = ChoiceQuiz | { kind: "task" } | { kind: "test" };

export type QuizLabel = "予想問題" | "体験問題" | "確認問題";

export function quizLabel(quiz: Quiz | undefined): QuizLabel | null {
  if (!quiz) return null;
  if (quiz.kind === "choice") return quiz.gate ? "予想問題" : "確認問題";
  if (quiz.kind === "test") return "確認問題";
  return "体験問題";
}

export const QUIZ_COLOR: Record<QuizLabel, string> = {
  予想問題: "#1565c0",
  体験問題: "#ef6c00",
  確認問題: "#2e7d32",
};

// ---------- スライド ----------

export type Scenario = "ok" | "tamper" | "spoof";

export type Stage =
  /** 送信者 → 受信者の送受信。札をドラッグして送る */
  | { kind: "transfer"; scene: SceneId }
  /** 文書を書きかえたり、なりすましたりしてみる */
  | { kind: "attack" }
  /** 文書を変えて、ハッシュ値の変わり方を見る */
  | { kind: "hash" }
  /** ハッシュ値から元の文書を当てようとしてみる */
  | { kind: "hashguess" }
  /** 公開鍵を認証局に届け出て、電子証明書を発行してもらう */
  | { kind: "ca" }
  /** 送信者が電子署名を作る */
  | { kind: "sign" }
  /** 受信者が電子署名を確かめる */
  | { kind: "verify"; scenarios: Scenario[] }
  /** だれが何をするかを仕分ける */
  | { kind: "roles" }
  /** 作成と検証に使う鍵を選ぶ */
  | { kind: "keyroles" }
  | { kind: "test" };

export interface Slide {
  id?: string;
  chapter: ChapterId;
  title: string;
  description: string;
  stage: Stage;
  /** 説明の下に出す要点 */
  points?: string[];
  quiz?: Quiz;
  /** やってみよう（操作の課題）。クリアするまで次のスライドへ進めない */
  mission?: string;
}

export const SLIDES: Slide[] = [
  // ---- 第1章 電子署名とは ----
  {
    id: "attack",
    chapter: 1,
    title: "デジタルの文書は書きかえられる？",
    description:
      "紙の契約書では、本人であることを示すために印鑑やサインを使ってきました。では、インターネットで送るデジタルの文書はどうでしょう。悪い人になって、Aさんが Bさんに送る文書に手を加えてみよう。",
    stage: { kind: "attack" },
    mission: "金額をダブルクリックして書きかえ（改ざん）、差出人をダブルクリックして Aさんのふりをした文書にすりかえ（なりすまし）よう",
    points: ["改ざん：文書の内容を勝手に書きかえること", "なりすまし：別人が本人のふりをすること"],
  },
  {
    chapter: 1,
    title: "改ざん・なりすましを防ぐには？",
    description: "デジタルの文書は、見た目だけでは書きかえられたかどうかも、本当に本人が送ったかどうかも分かりません。",
    stage: { kind: "attack" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "デジタルの文書で、本人が送ったことと、書きかえられていないことを確かめるには？",
      options: ["文書の文字を大きくする", "電子署名を付けて送る", "同じ文書を2回送る"],
      answer: 1,
      ok: "正解！ 印鑑やサインの代わりに、電子署名（デジタル署名）を付けます。電子署名は、デジタル文書の本人確認と改ざん防止のために使われます。",
      ng: "印鑑やサインの代わりに、電子署名（デジタル署名）を付けます。電子署名は、デジタル文書の本人確認と改ざん防止のために使われます。",
    },
  },

  // ---- 第2章 ハッシュ関数 ----
  {
    id: "hash",
    chapter: 2,
    title: "ハッシュ関数",
    description:
      "電子署名を作るときには、ハッシュ関数を使います。ハッシュ関数は、入力したデータから、そのデータ特有の値（ハッシュ値）を求めます。同じデータなら同じハッシュ値に、1文字でも違えばまったく違うハッシュ値になります。右の文書を書きかえて確かめよう。",
    stage: { kind: "hash" },
    mission: "右の文書を1文字だけ書きかえてハッシュ値が「不一致」になるのを見てから、元に戻して「一致」になるのを確かめよう",
    points: ["同じデータ → 同じハッシュ値", "1文字でも違う → まったく違うハッシュ値"],
  },
  {
    id: "hashguess",
    chapter: 2,
    title: "ハッシュ値から元のデータは分かる？",
    description: "あるハッシュ値だけが手に入ったとします。そこから元のデータを当てられるでしょうか。思いつく言葉のハッシュ値を次々に求めて、同じ値になるものを探してみよう。",
    stage: { kind: "hashguess" },
    mission: "候補の上でマウスホイールを回して（またはボタンで）、10 個の言葉を試してみよう",
    points: ["ハッシュ値から元のデータを推測するのは困難"],
  },

  // ---- 第3章 認証局と電子証明書 ----
  {
    id: "ca",
    chapter: 3,
    title: "認証局と電子証明書",
    description:
      "電子署名では、送信者が公開鍵と秘密鍵を用意し、公開鍵を認証局に登録します。認証局（CA）は公開鍵を管理し、その公開鍵が正しい相手のものであることを保証する電子証明書を発行する機関です。",
    stage: { kind: "ca" },
    quiz: { kind: "task" },
    mission: "鍵を作る機械をダブルクリックして鍵のペアを作り、認証局へ届け出る鍵をドラッグして、電子証明書を発行してもらおう",
    points: ["① 送信者が鍵のペアを作り、公開鍵を認証局に届け出る", "② 公開鍵を含んだ、本人証明としての電子証明書を発行してもらう"],
  },

  // ---- 第4章 電子署名のしくみ ----
  {
    id: "sign",
    chapter: 4,
    title: "電子署名を作る（送信者）",
    description:
      "Aさんが、Bさんに送る文書に電子署名を付けます。まず、ハッシュ関数で文書のハッシュ値を求めます。次に、そのハッシュ値を自分の秘密鍵で暗号化します。これが電子署名です。",
    stage: { kind: "sign" },
    quiz: { kind: "task" },
    mission: "文書をハッシュ関数へドラッグしてハッシュ値を求め、正しい鍵をハッシュ値にドラッグして電子署名を作ろう",
    points: ["③ ハッシュ関数で、送る文書のハッシュ値を求める", "④ ハッシュ値を自分の秘密鍵で暗号化して、電子署名を作る"],
  },
  {
    id: "send",
    chapter: 4,
    title: "3つをまとめて送る",
    description: "Aさんは、電子証明書・電子署名・文書の3つを Bさんに送ります。札をドラッグして送ろう。",
    stage: { kind: "transfer", scene: "send" },
    mission: "電子証明書・電子署名・文書の札を、順に Bさんまでドラッグして送ろう",
    points: ["⑤ 電子証明書・電子署名・文書を送る"],
  },
  {
    id: "verify",
    chapter: 4,
    title: "電子署名を確かめる（受信者）",
    description:
      "受け取った Bさんは、まず認証局で電子証明書が有効で Aさん本人のものかを確かめ、公開鍵を取り出します。その公開鍵で電子署名を復号してハッシュ値 A を得ます。次に、届いた文書からハッシュ関数でハッシュ値 B を求めます。2つが同じなら、文書は改ざんされていないと分かります。",
    stage: { kind: "verify", scenarios: ["ok"] },
    quiz: { kind: "task" },
    mission: "電子証明書を認証局で確かめ、公開鍵を電子署名に、文書をハッシュ関数にドラッグして、ハッシュ値 A と B を比べよう",
    points: ["⑥ 認証局で電子証明書を確かめ、公開鍵を取り出す", "⑦ 公開鍵で電子署名を復号し、ハッシュ値 A を得る", "⑧ 文書からハッシュ値 B を求める", "⑨ A と B が同じなら、改ざんされていない"],
  },
  {
    id: "attack-verify",
    chapter: 4,
    title: "改ざん・なりすましを見破る",
    description:
      "今度は、途中で文書を書きかえられた場合と、Cさんが Aさんになりすまして自分の秘密鍵で電子署名を作った場合です。Bさんの立場で、同じように確かめてみよう。",
    stage: { kind: "verify", scenarios: ["tamper", "spoof"] },
    mission: "「改ざん」「なりすまし」の両方のタブで確かめて、ハッシュ値 A と B がどうなるか見よう",
    quiz: {
      kind: "choice",
      gate: true,
      question: "途中で文書を書きかえられていたら、ハッシュ値 A と B はどうなると思う？",
      options: ["同じ値になる", "どちらも 0 になる", "違う値になる"],
      answer: 2,
      ok: "正解！ 文書が1文字でも変わると、ハッシュ値 B がまったく違う値になるので、A と一致しません。",
      ng: "文書が1文字でも変わると、ハッシュ値 B がまったく違う値になるので、A と一致しません。タブで確かめてみよう。",
    },
  },

  // ---- 第5章 まとめ ----
  {
    id: "roles",
    chapter: 5,
    title: "だれが何をする？",
    description: "電子署名のしくみで、送信者・認証局・受信者がそれぞれ何をするかを仕分けよう。",
    stage: { kind: "roles" },
    quiz: { kind: "task" },
    mission: "カードを「送信者」「認証局」「受信者」の箱へドラッグして仕分けよう",
  },
  {
    id: "keyroles",
    chapter: 5,
    title: "電子署名に使う鍵の組み合わせ",
    description:
      "電子署名を作るときと、確かめる（検証する）ときに使う鍵を考えよう。公開鍵暗号方式で暗号化するときとは、使う鍵の順番が逆になっています。",
    stage: { kind: "keyroles" },
    quiz: { kind: "task" },
    mission: "鍵の札を「作成に使う鍵」「検証に使う鍵」の枠へドラッグしよう",
    points: ["作成：送信者の秘密鍵（本人しか持っていない）", "検証：送信者の公開鍵（だれでも確かめられる）"],
  },
  {
    chapter: 5,
    title: "まとめテスト",
    description:
      "ここまでの内容から8問です。全部答えたら「採点する」を押してください。間違えた問題は、説明のスライドに戻って確認できます。最後の結果画面をスクリーンショットして提出しましょう。",
    stage: { kind: "test" },
    quiz: { kind: "test" },
  },
];

export function slideIndexOf(id: string) {
  return SLIDES.findIndex((s) => s.id === id);
}

// ---------- 仕分け ----------

export interface SortSpec<B extends string> {
  bins: { bin: B; title: string; color: string; bg: string }[];
  items: { label: string; answer: B }[];
}

export const ROLES_SORT: SortSpec<"a" | "ca" | "b"> = {
  bins: [
    { bin: "a", title: "👩 送信者", color: "#c2185b", bg: "#fce4ec" },
    { bin: "ca", title: "🏛️ 認証局", color: "#1565c0", bg: "#e3f2fd" },
    { bin: "b", title: "🧑 受信者", color: "#2e7d32", bg: "#e8f5e9" },
  ],
  items: [
    { label: "鍵のペアを作り、公開鍵を届け出る", answer: "a" },
    { label: "電子証明書を発行する", answer: "ca" },
    { label: "文書のハッシュ値を秘密鍵で暗号化する", answer: "a" },
    { label: "電子証明書が有効か確かめる", answer: "b" },
    { label: "公開鍵で電子署名を復号する", answer: "b" },
    { label: "2つのハッシュ値を比べる", answer: "b" },
  ],
};

// ---------- まとめテスト ----------

export const TEST_QUESTIONS: { question: string; options: string[]; answer: number; review: string }[] = [
  {
    question: "デジタル文書の本人確認と改ざん防止のために使われるものは？",
    options: ["電子署名", "ハッシュ値", "共通鍵"],
    answer: 0,
    review: "attack",
  },
  {
    question: "公開鍵を管理し、正しい相手であることを保証する電子証明書を発行する機関は？",
    options: ["Web サーバ", "認証局", "プロバイダ"],
    answer: 1,
    review: "ca",
  },
  {
    question: "ハッシュ関数の性質として正しいものは？",
    options: ["同じデータでも、毎回違うハッシュ値になる", "ハッシュ値から元のデータが簡単に分かる", "1文字でも違うと、まったく違うハッシュ値になる"],
    answer: 2,
    review: "hash",
  },
  {
    question: "電子署名を作るとき、ハッシュ値を暗号化する鍵は？",
    options: ["送信者の公開鍵", "送信者の秘密鍵", "受信者の公開鍵"],
    answer: 1,
    review: "sign",
  },
  {
    question: "受信者が電子署名を復号するときに使う鍵は？",
    options: ["送信者の公開鍵", "送信者の秘密鍵", "受信者の秘密鍵"],
    answer: 0,
    review: "verify",
  },
  {
    question: "受信者が、送信者の公開鍵が本物かを確かめるために使うものは？",
    options: ["ハッシュ値 B", "文書", "電子証明書"],
    answer: 2,
    review: "verify",
  },
  {
    question: "ハッシュ値 A と B が同じだったとき、分かることは？",
    options: ["文書は改ざんされた", "文書は改ざんされていない", "送信者は別人である"],
    answer: 1,
    review: "attack-verify",
  },
  {
    question: "電子署名に使う鍵の組み合わせとして正しいものは？",
    options: ["作成：公開鍵／検証：秘密鍵", "作成：共通鍵／検証：秘密鍵", "作成：秘密鍵／検証：公開鍵"],
    answer: 2,
    review: "keyroles",
  },
];
