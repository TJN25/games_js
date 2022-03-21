
const socket = io();

const { codenamesId, side } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

console.log(codenamesId, side);

socket.emit('joinRoom', {side, codenamesId})

//Set up the initial game state.
// const titleDisplay = document.querySelector('.title-container')
const tileDisplay = document.querySelector('.tile-container')

async function drawGameState(codenamesId, side){
    const response = await fetch(`/api/wordle/gameboard/${codenamesId}`);
    const json = await response.json();
    console.log(json);
    const guessRows = await json.guessRows;
    const gameColors = await json.colours;
    console.log(guessRows);
    let currentRow = 0;
    let currentTile = 0;

// This function needs to ask the server for the required colors list
guessRows.forEach((guessRow, guessRowIndex) =>  {
    const rowElement = document.createElement('div')
    rowElement.setAttribute('id', 'guess-' + guessRowIndex)
    guessRow.forEach((guess, guessIndex) => {
        const tileElement = document.createElement('button')
        var tileText = guessRows[guessRowIndex][guessIndex]
        var tileId = 'guessRow-' + guessRowIndex + '-tile-' + guessIndex
        tileElement.textContent = tileText
        tileElement.setAttribute('id', tileId)
        tileElement.classList.add('tile')
        tileElement.addEventListener('click', () => handleClick(tileText,tileId))
        if (gameColors[guessRowIndex][guessIndex] == 'g' ) {
        tileElement.style.backgroundColor = '#548d4e'
        } else if (gameColors[guessRowIndex][guessIndex] == 'y' ) {
            tileElement.style.backgroundColor = '#b59f3a'
        }
        rowElement.append(tileElement)
    })
    tileDisplay.append(rowElement)
    const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    //tile.style.backgroundColor = '#3a3b3c';
})
}

drawGameState(codenamesId, side)

function handleClick(value, id) {
    console.log(codenamesId);
    socket.emit('button_clicked', {side, id, codenamesId})
}

socket.on('color_update', updateValue => {
    console.log(updateValue)
    const selectedTile = document.getElementById(updateValue.id);
    selectedTile.style.backgroundColor = '#548d4e';
})

