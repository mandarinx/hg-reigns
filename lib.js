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

            if (typeof found === 'undefined') {
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

function GetCard(i) {
    var curStack = state.cardStacks[state.curYear];
    return curStack.splice(i, 1)[0];
}

function GetRandomCard(year) {
    var curStack = state.cardStacks[year];
    return Math.floor(Math.random() * curStack.length);
}

function HasMoreCards() {
    return state.curCard < state.cards.length;
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

function FetchJSON(file, callback) {
    return fetch(file)
        .then(function(response) {
            return response.json();
        })
        .then(callback);
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
