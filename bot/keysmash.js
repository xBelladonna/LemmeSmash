module.exports = {
    ISOStandard: charset => {
        // Generates a keysmash from any string of characters
        // like jhfgsjfhgdgjfhdsgkadfgldskgfhj if given the string "asdfghjkl"

        if (!charset) return "ಠ_ಠ";
        let length = randomValueBetween(16, 32);
        let keysmash = "";

        for (let i = 0; i < length; i++) {
            let char;
            char = charset[randomValueBetween(0, charset.length - 1)];
            keysmash += char;
        }
        return keysmash;
    },

    fourLetterRepeating: async charset => {
        // Generates a keysmash like dfdhfgdfhdhgfdghdfh

        if (!charset) return "ಠ_ಠ";
        if (charset.length < 4) return "I need at least 4 characters ಠ_ಠ";
        let phrases = [];
        for (var i = 0; i < charset.length - 3; i++) {
            let phrase = charset.substring(i, i + 4);
            phrases.push(phrase);
        }
        let thingToRepeat = randomValueFromArray(phrases);
        let repetitions = randomValueBetween(4, 8);
        let keysmash = thingToRepeat.repeat(repetitions);

        // add extra stuff to the beginning and end about 30% of the time
        if (Math.random() <= 0.3) keysmash = thingToRepeat.substring(1, Math.random(1, 3)) + keysmash;
        if (Math.random() <= 0.3) keysmash += thingToRepeat.substring(0, Math.random(0, 2));
        // let's just remove random bits, a bit, maybe, about 60% of the time
        if (Math.random() <= 0.6)
            for (let i = 0; i < randomValueBetween(0, 4); i++)
                keysmash = stringReplaceAt(keysmash, randomValueBetween(0, keysmash.length), "");

        return keysmash;
    }
}


// Utility functions sdfhadshkghdas
const randomValueBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomValueFromArray = array => array[Math.floor(Math.random() * array.length)];

function stringReplaceAt(string, index, char) {
    let splitString = string.split("");
    splitString[index] = char;
    return splitString.join("");
}