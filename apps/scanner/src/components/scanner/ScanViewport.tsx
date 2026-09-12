"use client";

import { useEffect, useRef, useState } from "react";
import { Flashlight, FlashlightOff } from "lucide-react";

interface Props {
  onDecode: (text: string) => void;
  active: boolean;
}

const DEBOUNCE_MS = 3000;

export function ScanViewport({ onDecode, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastDecodeRef = useRef<{ text: string; at: number } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Wake lock — keep screen awake while scanning
  useEffect(() => {
    if (!active) return;
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => { /* wakeLock not granted — ignore */ });
    }
    return () => {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active]);

  // Camera + ZXing reader
  useEffect(() => {
    if (!active || !videoRef.current) return;
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
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const controls = await reader.decodeFromStream(stream, videoRef.current!, (result, error) => {
          if (stopped) return;
          if (result) {
            const text = result.getText();
            const now = Date.now();
            const last = lastDecodeRef.current;
            // Debounce: same code within 3 seconds is ignored
            if (last && last.text === text && now - last.at < DEBOUNCE_MS) return;
            lastDecodeRef.current = { text, at: now };
            onDecode(text);
          }
          void error;
        });

        controlsRef.current = controls;
      } catch (err) {
        if (!stopped) {
          const msg = err instanceof Error ? err.message : "Camera unavailable";
          setCameraError(msg.includes("Permission") || msg.includes("NotAllowed")
            ? "Camera permission denied. Tap to retry."
            : "Camera unavailable. Use manual entry instead.");
        }
      }
    }

    startCamera();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Torch toggle
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch { /* torch not supported */ }
  }

  if (cameraError) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface-sunken text-center px-6"
        onClick={() => { setCameraError(null); }}
        role="button"
        aria-label="Retry camera"
      >
        <div className="text-5xl">📷</div>
        <p className="text-sm text-muted-foreground">{cameraError}</p>
        <p className="text-xs text-muted-foreground">Use manual entry as fallback</p>
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
          {/* Corner brackets */}
          <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white/80" />
          <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white/80" />
          <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white/80" />
          <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white/80" />
        </div>
      </div>

      {/* Torch button */}
      <button
        onClick={toggleTorch}
        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white"
        aria-label={torchOn ? "Turn off torch" : "Turn on torch"}
      >
        {torchOn ? <Flashlight className="h-6 w-6 text-warning" /> : <FlashlightOff className="h-6 w-6" />}
      </button>
    </div>
  );
}
