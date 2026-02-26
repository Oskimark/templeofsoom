export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.level = data.level || 1;
        this.formattedTime = data.formattedTime || '';
        this.formattedBestTime = data.formattedBestTime || '';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        // USER REQUEST: always show game over.png (key: 'gameover')
        const bgKey = 'gameover';
        const gameOverBg = this.add.image(width / 2, height / 2, bgKey);
        // Calculate scaling to cover the whole screen properly
        const scaleX = width / gameOverBg.width;
        const scaleY = height / gameOverBg.height;
        const scale = Math.max(scaleX, scaleY);
        gameOverBg.setScale(scale).setScrollFactor(0);
        gameOverBg.setTint(0xdddddd);

        const statsText = `Level: ${this.level}\nScore: ${this.finalScore}\nTime: ${this.formattedTime}\nBest: ${this.formattedBestTime}`;
        this.add.text(width / 2, height / 2, statsText, {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // Update High Score
        let highScore = parseInt(localStorage.getItem('templeHighScore')) || 0;
        if (this.finalScore > highScore) {
            highScore = this.finalScore;
            localStorage.setItem('templeHighScore', highScore);
            this.add.text(width / 2, height / 2 + 30, 'NEW HIGH SCORE!', {
                fontSize: '20px',
                fill: '#ffd700'
            }).setOrigin(0.5);
        }

        this.input.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}
