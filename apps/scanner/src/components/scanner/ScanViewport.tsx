"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Lock,
  Loader2,
  RotateCw,
  Settings,
} from "lucide-react";

interface Props {
  onDecode: (text: string) => void;
  active: boolean;
}

const DEBOUNCE_MS = 3000;
/** How long without a decode before we suggest the torch. Night gates are dark. */
const TORCH_HINT_AFTER_MS = 8000;

/**
 * Every state the camera can actually be in at a gate.
 *
 * The old version had two: working, and one grey screen with a camera emoji that
 * said "tap to retry" whatever had gone wrong. Permission never asked, permission
 * hard-denied at the OS level, a phone with no rear camera, a camera already held
 * by WhatsApp, and a page served over plain HTTP all produce very different
 * problems and exactly one of them is fixed by tapping retry.
 */
type CameraState =
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "dismissed"
  | "not_found"
  | "busy"
  | "insecure"
  | "unsupported"
  | "failed";

interface StateCopy {
  icon: React.ReactNode;
  title: string;
  body: string;
  retry: boolean;
}

const STATE_COPY: Record<Exclude<CameraState, "idle" | "requesting" | "live">, StateCopy> = {
  denied: {
    icon: <Lock className="h-10 w-10 text-destructive" aria-hidden />,
    title: "Camera blocked",
    body: "This phone blocked camera access for the scanner. Open the browser's site settings, allow the camera, then come back — or type codes in by hand until then.",
    retry: false,
  },
  dismissed: {
    icon: <Camera className="h-10 w-10 text-warning" aria-hidden />,
    title: "Camera permission needed",
    body: "Tap below and choose Allow when the phone asks. The camera is only used to read the QR code on a pass.",
    retry: true,
  },
  not_found: {
    icon: <CameraOff className="h-10 w-10 text-muted-foreground" aria-hidden />,
    title: "No camera on this device",
    body: "Nothing to point at a pass. Type the code printed under the QR instead — it works exactly the same.",
    retry: false,
  },
  busy: {
    icon: <CameraOff className="h-10 w-10 text-warning" aria-hidden />,
    title: "Camera is in use",
    body: "Another app has the camera. Close WhatsApp or the camera app, then try again.",
    retry: true,
  },
  insecure: {
    icon: <Lock className="h-10 w-10 text-destructive" aria-hidden />,
    title: "Camera needs a secure connection",
    body: "Phones only allow the camera over HTTPS. Open the scanner on its https:// address — manual entry works either way.",
    retry: false,
  },
  unsupported: {
    icon: <CameraOff className="h-10 w-10 text-muted-foreground" aria-hidden />,
    title: "This browser can't use the camera",
    body: "Open the scanner in Chrome on this phone, or keep going with manual entry.",
    retry: false,
  },
  failed: {
    icon: <RotateCw className="h-10 w-10 text-warning" aria-hidden />,
    title: "Camera stopped",
    body: "The camera dropped out. Try starting it again — every scan already taken is safe.",
    retry: true,
  },
};

/**
 * Maps the DOMException names browsers actually throw onto the states above.
 *
 * `wasPrompting` is what separates "the guard dismissed the sheet" from "this
 * phone has the camera switched off for this site" — both arrive as
 * NotAllowedError, and only the first one is worth a retry button.
 */
