// Playback worklet stub for TalkingHead
// This is a minimal implementation to prevent errors

class PlaybackWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      // Handle messages from main thread
      if (event.data.type === 'configure') {
        // Configuration received
      }
    };
  }

  process(inputs, outputs, parameters) {
    // Simple pass-through for now
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      if (inputChannel && outputChannel) {
        outputChannel.set(inputChannel);
      }
    }

    return true;
  }
}

registerProcessor('playback-worklet', PlaybackWorkletProcessor);