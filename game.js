var config;
var cards;
var cardIndex = [];
var state = {};
var transitions = {};
var btnClickHandlers = {};
var btnMouseOverHandlers = {};
var btnMouseOutHandlers = {};

var prefixTransform = 'transform';

function OnLoad() {
    if ('webkitTransform' in document.body.style) {
        prefixTransform = 'webkitTransform';
    }

    transitions = {
        panel_intro: {
            from: OnTransitionFromIntro,
            to: OnTransitionToIntro
        },
        panel_game: {
            from: OnTransitionFromGame,
            to: OnTransitionToGame
        },
        panel_endgame: {
            from: OnTransitionFromEndGame,
            to: OnTransitionToEndGame
        }
    };

    btnClickHandlers = {
        i_btn_start: OnStartGame,
        e_retry: OnRestartGame,
        option_yes: OnClickOptionYes,
        option_no: OnClickOptionNo
    };

    btnMouseOverHandlers = {
        option_yes: OnOverOptionYes,
        option_no: OnOverOptionNo
    };

    btnMouseOutHandlers = {
        option_yes: OnOutOptionYes,
        option_no: OnOutOptionNo
    };

    var file_config = FetchJSON('config.json', function(json) {
        config = json;
    });

    var file_cards = FetchJSON('cards.json', function(json) {
        cards = json;
    });

    Promise
        .all([file_config, file_cards])
        .then(function (results) {
            state = {
                curPanel: null,
                curCard: null,
                cardCount: 0,
                curYear: 0,
                // references to various DOM elements beloning to an axis,
                // indexed by axis name
                axisElms: {},
                // the values of each axis, indexed by axis name
                axisValues: {},
                // the axes that killed you
                killedbBy: null,
                cardStacks: [[],[],[],[],[]],
                cardFalling: false,
                fallTime: 0
            };
            CreateCardIndex();
            TransitionTo(config.startPanel);
        });
}

function OnTransitionToIntro() {
    EnableButton('i_btn_start');
}

function OnTransitionFromIntro() {
    DisableButton('i_btn_start');
}

function OnTransitionToGame() {
    document
        .getElementById('card_cur')
        .setAttribute('draggable', false);
    state.cardElm = document.getElementById('card_cur');

    state.mouseDownPos = {x:0,y:0};
    state.mov = {x:0,y:0};

    var cardRect = state.cardElm.getBoundingClientRect();
    state.curCardInitPos = {
        x: cardRect.left,
        y: cardRect.top
    };

    var panelRect = document
        .getElementById('panel_game')
        .getBoundingClientRect();
    var padding = panelRect.width * 0.15;

    state.movement = {};
    state.movement.min = panelRect.left + padding;
    state.movement.max = panelRect.left + panelRect.width - padding - cardRect.width;
    state.movement.len = state.movement.max - state.movement.min;

    state.curPos = state.curCardInitPos;
    state.pu = 0;
    ClearCardStacks();
    state.curYear = 0;
    state.cardCount = 0;
    FillCardStack(state.curYear);
    state.curCard = GetCard(GetRandomCard(state.curYear));

    SetAxes(config.axes);
    SetAxisValue(state.axisElms, config.axesStartValue);

    ClearCard();
    LoadCard(state.curCard);
    ResetYears();
    HighlightCurYear();

    state.cardElm.addEventListener('pointerdown', OnPointerDown);
    state.cardElm.addEventListener('touchstart', OnPointerDown);

    state.updateRef = null;
    // state.updateRef = window.requestAnimationFrame(Update);
}

function OnPointerDown(e) {
    if (typeof e.button !== 'undefined' && e.button !== 0) {
        return;
    }

    e.stopPropagation();
    e.preventDefault();

    state.isDown = true;
    state.mouseDownPos = GetPageCoord(e);

    document.body.insertBefore(state.cardElm, document.body.firstChild);
    state.cardElm.classList.add('absolute');

    state.cardElm.addEventListener('pointermove', OnPointerMove);
    state.cardElm.addEventListener('pointerup', OnPointerUp);
    state.cardElm.addEventListener('touchmove', OnPointerMove);
    state.cardElm.addEventListener('touchend', OnPointerUp);

    if (state.updateRef === null) {
        state.updateRef = window.requestAnimationFrame(Update);
    }
}

function OnPointerMove(e) {
    e.stopPropagation();
    e.preventDefault();

    state.mov = {
        x: GetPageCoord(e).x - state.mouseDownPos.x,
        y: 0
    };
}

function OnPointerUp(e) {
    state.isDown = false;
    state.curPos.x += state.mov.x;
    state.curPos.y += state.mov.y;
    state.mov = {x:0,y:0};
    state.cardElm.removeEventListener('pointermove', OnPointerMove);
    state.cardElm.removeEventListener('pointerup', OnPointerUp);
    state.cardElm.removeEventListener('touchmove', OnPointerMove);
    state.cardElm.removeEventListener('touchend', OnPointerUp);
}

