let mediaRecorder = null;
let mediaStream = null;
let isRecording = false;

const DEFAULT_TIMESLICE = 1000;

function getSupportedMimeType() {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus'
  ];

  return mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function releaseMediaStream() {
  if (!mediaStream) {
    return;
  }

  mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

function normalizeMicrophoneError(error) {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return new Error('麦克风权限被拒绝，请允许浏览器访问麦克风');
  }

  if (error.name === 'NotFoundError') {
    return new Error('未检测到可用麦克风设备');
  }

  if (error.name === 'NotReadableError') {
    return new Error('麦克风可能正被其他应用占用');
  }

  return error;
}

export async function startRecording(
  onAudioChunk,
  onError,
  onStart,
  onStop
) {
  if (isRecording) {
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onError?.(new Error('当前浏览器不支持 getUserMedia'));
    return;
  }

  if (typeof MediaRecorder === 'undefined') {
    onError?.(new Error('当前浏览器不支持 MediaRecorder'));
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const mimeType = getSupportedMimeType();

    mediaRecorder = new MediaRecorder(
      mediaStream,
      mimeType ? { mimeType } : undefined
    );

    mediaRecorder.addEventListener('start', () => {
      isRecording = true;

      if (typeof window.updateStatus === 'function') {
        window.updateStatus('录音中...');
      }

      if (typeof window.setRecordingUIState === 'function') {
        window.setRecordingUIState(true);
      }

      onStart?.();
    });

    mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (!event.data || event.data.size === 0) {
        return;
      }

      try {
        const arrayBuffer = await event.data.arrayBuffer();
        onAudioChunk?.(arrayBuffer);
      } catch (error) {
        onError?.(error);
      }
    });

    mediaRecorder.addEventListener('stop', () => {
      isRecording = false;
      releaseMediaStream();

      if (typeof window.updateStatus === 'function') {
        window.updateStatus('录音已停止');
      }

      if (typeof window.setRecordingUIState === 'function') {
        window.setRecordingUIState(false);
      }

      onStop?.();
    });

    mediaRecorder.addEventListener('error', (event) => {
      const error = event.error || new Error('录音发生未知错误');

      onError?.(error);
      stopRecording();
    });

    mediaRecorder.start(DEFAULT_TIMESLICE);
  } catch (error) {
    isRecording = false;
    releaseMediaStream();

    const normalizedError = normalizeMicrophoneError(error);

    if (typeof window.updateStatus === 'function') {
      window.updateStatus(normalizedError.message, true);
    }

    if (typeof window.setRecordingUIState === 'function') {
      window.setRecordingUIState(false);
    }

    onError?.(normalizedError);
  }
}

export function stopRecording() {
  if (!mediaRecorder) {
    isRecording = false;
    releaseMediaStream();

    if (typeof window.setRecordingUIState === 'function') {
      window.setRecordingUIState(false);
    }

    return;
  }

  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    isRecording = false;
    releaseMediaStream();

    if (typeof window.setRecordingUIState === 'function') {
      window.setRecordingUIState(false);
    }
  }
}

export function stopRecordingBecauseWebSocketClosed() {
  if (!isRecording) {
    return;
  }

  if (typeof window.updateStatus === 'function') {
    window.updateStatus('WebSocket 已断开，录音自动停止', true);
  }

  stopRecording();
}

export function getRecordingState() {
  return {
    isRecording,
    recorderState: mediaRecorder ? mediaRecorder.state : 'inactive'
  };
}
