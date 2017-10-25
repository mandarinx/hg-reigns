function Transition(from_panel, to_panel) {
    if (from_panel !== null) {
        var fpanel = document.getElementById(from_panel);
        fpanel.classList.remove('show');
        transitions[from_panel].from();
    }
    var tpanel = document.getElementById(to_panel);
    tpanel.classList.add('show');
    transitions[to_panel].to();
}

function EnableButton(id) {
    var elm = document.getElementById(id);
    if (typeof elm === 'undefined') {
        console.error('Cannot add click handler to '+id+' because it cannot be found');
        return;
    }
    elm.addEventListener('click', buttons[id]);
}

function DisableButton(id) {
    var elm = document.getElementById(id);
    if (typeof elm === 'undefined') {
        console.error('Cannot remove click handler from '+id+' because it cannot be found');
        return;
    }
    elm.removeEventListener('click', buttons[id]);
}
