
const socket = io();

const { codenamesId, side } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

console.log(codenamesId, side);

socket.emit('joinRoom', {side, codenamesId})

//Set up the initial game state.
// const titleDisplay = document.querySelector('.title-container')
const titleDisplay = document.querySelector('.title-container')
const tileDisplay = document.querySelector('.tile-container')
const wordsDisplay = document.querySelector('.words-container')
const greenContainer = document.getElementById('green-container')
const greyContainer = document.getElementById('grey-container')
const blackContainer = document.getElementById('black-container')
const chatMessages = document.querySelector('.chat-messages');
const currentScore = document.querySelector('.current-score');

const button = document.getElementById('new_codenames_game');

function loopGamboard(gameBoard) {
    titleDisplay.innerHTML = ""
    titleDiv = document.createElement('h1');
    titleDiv.textContent = 'Codenames'
    titleDisplay.appendChild(titleDiv)
    currentScore.textContent = `${gameBoard.wordsRemaining} words remaining after ${gameBoard.turnsCounter} turns and ${gameBoard.incorrectGuesses} incorrect guesses`
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
    console.log(turnValue)
    if (turnValue.side == side) {
           button.textContent = 'Wordmaster'
           button.style.background = '#1c2fbd'
    } else {
        button.textContent = 'End turn'
        button.style.background = '#548d4e'
    }
    currentScore.textContent = `${turnValue.wordsRemaining} words remaining after ${turnValue.turnsCounter} turns and ${turnValue.incorrectGuesses} incorrect guesses`
})

socket.on('color_update', updateValue => {
    currentScore.textContent = `${updateValue.wordsRemaining} words remaining after ${updateValue.turnsCounter} turns and ${updateValue.incorrectGuesses} incorrect guesses`
    console.log(updateValue)
    if (updateValue.gameOver) {
        button.textContent = 'New game'
        button.style.background = '#d1361b'
        gameOverScreen(updateValue.gameWon, updateValue.turnsCounter, updateValue.incorrectGuesses, updateValue.wordsRemaining)
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

socket.on('message', messages => {
    for(let i = 0; i < messages.length; i++) {
        if (messages[i].text1 == 'Starting a new game') {
            chatMessages.innerHTML = ""
        }
        console.log(messages[i])
        outputMessage(messages[i]);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
})

function outputMessage(message) {
    const div = document.createElement('div');
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    div.classList.add('message')
    span1.textContent = `${message.text1} `
    span1.style.color = message.colour1
    if (message.bold1) {
        span1.style.fontWeight = '900'
    }
    span2.textContent = message.text2
    span2.style.color = message.colour2
    if (message.bold2) {
        span2.style.fontWeight = '900'
    }
    div.append(span1)
    div.append(span2)
    document.querySelector('.chat-messages').appendChild(div);
}


function gameOverScreen (gameWon, turns, incorrectGuesses, wordsRemaining) {
    if(gameWon) {
        titleDisplay.innerHTML = ""
        div = document.createElement('h1');
        div1 = document.createElement('span');
        div2 = document.createElement('span');
        div1.textContent = `You won ` 
        div1.style.color = '#548d4e'
        div2.textContent = `in ${turns + 1} turn with ${incorrectGuesses} incorrect guesses`
        div.append(div1)
        div.append(div2)
        titleDisplay.appendChild(div)

    } else {
        titleDisplay.innerHTML = ""
        div = document.createElement('h1');
        div1 = document.createElement('span');
        div2 = document.createElement('span');
        div1.textContent = `You lost ` 
        div1.style.color = '#d1361b'
        div2.textContent = `in ${turns + 1} turns`
        if (turns == 1){
            div2.textContent = `in ${turns} turn`
        }
        div.append(div1)
        div.append(div2)
        titleDisplay.appendChild(div)
    }
}

socket.on('new_game', gameBoard => {
    greenContainer.innerHTML = ""
    blackContainer.innerHTML = ""
    greyContainer.innerHTML = ""
    tileDisplay.innerHTML = ""
    loopGamboard(gameBoard)
})