/*TODO add a marker for an incorrect guess
add a chat loog to list the guesses (enable scrolling)
cross out words when they are guessed
add a counter for number of turns, incorrect guesses and words left
add a game over (win/lose) popup
add a goal tree to select the goal you're going for
track player sucess based on player names
*/

//require modules
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Datastore = require('nedb');
const { getWordleColors, getWordleTargetExternal } = require('./wordle/wordle_colors.js')

//setup of the server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

db = new Datastore({ filename: 'public/wordle/words.db'})
db.loadDatabase(err => {
    if(err) console.log(err)
})

let wordleTarget;

const getWordleTarget = (db, wordLength) => {
    const target = db.find({length: wordLength}, (err, docs) => {
        if(err) return console.log(err);
        const randomElement = docs[Math.floor(Math.random() * docs.length)]
        const wordleTarget = randomElement.word.toUpperCase()
    })
}





app.post('/api/words', (req, res) => {
    const data = req.body;
    db.insert(data);
    res.json(data);
  });

app.post('/api/username', (req, res) => {
    const data = req.body;
    res.json(data);
  });

app.post('/api/wordle', (req, res) => {
    const data = req.body;
    returnData = {"word": "FLARE"}
    console.log(returnData);
    res.json(returnData);
  });

app.get('/api/targetWord', (req, res) => {
    console.log('request made for word');
    db.find({length: 5}, (err, docs) => {
        if(err) return console.log(err);
        const randomElement = docs[Math.floor(Math.random() * docs.length)]
        console.log(randomElement.word);
        res.json(randomElement);
    })
})

//Codenames things

//TODO: before building the game the board state needs to be saved on this side.

dbCodenames = new Datastore({ filename: 'public/codenames/codenames.db'})
dbCodenames.loadDatabase(err => {
    if(err) console.log(err)
})

dbGames = new Datastore({ filename: 'games.db'})
dbGames.loadDatabase(err => {
    if(err) console.log(err)
})

let gameBoards = [];
const rowCount = 5;
const colCount = 5;


app.get('/api/codenames/newgame/:room', (req, res) => {
    const room = req.params.room
    const gameBoardIndex = gameBoards.findIndex(x => x.id == room);
    if (gameBoardIndex != -1) {
        gameBoards.splice(gameBoardIndex, 1);
    }
    dbGames.remove({name: room, game: "codenames"}, {}, (err, numRemoved) => {
        if(err) console.error(err)
        newGameBoard(room, res)
    }) 
})

app.get('/api/codenames/endturn/:room',(req, res) => {
    const room = req.params.room
    const gameBoardIndex = gameBoards.findIndex(x => x.id == room)
    gameBoards[gameBoardIndex].turn *= -1
    dbGames.update({name: room, game: "codenames"}, {$set: {turn: gameBoards[gameBoardIndex].turn * -1}}, {}, (err, numReplaced) => {
        if (err) console.log('error');
        res.end()
    })})

