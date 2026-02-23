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

        this.chunkHeight = 400;
        this.lastChunkY = 300; // Start at y=300 to provide a safe zone for the spawn
        this.gameWidth = 400;
        this.targetY = scene.levelTargetY; // Imported from scene
        this.levelFinished = false;

        // Create starting floor (Safe zone)
        this.platforms.create(200, 580, 'platform').setScale(7, 2).refreshBody();
        // Safe starting platforms
        this.makeOneWay(this.platforms.create(100, 480, 'platform'));
        this.makeOneWay(this.platforms.create(300, 380, 'platform'));

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

        // Breakable logic (just collision detection handling in MainScene, this class just holds the physics groups)

        // Enemy logic (move horizontally)
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                if (!enemy.initialX) enemy.initialX = enemy.x;
                enemy.x = enemy.initialX + Math.sin(this.scene.time.now / 300 + enemy.initialX) * 50;
            }
        });
    }

    generateNextChunk() {
        if (this.levelFinished) return;

        const chunkTopY = this.lastChunkY - this.chunkHeight;

        // Check level end
        if (chunkTopY <= this.targetY) {
            this.levelFinished = true;
            // Spawn safe giant platform at the finish line
            const safeBase = this.platforms.create(200, this.targetY, 'platform').setScale(7, 2).refreshBody();
            this.makeOneWay(safeBase);
            // Spawn portal
            this.exits.create(200, this.targetY - 80, 'portal');
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

                const isBreakable = Phaser.Math.FloatBetween(0, 1) < (0.1 + difficulty * 0.05); // Increasing chance of breakable

                let platTexture = 'platform';
                if (this.scene.level === 2 || (this.scene.level % 2 === 0)) platTexture = 'plataforma2';

                let plat;
                if (isBreakable) {
                    plat = this.breakablePlatforms.create(x, y, 'platform_breakable');
                    plat.setDisplaySize(64, 16).refreshBody();
                } else {
                    plat = this.platforms.create(x, y, platTexture);
                    plat.setDisplaySize(64, 16).refreshBody();
                }
                this.makeOneWay(plat);

                // Add spikes sometimes
                let hasSpike = false;
                if (!isBreakable && Phaser.Math.FloatBetween(0, 1) < (0.02 + difficulty * 0.01)) {
                    this.spikes.create(x, y - 16, 'spike');
                    hasSpike = true;
                }

                if (!hasSpike) {
                    // Add coins sometimes
                    if (Phaser.Math.FloatBetween(0, 1) < 0.3) {
                        this.coins.create(x, y - 30, 'coin');
                    }

                    // Add jetpacks rarely (5% chance per platform)
                    if (Phaser.Math.FloatBetween(0, 1) < 0.05) {
                        this.jetpacks.create(x, y - 30, 'jetpack');
                    }
                }
            }

            // Add enemy occasionally (Not in Level 1)
            if (this.scene.level !== 1 && Phaser.Math.FloatBetween(0, 1) < (0.05 + difficulty * 0.05)) {
                const ex = Phaser.Math.Between(50, this.gameWidth - 50);
                const enemy = this.enemies.create(ex, y - 40, 'enemy');
                enemy.body.setSize(16, 16);
            }
        }

        // Add Dart traps on walls (every chunk occasionally, not in Level 1)
        if (this.scene.level !== 1 && Phaser.Math.FloatBetween(0, 1) < (0.2 + difficulty * 0.1)) {
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
