var config;
var cards;
var cardIndex = [];
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
                cardStacks: [[],[],[],[],[]]
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
    var endgame = config.axes[killedBy].endgame[msgType];
    
    var axes = document.getElementById("g_axes").cloneNode(true);
	axes.id = "e_axes";
    document.getElementById("e_axes").replaceWith(axes);
    
    var years = document.getElementById("g_progress_years").cloneNode(true);
	years.id = "e_progress_years";
    document.getElementById("e_progress_years").replaceWith(years);    

    document
        .getElementById('e_title')
        .innerHTML = endgame.title;
    document
        .getElementById('e_description')
        .innerHTML = endgame.text;
    document
        .getElementById('e_card_image')
        .src = "cards/"+endgame.image+".png";        

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
        
        // Wait for bars to transition before ending game
        setTimeout(()=>{
	        TransitionTo('panel_endgame');
        }, 500);
		return;
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