function Update(time) {
    // var falling = false;

    if (state.cardFalling) {
        var fallDuration = (time - state.fallTime) / 1000;
        if (fallDuration >= 0.3) {
            console.log('flip next card');
            return;
        }
        if (fallDuration >= 1.7) {
            document.body.removeChild(state.cardElm);
            return;
        }
        state.updateRef = window.requestAnimationFrame(Update);
        return;
    }

    if (!state.isDown) {
        var sign = Math.sign(state.pu);
        var pos = Math.abs(state.pu);
        if (pos < 0.7) {
            pos *= 0.2;
            // console.log('[UPD rel] pos', pos);
            var halfWidth = (state.movement.max - state.movement.min) * 0.5;
            // console.log((pos * sign * halfWidth));
            state.curPos.x = state.curCardInitPos.x - (pos * sign * halfWidth);

        } else {
            state.cardFalling = true;
            state.fallTime = time;
            state.cardElm.classList.add('fall_' + (sign > 0 ? 'right' : 'left'));

            // start timer fall
            // on timer done
                // remove card

            // start timer reveal
            // on timer done
                // load next card
                // flip
        }
    }

    // if (falling) {
    //     return;
    // }

    var x = state.curPos.x + state.mov.x;
    var y = state.curPos.y + state.mov.y;

    x = Clamp(x, state.movement.min, state.movement.max);

    state.pu = Map(x, state.movement.min, state.movement.max, -1, 1);
    // console.log('[UPD] pu', state.pu);

    state.cardElm.style[prefixTransform] = 'translate(' + x + 'px,' + y + 'px)'
        + ' rotate(' + (state.pu * 25) + 'deg)';

    state.updateRef = window.requestAnimationFrame(Update);
}

function GetPageCoord(e) {
    return {
        x: typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX,
        y: typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY
    };
}

function OnTransitionFromGame() {
    window.cancelAnimationFrame(state.updateRef);
    HideDots(config.axes);
    DisableButton('option_yes');
    DisableButton('option_no');
}

function OnTransitionToEndGame() {
    var killedBy = state.killedBy;
    var msgType = state.axisValues[killedBy] <= 0 ? 'low' : 'high';
    var endgame = config.axes[killedBy].endgame;

    document
        .getElementById('e_title')
        .innerHTML = endgame.title;
    document
        .getElementById('e_description')
        .innerHTML = endgame[msgType];

    EnableButton('e_retry');
}

function OnTransitionFromEndGame() {
    DisableButton('e_retry');
}

function OnStartGame() {
    TransitionTo('panel_game');
}

function OnRestartGame() {
    TransitionTo('panel_game');
}

function OnClickOptionYes() {
    state.curCard.cards.yes
        .forEach(function(card) {
            state.cardStacks[card.year].push(card);
        });

    SetAxisValue(state.curCard.influences.yes, function(axes) {
        return state.curCard.influences.yes[axes];
    });

    LoadNextCard();
}

function OnClickOptionNo() {
    state.curCard.cards.no
        .forEach(function(card) {
            state.cardStacks[card.year].push(card);
        });

    SetAxisValue(state.curCard.influences.no, function(axes) {
        return state.curCard.influences.no[axes];
    });

    LoadNextCard();
}

function LoadNextCard() {
    if (!ValidateGameState()) {
        state.killedBy = GetInvalidAxes();
        TransitionTo('panel_endgame');
    }

    if (state.curYear > config.maxYears) {
        console.log('The end');
        return;
    }

    // if (!HasMoreCards()) {
    //     state.cards = GetRandomCards(config.numCardsPerYear);
    //     state.curCard = 0;
    //     state.curYear += 1;
    //     HighlightCurYear();
    // }

    if (state.cardStacks[state.curYear].length === 0 ||
        state.cardCount >= config.numCardsPerYear) {

        ++state.curYear;

        if (state.curYear >= config.maxYears) {
            console.log('Reigned for '+config.maxYears+' years. Congrats!');
            return;
        }

        console.log('year', (state.curYear + 1));
        state.cardCount = 0;
        FillCardStack(state.curYear);
        state.curCard = GetCard(GetRandomCard(state.curYear));
        HighlightCurYear();
    }

    HideDots(config.axes);
    state.curCard = GetCard(GetRandomCard(state.curYear));
    ++state.cardCount;
    LoadCard(state.curCard);
}

function OnOverOptionYes() {
    ShowOption(state.curCard.options.yes);
    ShowDots(state.curCard.influences.yes);
}

function OnOverOptionNo() {
    ShowOption(state.curCard.options.no);
    ShowDots(state.curCard.influences.no);
}

function OnOutOptionYes() {
    HideOption();
    HideDots(config.axes);
}

function OnOutOptionNo() {
    HideOption();
    HideDots(config.axes);
}
