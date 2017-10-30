var config;
var cards;
var cardIndex = [];
var state = {};
var transitions = {};
var btnClickHandlers = {};
var btnMouseOverHandlers = {};
var btnMouseOutHandlers = {};

var prefixTransform = 'transform';
var lastTouchEnd = 0;

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
                fallTime: 0,
                cardFlipped: false
            };

            CreateCardIndex();

            CreateAxesElements(config.axes);

            var a_parent = document.getElementById('e_axes');
            var a_childs = document.getElementById('g_axes').children;
            for (var i=0; i<a_childs.length; ++i) {
                var elm = a_childs[i].cloneNode(true);
                elm.id = 'e_' + a_childs[i].id;
                a_parent.appendChild(elm);
            }

            var y_parent = document.getElementById('e_progress_years');
            var y_childs = document.getElementById('g_progress_years').children;
            for (var i=0; i<y_childs.length; ++i) {
                var elm = y_childs[i].cloneNode(true);
                elm.id = 'e_' + y_childs[i].id;
                y_parent.appendChild(elm);
            }

            TransitionTo(config.startPanel);
        });


        // Still need these, because the other listeners only listens when clicking the cards
        document.body.addEventListener('touchmove',function(e){
			e.preventDefault();
		});

		document.addEventListener('touchend', function (event) {
		    var now = (new Date()).getTime();
		    if (now - lastTouchEnd <= 300) {
		        event.preventDefault();
		    }
		    lastTouchEnd = now;
		}, false);

}

function OnTransitionToIntro() {
    EnableButton('i_btn_start');
}

function OnTransitionFromIntro() {
    DisableButton('i_btn_start');
}

function OnTransitionToGame() {
    ResetAxesValues();

    Object.keys(state.axisElms).forEach(function(axis) {
        SetProgressBarValue(state.axisElms[axis].progressBar, state.axisValues[axis]);
    });

    state.mouseDownPos = {x:0,y:0};
    state.mov = {x:0,y:0};

    var panelRect = document
        .getElementById('panel_game')
        .getBoundingClientRect();
    var padding = panelRect.width * 0.15;

    state.pu = 0;
    ClearCardStacks();
    state.killedBy = null;
    state.curYear = 0;
    state.cardCount = 0;
    FillCardStack(state.curYear);
    state.curCard = GetCard(GetRandomCard(state.curYear));

    CreateCard(document.getElementById('card_wrapper'), state.curCard, function(){
	    SetCurCard('card_cur');

	    var cardRect = state.cardElm.getBoundingClientRect();
	    state.movement = {};
	    state.movement.min = panelRect.left + padding;
	    state.movement.max = panelRect.left + panelRect.width - padding - cardRect.width;
	    state.movement.len = state.movement.max - state.movement.min;

	    state.curCardInitPos = {
	        x: cardRect.left,
	        y: cardRect.top
	    };
	    state.curPos = state.curCardInitPos;

	    SetAxesValue(config.axes, config.axesStartValue);
	    Object.keys(state.axisElms).forEach(function(axis) {
	        SetProgressBarValue(state.axisElms[axis].progressBar, state.axisValues[axis]);
	    });

	    ClearCard();
	    LoadCard(state.curCard, document.getElementById('card_cur'));
	    ResetYears();
	    HighlightCurYear();

		document.addEventListener('mousedown', OnPointerDown);
	    document.addEventListener('touchstart', OnPointerDown);

	    state.updateRef = null;
    });


}

function OnPointerDown(e) {

    if (typeof e.button !== 'undefined' && e.button !== 0) {
        return;
    }

    e.stopPropagation();
    e.preventDefault();

    state.isDown = true;
    state.mouseDownPos = GetPageCoord(e);
    state.mov = {x:0,y:0};
	state.curPos = state.curCardInitPos;

    document.body.insertBefore(state.cardElm, document.body.firstChild);
    state.cardElm.classList.add('absolute');

    document.addEventListener('mousemove', OnPointerMove);
    document.addEventListener('mouseup', OnPointerUp);
    document.addEventListener('touchmove', OnPointerMove);
    document.addEventListener('touchend', OnPointerUp);

	Update();

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
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 400) {
        event.preventDefault();
    }
    lastTouchEnd = now;

    state.isDown = false;
    state.curPos.x += state.mov.x;
    state.curPos.y += state.mov.y;
    state.mov = {x:0,y:0};
    document.removeEventListener('mousemove', OnPointerMove);
    document.removeEventListener('mouseup', OnPointerUp);
    document.removeEventListener('touchmove', OnPointerMove);
    document.removeEventListener('touchend', OnPointerUp);
}

