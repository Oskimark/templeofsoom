export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        const portada = this.add.image(width / 2, height / 2, 'portada');
        // Calculate scaling to cover the whole screen properly
        const scaleX = width / portada.width;
        const scaleY = height / portada.height;
        const scale = Math.max(scaleX, scaleY);
        portada.setScale(scale).setScrollFactor(0);
        // Slightly darken image so text reads well
        portada.setTint(0xdddddd);

        this.add.text(width / 2, height / 4, 'LAVA JUMP', {
            fontSize: '48px',
            fill: '#ff4500',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const highScore = localStorage.getItem('templeHighScore') || 0;
        this.add.text(width / 2, height / 2, `High Score: ${highScore}`, {
            fontSize: '22px',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const playText = this.add.text(width / 2, height / 1.5, 'Click to PLAY', {
            fontSize: '28px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 5
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
            this.scene.start('MainScene', { level: 1, score: 0 });
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene', { level: 1, score: 0 });
        });
    }
}
