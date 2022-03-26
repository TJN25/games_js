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
    // console.log(target);
}



console.log(wordleTarget)


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
    console.log(data);
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
app.get('/api/wordle/gameboard/:room', (req, res) => {
    const room = req.params.room
    console.log(room)
    dbGames.find({name: room, game: "codenames"}, (err, docs) => {
        if(err) console.log(err);
        console.log(`Printing ${room} ${docs}`);
        if(docs.length == 0) {
            console.log('new db entry')
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
                                        21, 22, 23, 24, 25]
                for (let i = 0; i < 18; i++) {
                    const randomIndex = Math.floor(Math.random() * possibleIndexes.length);
                    selectedPositions.push(possibleIndexes[randomIndex]);
                    possibleIndexes.splice(randomIndex, 1);
                }
                
                console.log(targets);
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
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x']
                                ]
            const bColourValue = [
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x'],
                                    ['x', 'x', 'x', 'x']
                                ]
            let aCanClick = [
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true]
                                ]
            let bCanClick = [
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true],
                                    [true, true, true, true]
                                ]
            
            for (let i = 0; i < 18; i++) {
                rowValue = Math.floor(i / 5);
                colValue = i % 5;
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
            
            const newGameData = {
                "game": "codenames",
                "name": room,
                "guessRows": guessRows,
                "colours": [
                        ['x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x']
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
            res.json(gameBoard);
        })
        }else {
            console.log('existing');
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
            console.log(gameBoard); 
            res.json(gameBoard);
        }

    })
    
})

io.on('connection', socket => {

    socket.on('joinRoom', ({side, codenamesId}) => {        
        console.log(`Side ${side} from room ${codenamesId}`)
        socket.join(codenamesId);
    });

    console.log('New WS Connection...')
    socket.on('button_clicked', ({side, id, codenamesId}) => {        
        console.log(`Side ${side} clicked on ${id} from room ${codenamesId}`)
        updateValue = {
            "colour": "green",
            "id": id
        }
        updateGameBoard(side, id, codenamesId);
        const gameBoardIndex = gameBoards.findIndex(x => x.id == codenamesId);
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
    gameBoards[gameBoardIndex].colours[guessRowIndex][guessIndex] = 'g'
    
}

//listen
const PORT = 3020 || process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})