function Transition(from_panel, to_panel) {
    if (from_panel !== null) {
        var fpanel = document.getElementById(from_panel);
        fpanel.classList.remove('show');
        transitions[from_panel].from();
    }
    var tpanel = document.getElementById(to_panel);
    tpanel.classList.add('show');
    transitions[to_panel].to();
}

function EnableButton(id) {
    var elm = document.getElementById(id);
    if (typeof elm === 'undefined') {
        console.error('Cannot enable button '+id+' because it cannot be found');
        return;
    }

    if (typeof btnClickHandlers[id] !== 'undefined') {
        elm.addEventListener('click', btnClickHandlers[id]);
    }
    if (typeof btnMouseOverHandlers[id] !== 'undefined') {
        elm.addEventListener('mouseover', btnMouseOverHandlers[id]);
    }
    if (typeof btnMouseOutHandlers[id] !== 'undefined') {
        elm.addEventListener('mouseout', btnMouseOutHandlers[id]);
    }
}

function DisableButton(id) {
    var elm = document.getElementById(id);
    if (typeof elm === 'undefined') {
        console.error('Cannot disable button '+id+' because it cannot be found');
        return;
    }
    if (typeof btnClickHandlers[id] !== 'undefined') {
        elm.removeEventListener('click', btnClickHandlers[id]);
    }
    if (typeof btnMouseOverHandlers[id] !== 'undefined') {
        elm.removeEventListener('mouseover', btnMouseOverHandlers[id]);
    }
    if (typeof btnMouseOutHandlers[id] !== 'undefined') {
        elm.removeEventListener('mouseout', btnMouseOutHandlers[id]);
    }
}

function GetRandomCards(num) {
    var chanceMap = [];
    var randomCards = [];
    var cardNames = Object.keys(cards);

    var maxChance = cardNames
        .reduce(function(sum, name) {
            return sum + cards[name].chance;
        }, 0);

    cardNames.forEach(function(name, i) {
        var threshold = cards[name].chance;
        if (i > 0) {
            threshold += chanceMap[i - 1].threshold;
        }
        chanceMap.push({
            cardName: name,
            threshold: threshold
        });
    });

    for (var i=0; i<num; ++i) {
        var threshold = Math.random() * maxChance;
        var cardName = GetCard(chanceMap, threshold);
        if (cardName === null) {
            console.error('Could not get card for threshold', threshold);
        }
        randomCards.push(cardName);
    }

    return randomCards;
}

function GetCard(list, threshold) {
    for (var i=0; i<list.length; ++i) {
        var elm = list[i];
        if (threshold < elm.threshold) {
            return elm.cardName;
        }
    }
    return null;
}

function FetchJSON(file, callback) {
    return fetch(file)
        .then(function(response) {
            return response.json();
        })
        .then(callback);
}

function ClearCard() {
    ClearChildElements('card_title');
    ClearChildElements('card_description');
}

function LoadCard(card) {
    document
        .getElementById('card_title')
        .appendChild(document.createTextNode(card.title));
    document
        .getElementById('card_description')
        .appendChild(document.createTextNode(card.description));
    document
        .getElementById('card_image')
        .setAttribute('src', 'cards/' + card.image + '.png');
}

function SetAxes(axes) {
    var g_axes = document.getElementById('g_axes');

    axes.forEach(function(axis) {

        var elms = {};

        // parent
        var g_axis = document.createElement('div');
        g_axis.classList.add('g_axis');
        g_axis.id = axis.id;

        // dot
        var dot = document.createElement('div');
        dot.classList.add('dot');
        var dotImage = document.createElement('img');
        dotImage.setAttribute('src', 'img/dot.svg');

        elms.dot = dotImage;
        dot.appendChild(dotImage);
        g_axis.appendChild(dot);

        // progress bar
        var progress = document.createElement('div');
        progress.classList.add('progress');
        var bar = document.createElement('div');
        bar.classList.add('bar');
        bar.setAttribute('style', 'background-color:'+axis.color+';');

        elms.progressBar = bar;
        progress.appendChild(bar);
        g_axis.appendChild(progress);

        // label
        var label = document.createElement('div');
        label.classList.add('label');
        var labelContent = document.createTextNode(axis.label);
        label.appendChild(labelContent);

        g_axis.appendChild(label);
        g_axes.appendChild(g_axis);

        state.axisElms[axis.id] = elms;
    });
}

function GetCurCard() {
    var curCardName = state.cards[state.curCard];
    return cards[curCardName];
}

function GetDotSize(value) {
    var absval = Math.abs(value);
    return absval < config.axisDotSmallThreshold ? 'small' : 'large';
}

function ClearChildElements(id) {
    var elm = document.getElementById(id);
    while (elm.firstChild) {
        elm.removeChild(elm.firstChild);
    }
}

function ShowOption(content) {
    document
        .getElementById('option_bg')
        .classList
        .add('show');
    document
        .getElementById('option_description')
        .innerHTML = content;
}

function HideOption() {
    document
        .getElementById('option_bg')
        .classList
        .remove('show');
    document
        .getElementById('option_description')
        .innerHTML = '';
}

function ShowDots(axis) {
    Object
        .keys(axis)
        .forEach(function(name) {
            var value = axis[name];
            var dot = state.axisElms[name].dot;
            dot.classList.add(GetDotSize(value));
        });
}

function HideDots(axis) {
    Object
        .keys(axis)
        .forEach(function(name) {
            var value = axis[name];
            var dot = state.axisElms[name].dot;
            dot.classList.remove(GetDotSize(value));
        });
}
