
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

function CreateCardIndex() {
    // Prepare data
    Object
        .keys(cards)
        .forEach(function(id) {
            cards[id].id = id;
            cards[id].year -= 1;
        });

    CrawlIndex(Object.keys(cards));
    console.dir(cardIndex);
}

function CrawlIndex(cardIDs) {
    var totalDone = 0;

    for (var i = cardIDs.length - 1; i >= 0; --i) {
        var id = cardIDs[i];
        var card = cards[id];

        var totalOptions = 0;
        var totalObjects = 0;
        Object
            .keys(card.cards)
            .forEach(function(option) {
                totalOptions += card.cards[option].length;
                card.cards[option].forEach(function(childID) {
                    totalObjects += typeof childID === 'object' ? 1 : 0;
                });
            });

        if (totalObjects !== totalOptions) {
            continue;
        }

        // id is a card that should either be a child or root node
        var isChild = false;

        for (var j = 0; j < cardIDs.length; ++j) {
            var jid = cardIDs[j];
            if (jid === id) {
                continue;
            }

            var jcard = cards[jid];
            Object
                .keys(jcard.cards)
                .forEach(function(option) {
                    jcard.cards[option].forEach(function(childID, n) {
                        if (childID === id) {
                            jcard.cards[option][n] = Object.assign({}, card);
                            isChild = true;
                        }
                    });
                });
        }

        if (isChild) {
            cardIDs.splice(i, 1);
        } else {
            ++totalDone;

            var found = cardIndex.find(function(card) {
                return card.id === id;
            });

            if (!found) {
                cardIndex.push(Object.assign({}, card));
            }
        }
    }

    if (totalDone < cardIDs.length) {
        CrawlIndex(cardIDs);
    }
}

function FillCardStack(year) {
    for (var i=0; i<cardIndex.length; ++i) {
        var card = cardIndex[i];
        if (card.year != year) {
            continue;
        }

        state.cardStacks[year].push(card);
    }
}

function ClearCardStacks() {
    state.cardStacks.forEach(function(stack) {
        stack.splice(0, stack.length);
    });
}

function GetCard(i) {
    var curStack = state.cardStacks[state.curYear];
    return curStack.splice(i, 1)[0];
}

function GetRandomCard(year) {
    var curStack = state.cardStacks[year];
    return Math.floor(Math.random() * curStack.length);
}

function ClearCard() {
    ClearChildElements('card_title');
    ClearChildElements('card_description');
}

function LoadCard(card, elm) {
    elm
        .querySelector('img')
        .setAttribute('src', 'cards/' + card.image + '.png');
    document
        .getElementById('card_title')
        .innerHTML = card.title;
    document
        .getElementById('card_description')
        .innerHTML = card.description;
}

function CreateCard(parent, card) {
    var card_cur = document.createElement('div');
    card_cur.setAttribute('class', 'card_cur');
    card_cur.setAttribute('id', 'card_cur');

    var img = document.createElement('img');
    img.setAttribute('id', 'card_image');
    img.setAttribute('src', 'cards/' + card.image + '.png');
    img.setAttribute('draggable', false);
    card_cur.appendChild(img);

    var option_bg = document.createElement('div');
    option_bg.setAttribute('class', 'option_bg');
    option_bg.setAttribute('id', 'option_bg');
    card_cur.appendChild(option_bg);

    var p = document.createElement('p');
    p.setAttribute('id', 'option_description');
    option_bg.appendChild(p);
    card_cur.appendChild(option_bg);

    parent.appendChild(card_cur);
}

function SetCurCard(id) {
    var elm = document.getElementById(id);
    elm.setAttribute('draggable', false);
    state.cardElm = elm;

    var cardRect = elm.getBoundingClientRect();
    state.curCardInitPos = {
        x: cardRect.left,
        y: cardRect.top
    };
}

function FetchJSON(file, callback) {
    return fetch(file)
        .then(function(response) {
            return response.json();
        })
        .then(callback);
}

function CreateAxesElements(axes) {
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
            bar.setAttribute('style', 'background-color:'+axis.color +
                ';-webkit-transition: width 0.5s; transition: width 0.5s;');

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

function SetAxesValue(axis, value) {
    Object
        .keys(axis)
        .forEach(function(id) {
            var v = value;
            if (typeof value === 'function') {
                v = value(id);
            }
            SetAxisValue(id, v);
        });
}

function SetAxisValue(id, value) {
	var newVal = state.axisValues[id] + value;
    newVal = Clamp(newVal, 0, config.axesMaxValue);

    state.axisValues[id] = newVal;
}

function ResetAxesValues() {
    Object.keys(state.axisValues).forEach(function(axis) {
        state.axisValues[axis] = 0;
    });
}

function SetProgressBarValue(elm, value) {
    var color = '#8DBEB2';

    var valpct = value / config.axesMaxValue;
    if(valpct < 0.15 || valpct > 0.85){
        color = '#F15F60';
    } else if(valpct < 0.30 || valpct > 0.70){
        color = '#F6B567';
    }

    var style = elm.style;
    style.width = Math.round(valpct * 100) + '%';
    style.backgroundColor = color;
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
        .setAttribute('class', 'option_bg');
    document
        .getElementById('option_description')
        .innerHTML = '';
}

function ShowDots(axis) {
    Object
        .keys(axis)
        .forEach(function(id) {
            var value = axis[id];
            if (value === 0) {
                return;
            }
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

function Clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function Map(value, xmin, xmax, ymin, ymax) {
    var percent = (value - xmin) / (xmax - xmin);
    return percent * (ymax - ymin) + ymin;
}
