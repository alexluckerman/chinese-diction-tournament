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

let voice;
const synth = window.speechSynthesis;
if (!synth) { updateAlert('Your browser does not support text-to-speech', 'danger'); }

const initVoices = () => {
    const allVoices = synth.getVoices();
    if (!allVoices[0]) { return; }
    const voices = allVoices.filter(v => v.lang.includes('zh'));
    if (!voices[0]) {
        updateAlert('Your browser does not include a Chinese text-to-speech voice', 'danger');
        return;
    }
    voice = voices[0];
    const dropdownItems = voices.map(v => `<li class="dropdown-item" data-name="${v.name}" href="#">${v.name} (${v.lang})</li>`);
    $('.dropdown-menu').html(dropdownItems);
    $('.dropdown-item').click(ev => {
        voice = voices.find(val => $(ev.target).attr('data-name') === val.name);
    });
}

initVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = initVoices;
}

const shuffleIndices = (rawArray) => {
    let array = [...rawArray.keys()];
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let shuffledIndices;
let index = 0;
const resetShuffle = () => { shuffledIndices = shuffleIndices(phrases) };
if (location.hash) {
    try {
        const hashstring = location.hash.slice(1);
        const order = hashstring.split('.').map(val => parseInt(val));
        console.log(order);
        const validate = (acc, val) => acc && val >= 0 && val < phrases.length;
        const validShuffle = order.reduce(validate, true);
        if (validShuffle) {
            shuffledIndices = order;
        } else {
            throw 'Invalid shuffle provided';
        }
    } catch (e) {
        console.error(e);
        updateAlert('The share link provided is invalid. Using a random shuffle instead', 'warning');
        resetShuffle();
    }
} else {
    resetShuffle();
}

const randomPhrase = () => {
    if (index == phrases.length) {
        resetShuffle();
        index = 0;
        updateAlert('Congrats, you finished all the phrases! The phrases have been reshuffled and started again', 'success');
        console.log('Played all phrases, reshuffling and repeating');
    }
    return phrases[shuffledIndices[index++]];
}

$('#speak').click(() => {
    if (!voice) {
        updateAlert('Speaking failed: no voice initialized', 'danger');
        return;
    }
    if (synth.speaking) {
        console.log('Speak button pressed while already speaking');
        return;
    }
    const text = randomPhrase();
    if (text) {
        $('#alert').addClass('d-none');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = e => $('#speak').prop('disabled', false);
        utterance.onerror = e => console.error('An error occurred while speaking: ', e);
        utterance.voice = voice;
        synth.speak(utterance);
        $('#speak').prop('disabled', true);
    } else {
        updateAlert('Something went wrong: no phrases are available');
    }
});

$('#challenge').click(() => {
    $('#share').removeClass('d-none');
    shuffledIndices = shuffleIndices(phrases);
    index = 0;
    location.hash = shuffledIndices.join('.');
    $('#sharelink').val(location.href);
    location.hash = '';
    updateAlert('Send the link below to a friend so they can hear the same order of phrases and compete with you', 'success');
    $('#sharelink').click(() => $('#sharelink').select());
});

