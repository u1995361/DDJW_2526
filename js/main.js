addEventListener('load', function () {

    // --- Seccions ---
    const menuMain   = document.getElementById('menu-main');
    const menuMode   = document.getElementById('menu-mode');
    const menuScores = document.getElementById('menu-scores');

    let selectedMode = null;

    function show(section) {
        [menuMain, menuMode, menuScores].forEach(s => s.classList.add('hidden'));
        section.classList.remove('hidden');
    }

    // --- Menú principal ---
    document.getElementById('play').addEventListener('click', function () {
        show(menuMode);
    });

    document.getElementById('options').addEventListener('click', function () {
        window.location.assign('./html/options.html');
    });

    document.getElementById('saves').addEventListener('click', function () {
        const saves = JSON.parse(localStorage.getItem('saves') || '[]');
        if (saves.length === 0) {
            alert('No hi ha cap partida guardada.');
            return;
        }
        // Mostrar llista de partides guardades
        const choice = saves.map((s, i) =>
            `${i + 1}. ${s.alias || 'Anònim'} — Mode ${s.mode} — ${new Date(s.date).toLocaleDateString()}`
        ).join('\n');
        const idx = parseInt(prompt('Tria una partida:\n' + choice)) - 1;
        if (isNaN(idx) || idx < 0 || idx >= saves.length) return;
        sessionStorage.setItem('load', JSON.stringify(saves[idx]));
        window.location.assign('./html/canvasgame.html');
    });

    // --- Selector de mode ---
    document.getElementById('mode1').addEventListener('click', function () {
        selectedMode = 1;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });

    document.getElementById('mode2').addEventListener('click', function () {
        selectedMode = 2;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
    });

    document.getElementById('start-game').addEventListener('click', function () {
        if (!selectedMode) {
            alert('Tria un mode de joc!');
            return;
        }
        const alias = document.getElementById('alias').value.trim() || 'Anònim';
        sessionStorage.removeItem('load');
        sessionStorage.setItem('mode', selectedMode);
        sessionStorage.setItem('alias', alias);
        window.location.assign('./html/canvasgame.html');
    });

    document.getElementById('back-mode').addEventListener('click', function () {
        show(menuMain);
        selectedMode = null;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    });

    // --- Puntuacions ---
    document.getElementById('scores').addEventListener('click', function () {
        const ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
        const list = document.getElementById('scores-list');
        list.innerHTML = '';
        if (ranking.length === 0) {
            list.innerHTML = '<li class="no-scores">Encara no hi ha puntuacions.</li>';
        } else {
            ranking
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .forEach(entry => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="score-alias">${entry.alias}</span><span class="score-pts">${entry.score} pts</span>`;
                    list.appendChild(li);
                });
        }
        show(menuScores);
    });

    document.getElementById('back-scores').addEventListener('click', function () {
        show(menuMain);
    });

});
