/*TODO 
Game is now working.
Pick a word needs to appear for the first turn
The forced player change does not increase the turn counter or force a word
to be selected
*/

//require modules
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Datastore = require('nedb');
const { getWordleColors, getWordleTargetExternal } = require('./wordle/wordle_colors.js');
const { all } = require('express/lib/application');

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
    res.json(returnData);
  });

app.get('/api/targetWord', (req, res) => {
    db.find({length: 5}, (err, docs) => {
        if(err) return console.log(err);
        const randomElement = docs[Math.floor(Math.random() * docs.length)]
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
let allMessages = [];
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
        newGameBoard(room, {"text1" :"no"})
    }) 
    res.end;
})

app.get('/api/codenames/endturn/:room',(req, res) => {
    const room = req.params.room
    const gameBoardIndex = gameBoards.findIndex(x => x.id == room)
    gameBoards[gameBoardIndex].turnsCounter += 1
    gameBoards[gameBoardIndex].canEndTurn = false
    const wordsRemainingArray = getWordsRemaining(gameBoards[gameBoardIndex]);
    let turnValue = {}
    if ( (gameBoards[gameBoardIndex].turn == 1 && wordsRemainingArray.bGreenCounts > 0) || wordsRemainingArray.aGreenCounts == 0) {
        gameBoards[gameBoardIndex].turn = -1
        turnValue = {
            "side": "B",
            "turnsCounter": gameBoards[gameBoardIndex].turnsCounter,
            "wordsRemaining": gameBoards[gameBoardIndex].wordsRemaining,
            "incorrectGuesses": gameBoards[gameBoardIndex].incorrectGuesses
        } 
    } else {
        gameBoards[gameBoardIndex].turn = 1
        turnValue = {
            "side": "A",
            "turnsCounter": gameBoards[gameBoardIndex].turnsCounter,
            "wordsRemaining": gameBoards[gameBoardIndex].wordsRemaining,
            "incorrectGuesses": gameBoards[gameBoardIndex].incorrectGuesses
        }
    }
    dbGames.update({name: room, game: "codenames"}, {$set: {turn: gameBoards[gameBoardIndex].turn, turnsCounter: gameBoards[gameBoardIndex].turnsCounter, canEndTurn: gameBoards[gameBoardIndex].canEndTurn}}, {}, (err, numReplaced) => {
        if (err) console.log('error');
        io.to(room).emit('endTurn', turnValue)
        res.end()
    })})

