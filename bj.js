const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];

// Create and shuffle the deck
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Deal cards and update UI
function dealCard(player) {
    if (deck.length === 0) return;
    const card = deck.pop();
    console.log(`${player} receives ${card.value} of ${card.suit}`);
    return card;
}

function startGame() {
    document.getElementById("player").innerHTML = "";
    document.getElementById("dealer").innerHTML = "";
    createDeck();
    dealCard("player");
    dealCard("dealer");
    dealCard("player");
    dealCard("dealer");
}

// UI Setup
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("start-btn").addEventListener("click", startGame);
});
