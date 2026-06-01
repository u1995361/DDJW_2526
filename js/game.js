import {$} from "../library/jquery-4.0.0.slim.module.min.js";
import {clickCard, gameItems, selectCards, startGame, initCard, saveGame} from "./memory.js";

var game = $('#game');

selectCards();
gameItems.forEach(function (value, idx)
{
    game.append(`<img id="${idx}" title="card">`);  // Add element
    let card = $(`#${idx}`);                       // Obtain element
    card.on('click', function(){
        clickCard(idx);
    });
    card.attr('src', value);                  // Modify values   
    initCard(val => card.attr('src', val));        
});
startGame();

$('#save').on('click', ()=>saveGame());