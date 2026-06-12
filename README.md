# Memory Game — DDJW 2526

## Introducció

Joc de memòria implementat amb JavaScript, jQuery i HTML Canvas com a treball individual. El projecte parteix de la base feta a classe i l'amplia amb dos modes de joc, grups variables, sistema de puntuació amb rànquing, cartes en SVG i un sistema de guardar i carregar partides.

---

## Descripció del disseny del joc

### Cartes

Totes les cartes han estat programades en SVG. Hi ha 6 cartes diferents: cercle vermell (`cr.svg`), quadrat vermell (`sr.svg`), triangle vermell (`tr.svg`), cercle blau (`cb.svg`), quadrat blau (`sb.svg`) i triangle blau (`tb.svg`), més la part d el darrera (`back.svg`). Cada carta té fons fosc amb una forma geomètrica.

### Mida de grup

La mida de grup determina quantes cartes iguals cal trobar per encertar un grup: parelles (×2), trios (×3) o quartets (×4). En Mode 1 es configura manualment des de les opcions. En Mode 2 augmenta automàticament amb el nivell. La lògica acumula les cartes seleccionades en un array `selected[]` i comprova quan arriba a la mida correcta.

### Mode 1 — Partida normal

El jugador configura la partida en el menu opcions:
- **Nombre de cartes**: 2, 4 o 6
- **Dificultat**: baixa (penalització 10, volteo 1200ms), normal (25, 1000ms) o alta (50, 600ms)
- **Mida de grup**: parelles, trios o quartets

La puntuació inicial escala automàticament en funció del nombre de cartes i la penalització (`numParells × groupSize × 2 × penalty`), de manera que sempre hi hagi marge per equivocar-se. La partida acaba quan s'encerten tots els grups o la puntuació arriba a 0. La puntuació nomes es guarda al rànquing del Mode 1 si el jugador guanya.

### Mode 2 — Supervivència

Mode sense fi on la dificultat augmenta progressivament:

| Paràmetre | Comportament |
|-----------|-------------|
| Parells únics | Puja de 2 fins a un màxim de 6 |
| Penalització | Augmenta 5 cada dos nivells |
| Temps de volteo | Baixa de 1000ms fins a un mínim de 300ms |
| Mida de grup | ×2 fins al nivell 4, ×3 del 5 al 9, ×4 a partir del 10 |

En lloc de punts que baixen, el jugador disposa de **3 vides**. Cada error en treu una. En perdre les 3 vides s'acaba la partida i es guarda sempre la puntuació al rànquing del Mode 2. La puntuació s'acumula per nivell: `nivell × 100 + vides restants × 50`.

### Puntuació i Rànquing

Els rànquings del Mode 1 i Mode 2 es guarden per separat a `localStorage` (`ranking_mode1` i `ranking_mode2`). Cada entrada inclou l'àlies, la puntuació, el nivell assolit i la data. Es mantenen les 10 millors puntuacions de cada mode.

### Sistema de guardar i carregar

Cada partida té un `saveId` únic. Si el jugador guarda una partida que ja havia carregat, es sobreescriu la mateixa entrada en lloc de crear-ne una de nova. Des del menú principal es pot veure la llista de partides guardades, carregar-ne una o eliminar-la.

---

## Descripció de les parts més rellevants de la implementació

### `js/memory.js` — Lògica del joc

Conté tot l'estat i la lògica de la partida desacoblada del canvas.

**`_buildItems(numPairs)`** — construeix el tauler replicant les cartes úniques `groupSize` vegades i barrejant-les. Substitueix la duplicació simple (×2) original per suportar trios i quartets.

**`click(indx)`** — acumula les cartes seleccionades a `selected[]`. Quan `selected.length === groupSize` comprova si totes les cartes apunten al mateix recurs. Si encerten, les marca com a `DONE` i comprova si la partida ha acabat. Si fallen, espera 800ms (perquè el jugador vegi les cartes), les gira i comprova si cal acabar la partida. El bloqueig amb `locked` evita clics durant aquest interval.

**`levelParams(level)`** — funció pura que calcula els paràmetres del Mode 2 per a qualsevol nivell, sense efectes secundaris.

**`start()`** — reseteja `ready` a 0 i programa els `setTimeout` per girar les cartes una a una. Les cartes ja encertades (`DONE`) compten directament sense setTimeout.

**`_endGame(won)`** — unifica el final de partida dels dos modes. Guarda al rànquing corresponent i redirigeix a `endgame.html` passant el resultat per `sessionStorage`.

**`save()`** — usa `saveId` per detectar si la partida ja existia i sobreescriure-la, o afegir-ne una de nova.

### `js/canvasgame.js` — Motor gràfic

**Cache d'imatges `imgCache`** — guarda `{ img, ready }` per a cada path. El flag `ready` s'activa a `onload`, independentment de `naturalWidth` (que per als SVGs sempre és 0 i causava que no es dibuixessin).

**`waitAndStart()`** — espera que totes les imatges del tauler estiguin carregades abans de cridar `startGame()`. Evita que les cartes apareguin com a placeholders al principi.

**`buildBoard()`** — col·loca les cartes en una graella automàtica (màxim 6 columnes) i redimensiona el canvas per encabir-les totes. Cada carta registra un callback amb `initCard()` que `memory.js` crida quan cal girar la carta.

**Coordenades de clic escalades** — el canvas pot tenir una mida interna diferent a la mida visual per CSS. S'aplica `scaleX = canvas.width / rect.width` per corregir les coordenades i evitar que es cliqui la carta equivocada.

**`rebuildBoard()`** — callback cridat per `memory.js` quan el Mode 2 puja de nivell. Reconstrueix el tauler sense recarregar la pàgina.

**Banner animat** — quan es puja de nivell o es perd una vida apareix un text al canvas amb fade-out suau (`alpha -= 0.025` per frame).

### `js/main.js` — Menú principal

Gestiona quatre seccions (menú, selector de mode, puntuacions, partides guardades) que s'intercanvien sense recarregar la pàgina. La pantalla de partides guardades permet carregar i eliminar partides individuals.

---

## Conclusions i problemes trobats

**SVGs en canvas** — els SVGs tenen `naturalWidth = 0` perquè no tenen dimensions intrínseques. Això feia que el codi original comprovés `naturalWidth === 0` per detectar imatges no carregades i mostrés sempre el placeholder. La solució va ser usar un flag `ready` propi activat per `onload`.

**Coordenades de clic** — quan el CSS limita l'amplada del canvas (`max-width`), les coordenades del clic no coincideixen amb les posicions internes del canvas. Es va corregir multiplicant per `canvas.width / rect.width`.

**Mida de grup** — el canvi principal respecte al codi original va ser passar de comparar dues cartes (`lastCard`) a gestionar un array `selected[]` de mida variable. Cal bloquejar el tauler (`locked`) mentre les cartes incorrectes es giren per evitar clics que corromprien l'estat.

**Sobreescriptura de partides** — el sistema inicial sempre feia `push` creant entrades duplicades cada cop que el jugador guardava. La solució va ser afegir un `saveId` únic i usar `findIndex` per decidir si sobreescriure o afegir.

**Score inicial Mode 1** — un score fix de 200 no escalava bé amb configuracions difícils (quartets, dificultat alta). Es va substituir per un càlcul dinàmic basat en el nombre total de cartes i la penalització.

**Reinici entre nivells (Mode 2)** — reconstruir el tauler sense recarregar la pàgina va requerir netejar i tornar a inicialitzar `setValue[]` (els callbacks que connecten `memory.js` amb les textures del canvas) a cada `initLevel`.
