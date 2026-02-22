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

        // Keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    update(time, delta) {
        const isGrounded = this.body.touching.down || this.body.blocked.down;

        // Movement logic
        if (this.cursors.left.isDown || this.keys.a.isDown) {
            this.setAccelerationX(-1500);
            this.setFlipX(true);
        } else if (this.cursors.right.isDown || this.keys.d.isDown) {
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

        // Jump logic
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);
        if (jumpPressed && this.jumpsLeft > 0) {
            this.setVelocityY(this.jumpForce);
            this.jumpsLeft--;
            this.coyoteTime = 0;
        }

        // Variable jump height
        const jumpReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keys.space);
        if (jumpReleased && this.body.velocity.y < 0) {
            this.setVelocityY(this.body.velocity.y * 0.5); // Reduce velocity for shorter jumps
        }
    }
}