io.on('connection', socket => {

    socket.on('joinRoom', ({side, codenamesId}) => {        
        console.log(`Side ${side} from room ${codenamesId}`)
        socket.join(codenamesId);
        const room = codenamesId
        const currentMessage = {"text1": `Side ${side}`, "colour1": "#1c2fbd", "bold1": true,
                                  "text2": `joined ${codenamesId}`, "colour2": "#707064", "bold2": false}
    dbGames.find({name: room, game: "codenames"}, (err, docs) => {
        if(err) console.log(err);
        if(docs.length == 0) {
           newGameBoard(room, currentMessage) ;
        }else {
            
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
                turn: docs[0].turn,
                turnsCounter: docs[0].turnsCounter,
                wordsRemaining: docs[0].wordsRemaining,
                incorrectGuesses: docs[0].incorrectGuesses,
                messages: docs[0].messages,
                canEndTurn: docs[0].canEndTurn,
                aWordsRemaining: docs[0].aWordsRemaining,
                bWordsRemaining: docs[0].bWordsRemaining
            }
            let gameBoardIndex = gameBoards.findIndex(x => x.id == room);
            if (gameBoardIndex == -1) {
                gameBoards.push(gameBoard);
                gameBoardIndex = gameBoards.findIndex(x => x.id == room); 
            }
            gameBoards[gameBoardIndex].messages.push(currentMessage);
            io.to(room).emit('new_game', gameBoard);
            io.to(room).emit('message', gameBoards[gameBoardIndex].messages);
        }

    })
    });

    socket.on('button_clicked', ({side, id, codenamesId}) => {        
        console.log(`Side ${side} clicked on ${id} from room ${codenamesId}`)
        
        const moveAccepted = updateGameBoard(side, id, codenamesId);
        if (moveAccepted) { 
        const gameBoardIndex = gameBoards.findIndex(x => x.id == codenamesId);
        const idArray = id.split('-');
        const guessRowIndex = idArray[1];
        const guessIndex = idArray[3];
        let colourBoth = false;
        if (!gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] && !gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex]) {
            colourBoth = true;
        }

        const wordsRemainingArray = getWordsRemaining(gameBoards[gameBoardIndex]);
        gameBoards[gameBoardIndex].wordsRemaining = wordsRemainingArray.greenCounts
        gameBoards[gameBoardIndex].bWordsRemaining = wordsRemainingArray.bGreenCounts
        gameBoards[gameBoardIndex].aWordsRemaining = wordsRemainingArray.aGreenCounts

        if (wordsRemainingArray.greenCounts > 0) {
            console.log(wordsRemainingArray)
            if (wordsRemainingArray.bGreenCounts == 0) {
                gameBoards[gameBoardIndex]
                gameBoards[gameBoardIndex].turn = 1
                gameBoards[gameBoardIndex]
            } else if( wordsRemainingArray.aGreenCounts == 0) {
                gameBoards[gameBoardIndex].turn = -1
            }
        }
        let sideTurn = 'A';
        if (gameBoards[gameBoardIndex].turn == 1) {
            sideTurn = 'B'
        }

        updateValue = {
            "colour": gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex],
            "id": id,
            "moveAccepted": moveAccepted,
            "gameOver": gameBoards[gameBoardIndex].gameOver,
            "gameWon": gameBoards[gameBoardIndex].gameWon,
            "side": side,
            "colourBoth": colourBoth,
            "word": gameBoards[gameBoardIndex].guessRows[guessRowIndex][guessIndex],
            "turnsCounter": gameBoards[gameBoardIndex].turnsCounter,
            "wordsRemaining": gameBoards[gameBoardIndex].wordsRemaining,
            "incorrectGuesses": gameBoards[gameBoardIndex].incorrectGuesses,
            "canEndTurn":  gameBoards[gameBoardIndex].canEndTurn,
            "sideTurn": sideTurn
        }
        let textColour = '#707064'
        if (updateValue.colour == 'g') {
            textColour = '#538d4e'
        } else if (updateValue.colour == 'b') {
            textColour = '#121213'
        }
        const currentMessage = {"text1": `Side ${side} clicked`, "colour1": "#707064", "bold1": false, "text2": `${gameBoards[gameBoardIndex].guessRows[guessRowIndex][guessIndex]}`, "colour2": textColour, "bold2": true};
        gameBoards[gameBoardIndex].messages.push(currentMessage);
        dbGames.update({name: codenamesId, game: "codenames"}, {$set: {colours: gameBoards[gameBoardIndex].colours, aColourValue: gameBoards[gameBoardIndex].aColourValue, 
                                                                    bColourValue: gameBoards[gameBoardIndex].bColourValue, aCanClick: gameBoards[gameBoardIndex].aCanClick, 
                                                                    bCanClick: gameBoards[gameBoardIndex].bCanClick, gameOver: gameBoards[gameBoardIndex].gameOver, 
                                                                    gameWon: gameBoards[gameBoardIndex].gameWon, turn: gameBoards[gameBoardIndex].turn,
                                                                turnsCounter: gameBoards[gameBoardIndex].turnsCounter, wordsRemaining: gameBoards[gameBoardIndex].wordsRemaining,
                                                            messages: gameBoards[gameBoardIndex].messages, incorrectGuesses: gameBoards[gameBoardIndex].incorrectGuesses,
                                                        canEndTurn: gameBoards[gameBoardIndex].canEndTurn,
                                                        aWordsRemaining: gameBoards[gameBoardIndex].aWordsRemaining, bWordsRemaining: gameBoards[gameBoardIndex].bWordsRemaining}}, {}, (err, numReplaced) => {
            if (err) console.log('error');
            io.to(codenamesId).emit('color_update', updateValue)
            io.to(codenamesId).emit('message', [currentMessage])
            
        })
    } 
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
        updateValues(side, gameBoardIndex, guessRowIndex, guessIndex, room);
        return true;
    } else {
        console.log(`${side} cannot move. Turn is ${gameBoards[gameBoardIndex].turn}`)
        return false;
    }
    
    
}

function updateValues(side, gameBoardIndex, guessRowIndex, guessIndex, room) {
    if (side == 'A'){
        
        // gameBoards[gameBoardIndex].turn = -1
        gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] = false
        if (gameBoards[gameBoardIndex].bColourValue[guessRowIndex][guessIndex] == 'g'){
            gameBoards[gameBoardIndex].canEndTurn = true
            gameBoards[gameBoardIndex].wordsRemaining -= 1
            if (gameBoards[gameBoardIndex].wordsRemaining == 0) {
                console.log(`words remaining: ${gameBoards[gameBoardIndex].wordsRemaining}`)
                gameBoards[gameBoardIndex].gameOver = true;
                gameBoards[gameBoardIndex].gameWon = true;
            }
            if (gameBoards[gameBoardIndex].turn == 0 ) {
                gameBoards[gameBoardIndex].turn = -1
                io.to(room).emit('endTurn', {"side": "B"})
            }
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'g'
            gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex] = false
        } else if (gameBoards[gameBoardIndex].bColourValue[guessRowIndex][guessIndex] == 'b') {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'b'
            gameBoards[gameBoardIndex].turn = 1
            gameBoards[gameBoardIndex].gameOver = true
            gameBoards[gameBoardIndex].gameWon = false
            gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex] = false
        } else {
            gameBoards[gameBoardIndex].canEndTurn = false
            gameBoards[gameBoardIndex].turnsCounter += 1
            gameBoards[gameBoardIndex].incorrectGuesses += 1
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'x'
            gameBoards[gameBoardIndex].turn = 1
        }
    }
    if (side == 'B') {
        // gameBoards[gameBoardIndex].turn = 1
        gameBoards[gameBoardIndex].bCanClick[guessRowIndex][guessIndex] = false
        if (gameBoards[gameBoardIndex].aColourValue[guessRowIndex][guessIndex] == 'g'){
            gameBoards[gameBoardIndex].canEndTurn = true
            gameBoards[gameBoardIndex].wordsRemaining -= 1
            if(gameBoards[gameBoardIndex].wordsRemaining == 0) {
            gameBoards[gameBoardIndex].gameOver = true;
            gameBoards[gameBoardIndex].gameWon = true;
            }
            if (gameBoards[gameBoardIndex].turn == 0 ) {
                io.to(room).emit('endTurn', {"side": "A"})
                gameBoards[gameBoardIndex].turn = 1
            }
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'g'
            gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] = false
        } else if (gameBoards[gameBoardIndex].aColourValue[guessRowIndex][guessIndex] == 'b') {
            gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'b'
            gameBoards[gameBoardIndex].turn = -1
            gameBoards[gameBoardIndex].gameOver = true
            gameBoards[gameBoardIndex].gameWon = false
            gameBoards[gameBoardIndex].aCanClick[guessRowIndex][guessIndex] = false
        } else {
            gameBoards[gameBoardIndex].canEndTurn = false
            gameBoards[gameBoardIndex].turnsCounter += 1
            gameBoards[gameBoardIndex].incorrectGuesses += 1
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
    if (currentBoard.gameOver) {
        return false;
    }
    return true;
}


