/**
 * 五子棋AI - 使用Minimax算法和Alpha-Beta剪枝
 */
class GomokuAI {
    constructor(depth = 3, breadth = 15) {
        this.depth = depth;
        this.breadth = breadth; // 每层搜索的最大节点数

        // 棋型分数
        this.patterns = {
            five: 100000000,      // 五连
            liveFour: 10000000,   // 活四
            deadFour: 1000000,    // 冲四
            liveThree: 100000,    // 活三
            deadThree: 10000,     // 眠三
            liveTwo: 1000,        // 活二
            deadTwo: 100,         // 眠二
            one: 10               // 单子
        };
    }

    /**
     * 设置搜索深度
     */
    setDepth(depth) {
        this.depth = depth;
        // 根据深度调整广度
        this.breadth = Math.max(8, 20 - depth * 3);
    }

    /**
     * 获取AI的最佳落子位置
     */
    getBestMove(game) {
        if (game.history.length === 0) {
            // 如果是第一手，下在中心
            const center = Math.floor(game.size / 2);
            return { row: center, col: center };
        }

        // AI的第一步（回应玩家的第一步）时，随机选择玩家棋子周围的位置
        if (game.history.length === 1) {
            const playerMove = game.history[0];
            const offsets = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            // 过滤出有效位置
            const validMoves = offsets
                .map(([dr, dc]) => ({ row: playerMove.row + dr, col: playerMove.col + dc }))
                .filter(pos => game.isValidMove(pos.row, pos.col));

            if (validMoves.length > 0) {
                // 随机选择一个位置
                return validMoves[Math.floor(Math.random() * validMoves.length)];
            }
        }

        const candidates = this.getCandidateMoves(game);

        if (candidates.length === 0) {
            return null;
        }

        if (candidates.length === 1) {
            return candidates[0];
        }

        let bestMove = null;
        let bestScore = -Infinity;
        const aiPlayer = game.currentPlayer;

        for (const move of candidates) {
            const clonedGame = game.clone();
            clonedGame.makeMove(move.row, move.col);

            const score = this.minimax(
                clonedGame,
                this.depth - 1,
                -Infinity,
                Infinity,
                false,
                aiPlayer
            );

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    /**
     * Minimax算法配合Alpha-Beta剪枝
     */
    minimax(game, depth, alpha, beta, isMaximizing, aiPlayer) {
        // 检查终止条件
        if (game.gameOver) {
            if (game.winner === aiPlayer) {
                return this.patterns.five + depth; // 加上深度奖励，优先选择更快的获胜
            } else if (game.winner === 'draw') {
                return 0;
            } else {
                return -this.patterns.five - depth;
            }
        }

        if (depth === 0) {
            return this.evaluateBoard(game, aiPlayer);
        }

        const candidates = this.getCandidateMoves(game);

        if (candidates.length === 0) {
            return this.evaluateBoard(game, aiPlayer);
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of candidates) {
                const clonedGame = game.clone();
                clonedGame.makeMove(move.row, move.col);
                const score = this.minimax(clonedGame, depth - 1, alpha, beta, false, aiPlayer);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of candidates) {
                const clonedGame = game.clone();
                clonedGame.makeMove(move.row, move.col);
                const score = this.minimax(clonedGame, depth - 1, alpha, beta, true, aiPlayer);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return minScore;
        }
    }

    /**
     * 获取候选落子位置（按评分排序并限制数量）
     */
    getCandidateMoves(game) {
        const positions = game.getMeaningfulPositions(2);
        const scored = [];

        for (const pos of positions) {
            const score = this.evaluatePosition(game, pos.row, pos.col, game.currentPlayer);
            scored.push({ ...pos, score });
        }

        // 按分数降序排序
        scored.sort((a, b) => b.score - a.score);

        // 限制候选数量
        return scored.slice(0, this.breadth);
    }

    /**
     * 评估单个位置的分数
     */
    evaluatePosition(game, row, col, player) {
        let score = 0;

        // 临时落子评估
        game.board[row][col] = player;

        // 评估进攻价值
        score += this.evaluatePoint(game, row, col, player);

        // 评估防守价值（对手在此位置的价值）
        const opponent = player === 'black' ? 'white' : 'black';
        game.board[row][col] = opponent;
        score += this.evaluatePoint(game, row, col, opponent) * 0.9;

        // 恢复棋盘
        game.board[row][col] = null;

        // 位置偏好：中心位置略有加分
        const center = Math.floor(game.size / 2);
        const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
        score += Math.max(0, 10 - distFromCenter);

        return score;
    }

    /**
     * 评估整个棋盘
     */
    evaluateBoard(game, aiPlayer) {
        let score = 0;
        const opponent = aiPlayer === 'black' ? 'white' : 'black';

        for (let row = 0; row < game.size; row++) {
            for (let col = 0; col < game.size; col++) {
                if (game.board[row][col] === aiPlayer) {
                    score += this.evaluatePoint(game, row, col, aiPlayer);
                } else if (game.board[row][col] === opponent) {
                    score -= this.evaluatePoint(game, row, col, opponent);
                }
            }
        }

        return score;
    }

    /**
     * 评估某个点在四个方向上的棋型
     */
    evaluatePoint(game, row, col, player) {
        let score = 0;
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];

        for (const [dx, dy] of directions) {
            score += this.evaluateLine(game, row, col, dx, dy, player);
        }

        return score;
    }

    /**
     * 评估某一条线上的棋型
     */
    evaluateLine(game, row, col, dx, dy, player) {
        const opponent = player === 'black' ? 'white' : 'black';

        // 向两个方向延伸，收集连续棋子数和两端状态
        let count = 1;
        let block = 0; // 被堵住的端数
        let empty = 0; // 空位数

        // 正方向
        let pos = 1;
        while (pos < 5) {
            const newRow = row + dx * pos;
            const newCol = col + dy * pos;
            if (!game.isInBounds(newRow, newCol)) {
                block++;
                break;
            }
            const cell = game.board[newRow][newCol];
            if (cell === player) {
                count++;
                pos++;
            } else if (cell === null) {
                empty++;
                break;
            } else {
                block++;
                break;
            }
        }
        if (pos === 5) block++;

        // 反方向
        pos = 1;
        while (pos < 5) {
            const newRow = row - dx * pos;
            const newCol = col - dy * pos;
            if (!game.isInBounds(newRow, newCol)) {
                block++;
                break;
            }
            const cell = game.board[newRow][newCol];
            if (cell === player) {
                count++;
                pos++;
            } else if (cell === null) {
                empty++;
                break;
            } else {
                block++;
                break;
            }
        }
        if (pos === 5) block++;

        // 根据连子数和堵塞情况返回分数
        return this.getPatternScore(count, block);
    }

    /**
     * 根据连子数和堵塞数获取棋型分数
     */
    getPatternScore(count, block) {
        if (block >= 2) {
            // 两端都被堵，无价值
            return 0;
        }

        switch (count) {
            case 5:
                return this.patterns.five;
            case 4:
                return block === 0 ? this.patterns.liveFour : this.patterns.deadFour;
            case 3:
                return block === 0 ? this.patterns.liveThree : this.patterns.deadThree;
            case 2:
                return block === 0 ? this.patterns.liveTwo : this.patterns.deadTwo;
            case 1:
                return this.patterns.one;
            default:
                return this.patterns.five; // 超过5个也算赢
        }
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GomokuAI;
}
