function TransitionTo(to_panel) {
    if (state.curPanel !== null) {
        var cur = document.getElementById(state.curPanel);
        cur.classList.remove('show');
        transitions[state.curPanel].from();
    }
    var next = document.getElementById(to_panel);
    next.classList.add('show');
    transitions[to_panel].to();
    state.curPanel = to_panel;
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
        .innerHTML = card.title;
    document
        .getElementById('card_description')
        .innerHTML = card.description;
    document
        .getElementById('card_image')
        .setAttribute('src', 'cards/' + card.image + '.png');
}

function SetAxes(axes) {
    var g_axes = document.getElementById('g_axes');
    ClearChildElements('g_axes');

    Object
        .keys(axes)
        .forEach(function(id) {
            var elms = {};
            var axis = axes[id];

            // parent
            var g_axis = document.createElement('div');
            g_axis.classList.add('g_axis');
            g_axis.id = id;

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

            state.axisElms[id] = elms;
            state.axisValues[id] = 0;
        });
}

function SetAxisValue(axis, value) {
    Object
        .keys(axis)
        .forEach(function(id) {
            var v = value;
            if (typeof value === 'function') {
                v = value(id);
            }
            SetAxesValue(id, v);
        });
}

function SetAxesValue(id, value) {
    state.axisValues[id] += value;
    var valpct = state.axisValues[id] / config.axesMaxValue;
    state
        .axisElms[id]
        .progressBar.style.width = Math.round(valpct * 100) + '%';
}

function GetCurCard() {
    var curCardName = state.cards[state.curCard];
    return cards[curCardName];
}

function HasMoreCards() {
    return state.curCard < state.cards.length;
}

function HighlightCurYear() {
    var year = 'year_' + state.curYear;
    document.getElementById(year).classList.add('selected');
}

function ResetYears() {
    for (var i=0; i<config.maxYears; ++i) {
        document
            .getElementById('year_' + i)
            .setAttribute('class', 'g_year');
    }
}

function GetDotSize(value) {
    var absval = Math.abs(value);
    return absval < config.dotSmallThreshold ? 'small' : 'large';
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
        .forEach(function(id) {
            var value = axis[id];
            if(value == 0) return;
            var dot = state.axisElms[id].dot;
            dot.classList.add(GetDotSize(value));
        });
}

function HideDots(axis) {
    Object
        .keys(axis)
        .forEach(function(id) {
            var value = axis[id];
            var dot = state.axisElms[id].dot;
            dot.removeAttribute('class');
        });
}

function ValidateGameState() {
    var valid = true;

    Object
        .keys(state.axisValues)
        .forEach(function(id) {
            if (state.axisValues[id] <= 0 ||
                state.axisValues[id] >= config.axesMaxValue) {
                valid = false;
            }
        });

    return valid;
}

function GetInvalidAxes() {
    var axes = [];
    Object
        .keys(state.axisValues)
        .forEach(function(id) {
            if (state.axisValues[id] <= 0 ||
                state.axisValues[id] >= config.axesMaxValue) {
                axes.push(id);
            }
        });
    var i = Math.floor(Math.random() * axes.length);
    return axes[i];
}
