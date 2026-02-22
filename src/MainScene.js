import Player from './Player.js';
import LevelManager from './LevelManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
    }

    create() {
        this.maxHeight = 0;
        this.levelTargetY = -4000 - (this.level * 2000); // Level 1 is -6000

        // Setting up level specific palettes
        let bgmKey = 'bg_music_1';
        let lavaTexture = 'lava';

        if (this.level % 2 === 0) { // Even levels
            bgmKey = 'bg_music_2';
            this.cameras.main.setBackgroundColor('#1a0033'); // Dark purple bg
            lavaTexture = 'lava_2';
        } else { // Odd levels
            bgmKey = 'bg_music_1';
            this.cameras.main.setBackgroundColor('#000000'); // Black bg
            lavaTexture = 'lava';
        }

        // Lava
        this.lavaHeight = 800; // Start lava far down
        this.lavaSpeed = 20 + (this.level * 5); // Faster base lava on higher levels

        this.levelManager = new LevelManager(this);

        // Spawn Player
        this.player = new Player(this, 200, 500);

        // Audio
        this.bgMusic = this.sound.add(bgmKey, { volume: 0.5, loop: true });
        this.explosionSound = this.sound.add('explosion', { volume: 0.8 });

        // Ensure starting clean in case of restart
        this.sound.stopAll();
        this.bgMusic.play();

        // UI
        this.scoreText = this.add.text(16, 16, `Level: ${this.level} - Score: ${this.score}`, { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);
        this.scoreText.setDepth(100);

        // Jetpack UI
        this.add.text(16, 46, 'Fuel:', { fontSize: '18px', fill: '#00bfff' }).setScrollFactor(0).setDepth(100);
        this.fuelBarBg = this.add.rectangle(75, 55, 100, 15, 0x555555).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
        this.fuelBar = this.add.rectangle(75, 55, 0, 15, 0x00bfff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);

        // Level Progress UI
        const width = this.cameras.main.width;
        this.progressBg = this.add.rectangle(width / 2, 25, 180, 15, 0x444444).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);
        this.progressBar = this.add.rectangle(width / 2 - 90, 25, 0, 15, 0x00ff00).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
        this.progressText = this.add.text(width / 2, 25, '0%', { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);

        // Lava Graphic
        this.lava = this.add.image(200, this.lavaHeight, lavaTexture).setOrigin(0.5, 0).setDepth(50);
        this.physics.add.existing(this.lava);
        this.lava.body.setAllowGravity(false);
        this.lava.body.setImmovable(true);

        // Camera setup
        this.cameras.main.startFollow(this.player, true, 0, 0.1, 0, 100);

        // Allow infinite upwards and downwards movement by disabling top/bottom world bounds
        this.physics.world.setBoundsCollision(true, true, false, false);

        // Collisions
        this.physics.add.collider(this.player, this.levelManager.platforms);
        this.physics.add.collider(this.player, this.levelManager.breakablePlatforms, this.hitBreakable, null, this);

        // Deadly Collisions
        this.physics.add.overlap(this.player, this.lava, this.die, null, this);
        this.physics.add.overlap(this.player, this.levelManager.spikes, this.die, null, this);
        this.physics.add.overlap(this.player, this.levelManager.darts, this.die, null, this);
        this.physics.add.overlap(this.player, this.levelManager.enemies, this.die, null, this);

        // Items & Exits
        this.physics.add.overlap(this.player, this.levelManager.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.levelManager.jetpacks, this.collectJetpack, null, this);
        this.physics.add.overlap(this.player, this.levelManager.exits, this.finishLevel, null, this);
    }

    update(time, delta) {
        if (!this.player.active) return;

        this.player.update(time, delta);
        this.levelManager.update(this.cameras.main.scrollY);

        // Calculate score based on height
        const currentHeightScore = Math.floor(Math.abs(Math.min(0, this.player.y - 600)));
        if (currentHeightScore > this.maxHeight) {
            this.maxHeight = currentHeightScore;
            this.updateScore(this.maxHeight);
        }

        // Lava logic
        this.lavaHeight -= (this.lavaSpeed * (delta / 1000));

        // Increase lava speed gradually
        this.lavaSpeed = 20 + (this.maxHeight * 0.01);

        // Safety mechanic to prevent lava from catching player immediately at start
        if (this.lavaHeight > this.player.y + 300) {
            this.lavaHeight = this.player.y + 300;
        }

        this.lava.y = this.lavaHeight;
        this.lava.body.y = this.lavaHeight;

        // Prevent falling out of bounds (below lava is caught by overlap, below screen usually caught too)
        if (this.player.y > this.cameras.main.scrollY + 650) {
            this.die();
        }

        // Update Fuel UI
        const fuelPercentage = this.player.jetpackFuel / this.player.maxJetpackFuel;
        this.fuelBar.width = 100 * fuelPercentage;

        // Update Level Progress UI
        const startY = 500; // where the player starts
        const totalDistance = startY - this.levelTargetY;
        const currentDistance = startY - this.player.y;

        let progress = currentDistance / totalDistance;
        progress = Phaser.Math.Clamp(progress, 0, 1);

        this.progressBar.width = 180 * progress;
        this.progressText.setText(Math.floor(progress * 100) + '%');
    }

    hitBreakable(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            this.time.delayedCall(200, () => {
                platform.destroy();
            }, [], this);
        }
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 500;
        this.updateScore();
    }

    collectJetpack(player, jetpack) {
        jetpack.destroy();
        // Give 50 fuel unit per collectible
        player.addJetpackFuel(50);

        // Visual feedback
        this.cameras.main.flash(200, 0, 191, 255); // Blue flash
    }

    updateScore(add = 0) {
        // Calculate total score = maxHeight + collected items
        const total = this.maxHeight + this.score;
        this.scoreText.setText(`Level: ${this.level} - Score: ${total}`);
    }

    finishLevel() {
        this.player.setActive(false).setVisible(false);
        this.physics.pause();
        this.bgMusic.stop();
        this.cameras.main.flash(500, 255, 255, 255);
        this.time.delayedCall(1000, () => {
            const totalScore = this.maxHeight + this.score;
            this.scene.start('MainScene', { level: this.level + 1, score: totalScore });
        }, [], this);
    }

    die() {
        this.player.setActive(false).setVisible(false);
        this.physics.pause();

        this.bgMusic.stop();
        this.explosionSound.play();

        this.cameras.main.shake(500, 0.05);

        const totalScore = this.maxHeight + this.score;

        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', { score: totalScore, level: this.level });
        }, [], this);
    }
}
