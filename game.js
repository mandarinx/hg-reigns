var config;
var cards;
var state = {};
var transitions = {};
var btnClickHandlers = {};
var btnMouseOverHandlers = {};
var btnMouseOutHandlers = {};

function OnLoad() {
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

    ClearCard();
    LoadCard(GetCurCard());
    ResetYears();
    HighlightCurYear();

    EnableButton('option_yes');
    EnableButton('option_no');
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
