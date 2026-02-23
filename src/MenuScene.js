export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        const portada = this.add.image(width / 2, height / 2, 'portada');
        const scaleX = width / portada.width;
        const scaleY = height / portada.height;
        const scale = Math.max(scaleX, scaleY);
        portada.setScale(scale).setScrollFactor(0);
        portada.setTint(0xdddddd);

        // High Score
        const highScore = localStorage.getItem('templeHighScore') || 0;
        this.add.text(width / 2, height - 10, `HIGH SCORE: ${highScore}`, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1);

        // Level Selector Title
        this.add.text(width / 2, height / 2 + 60, 'SELECCIONA NIVEL', {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Level Buttons
        const levelNames = ['Volcán', 'Cielo', 'Espacio'];
        const levelColors = [0xff4500, 0x4488ff, 0x8800ff];
        const btnY = height / 2 + 110;
        const btnSpacing = 110;
        const startX = width / 2 - btnSpacing;

        for (let i = 0; i < 3; i++) {
            const bx = startX + i * btnSpacing;

            // Button background
            const btnBg = this.add.rectangle(bx, btnY, 90, 50, levelColors[i], 0.8)
                .setStrokeStyle(2, 0xffffff, 0.9)
                .setInteractive({ useHandCursor: true });

            // Button text
            const btnText = this.add.text(bx, btnY - 8, `${i + 1}`, {
                fontSize: '24px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const btnLabel = this.add.text(bx, btnY + 14, levelNames[i], {
                fontSize: '11px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Hover effect
            btnBg.on('pointerover', () => {
                btnBg.setScale(1.1);
                btnText.setScale(1.1);
                btnLabel.setScale(1.1);
            });
            btnBg.on('pointerout', () => {
                btnBg.setScale(1);
                btnText.setScale(1);
                btnLabel.setScale(1);
            });

            // Click handler
            const level = i + 1;
            btnBg.on('pointerdown', () => {
                this.scene.start('MainScene', { level: level, score: 0 });
            });
        }

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-ONE', () => {
            this.scene.start('MainScene', { level: 1, score: 0 });
        });
        this.input.keyboard.on('keydown-TWO', () => {
            this.scene.start('MainScene', { level: 2, score: 0 });
        });
        this.input.keyboard.on('keydown-THREE', () => {
            this.scene.start('MainScene', { level: 3, score: 0 });
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('MainScene', { level: 1, score: 0 });
        });
    }
}
