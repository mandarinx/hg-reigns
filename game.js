var config;
var cards;
var state = {};
var transitions = {};
var buttons = {};

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

    buttons = {
        i_btn_start: OnStartGame
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

    CreateAxesDOMElements(config.axes);

    ClearCard();
    var curCardName = state.cards[state.curCard];
    LoadCard(cards[curCardName]);
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