function getWordsRemaining(gameBoard) {
    let aGreenCounts = 0;
    let bGreenCounts = 0;
    let greenCounts = 0
    for (let i = 0; i < 25; i ++) {
        rowValue = Math.floor(i / 5);
        colValue = i % 5;
        if (gameBoard.aColourValue[rowValue][colValue] == 'g' && gameBoard.bCanClick[rowValue][colValue]) {
            aGreenCounts += 1;
        }
        if (gameBoard.bColourValue[rowValue][colValue] == 'g' && gameBoard.aCanClick[rowValue][colValue]) {
            bGreenCounts += 1;
        }
        if ((gameBoard.aColourValue[rowValue][colValue] == 'g' && gameBoard.bCanClick[rowValue][colValue])|| (gameBoard.bColourValue[rowValue][colValue] == 'g' && gameBoard.aCanClick[rowValue][colValue])) {
            greenCounts += 1
        } 
    }
    return {"greenCounts": greenCounts,
            "aGreenCounts": aGreenCounts,
            "bGreenCounts": bGreenCounts
        }
}

async function newGameBoard(room, currentMessage) {
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
            let aGreenCounts = 0;
            let bGreenCounts = 0;
            let greenCounts = 0;

            for (let i = 0; i < 18; i++) {
                rowValue = Math.floor(selectedPositions[i] / 5);
                colValue = selectedPositions[i] % 5;
                if (i < 9) {
                    aColourValue[rowValue][colValue] = 'g'
                }
                if (i > 5 && i < 15) {
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
           
            for (let i = 0; i < 25; i++) {
                rowValue = Math.floor(i / 5);
                colValue = i % 5;
                if (aColourValue[rowValue][colValue] == 'g') {
                    aGreenCounts += 1;
                }
                if (bColourValue[rowValue][colValue] == 'g') {
                    bGreenCounts += 1;
                }
                if (aColourValue[rowValue][colValue] == 'g' || bColourValue[rowValue][colValue] == 'g') {
                    greenCounts += 1
                }
            }            
            


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
                    "turnsCounter": 0,
                    "incorrectGuesses": 0,
                    "wordsRemaining": greenCounts,
                    "aWordsRemaining": aGreenCounts,
                    "bWordsRemaining": bGreenCounts,
                    "messages": [{"text1": "Starting a new game", "colour1": "#707064", "bold1" : false, 
                                    "text2": "", "colour2": "#707064", "bold2": false}],
                    "canEndTurn": false,
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
                turn: newGameData.turn,
                turnsCounter: 0,
                incorrectGuesses: 0,
                messages: [{"text1": "Starting a new game", "colour1": "#707064", "bold1" : false, 
                "text2": "", "colour2": "#707064", "bold2": false}],
                canEndTurn: false,
                wordsRemaining: greenCounts,
                aWordsRemaining: aGreenCounts,
                bWordsRemaining: bGreenCounts
            }
            gameBoards.push(gameBoard)
            const gameBoardIndex = gameBoards.findIndex(x => x.id == room);
            io.to(room).emit('new_game', gameBoard)
            if (currentMessage.text1 != 'no') {
                console.log('updating player join')
            gameBoards[gameBoardIndex].messages.push(currentMessage);
            io.to(room).emit('message', [currentMessage]);
            } else {
                console.log('new game')
                io.to(room).emit('message', [{"text1": "Starting a new game", "colour1": "#707064", "bold1" : false, 
                "text2": "", "colour2": "#707064", "bold2": false}]);
            }
        })
}

//listen
const PORT = 3020 || process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})