function classifyCameraError(err: unknown, wasPrompting: boolean): CameraState {
  const name = err instanceof DOMException ? err.name : "";
  const message = err instanceof Error ? err.message : "";

  if (name === "NotAllowedError" || /permission|denied|NotAllowed/i.test(message)) {
    return wasPrompting ? "dismissed" : "denied";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") return "not_found";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  if (name === "SecurityError") return "insecure";
  return "failed";
}

export function ScanViewport({ onDecode, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastDecodeRef = useRef<{ text: string; at: number } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const onDecodeRef = useRef(onDecode);

  const permissionRef = useRef<PermissionState | null>(null);

  const [state, setState] = useState<CameraState>("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [showTorchHint, setShowTorchHint] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Keep the latest handler without restarting the camera when the parent
  // re-renders — restarting the stream mid-queue drops frames for ~1s.
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  // Screen wake lock — a phone that sleeps between scans costs 3 seconds a head.
  useEffect(() => {
    if (!active) return;
    let released = false;
    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (released) void lock.release().catch(() => {});
          else wakeLockRef.current = lock;
        })
        .catch(() => {
          // Not granted (often: tab not visible). Nothing to recover.
        });
    }
    return () => {
      released = true;
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active]);

  // Before asking, find out whether we have already been told no. A phone that
  // hard-denied the camera should say so rather than fire a prompt that the OS
  // silently swallows, leaving the guard staring at a dead viewport.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    async function probe() {
      if (typeof window === "undefined") return;
      if (!window.isSecureContext) {
        setState("insecure");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      // `permissions.query({name:"camera"})` is unsupported on Safari; absence
      // of an answer is not an answer, so fall through and just ask.
      try {
        const status = await navigator.permissions?.query({
          name: "camera" as PermissionName,
        });
        permissionRef.current = status?.state ?? null;
        if (!cancelled && status?.state === "denied") {
          setState("denied");
          return;
        }
      } catch {
        permissionRef.current = null;
        // Not supported — ask directly.
      }
      if (!cancelled) setState("requesting");
    }

    void probe();
    return () => {
      cancelled = true;
    };
  }, [active, attempt]);

  // Camera + ZXing reader
  useEffect(() => {
    if (!active || state !== "requesting") return;
    let stopped = false;

    async function startCamera() {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 200,
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        // Torch is Android-Chrome-only; showing a dead button on an iPhone is
        // one more thing for a guard to jab at while a queue builds.
        const capabilities = track?.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined;
        setTorchSupported(Boolean(capabilities?.torch));

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // The stream can die under us — the OS reclaims the camera for an
        // incoming call, or the phone is unplugged from a dock.
        track?.addEventListener("ended", () => {
          if (!stopped) setState("failed");
        });

        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current!,
          (result) => {
            if (stopped || !result) return;
            const text = result.getText();
            const now = Date.now();
            const last = lastDecodeRef.current;
            // Same code within 3 seconds is one pass held still, not two people.
            if (last && last.text === text && now - last.at < DEBOUNCE_MS) return;
            lastDecodeRef.current = { text, at: now };
            setShowTorchHint(false);
            onDecodeRef.current(text);
          }
        );

        controlsRef.current = controls;
        setState("live");
      } catch (err) {
        if (!stopped) setState(classifyCameraError(err, permissionRef.current !== "denied"));
      }
    }

    void startCamera();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active, state]);

  // Poor light: after a while with the camera live and nothing decoded, say so.
  useEffect(() => {
    if (state !== "live" || torchOn) {
      setShowTorchHint(false);
      return;
    }
    const id = setTimeout(() => setShowTorchHint(true), TORCH_HINT_AFTER_MS);
    return () => clearTimeout(id);
  }, [state, torchOn]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
      setShowTorchHint(false);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  if (state === "idle" || state === "requesting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-sunken px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Starting camera…</p>
        <p className="text-xs text-muted-foreground/70">
          Choose <span className="font-semibold">Allow</span> if the phone asks
        </p>
      </div>
    );
  }

  if (state !== "live") {
    const copy = STATE_COPY[state];
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-surface-sunken px-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-raised">
          {copy.icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{copy.title}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {copy.body}
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          {/* The way out is always first and always the same: you can still work. */}
          <Link
            href="/scan/manual"
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground active:scale-[0.98]"
          >
            <Keyboard className="h-5 w-5" aria-hidden />
            Type the code instead
          </Link>

          {copy.retry && (
            <button
              onClick={() => {
                setState("idle");
                setAttempt((a) => a + 1);
              }}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground active:bg-surface-raised"
            >
              <RotateCw className="h-4 w-4" aria-hidden />
              Try the camera again
            </button>
          )}

          {state === "denied" && (
            <p className="flex items-start gap-2 text-left text-xs text-muted-foreground">
              <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Chrome: tap the lock icon in the address bar, then Permissions, then
              Camera, then Allow.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        aria-label="Camera viewfinder"
      />

      {/* Scanning reticle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-56 w-56">
          <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white/80" />
          <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white/80" />
          <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white/80" />
          <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white/80" />
        </div>
      </div>

      {torchSupported && (
        <button
          onClick={toggleTorch}
          aria-pressed={torchOn}
          className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20"
          aria-label={torchOn ? "Turn off torch" : "Turn on torch"}
        >
          {torchOn ? (
            <Flashlight className="h-6 w-6 text-warning" aria-hidden />
          ) : (
            <FlashlightOff className="h-6 w-6" aria-hidden />
          )}
        </button>
      )}

      {showTorchHint && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl bg-black/70 px-3 py-2 text-center text-xs text-white/90">
          {torchSupported
            ? "Nothing scanning? Turn on the torch, or hold the pass 20–30 cm away."
            : "Nothing scanning? Hold the pass 20–30 cm away, or type the code in."}
        </div>
      )}
    </div>
  );
}
