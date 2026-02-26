export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background Cover image
        const portada = this.add.image(width / 2, height / 2, 'portada');
        const scaleX = width / portada.width;
        const scaleY = height / portada.height;
        const scale = Math.max(scaleX, scaleY);
        portada.setScale(scale).setScrollFactor(0);
        portada.setTint(0xdddddd);

        // High Score
        const highScore = localStorage.getItem('templeHighScore') || 0;
        this.add.text(width / 2, height - 10, `HIGH SCORE: ${highScore}`, {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1);

        // Level Selector Title
        this.add.text(width / 2, height - 105, 'SELECCIONA NIVEL', {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Level Buttons
        const levelNames = ['Volcán', 'Cielo', 'Espacio', 'Nave', 'Abismo', 'Muro', 'Eco', 'Foso', 'Fuga', 'Voltaje', 'Cacería'];
        const levelColors = [0xff4500, 0x4488ff, 0x8800ff, 0xffcc00, 0x00ff88, 0x330033, 0xffffff, 0xff0000, 0xffaa00, 0x00ffff, 0xccff00];
        const btnY = height - 70;
        const btnSpacing = 52;
        const startX = width / 2 - (btnSpacing * 5);

        // Story data for each level (shown BEFORE starting that level)
        const storyData = [
            null, // Level 1: no story
            { storyKey: 'lev1', title: 'ESCAPASTE DEL VOLCÁN', desc: 'Has logrado salir a la\nsuperficie, pero la travesía\ncontinúa hacia los cielos...' },
            { storyKey: 'lev2', noText: true },
            { storyKey: 'levsh', title: '¡ABORDASTE LA NAVE!', desc: 'El planeta explota detrás tuyo...\n¡Esquiva los escombros y\nescapa al hiperespacio!' },
            { storyKey: 'levsh', title: 'PROFUNDIDADES', desc: 'Te adentras en el Abismo...\nEsquiva las barreras y\nsobrevive al caos.' },
            { storyKey: 'levsh', title: 'INFRANQUEABLE', desc: 'Las barreras ahora son más\ngruesas y duras...\n¡No intentes dispararles!' },
            { storyKey: 'levsh', title: 'ECO DEL ABISMO', desc: 'El espacio se retuerce...\nLas aberturas no se quedan\nquietas. ¡Apunta bien!' },
            { storyKey: 'levsh', title: 'EL FOSO FINAL', desc: 'Los bordes brillan de rojo...\nUn roce significa la muerte.\n¡Precisión absoluta!' },
            { storyKey: 'levsh', title: 'FUGA DESESPERADA', desc: '¡la onda expansiva se acerca!\nesto causa empujones al borde de plasma.\n¡Cuando todo se ponga amarillo, vuela más rápido que nunca!' },
            { storyKey: 'levsh', title: 'VOLTAJE CRÍTICO', desc: 'El sistema está en corto...\nRayos de plasma cierran el paso.\n¡Calcula bien el tiempo!' },
            { storyKey: 'levsh', title: 'PERSECUCIÓN', desc: 'Los radares detectan OVNIs...\n¡Se acercan por detrás!\nUsa el auto-apuntado para\nsobrevivir a la cacería.' }
        ];

        for (let i = 0; i < 11; i++) {
            const bx = startX + i * btnSpacing;
            const level = i + 1;

            // Button background
            const btnBg = this.add.rectangle(bx, btnY, 60, 38, levelColors[i], 0.8)
                .setStrokeStyle(2, 0xffffff, 0.9)
                .setInteractive({ useHandCursor: true });

            // Button text
            const btnText = this.add.text(bx, btnY - 6, `${level}`, {
                fontSize: '18px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const btnLabel = this.add.text(bx, btnY + 12, levelNames[i], {
                fontSize: '10px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);

            // Hover effect
            btnBg.on('pointerover', () => {
                btnBg.setScale(1.1);
                btnText.setScale(1.1);
                btnLabel.setScale(1.1);
            });
            btnBg.on('pointerout', () => {
                btnBg.setScale(1);
                btnText.setScale(1);
                btnLabel.setScale(1);
            });

            // Click handler
            btnBg.on('pointerdown', () => {
                this.startLevel(level, storyData[i]);
            });
        }

        // Keyboard shortcuts
        this.input.keyboard.on('keydown-ONE', () => {
            this.startLevel(1, storyData[0]);
        });
        this.input.keyboard.on('keydown-TWO', () => {
            this.startLevel(2, storyData[1]);
        });
        this.input.keyboard.on('keydown-THREE', () => {
            this.startLevel(3, storyData[2]);
        });
        this.input.keyboard.on('keydown-FOUR', () => {
            this.startLevel(4, storyData[3]);
        });
        this.input.keyboard.on('keydown-FIVE', () => {
            this.startLevel(5, storyData[4]);
        });
        this.input.keyboard.on('keydown-SIX', () => {
            this.startLevel(6, storyData[5]);
        });
        this.input.keyboard.on('keydown-SEVEN', () => {
            this.startLevel(7, storyData[6]);
        });
        this.input.keyboard.on('keydown-EIGHT', () => {
            this.startLevel(8, storyData[7]);
        });
        this.input.keyboard.on('keydown-NINE', () => {
            this.startLevel(9, storyData[8]);
        });
        this.input.keyboard.on('keydown-ZERO', () => {
            this.startLevel(10, storyData[9]);
        });
        this.input.keyboard.on('keydown-L', () => {
            this.startLevel(11, storyData[10]);
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            this.startLevel(1, storyData[0]);
        });
    }

    startLevel(level, story) {
        if (story) {
            this.scene.start('StoryScene', {
                storyKey: story.storyKey,
                nextLevel: level,
                score: 0,
                title: story.title || '',
                desc: story.desc || '',
                noText: story.noText || false
            });
        } else {
            this.scene.start('MainScene', { level: level, score: 0 });
        }
    }
}
