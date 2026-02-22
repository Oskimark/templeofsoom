import Player from './Player.js';
import LevelManager from './LevelManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.score = 0;
        this.maxHeight = 0;

        // Lava
        this.lavaHeight = 800; // Start lava far down
        this.lavaSpeed = 20;

        this.levelManager = new LevelManager(this);

        // Spawn Player
        this.player = new Player(this, 200, 500);

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);
        this.scoreText.setDepth(100);

        // Lava Graphic
        this.lava = this.add.image(200, this.lavaHeight, 'lava').setOrigin(0.5, 0).setDepth(50);
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

        // Items
        this.physics.add.overlap(this.player, this.levelManager.coins, this.collectCoin, null, this);
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

    updateScore(add = 0) {
        // Calculate total score = maxHeight + collected items
        const total = this.maxHeight + this.score;
        this.scoreText.setText('Score: ' + total);
    }

    die() {
        this.player.setActive(false).setVisible(false);
        this.physics.pause();

        this.cameras.main.shake(500, 0.05);

        const totalScore = this.maxHeight + this.score;

        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', { score: totalScore });
        }, [], this);
    }
}
