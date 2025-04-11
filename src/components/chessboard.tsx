'use client';
import React, {useState, useEffect, useCallback} from 'react';
import {Chess} from 'chess.js';
import './chessboard.css';
import Stockfish from './stockfish';

const squareSize = 70; // Size of each square
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
interface SquareProps {
  file: string;
  rank: number;
  piece: string | null;
  isDragging: boolean;
  isLegalMove: boolean;
  game: Chess; // Pass the game instance as a prop
  handleDragStart: (event: React.DragEvent<HTMLDivElement>, sourceSquare: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>, targetSquare: string) => void;
  handleDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
}
const Square: React.FC<SquareProps> = ({file, rank, piece, isDragging, isLegalMove, game, handleDragStart, handleDragOver, handleDrop, handleDragEnd}) => {
  const squareId = `${file}${rank}`;
  const isLight = (files.indexOf(file) + rank) % 2 === 0;
  const backgroundColor = isLegalMove ? 'rgba(128, 255, 128, 0.7)' : isLight ? '#eeeed2' : '#769656';

  return (
    <div
      id={squareId}
      className={`square ${isLight ? 'light' : 'dark'}`}
      style={{
        width: squareSize,
        height: squareSize,
        backgroundColor: backgroundColor,
        fontSize: squareSize * 0.6,
        cursor: piece ? 'grab' : 'default',
      }}
      draggable={!!piece && !game.isGameOver()}
      onDragStart={e => piece && !game.isGameOver() ? handleDragStart(e, squareId) : null}
      onDragOver={handleDragOver}
      onDrop={e => handleDrop(e, squareId)}
      onDragEnd={handleDragEnd}
    >
      {piece && <span
        className="piece"
        style={{
          opacity: isDragging ? 0.5 : 1,
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >{piece}</span>}
    </div>
  );
};

const Chessboard: React.FC = () => {
  const [game, setGame] = useState(new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  const [fen, setFen] = useState(game.fen());
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null);
  const [sourceSquare, setSourceSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [stockfish, setStockfish] = useState<Stockfish | null>(null);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>('Medium');
  const [gameStatus, setGameStatus] = useState<string>('');

  useEffect(() => {
    setFen(game.fen());
  }, [game]);

  useEffect(() => {
    const sf = new Stockfish();

    sf.load().then(() => {
      setStockfishDifficulty(sf, difficulty);
      setStockfish(sf);
    });

    return () => {
      sf.terminate();
    };
  }, [difficulty]);

  const setStockfishDifficulty = (sf: Stockfish, difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master') => {
    switch (difficulty) {
      case 'Easy':
        sf.setOptions({SkillLevel: '5', Depth: '2'});
        break;
      case 'Medium':
        sf.setOptions({SkillLevel: '10', Depth: '5'});
        break;
      case 'Hard':
        sf.setOptions({SkillLevel: '15', Depth: '10'});
        break;
      case 'Master':
        sf.setOptions({SkillLevel: '20', Depth: '15'});
        break;
    }
  };

  const handlePieceUnicode = (piece: string) => {
    switch (piece) {
      case 'wK': return '♔';
      case 'wQ': return '♕';
      case 'wR': return '♖';
      case 'wB': return '♗';
      case 'wN': return '♘';
      case 'wP': return '♙';
      case 'bK': return '♚';
      case 'bQ': return '♛';
      case 'bR': return '♜';
      case 'bB': return '♝';
      case 'bN': return '♞';
      case 'bP': return '♟︎';
      default: return '';
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, sourceSquare: string) => {
    const piece = game.get(sourceSquare)?.type;
    if (piece) {
      setDraggingPiece(piece);
      setSourceSquare(sourceSquare);
      const moves = game.moves({square: sourceSquare, verbose: true});
      const targetSquares = moves.map(move => move.to);
      setLegalMoves(targetSquares);
    } else {
      event.preventDefault();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetSquare: string) => {
    event.preventDefault();

    if (!sourceSquare) {
      console.error('No source square specified.');
      return;
    }

    try {
      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity
      };

      // Check if the move is valid before applying it
      const result = game.move(move);

      if (result === null) {
        console.error('Invalid move:', move);
        return;
      }
      setGame(new Chess(game.fen())); // Create a new Chess instance
      setFen(game.fen());
      updateGameStatus();

    } catch (e) {
      console.error('Error making move:', e);
    } finally {
      setDraggingPiece(null);
      setSourceSquare(null);
      setLegalMoves([]);
    }
  };

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingPiece(null);
    setSourceSquare(null);
    setLegalMoves([]);
  };

  const getPiece = (file: string, rank: number) => {
    return game.get(`${file}${rank}`)?.color === 'w' ? 'w' + game.get(`${file}${rank}`)?.type.toUpperCase() : game.get(`${file}${rank}`)?.color === 'b' ? 'b' + game.get(`${file}${rank}`)?.type.toUpperCase() : null;
  };

  const handleStockfishMove = useCallback(async () => {
    if (stockfish && !game.isGameOver()) {
      const bestMove = await stockfish.getBestMove(game.fen());
      if (bestMove) {
        try {
          game.move({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: 'q',
          });
          setGame(new Chess(game.fen()));
          setFen(game.fen());
          updateGameStatus();
        } catch (e) {
          console.error('Error making Stockfish move:', e);
        }
      }
    }
  }, [game, stockfish]);

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus('Checkmate!');
    } else if (game.isDraw()) {
      setGameStatus('Stalemate!');
    } else if (game.isCheck()) {
      setGameStatus('Check!');
    } else {
      setGameStatus('');
    }
  };

  return (
    <div>
      <div className="chessboard">
        {Array(8).fill(null).map((_, rankIndex) => (
          <div key={rankIndex} className="board-row">
            {files.map((file, fileIndex) => {
              const rank = 8 - rankIndex;
              const piece = getPiece(file, rank);
              const isLegalMove = legalMoves.includes(`${file}${rank}`);

              return (
                <Square
                  key={`${file}${rank}`}
                  file={file}
                  rank={rank}
                  piece={piece ? handlePieceUnicode(piece) : null}
                  isDragging={draggingPiece !== null}
                  isLegalMove={isLegalMove}
                  game={game} // Pass the game instance here
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
        ))}
      </div>
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
        <option value="Master">Master</option>
      </select>
      <button onClick={handleStockfishMove} disabled={!stockfish || game.isGameOver()}>
        Make Stockfish Move
      </button>
      {game.isGameOver() && (
        <div>
          Game Over! {gameStatus}
        </div>
      )}
       {!game.isGameOver() && (
        <div>
           {gameStatus}
        </div>
      )}
    </div>
  );
};

export default Chessboard;
