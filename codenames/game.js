
//Set up the initial game state.
let lastRenderTime = 0;
let gameOver = false;
const gameBoard = document.querySelector('.game-board')
const gameDisplay = document.querySelector('.game-container')
const messageDisplay = document.querySelector('.message-container')
const titleDisplay = document.querySelector('.title-container')
const tileDisplay = document.querySelector('.tile-container')
const keyBoard = document.querySelector('.key-container')
const FPS = 15


//Call this function when enough time has passed, and update the game.
function main(currentTime) {
    if (gameOver) {
        return alert("Game over");
    }

    window.requestAnimationFrame(main);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;

    if (secondsSinceLastRender < 1 / FPS) return; 
        lastRenderTime = currentTime;

    // update();
    // draw();

}



window.requestAnimationFrame(main); // I think this starts the whole thing

function update() {

}


// function funcClick() {
//     console.log("You clicked!");
//     var inText = document.getElementById("mypara");
//     inText.innerHTML = "You've clicked the button!";
// }