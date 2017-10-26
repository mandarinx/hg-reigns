var config;
var cards;
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
                curCard: 0,
                curYear: 0,
                // the names of the cards picked out for current play through
                cards: [],
                // references to various DOM elements beloning to an axis,
                // indexed by axis name
                axisElms: {},
                // the values of each axis, indexed by axis name
                axisValues: {},
                // the axes that killed you
                killedbBy: null,
                // Reference to the update method
                updateRef: null,
                // The coordinates of the mousedown event
                mouseDownPos: {
                    x: -1, y: -1
                },
                // Reference to the card DOM element
                cardElm: null,
                // The dimensions of the card
                curCardSize: null,
                // The card's position as defined by the CSS transform property
                // curCardPos: null,
                // The card's position on page load
                curCardInitPos: null,
                // The card's next position
                newCardPos: null,
                // True when pointer is down
                isDown: false,
                // The position of the card as a unit size between -1 and 1
                positionUnit: 0,
                movement: null
            };
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
    state.cards = GetRandomCards(config.numCardsPerYear);
    state.curCard = 0;
    state.curYear = 0;

    SetAxes(config.axes);
    SetAxisValue(state.axisElms, config.axesStartValue);

    document
        .getElementById('card_image')
        .setAttribute('draggable', false);

    ClearCard();
    LoadCard(GetCurCard());
    ResetYears();
    HighlightCurYear();

    state.cardElm = document.getElementById('card');

    var cardRect = state.cardElm.getBoundingClientRect();
    state.curCardSize = {
        x: cardRect.width,
        y: cardRect.height
    };
    state.curCardInitPos = {
        x: cardRect.left,
        y: cardRect.top
    };
    state.curPos = state.curCardInitPos;

    state.cardElm.addEventListener('pointerdown', OnPointerDown);
    state.cardElm.addEventListener('touchstart', OnPointerDown);
}

function OnPointerDown(e) {
    if (typeof e.button !== 'undefined' && e.button !== 0) {
        return;
    }

    e.stopPropagation();
    e.preventDefault();

    // state.isDown = true;

    var panelRect = document
        .getElementById('panel_game')
        .getBoundingClientRect();
    var padding = panelRect.width * 0.15;

    state.movement = {};
    state.movement.min = panelRect.left + padding;
    state.movement.max = panelRect.width - state.curCardSize.x + panelRect.left - padding;
    state.movement.len = state.movement.max - state.movement.min;

    var coord = GetPageCoord(e);
    state.mouseDownPos = coord;
    console.log('mouseDownPos', state.mouseDownPos);
    // var dt = Clamp((coord.x - state.mouseDownPos.x) / state.movement.len, -1, 1);
    // console.log('dt', dt);

    state.mov = {
        x: coord.x - state.mouseDownPos.x,
        y: 0
    };

    // state.newCardPos = {
    //     x: state.curCardInitPos.x + dt * (state.movement.len / 2),
    //     // x: (coord.x - state.mouseDownPos.x) + state.curCardInitPos.x,
    //     y: state.curCardInitPos.y
    // };
    // // Position as a screen size independent unit (-1 to 1)
    // state.positionUnit = Map(state.newCardPos.x - state.movement.min,
    //                          0, state.movement.len,
    //                          -1, 1);
    // console.log('pu', state.positionUnit);

    PositionCard();

    var body = document.body;
    body.insertBefore(state.cardElm, body.firstChild);

    state.cardElm.classList.add('absolute');

    state.cardElm.addEventListener('pointermove', OnPointerMove);
    state.cardElm.addEventListener('pointerup', OnPointerUp);
    state.cardElm.addEventListener('touchmove', OnPointerMove);
    state.cardElm.addEventListener('touchend', OnPointerUp);

    // state.updateRef = window.requestAnimationFrame(Update);
}

