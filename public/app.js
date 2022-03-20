console.log('hello world')

const button = document.getElementById('submit_name');

button.addEventListener('click', async event => {
    const username = document.getElementById('username').value;
    const data = {
        username 
    };

    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };

      const response = await fetch('/api/username', options);
      const json = await response.json();
      console.log(json);
})


const testbutton = document.getElementById('async_button_2');

testbutton.addEventListener('click', async event => {
      const response = await fetch('/api/targetWord');
      const json = await response.json();
      console.log(json);
})

let wordle

const getWordle = () => {
    fetch('/api/targetWord')
        .then(response => response.json())
        .then(json => {
            wordle = json.word
        })
        .catch(err => console.log(err))
}
getWordle()

console.log(wordle)