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

let voice;
const synth = window.speechSynthesis;
if (!synth) { $('#error').text('Your browser is not supported').removeClass('d-none'); }

const initVoices = () => {
    const allVoices = synth.getVoices();
    const voices = allVoices.filter(v => v.lang.includes('zh'));
    if (!voices[0]) { $('error').text('Your browser does not include a Chinese text-to-speech voice').removeClass('d-none'); return; }
    voice = voices[0];
}

initVoices();
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = initVoices;
}

$('#speak').click(() => {
    if (!voice) {
        console.error('Speaking failed: no voice initialized');
        return;
    }
    if (synth.speaking) {
        console.log('Speak button pressed while already speaking');
        return;
    }
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = e => console.log('Done speaking');
        utterance.onerror = e => console.error('Error occurred while speaking');
        synth.speak(utterance);
    } else {
        console.log('Speech requested, but no text was provided')
    }
});