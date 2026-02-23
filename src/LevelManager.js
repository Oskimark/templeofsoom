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
        this.exits = scene.physics.add.staticGroup(); // Win conditions
        this.movingPlatforms = scene.physics.add.group({ allowGravity: false }); // Level 3 moving platforms
        this.shields = scene.physics.add.group({ allowGravity: false }); // Shield items

        this.chunkHeight = 400;
        this.lastChunkY = 300; // Start at y=300 to provide a safe zone for the spawn
        this.gameWidth = 600;
        this.targetY = scene.levelTargetY; // Imported from scene
        this.levelFinished = false;

        // Create starting floor (Safe zone)
        this.platforms.create(300, 580, 'platform').setScale(10, 2).refreshBody();
        // Safe starting platforms
        this.makeOneWay(this.platforms.create(150, 480, 'platform'));
        this.makeOneWay(this.platforms.create(450, 380, 'platform'));

        // Initial chunks
        this.generateNextChunk();
        this.generateNextChunk();
        this.generateNextChunk();
    }

    makeOneWay(platform) {
        platform.body.checkCollision.down = false;
        platform.body.checkCollision.left = false;
        platform.body.checkCollision.right = false;
        return platform;
    }

    update(cameraY) {
        // If camera has moved up enough, generate new chunk above
        if (this.lastChunkY > cameraY - 800) {
            this.generateNextChunk();
        }

        // Object Recycling (Pool strategy alternative: delete out-of-screen old objects)
        this.cleanup(this.platforms, cameraY);
        this.cleanup(this.breakablePlatforms, cameraY);
        this.cleanup(this.spikes, cameraY);
        this.cleanup(this.coins, cameraY);
        this.cleanup(this.jetpacks, cameraY);
        this.cleanup(this.enemies, cameraY);
        this.cleanup(this.darts, cameraY);
        this.cleanup(this.shields, cameraY);

        // Breakable logic (just collision detection handling in MainScene, this class just holds the physics groups)

        // Enemy logic (move horizontally)
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                if (!enemy.initialX) enemy.initialX = enemy.x;
                enemy.x = enemy.initialX + Math.sin(this.scene.time.now / 300 + enemy.initialX) * 50;
            }
        });

        // Moving platforms logic (Level 3)
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

        // Check level end
        if (chunkTopY <= this.targetY) {
            this.levelFinished = true;

            // Add bridging platforms from lastChunkY up to targetY so the portal is always reachable
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

            // Spawn safe giant platform at the finish line
            const safeBase = this.platforms.create(300, this.targetY, 'platform').setScale(10, 2).refreshBody();
            this.makeOneWay(safeBase);
            // Spawn portal
            this.exits.create(300, this.targetY - 80, 'portal');
            this.lastChunkY = this.targetY;
            return;
        }

        // Decide difficulty based on height (lower Y = higher altitude)
        const difficulty = Math.max(1, Math.min(10, Math.floor(Math.abs(chunkTopY) / 1000) + 1));

        let minGap = 80;
        let maxGap = 110;
        if (this.scene.level === 1) {
            minGap = 60;
            maxGap = 80;
        }

        // Platform generation
        for (let y = this.lastChunkY - minGap; y >= chunkTopY; y -= Phaser.Math.Between(minGap, maxGap)) {
            // How many platforms in this row? (1 or 2)
            const numPlatforms = Phaser.Math.Between(1, 2);
            for (let i = 0; i < numPlatforms; i++) {
                const x = Phaser.Math.Between(40, this.gameWidth - 40);

                const isBreakable = this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.1 + difficulty * 0.05);

                // Choose texture per level
                let platTexture = 'platform';
                if (this.scene.level === 2) platTexture = 'plataforma2';
                if (this.scene.level === 3) platTexture = 'platform'; // Space uses default

                let plat;
                if (this.scene.level === 3 && Phaser.Math.FloatBetween(0, 1) < 0.35) {
                    // Moving platform in Level 3
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

                // Add spikes sometimes (NOT in Level 1 or Level 3)
                let hasSpike = false;
                if (this.scene.level !== 1 && this.scene.level !== 3 && !isBreakable && Phaser.Math.FloatBetween(0, 1) < (0.02 + difficulty * 0.01)) {
                    this.spikes.create(x, y - 16, 'spike');
                    hasSpike = true;
                }

                if (!hasSpike) {
                    // Add coins sometimes
                    if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
                        this.coins.create(x, y - 30, 'coin');
                    }

                    // Add jetpacks rarely (5% chance, 8% in space)
                    const jetpackChance = this.scene.level === 3 ? 0.08 : 0.05;
                    if (Phaser.Math.FloatBetween(0, 1) < jetpackChance) {
                        this.jetpacks.create(x, y - 30, 'jetpack');
                    }

                    // Add shields in Level 3 (6% chance)
                    if (this.scene.level >= 3 && Phaser.Math.FloatBetween(0, 1) < 0.06) {
                        this.shields.create(x, y - 30, 'shield');
                    }
                }
            }

            // Add enemy occasionally (Not in Level 1 or Level 3)
            if (this.scene.level !== 1 && this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.05 + difficulty * 0.05)) {
                const ex = Phaser.Math.Between(50, this.gameWidth - 50);
                const enemy = this.enemies.create(ex, y - 40, 'enemy');
                enemy.body.setSize(16, 16);
            }
        }

        // Add Dart traps on walls (not in Level 1 or Level 3)
        if (this.scene.level !== 1 && this.scene.level !== 3 && Phaser.Math.FloatBetween(0, 1) < (0.2 + difficulty * 0.1)) {
            const isLeft = Math.random() < 0.5;
            const y = Phaser.Math.Between(chunkTopY, this.lastChunkY - 100);
            const dartTimer = this.scene.time.addEvent({
                delay: 2000,
                callback: () => {
                    const dart = this.darts.create(isLeft ? 10 : this.gameWidth - 10, y, 'dart');
                    dart.setVelocityX(isLeft ? 200 : -200);
                },
                loop: true
            });
        }

        this.lastChunkY = chunkTopY;
    }

    cleanup(group, cameraY) {
        group.children.iterate((child) => {
            if (child && child.y > cameraY + 800) {
                child.destroy();
            }
        });
    }
}
