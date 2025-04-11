// stockfish-worker.ts
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileOverview A worker script to handle Stockfish chess engine.
 *
 *  This worker receives messages from the main thread, interacts with the Stockfish engine, and sends back the results.
 */

// Changed the import path to be relative to the public directory if needed, otherwise keep it as is
import stockfish from 'public/stockfish.wasm.js?url';

let sf: any;

async function loadStockfish() {
  if (!sf) {
    sf = new Worker(stockfish);
    console.log('Stockfish engine loaded.');
  }
}

loadStockfish();

onmessage = async (event: MessageEvent) => {
  const {type, payload} = event.data;

  if (type === 'uci') {
    // Initialize Stockfish and set UCI options if needed
    await loadStockfish();
    sf.postMessage('uci');
    sf.onmessage = (event: MessageEvent) => {
      postMessage({type: 'uci_response', payload: event.data});
    };
  } else if (type === 'setoption') {
    const {name, value} = payload;
    sf.postMessage(`setoption name ${name} value ${value}`);
  } else if (type === 'position') {
    sf.postMessage(`position fen ${payload.fen}`);
  } else if (type === 'go') {
    sf.postMessage('go movetime 1000'); // Request a move
    sf.onmessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.startsWith('bestmove')) {
        postMessage({type: 'bestmove', payload: message});
      }
    };
  } else if (type === 'quit') {
    sf.terminate();
    sf = null;
    console.log('Stockfish engine terminated.');
  } else if (type === 'isReady') {
    sf.postMessage('isready');
    sf.onmessage = (event: MessageEvent) => {
      if (event.data === 'readyok') {
        postMessage({type: 'readyOk'});
      }
    };
  }
};

