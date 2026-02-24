export default class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.platforms = scene.physics.add.staticGroup();
        this.breakablePlatforms = scene.physics.add.staticGroup();
        this.spikes = scene.physics.add.staticGroup();
        this.coins = scene.physics.add.group({ allowGravity: false });
        this.jetpacks = scene.physics.add.group({ allowGravity: false });
        this.enemies = scene.physics.add.group({ allowGravity: false });
        this.darts = scene.physics.add.group({ allowGravity: false });
        this.exits = scene.physics.add.staticGroup();
        this.movingPlatforms = scene.physics.add.group({ allowGravity: false });
        this.shields = scene.physics.add.group({ allowGravity: false });
        this.barriers = scene.physics.add.staticGroup();

        this.chunkHeight = 400;
        this.lastChunkY = 300;
        this.gameWidth = 600;
        this.targetY = scene.levelTargetY;
        this.lastPlatformX = 300; // Track last platform X for reachability
        this.levelFinished = false;
        this.isShipMode = (scene.level >= 4);

        if (!this.isShipMode) {
            // Platformer: Create starting floor
            this.platforms.create(300, 580, 'platform').setScale(10, 2).refreshBody();
            this.makeOneWay(this.platforms.create(150, 480, 'platform'));
            this.lastPlatformX = 450;
            this.makeOneWay(this.platforms.create(this.lastPlatformX, 380, 'platform'));
        }

        // Initial chunks
        this.generateNextChunk();
        this.generateNextChunk();
        this.generateNextChunk();

        // Level 4+: periodic spawners for debris and meteorites
        if (this.isShipMode) {
            // Debris rising from below every 1.5s
            scene.time.addEvent({
                delay: 1500,
                callback: () => this.spawnDebris(),
                loop: true
            });
            // Meteorites crossing laterally every 2s
            scene.time.addEvent({
                delay: 2000,
                callback: () => this.spawnMeteorite(),
                loop: true
            });
        }
    }

    makeOneWay(platform) {
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
        return platform;
    }

    spawnDebris() {
        const cam = this.scene.cameras.main;
        const x = Phaser.Math.Between(30, this.gameWidth - 30);
        const y = cam.scrollY + cam.height + 50; // Below screen
        const debris = this.darts.create(x, y, 'debris');
        debris.setVelocityY(Phaser.Math.Between(-350, -200)); // Rises upward
        debris.body.setAllowGravity(false);
        // Rotate the debris
        this.scene.tweens.add({
            targets: debris,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
    }

    spawnMeteorite() {
        const cam = this.scene.cameras.main;
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : this.gameWidth + 20;
        const y = Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height);
        const meteorite = this.darts.create(x, y, 'meteorite');
        meteorite.setVelocityX(fromLeft ? Phaser.Math.Between(150, 300) : Phaser.Math.Between(-300, -150));
        meteorite.setVelocityY(Phaser.Math.Between(-100, 100));
        meteorite.body.setAllowGravity(false);
    }

    update(cameraY) {
        if (this.lastChunkY > cameraY - 800) {
            this.generateNextChunk();
        }

        // Platforms now persist to allow recovery from falls
        // this.cleanup(this.platforms, cameraY);
        // this.cleanup(this.breakablePlatforms, cameraY);
        // this.cleanup(this.movingPlatforms, cameraY);

        this.cleanup(this.spikes, cameraY);
        this.cleanup(this.coins, cameraY);
        this.cleanup(this.jetpacks, cameraY);
        this.cleanup(this.enemies, cameraY);
        this.cleanup(this.darts, cameraY);
        this.cleanup(this.shields, cameraY);
        this.cleanup(this.barriers, cameraY);

        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                if (!enemy.initialX) enemy.initialX = enemy.x;
                enemy.x = enemy.initialX + Math.sin(this.scene.time.now / 300 + enemy.initialX) * 50;
            }
        });

        this.movingPlatforms.children.iterate((plat) => {
            if (plat && plat.active) {
                if (!plat.initialX) plat.initialX = plat.x;
                plat.x = plat.initialX + Math.sin(this.scene.time.now / 1000 + plat.initialX) * 80;
            }
        });
    }

    generateNextChunk() {
        if (this.levelFinished) return;
        const chunkTopY = this.lastChunkY - this.chunkHeight;

        if (chunkTopY <= this.targetY) {
            this.levelFinished = true;
            if (!this.isShipMode) {
                let platTexture = 'platform';
                if (this.scene.level === 2) platTexture = 'plataforma2';

                let bridgeY = this.lastChunkY - 80;
                while (bridgeY > this.targetY + 60) {
                    const bx = Phaser.Math.Between(60, this.gameWidth - 60);
                    const bp = this.platforms.create(bx, bridgeY, platTexture);
                    bp.setDisplaySize(64, 16).refreshBody();
                    this.makeOneWay(bp);
                    bridgeY -= Phaser.Math.Between(60, 90);
                }
                const safeBase = this.platforms.create(300, this.targetY, 'platform').setScale(10, 2).refreshBody();
                this.makeOneWay(safeBase);
            }
            this.exits.create(300, this.targetY - 80, 'portal');
            this.lastChunkY = this.targetY;
            return;
        }

        if (this.isShipMode) {
            this.generateShipChunk(chunkTopY);
        } else {
            this.generatePlatformChunk(chunkTopY);
        }
        this.lastChunkY = chunkTopY;
    }

    generateShipChunk(chunkTopY) {
        const difficulty = Math.max(1, Math.min(10, Math.floor(Math.abs(chunkTopY) / 1000) + 1));
        const numCoins = Phaser.Math.Between(2, 4);
        for (let i = 0; i < numCoins; i++) {
            const cx = Phaser.Math.Between(40, this.gameWidth - 40);
            const cy = Phaser.Math.Between(chunkTopY, this.lastChunkY - 40);
            this.coins.create(cx, cy, 'coin');
        }

        if (Phaser.Math.FloatBetween(0, 1) < 0.08) {
            const sx = Phaser.Math.Between(60, this.gameWidth - 60);
            const sy = Phaser.Math.Between(chunkTopY + 50, this.lastChunkY - 50);
            this.shields.create(sx, sy, 'shield');
        }

        if (Phaser.Math.FloatBetween(0, 1) < (0.1 + difficulty * 0.05)) {
            const ux = Phaser.Math.Between(50, this.gameWidth - 50);
            const uy = Phaser.Math.Between(chunkTopY + 30, this.lastChunkY - 30);
            const ufo = this.enemies.create(ux, uy, 'ufo');
            ufo.body.setSize(20, 12);
        }

        // Level 5+: Barriers with a 15% gap
        if (this.scene.level >= 5 && Phaser.Math.FloatBetween(0, 1) < 0.5) {
            const gapWidth = this.gameWidth * 0.15;
            const gapStart = Phaser.Math.Between(20, this.gameWidth - gapWidth - 20);
            const gapEnd = gapStart + gapWidth;
            const y = chunkTopY + 200;

            // Left part
            if (gapStart > 0) {
                const bLeft = this.barriers.create(gapStart / 2, y, 'barrier');
                bLeft.setDisplaySize(gapStart, 32).refreshBody();
            }

            // Right part
            const rightWidth = this.gameWidth - gapEnd;
            if (rightWidth > 0) {
                const bRight = this.barriers.create(gapEnd + rightWidth / 2, y, 'barrier');
                bRight.setDisplaySize(rightWidth, 32).refreshBody();
            }
        }
    }

    generatePlatformChunk(chunkTopY) {
        const difficulty = Math.max(1, Math.min(10, Math.floor(Math.abs(chunkTopY) / 1000) + 1));
        let minGap = 80;
        let maxGap = 110;

        if (this.scene.level === 1) {
            minGap = 60;
            maxGap = 80;
        } else if (this.scene.level === 2) {
            minGap = 70;
            maxGap = 90;
        }

        for (let y = this.lastChunkY - minGap; y >= chunkTopY; y -= Phaser.Math.Between(minGap, maxGap)) {
            const numPlatforms = (this.scene.level === 2) ? 1 : Phaser.Math.Between(1, 2);
            let rowX = this.lastPlatformX;
            for (let i = 0; i < numPlatforms; i++) {
                let x;
                if (this.scene.level === 2) {
                    // Guarantee reachability by constraining horizontal distance
                    const maxJumpDist = 160;
                    const minX = Math.max(40, this.lastPlatformX - maxJumpDist);
                    const maxX = Math.min(this.gameWidth - 40, this.lastPlatformX + maxJumpDist);
                    x = Phaser.Math.Between(minX, maxX);
                } else {
                    x = Phaser.Math.Between(40, this.gameWidth - 40);
                }
                rowX = x;

                const isBreakable = this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.1 + difficulty * 0.05);
                let platTexture = 'platform';
                if (this.scene.level === 2) platTexture = 'plataforma2';

                let plat;
                if (this.scene.level === 3 && Phaser.Math.FloatBetween(0, 1) < 0.35) {
                    plat = this.movingPlatforms.create(x, y, platTexture);
                    plat.setDisplaySize(64, 16);
                    plat.body.setAllowGravity(false);
                    plat.body.setImmovable(true);
                    plat.body.setSize(64, 16);
                } else if (isBreakable) {
                    plat = this.breakablePlatforms.create(x, y, 'platform_breakable');
                    plat.setDisplaySize(64, 16).refreshBody();
                } else {
                    plat = this.platforms.create(x, y, platTexture);
                    plat.setDisplaySize(64, 16).refreshBody();
                }
                this.makeOneWay(plat);

                let hasSpike = false;
                if (this.scene.level !== 1 && this.scene.level !== 3 && !isBreakable && Phaser.Math.FloatBetween(0, 1) < (0.02 + difficulty * 0.01)) {
                    this.spikes.create(x, y - 16, 'spike');
                    hasSpike = true;
                }

                if (!hasSpike) {
                    if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
                        this.coins.create(x, y - 30, 'coin');
                    }
                    const jetpackChance = 0.08; // Balanced chance for all levels
                    if (Phaser.Math.FloatBetween(0, 1) < jetpackChance) {
                        this.jetpacks.create(x, y - 30, 'jetpack');
                    }
                    const shieldChance = 0.06; // Now available in levels 1, 2, and 3
                    if (Phaser.Math.FloatBetween(0, 1) < shieldChance) {
                        this.shields.create(x, y - 30, 'shield');
                    }
                }
            }

            if (this.scene.level !== 1 && this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.05 + difficulty * 0.05)) {
                const ex = Phaser.Math.Between(50, this.gameWidth - 50);
                const enemy = this.enemies.create(ex, y - 40, 'enemy');
                enemy.body.setSize(16, 16);
            }
            this.lastPlatformX = rowX;
        }

        if (this.scene.level !== 1 && this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.2 + Math.min(10, Math.floor(Math.abs(chunkTopY) / 1000) + 1) * 0.1)) {
            const isLeft = Math.random() < 0.5;
            const y = Phaser.Math.Between(chunkTopY, this.lastChunkY - 100);
            this.scene.time.addEvent({
                delay: 2000,
                callback: () => {
                    const dart = this.darts.create(isLeft ? 10 : this.gameWidth - 10, y, 'dart');
                    if (dart) dart.setVelocityX(isLeft ? 200 : -200);
                },
                loop: true
            });
        }
    }

    cleanup(group, cameraY) {
        group.children.iterate((child) => {
            if (child && child.y > cameraY + 800) {
                child.destroy();
            }
        });
    }
}