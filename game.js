var config;
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
        intro_btn_start: OnStartGame
    };

    fetch('config.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            config = json;
            console.log(config);
            state = {};
            Transition(null, 'panel_intro');
        });
}

function OnTransitionFromIntro() {
    DisableButton('intro_btn_start');
}

function OnTransitionToIntro() {
    EnableButton('intro_btn_start');
}

function OnTransitionFromGame() {
    console.log('from game');
}

function OnTransitionToGame() {
    console.log('to game');
}

function OnTransitionFromEndGame() {
    console.log('from endgame');
}

function OnTransitionToEndGame() {
    console.log('to endgame');
}

function OnStartGame() {
    Transition('panel_intro', 'panel_game');
}
