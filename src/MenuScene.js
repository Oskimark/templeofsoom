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

        const highScore = localStorage.getItem('templeHighScore') || 0;
        this.add.text(width / 2, height - 10, `HIGH SCORE: ${highScore}`, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1);

        this.input.on('pointerdown', () => {
            this.scene.start('MainScene', { level: 1, score: 0 });
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene', { level: 1, score: 0 });
        });
    }
}
