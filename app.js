/**
 * 五子棋应用主入口
 */
class GomokuApp {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.game = new GomokuGame(15);
        this.ai = new GomokuAI(3);

        this.cellSize = 40;
        this.padding = 20;
        this.pieceRadius = 17;

        this.mode = 'pvp'; // 'pvp' or 'pve'
        this.playerColor = 'black';
        this.aiThinking = false;

        // 缓存棋盘背景
        this.boardCache = null;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.loadSettings();
        this.bindEvents();
        this.createBoardCache();
        this.draw();
    }

    /**
     * 从localStorage加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('gomoku_settings');
            if (saved) {
                const settings = JSON.parse(saved);

                // 恢复AI难度
                if (settings.aiDifficulty) {
                    this.ai.setDepth(settings.aiDifficulty);
                    document.getElementById('aiDifficulty').value = settings.aiDifficulty;
                }

                // 恢复玩家颜色
                if (settings.playerColor) {
                    this.playerColor = settings.playerColor;
                    document.getElementById('playerColor').value = settings.playerColor;
                }
            }
        } catch (e) {
            console.log('Failed to load settings:', e);
        }
    }

    /**
     * 保存设置到localStorage
     */
    saveSettings() {
        try {
            const settings = {
                aiDifficulty: parseInt(document.getElementById('aiDifficulty').value),
                playerColor: this.playerColor
            };
            localStorage.setItem('gomoku_settings', JSON.stringify(settings));
        } catch (e) {
            console.log('Failed to save settings:', e);
        }
    }

    /**
     * 预渲染棋盘背景（木纹+网格+星位），缓存为图像
     */
    createBoardCache() {
        const offscreen = document.createElement('canvas');
        offscreen.width = this.canvas.width;
        offscreen.height = this.canvas.height;
        const ctx = offscreen.getContext('2d');

        // 绘制木纹背景
        this.drawWoodTextureToContext(ctx, offscreen.width, offscreen.height);

        // 绘制网格线
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;

        for (let i = 0; i < this.game.size; i++) {
            const pos = this.padding + i * this.cellSize;

            // 横线
            ctx.beginPath();
            ctx.moveTo(this.padding, pos);
            ctx.lineTo(this.padding + (this.game.size - 1) * this.cellSize, pos);
            ctx.stroke();

            // 竖线
            ctx.beginPath();
            ctx.moveTo(pos, this.padding);
            ctx.lineTo(pos, this.padding + (this.game.size - 1) * this.cellSize);
            ctx.stroke();
        }

        // 绘制星位
        this.drawStarPointsToContext(ctx);

        this.boardCache = offscreen;
    }

    setupCanvas() {
        const boardSize = this.cellSize * (this.game.size - 1) + this.padding * 2;
        this.canvas.width = boardSize;
        this.canvas.height = boardSize;

        // 响应式调整
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxSize = Math.min(container.clientWidth, window.innerHeight - 250);
        const boardSize = this.cellSize * (this.game.size - 1) + this.padding * 2;

        if (maxSize < boardSize) {
            const scale = maxSize / boardSize;
            this.canvas.style.width = `${maxSize}px`;
            this.canvas.style.height = `${maxSize}px`;
        } else {
            this.canvas.style.width = `${boardSize}px`;
            this.canvas.style.height = `${boardSize}px`;
        }
    }

    bindEvents() {
        // 棋盘点击
        this.canvas.addEventListener('click', (e) => this.handleBoardClick(e));

        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // AI设置
        document.getElementById('aiDifficulty').addEventListener('change', (e) => {
            this.ai.setDepth(parseInt(e.target.value));
            this.saveSettings();
        });

        document.getElementById('playerColor').addEventListener('change', (e) => {
            this.playerColor = e.target.value;
            this.saveSettings();
            this.restartGame();
        });

        // 悔棋
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());

        // 重新开始
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // 模态框按钮
        document.getElementById('modalBtn').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
            this.restartGame();
        });
    }

    handleBoardClick(e) {
        if (this.game.gameOver || this.aiThinking) return;

        // 人机模式下，不是玩家回合则忽略
        if (this.mode === 'pve' && this.game.currentPlayer !== this.playerColor) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);

        if (this.game.isValidMove(row, col)) {
            this.game.makeMove(row, col);
            this.draw();
            this.updateStatus();

            if (this.game.gameOver) {
                this.showGameOver();
            } else if (this.mode === 'pve') {
                this.aiMove();
            }
        }
    }

    async aiMove() {
        this.aiThinking = true;
        this.updateStatus('AI思考中...');

        // 使用setTimeout让UI有机会更新
        await new Promise(resolve => setTimeout(resolve, 100));

        const move = this.ai.getBestMove(this.game);

        if (move) {
            this.game.makeMove(move.row, move.col);
            this.draw();
            this.updateStatus();

            if (this.game.gameOver) {
                this.showGameOver();
            }
        }

        this.aiThinking = false;
    }

    switchMode(mode) {
        this.mode = mode;

        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // 显示/隐藏AI设置
        document.getElementById('aiSettings').style.display = mode === 'pve' ? 'flex' : 'none';

        this.restartGame();
    }

    undoMove() {
        if (this.aiThinking) return;

        if (this.mode === 'pve') {
            // 人机模式下悔两步（玩家和AI各一步）
            this.game.undoMove();
            this.game.undoMove();
        } else {
            this.game.undoMove();
        }

        this.draw();
        this.updateStatus();
    }

    restartGame() {
        this.game.init();
        this.aiThinking = false;
        this.draw();
        this.updateStatus();

        // 人机模式下，如果AI先手
        if (this.mode === 'pve' && this.playerColor === 'white') {
            this.aiMove();
        }
    }

    updateStatus(customMessage) {
        const status = document.getElementById('status');

        if (customMessage) {
            status.textContent = customMessage;
            status.className = 'status';
            return;
        }

        if (this.game.gameOver) {
            if (this.game.winner === 'draw') {
                status.textContent = '平局！';
            } else {
                const winnerName = this.game.winner === 'black' ? '黑方' : '白方';
                status.textContent = `${winnerName}获胜！`;
            }
            status.className = 'status';
        } else {
            const playerName = this.game.currentPlayer === 'black' ? '黑方' : '白方';
            status.textContent = `${playerName}回合`;
            status.className = `status ${this.game.currentPlayer}-turn`;
        }
    }

    showGameOver() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modalTitle');
        const message = document.getElementById('modalMessage');

        if (this.game.winner === 'draw') {
            title.textContent = '平局';
            message.textContent = '棋盘已满，双方不分胜负！';
        } else {
            const winnerName = this.game.winner === 'black' ? '黑方' : '白方';

            if (this.mode === 'pve') {
                if (this.game.winner === this.playerColor) {
                    title.textContent = '恭喜获胜！';
                    message.textContent = '你击败了AI！';
                } else {
                    title.textContent = 'AI获胜';
                    message.textContent = '再接再厉！';
                }
            } else {
                title.textContent = `${winnerName}获胜！`;
                message.textContent = '精彩的对局！';
            }
        }

        modal.style.display = 'flex';
    }

    draw() {
        this.drawBoard();
        this.drawPieces();
        this.drawLastMove();
    }

    drawBoard() {
        // 直接使用缓存的棋盘背景
        if (this.boardCache) {
            this.ctx.drawImage(this.boardCache, 0, 0);
        }
    }

    /**
     * 绘制木纹到指定上下文（仅在创建缓存时调用一次）
     */
    drawWoodTextureToContext(ctx, width, height) {
        // 基础木色 - 更淡的颜色
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#E8D4B8');
        gradient.addColorStop(0.3, '#DECCA8');
        gradient.addColorStop(0.6, '#E8D4B8');
        gradient.addColorStop(1, '#D8C4A0');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 添加木纹效果 - 使用固定模式，更淡的颜色
        ctx.save();
        ctx.globalAlpha = 0.06;  // 更淡的木纹

        // 使用固定的伪随机模式
        for (let i = 0; i < 40; i++) {
            // 固定的y位置，基于索引
            const y = (i * 17.3 + 5) % height;
            const waveHeight = 2 + (i % 5) * 0.6;

            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x < width; x += 10) {
                ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 0.5) * waveHeight);
            }

            ctx.strokeStyle = i % 2 === 0 ? '#A67B5B' : '#B8956E';
            ctx.lineWidth = 1 + (i % 3) * 0.3;
            ctx.stroke();
        }

        ctx.restore();

        // 添加边框效果
        ctx.save();
        ctx.strokeStyle = '#C9A86C';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        ctx.restore();
    }

    /**
     * 绘制星位到指定上下文
     */
    drawStarPointsToContext(ctx) {
        const starRadius = 4;

        // 15x15棋盘的星位
        const starPositions = [
            [3, 3], [3, 7], [3, 11],
            [7, 3], [7, 7], [7, 11],
            [11, 3], [11, 7], [11, 11]
        ];

        ctx.fillStyle = '#8B7355';

        for (const [row, col] of starPositions) {
            const x = this.padding + col * this.cellSize;
            const y = this.padding + row * this.cellSize;

            ctx.beginPath();
            ctx.arc(x, y, starRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPieces() {
        const ctx = this.ctx;

        for (let row = 0; row < this.game.size; row++) {
            for (let col = 0; col < this.game.size; col++) {
                const piece = this.game.board[row][col];
                if (piece) {
                    this.drawPiece(row, col, piece);
                }
            }
        }
    }

    drawPiece(row, col, color) {
        const ctx = this.ctx;
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;
        const radius = this.pieceRadius;

        ctx.save();

        // 棋子阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // 毛玻璃效果的棋子
        if (color === 'black') {
            // 黑子渐变
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(0.5, '#2a2a2a');
            gradient.addColorStop(1, '#1a1a1a');
            ctx.fillStyle = gradient;
        } else {
            // 白子渐变 - 毛玻璃效果
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(0.5, 'rgba(240, 240, 245, 0.9)');
            gradient.addColorStop(1, 'rgba(220, 220, 230, 0.85)');
            ctx.fillStyle = gradient;
        }

        // 绘制棋子主体
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 添加高光效果（毛玻璃质感）
        ctx.shadowColor = 'transparent';

        const highlightGradient = ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x - radius * 0.2, y - radius * 0.2, radius * 0.5
        );

        if (color === 'black') {
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 白子添加边框增强立体感
        if (color === 'white') {
            ctx.strokeStyle = 'rgba(180, 180, 190, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, radius - 0.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawLastMove() {
        if (this.game.history.length === 0) return;

        const lastMove = this.game.history[this.game.history.length - 1];
        const ctx = this.ctx;
        const x = this.padding + lastMove.col * this.cellSize;
        const y = this.padding + lastMove.row * this.cellSize;

        // 在最后落子位置画一个小红点
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GomokuApp();
});
