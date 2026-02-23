export default class StoryScene extends Phaser.Scene {
    constructor() {
        super('StoryScene');
    }

    init(data) {
        this.nextLevel = data.nextLevel || 2;
        this.score = data.score || 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        const storyBg = this.add.image(width / 2, height / 2, 'lev1');

        // Calculate scaling to cover the whole screen properly
        const scaleX = width / storyBg.width;
        const scaleY = height / storyBg.height;
        const scale = Math.max(scaleX, scaleY);
        storyBg.setScale(scale).setScrollFactor(0);

        // Slightly darken image so text reads well
        storyBg.setTint(0xdddddd);

        // Story Text
        const storyTextContainer = this.add.container(width / 2, height / 2 - 50);

        const titleText = this.add.text(0, -60, 'ESCAPASTE DEL VOLCÁN', {
            fontSize: '28px',
            fill: '#ff9900',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const descText = this.add.text(0, 20, 'Has logrado salir a la\nsuperficie, pero la travesía\ncontinúa hacia los cielos...', {
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        storyTextContainer.add([titleText, descText]);

        const continueText = this.add.text(width / 2, height - 80, 'Presiona ESPACIO o Click para Continuar', {
            fontSize: '20px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        continueText.setInteractive();

        // Flashing text
        this.tweens.add({
            targets: continueText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });

        const startNext = () => {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.tweens.killAll(); // Clean up tweens to avoid conflicts
            this.scene.start('MainScene', { level: this.nextLevel, score: this.score });
        };

        this.input.on('pointerdown', startNext);
        this.input.keyboard.on('keydown-SPACE', startNext);
    }
}
