function getWordleColors(target, current) {
    var colorsArray = {"word": ["g", "g", "y", "x", "x"]};
    return colorsArray;
};

async function getWordleTarget(db, wordLength) {
    const target = await db.find({length: wordLength}, (err, docs) => {
        if(err) return console.log(err);
        const randomElement = docs[Math.floor(Math.random() * docs.length)]
        const randomWord = randomElement.word.toUpperCase()
        return randomWord;
    })
    console.log(await target);
    return target;
}

module.exports = { getWordleColors, getWordleTarget };