function Update(time) {
    if (state.cardFalling) {
        var fallDuration = (time - state.fallTime) / 1000;
        var cardStack = document.getElementById('card_stack');


        if (fallDuration >= 0.5 &&
            state.killedBy !== null &&
            state.curPanel === 'panel_game') {
            TransitionTo('panel_endgame');
        }

        // Flip next card
        if (fallDuration >= 1.7 &&
            state.killedBy === null &&
            !state.cardFlipped) {
            state.cardFlipped = true;

            cardStack.setAttribute('class', 'card_stack flip');
            LoadCard(state.curCard, document.getElementById('card_next'));
        }


        // Kill falling card
        if (fallDuration >= 2) {
            state.cardFalling = false;

            if(state.cardElm!=null) document.body.removeChild(state.cardElm);

            if (state.killedBy === null) {
                CreateCard(document.getElementById('card_wrapper'), state.curCard,function(){
	                SetCurCard('card_cur');
					document.addEventListener('mousedown', OnPointerDown);
	                document.addEventListener('touchstart', OnPointerDown);

	                var imgNext = document
		                .getElementById('card_next')
		                .querySelector('img')
		                .setAttribute('src', 'cards/empty.png');

		            cardStack.setAttribute('class', 'card_stack flipimmediate');



                });

	            window.cancelAnimationFrame(state.updateRef);
	            state.updateRef = null;

	            state.mouseDownPos = {x:0,y:0};
	            state.mov = {x:0,y:0};
	            state.curPos = state.curCardInitPos;
	            state.cardElm.style[prefixTransform] = 'translate(0px,0px) rotate(0deg)';
            }

            return;
        }

        state.updateRef = window.requestAnimationFrame(Update);
        return;
    }

    var sign = Math.sign(state.pu);
    var pos = Math.abs(state.pu);
    var side = sign > 0 ? 'right' : 'left';
    var option = sign > 0 ? 'yes' : 'no';

    if (!state.isDown) {
        // pull back card to center
        if (pos < 0.5) {
            pos *= 0.2;
            var halfWidth = (state.movement.max - state.movement.min) * 0.5;
            state.curPos.x = state.curCardInitPos.x - (pos * sign * halfWidth);

        // let the card fall
        } else {
            state.cardFalling = true;
            state.fallTime = time;
            state.cardElm.classList.add('fall_' + side);

            state.curCard.cards[option]
                .forEach(function(card) {
                    state.cardStacks[card.year].push(card);
                });

            SetAxesValue(state.curCard.influences[option], function(axes) {
                return state.curCard.influences[option][axes];
            });

            Object.keys(state.axisElms).forEach(function(axis) {
                SetProgressBarValue(state.axisElms[axis].progressBar, state.axisValues[axis]);
            });

            if (!ValidateGameState()) {
                state.killedBy = GetInvalidAxes();
                console.log('killed by: '+state.killedBy);
            }

            document.removeEventListener('mousedown', OnPointerDown);
            document.removeEventListener('touchstart', OnPointerDown);

            if (state.killedBy === null) {
                LoadNextCard();
            }

            HideDots(config.axes);
            HideOption();
        }
    }

    state.cardFlipped = false;
    var x = state.curPos.x + state.mov.x;
    var y = state.curPos.y + state.mov.y;

    x = Clamp(x, state.movement.min, state.movement.max);

    state.pu = Map(x, state.movement.min, state.movement.max, -1, 1);

    state.cardElm.style[prefixTransform] = 'translate(' + x + 'px,' + y + 'px)'
        + ' rotate(' + (state.pu * 25) + 'deg)';

    if (pos >= 0.5 && !state.cardFalling) {
        ShowOption(state.curCard.options[option]);
        ShowDots(state.curCard.influences[option]);
    } else {
        HideDots(config.axes);
        HideOption();
    }

    state.updateRef = window.requestAnimationFrame(Update);
}

function GetPageCoord(e) {
    return {
        x: typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX,
        y: typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY
    };
}

function OnTransitionFromGame() {
    document.removeEventListener('mousedown', OnPointerDown);
    document.removeEventListener('touchstart', OnPointerDown);
    window.cancelAnimationFrame(state.updateRef);
    HideDots(config.axes);
}

function OnTransitionToEndGame() {

    // Copy axis values
    Object.keys(state.axisValues).forEach(function(axis) {
        var elm = document.getElementById('e_axes')
            .querySelector('#e_' + axis + ' .progress > div');
        SetProgressBarValue(elm, state.axisValues[axis]);
    });

    // Copy years
    for (var i = 0; i < state.curYear + 1; ++i) {
        document
            .getElementById('e_progress_years')
            .querySelector('#e_year_' + i)
            .setAttribute('class', 'g_year selected');
    }

    var killedBy = state.killedBy;
	if(killedBy==null) {
		document
	        .getElementById('e_title')
	        .innerHTML = config.win.title;
	    document
	        .getElementById('e_description')
	        .innerHTML = config.win.text;
	    document
	        .getElementById('e_card_image')
	        .src = "cards/"+config.win.image+".png";

	} else {
	    var msgType = state.axisValues[killedBy] <= 0 ? 'low' : 'high';
	    var endgame = config.axes[killedBy].endgame[msgType];


	    document
	        .getElementById('e_title')
	        .innerHTML = endgame.title;
	    document
	        .getElementById('e_description')
	        .innerHTML = endgame.text;
	    document
	        .getElementById('e_card_image')
	        .src = "cards/"+endgame.image+".png";
    }

    EnableButton('e_retry');
}

function OnTransitionFromEndGame() {
    DisableButton('e_retry');
}

function OnStartGame() {
    TransitionTo('panel_game');
}

function OnRestartGame() {
    TransitionTo('panel_intro');
}

function LoadNextCard() {
    if (state.curYear >= config.maxYears) {
        TransitionTo('panel_endgame');
        return;
    }

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
}
