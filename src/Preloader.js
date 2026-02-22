export default class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Create basic textures for the game programmatically
        // Player texture (a small square/rectangle)
        const playerGraphics = this.make.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillRect(0, 0, 24, 32);
        playerGraphics.generateTexture('player', 24, 32);

        // Platform texture
        const platformGraphics = this.make.graphics();
        platformGraphics.fillStyle(0x8B4513); // Brown
        platformGraphics.fillRect(0, 0, 64, 16);
        platformGraphics.generateTexture('platform', 64, 16);

        // Breakable Platform texture
        const breakableGraphics = this.make.graphics();
        breakableGraphics.fillStyle(0xCD853F); // Lighter brown
        breakableGraphics.fillRect(0, 0, 64, 16);
        breakableGraphics.generateTexture('platform_breakable', 64, 16);

        // Spike texture
        const spikeGraphics = this.make.graphics();
        spikeGraphics.fillStyle(0xcccccc);
        spikeGraphics.beginPath();
        spikeGraphics.moveTo(8, 0);
        spikeGraphics.lineTo(16, 16);
        spikeGraphics.lineTo(0, 16);
        spikeGraphics.fillPath();
        spikeGraphics.generateTexture('spike', 16, 16);

        // Dart texture
        const dartGraphics = this.make.graphics();
        dartGraphics.fillStyle(0xffffff);
        dartGraphics.fillRect(0, 0, 12, 4);
        dartGraphics.generateTexture('dart', 12, 4);

        // Enemy texture (bat/skeleton)
        const enemyGraphics = this.make.graphics();
        enemyGraphics.fillStyle(0xff0000);
        enemyGraphics.fillRect(0, 0, 20, 20);
        enemyGraphics.generateTexture('enemy', 20, 20);

        // Coin/Idol texture
        const coinGraphics = this.make.graphics();
        coinGraphics.fillStyle(0xffd700);
        coinGraphics.fillCircle(8, 8, 8);
        coinGraphics.generateTexture('coin', 16, 16);

        // Lava texture
        const lavaGraphics = this.make.graphics();
        lavaGraphics.fillStyle(0xff4500, 0.8);
        lavaGraphics.fillRect(0, 0, 400, 800);
        lavaGraphics.generateTexture('lava', 400, 800);
    }

    create() {
        this.scene.start('MenuScene');
    }
}
