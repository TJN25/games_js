
const socket = io();

const { codenamesId, side } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

console.log(codenamesId, side);

socket.emit('joinRoom', {side, codenamesId})

//Set up the initial game state.
// const titleDisplay = document.querySelector('.title-container')
const tileDisplay = document.querySelector('.tile-container')
const wordsDisplay = document.querySelector('.words-container')
const greenContainer = document.getElementById('green-container')
const greyContainer = document.getElementById('grey-container')
const blackContainer = document.getElementById('black-container')


const button = document.getElementById('new_codenames_game');

function loopGamboard(gameBoard) {
    button.classList.add('flip')
    button.textContent = 'End turn'
    button.style.background = '#45a049'
    const guessRows =  gameBoard.guessRows;
    const gameColors = gameBoard.colours;
    let canGuess = gameBoard.aCanClick;
    const turnSide = gameBoard.turn
    let colourValue = gameBoard.aColourValue;
    if (side == 'B') {
        colourValue = gameBoard.bColourValue
        canGuess = gameBoard.bCanClick;
    }

    if ((turnSide == -1 && side == 'B') || (turnSide == 1 && side == 'A')) {
        console.log(`${turnSide} ${side}`)
        button.textContent = 'Wordmaster'
        button.style.background = '#1c2fbd'
    }
    console.log(colourValue)   
    let currentRow = 0;
    let currentTile = 0;
    // This function needs to ask the server for the required colors list
guessRows.forEach((guessRow, guessRowIndex) =>  {
    const rowElement = document.createElement('div')
    rowElement.setAttribute('id', "row-element")
    guessRow.forEach((guess, guessIndex) => {
        const tileElement = document.createElement('div')
        const wordElement = document.createElement('div')
        var tileText = guessRows[guessRowIndex][guessIndex]
        var tileId = 'guessRow-' + guessRowIndex + '-tile-' + guessIndex
        var wordId = tileText;
        tileElement.textContent = tileText 
        wordElement.textContent = tileText
        tileElement.setAttribute('id', tileId)
        wordElement.setAttribute('id', wordId)
        if (!canGuess[guessRowIndex][guessIndex]) {
            wordElement.style.textDecoration = "line-through";
        }
        tileElement.classList.add('tile')
        if (colourValue[guessRowIndex][guessIndex] == 'g') {
            wordElement.style.color = '#538d4e'
            greenContainer.append(wordElement);
        } else if (colourValue[guessRowIndex][guessIndex] == 'b') {
            wordElement.style.color = '#121213'
            blackContainer.append(wordElement);

        } else {
            wordElement.style.color = '#707064'
            greyContainer.append(wordElement);
        }
        tileElement.addEventListener('click', () => handleClick(tileText,tileId))
        tileElement.style.color = '#ffffff'
        if (gameColors[guessRowIndex][guessIndex] == 'g' ) {
        tileElement.style.backgroundColor = '#548d4e'
        } else if (gameColors[guessRowIndex][guessIndex] == 'y' ) {
            tileElement.style.backgroundColor = '#b59f3a'
        } else if (gameColors[guessRowIndex][guessIndex] == 'b'){
            tileElement.style.backgroundColor = '#000000'
        }

        rowElement.append(tileElement)
    })
    tileDisplay.append(rowElement)
    const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    //tile.style.backgroundColor = '#3a3b3c';
    if (gameBoard.gameOver) {
        button.textContent = 'New game'
        button.style.background = '#d1361b'
        gameOverScreen(gameBoard.gameWon, 1, 1)
    }
})
}


button.addEventListener('click', async event => {
    console.log(button.textContent)
    if (button.textContent == 'New game') {
    greenContainer.innerHTML = ""
    blackContainer.innerHTML = ""
    greyContainer.innerHTML = ""
    tileDisplay.innerHTML = ""
    fetch(`/api/codenames/newgame/${codenamesId}`);
    } else if (button.textContent == 'End turn') {
        fetch(`/api/codenames/endturn/${codenamesId}`)
    }
})


function handleClick(value, id) {
    console.log(codenamesId);
    socket.emit('button_clicked', {side, id, codenamesId})
}

socket.on('endTurn', turnValue => {
    if (turnValue.side == side) {
           button.textContent = 'Wordmaster'
           button.style.background = '#1c2fbd'
    } else {
        button.textContent = 'End turn'
        button.style.background = '#548d4e'
    }
})

socket.on('color_update', updateValue => {
    console.log(updateValue)
    if (updateValue.gameOver) {
        button.textContent = 'New game'
        button.style.background = '#d1361b'
        gameOverScreen(updateValue.gameWon, 1, 1)
    }
    if (updateValue.moveAccepted){
        const selectedTile = document.getElementById(updateValue.id);
        const selectedWord = document.getElementById(updateValue.word);
        selectedWord.style.textDecoration = "line-through"
        console.log(selectedWord)
        selectedTile.classList.add('flip')
        if (updateValue.colour == 'g') {
        selectedTile.style.backgroundColor = '#548d4e';
        } else if (updateValue.colour == 'b'){
            selectedTile.style.background = "#000000"
        selectedTile.style.backgroundColor = '#000000';
        } else {
            if (updateValue.colourBoth) {
                selectedTile.style.background = "#b59f3a"
            }else {
            if (updateValue.side != side) {
                button.textContent = 'End turn'
                button.style.background = '#548d4e'
           selectedTile.style.background = "linear-gradient(5deg, #707064 80%, #b59f3a 60%)"
            } else {
           selectedTile.style.background = "linear-gradient(-175deg, #707064 80%, #b59f3a 60%)"
                button.textContent = 'Wordmaster'
                button.style.background = '#1c2fbd'
            } 
        }
        }
    }
    
    
})


function gameOverScreen (gameWon, turns, incorrectGuesses) {
    if(gameWon) {
        console.log(`You won the game in ${turns} turn with ${incorrectGuesses} incorrect guesses`)
    } else {
        console.log(`You lost the game in ${turns} turn with ${incorrectGuesses} incorrect guesses`)
    }
}

socket.on('new_game', gameBoard => {
    console.log('called')
    console.log(gameBoard)
    greenContainer.innerHTML = ""
    blackContainer.innerHTML = ""
    greyContainer.innerHTML = ""
    tileDisplay.innerHTML = ""
    loopGamboard(gameBoard)
})