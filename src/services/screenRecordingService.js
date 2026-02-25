import RecordRTC from 'recordrtc';

export class ScreenRecordingService {
  constructor() {
    this.recorder = null;
    this.stream = null;
    this.isRecording = false;
  }

  async startRecording() {
    try {
      // Get display media (screen capture)
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Create RecordRTC instance
      this.recorder = new RecordRTC(this.stream, {
        type: 'video',
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2000000, // 2 Mbps
        audioBitsPerSecond: 128000, // 128 kbps
        canvas: {
          width: 1920,
          height: 1080,
        },
        frameInterval: 90, // Lower = higher quality
      });

      // Start recording
      this.recorder.startRecording();
      this.isRecording = true;

      // Handle stream ending (user stops sharing via browser UI)
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopRecording().then((blob) => {
          if (blob) {
            this.downloadRecording(blob);
          }
          // Dispatch event so React state can update
          window.dispatchEvent(new CustomEvent('screenRecordingStopped'));
        });
      });

      return true;
    } catch (error) {
      console.error('Error starting screen recording:', error);

      if (error.name === 'NotAllowedError') {
        alert(
          'Screen recording permission denied. Please allow screen recording to proceed.'
        );
      } else if (error.name === 'NotSupportedError') {
        alert('Screen recording is not supported in this browser.');
      } else {
        alert('Failed to start screen recording. Please try again.');
      }

      return false;
    }
  }

  async stopRecording() {
    if (!this.recorder || !this.isRecording) {
      return null;
    }

    return new Promise((resolve) => {
      this.recorder.stopRecording(() => {
        // Use getSeekableBlob to inject correct duration metadata into the WebM header.
        // Without this, the file has no duration info and platforms like LinkedIn
        // treat it as a 0-second video.
        this.recorder.getSeekableBlob(this.recorder.getBlob(), (seekableBlob) => {
          // Stop all tracks
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
          }

          // Reset state
          this.isRecording = false;
          this.recorder = null;
          this.stream = null;

          resolve(seekableBlob);
        });
      });
    });
  }

  downloadRecording(blob, filename) {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download =
      filename ||
      `recording-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-')}.webm`;

    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getRecordingStatus() {
    return this.isRecording;
  }
}

// Create singleton instance
export const screenRecorder = new ScreenRecordingService();
