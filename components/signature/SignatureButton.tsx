"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, CheckCircle2, PenLine, Copy, Check } from "lucide-react";

interface SignedState {
  signerName: string;
  hash: string;
  at: number;
}

interface SignatureButtonProps {
  batchCode: string;
  /**
   * Phase 3: replace with `api.buyer.confirmReceipt` mutation.
   * Receives signerName, returns { hash: string; at: number }.
   */
  onConfirm?: (signerName: string) => Promise<{ hash: string; at: number }>;
  /** Pre-loaded signed state from the server (Phase 2/3) */
  initialSigned?: SignedState;
}

type UIState = "available" | "modal-open" | "signing" | "signed";

// Stub signing — SHA-256-shaped fake hash
async function stubConfirm(
  _signerName: string,
): Promise<{ hash: string; at: number }> {
  await new Promise((r) => setTimeout(r, 800));
  const bytes = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  );
  return { hash: bytes.join(""), at: Date.now() };
}

function formatStampDate(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// LocalStorage key for persisting the signed state across reloads (Phase 1 only)
function storageKey(batchCode: string): string {
  return `herb:signature:${batchCode}`;
}

export default function SignatureButton({
  batchCode,
  onConfirm,
  initialSigned,
}: SignatureButtonProps) {
  const [uiState, setUiState] = useState<UIState>(
    initialSigned ? "signed" : "available",
  );
  const [signerInput, setSignerInput] = useState("");
  const [signed, setSigned] = useState<SignedState | null>(initialSigned ?? null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Rehydrate signed state from localStorage (Phase 1 persistence)
  useEffect(() => {
    if (initialSigned) return;
    try {
      const stored = localStorage.getItem(storageKey(batchCode));
      if (stored) {
        const parsed = JSON.parse(stored) as SignedState;
        setSigned(parsed);
        setUiState("signed");
      }
    } catch {
      // ignore parse errors
    }
  }, [batchCode, initialSigned]);

  // Focus the name input when modal opens
  useEffect(() => {
    if (uiState === "modal-open") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [uiState]);

  // Trap focus in modal
  useEffect(() => {
    if (uiState !== "modal-open" || !modalRef.current) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUiState("available");
        setSignerInput("");
        setError(null);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [uiState]);

  async function handleSign() {
    if (!signerInput.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);
    setUiState("signing");

    try {
      const confirm = onConfirm ?? stubConfirm;
      const result = await confirm(signerInput.trim());
      const state: SignedState = {
        signerName: signerInput.trim(),
        hash: result.hash,
        at: result.at,
      };
      // Persist across reloads (Phase 1)
      try {
        localStorage.setItem(storageKey(batchCode), JSON.stringify(state));
      } catch {
        // storage unavailable — transient state only
      }
      setSigned(state);
      setUiState("signed");
    } catch {
      setError("Signing failed. Please try again.");
      setUiState("modal-open");
    }
  }

  function handleCopyHash() {
    if (!signed) return;
    navigator.clipboard.writeText(`sha256:${signed.hash}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Signed stamp (permanent) ────────────────────────────────────────────────
  if (uiState === "signed" && signed) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={20}
            className="text-emerald-700 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-stone-900">Receipt confirmed</div>
            <div className="text-sm text-stone-700 mt-0.5">
              Signed by{" "}
              <span className="font-medium">{signed.signerName}</span>
              <span className="font-mono text-stone-500 ml-1">
                · {formatStampDate(signed.at)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-white border border-emerald-200">
              <code className="text-xs font-mono text-stone-500 break-all flex-1">
                sha256:{signed.hash}
              </code>
              <button
                onClick={handleCopyHash}
                aria-label="Copy signature hash"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 transition flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-600" aria-hidden="true" />
                ) : (
                  <Copy size={12} aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Modal ───────────────────────────────────────────────────────────────────
  if (uiState === "modal-open" || uiState === "signing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-stone-900/40"
          onClick={() => {
            if (uiState !== "signing") {
              setUiState("available");
              setSignerInput("");
              setError(null);
            }
          }}
          aria-hidden="true"
        />
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-modal-title"
          className="relative rounded-2xl bg-white shadow-lg p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <PenLine size={18} className="text-emerald-700" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="sign-modal-title"
                className="font-semibold text-stone-900 text-base"
              >
                Confirm receipt
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Batch{" "}
                <span className="font-mono text-stone-600">{batchCode}</span>
              </p>
            </div>
          </div>

          <p className="text-sm text-stone-600 mb-4">
            By signing you record receipt of this batch against its trace permanently.
            This action cannot be undone.
          </p>

          <div className="mb-4">
            <label
              htmlFor="signer-name"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Your full name
            </label>
            <input
              ref={inputRef}
              id="signer-name"
              type="text"
              value={signerInput}
              onChange={(e) => {
                setSignerInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSign();
              }}
              placeholder="e.g. K. Andersen"
              disabled={uiState === "signing"}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 min-h-12 placeholder:text-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 disabled:opacity-50"
              aria-describedby={error ? "sign-error" : undefined}
            />
            {error && (
              <p id="sign-error" className="text-xs text-red-700 mt-1" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSign}
              disabled={uiState === "signing" || !signerInput.trim()}
              className="inline-flex items-center justify-center gap-2 flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              {uiState === "signing" ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Signing…
                </>
              ) : (
                <>
                  <PenLine size={16} aria-hidden="true" />
                  Sign and confirm
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (uiState === "signing") return;
                setUiState("available");
                setSignerInput("");
                setError(null);
              }}
              disabled={uiState === "signing"}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Available ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <button
        onClick={() => setUiState("modal-open")}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-base font-medium text-white shadow-sm min-h-14 transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
      >
        <PenLine size={18} aria-hidden="true" />
        Confirm receipt of this batch
      </button>
      <p className="text-xs text-center text-stone-500">
        By signing you record receipt against this trace permanently.
      </p>
    </div>
  );
}
