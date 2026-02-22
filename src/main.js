import Preloader from './Preloader.js';
import MenuScene from './MenuScene.js';
import MainScene from './MainScene.js';
import GameOverScene from './GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [Preloader, MenuScene, MainScene, GameOverScene]
};

const game = new Phaser.Game(config);
