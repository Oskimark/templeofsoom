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

        // Music selection
        const shipMusic = [
            'music_horizon1', 'music_horizon2', 'music_quantum1',
            'music_quantum2', 'music_collapse', 'music_overload'
        ];

        let bgmKey = 'music_tribal'; // Default for level 1
        if (this.level > 1) {
            bgmKey = shipMusic[(this.level - 2) % shipMusic.length];
        }

        let lavaTexture = 'lava';

        if (this.level === 1) {
            this.cameras.main.setBackgroundColor('#3e2723'); // Dark brown/earthy
        } else if (this.level === 2) {
            this.cameras.main.setBackgroundColor('#ff4500');
        } else if (this.level === 3) {
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
        let baseLavaSpeed = 40 + (this.level * 8);
        if (this.level === 9) baseLavaSpeed *= 2; // Doubled for Level 9
        this.lavaSpeed = baseLavaSpeed;

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

        // Ammo UI
        this.ammoText = this.add.text(190, 46, `Ammo: ${this.player.ammo}`, { fontSize: '18px', fill: '#ffff00' }).setScrollFactor(0).setDepth(100);

        // Level Progress UI
        const width = this.cameras.main.width;
        this.progressBg = this.add.rectangle(width / 2, 25, 180, 15, 0x444444).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);
        this.progressBar = this.add.rectangle(width / 2 - 90, 25, 0, 15, 0x00ff00).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
        this.progressText = this.add.text(width / 2, 25, '0%', { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(100);

        // Lava Graphic
        this.lava = this.add.image(300, this.lavaHeight, lavaTexture).setOrigin(0.5, 0).setDepth(50);
        this.physics.add.existing(this.lava);
        this.lava.body.setAllowGravity(false);
        this.lava.body.setAllowGravity(false);
        this.lava.body.setImmovable(true);

        // Level 9 Surge Logic Initialization
        if (this.level === 9) {
            this.baseLavaSpeed = this.lavaSpeed;
            this.surgeActive = false;
            this.warningActive = false;
            this.levelTimer = 0;
            this.nextSurgeTime = 12000; // First surge after 12s

            this.warningGlow = this.add.image(width / 2, 300, 'warning_glow').setScrollFactor(0).setDepth(150).setAlpha(0);
        }

        // Timer initialization
        this.elapsedTime = 0;
        this.isTimerRunning = true;
        this.timerText = this.add.text(width - 16, 16, '00:00.000', {
            fontSize: '20px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

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
        this.physics.add.collider(this.player, this.levelManager.movingBarriers, this.hitBarrier, null, this);

        // Lethal edges (Level 8+)
        this.physics.add.overlap(this.player, this.levelManager.lethalEdges, this.die, null, this);

        // Deadly Collisions
        this.physics.add.overlap(this.player, this.lava, this.dieByLava, null, this);
        this.physics.add.overlap(this.player, this.levelManager.spikes, this.die, null, this);
        this.physics.add.overlap(this.player, this.levelManager.darts, this.die, null, this);
        if (!this.isShipMode) {
            this.physics.add.overlap(this.player, this.levelManager.enemies, this.pushPlayer, null, this);
        } else {
            this.physics.add.overlap(this.player, this.levelManager.enemies, this.die, null, this);
        }

        // Enemies vs Lethal edges
        this.physics.add.overlap(this.levelManager.enemies, this.levelManager.lethalEdges, (enemy, edge) => {
            if (enemy.active) {
                this.explodeEnemy(enemy);
            }
        }, null, this);

        // Enemies vs Barriers (Level 5+)
        if (this.level >= 5) {
            this.physics.add.collider(this.levelManager.enemies, [this.levelManager.barriers, this.levelManager.movingBarriers], (enemy, barrier) => {
                if (enemy.active && enemy.isPursuing) {
                    this.explodeEnemy(enemy);
                }
            }, null, this);
        }

        // Enemies vs Meteorites
        this.physics.add.overlap(this.levelManager.enemies, this.levelManager.darts, (enemy, dart) => {
            if (enemy.active && dart.texture.key === 'meteorite') {
                this.explodeEnemy(enemy);
                dart.destroy();
            }
        }, null, this);

        // Bullet collisions
        this.physics.add.overlap(this.levelManager.bullets, [this.levelManager.barriers, this.levelManager.movingBarriers], (bullet, barrier) => {
            bullet.destroy();
            if (!barrier.isIndestructible) {
                barrier.destroy();
            }
        }, null, this);
        this.physics.add.overlap(this.levelManager.bullets, this.levelManager.enemies, (bullet, enemy) => {
            bullet.destroy();
            enemy.destroy();
        }, null, this);
        this.physics.add.overlap(this.levelManager.bullets, this.levelManager.darts, (bullet, dart) => {
            bullet.destroy();
            dart.destroy();
        }, null, this);
        this.physics.add.overlap(this.levelManager.bullets, this.levelManager.breakablePlatforms, (bullet, plat) => {
            bullet.destroy();
            plat.destroy();
        }, null, this);

        // Meteorite vs Barrier
        this.physics.add.overlap(this.levelManager.darts, [this.levelManager.barriers, this.levelManager.movingBarriers], (dart, barrier) => {
            if (dart.texture.key === 'meteorite') {
                dart.destroy();
                if (!barrier.isIndestructible) {
                    barrier.destroy();
                }
            }
        }, null, this);

        // Items & Exits
        this.physics.add.overlap(this.player, this.levelManager.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.levelManager.jetpacks, this.collectJetpack, null, this);
        this.physics.add.overlap(this.player, this.levelManager.shields, this.collectShield, null, this);
        this.physics.add.overlap(this.player, this.levelManager.ammoCrates, this.collectAmmo, null, this);
        this.physics.add.overlap(this.player, this.levelManager.exits, this.finishLevel, null, this);
        this.physics.add.overlap(this.player, this.levelManager.electricBeams, this.die, null, this);
    }

    update(time, delta) {
        if (!this.player.active) return;

        this.player.update(time, delta);
        this.levelManager.update(this.cameras.main.scrollY, delta);

        // Calculate score based on height
        const currentHeightScore = Math.floor(Math.abs(Math.min(0, this.player.y - 600)));
        if (currentHeightScore > this.maxHeight) {
            this.maxHeight = currentHeightScore;
            this.updateScore(this.maxHeight);
        }

        // Lava logic
        if (this.level === 9) {
            this.levelTimer += delta;

            // Check for Surge Warning
            if (!this.surgeActive && !this.warningActive && this.levelTimer >= this.nextSurgeTime - 3000) {
                this.warningActive = true;
                this.tweens.add({
                    targets: this.warningGlow,
                    alpha: { from: 0, to: 0.6 },
                    duration: 500,
                    yoyo: true,
                    repeat: 4
                });
            }

            // Start Surge
            if (!this.surgeActive && this.levelTimer >= this.nextSurgeTime) {
                this.surgeActive = true;
                this.warningActive = false;
                this.lavaSpeed = this.baseLavaSpeed * 2.5; // Slower growth
                this.warningGlow.setAlpha(0.6).setTint(0xffaa00);

                this.time.delayedCall(4000, () => {
                    this.surgeActive = false;
                    this.lavaSpeed = this.baseLavaSpeed;
                    this.warningGlow.setAlpha(0);
                    this.nextSurgeTime = this.levelTimer + 7000; // More frequent (7s interval)
                });
            }
        }

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

        // Update Ammo UI
        this.ammoText.setText(`Ammo: ${this.player.ammo}`);

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

        // Update Timer
        if (this.isTimerRunning) {
            this.elapsedTime += delta;
            this.timerText.setText(this.formatTime(this.elapsedTime));
        }
    }

    formatTime(ms) {
        let milliseconds = Math.floor(ms % 1000);
        let seconds = Math.floor((ms / 1000) % 60);
        let minutes = Math.floor((ms / (1000 * 60)) % 60);

        const minutesStr = minutes.toString().padStart(2, '0');
        const secondsStr = seconds.toString().padStart(2, '0');
        const msStr = milliseconds.toString().padStart(3, '0');

        return `${minutesStr}:${secondsStr}.${msStr}`;
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
    }

    collectAmmo(player, ammo) {
        ammo.destroy();
        player.ammo += 2;
        this.score += 50;
        this.cameras.main.flash(200, 0, 255, 136); // Green flash
    }

    updateScore(add = 0) {
        // Calculate total score = maxHeight + collected items
        const total = this.maxHeight + this.score;
        this.scoreText.setText(`Level: ${this.level} - Score: ${total}`);
    }

    finishLevel() {
        this.isTimerRunning = false;
        this.player.setActive(false).setVisible(false);
        this.physics.pause();
        this.bgMusic.stop();
        this.cameras.main.flash(500, 255, 255, 255);
        this.time.delayedCall(1000, () => {
            const totalScore = this.maxHeight + this.score;
            const timeData = { levelTime: this.elapsedTime, formattedTime: this.formatTime(this.elapsedTime) };
            if (this.level === 1) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev1', nextLevel: 2, score: totalScore,
                    title: 'ESCAPASTE DEL VOLCÁN',
                    desc: 'Has logrado salir a la\nsuperficie, pero la travesía\ncontinúa hacia los cielos...',
                    ...timeData
                });
            } else if (this.level === 2) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev2', nextLevel: 3, score: totalScore,
                    noText: true,
                    ...timeData
                });
            } else if (this.level === 3) {
                this.scene.start('StoryScene', {
                    storyKey: 'lev2', nextLevel: 4, score: totalScore,
                    title: '¡ABORDASTE LA NAVE!',
                    desc: 'El planeta explota detrás tuyo...\n¡Esquiva los escombros y\nescapa al hiperespacio!',
                    ...timeData
                });
            } else if (this.level === 4) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 5, score: totalScore,
                    title: 'PROFUNDIDADES',
                    desc: 'Te adentras en el Abismo...\nEsquiva las barreras y\nsobrevive al caos.',
                    ...timeData
                });
            } else if (this.level === 5) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 6, score: totalScore,
                    title: 'INFRANQUEABLE',
                    desc: 'Las barreras ahora son más\ngruesas y duras...\n¡No intentes dispararles!',
                    ...timeData
                });
            } else if (this.level === 6) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 7, score: totalScore,
                    title: 'ECO DEL ABISMO',
                    desc: 'El espacio se retuerce...\nLas aberturas no se quedan\nquietas. ¡Apunta bien!',
                    ...timeData
                });
            } else if (this.level === 7) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 8, score: totalScore,
                    title: 'EL FOSO FINAL',
                    desc: 'Los bordes brillan de rojo...\nUn roce significa la muerte.\n¡Precisión absoluta!',
                    ...timeData
                });
            } else if (this.level === 8) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 9, score: totalScore,
                    title: 'FUGA DESESPERADA',
                    desc: '¡la onda expansiva se acerca!\nesto causa empujones al borde de plasma.\n¡Cuando todo se ponga amarillo, vuela más rápido que nunca!',
                    ...timeData
                });
            } else if (this.level === 9) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 10, score: totalScore,
                    title: 'VOLTAJE CRÍTICO',
                    desc: 'El sistema está en corto...\nRayos de plasma cierran el paso.\n¡Calcula bien el tiempo!',
                    ...timeData
                });
            } else if (this.level === 10) {
                this.scene.start('StoryScene', {
                    storyKey: 'levsh', nextLevel: 11, score: totalScore,
                    title: 'PERSECUCIÓN',
                    desc: 'Los radares detectan OVNIs...\n¡Se acercan por detrás!\nUsa el auto-apuntado para\nsobrevivir a la cacería.',
                    ...timeData
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
            this.scene.start('GameOverScene', {
                score: totalScore,
                level: this.level,
                levelTime: this.elapsedTime,
                formattedTime: this.formatTime(this.elapsedTime)
            });
        }, [], this);
    }

    pushPlayer(player, enemy) {
        if (player.alpha < 1) return;

        // Level 11 UFOs are lethal
        if (this.level >= 11 && enemy.texture.key === 'ufo') {
            this.die();
            return;
        }

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

    explodeEnemy(enemy) {
        if (!enemy.active) return;
        this.explosionSound.play();
        const boom = this.add.sprite(enemy.x, enemy.y, enemy.texture.key).setTint(0xff0000);
        this.tweens.add({
            targets: boom,
            alpha: 0,
            scale: 2,
            duration: 500,
            onComplete: () => boom.destroy()
        });

        // Reward: Goal 10% closer if it's a UFO
        if (enemy.texture.key === 'ufo') {
            const totalLength = 4000 + (this.level * 2000);
            const reduction = totalLength * 0.10;
            this.levelTargetY += reduction;
            // Prevent goal from moving below player's current height significantly
            this.levelTargetY = Math.min(this.levelTargetY, this.player.y - 1000);
            this.levelManager.updateTargetY(this.levelTargetY);

            // Visual feedback for reward
            const rewardText = this.add.text(enemy.x, enemy.y, '¡META +10%!', { fontSize: '24px', fill: '#00ff00', fontStyle: 'bold' });
            this.tweens.add({
                targets: rewardText,
                y: rewardText.y - 100,
                alpha: 0,
                duration: 1000,
                onComplete: () => rewardText.destroy()
            });
        }

        enemy.destroy();
    }

    hitBarrier(player, barrier) {
        // If player has a shield, they can break through! (Only for destructible barriers)
        if (player.hasShield) {
            this.cameras.main.shake(100, 0.02);
            player.removeShield();
            if (!barrier.isIndestructible) {
                barrier.destroy();
            }
            return;
        }

        // Only cause bounce if impact is from below (one-way)
        // Since the ship escapes 'up', impact from below means player.y > barrier.y
        if (player.y > barrier.y) {
            this.cameras.main.shake(200, 0.03);
            this.cameras.main.flash(100, 255, 0, 0);

            if (this.isShipMode) {
                player.setVelocityY(400);
                player.setAccelerationY(0);
            } else {
                player.setVelocityY(200);
            }
        }
    }

    die() {
        // Shield absorbs one hit and gives brief invulnerability
        if (this.player.hasShield) {
            this.player.removeShield();
            this.cameras.main.shake(200, 0.02);
            // Brief invulnerability after shield break
            this.player.setAlpha(0.5);
            // Small bounce to push away from lethal source
            this.player.setVelocityY(this.player.body.velocity.y > 0 ? -300 : 300);
            this.player.setVelocityX(this.player.x < 300 ? 200 : -200);

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
            this.scene.start('GameOverScene', {
                score: totalScore,
                level: this.level,
                levelTime: this.elapsedTime,
                formattedTime: this.formatTime(this.elapsedTime)
            });
        }, [], this);
    }
}
