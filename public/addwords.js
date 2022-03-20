console.log('hello world')

const button = document.getElementById('submit_word');

button.addEventListener('click', async event => {
    const inputWord = document.getElementById('your_word').value;
    const wordType = document.getElementById('word_type').value;
    const data = {
        "word": inputWord, 
        "length": inputWord.length, 
        "type": wordType
    };

    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };

      const response = await fetch('/api/words', options);
      const json = await response.json();
      console.log(json);
})