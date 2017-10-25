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
                curCard: 0,
                // the names of the cards picked out for current play through
                cards: [],
                // references to various DOM elements beloning to an axis,
                // indexed by axis name
                axisElms: {}
            };
            Transition(null, config.startPanel);
        });
}

function OnTransitionToIntro() {
    EnableButton('i_btn_start');
}

function OnTransitionFromIntro() {
    DisableButton('i_btn_start');
}

function OnTransitionToGame() {
    state.cards = GetRandomCards(config.numCardsPerGame);
    state.curCard = 0;

    SetAxes(config.axes);

    ClearCard();
    LoadCard(GetCurCard());

    EnableButton('option_yes');
    EnableButton('option_no');
}

function OnTransitionFromGame() {
    console.log('from game');
}

function OnTransitionToEndGame() {
    console.log('to endgame');
}

function OnTransitionFromEndGame() {
    console.log('from endgame');
}

function OnStartGame() {
    Transition('panel_intro', 'panel_game');
}

function OnClickOptionYes() {
    var card = GetCurCard();

}

function OnClickOptionNo() {

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
    HideDots(card.influences.yes);
}

function OnOutOptionNo() {
    var card = GetCurCard();
    HideOption();
    HideDots(card.influences.no);
}
