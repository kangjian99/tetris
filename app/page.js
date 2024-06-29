"use client";

import React, { useState, useEffect, useCallback } from 'react';

const TETROMINOS = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0]
    ],
    color: '80, 227, 230',
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0]
    ],
    color: '36, 95, 223',
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L']
    ],
    color: '223, 173, 36',
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '223, 217, 36',
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0]
    ],
    color: '48, 211, 56',
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0]
    ],
    color: '132, 61, 198',
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0]
    ],
    color: '227, 78, 78',
  },
};

const STAGE_WIDTH = 12;
const STAGE_HEIGHT = 20;

// 创建游戏舞台
const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill([0, 'clear']));

// 随机生成方块
const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetromino =
    tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

// 检查碰撞
const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // 1. 检查我们是否在一个tetromino单元格内
      if (player.tetromino[y][x] !== 0) {
        if (
          // 2. 检查我们的移动是否在游戏区域高度内（y）
          // 我们不能穿过底部
          !stage[y + player.pos.y + moveY] ||
          // 3. 检查我们的移动是否在游戏区域宽度内（x）
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. 检查我们要移动到的单元格是否不为"clear"
          stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

// 旋转方块
const rotate = (matrix, dir) => {
  const rotatedTetro = matrix.map((_, index) =>
    matrix.map(col => col[index]),
  );
  if (dir > 0) return rotatedTetro.map(row => row.reverse());
  return rotatedTetro.reverse();
};

const Tetris = () => {
  const [stage, setStage] = useState(createStage());
  const [dropTime, setDropTime] = useState(null);
  const [gameOver, setGameOver] = useState(true);
  const [player, setPlayer] = useState(null);
  const [score, setScore] = useState(0);

  // 创建玩家
  const newPlayer = useCallback(() => {
    return {
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    };
  }, []);

  // 更新玩家位置
  const updatePlayerPos = ({ x, y, collided }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: (prev.pos.x + x), y: (prev.pos.y + y) },
      collided,
    }));
  };

  // 合并方块到舞台
  const mergePlayerToStage = useCallback((stageToMerge, playerToMerge) => {
    const newStage = stageToMerge.map(row =>
      row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
    );

    playerToMerge.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newStage[y + playerToMerge.pos.y][x + playerToMerge.pos.x] = [
            value,
            'merged',
          ];
        }
      });
    });

    return newStage;
  }, []);

  // 消除已填满的行并更新分数
  const sweepRows = (newStage) => {
    let rowsCleared = 0;
  
    newStage = newStage.reduce((acc, row) => {
      if (row.findIndex(cell => cell[0] === 0) === -1) {
        rowsCleared += 1;
        acc.unshift(new Array(newStage[0].length).fill([0, 'clear']));
        return acc;
      }
      acc.push(row);
      return acc;
    }, []);
  
    if (rowsCleared > 0) {
      const scoreIncrement = [0, 100, 300, 500, 800];
      setScore(prev => prev + (scoreIncrement[rowsCleared] || (rowsCleared * 100)));
    }
  
    return newStage;
  };

  // 开始游戏
  const startGame = () => {
    setStage(createStage());
    setDropTime(1000);
    setPlayer(newPlayer());
    setGameOver(false);
    setScore(0);
  };

  // 移动方块
  const movePlayer = (dir) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  // 旋转方块
  const playerRotate = (dir) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }

    setPlayer(clonedPlayer);
  };

  // 下落方块
  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // 检查游戏是否结束
      if (player.pos.y < 1) {
        console.log("GAME OVER!!!");
        setGameOver(true);
        setDropTime(null);
      } else {
        // 合并方块到舞台
        const mergedStage = mergePlayerToStage(stage, player);
        setStage(sweepRows(mergedStage));
        // 生成新的方块
        setPlayer(newPlayer());
      }
    }
  };

  // 快速下落到底部 (修复版本)
  const dropToBottom = () => {
    let newY = player.pos.y;
    while (!checkCollision(player, stage, { x: 0, y: newY - player.pos.y + 1 })) {
      newY++;
    }
    updatePlayerPos({ x: 0, y: newY - player.pos.y, collided: true });
    const mergedStage = mergePlayerToStage(stage, { ...player, pos: { ...player.pos, y: newY } });
    setStage(sweepRows(mergedStage));
    setPlayer(newPlayer());
  };

  // 处理按键事件
  const move = useCallback(({ keyCode }) => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1);
      } else if (keyCode === 39) {
        movePlayer(1);
      } else if (keyCode === 40) {
        dropToBottom();
      } else if (keyCode === 38) {
        playerRotate(1);  // 翻转方块
      }
    }
  }, [gameOver, movePlayer, dropToBottom, playerRotate]);

  useEffect(() => {
    document.addEventListener('keydown', move);
    return () => {
      document.removeEventListener('keydown', move);
    };
  }, [move]);

  useEffect(() => {
    let dropTimer;
    if (!gameOver && dropTime) {
      dropTimer = setInterval(() => {
        drop();
      }, dropTime);
    }
    return () => {
      clearInterval(dropTimer);
    };
  }, [drop, dropTime, gameOver]);

  // 更新游戏舞台
  useEffect(() => {
    if (!gameOver && player) {
      const newStage = stage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );

      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ];
          }
        });
      });

      setStage(newStage);
    }
  }, [player, gameOver]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            俄罗斯方块
          </h1>
          <div style={{
            width: `${STAGE_WIDTH * 25}px`,
            height: `${STAGE_HEIGHT * 25}px`,
            backgroundColor: '#000',
            position: 'relative',
            marginBottom: '16px'
          }}>
            {stage.map((row, y) => 
              row.map((cell, x) => (
                <div key={`${y}-${x}`} style={{
                  position: 'absolute',
                  top: `${y * 25}px`,
                  left: `${x * 25}px`,
                  width: '25px',
                  height: '25px',
                  backgroundColor: cell[0] === 0 ? '#000' : `rgba(${TETROMINOS[cell[0]].color}, 1)`,
                  border: '1px solid #333'
                }} />
              ))
            )}
          </div>
          <p style={{
            fontSize: '20px',
            marginBottom: '8px'
          }}>
            分数: {score}
          </p>
          <button
            style={{
              backgroundColor: '#3182ce',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            onClick={startGame}
          >
            {gameOver ? '开始游戏' : '重新开始'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tetris;