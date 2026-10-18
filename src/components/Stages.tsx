"use client";
import { type DragEvent, type MouseEvent, type ReactNode, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DOC, DOC_TAMPERED, hashOf } from "@/lib/hash";
import { KEYS, PRIV_COLOR, PUB_COLOR, type KeyId } from "@/lib/keys";
import { CIPHER_COLOR, EVE_COLOR, PLAIN_COLOR, type Scenario, type SortSpec } from "@/lib/model";
import { useDoneWhen, useWheelStep } from "./hooks";
import { Feedback } from "./Quizzes";

const CA_COLOR = "#1565c0";
const HASH_COLOR = "#00838f";

// ---------- 共通部品：ドラッグでもタップでも置けるカード ----------

function dragCard(id: string, picked: string | null, setPicked: (v: string | null) => void) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData("text/plain", id);
      setPicked(id);
    },
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      setPicked(picked === id ? null : id);
    },
  };
}

function dropTarget(onPut: (id: string) => void, picked: string | null) {
  return {
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      onPut(e.dataTransfer.getData("text/plain"));
    },
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      if (picked) onPut(picked);
    },
  };
}

/** ドラッグできる札（鍵や文書） */
function Chip({ id, label, color, picked, setPicked, disabled }: { id: string; label: ReactNode; color: string; picked: string | null; setPicked: (v: string | null) => void; disabled?: boolean }) {
  const on = picked === id;
  return (
    <Box
      {...(disabled ? {} : dragCard(id, picked, setPicked))}
      role="button"
      aria-pressed={on}
      data-chip={id}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: 5,
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: disabled ? "default" : "grab",
        userSelect: "none",
        border: `2.5px solid ${color}`,
        bgcolor: on ? color : "#fff",
        color: on ? "#fff" : color,
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? 0 : 2,
      }}
    >
      {label}
    </Box>
  );
}

function KeyChip({ id, picked, setPicked, disabled }: { id: KeyId; picked: string | null; setPicked: (v: string | null) => void; disabled?: boolean }) {
  const k = KEYS[id];
  return <Chip id={id} label={`${k.icon} ${k.label}`} color={k.color} picked={picked} setPicked={setPicked} disabled={disabled} />;
}

/** 札を落とす場所 */
function Drop({
  id,
  onPut,
  picked,
  color,
  children,
  shake,
}: {
  id: string;
  onPut: (v: string) => void;
  picked: string | null;
  color: string;
  children: ReactNode;
  shake?: number;
}) {
  return (
    <Box
      key={shake}
      className={shake ? "shake" : undefined}
      data-drop={id}
      {...dropTarget(onPut, picked)}
      sx={{ border: `2.5px ${picked ? "dashed" : "solid"} ${color}`, borderRadius: 3, p: 1.25, textAlign: "center", bgcolor: picked ? "#e3f2fd" : "#fff", cursor: picked ? "pointer" : "default" }}
    >
      {children}
    </Box>
  );
}

function HashValue({ label, value, color = HASH_COLOR }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} sx={{ color }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.05rem", color }}>{value}</Typography>
    </Box>
  );
}

function DocCard({ text, title = "📄 文書" }: { text: ReactNode; title?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderWidth: 2, borderColor: PLAIN_COLOR, bgcolor: "#fafafa" }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        {title}
      </Typography>
      <Typography fontWeight={700}>{text}</Typography>
    </Paper>
  );
}

// ---------- 第1章：改ざん・なりすましをしてみる ----------

