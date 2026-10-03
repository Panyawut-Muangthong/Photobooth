import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  FlipHorizontal, 
  Clock, 
  RefreshCw, 
  Check, 
  Sparkles, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { playCountdownBeep, playCameraShutterSound } from '../utils/soundEffects';

interface CameraModalProps {
  slotIndex: number;
  totalSlots: number;
  targetSlotId: string;
  emptySlotsCount: number;
  onCaptureComplete: (slotId: string, imageDataUrl: string) => void;
  onBurstCaptureComplete?: (captures: { slotId: string; imageDataUrl: string }[]) => void;
  emptySlotIds?: string[];
  onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  slotIndex,
  totalSlots,
  targetSlotId,
  emptySlotsCount,
  onCaptureComplete,
  onBurstCaptureComplete,
  emptySlotIds = [],
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [useCountdown, setUseCountdown] = useState(true);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  
  // Burst mode state
  const [isBurstMode, setIsBurstMode] = useState(false);
  const [burstStep, setBurstStep] = useState<number>(0);
  const burstCapturesRef = useRef<{ slotId: string; imageDataUrl: string }[]>([]);

  // Start video stream
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevs);
      if (!selectedDeviceId && videoDevs.length > 0) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (err: unknown) {
      console.error('Camera access failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown camera error';
      setCameraError(
        errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')
          ? 'Camera access was denied. Please allow camera permissions in your browser.'
          : 'Could not connect to camera. Please make sure no other app is using your webcam.'
      );
    }
  }, [selectedDeviceId, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Snap photo from video feed
  const grabFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  // Trigger snapshot with sound and flash
  const executeSnap = (targetId: string, onFinish?: (dataUrl: string) => void) => {
    setIsFlashing(true);
    playCameraShutterSound();
    setTimeout(() => setIsFlashing(false), 350);

    const dataUrl = grabFrame();
    if (dataUrl) {
      if (onFinish) {
        onFinish(dataUrl);
      } else {
        setCapturedPreview(dataUrl);
      }
    }
  };

  // Start single photo capture
  const handleSnapClick = () => {
    if (countdownValue !== null) return;

    if (!useCountdown) {
      executeSnap(targetSlotId);
      return;
    }

    let count = 3;
    setCountdownValue(count);
    playCountdownBeep(false);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        playCountdownBeep(false);
      } else {
        clearInterval(interval);
        setCountdownValue(null);
        playCountdownBeep(true);
        executeSnap(targetSlotId);
      }
    }, 1000);
  };

  // Burst capture mode (takes photos sequentially for empty slots)
  const handleStartBurstMode = () => {
    if (emptySlotIds.length === 0) return;
    setIsBurstMode(true);
    setBurstStep(0);
    burstCapturesRef.current = [];

    const targetList = emptySlotIds;
    let currentIndex = 0;

    const runStep = () => {
      if (currentIndex >= targetList.length) {
        // Finished burst
        setIsBurstMode(false);
        if (onBurstCaptureComplete) {
          onBurstCaptureComplete(burstCapturesRef.current);
          onClose();
        }
        return;
      }

      setBurstStep(currentIndex + 1);
      let count = 3;
      setCountdownValue(count);
      playCountdownBeep(false);

      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdownValue(count);
          playCountdownBeep(false);
        } else {
          clearInterval(interval);
          setCountdownValue(null);
          playCountdownBeep(true);

          const slotId = targetList[currentIndex];
          executeSnap(slotId, (dataUrl) => {
            burstCapturesRef.current.push({ slotId, imageDataUrl: dataUrl });
            currentIndex += 1;
            // Delay before starting next shot
            setTimeout(runStep, 1200);
          });
        }
      }, 1000);
    };

    runStep();
  };

  const handleAcceptSingle = () => {
    if (capturedPreview) {
      onCaptureComplete(targetSlotId, capturedPreview);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col text-white">
        
        {/* Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-camera-flash" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm md:text-base">
                {isBurstMode ? `Photobooth Run (${burstStep}/${emptySlotIds.length})` : `Webcam Capture (Slot ${slotIndex + 1} of ${totalSlots})`}
              </h3>
              <p className="text-xs text-zinc-400">
                {isBurstMode ? 'Auto-snapping each frame in sequence' : 'Strike a pose and smile!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex items-center justify-center aspect-[4/3] max-h-[500px] overflow-hidden">
          {cameraError ? (
            <div className="p-8 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-white text-base">Camera Unavailable</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : capturedPreview ? (
            /* Snapshot Preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPreview}
                alt="Captured Snapshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-emerald-500/90 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Captured!</span>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />

              {/* Countdown Display Overlay */}
              {countdownValue !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <div className="relative flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-rose-500 animate-ping absolute opacity-60" />
                    <div className="w-28 h-28 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center shadow-2xl border-2 border-white/40">
                      <span className="text-6xl font-bold font-mono text-white animate-pulse">
                        {countdownValue}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Burst Mode Banner */}
              {isBurstMode && (
                <div className="absolute top-4 inset-x-4 flex justify-center pointer-events-none">
                  <div className="bg-rose-500/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center space-x-2 animate-bounce">
                    <Sparkles className="w-4 h-4" />
                    <span>Pose #{burstStep} of {emptySlotIds.length}</span>
                  </div>
                </div>
              )}

              {/* Viewport Guidelines */}
              <div className="absolute inset-0 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>
            </>
          )}
        </div>

        {/* Toolbar & Controls */}
        <div className="p-5 bg-zinc-900 border-t border-zinc-800 space-y-4">
          {capturedPreview ? (
            /* Action Buttons for Preview Mode */
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                onClick={handleAcceptSingle}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 transition active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            /* Live Camera Controls */
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                {/* Secondary Toggles */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                      isMirrored 
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                        : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                    title="Mirror feed"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Mirror</span>
                  </button>

                  <button
                    onClick={() => setUseCountdown(!useCountdown)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                      useCountdown 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                    title="3s Countdown timer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>3s Timer</span>
                  </button>
                </div>

                {/* Camera device selection */}
                {availableDevices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1 max-w-[150px] truncate"
                  >
                    {availableDevices.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Camera ${dev.deviceId.slice(0, 4)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Shutter Button Row */}
              <div className="flex items-center justify-center space-x-4 pt-1">
                {/* Photobooth Burst Option (snap all empty slots in sequence) */}
                {emptySlotsCount > 1 && !isBurstMode && (
                  <button
                    onClick={handleStartBurstMode}
                    disabled={countdownValue !== null}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition"
                    title="Take continuous photos for all empty slots"
                  >
                    <Layers className="w-4 h-4 text-rose-400" />
                    <span>Burst All ({emptySlotsCount})</span>
                  </button>
                )}

                {/* Big Shutter Button */}
                <button
                  onClick={handleSnapClick}
                  disabled={countdownValue !== null || isBurstMode}
                  className="relative group p-1.5 rounded-full bg-zinc-800 border-2 border-zinc-700 hover:border-rose-400 transition transform active:scale-95 disabled:opacity-50"
                  title="Take photo"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-500 group-hover:bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 transition">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