io.on('connection', socket => {

    socket.on('joinRoom', ({side, codenamesId}) => {        
        console.log(`Side ${side} from room ${codenamesId}`)
        socket.join(codenamesId);
        const room = codenamesId
    dbGames.find({name: room, game: "codenames"}, (err, docs) => {
        if(err) console.log(err);
        if(docs.length == 0) {
           newGameBoard(room) ;
        }else {
            gameBoard = {
                id: room,
                guessRows: docs[0].guessRows,
                colours: docs[0].colours
            }
            gameBoard = {
                id: room,
                guessRows: docs[0].guessRows,
                colours: docs[0].colours,
                aColourValue: docs[0].aColourValue,
                bColourValue: docs[0].bColourValue,
                aCanClick: docs[0].aCanClick,
                bCanClick: docs[0].bCanClick,
                gameOver: docs[0].gameOver,
                gameWon: docs[0].gameWon,
                turn: docs[0].turn
            }
            const gameBoardIndex = gameBoards.findIndex(x => x.id == room);
            if (gameBoardIndex == -1) {
                gameBoards.push(gameBoard);
            }
            io.to(room).emit('new_game', gameBoard)
        }

    })
    });

    socket.on('button_clicked', ({side, id, codenamesId}) => {        
        console.log(`Side ${side} clicked on ${id} from room ${codenamesId}`)
        
        const moveAccepted = updateGameBoard(side, id, codenamesId);
        
        const gameBoardIndex = gameBoards.findIndex(x => x.id == codenamesId);
        const idArray = id.split('-');
        const guessRowIndex = idArray[1];
        const guessIndex = idArray[3];
        let colourBoth = false;
        if (!gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] && !gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex]) {
            colourBoth = true;
        }
        updateValue = {
            "colour": gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex],
            "id": id,
            "moveAccepted": moveAccepted,
            "gameOver": gameBoards[gameBoardIndex].gameOver,
            "gameWon": gameBoards[gameBoardIndex].gameWon,
            "side": side,
            "colourBoth": colourBoth
        }
        console.log(updateValue);
        dbGames.update({name: codenamesId, game: "codenames"}, {$set: {colours: gameBoards[gameBoardIndex].colours}}, {}, (err, numReplaced) => {
            if (err) console.log('error');
            io.to(codenamesId).emit('color_update', updateValue)
        })
        
    })
})



function updateGameBoard(side, id, room) {
    const idArray = id.split('-');
    const guessRowIndex = idArray[1];
    const guessIndex = idArray[3];
    const gameBoardIndex = gameBoards.findIndex(x => x.id == room);
    const currentBoard = gameBoards[gameBoardIndex];
    const validTurn = checkValidTurn(side, currentBoard, guessRowIndex, guessIndex)
    if (validTurn) {
        console.log(`${side} can move`)
        updateValues(side, gameBoardIndex, guessRowIndex, guessIndex);
        return true;
    } else {
        console.log(`${side} cannot move. Turn is ${gameBoards[gameBoardIndex].turn}`)
        return false;
    }
    
    
}

function updateValues(side, gameBoardIndex, guessRowIndex, guessIndex) {
    if (side == 'A'){
        
        // gameBoards[gameBoardIndex].turn = -1
        gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] = false
        if (gameBoards[gameBoardIndex].bColourValue[guessRowIndex][guessIndex] == 'g'){
            if (gameBoards[gameBoardIndex].turn == 0 ) {
                gameBoards[gameBoardIndex].turn = -1
            }
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'g'
        } else if (gameBoards[gameBoardIndex].bColourValue[guessRowIndex][guessIndex] == 'b') {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'b'
            gameBoards[gameBoardIndex].turn = 1
            gameBoards[gameBoardIndex].gameOver = true
            gameBoards[gameBoardIndex].gameWon = false
        } else {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'x'
            gameBoards[gameBoardIndex].turn = 1
        }
    }
    if (side == 'B') {
        // gameBoards[gameBoardIndex].turn = 1
        gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex] = false
        if (gameBoards[gameBoardIndex].aColourValue[guessRowIndex][guessIndex] == 'g'){
            if (gameBoards[gameBoardIndex].turn == 0 ) {
                gameBoards[gameBoardIndex].turn = 1
            }
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'g'
        } else if (gameBoards[gameBoardIndex].aColourValue[guessRowIndex][guessIndex] == 'b') {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'b'
            gameBoards[gameBoardIndex].turn = -1
            gameBoards[gameBoardIndex].gameOver = true
            gameBoards[gameBoardIndex].gameWon = false
        } else {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'x'
            gameBoards[gameBoardIndex].turn = -1
        }
    }
}

