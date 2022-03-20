const tileDisplay = document.querySelector('.tile-container');

const guessRows = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', '']
]

let currentRow = 0;
let currentTile = 0;

guessRows.forEach((guessRow, guessRowIndex) =>  {
    const rowElement = document.createElement('div')
    rowElement.setAttribute('id', 'guess-' + guessRowIndex)
    guessRow.forEach((guess, guessIndex) => {
        const tileElement = document.createElement('div')
        tileElement.setAttribute('id', 'guessRow-' + guessRowIndex + '-tile-' + guessIndex)
        tileElement.classList.add('tile')
        rowElement.append(tileElement)
    })
    tileDisplay.append(rowElement)
    const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    tile.style.backgroundColor = '#3a3b3c';
})

function handleClick(key) {
    addLetter(key)
}

const addLetter = (letter) => {
    console.log(currentTile)
    if ( letter == '«' || letter == 'BACKSPACE') {
        const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
        tile.textContent = '' 
        guessRows[currentRow][currentTile] = '';
        currentTile--
        if ( currentTile < 0) {
            currentTile = 0
        }
    const selectedTile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    tile.style.backgroundColor = 'transparent';
    selectedTile.style.backgroundColor = '#3a3b3c';
    } else if (( letter == '⏎' || letter == 'ENTER' ) && currentTile == 4 && guessRows[currentRow][currentTile] != ''){
        const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
        currentRow++ 
        currentRow = currentRow % 6
        currentTile = 0
     const selectedTile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    tile.style.backgroundColor = 'transparent';
    selectedTile.style.backgroundColor = '#3a3b3c';
    colorWordGuess();       
    } else if ( letter == '⏎' || letter == 'ENTER' ) {
        console.log('Please finish the word')
    
    }else {
    const tile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    tile.textContent = letter;
    guessRows[currentRow][currentTile] = letter;
    currentTile += 1
    if ( currentTile > 4 ) {
        currentTile = 4
    }
    const selectedTile = document.getElementById('guessRow-' + currentRow + '-tile-' + currentTile);
    tile.style.backgroundColor = 'transparent';
    selectedTile.style.backgroundColor = '#3a3b3c';
    }

}

window.addEventListener('keydown', e => {
    var pressedKey = e.which;
    if (( pressedKey > 64 && pressedKey < 91 ) || ( pressedKey > 96 && pressedKey < 123) || pressedKey == 8 || pressedKey == 13) {
        addLetter(e.key.toUpperCase())
    }
})


async function colorWordGuess() {
    const currentWord = guessRows[currentRow - 1]
    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentWord)
      };

    const response = await fetch(`/api/wordguess/`, options)
    const wordResponse = await response.json()
    console.log(wordResponse.word);
    for ( let i = 0; i < wordResponse.word.length; i++) {
        const guessedRow = currentRow - 1
        if ( wordResponse.word[i] == 'g' ) {
            const selectedTile = document.getElementById('guessRow-' + guessedRow + '-tile-' + i);
            selectedTile.style.backgroundColor = '#548d4e';

        } else if ( wordResponse.word[i] == 'y' ) {
            const selectedTile = document.getElementById('guessRow-' + guessedRow + '-tile-' + i);
            selectedTile.style.backgroundColor = '#b59f3a';
        }
    }
}

