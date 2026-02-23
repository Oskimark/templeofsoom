export default class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }
    preload() {
        // Load Audio
        this.load.audio('bg_music_1', 'music/Event_Horizon_Cascade.mp3');
        this.load.audio('bg_music_2', 'music/Tribal_Apex.mp3');
        this.load.audio('explosion', 'music/explosion.mp3');

        // Load Images
        this.load.image('portada', 'images/portada.png');
        this.load.image('gameover', 'images/game over.png');
        this.load.image('lev1', 'images/lev1.png');
        this.load.image('lev2', 'images/lev2.png');
        this.load.image('plataforma2', 'images/plataforma2.png');
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

        // Lava texture 1 (Orange/Red)
        const lavaGraphics = this.make.graphics();
        lavaGraphics.fillStyle(0xff4500, 0.8);
        lavaGraphics.fillRect(0, 0, 400, 800);
        lavaGraphics.generateTexture('lava', 400, 800);

        // Lava texture 2 (Cyan/Blue)
        const lavaGraphics2 = this.make.graphics();
        lavaGraphics2.fillStyle(0x00ffff, 0.8);
        lavaGraphics2.fillRect(0, 0, 400, 800);
        lavaGraphics2.generateTexture('lava_2', 400, 800);

        // Portal texture
        const portalGraphics = this.make.graphics();
        portalGraphics.fillStyle(0xffffff, 0.7);
        portalGraphics.fillEllipse(32, 64, 64, 128); // width 64
        portalGraphics.generateTexture('portal', 64, 128);

        // Jetpack texture
        const jetpackGraphics = this.make.graphics();
        jetpackGraphics.fillStyle(0x00bfff); // Deep sky blue
        jetpackGraphics.fillRect(0, 0, 16, 20);
        jetpackGraphics.fillStyle(0xffffff); // White J
        // Draw a simple 'J' pixel by pixel or with lines
        jetpackGraphics.fillRect(10, 2, 2, 12); // Vertical line
        jetpackGraphics.fillRect(6, 12, 4, 2); // Bottom hook
        jetpackGraphics.fillRect(4, 8, 2, 4);  // Left hook
        jetpackGraphics.fillRect(6, 2, 6, 2);  // Top bar
        jetpackGraphics.fillStyle(0xffa500); // Orange flame
        jetpackGraphics.generateTexture('jetpack', 16, 28);

        // Shield texture
        const shieldGraphics = this.make.graphics();
        shieldGraphics.lineStyle(3, 0x00ff88, 1);
        shieldGraphics.strokeCircle(12, 12, 12);
        shieldGraphics.fillStyle(0x00ff88, 0.3);
        shieldGraphics.fillCircle(12, 12, 12);
        shieldGraphics.generateTexture('shield', 24, 24);

        // Mobile Controls Textures
        const btnGraphics = this.make.graphics();
        btnGraphics.fillStyle(0xffffff, 0.5);
        btnGraphics.fillCircle(32, 32, 32);
        btnGraphics.lineStyle(4, 0x000000, 0.5);
        btnGraphics.strokeCircle(32, 32, 32);
        btnGraphics.generateTexture('btn_base', 64, 64);
    }

    create() {
        this.scene.start('MenuScene');
    }
}
