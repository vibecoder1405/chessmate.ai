"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import {
  Chess
} from 'chess.js';
import './chessboard.css';
import Stockfish from './stockfish';
import {
  Button
} from "@/components/ui/button";
import {
  cn
} from "@/lib/utils";
import {
  ModeToggle
} from "@/components/mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ScrollArea
} from "@/components/ui/scroll-area";
import {
  Slider
} from "@/components/ui/slider";

const squareSize = 70; // Size of each square
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

interface SquareProps {
  file: string;
  rank: number;
  piece: string | null;
  isDragging: boolean;
  isLegalMove: boolean;
  game: Chess; // Pass the game instance as a prop
  handleDragStart: (event: React.DragEvent < HTMLDivElement > , sourceSquare: string) => void;
  handleDragOver: (event: React.DragEvent < HTMLDivElement > ) => void;
  handleDrop: (event: React.DragEvent < HTMLDivElement > , targetSquare: string) => void;
  handleDragEnd: (event: React.DragEvent < HTMLDivElement > ) => void;
}

const Square: React.FC < SquareProps > = ({
    file,
    rank,
    piece,
    isDragging,
    isLegalMove,
    game,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  }) => {
    const squareId = `${file}${rank}`;
    const isLight = (files.indexOf(file) + rank) % 2 === 0;
    const backgroundColor = isLegalMove ? 'rgba(128, 255, 128, 0.7)' : isLight ? '#eeeed2' : '#769656';

    return ( <
      div id = {
        squareId
      }
      className = {
        `square ${isLight ? 'light' : 'dark'}`
      }
      style = {
        {
          width: squareSize,
          height: squareSize,
          backgroundColor: backgroundColor,
          fontSize: squareSize * 0.6,
          cursor: piece && !game.isGameOver() && game.turn() === 'w' ? 'grab' : 'default',
        }
      }
      draggable = {
        !!piece && !game.isGameOver() && game.turn() === 'w'
      }
      onDragStart = {
        e => piece && !game.isGameOver() && game.turn() === 'w' ? handleDragStart(e, squareId) : null
      }
      onDragOver = {
        handleDragOver
      }
      onDrop = {
        e => handleDrop(e, squareId)
      }
      onDragEnd = {
        handleDragEnd
      } > {
        piece && < span className = "piece"
        data-piece = {
          piece
        }
        style = {
          {
            opacity: isDragging ? 0.5 : 1,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
          }
        } > {
          piece
        } < /span>} <
        /div>
    );
  };

  const Chessboard: React.FC = () => {
    const [game, setGame] = useState(new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
    const [fen, setFen] = useState(game.fen());
    const [draggingPiece, setDraggingPiece] = useState < string | null > (null);
    const [sourceSquare, setSourceSquare] = useState < string | null > (null);
    const [legalMoves, setLegalMoves] = useState < string[] > ([]);
    const [stockfish, setStockfish] = useState < Stockfish | null > (null);
    const [difficulty, setDifficulty] = useState < 'Easy' | 'Medium' | 'Hard' | 'Master' > ('Medium');
    const [gameStatus, setGameStatus] = useState < string > ('');
    const [moveHistory, setMoveHistory] = useState < string[] > ([]);
    const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
    const [blackTime, setBlackTime] = useState(600);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [isClockRunning, setIsClockRunning] = useState(false);
    const [skillLevel, setSkillLevel] = useState(10);
    const [isStockfishThinking, setIsStockfishThinking] = useState(false);

    const moveHistoryRef = useRef < HTMLDivElement > (null);
    const whiteTimerRef = useRef < NodeJS.Timeout | null > (null);
    const blackTimerRef = useRef < NodeJS.Timeout | null > (null);

    useEffect(() => {
      setFen(game.fen());
    }, [game]);

    useEffect(() => {
      const sf = new Stockfish();

      sf.load().then(() => {
        setStockfishDifficulty(sf, difficulty);
        sf.setOptions({
          SkillLevel: skillLevel.toString()
        });
        setStockfish(sf);
      });

      return () => {
        sf.terminate();
      };
    }, [difficulty, skillLevel]);

    useEffect(() => {
      if (gameStatus === 'Checkmate!' || gameStatus === 'Stalemate!') {
        setIsClockRunning(false);
        if (whiteTimerRef.current) clearTimeout(whiteTimerRef.current);
        if (blackTimerRef.current) clearTimeout(blackTimerRef.current);
      }
    }, [gameStatus]);

    useEffect(() => {
      if (isClockRunning) {
        if (isWhiteTurn) {
          whiteTimerRef.current = setTimeout(() => {
            setWhiteTime(prevTime => Math.max(0, prevTime - 1));
          }, 1000);
        } else {
          blackTimerRef.current = setTimeout(() => {
            setBlackTime(prevTime => Math.max(0, prevTime - 1));
          }, 1000);
        }
      }
      return () => {
        if (whiteTimerRef.current) clearTimeout(whiteTimerRef.current);
        if (blackTimerRef.current) clearTimeout(blackTimerRef.current);
      };
    }, [isClockRunning, isWhiteTurn]);

    useEffect(() => {
      if (whiteTime === 0 || blackTime === 0) {
        setGameStatus('Time\'s up!');
        setIsClockRunning(false);
      }
    }, [whiteTime, blackTime]);

    useEffect(() => {
      if (moveHistoryRef.current) {
        moveHistoryRef.current.scrollTop = moveHistoryRef.current.scrollHeight;
      }
    }, [moveHistory]);

    const setStockfishDifficulty = (sf: Stockfish, difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master') => {
      switch (difficulty) {
        case 'Easy':
          sf.setOptions({
            SkillLevel: '5',
            Depth: '2'
          });
          setSkillLevel(5);
          break;
        case 'Medium':
          sf.setOptions({
            SkillLevel: '10',
            Depth: '5'
          });
          setSkillLevel(10);
          break;
        case 'Hard':
          sf.setOptions({
            SkillLevel: '15',
            Depth: '10'
          });
          setSkillLevel(15);
          break;
        case 'Master':
          sf.setOptions({
            SkillLevel: '20',
            Depth: '15'
          });
          setSkillLevel(20);
          break;
      }
    };

    const handlePieceUnicode = (piece: string) => {
      switch (piece) {
        case 'wK':
          return '♔';
        case 'wQ':
          return '♕';
        case 'wR':
          return '♖';
        case 'wB':
          return '♗';
        case 'wN':
          return '♘';
        case 'wP':
          return '♙';
        case 'bK':
          return '♚';
        case 'bQ':
          return '♛';
        case 'bR':
          return '♜';
        case 'bB':
          return '♝';
        case 'bN':
          return '♞';
        case 'bP':
          return '♟';
        default:
          return '';
      }
    };

    const handleDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, sourceSquare: string) => {
      if (isStockfishThinking) return;
      setSourceSquare(sourceSquare);
      setDraggingPiece(sourceSquare);
      const moves = game.moves({ square: sourceSquare });
      setLegalMoves(moves.map(move => move.to));
    }, [game, isStockfishThinking]);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    }, []);

    const makeAIMove = useCallback(async () => {
      if (!stockfish || game.turn() !== 'b' || game.isGameOver()) return;

      setIsStockfishThinking(true);
      try {
        const bestMove = await stockfish.getBestMove(game.fen());
        if (bestMove) {
          const move = game.move(bestMove);
          if (move) {
            setGame(new Chess(game.fen()));
            setMoveHistory(prev => [...prev, move.san]);
            updateGameStatus();
          }
        }
      } catch (error) {
        console.error('Error making AI move:', error);
      } finally {
        setIsStockfishThinking(false);
      }
    }, [game, stockfish]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, targetSquare: string) => {
      event.preventDefault();
      if (!sourceSquare || isStockfishThinking) return;

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, move.san]);
        updateGameStatus();
        setSourceSquare(null);
        setLegalMoves([]);

        if (!game.isGameOver()) {
          makeAIMove();
        }
      }
    }, [game, sourceSquare, makeAIMove, isStockfishThinking]);

    const handleDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      setDraggingPiece(null);
      setSourceSquare(null);
      setLegalMoves([]);
    }, []);

    const getPiece = useCallback((file: string, rank: number): string | null => {
      const square = `${file}${rank}`;
      const piece = game.get(square);
      if (!piece) return null;
      return `${piece.color}${piece.type.toUpperCase()}`;
    }, [game]);

    const updateGameStatus = useCallback(() => {
      if (game.isCheckmate()) {
        setGameStatus('Checkmate!');
      } else if (game.isDraw()) {
        setGameStatus('Stalemate!');
      } else if (game.isCheck()) {
        setGameStatus('Check!');
      } else {
        setGameStatus('');
      }
    }, [game]);

    const handleRestartGame = useCallback(() => {
      setGame(new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
      setFen(game.fen());
      setMoveHistory([]);
      setGameStatus('');
      setWhiteTime(600);
      setBlackTime(600);
      setIsWhiteTurn(true);
      setIsClockRunning(false);
      if (whiteTimerRef.current) clearTimeout(whiteTimerRef.current);
      if (blackTimerRef.current) clearTimeout(blackTimerRef.current);
    }, []);

    const handleUndoMove = useCallback(() => {
      if (moveHistory.length === 0) return;
      game.undo();
      setGame(new Chess(game.fen()));
      setMoveHistory(prev => prev.slice(0, -1));
      updateGameStatus();
    }, [game, moveHistory, updateGameStatus]);

    const formatTime = useCallback((timeInSeconds: number): string => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, []);

    return ( <
      div className = "flex flex-col items-center justify-center p-4 w-full" >

      <
      div className = "flex flex-col md:flex-row w-full max-w-4xl p-4 rounded-lg shadow-md bg-card text-card-foreground" >

      <
      div className = "flex flex-col items-center md:items-start w-full md:w-2/3" >
      <
      div className = "flex justify-between w-full mb-4" >
      <
      ModeToggle / >
      <
      /div> <
      div className = "text-xl font-semibold mb-2" > Chessboard < /div> <
      div className = "chessboard" > {
        Array(8).fill(null).map((_, rankIndex) => ( <
          div key = {
            rankIndex
          }
          className = "board-row" > {
            files.map((file, fileIndex) => {
              const rank = 8 - rankIndex;
              const piece = getPiece(file, rank);
              const isLegalMove = legalMoves.includes(`${file}${rank}`);

              return ( <
                Square key = {
                  `${file}${rank}`
                }
                file = {
                  file
                }
                rank = {
                  rank
                }
                piece = {
                  piece ? handlePieceUnicode(piece) : null
                }
                isDragging = {
                  draggingPiece !== null
                }
                isLegalMove = {
                  isLegalMove
                }
                game = {
                  game
                } // Pass the game instance here
                handleDragStart = {
                  handleDragStart
                }
                handleDragOver = {
                  handleDragOver
                }
                handleDrop = {
                  handleDrop
                }
                handleDragEnd = {
                  handleDragEnd
                }
                />
              );
            })
          } <
          /div>
        ))
      } <
      /div> {
        game.isGameOver() && ( <
          div className = "text-lg font-semibold mt-2" >
          Game Over! {
            gameStatus
          } <
          /div>
        )
      } {
        !game.isGameOver() && ( <
          div className = "text-md mt-2" > {
            gameStatus
          } <
          /div>
        )
      } <
      Card className = "w-full mt-4" >
      <
      CardHeader >
      <
      CardTitle > Game Controls < /CardTitle> <
      CardDescription > Adjust settings and manage the game. < /CardDescription> <
      /CardHeader> <
      CardContent className = "grid gap-4" >
      <
      div className = "flex flex-col sm:flex-row items-center justify-between" >
      <
      label htmlFor = "difficulty"
      className = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" >
      Difficulty:
      <
      /label> <
      select id = "difficulty"
      value = {
        difficulty
      }
      onChange = {
        (e) => setDifficulty(e.target.value as any)
      }
      className = "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" >
      <
      option value = "Easy" > Easy < /option> <
      option value = "Medium" > Medium < /option> <
      option value = "Hard" > Hard < /option> <
      option value = "Master" > Master < /option> <
      /select> <
      /div> <
      div className = "flex flex-col sm:flex-row items-center justify-between" >
      <
      label htmlFor = "skillLevel"
      className = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" >
      Skill Level:
      <
      /label> <
      div className = "flex items-center space-x-2" >
      <
      Slider id = "skillLevel"
      defaultValue = {
        [skillLevel]
      }
      max = {
        20
      }
      min = {
        1
      }
      step = {
        1
      }
      onValueChange = {
        (value) => setSkillLevel(value[0])
      }
      /> <
      span className = "text-sm" > {
        skillLevel
      } < /span> <
      /div> <
      /div> <
      div className = "flex flex-wrap justify-center mt-2" >
      <
      Button onClick = {
        handleUndoMove
      }
      disabled = {
        difficulty !== 'Easy' && difficulty !== 'Medium'
      }
      className = "m-1" >
      Undo
      <
      /Button> <
      Button onClick = {
        handleRestartGame
      }
      className = "m-1" >
      Restart
      <
      /Button> <
      /div> <
      /CardContent> <
      /Card> <
      /div> <
      div className = "w-full md:w-1/3 flex flex-col items-center md:items-start mt-4 md:mt-0" >
      <
      Card className = "w-full" >
      <
      CardHeader >
      <
      CardTitle > Game Status < /CardTitle> <
      CardDescription > Current game state and timers. < /CardDescription> <
      /CardHeader> <
      CardContent className = "grid gap-4" >
      <
      div className = "flex justify-between" >
      <
      div > White Time: < /div> <
      div > {
        formatTime(whiteTime)
      } < /div> <
      /div> <
      div className = "flex justify-between" >
      <
      div > Black Time: < /div> <
      div > {
        formatTime(blackTime)
      } < /div> <
      /div> <
      div className = "flex flex-col" >
      <
      div className = "text-sm font-medium" > Move History: < /div> <
      ScrollArea className = "h-[200px] w-full rounded-md border p-4 mt-2"
      ref = {
        moveHistoryRef
      } >
      <
      div className = "text-sm" > {
        moveHistory.map((move, index) => ( <
          div key = {
            index
          } > {
            index + 1
          }. {
            move
          } < /div>
        ))
      } <
      /div> <
      /ScrollArea> <
      /div> <
      /CardContent> <
      /Card> <
      /div> <
      /div> <
      /div>
    );
  };

  export default Chessboard;
