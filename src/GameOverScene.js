export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.level = data.level || 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, `Level: ${this.level} - Score: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#fff'
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

        const retryText = this.add.text(width / 2, height / 1.5, 'Click to Retry', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        retryText.setInteractive();

        this.tweens.add({
            targets: retryText,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });

        this.input.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene');
        });
    }
}
