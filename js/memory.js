const resources = [
    '../resources/cr.svg',
    '../resources/sr.svg',
    '../resources/tr.svg',
    '../resources/cb.svg',
    '../resources/sb.svg',
    '../resources/tb.svg'
];
const back = '../resources/back.svg';

const StateCard = Object.freeze({
    DISABLE: 0,
    ENABLE:  1,
    DONE:    2
});

var game = {
    items:     [],
    states:    [],
    setValue:  null,
    ready:     0,
    selected:  [],   // array d'índexs seleccionats (substitueix lastCard)
    score:     200,
    groups:    0,    // nombre de grups que queden per encertar
    groupSize: 2,    // 2 = parelles, 3 = trios, 4 = quartets
    locked:    false,

    goBack: function (idx) {
        this.setValue && this.setValue[idx](back);
        this.states[idx] = StateCard.ENABLE;
    },
    goFront: function (idx) {
        this.setValue && this.setValue[idx](this.items[idx]);
        this.states[idx] = StateCard.DISABLE;
    },

    select: function () {
        // Llegir opcions guardades
        const opts = localStorage.options ? JSON.parse(localStorage.options) : {};
        const mode = parseInt(sessionStorage.mode) || 1;

        if (sessionStorage.load) {
            // Carregar partida guardada
            const toLoad = JSON.parse(sessionStorage.load);
            this.items     = toLoad.items;
            this.states    = toLoad.states;
            this.selected  = toLoad.selected  || [];
            this.score     = toLoad.score;
            this.groups    = toLoad.groups;
            this.groupSize = toLoad.groupSize  || 2;
        } else {
            // Nova partida — llegir groupSize de les opcions
            this.groupSize = parseInt(
                mode === 2 ? (opts.groupSize2 || 2) : (opts.groupSize || 2)
            );
            const numPairs = parseInt(opts.pairs) || 2;

            // Agafar numPairs cartes úniques i replicar-les groupSize vegades
            let unique = resources.slice();
            shuffle(unique);
            unique = unique.slice(0, numPairs);

            this.items = [];
            for (let i = 0; i < this.groupSize; i++) {
                this.items = this.items.concat(unique);
            }
            shuffle(this.items);

            this.groups   = numPairs;           // quants grups queden
            this.states   = new Array(this.items.length).fill(StateCard.ENABLE);
            this.selected = [];
            this.score    = 200;
        }
    },

    start: function () {
        this.items.forEach((_, indx) => {
            if (this.states[indx] === StateCard.DISABLE ||
                this.states[indx] === StateCard.DONE) {
                this.ready++;
            } else {
                setTimeout(() => {
                    this.ready++;
                    this.goBack(indx);
                }, 1000 + 100 * indx);
            }
        });
    },

    click: function (indx) {
        if (this.locked) return;
        if (this.states[indx] !== StateCard.ENABLE) return;
        if (this.ready < this.items.length) return;
        if (this.selected.includes(indx)) return;

        this.goFront(indx);
        this.selected.push(indx);

        // Encara no tenim el grup complet
        if (this.selected.length < this.groupSize) return;

        // Grup complet — comprovar si totes les cartes son iguals
        const allMatch = this.selected.every(i => this.items[i] === this.items[this.selected[0]]);

        if (allMatch) {
            this.selected.forEach(i => { this.states[i] = StateCard.DONE; });
            this.groups--;
            this.selected = [];
            if (this.groups <= 0) {
                setTimeout(() => {
                    alert(`Has guanyat amb ${this.score} punts!`);
                    window.location.assign('../');
                }, 200);
            }
        } else {
            // Penalització i girar les cartes
            this.score -= 25;
            this.locked = true;
            const toFlip = this.selected.slice();
            this.selected = [];
            setTimeout(() => {
                toFlip.forEach(i => this.goBack(i));
                this.locked = false;
                if (this.score <= 0) {
                    alert('Has perdut');
                    window.location.assign('../');
                }
            }, 800);
        }
    },

    save: function () {
        const toSave = {
            items:     this.items,
            states:    this.states,
            selected:  this.selected,
            score:     this.score,
            groups:    this.groups,
            groupSize: this.groupSize,
            mode:      parseInt(sessionStorage.mode) || 1,
            alias:     sessionStorage.alias || 'Anònim',
            date:      Date.now()
        };

        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        saves.push(toSave);
        localStorage.setItem('saves', JSON.stringify(saves));
        console.info("Partida guardada en local.");
        window.location.assign('../');
    }
};

function shuffle(arr) {
    arr.sort(() => Math.random() - 0.5);
}

export var gameItems;
export function selectCards()  { game.select(); gameItems = game.items; }
export function clickCard(indx){ game.click(indx); }
export function startGame()    { game.start(); }
export function initCard(callback) {
    if (!game.setValue) game.setValue = [];
    game.setValue.push(callback);
}
export function saveGame() { game.save(); }
export function getScore() { return game.score; }
export function getGroupSize() { return game.groupSize; }