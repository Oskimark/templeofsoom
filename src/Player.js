export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, isShipMode = false) {
        const texture = isShipMode ? 'ship' : 'player';
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.isShipMode = isShipMode;
        this.setCollideWorldBounds(true);

        if (isShipMode) {
            // Ship mode: no gravity, free movement
            this.setGravityY(-1000); // Cancel world gravity
            this.setDragX(800);
            this.setDrag(800);
            this.setMaxVelocity(350, 500);
            this.moveSpeed = 350;
        } else {
            // Platformer mode
            this.setGravityY(1200);
            this.setDragX(1500);
            this.setMaxVelocity(300, 800);
            this.moveSpeed = 250;
        }

        this.coyoteTime = 0;
        this.jumpsLeft = 2;
        this.maxJumps = 2;
        this.jumpForce = -650;

        // Jetpack / Hyperdrive properties
        this.jetpackFuel = 0;
        this.maxJetpackFuel = isShipMode ? 150 : 100;
        this.jetpackThrust = -2500;

        // Shield
        this.hasShield = false;
        this.shieldGraphic = null;

        // Keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Mobile Controls setup
        this.virtualLeft = false;
        this.virtualRight = false;
        this.virtualUp = false;
        this.virtualDown = false;
        this.virtualJump = false;
        this.virtualJumpJustDown = false;
        this.virtualJumpJustReleased = false;

        if (!scene.sys.game.device.os.desktop && scene.sys.game.device.input.touch) {
            this.createMobileControls(scene);
        }
    }

    createMobileControls(scene) {
        const uiDepth = 1000;

        // Joystick Base
        this.joyBase = scene.add.circle(90, 520, 60, 0xffffff, 0.2)
            .setScrollFactor(0).setDepth(uiDepth).setInteractive();

        // Joystick Thumb
        this.joyThumb = scene.add.circle(90, 520, 30, 0xffffff, 0.5)
            .setScrollFactor(0).setDepth(uiDepth);

        let activeJoystickPointer = null;

        this.joyBase.on('pointerdown', (pointer) => {
            activeJoystickPointer = pointer;
            this.updateJoystick(pointer);
        });

        scene.input.on('pointermove', (pointer) => {
            if (pointer === activeJoystickPointer && pointer.isDown) {
                this.updateJoystick(pointer);
            }
        });

        const resetJoystick = (pointer) => {
            if (pointer === activeJoystickPointer || !activeJoystickPointer) {
                activeJoystickPointer = null;
                this.joyThumb.setPosition(90, 520);
                this.virtualLeft = false;
                this.virtualRight = false;
                this.virtualUp = false;
                this.virtualDown = false;
            }
        };

        scene.input.on('pointerup', resetJoystick);

        // Jump/Action Button
        this.btnJump = scene.add.image(350, 520, 'btn_base')
            .setScrollFactor(0).setDepth(uiDepth).setInteractive();

        this.btnJump.on('pointerdown', () => {
            this.virtualJump = true;
            this.virtualJumpJustDown = true;
        });
        this.btnJump.on('pointerup', () => {
            this.virtualJump = false;
            this.virtualJumpJustReleased = true;
        });
        this.btnJump.on('pointerout', () => {
            this.virtualJump = false;
            this.virtualJumpJustReleased = true;
        });
    }

    updateJoystick(pointer) {
        const baseX = 90;
        const baseY = 520;
        const maxRadius = 60;

        let dx = pointer.x - baseX;
        let dy = pointer.y - baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxRadius;
            dy = Math.sin(angle) * maxRadius;
        }

        this.joyThumb.setPosition(baseX + dx, baseY + dy);

        // Map movement: deadzone of 15px
        this.virtualLeft = dx < -15;
        this.virtualRight = dx > 15;
        this.virtualUp = dy < -15;
        this.virtualDown = dy > 15;
    }

    update(time, delta) {
        if (this.isShipMode) {
            this.updateShipMode(time, delta);
        } else {
            this.updatePlatformerMode(time, delta);
        }

        // Update shield visual position
        if (this.shieldGraphic && this.hasShield) {
            this.shieldGraphic.setPosition(this.x, this.y);
        }
    }

    updateShipMode(time, delta) {
        // Free movement in all 4 directions
        const moveLeft = this.cursors.left.isDown || this.keys.a.isDown || this.virtualLeft;
        const moveRight = this.cursors.right.isDown || this.keys.d.isDown || this.virtualRight;
        const moveUp = this.cursors.up.isDown || this.keys.w.isDown || this.virtualUp;
        const moveDown = this.cursors.down.isDown || this.keys.s.isDown || this.virtualDown;

        // Horizontal
        if (moveLeft) {
            this.setAccelerationX(-2000);
        } else if (moveRight) {
            this.setAccelerationX(2000);
        } else {
            this.setAccelerationX(0);
        }

        // Vertical - default drift upward slowly
        if (moveUp) {
            this.setAccelerationY(-2000);
        } else if (moveDown) {
            this.setAccelerationY(1500);
        } else {
            // Gentle upward drift (ship is escaping)
            this.setVelocityY(Math.max(this.body.velocity.y - 2, -80));
        }

        // Hyperdrive (space key) - boosts upward
        const hyperdriveActive = (this.cursors.up.isDown && this.keys.space.isDown) || (this.virtualJump && this.virtualUp);
        if (this.jetpackFuel > 0 && hyperdriveActive) {
            this.setVelocityY(-500);
            this.jetpackFuel -= delta * 0.08;
            if (this.jetpackFuel <= 0) this.jetpackFuel = 0;
        }
    }

    updatePlatformerMode(time, delta) {
        const isGrounded = this.body.touching.down || this.body.blocked.down;

        // Movement logic
        const moveLeft = this.cursors.left.isDown || this.keys.a.isDown || this.virtualLeft;
        const moveRight = this.cursors.right.isDown || this.keys.d.isDown || this.virtualRight;

        if (moveLeft) {
            this.setAccelerationX(-1500);
            this.setFlipX(true);
        } else if (moveRight) {
            this.setAccelerationX(1500);
            this.setFlipX(false);
        } else {
            this.setAccelerationX(0);
        }

        // Coyote time logic
        if (isGrounded) {
            this.coyoteTime = 150;
            this.jumpsLeft = this.maxJumps;
        } else {
            this.coyoteTime -= delta;
            if (this.coyoteTime <= 0 && this.jumpsLeft === this.maxJumps) {
                this.jumpsLeft = this.maxJumps - 1;
            }
        }

        // Jump & Jetpack logic
        const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.space) || this.virtualJumpJustDown;
        const jumpIsDown = this.cursors.up.isDown || this.keys.space.isDown || this.virtualJump;

        this.virtualJumpJustDown = false;

        if (jumpJustDown && this.jumpsLeft > 0) {
            this.setVelocityY(this.jumpForce);
            this.jumpsLeft--;
            this.coyoteTime = 0;
        }

        const jumpJustReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keys.space) || this.virtualJumpJustReleased;
        this.virtualJumpJustReleased = false;

        const usingJetpack = jumpIsDown && this.jetpackFuel > 0 && this.jumpsLeft === 0;

        if (jumpJustReleased && this.body.velocity.y < 0 && !usingJetpack) {
            this.setVelocityY(this.body.velocity.y * 0.5);
        }

        if (usingJetpack) {
            this.setAccelerationY(this.jetpackThrust);
            if (this.body.velocity.y > 0) {
                this.setVelocityY(this.body.velocity.y * 0.9);
            }
            this.jetpackFuel -= delta * 0.05;
            if (this.jetpackFuel <= 0) {
                this.jetpackFuel = 0;
            }
        } else {
            this.setAccelerationY(0);
        }
    }

    addJetpackFuel(amount) {
        this.jetpackFuel = Math.min(this.jetpackFuel + amount, this.maxJetpackFuel);
    }

    activateShield() {
        this.hasShield = true;
        if (this.shieldGraphic) this.shieldGraphic.destroy();
        this.shieldGraphic = this.scene.add.circle(this.x, this.y, 22, 0x00ff88, 0.25);
        this.shieldGraphic.setStrokeStyle(2, 0x00ff88, 0.8);
        this.shieldGraphic.setDepth(99);
    }

    removeShield() {
        this.hasShield = false;
        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
            this.shieldGraphic = null;
        }
    }
}
