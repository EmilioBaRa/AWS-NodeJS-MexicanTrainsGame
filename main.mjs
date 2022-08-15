//Import classes from the gameObject.mjs file
import process from 'process';
import { Game } from './gameObjects.mjs';

let mexicanTrainsGame = new Game(["Emilio", "Kevin", "Joshua", "Juan"]);

//Asynchronous function that waits for fetching last game data and to save actual game data from DynamoDB AWS
let startGame = async () => {
    await mexicanTrainsGame.getLastGame();
    mexicanTrainsGame.playRound(12);
    await mexicanTrainsGame.recordGame();
};

startGame();