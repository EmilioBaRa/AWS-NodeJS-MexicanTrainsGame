//Input prompter for users
import promptPkg from "prompt-sync";
const prompt = promptPkg({
    sigint: true
});

//Import aws module
import aws from 'aws-sdk';

//import axios module
import axios from "axios";

//aws-sdk module reference
var AWS = aws;

// Set the region and delay between put items to DynamoDB
AWS.config.update(
    {
        region: 'us-east-1',
        maxRetries: 15,
        retryDelayOptions:
        {
            base: 500
        }
});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

//New Tile class
export let Tile = class {
    constructor(left, right){
        //create a new tile with valid values (0 to 12)
        if( 0 <= left && left <= 12 && 0 <= right && right <= 12){
            this.left = left;
            this.right = right;
        }
        else{
            throw "Invalid tile value. Must be between 0 and 12.";
        }
    }

    //stringify the tile
    toString(){
        return `[ ${this.left}, ${this.right} ]`;
    }

};

//new Boneyard class
export let Boneyard = class {
    constructor(){
        //Create an array that will hold all tiles
        this.tilesList = [];

        //Insert all possible tiles values into the array
        for(let left = 0; left <= 12; left++){
            for (let right = left; right <= 12; right++) {
                this.tilesList.push(new Tile(left, right));
            }
        }

        //Shuffle tiles
        this.shuffle();
    }

    shuffle(){
        //Hold the tiles in other array and empty the initial array
        let tempTilesHolder = this.tilesList;
        this.tilesList = [];

        //Sort all remaining tiles
        let toSortTiles = tempTilesHolder.length;
        while (toSortTiles > 0){
            //Get a random tile from the array (0 to array length)
            let random = Math.floor(Math.random() * (toSortTiles));
            //Quit the tile index at random from the temporal array and store it in the original array
            this.tilesList.push(tempTilesHolder.splice(random, 1));
            toSortTiles--;
        }
    }

    draw(){
        if(this.isEmpty()){
            throw "Error. List is empty, cannot draw more tiles.";
        }
        //Quit the last tile from the Boneyard
        return this.tilesList.pop();
    }

    isEmpty(){
        return this.tilesList.length == 0;
    }

    drawDouble(tileNumber){
        //search for a tile that has the tileNumber in left and right
        for (let i = 0; i < this.tilesList.length; i++) {
            var actualTile = this.tilesList[i][0];
            if (actualTile.left == tileNumber && actualTile.right == tileNumber) {
                //remove and return tile from list
                //a new array will be created with the deleted element. 
                return this.tilesList.splice(i, 1)[0][0];
            }
        }

        return -1;
    }

    toString(){
        return this.tilesList.map((current, index) => (current).join(", "));
    }
};

//new Player class
export let Player = class {

    constructor(name, boneyard){
        //Save player name and create an array that will hold player tiles
        this.name = name;
        this.tiles = [];

        //if variable boneyard is of type Boneyard assign it. Else show an error
        if(boneyard instanceof Boneyard){
            this.boneyard = boneyard;
        }
        else{
            throw "boneyard parameter must be of class boneyard";
        }
    }

    //this method draws 15 tiles from the boneyard and adds them to the player tiles
    drawTiles(){
        for(let i = 0; i < 15; i++){
            this.drawTile();
        }
    }

    //this method draws 1 tile from the boneyard an adds it to the player tiles
    drawTile(){
        this.tiles.push(this.boneyard.draw());
    }

    toString(){
        //Create an string with the player name
        var playerTiles = `Player: ${this.name}\nHand: `;
        //Iterate with map through the player tiles array to return all tiles with their index
        //Then join all tiles by a comma separator
        playerTiles += this.tiles.map((current, index) => `${index + 1}. ${current}`).join(", ");
        return playerTiles;
    }

    removeIndex(index){
        //remove and return tile from list
        //a new array will be created with the deleted element. 

        return this.tiles.splice(index, 1)[0][0];
    }

    //return the player name
    getName(){
        return this.name;
    }
};