export function AttackStage({ onDone }: { onDone?: () => void }) {
  const [tampered, setTampered] = useState(false);
  const [spoofed, setSpoofed] = useState(false);
  useDoneWhen(tampered && spoofed, onDone);

  const amount = tampered ? "1,000,000円" : "10,000円";
  const spot = (on: boolean, text: string, onDouble: () => void, id: string) => (
    <Box
      component="span"
      data-spot={id}
      onDoubleClick={onDouble}
      title="ダブルクリックで書きかえる"
      sx={{ px: 0.5, mx: 0.25, borderRadius: 1, cursor: "pointer", userSelect: "none", bgcolor: on ? "#ffcdd2" : "#fff59d", color: on ? EVE_COLOR : "inherit", border: `1px dashed ${on ? EVE_COLOR : "#f9a825"}` }}
    >
      {text}
    </Box>
  );

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontWeight={700}>👩 Aさん</Typography>
        <Box sx={{ flex: 1, mx: 1, borderTop: "4px solid #90a4ae" }} />
        <Typography fontWeight={700}>🧑 Bさん</Typography>
      </Stack>
      <Paper variant="outlined" sx={{ p: 1.5, borderWidth: 2, borderColor: EVE_COLOR, bgcolor: "#fff8f8" }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: EVE_COLOR, mb: 1 }}>
          🕵️ 通信路の途中で、文書を手に入れた（あなたは悪い人）
        </Typography>
        <DocCard
          text={
            <>
              Bさんへ　代金{spot(tampered, amount, () => setTampered(true), "amount")}を支払います。
              {spot(spoofed, "Aより", () => setSpoofed(true), "from")}
            </>
          }
          title="📄 Aさんが送った文書（黄色の部分をダブルクリック）"
        />
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
          <Typography variant="body2" fontWeight={700} color={tampered ? EVE_COLOR : "text.secondary"}>
            {tampered ? "✓ 改ざんした（金額を書きかえた）" : "□ 改ざん"}
          </Typography>
          <Typography variant="body2" fontWeight={700} color={spoofed ? EVE_COLOR : "text.secondary"}>
            {spoofed ? "✓ なりすました（Cさんが書いたのに「Aより」）" : "□ なりすまし"}
          </Typography>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="body2" fontWeight={700} mb={0.5}>
          🧑 Bさんの画面
        </Typography>
        <DocCard text={`Bさんへ　代金 ${amount} を支払います。Aより`} title="📄 届いた文書" />
        {tampered && spoofed && (
          <Typography variant="body2" fontWeight={700} mt={1} sx={{ color: EVE_COLOR }}>
            Bさんには、書きかえられたことも、Aさん本人でないことも見分けがつきません！
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}

// ---------- 第2章：ハッシュ関数 ----------

export function HashStage({ onDone }: { onDone?: () => void }) {
  const [copy, setCopy] = useState(DOC);
  const [sawDiff, setSawDiff] = useState(false);
  const [restored, setRestored] = useState(false);
  useDoneWhen(restored, onDone);
  const same = copy === DOC;

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 1.25 }}>
          <DocCard text={DOC} title="📄 もとの文書" />
          <Typography sx={{ textAlign: "center", color: HASH_COLOR, my: 0.5 }}>⬇ ⚙️ ハッシュ関数</Typography>
          <HashValue label="ハッシュ値" value={hashOf(DOC)} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.25 }}>
          <TextField
            fullWidth
            size="small"
            label="✏️ 書きかえてみる文書"
            value={copy}
            onChange={(e) => {
              setCopy(e.target.value);
              if (e.target.value !== DOC) setSawDiff(true);
              else if (sawDiff) setRestored(true);
            }}
            slotProps={{ htmlInput: { "data-copy": true } }}
          />
          <Typography sx={{ textAlign: "center", color: HASH_COLOR, my: 0.5 }}>⬇ ⚙️ ハッシュ関数</Typography>
          <HashValue label="ハッシュ値" value={hashOf(copy)} color={same ? HASH_COLOR : EVE_COLOR} />
        </Paper>
      </Box>
      <Paper variant="outlined" sx={{ p: 1, textAlign: "center", borderWidth: 2, borderColor: same ? "success.main" : EVE_COLOR }}>
        <Typography fontWeight={700} color={same ? "success.main" : EVE_COLOR}>
          {same ? "⭕ ハッシュ値が一致（同じデータ）" : "❌ ハッシュ値が不一致（データが違う）"}
        </Typography>
      </Paper>
      <Button size="small" variant="outlined" onClick={() => {
        setCopy(DOC);
        if (sawDiff) setRestored(true);
      }} sx={{ alignSelf: "flex-start" }}>
        元に戻す
      </Button>
      {restored && <Feedback ok>1文字違うだけでハッシュ値はまったく違う値になり、同じ文書に戻すと同じハッシュ値に戻りました。</Feedback>}
    </Stack>
  );
}

