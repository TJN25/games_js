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

let gameBoard = {}
const rowCount = 2;
const colCount = 5;
app.get('/api/wordle/gameboard/:room', (req, res) => {
    const room = req.params.room
    dbGames.find({name: room, game: "codenames"}, (err, docs) => {
        if(err) console.log(err);
        console.log(`Printing ${room} ${docs}`);
        if(docs.length == 0) {
            console.log('new db entry')
            dbCodenames.find({type: "main"}, (err2, docs2) => { 
                if(err2) console.log(err2);
                const words = docs2[0].words;
                const targets = [];
                for (let i = 0; i < 10; i++) {
                    const randomElement = Math.floor(Math.random() * words.length);
                    targets.push(words[randomElement]);
                    words.splice(randomElement, 1);
                };
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
            const newGameData = {
                "game": "codenames",
                "name": room,
                "guessRows": guessRows,
                "colours": [
                        ['x', 'x', 'x', 'x'],
                        ['x', 'x', 'x', 'x']
                    ],
                    "words": targets,
                    "_id": room + ':codenames'
            }
            dbGames.insert(newGameData)
            gameBoard = {
                guessRows: newGameData.guessRows,
                colours: newGameData.colours
            }
            res.json(gameBoard);
        })
        }else {
            console.log('existing');
            gameBoard = {
                guessRows: docs[0].guessRows,
                colours: docs[0].colours
            }
            console.log(gameBoard); 
            res.json(gameBoard);
        }

    })
    
})

io.on('connection', socket => {
    console.log('New WS Connection...')
    socket.on('button_clicked', ({side, id, codenamesId}) => {
        console.log(`Side ${side} clicked on ${id}`)
        updateValue = {
            "colour": "green",
            "id": id
        }
        updateGameBoard(side, id);
        dbGames.update({name: codenamesId, game: "codenames"}, {colours: gameBoard.colours}, {}, (err, numReplaced) => {
            if (err) console.log('error');
            io.emit('color_update', updateValue)
        })
        
    })
})

function updateGameBoard(side, id) {
    const idArray = id.split('-');
    const guessRowIndex = idArray[1];
    const guessIndex = idArray[3];
    gameBoard.colours[guessRowIndex][guessIndex] = 'g'
    
}

//listen
const PORT = 3020 || process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})