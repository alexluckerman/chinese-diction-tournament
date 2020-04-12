"use strict";

// Helpers
const phrases = [
    '留下',
    '点菜',
    '几点',
    '整天',
    '整理',
    '一些',
    '不信',
    '写信'
];

const updateAlert = (msg, type) => {
    $('#alert').text(msg).removeClass('d-none alert-success alert-danger alert-warning').addClass(`alert-${type}`);
}

const shuffleIndices = (rawArray) => {
    let array = [...rawArray.keys()];
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

class Game {
    constructor(synth, voice) {
        this.synth = synth;
        this.voice = voice;
        this.reset();
    }

    loadOrderFromHash() {
        try {
            const hashstring = location.search.slice(1);
            const providedOrder = hashstring.split('.').map(val => parseInt(val));
            const validater = (acc, val) => acc && val >= 0 && val < phrases.length;
            const validShuffle = providedOrder.reduce(validater, true);
            if (validShuffle) {
                this.phraseOrder = providedOrder;
                updateAlert('Loaded game information from link successfully', 'success')
            } else throw 'Invalid shuffle provided';
        } catch (err) {
            console.error(err);
            updateAlert('The share link provided is invalid. Using a random shuffle instead', 'warning');
        }
    }

    reset() {
        this.phraseOrder = shuffleIndices(phrases);
        this.index = 0;
    }

    generateRandomPhrase() {
        this.currentPhrase = phrases[this.phraseOrder[this.index++]];
        if (this.index === phrases.length) {
            this.reset();
            console.log('Played all phrases, reshuffling and repeating');
            updateAlert('Congrats, you finished all the phrases! The phrases will be reshuffled and started again', 'success');
        }
    }
}

// Initialization
const synth = window.speechSynthesis;
if (!synth) { updateAlert('Your browser does not support text-to-speech', 'danger'); }

let game;
const initVoices = () => {
    const allVoices = synth.getVoices();
    if (!allVoices[0]) { return; }
    const usableVoices = allVoices.filter(v => v.lang.includes('zh'));
    if (usableVoices.length == 0) {
        updateAlert('Your browser does not include a Chinese text-to-speech voice', 'danger');
    } else {
        // Initialize game
        game = new Game(synth, usableVoices[0]);
        if (location.search) game.loadOrderFromHash();
        // Generate voices dropdown
        const dropdownItems = usableVoices.map(v => `<li class="dropdown-item" data-name="${v.name}" href="#">${v.name} (${v.lang})</li>`);
        $('.dropdown-menu').html(dropdownItems);
        $('.dropdown-item').click(ev => {
            game.voice = usableVoices.find(val => $(ev.target).attr('data-name') === val.name);
        });
    }
}

initVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = initVoices;
}

// Event handlers
$('#speak').click(() => {
    if (!game.voice) updateAlert('Speaking failed: no voice initialized', 'danger');
    else if (synth.speaking) console.log('Speak button pressed while already speaking');
    else {
        $('#alert').addClass('d-none');
        game.generateRandomPhrase();
        const utterance = new SpeechSynthesisUtterance(game.currentPhrase);
        utterance.onend = () => { $('#speak').prop('disabled', false) };
        utterance.onerror = err => console.error('An error occurred while speaking: ', err);
        utterance.voice = game.voice;
        synth.speak(utterance);
        $('#speak').prop('disabled', true);
    };
});

$('#challenge').click(() => {
    game.reset();
    $('#sharelink').val(location.origin + location.pathname + '?' + game.phraseOrder.join('.'));
    $('#sharelink').click(() => $('#sharelink').select());
    $('#share').removeClass('d-none');
    updateAlert('Send the link below to a friend so they can hear the same order of phrases and compete with you', 'primary');
});
