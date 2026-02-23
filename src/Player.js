export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        // Heavy but agile control
        this.setGravityY(1200);
        this.setDragX(1500);
        this.setMaxVelocity(300, 800);

        this.coyoteTime = 0;
        this.jumpsLeft = 2;
        this.maxJumps = 2;
        this.jumpForce = -650;
        this.moveSpeed = 250;

        // Jetpack properties
        this.jetpackFuel = 0;
        this.maxJetpackFuel = 100;
        this.jetpackThrust = -2500; // Overcome 1200 gravity with upward force

        // Keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Mobile Controls setup
        this.virtualLeft = false;
        this.virtualRight = false;
        this.virtualJump = false;
        this.virtualJumpJustDown = false;
        this.virtualJumpJustReleased = false;

        if (scene.sys.game.device.input.touch) {
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
            }
        };

        scene.input.on('pointerup', resetJoystick);

        // Jump Button
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

        // Map movement horizontally: deadzone of 15px
        this.virtualLeft = dx < -15;
        this.virtualRight = dx > 15;
    }

    update(time, delta) {
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
            this.coyoteTime = 150; // ms of coyote time
            this.jumpsLeft = this.maxJumps;
        } else {
            this.coyoteTime -= delta;
            if (this.coyoteTime <= 0 && this.jumpsLeft === this.maxJumps) {
                // If we walk off a ledge and coyote time expires, lose the first jump
                this.jumpsLeft = this.maxJumps - 1;
            }
        }

        // Jump & Jetpack logic
        const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.space) || this.virtualJumpJustDown;
        const jumpIsDown = this.cursors.up.isDown || this.keys.space.isDown || this.virtualJump;

        // Reset virtual triggers
        this.virtualJumpJustDown = false;

        // Initial normal jumps
        if (jumpJustDown && this.jumpsLeft > 0) {
            this.setVelocityY(this.jumpForce);
            this.jumpsLeft--;
            this.coyoteTime = 0;
        }

        // Variable jump height (only apply if NOT using jetpack)
        const jumpJustReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keys.space) || this.virtualJumpJustReleased;
        this.virtualJumpJustReleased = false; // Reset vertical trigger

        const usingJetpack = jumpIsDown && this.jetpackFuel > 0 && this.jumpsLeft === 0;

        if (jumpJustReleased && this.body.velocity.y < 0 && !usingJetpack) {
            this.setVelocityY(this.body.velocity.y * 0.5); // Reduce velocity for shorter jumps
        }

        // Jetpack thrust (continuous hold after jumps are exhausted, or anytime if fuel exists)
        if (usingJetpack) {
            this.setAccelerationY(this.jetpackThrust);
            // Cancel out existing downward velocity quickly to allow immediate ascension
            if (this.body.velocity.y > 0) {
                this.setVelocityY(this.body.velocity.y * 0.9);
            }
            this.jetpackFuel -= delta * 0.05; // Deplete fuel
            if (this.jetpackFuel <= 0) {
                this.jetpackFuel = 0;
            }
        } else {
            this.setAccelerationY(0); // Restore normal gravity acceleration
        }
    }

    addJetpackFuel(amount) {
        this.jetpackFuel = Math.min(this.jetpackFuel + amount, this.maxJetpackFuel);
    }
}