//new Train class
export let Train = class {
    constructor(startNumber, player){
        
        //Only allow the values that a Tile can have
        if( 0 <= startNumber && startNumber <= 12){
            //Hold the initial value that the train is going to start with as a string and number
            this.trainCount = ``;
            this.actualNumber = startNumber;
            this.startNumber = startNumber;

            //if player variable is an instance of the Player class
            if(player instanceof Player){
                this.player = player;
            }
            else{
                //return error if player is not of type Player
                throw "Error. player must be of type Player";
            }
        }
        else{
            //return error if an invalid tile value
            throw "Invalid start number value. Must be between 0 and 12.";
        }
    }

    placeTile(tile){
        //call canPlaceTile method to verify if is possible to add the tile to the train 
        if(this.canPlaceTile(tile)){
            //if the value that connect the train is on the right side swap it with the left value
            if(this.actualNumber == tile.right){
                [tile.left, tile.right] = [tile.right, tile.left];
            }

            //Add to the string the new tile added to the train and hold the numerical value
            this.trainCount += tile.toString();
            this.actualNumber = tile.right;

            //if tile was placed
            return true;
        }

        //if tile was not places
        return false;
    }

    canPlaceTile(tile){
        //Returns a boolean if a tile can be placed based if one of the values from the tile
        //equals to the actual number in the train
        return this.actualNumber == tile.left || this.actualNumber == tile.right;
    }

    toString(){
        //return a string representation of the train
        return `Player ${this.player.name}'s train. [Start number: ${this.startNumber}] ${this.trainCount}`;
    }
}; 

export let Board = class {

    constructor(players, startTile){

        //Only allow a maximum of 6 players
        if(players.length > 6){
            throw "Error. Must be a maximum of 6 game players.";
        }

        //Check if tile is a double
        if(startTile.left != startTile.right){
            throw "Error. The start tile must be a double tile.";
        }

        this.startTile = startTile;
        this.trains = []; //Each player will have their owm train in the same index as in the trains array

        //The last train will not correspond to a player. Last train is the mexican train
        for(let i = 0; i <= players.length; i++){
            this.trains.push(new Train(startTile.right, players[i] || new Player("*Mexican Train", players[i - 1].boneyard)));
        }
    }

    toString(){
        //A string representation of the board state
        //map is used to get all players state in the board and then each index joined to make an string
        return `Centre: ${this.startTile.toString()}\n${this.trains.map((train, index) => `${index}. ${train.player.name}: ${train.trainCount}`).join("\n")}`;
    }

};


