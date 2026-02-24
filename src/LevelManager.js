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
        this.bullets = scene.physics.add.group({ allowGravity: false });
        this.ammoCrates = scene.physics.add.group({ allowGravity: false });
        this.movingBarriers = scene.physics.add.group({ allowGravity: false, immovable: true });
        this.lethalEdges = scene.physics.add.group({ allowGravity: false, immovable: true });

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
        this.cleanup(this.bullets, cameraY);
        this.cleanup(this.ammoCrates, cameraY);
        this.cleanup(this.movingBarriers, cameraY);
        this.cleanup(this.lethalEdges, cameraY);

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

        // Moving Barriers and Lethal Edges logic
        if (this.scene.level >= 7) {
            const time = this.scene.time.now;
            const drift = Math.sin(time / 1500) * 60; // Slower and less range

            this.movingBarriers.children.iterate((barrier) => {
                if (barrier && barrier.active) {
                    const newX = barrier.initialX + drift;
                    barrier.x = newX;
                    if (barrier.body) {
                        barrier.body.reset(barrier.x, barrier.y);
                    }
                }
            });

            this.lethalEdges.children.iterate((edge) => {
                if (edge && edge.active) {
                    const newX = edge.initialX + drift;
                    edge.x = newX;
                    if (edge.body) {
                        edge.body.reset(edge.x, edge.y);
                    }
                }
            });
        }
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

        const hyperdriveChance = (this.scene.level >= 5) ? 0.15 : 0.07;
        if (Phaser.Math.FloatBetween(0, 1) < hyperdriveChance) {
            const hx = Phaser.Math.Between(60, this.gameWidth - 60);
            const hy = Phaser.Math.Between(chunkTopY + 50, this.lastChunkY - 50);
            this.jetpacks.create(hx, hy, 'hyperdrive');
        }

        // Ammo crates - increased spawn
        const ammoChance = (this.scene.level >= 5) ? 0.2 : 0.1;
        if (this.scene.level >= 5 && Phaser.Math.FloatBetween(0, 1) < ammoChance) {
            const ax = Phaser.Math.Between(60, this.gameWidth - 60);
            const ay = Phaser.Math.Between(chunkTopY + 50, this.lastChunkY - 50);
            this.ammoCrates.create(ax, ay, 'ammo');
        }

        // Shields in ship mode - increased spawn
        const shieldChance = (this.scene.level >= 5) ? 0.15 : 0.08;
        if (Phaser.Math.FloatBetween(0, 1) < shieldChance) {
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

        // Barrier generation logic
        if (this.scene.level >= 5 && Phaser.Math.Between(0, 100) < 65) {
            const level = this.scene.level;
            const gapWidth = this.gameWidth * 0.20; // Increased to 20%
            const margin = 80; // Safe distance from walls for the hole
            const gapStart = Phaser.Math.Between(margin, this.gameWidth - gapWidth - margin);
            const gapEnd = gapStart + gapWidth;
            const y = chunkTopY + 200;

            const isIndestructible = (level >= 6);
            const texture = isIndestructible ? 'barrier_indestructible' : 'barrier';
            const group = (level >= 7) ? this.movingBarriers : this.barriers;

            // Left segment (Sliding Door)
            const bLeft = group.create(gapStart - 300, y, texture);
            bLeft.setDisplaySize(600, 32);
            if (group === this.barriers) bLeft.refreshBody();
            bLeft.isIndestructible = isIndestructible;
            if (level >= 7) {
                bLeft.isMoving = true;
                bLeft.initialX = gapStart - 300;
                bLeft.type = 'left';
            }

            // Right segment (Sliding Door)
            const bRight = group.create(gapEnd + 300, y, texture);
            bRight.setDisplaySize(600, 32);
            if (group === this.barriers) bRight.refreshBody();
            bRight.isIndestructible = isIndestructible;
            if (level >= 7) {
                bRight.isMoving = true;
                bRight.initialX = gapEnd + 300;
                bRight.type = 'right';
            }

            // Lethal edges (Level 8+)
            if (level >= 8) {
                const laserLeft = this.lethalEdges.create(gapStart, y, 'laser_edge');
                laserLeft.setDisplaySize(8, 32);
                laserLeft.initialX = gapStart;

                const laserRight = this.lethalEdges.create(gapEnd, y, 'laser_edge');
                laserRight.setDisplaySize(8, 32);
                laserRight.initialX = gapEnd;
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

    fireBullet(x, y) {
        const bullet = this.bullets.create(x, y, 'bullet');
        if (bullet) {
            bullet.setVelocityY(-800);
            bullet.body.setAllowGravity(false);
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