function checkValidTurn(side, currentBoard, guessRowIndex, guessIndex) {
    if (side == 'A' && currentBoard.turn == 1) {
        return false;
    } 
    if (side == 'B' && currentBoard.turn == -1) {
        return false;
    }
    if (side == 'A' && !currentBoard.aCanClick[guessRowIndex][guessIndex]) {
        return false;
    }
    if (side == 'B' && !currentBoard.bCanClick[guessRowIndex][guessIndex]) {
        return false;
    }
    return true;
}

async function newGameBoard(room) {
            dbCodenames.find({type: "hp"}, (err2, docs2) => { 
                if(err2) console.log(err2);
                const words = docs2[0].words;
                const targets = [];
                for (let i = 0; i < 25; i++) {
                    const randomElement = Math.floor(Math.random() * words.length);
                    targets.push(words[randomElement]);
                    words.splice(randomElement, 1);
                };
                let selectedPositions = [];
                let possibleIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                                        12, 13, 14, 15, 16, 17, 18, 19, 20, 
                                        21, 22, 23, 24]
                for (let i = 0; i < 18; i++) {
                    const randomIndex = Math.floor(Math.random() * possibleIndexes.length);
                    selectedPositions.push(possibleIndexes[randomIndex]);
                    possibleIndexes.splice(randomIndex, 1);
                }
                
            let guessRows = [];
            for(let row = 0; row < rowCount; row++){
                let guessRow = []
                for(let col = 0; col < colCount; col++) {
                    const posId = row * colCount + col;
                    guessRow.push(targets[posId]);
                }
                guessRows.push(guessRow);
            }

            const aColourValue = [
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x']
                                ]
            const bColourValue = [
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x', 'x']
                                ]
            let aCanClick = [
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true, true]
                                ]
            let bCanClick = [
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true, true],
                                    [true, true, true, true,true]
                                ]
            console.log(`length of selection is ${selectedPositions.length} for ${selectedPositions}`)
            for (let i = 0; i < 18; i++) {
                rowValue = Math.floor(selectedPositions[i] / 5);
                colValue = selectedPositions[i] % 5;
                if (i < 9) {
                    aColourValue[rowValue][colValue] = 'g'
                }
                if (i > 5 && i < 15) {
                    console.log(`${i} selecting ${selectedPositions[i]}`)
                    bColourValue[rowValue][colValue] = 'g'
                }
                if(i == 1) {
                    bColourValue[rowValue][colValue] = 'b'
                }
                if (i == 10) {
                    aColourValue[rowValue][colValue] = 'b'
                }
                if (i == 15) {
                    aColourValue[rowValue][colValue] = 'b'
                    bColourValue[rowValue][colValue] = 'b'
                }
                if (i == 16) {
                    aColourValue[rowValue][colValue] = 'b'
                }
                if (i == 17) {
                    bColourValue[rowValue][colValue]= 'b'
                }

            }
            console.log(bColourValue);
            
            const newGameData = {
                "game": "codenames",
                "name": room,
                "guessRows": guessRows,
                "colours": [
                        ['x', 'x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x', 'x']
                    ],
                    "aColourValue": aColourValue,
                    "bColourValue": bColourValue,
                    "aCanClick": aCanClick,
                    "bCanClick": bCanClick,
                    "words": targets,
                    "gameOver": false,
                    "gameWon": false,
                    "turn": 0,
                    "_id": room + ':codenames'
            }
            dbGames.insert(newGameData)
            gameBoard = {
                id: room,
                guessRows: newGameData.guessRows,
                colours: newGameData.colours,
                aColourValue: newGameData.aColourValue,
                bColourValue: newGameData.bColourValue,
                aCanClick: newGameData.aCanClick,
                bCanClick: newGameData.bCanClick,
                gameOver: newGameData.gameOver,
                gameWon: newGameData.gameWon,
                turn: newGameData.turn
            }
            gameBoards.push(gameBoard)
            io.to(room).emit('new_game', gameBoard)
        })
}

//listen
const PORT = 3020 || process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})