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
        this.levelTargetY = -4000 - (this.level * 2000);
        this.isShipMode = (this.level >= 4);

        // Setting up level specific palettes
        let bgmKey = 'bg_music_1'; // Default
        let lavaTexture = 'lava';

        if (this.level === 1) {
            bgmKey = 'bg_music_2'; // Tribal Apex
            this.cameras.main.setBackgroundColor('#3e2723'); // Dark brown/earthy
            lavaTexture = 'lava';
        } else if (this.level === 2) {
            bgmKey = 'bg_music_1';
            lavaTexture = 'lava'; // Orange lava
            this.cameras.main.setBackgroundColor('#ff4500');
            // We'll update the bg color dynamically in update() based on player progress
        } else if (this.level === 3) {
            bgmKey = 'bg_music_1';
            lavaTexture = 'lava'; // Orange lava in all levels
            this.cameras.main.setBackgroundColor('#000000');
            // Twinkling stars
            this.stars = [];
            for (let i = 0; i < 60; i++) {
                const sx = Phaser.Math.Between(0, this.cameras.main.width);
                const sy = Phaser.Math.Between(0, this.cameras.main.height);
                const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 3), 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
                star.setScrollFactor(0).setDepth(-5);
                this.tweens.add({
                    targets: star,
                    alpha: Phaser.Math.FloatBetween(0.1, 0.4),
                    duration: Phaser.Math.Between(800, 2000),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.stars.push(star);
            }
        } else if (this.level >= 4) {
            bgmKey = 'bg_music_1';
            lavaTexture = 'lava_explosion'; // Yellow explosion
            this.cameras.main.setBackgroundColor('#000000');
            // Twinkling stars
            this.stars = [];
            for (let i = 0; i < 80; i++) {
                const sx = Phaser.Math.Between(0, this.cameras.main.width);
                const sy = Phaser.Math.Between(0, this.cameras.main.height);
                const star = this.add.circle(sx, sy, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
                star.setScrollFactor(0).setDepth(-5);
                this.tweens.add({
                    targets: star,
                    alpha: Phaser.Math.FloatBetween(0.05, 0.3),
                    duration: Phaser.Math.Between(600, 1800),
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                this.stars.push(star);
            }
        } else {
            bgmKey = 'bg_music_1';
            this.cameras.main.setBackgroundColor('#000000');
            lavaTexture = 'lava';
        }

        // Lava
        this.lavaHeight = 800; // Start lava far down
        this.lavaSpeed = 30 + (this.level * 5); // Constant base lava, slightly faster each level

        this.levelManager = new LevelManager(this);

        // Spawn Player
        if (this.isShipMode) {
            this.player = new Player(this, 300, 500, true); // Ship mode
        } else {
            this.player = new Player(this, 300, 500, false);
        }

        // Level 3 space physics
        if (this.level === 3) {
            this.player.setGravityY(600);
            this.player.jumpForce = -750;
            this.player.jetpackThrust = -1500;
            this.player.maxJetpackFuel = 200;
        }

        // Audio
        this.bgMusic = this.sound.add(bgmKey, { volume: 0.5, loop: true });
        this.explosionSound = this.sound.add('explosion', { volume: 0.8 });

        // Ensure starting clean in case of restart
        this.sound.stopAll();
        this.bgMusic.play();

        // UI
        this.scoreText = this.add.text(16, 16, `Level: ${this.level} - Score: ${this.score}`, { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);
        this.scoreText.setDepth(100);

        // Jetpack/Hyperdrive UI
        const fuelLabel = this.isShipMode ? 'Hyper:' : 'Fuel:';
        this.add.text(16, 46, fuelLabel, { fontSize: '18px', fill: '#00bfff' }).setScrollFactor(0).setDepth(100);
        this.fuelBarBg = this.add.rectangle(75, 55, 100, 15, 0x555555).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
        this.fuelBar = this.add.rectangle(75, 55, 0, 15, 0x00bfff).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);

        // Level Progress UI
        const width = this.cameras.main.width;
        this.progressBg = this.add.rectangle(width / 2, 25, 180, 15, 0x444444).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);
        this.progressBar = this.add.rectangle(width / 2 - 90, 25, 0, 15, 0x00ff00).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
        this.progressText = this.add.text(width / 2, 25, '0%', { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);

        // Lava Graphic
        this.lava = this.add.image(300, this.lavaHeight, lavaTexture).setOrigin(0.5, 0).setDepth(50);
        this.physics.add.existing(this.lava);
        this.lava.body.setAllowGravity(false);
        this.lava.body.setImmovable(true);

        // Camera setup
        this.cameras.main.startFollow(this.player, true, 0, 0.1, 0, 100);

        // Allow up to 3 active pointers for multitouch
        this.input.addPointer(2);

        // Allow infinite upwards and downwards movement by disabling top/bottom world bounds
        this.physics.world.setBoundsCollision(true, true, false, false);

        // Collisions (skip platform colliders in ship mode)
        if (!this.isShipMode) {
            this.physics.add.collider(this.player, this.levelManager.platforms);
            this.physics.add.collider(this.player, this.levelManager.breakablePlatforms, this.hitBreakable, null, this);
            this.physics.add.collider(this.player, this.levelManager.movingPlatforms);
        }

        // Barrier collision
        this.physics.add.collider(this.player, this.levelManager.barriers, this.hitBarrier, null, this);

        // Deadly Collisions
        this.physics.add.overlap(this.player, this.lava, this.dieByLava, null, this);
        this.physics.add.overlap(this.player, this.levelManager.spikes, this.die, null, this);
        this.physics.add.overlap(this.player, this.levelManager.darts, this.die, null, this);
        if (!this.isShipMode) {
            this.physics.add.overlap(this.player, this.levelManager.enemies, this.pushPlayer, null, this);
        } else {
            this.physics.add.overlap(this.player, this.levelManager.enemies, this.die, null, this);
        }

        // Items & Exits
        this.physics.add.overlap(this.player, this.levelManager.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.levelManager.jetpacks, this.collectJetpack, null, this);
        this.physics.add.overlap(this.player, this.levelManager.shields, this.collectShield, null, this);
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

        // Level 2: dynamically shift background color from red to dark blue based on progress
        if (this.level === 2) {
            const r = Math.floor(255 * (1 - progress));
            const g = Math.floor(20 * progress);
            const b = Math.floor(51 + (204 * progress));
            const hex = (r << 16) | (g << 8) | b;
            this.cameras.main.setBackgroundColor(hex);
        }
    }

    hitBreakable(player, platform) {
        if (player.body.touching.down && platform.body.touching.up) {
            const px = platform.x;
            const py = platform.y;
            this.time.delayedCall(200, () => {
                platform.destroy();
                // Respawn as a solid platform after 3 seconds
                this.time.delayedCall(3000, () => {
                    let platTexture = 'platform';
                    if (this.level === 2) platTexture = 'plataforma2';
                    const newPlat = this.levelManager.platforms.create(px, py, platTexture);
                    newPlat.setDisplaySize(64, 16).refreshBody();
                    this.levelManager.makeOneWay(newPlat);
                    // Fade in effect
                    newPlat.setAlpha(0);
                    this.tweens.add({ targets: newPlat, alpha: 1, duration: 500 });
                }, [], this);
            }, [], this);
        }
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 500;
        this.updateScore();

        // Acorta el trayecto en un 5% por cada moneda
        const startY = 500;
        const totalDistance = startY - this.levelTargetY;
        this.levelTargetY += (totalDistance * 0.05);
        this.levelManager.targetY = this.levelTargetY;
    }

    collectJetpack(player, jetpack) {
        jetpack.destroy();
        // Give 50 fuel unit per collectible
        player.addJetpackFuel(50);

        // Visual feedback
        this.cameras.main.flash(200, 0, 191, 255); // Blue flash
    }

    collectShield(player, shield) {
        shield.destroy();
        player.activateShield();
        this.cameras.main.flash(200, 0, 255, 136); // Green flash
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
            if (this.level === 1) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev1', nextLevel: 2, score: totalScore,
                    title: 'ESCAPASTE DEL VOLCÁN',
                    desc: 'Has logrado salir a la\nsuperficie, pero la travesía\ncontinúa hacia los cielos...'
                });
            } else if (this.level === 2) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev2', nextLevel: 3, score: totalScore,
                    noText: true
                });
            } else if (this.level === 3) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev2', nextLevel: 4, score: totalScore,
                    title: '¡ABORDASTE LA NAVE!',
                    desc: 'El planeta explota detrás tuyo...\n¡Esquiva los escombros y\nescapa al hiperespacio!'
                });
            } else {
                this.scene.start('MainScene', { level: this.level + 1, score: totalScore });
            }
        }, [], this);
    }

    dieByLava() {
        // Lava ALWAYS kills, no shield can save you
        if (!this.player.active) return;
        this.player.removeShield();
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

    pushPlayer(player, enemy) {
        if (player.alpha < 1) return;

        // Visual feedback
        this.cameras.main.shake(200, 0.02);
        player.setAlpha(0.5);
        this.time.delayedCall(1000, () => {
            if (player.active) player.setAlpha(1);
        });

        // Push logic: bounce away from enemy
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);

        const pushForce = 600;
        player.setVelocity(Math.cos(angle) * pushForce, Math.sin(angle) * pushForce - 300);

        // Brief control lockout isn't strictly necessary but could add "impact"
    }

    hitBarrier(player, barrier) {
        // Visual feedback
        this.cameras.main.shake(200, 0.03);
        this.cameras.main.flash(100, 255, 0, 0); // Brief red flash

        // Ship mode: push back (downward in Y axis)
        // If ship mode is active, the ship is escaping 'up'
        if (this.isShipMode) {
            player.setVelocityY(400); // Strong push downward
            player.setAccelerationY(0); // Cancel current acceleration
        } else {
            // Unexpected case: barrier in platformer level
            player.setVelocityY(this.isShipMode ? 400 : 200);
        }
    }

    die() {
        // Shield absorbs one hit and gives brief invulnerability
        if (this.player.hasShield) {
            this.player.removeShield();
            this.cameras.main.shake(200, 0.02);
            // Brief invulnerability after shield break
            this.player.setAlpha(0.5);
            this.time.delayedCall(1500, () => {
                if (this.player.active) this.player.setAlpha(1);
            });
            return;
        }

        // If player is invulnerable (just lost shield), ignore
        if (this.player.alpha < 1) return;

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
