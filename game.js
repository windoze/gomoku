/**
 * 五子棋游戏核心逻辑
 */
class GomokuGame {
    constructor(size = 15) {
        this.size = size;
        this.board = [];
        this.currentPlayer = 'black'; // 'black' or 'white'
        this.history = [];
        this.gameOver = false;
        this.winner = null;
        this.init();
    }

    init() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.currentPlayer = 'black';
        this.history = [];
        this.gameOver = false;
        this.winner = null;
    }

    /**
     * 检查落子是否合法
     */
    isValidMove(row, col) {
        if (this.gameOver) return false;
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false;
        return this.board[row][col] === null;
    }

    /**
     * 落子
     */
    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return false;

        this.board[row][col] = this.currentPlayer;
        this.history.push({ row, col, player: this.currentPlayer });

        // 检查胜负
        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
        } else if (this.isBoardFull()) {
            this.gameOver = true;
            this.winner = 'draw';
        } else {
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        }

        return true;
    }

    /**
     * 悔棋
     */
    undoMove() {
        if (this.history.length === 0) return false;

        const lastMove = this.history.pop();
        this.board[lastMove.row][lastMove.col] = null;
        this.currentPlayer = lastMove.player;
        this.gameOver = false;
        this.winner = null;

        return lastMove;
    }

    /**
     * 检查是否获胜
     */
    checkWin(row, col) {
        const player = this.board[row][col];
        if (!player) return false;

        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];

        for (const [dx, dy] of directions) {
            let count = 1;

            // 正方向
            for (let i = 1; i < 5; i++) {
                const newRow = row + dx * i;
                const newCol = col + dy * i;
                if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            // 反方向
            for (let i = 1; i < 5; i++) {
                const newRow = row - dx * i;
                const newCol = col - dy * i;
                if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol] === player) {
                    count++;
                } else {
                    break;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    /**
     * 检查坐标是否在棋盘内
     */
    isInBounds(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    /**
     * 检查棋盘是否已满
     */
    isBoardFull() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === null) return false;
            }
        }
        return true;
    }

    /**
     * 获取所有空位
     */
    getEmptyPositions() {
        const positions = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === null) {
                    positions.push({ row, col });
                }
            }
        }
        return positions;
    }

    /**
     * 获取有意义的空位（周围有棋子的位置）
     */
    getMeaningfulPositions(range = 2) {
        const positions = new Set();

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] !== null) {
                    // 检查周围的空位
                    for (let dr = -range; dr <= range; dr++) {
                        for (let dc = -range; dc <= range; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol] === null) {
                                positions.add(`${newRow},${newCol}`);
                            }
                        }
                    }
                }
            }
        }

        // 如果棋盘为空，返回中心位置
        if (positions.size === 0) {
            const center = Math.floor(this.size / 2);
            return [{ row: center, col: center }];
        }

        return Array.from(positions).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
    }

    /**
     * 复制游戏状态
     */
    clone() {
        const cloned = new GomokuGame(this.size);
        cloned.board = this.board.map(row => [...row]);
        cloned.currentPlayer = this.currentPlayer;
        cloned.history = [...this.history];
        cloned.gameOver = this.gameOver;
        cloned.winner = this.winner;
        return cloned;
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GomokuGame;
}
