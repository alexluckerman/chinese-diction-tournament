"use strict";

// Helpers
const phrases = ['什么', '一样', '为什么', '因为', '一点', '年', '还', '包括', '现在', '可是', '完全', '就', '政府', '都', '说', '只有', '而', '书房', '里', ' 挂', '指', '西南', '老家', '会', '后来', '才', '虽然', '快', '总', '生', '长', '从小', '跟', '有时', '节目', '到底', '还是', '意思', '从来', '看起来', '像', '不一定', '日本', '欧洲', '非洲', '亚洲', '并', '消息', '一定', '高兴', '不但', '法', '人口', '发达', '为了', '上课', '老师', '问', '叫', '连', '过', '会', '不过', '进来', '打', '别', '担心', '生', '录音', '姓名', '忙', '好吗', '住', '何必', '操心', '念书', '难道', '嫁', '外国人', '从起', '学期', '宿舍', '方便', '贵', '受不了', '挑剔', '功课', '时间', '菜', '容易', '用具', '坏了', '床', '桌子', '书架', '台灯', '椅子', '地毯', '要紧', '合住', '认识', '年纪', '考试', '考虑', '年纪', '很久', '稍微', '决定', '简单', '轮流', '厨房', '问题', '吃饭', '同住', '公寓', '避孕', '怀孕', '男人', '回家', '写信', '一些', '整天', '一点', '留下', '门铃', '屋子', '接电话', '您', '再见', '来', '算', '能', '孩子', '照', '说法', '东', '写字', '回答', '好', '出来', '出去', '起名字', '给他', '更', '自己', '学', '买', '卖', '越来越', '生意', '容易', '贸易', '经济', '英国', '世界', '告诉', '妈妈', '注册', '选课', '母亲', '讨厌', '其实', '喜欢', '逼得很紧', '好极了', '不要', ' 道德', '德州', '真', '想', '黄', '发达', '蓝', '眼睛', '却', '欧洲', '所以', '父亲', '哪里', '时候', '经常', '黑', '觉得', '奇怪', '美国', '中国菜', '学中文', '附近', '一张', '地图', '国家', '中华', '人民', '以前', '不懂', '历史', '搬到', '台湾'];

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