// ---------- 第2章：ハッシュ値から元のデータを当てる ----------

const SECRET = "あしたの3時に駅で";
const CANDIDATES = ["こんにちは", "りんご", "あした駅で", "3時に駅", "ありがとう", "あしたの3時", "駅で待つ", "さくら", "あしたの4時に駅で", "ひみつ", "おはよう", "またあした", "えき", "3じ", "あしたの3時に駅", "テスト"];
const GUESS_GOAL = 10;

export function HashGuessStage({ onDone }: { onDone?: () => void }) {
  const [count, setCount] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const next = () => setCount((c) => c + 1);
  useWheelStep(box, next);
  useDoneWhen(count >= GUESS_GOAL, onDone);
  const tried = Array.from({ length: Math.min(count, 6) }, (_, i) => CANDIDATES[(count - 1 - i) % CANDIDATES.length]);

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.25, borderWidth: 2, borderColor: HASH_COLOR }}>
        <HashValue label="手に入れたハッシュ値（元のデータは？）" value={hashOf(SECRET)} />
      </Paper>
      <Box ref={box} data-guess title="ホイールを回すと、次の言葉を試します" sx={{ border: `2px dashed ${EVE_COLOR}`, borderRadius: 2, p: 1.25, bgcolor: "#fff8f8", cursor: "ns-resize", userSelect: "none" }}>
        <Stack direction="row" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" fontWeight={700} sx={{ color: EVE_COLOR }}>
            🕵️ 言葉を入れてハッシュ値を求める（ホイールで次々に）
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            試した数：{count}
          </Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ height: 150, overflow: "hidden" }}>
          {count === 0 && (
            <Typography variant="body2" color="text.secondary">
              ここでマウスホイールを回すと、言葉を1つずつ試します。
            </Typography>
          )}
          {tried.map((w, i) => (
            <Stack key={`${count - i}`} direction="row" spacing={1} alignItems="center" sx={{ opacity: 1 - i * 0.13 }}>
              <Typography fontWeight={700} sx={{ minWidth: 130 }}>
                「{w}」
              </Typography>
              <Typography sx={{ fontFamily: "monospace", color: HASH_COLOR }}>{hashOf(w)}</Typography>
              <Typography fontWeight={700} sx={{ color: EVE_COLOR }}>
                ✕
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
      <Box>
        <Button variant="outlined" onClick={next}>
          次の言葉を試す
        </Button>
      </Box>
      {count >= GUESS_GOAL && (
        <Feedback ok>
          {count} 個試しても見つかりません。元のデータと少し似た言葉でも、ハッシュ値はまったく違います。ハッシュ値から元のデータを推測するのは困難です。（答えは「{SECRET}」でした）
        </Feedback>
      )}
    </Stack>
  );
}

// ---------- 第3章：認証局と電子証明書 ----------

function Certificate({ small }: { small?: boolean }) {
  return (
    <Box sx={{ display: "inline-block", border: `3px double ${CA_COLOR}`, borderRadius: 2, px: 1.5, py: 0.75, bgcolor: "#fff", textAlign: "left" }}>
      <Typography fontWeight={700} sx={{ color: CA_COLOR, fontSize: small ? "0.85rem" : "1rem" }}>
        📜 電子証明書
      </Typography>
      <Typography variant="body2">名前：Aさん</Typography>
      <Typography variant="body2" sx={{ color: PUB_COLOR, fontWeight: 700 }}>
        🔑 Aさんの公開鍵
      </Typography>
      <Typography variant="caption">🏅 認証局が保証します</Typography>
    </Box>
  );
}

export function CAStage({ onDone }: { onDone?: () => void }) {
  const [made, setMade] = useState(false);
  const [issued, setIssued] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [ng, setNg] = useState(0);
  useDoneWhen(issued, onDone);

  const put = (id: string) => {
    setPicked(null);
    if (id === "Apub") setIssued(true);
    else if (id === "Apriv") setNg(ng + 1);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, alignItems: "start" }}>
        <Stack spacing={1} alignItems="center">
          <Typography fontWeight={700}>👩 Aさん（送信者）</Typography>
          <Box
            role="button"
            tabIndex={0}
            data-machine
            onDoubleClick={() => setMade(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                setMade(true);
              }
            }}
            title="ダブルクリックで鍵を作る"
            sx={{ p: 1, borderRadius: 3, textAlign: "center", border: "3px solid #546e7a", bgcolor: made ? "#eceff1" : "#fff8e1", cursor: "pointer", userSelect: "none", width: 160 }}
          >
            <Typography sx={{ fontSize: "1.8rem" }}>🏭</Typography>
            <Typography variant="body2" fontWeight={700}>
              鍵を作る機械
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {made ? "鍵のペアができた" : "ダブルクリック！"}
            </Typography>
          </Box>
          {made && (
            <Stack spacing={0.75} alignItems="center" className="seq-anim">
              {!issued && <KeyChip id="Apub" picked={picked} setPicked={setPicked} />}
              <KeyChip id="Apriv" picked={picked} setPicked={setPicked} />
            </Stack>
          )}
        </Stack>
        <Drop id="ca" onPut={put} picked={picked} color={CA_COLOR} shake={ng}>
          <Typography sx={{ fontSize: "2rem" }}>🏛️</Typography>
          <Typography fontWeight={700} sx={{ color: CA_COLOR }}>
            認証局（CA）
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            ここに届け出る鍵をドラッグ
          </Typography>
          {issued && <Certificate />}
        </Drop>
      </Box>
      {issued ? (
        <Feedback ok>電子証明書が発行されました！ 認証局が「この公開鍵は Aさんのもの」と保証してくれるので、受け取った人は安心してこの公開鍵を使えます。</Feedback>
      ) : (
        ng > 0 && <Feedback ok={false}>秘密鍵は、自分だけで持っておく鍵です。認証局にも渡しません。届け出るのは公開鍵です。</Feedback>
      )}
    </Stack>
  );
}