function OnPointerMove(e) {
    // if (!state.isDown) {
    //     return;
    // }

    e.stopPropagation();
    e.preventDefault();

    var coord = GetPageCoord(e);

    state.mov = {
        x: coord.x - state.mouseDownPos.x,
        y: 0
    };
    console.log('mov', state.mov.x);

    PositionCard();
    // var dt = Clamp((coord.x - state.mouseDownPos.x) / state.movement.len, -1, 1);
    //  // console.log('dt', dt);
    // console.log('mov', coord.x - state.mouseDownPos.x);

    // state.newCardPos.x = (coord.x - state.mouseDownPos.x) + state.curCardInitPos.x;
    // state.newCardPos.x = state.curCardInitPos.x + Clamp(dt, -1, 1) * (state.movement.len / 2);

    // if (state.newCardPos.x > state.movement.max) {
    //     state.newCardPos.x = state.movement.max;
    // }
    // if (state.newCardPos.x < state.movement.min) {
    //     state.newCardPos.x = state.movement.min;
    // }

    // // Position as a screen size independent unit (-1 to 1)
    // state.positionUnit = Map(state.newCardPos.x - state.movement.min,
    //                          0, state.movement.len,
    //                          -1, 1);
}

function OnPointerUp(e) {
    // state.isDown = false;
    state.curPos.x += state.mov.x;
    state.curPos.y += state.mov.y;
    state.cardElm.removeEventListener('pointermove', OnPointerMove);
    state.cardElm.removeEventListener('pointerup', OnPointerUp);
    window.cancelAnimationFrame(state.updateRef);
    state.updateRef = null;
}

function Update() {
    // if (!state.isDown) {
    //     // var sign = Math.sign(state.positionUnit);
    //     // var pos = Math.abs(state.positionUnit);
    //     // // state.positionUnit = EaseOutQuad(pos - 0.1) * sign;
    //     // state.positionUnit = state.positionUnit * 0.1;
    //     // // state.newCardPos.x = maxMoveX;
    //     // console.log(state.positionUnit);
    //     // PositionCard();
    //     state.updateRef = window.requestAnimationFrame(Update);
    //     return;
    // }

    PositionCard();
    state.updateRef = window.requestAnimationFrame(Update);
}

function PositionCard() {
    console.log(state.curPos.x + state.mov.x);
    state.cardElm.style[prefixTransform] = 'translate(' +
        state.curPos.x + state.mov.x + 'px,' +
        state.curPos.y + state.mov.y + 'px)'
        // state.newCardPos.x + 'px,' +
        // state.newCardPos.y + 'px) '
        + ' translateZ(0)';
        // + ' rotate(' + (state.positionUnit * 25) + 'deg)';
}

function GetPageCoord(e) {
    return {
        x: typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX,
        y: typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY
    };
}

function getTranslateX(el) {
    var x = getComputedStyle(el, null)
        .getPropertyValue('transform')
        .split(',')[4];

    return parseInt(typeof x === 'undefined' ? 0 : x);
}

function OnTransitionFromGame() {
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
    var card = GetCurCard();
    SetAxisValue(card.influences.yes, function(axes) {
        return card.influences.yes[axes];
    });
    LoadNextCard();
}

function OnClickOptionNo() {
    var card = GetCurCard();
    SetAxisValue(card.influences.no, function(axes) {
        return card.influences.no[axes];
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

    state.curCard += 1;

    if (!HasMoreCards()) {
        state.cards = GetRandomCards(config.numCardsPerYear);
        state.curCard = 0;
        state.curYear += 1;
        HighlightCurYear();
    }

    HideDots(config.axes);
    LoadCard(GetCurCard());
}

function OnOverOptionYes() {
    var card = GetCurCard();
    ShowOption(card.options.yes);
    ShowDots(card.influences.yes);
}

function OnOverOptionNo() {
    var card = GetCurCard();
    ShowOption(card.options.no);
    ShowDots(card.influences.no);
}

function OnOutOptionYes() {
    var card = GetCurCard();
    HideOption();
    HideDots(config.axes);
}

function OnOutOptionNo() {
    var card = GetCurCard();
    HideOption();
    HideDots(config.axes);
}
