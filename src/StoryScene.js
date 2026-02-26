export default class StoryScene extends Phaser.Scene {
    constructor() {
        super('StoryScene');
    }

    init(data) {
        this.nextLevel = data.nextLevel || 2;
        this.score = data.score || 0;
        this.storyKey = data.storyKey || 'lev1';
        this.storyTitle = data.title || '';
        this.storyDesc = data.desc || '';
        this.noText = data.noText || false;
        this.formattedTime = data.formattedTime || '';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        const storyBg = this.add.image(width / 2, height / 2, this.storyKey);
        const scaleX = width / storyBg.width;
        const scaleY = height / storyBg.height;
        const scale = Math.max(scaleX, scaleY);
        storyBg.setScale(scale).setScrollFactor(0);

        // Only show text if noText is false
        if (!this.noText) {
            storyBg.setTint(0xdddddd);

            if (this.storyTitle) {
                const storyTextContainer = this.add.container(width / 2, height / 2 - 50);

                const titleText = this.add.text(0, -60, this.storyTitle, {
                    fontSize: '24px',
                    fill: '#ff9900',
                    stroke: '#000000',
                    strokeThickness: 6,
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                const descText = this.add.text(0, 20, this.storyDesc, {
                    fontSize: '18px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 5,
                    align: 'center'
                }).setOrigin(0.5);

                storyTextContainer.add([titleText, descText]);

                if (this.formattedTime) {
                    const timeText = this.add.text(0, 80, `Time: ${this.formattedTime}`, {
                        fontSize: '20px',
                        fill: '#00ffff',
                        stroke: '#000000',
                        strokeThickness: 4,
                        fontStyle: 'bold'
                    }).setOrigin(0.5);
                    storyTextContainer.add(timeText);
                }
            }
        }

        this.isTransitioning = false;

        const startNext = () => {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.tweens.killAll();
            this.scene.start('MainScene', { level: this.nextLevel, score: this.score });
        };

        // Delay input registration to prevent the menu click from skipping this scene
        this.time.delayedCall(500, () => {
            this.input.on('pointerdown', startNext);
            this.input.keyboard.on('keydown-SPACE', startNext);
        });
    }
}