// ---------- 第4章：電子署名を作る ----------

export function SignStage({ onDone }: { onDone?: () => void }) {
  const [hashed, setHashed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [ng, setNg] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  useDoneWhen(signed, onDone);

  const putHash = (id: string) => {
    setPicked(null);
    if (id === "doc") setHashed(true);
  };
  const putKey = (id: string) => {
    setPicked(null);
    if (id === "Apriv") {
      setSigned(true);
      setNg(null);
    } else if (id === "Apub") {
      setNg("電子署名は、本人しか持っていない秘密鍵で作ります。公開鍵はだれでも手に入れられるので、だれでも同じものを作れてしまいます。");
      setShake(shake + 1);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap alignItems="center">
        <Chip id="doc" label="📄 文書" color={PLAIN_COLOR} picked={picked} setPicked={setPicked} disabled={hashed} />
        <KeyChip id="Apub" picked={picked} setPicked={setPicked} disabled={!hashed || signed} />
        <KeyChip id="Apriv" picked={picked} setPicked={setPicked} disabled={!hashed || signed} />
      </Stack>
      <DocCard text={DOC} title="📄 Bさんに送る文書" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        <Drop id="hash" onPut={putHash} picked={picked} color={HASH_COLOR}>
          <Typography fontWeight={700} sx={{ color: HASH_COLOR }}>
            ⚙️ ハッシュ関数
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            ③ ここに文書をドラッグ
          </Typography>
          {hashed && <HashValue label="ハッシュ値" value={hashOf(DOC)} />}
        </Drop>
        <Drop id="sign" onPut={putKey} picked={picked} color={signed ? CIPHER_COLOR : PRIV_COLOR} shake={shake}>
          <Typography fontWeight={700} sx={{ color: CIPHER_COLOR }}>
            🔏 電子署名
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            ④ ハッシュ値を暗号化する鍵をここにドラッグ
          </Typography>
          {signed ? (
            <Typography sx={{ fontFamily: "monospace", fontWeight: 700, color: CIPHER_COLOR }}>🔒 %&amp;4hts!q9#</Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {hashed ? "（まだ作っていない）" : "（先にハッシュ値を求めよう）"}
            </Typography>
          )}
        </Drop>
      </Box>
      {signed ? (
        <Feedback ok>電子署名ができました！ 文書のハッシュ値を、Aさんだけが持つ秘密鍵で暗号化したものです。</Feedback>
      ) : (
        ng && <Feedback ok={false}>{ng}</Feedback>
      )}
    </Stack>
  );
}

// ---------- 第4章：電子署名を確かめる ----------

const SPOOF_DOC = "代金 10,000円 を Cの口座 に振り込んでください。Aより";
const SCENARIO_INFO: Record<Scenario, { tab: string; doc: string; note: string }> = {
  ok: { tab: "ふつうに届いた", doc: DOC, note: "" },
  tamper: { tab: "改ざん", doc: DOC_TAMPERED, note: "途中で、だれかが文書の金額を書きかえました。" },
  spoof: { tab: "なりすまし", doc: SPOOF_DOC, note: "Cさんが Aさんになりすまして、自分の秘密鍵で電子署名を作りました。電子証明書は Aさんのものをそのまま付けています。" },
};

interface VerifyState {
  cert: boolean;
  hashA: boolean;
  hashB: boolean;
}

export function VerifyStage({ scenarios, onDone }: { scenarios: Scenario[]; onDone?: () => void }) {
  const [tab, setTab] = useState<Scenario>(scenarios[0]);
  const [state, setState] = useState<Partial<Record<Scenario, VerifyState>>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const st = state[tab] ?? { cert: false, hashA: false, hashB: false };
  const finished = scenarios.filter((s) => state[s]?.hashA && state[s]?.hashB);
  useDoneWhen(finished.length === scenarios.length, onDone);

  const info = SCENARIO_INFO[tab];
  // なりすましの電子署名は、Aさんの公開鍵では正しく復号できない
  const hashA = tab === "spoof" ? hashOf(`${SPOOF_DOC}#C`) : hashOf(DOC);
  const hashB = hashOf(info.doc);
  const match = hashA === hashB;
  const set = (patch: Partial<VerifyState>) => setState({ ...state, [tab]: { ...st, ...patch } });

  return (
    <Stack spacing={1.5}>
      {scenarios.length > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center">
          {scenarios.map((s) => (
            <Button
              key={s}
              size="small"
              data-scenario={s}
              variant={tab === s ? "contained" : "outlined"}
              color="secondary"
              onClick={() => {
                setTab(s);
                setPicked(null);
              }}
            >
              {SCENARIO_INFO[s].tab}
              {finished.includes(s) && " ✓"}
            </Button>
          ))}
        </Stack>
      )}
      {info.note && (
        <Typography variant="body2" fontWeight={700} sx={{ color: EVE_COLOR }}>
          🕵️ {info.note}
        </Typography>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1 }}>
        {/* ⑥ 電子証明書 */}
        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
          <Certificate small />
          <Box mt={1}>
            {st.cert ? (
              <Stack spacing={0.5} alignItems="center">
                <Typography variant="caption" fontWeight={700} color="success.main">
                  ✓ 有効な Aさんの証明書
                </Typography>
                <KeyChip id="Apub" picked={picked} setPicked={setPicked} disabled={st.hashA} />
              </Stack>
            ) : (
              <Button size="small" variant="contained" data-cert onClick={() => set({ cert: true })}>
                ⑥ 認証局で確かめる
              </Button>
            )}
          </Box>
        </Paper>
        {/* ⑦ 電子署名 */}
        <Drop
          id="signature"
          onPut={(id) => {
            setPicked(null);
            if (id === "Apub") set({ hashA: true });
          }}
          picked={picked}
          color={CIPHER_COLOR}
        >
          <Typography fontWeight={700} sx={{ color: CIPHER_COLOR }}>
            🔏 電子署名
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            ⑦ 公開鍵をここにドラッグ
          </Typography>
          {st.hashA ? <HashValue label="ハッシュ値 A" value={hashA} color={CIPHER_COLOR} /> : <Typography sx={{ fontFamily: "monospace" }}>🔒 %&amp;4hts!q9#</Typography>}
        </Drop>
        {/* ⑧ 文書 */}
        <Paper variant="outlined" sx={{ p: 1, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            {info.doc}
          </Typography>
          {!st.hashB && <Chip id="doc" label="📄 文書" color={PLAIN_COLOR} picked={picked} setPicked={setPicked} />}
          <Box mt={1}>
            <Drop
              id="hash"
              onPut={(id) => {
                setPicked(null);
                if (id === "doc") set({ hashB: true });
              }}
              picked={picked}
              color={HASH_COLOR}
            >
              <Typography variant="body2" fontWeight={700} sx={{ color: HASH_COLOR }}>
                ⚙️ ハッシュ関数
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                ⑧ 文書をここにドラッグ
              </Typography>
              {st.hashB && <HashValue label="ハッシュ値 B" value={hashB} />}
            </Drop>
          </Box>
        </Paper>
      </Box>
      {/* ⑨ 比べる */}
      {st.hashA && st.hashB ? (
        <Paper variant="outlined" sx={{ p: 1.25, textAlign: "center", borderWidth: 2, borderColor: match ? "success.main" : EVE_COLOR, bgcolor: match ? "#f1f8e9" : "#ffebee" }}>
          <Typography fontWeight={700} color={match ? "success.main" : EVE_COLOR}>
            ⑨ {match ? "ハッシュ値 A と B が一致！ 文書は改ざんされていません" : "ハッシュ値 A と B が一致しない！ この文書は信用できません"}
          </Typography>
          <Typography variant="body2" mt={0.5}>
            {tab === "ok" && "Aさんの公開鍵で復号できたので、Aさん本人の秘密鍵で作った電子署名だと分かります。"}
            {tab === "tamper" && "文書が書きかえられたので、文書から求めたハッシュ値 B が変わりました。"}
            {tab === "spoof" && "Cさんの秘密鍵で作った電子署名は、Aさんの公開鍵では正しく復号できないので、ハッシュ値 A が合いません。"}
          </Typography>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          ⑥〜⑧をすべて終えると、⑨ でハッシュ値 A と B を比べます。
        </Typography>
      )}
    </Stack>
  );
}

// ---------- 第5章：作成と検証に使う鍵 ----------

export function KeyRolesStage({ onDone }: { onDone?: () => void }) {
  const [slots, setSlots] = useState<{ make?: KeyId; check?: KeyId }>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [ng, setNg] = useState<{ text: string; n: number } | null>(null);
  useDoneWhen(slots.make === "Apriv" && slots.check === "Apub", onDone);

  const put = (slot: "make" | "check", id: string) => {
    setPicked(null);
    if (id !== "Apub" && id !== "Apriv") return;
    const ok = (slot === "make" && id === "Apriv") || (slot === "check" && id === "Apub");
    if (ok) {
      setSlots({ ...slots, [slot]: id });
      setNg(null);
    } else
      setNg({
        text:
          slot === "make"
            ? "公開鍵はだれでも手に入れられるので、公開鍵で作った署名はだれでも作れてしまいます。本人であることの証明になりません。"
            : "秘密鍵は送信者だけが持っている鍵なので、受信者は使えません。",
        n: (ng?.n ?? 0) + 1,
      });
  };

  const slot = (s: "make" | "check", title: string) => (
    <Drop id={s} onPut={(id) => put(s, id)} picked={picked} color={s === "make" ? "#c2185b" : "#2e7d32"} shake={ng?.n}>
      <Typography fontWeight={700}>{title}</Typography>
      <Box mt={1} minHeight={36}>
        {slots[s] ? (
          <KeyChip id={slots[s]!} picked={null} setPicked={() => {}} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            （ここに鍵をドラッグ）
          </Typography>
        )}
      </Box>
    </Drop>
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} justifyContent="center">
        {(["Apub", "Apriv"] as KeyId[])
          .filter((k) => slots.make !== k && slots.check !== k)
          .map((k) => (
            <KeyChip key={k} id={k} picked={picked} setPicked={setPicked} />
          ))}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        {slot("make", "✍️ 電子署名の作成に使う鍵（送信者）")}
        {slot("check", "🔍 検証に使う鍵（受信者）")}
      </Box>
      {slots.make === "Apriv" && slots.check === "Apub" ? (
        <Feedback ok>
          正解！ 本人しか持っていない秘密鍵で作るから「本人が作った」と分かり、だれでも手に入れられる公開鍵で確かめられます。公開鍵暗号方式で暗号文を送るとき（公開鍵で暗号化・秘密鍵で復号）とは逆の使い方です。
        </Feedback>
      ) : (
        ng && <Feedback ok={false}>{ng.text}</Feedback>
      )}
    </Stack>
  );
}

// ---------- 仕分け ----------

export function SortStage<B extends string>({ spec, onDone }: { spec: SortSpec<B>; onDone?: () => void }) {
  const [box, setBox] = useState<Record<string, B | undefined>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [miss, setMiss] = useState<{ label: string; n: number } | null>(null);
  const done = spec.items.every((i) => box[i.label]);
  useDoneWhen(done, onDone);

  const put = (bin: B, label: string) => {
    const item = spec.items.find((i) => i.label === label);
    if (!item || box[label]) return;
    setPicked(null);
    if (item.answer === bin) {
      setBox({ ...box, [label]: bin });
      setMiss(null);
    } else setMiss({ label, n: (miss?.n ?? 0) + 1 });
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ minHeight: 40 }}>
        {spec.items
          .filter((i) => !box[i.label])
          .map((i) => (
            <Box
              key={miss?.label === i.label ? `${i.label}-${miss.n}` : i.label}
              className={miss?.label === i.label ? "shake" : undefined}
              {...dragCard(i.label, picked, setPicked)}
              role="button"
              aria-pressed={picked === i.label}
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "grab",
                userSelect: "none",
                border: `2px solid ${miss?.label === i.label ? EVE_COLOR : "#455a64"}`,
                bgcolor: picked === i.label ? "#455a64" : "#fff",
                color: picked === i.label ? "#fff" : "#455a64",
                boxShadow: 2,
              }}
            >
              {i.label}
            </Box>
          ))}
        {done && <Typography fontWeight={700}>全部仕分けられました！</Typography>}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${spec.bins.length}, minmax(0, 1fr))` }, gap: 1.5 }}>
        {spec.bins.map((b) => (
          <Box
            key={b.bin}
            data-bin={b.bin}
            {...dropTarget((label) => put(b.bin, label), picked)}
            sx={{ border: `2px ${picked ? "dashed" : "solid"} ${b.color}`, bgcolor: b.bg, borderRadius: 3, p: 1.5, minHeight: 140, cursor: picked ? "pointer" : "default" }}
          >
            <Typography fontWeight={700} sx={{ color: b.color, fontSize: "1.05rem", mb: 0.75 }}>
              {b.title}
            </Typography>
            <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
              {spec.items
                .filter((i) => box[i.label] === b.bin)
                .map((i) => (
                  <Typography key={i.label} component="li" variant="body2" fontWeight={600}>
                    {i.label}
                  </Typography>
                ))}
            </Stack>
          </Box>
        ))}
      </Box>
      {miss && !done && <Feedback ok={false}>「{miss.label}」は、そちらではありません。ここまでの体験を思い出してみよう。</Feedback>}
    </Stack>
  );
}