export let Game = class {
    constructor(names){
        //names is an array of stringw
        if(!Array.isArray(names) || names.length > 6){
            throw "Error. Game constructor needs an array of less than 6 players";
        }

        this.names = names;

    }

    playRound(tileNumber){
        //Initialize all game objects to start the game
        //array of player objects
        this.players = [];
        this.boneyard = new Boneyard();

        //Quit from the boneyard a double tile and return it
        this.initialTile = this.boneyard.drawDouble(tileNumber);

        //Initialize the array of players
        for (let i = 0; i < this.names.length; i++){
            this.players[i] = new Player(this.names[i], this.boneyard);
            this.players[i].drawTiles();
        }

        //create the board
        this.board = new Board(this.players, this.initialTile);

        //print initial state of the game
        console.log(`Board\n-------\n${this.board.toString()}\n\nPlayers\n-------\n${this.players.map((current, index) => current.toString()).join("\n\n")}\n\nBoneyard\n-------\n${this.boneyard.toString()}`);

        while (true) {
            
            //I prefer using this kind of loop to make the used logic on switch case 6 easier
            for(let player = 0; player < this.players.length; player++){

                console.log(this.board.toString());
                console.log(this.players[player].toString());

                //user selected default tile and train
                let playerTurn = true;
                let selectTile = -1;
                let selectTrain = -1;

                //Player turn will be active until option 8 on the inner switch is input
                while (playerTurn) {
                
                    let op = prompt(
                        `\n1. Display board, 2. Display hand, 3. Draw tile, 4. Select tile, 5. Select train, 6. Move, 7. Toggle mark, 8. End turn: `
                    );

                    switch (op) {
                        case "1":
                            //Print board state
                            console.log(this.board.toString());
                            break;
                        case "2":
                            //Print player hand 
                            console.log(this.players[player].toString());
                            break;
                        case "3":
                            //Give a tile from the boneyard to a player
                            this.players[player].drawTile();
                            break;
                        case "4":
                            //In case the user wants to select another tile
                            selectTile = -1;

                            //Question the user until a valid input is given
                            while(selectTile < 0 || selectTile >= this.players[player].tiles.length){ 
                                try{
                                    selectTile = prompt(
                                        `\n Please  select tile number (from 1 to ${this.players[player].tiles.length}): `
                                    ) -  1;

                                    //Make sure only numbers are part of the input
                                    if(isNaN(selectTile)){
                                        throw "Error.";
                                    }
                                }
                                catch{
                                    //Handle all potential errors if input is not a number
                                    selectTile = -1;
                                }
                            }
                            break;
                        case "5":
                            //In case the user wants to select another tile
                            selectTrain = -1;

                            //Question the user until a valid input is given
                            while(selectTrain < 0 || selectTrain >= this.board.trains.length){ 
                                try{
                                    selectTrain = prompt(
                                        `\n Please  select a train number (from 0 to ${this.board.trains.length - 1}): `
                                    );

                                    //Make sure only numbers are part of the input
                                    if(isNaN(selectTrain)){
                                        throw "Error.";
                                    }
                                }
                                catch{
                                    //Handle all potential errors if input is not a number
                                    selectTrain = -1;
                                }
                            }
                            break;
                        case "6":
                            //We dont want the user to crash the program
                            //the purpose of this if is to be sure that the program 
                            //is not trying to access the default tile index
                            if(selectTile != -1){
                                //Note that tile will only be added if is possible. If is not possible the tile will be still a part of the player hand
                                if(selectTrain == -1 ? this.board.trains[player].placeTile(this.players[player].removeIndex(selectTile)) : this.board.trains[selectTrain].placeTile(this.players[player].removeIndex(selectTile))){
                                    //If tile was properly placed then remove tile index
                                    selectTile = -1;
                                }
                                else{
                                    console.log("Invalid Move!");
                                }
                            }
                            else{
                                console.log("Invalid tile!");
                            }
                            break;
                        case "7":
                        
                            break;
                        case "8":
                            //Next player turn
                            playerTurn = false;
                            break;
                        default:
                            break;
                    }

                    //Print which tile and train the player is going to use if decides to make a move (option 6 on the switch)
                    console.log(`\nMove\n-------\ntrain: ${selectTrain == -1 ? this.players[player].name : this.board.trains[selectTrain].player.name}, tile: ${selectTile == -1 ?  "undefined" : this.players[player].tiles[selectTile].toString()}`);
                }
            }
            //For testing DynamoDB!
            break;
        }
    }

    //asynchronous function that records a game data after it has been played
    async recordGame(){
        //Player names in array format
        var arrayPlayers = this.players.map((current, index) => current.getName());
        //give format to the record as a DynamoDB record, give the name of the table that 
        //the data will be uploaded to.
        var params = {
            "game" : "Mexican Trains",
            "game_time" : `${new Date().getTime()}`,
            "players" : arrayPlayers
        };
        
        try {
            //response variable will save the data from https://76ydmn9r44.execute-api.us-east-1.amazonaws.com/Lab9/gameplay
            //get request. The code will not continue until all data is fetched "await". 
            let response = await axios.post("https://76ydmn9r44.execute-api.us-east-1.amazonaws.com/Lab9/gameplay", params);
    
        } catch (error) {
            //if no data has been returned
            console.log(error);
        }

    }

    //asynchronous function that gets the data from the last game
    async getLastGame(){
        try {
            //response variable will save the data from https://76ydmn9r44.execute-api.us-east-1.amazonaws.com/Lab9/gameplay
            //get request. The code will not continue until all data is fetched "await". 
            let response = await axios.get("https://76ydmn9r44.execute-api.us-east-1.amazonaws.com/Lab9/gameplay");
    
            //We only want the actual data on the webpage, not the response status nor other elements
            let data = response.data.last_game;
    
            if(data){
                //For the date it has to be transformed from miliseconds to an actual date
                console.log(`\nWelcome back to Mexican Trains. The last time you played was on ${new Date(parseInt(data.time)).toString()} and you played with ${data.players.map((current, index) => current).join(", ")}.`)
            }
        } catch (error) {
            //if no data has been returned
            console.log("\nWelcome to Mexican Trains!");
        }
    }
};