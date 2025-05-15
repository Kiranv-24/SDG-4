export class NetworkQualityMonitor {
  constructor() {
    this.quality = 'high'; // high, medium, low
    this.lastCheck = Date.now();
    this.checkInterval = 5000; // Check every 5 seconds
    this.packetLossThreshold = 0.1; // 10% packet loss threshold
    this.latencyThreshold = 150; // 150ms latency threshold
    this.bandwidthThreshold = 500; // 500 kbps threshold
  }

  async checkNetworkQuality() {
    try {
      const [latency, packetLoss, bandwidth] = await Promise.all([
        this.measureLatency(),
        this.measurePacketLoss(),
        this.measureBandwidth()
      ]);

      // Determine quality based on measurements
      if (packetLoss > this.packetLossThreshold || 
          latency > this.latencyThreshold || 
          bandwidth < this.bandwidthThreshold) {
        this.quality = 'low';
      } else if (latency > this.latencyThreshold / 2 || 
                 bandwidth < this.bandwidthThreshold * 2) {
        this.quality = 'medium';
      } else {
        this.quality = 'high';
      }

      this.lastCheck = Date.now();
      return this.quality;
    } catch (error) {
      console.error('Network quality check failed:', error);
      return 'low'; // Fallback to low quality on error
    }
  }

  async measureLatency() {
    const start = Date.now();
    try {
      await fetch('/api/ping');
      return Date.now() - start;
    } catch (error) {
      return Infinity;
    }
  }

  async measurePacketLoss() {
    // Simplified packet loss measurement using WebRTC stats
    if (!window.RTCPeerConnection) return 0;
    
    try {
      const pc = new RTCPeerConnection();
      const stats = await pc.getStats();
      let packetLoss = 0;
      
      stats.forEach(stat => {
        if (stat.type === 'inbound-rtp' && stat.packetsLost > 0) {
          packetLoss = stat.packetsLost / stat.packetsReceived;
        }
      });
      
      pc.close();
      return packetLoss;
    } catch (error) {
      return 0;
    }
  }

  async measureBandwidth() {
    try {
      const start = Date.now();
      const response = await fetch('/api/bandwidth-test');
      const data = await response.blob();
      const duration = (Date.now() - start) / 1000; // seconds
      const bandwidth = (data.size * 8) / (1024 * duration); // kbps
      return bandwidth;
    } catch (error) {
      return 0;
    }
  }
}

export class AdaptiveStreamingManager {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.networkMonitor = new NetworkQualityMonitor();
    this.currentQuality = 'high';
    this.qualityLevels = {
      high: { width: 1280, height: 720, bitrate: 2500000 }, // 720p
      medium: { width: 854, height: 480, bitrate: 1000000 }, // 480p
      low: { width: 640, height: 360, bitrate: 500000 } // 360p
    };
  }

  async start() {
    this.intervalId = setInterval(async () => {
      const quality = await this.networkMonitor.checkNetworkQuality();
      if (quality !== this.currentQuality) {
        this.adjustQuality(quality);
      }
    }, 5000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  adjustQuality(quality) {
    const settings = this.qualityLevels[quality];
    if (this.videoElement && this.videoElement.srcObject) {
      const videoTrack = this.videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.applyConstraints({
          width: { ideal: settings.width },
          height: { ideal: settings.height }
        });
      }
    }
    this.currentQuality = quality;
  }
}

export class NetworkResilienceManager {
  constructor() {
    this.networkMonitor = new NetworkQualityMonitor();
    this.recordingEnabled = false;
    this.mediaRecorder = null;
    this.chunks = [];
    this.uploadQueue = [];
  }

  startRecording(stream) {
    if (!stream) return;
    
    this.recordingEnabled = true;
    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.processChunk(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Capture in 1-second chunks
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.recordingEnabled = false;
    }
  }

  async processChunk(chunk) {
    // Add to upload queue
    this.uploadQueue.push({
      chunk,
      timestamp: Date.now(),
      retries: 0
    });

    // Try to upload if network is good
    await this.processUploadQueue();
  }

  async processUploadQueue() {
    const quality = await this.networkMonitor.checkNetworkQuality();
    if (quality === 'low') return; // Wait for better network conditions

    while (this.uploadQueue.length > 0) {
      const item = this.uploadQueue[0];
      try {
        await this.uploadChunk(item.chunk);
        this.uploadQueue.shift(); // Remove successfully uploaded chunk
      } catch (error) {
        if (item.retries < 3) {
          item.retries++;
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
        } else {
          this.uploadQueue.shift(); // Remove failed chunk after 3 retries
        }
        break; // Stop processing on error
      }
    }
  }

  async uploadChunk(chunk) {
    const formData = new FormData();
    formData.append('video', chunk);
    
    const response = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }
  }
} 