import fixWebmDuration from 'fix-webm-duration';

export class ScreenRecordingService {
  constructor() {
    this.recorder = null;
    this.stream = null;
    this.chunks = [];
    this.isRecording = false;
    this.startTime = null;
    this.recordingFormat = null;
  }

  async startRecording(format = 'webm') {
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

      this.recordingFormat = format;

      // Pick the best supported mime type for the chosen format
      const mimeTypeCandidates =
        format === 'mp4'
          ? [
              'video/mp4;codecs=mp4a.40.2',
              'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
              'video/mp4',
            ]
          : [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
            ];

      const mimeType =
        mimeTypeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ||
        mimeTypeCandidates[mimeTypeCandidates.length - 1];

      this.chunks = [];

      // Use native MediaRecorder directly for reliable chunk collection
      this.recorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000, // 128 kbps
      });

      // Collect data chunks as they arrive
      this.recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Start recording (no timeslice — ondataavailable fires once on stop
      // with a single properly-formed WebM blob)
      this.recorder.start();
      this.isRecording = true;
      this.startTime = Date.now();

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

    const duration = Date.now() - this.startTime;
    const mimeType = this.recorder.mimeType || 'video/webm';

    return new Promise((resolve) => {
      this.recorder.onstop = async () => {
        // Combine all collected chunks into a single blob
        const rawBlob = new Blob(this.chunks, { type: mimeType });
        console.log(`Recording complete: ${this.chunks.length} chunks, ${(rawBlob.size / 1024 / 1024).toFixed(1)} MB, ${(duration / 1000).toFixed(1)}s`);

        // Fix duration metadata (WebM only — fix-webm-duration doesn't
        // apply to MP4, and browsers usually handle MP4 duration correctly)
        const fixedBlob =
          this.recordingFormat === 'webm'
            ? await fixWebmDuration(rawBlob, duration, { logger: false })
            : rawBlob;

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }

        // Reset state (keep recordingFormat so downloadRecording can
        // pick the right file extension)
        this.isRecording = false;
        this.recorder = null;
        this.stream = null;
        this.chunks = [];
        this.startTime = null;

        resolve(fixedBlob);
      };

      this.recorder.stop();
    });
  }

  downloadRecording(blob, filename) {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;

    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-');

    a.download =
      filename ||
      `recording-${timestamp}.${this.recordingFormat === 'mp4' ? 'mp4' : 'webm'}`;

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
