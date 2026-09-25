import jsQR from 'jsqr';

// Audio feedback on successful scan using Web Audio API
export function playScanSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio might be blocked by browser autoplay policy if no interaction
  }
}

export interface ScannerControls {
  stop: () => void;
  toggleTorch: () => Promise<boolean>;
  switchCamera: () => Promise<void>;
  isTorchOn: () => boolean;
}

/**
 * Scan a single image file (from <input type="file"> or drag-drop)
 */
export async function scanImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (code && code.data) {
          playScanSuccessSound();
          resolve(code.data);
        } else {
          // Try with inversion attempt
          const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'onlyInvert'
          });
          if (codeInverted && codeInverted.data) {
            playScanSuccessSound();
            resolve(codeInverted.data);
          } else {
            resolve(null);
          }
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function formatCameraErrorMessage(err: unknown): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Trình duyệt yêu cầu kết nối bảo mật (HTTPS hoặc localhost) để mở Camera. Hãy dùng nút "Chụp/Tải ảnh" bên dưới.';
  }

  if (err instanceof Error) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Quyền truy cập Camera đã bị chặn. Vui lòng cho phép quyền Camera trên thanh địa chỉ trình duyệt hoặc cài đặt máy.';
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'Không tìm thấy thiết bị Camera trên máy này. Vui lòng chụp hoặc tải ảnh hóa đơn từ máy.';
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return 'Camera đang bị ứng dụng khác sử dụng (như Teams, Zalo, Zoom). Vui lòng tắt các ứng dụng đó và bấm Thử lại.';
    }
    if (err.name === 'OverconstrainedError') {
      return 'Không thể cấu hình độ phân giải camera này. Vui lòng thử lại với camera cơ bản.';
    }
    if (err.message) {
      return err.message;
    }
  }
  return 'Không thể mở camera. Vui lòng cấp quyền truy cập camera hoặc chụp/tải ảnh hóa đơn.';
}

/**
 * Start camera video stream and continuous scan loop onto a video element
 */
export async function startCameraScanner(
  videoElement: HTMLVideoElement,
  onDetected: (decodedText: string) => void,
  onError?: (errorMessage: string) => void
): Promise<ScannerControls> {
  let stream: MediaStream | null = null;
  let animationFrameId: number | null = null;
  let currentFacingMode: 'environment' | 'user' = 'environment';
  let torchOn = false;
  let isScanning = true;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  async function initStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = formatCameraErrorMessage(new Error('API MediaDevices không được hỗ trợ'));
      if (onError) onError(msg);
      throw new Error(msg);
    }

    try {
      // First attempt with preferred facing mode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: currentFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Specific camera constraints failed, attempting fallback { video: true }:', firstErr);
        // Fallback to basic video constraint (works with standard webcams/PC drivers)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (err) {
      const formatted = formatCameraErrorMessage(err);
      if (onError) {
        onError(formatted);
      }
      throw err;
    }
  }

  try {
    await initStream();
  } catch {
    // initStream error is handled via onError callback
  }

  // Scan frame loop
  function scanFrame() {
    if (!isScanning) return;

    if (stream && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && ctx) {
      const vWidth = videoElement.videoWidth;
      const vHeight = videoElement.videoHeight;

      if (vWidth > 0 && vHeight > 0) {
        canvas.width = vWidth;
        canvas.height = vHeight;
        ctx.drawImage(videoElement, 0, 0, vWidth, vHeight);

        // Crop the central square target area for faster processing & precision
        const cropSize = Math.min(vWidth, vHeight) * 0.75;
        const cropX = (vWidth - cropSize) / 2;
        const cropY = (vHeight - cropSize) / 2;

        const imageData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data && code.data.trim()) {
          isScanning = false;
          playScanSuccessSound();
          onDetected(code.data.trim());
          return;
        }
      }
    }

    animationFrameId = requestAnimationFrame(scanFrame);
  }

  if (stream) {
    animationFrameId = requestAnimationFrame(scanFrame);
  }

  const controls: ScannerControls = {
    stop: () => {
      isScanning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
    },
    toggleTorch: async () => {
      if (!stream) return false;
      const track = stream.getVideoTracks()[0];
      if (!track) return false;

      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
      if (!capabilities.torch) {
        return false;
      }

      try {
        torchOn = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: torchOn } as MediaTrackConstraintSet]
        });
        return torchOn;
      } catch {
        torchOn = false;
        return false;
      }
    },
    switchCamera: async () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      torchOn = false;
      try {
        await initStream();
        if (!animationFrameId && isScanning) {
          animationFrameId = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error('Failed to switch camera:', err);
      }
    },
    isTorchOn: () => torchOn
  };

  return controls;
}
