import Preloader from './Preloader.js';
import MenuScene from './MenuScene.js';
import MainScene from './MainScene.js';
import GameOverScene from './GameOverScene.js';
import StoryScene from './StoryScene.js';

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [Preloader, MenuScene, MainScene, GameOverScene, StoryScene]
};

const game = new Phaser.Game(config);
