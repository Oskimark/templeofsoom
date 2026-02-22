export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, 'TEMPLE OF DOOM', {
            fontSize: '32px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const highScore = localStorage.getItem('templeHighScore') || 0;
        this.add.text(width / 2, height / 2, `High Score: ${highScore}`, {
            fontSize: '18px',
            fill: '#ffd700'
        }).setOrigin(0.5);

        const playText = this.add.text(width / 2, height / 1.5, 'Click to PLAY', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        playText.setInteractive();

        // Flashing text
        this.tweens.add({
            targets: playText,
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
