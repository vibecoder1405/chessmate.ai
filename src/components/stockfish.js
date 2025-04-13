// stockfish.js
class Stockfish {
  constructor() {
    this.worker = new Worker('/stockfish.worker.js');
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, payload } = event.data;
    if (type === 'bestmove') {
      const move = payload.split(' ')[1];
      this.onBestMove?.(move);
    }
  }

  postMessage(message) {
    this.worker.postMessage(message);
  }

  terminate() {
    this.worker.terminate();
  }
}

export default Stockfish; 