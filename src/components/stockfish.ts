/**
 * @fileOverview A class for interacting with the Stockfish chess engine running in a worker.
 *
 * - Stockfish - A class that handles communication with the Stockfish engine.
 */

class Stockfish {
  private worker: Worker;
  private isReady: boolean;

  constructor() {
    this.worker = new Worker(new URL('./stockfish-worker', import.meta.url));
    this.isReady = false;
    this.worker.onmessage = event => {
      if (event.data.type === 'readyOk') {
        this.isReady = true;
        console.log('Stockfish is ready!');
      }
    };
    this.worker.postMessage({type: 'isReady'});
  }

  async load(): Promise<void> {
    return new Promise(resolve => {
      this.worker.onmessage = event => {
        if (event.data.type === 'readyOk') {
          this.isReady = true;
          console.log('Stockfish is ready!');
          resolve();
        }
      };
      this.worker.postMessage({type: 'isReady'});
    });
  }

  setOptions(options: {[key: string]: string}): void {
    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        this.worker.postMessage({
          type: 'setoption',
          payload: {name: key, value: options[key]},
        });
      }
    }
  }

  getBestMove(fen: string): Promise<string> {
    return new Promise(resolve => {
      this.worker.postMessage({type: 'position', payload: {fen}});
      this.worker.postMessage({type: 'go'});
      this.worker.onmessage = event => {
        if (event.data.type === 'bestmove') {
          const message = event.data.payload;
          const move = message.split(' ')[1];
          resolve(move);
        }
      };
    });
  }

  terminate(): void {
    this.worker.postMessage({type: 'quit'});
  }
}

export default Stockfish;

    