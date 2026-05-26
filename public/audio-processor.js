class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    if (!channelData) return true;

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      if (this.bufferIndex >= this.bufferSize) {
        this.flush();
        this.bufferIndex = 0;
      }
    }

    return true;
  }

  flush() {
    const pcmData = new Int16Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      let s = this.buffer[i];
      s = s < -1 ? -1 : (s > 1 ? 1 : s);
      pcmData[i] = s * 0x7fff;
    }

    // Transfer the buffer to the main thread to avoid copying
    this.port.postMessage({ pcmData: pcmData.buffer }, [pcmData.buffer]);
  }
}

registerProcessor('audio-processor', AudioProcessor);
