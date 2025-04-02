// Game configuration
const config = {
    initialBalance: 10000,
    blackjackPayout: 1.5, // 3:2 payout
    standardPayout: 1,
    dealerStandThreshold: 17
};

// Game state
const state = {
    balance: config.initialBalance,
    currentBet: 0,
    deck: [],
    playerHand: [],
    dealerHand: [],
    gameOver: false,
    canDouble: true
};

// DOM elements
const elements = {
    balance: document.getElementById('balance'),
    currentBet: document.getElementById('current-bet'),
    dealerScore: document.getElementById('dealer-score'),
    playerScore: document.getElementById('player-score'),
    dealerHand: document.getElementById('dealer'),
    playerHand: document.getElementById('player'),
    message: document.getElementById('message'),
    dealBtn: document.getElementById('deal-btn'),
    hitBtn: document.getElementById('hit-btn'),
    standBtn: document.getElementById('stand-btn'),
    doubleBtn: document.getElementById('double-btn'),
    clearBet: document.getElementById('clear-bet'),
    actionButtons: document.getElementById('action-buttons'),
    chipButtons: document.querySelectorAll('.chip'),
    rulesBtn: document.getElementById('rules-btn'),
    rulesModal: document.getElementById('rules-modal'),
    closeRules: document.getElementById('close-rules'),
    closeModal: document.querySelector('.close-modal'),
    resultModal: document.getElementById('result-modal'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    resultPayout: document.getElementById('result-payout'),
    newGameBtn: document.getElementById('new-game-btn')
};

// Card suits and values
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Initialize the game
function init() {
    createDeck();
    updateUI();
    setupEventListeners();
}

// Create and shuffle a new deck
function createDeck() {
    state.deck = [];
    for (let suit of suits) {
        for (let value of values) {
            state.deck.push({ suit, value });
        }
    }
    shuffleDeck();
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck() {
    for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
}

// Deal a card from the deck
function dealCard() {
    if (state.deck.length === 0) {
        createDeck();
    }
    return state.deck.pop();
}

// Calculate the score of a hand
function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (let card of hand) {
        if (card.value === 'A') {
            aces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }
    
    // Adjust for aces if score is over 21
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

// Check if hand is a blackjack
function isBlackjack(hand) {
    return hand.length === 2 && calculateScore(hand) === 21;
}

// Start a new round
function startRound() {
    if (state.currentBet <= 0) return;
    if (state.currentBet > state.balance) {
        showMessage("You don't have enough balance for this bet!");
        return;
    }
    
    // Reset game state
    state.playerHand = [];
    state.dealerHand = [];
    state.gameOver = false;
    state.canDouble = true;
    
    // Deduct bet from balance
    state.balance -= state.currentBet;
    
    // Deal initial cards
    state.playerHand.push(dealCard());
    state.dealerHand.push(dealCard());
    state.playerHand.push(dealCard());
    state.dealerHand.push(dealCard());
    
    // Update UI
    updateUI();
    elements.actionButtons.style.display = 'flex';
    elements.dealBtn.disabled = true;
    
    // Check for blackjack
    if (isBlackjack(state.playerHand)) {
        playerBlackjack();
    } else {
        showMessage("Your turn. Hit or Stand?");
    }
}

// Player hits (takes another card)
function playerHit() {
    if (state.gameOver) return;
    
    state.playerHand.push(dealCard());
    state.canDouble = false;
    updateUI();
    
    const playerScore = calculateScore(state.playerHand);
    
    if (playerScore > 21) {
        playerBust();
    } else if (playerScore === 21) {
        playerStand();
    }
}

// Player stands (ends their turn)
function playerStand() {
    if (state.gameOver) return;
    
    state.gameOver = true;
    state.canDouble = false;
    dealerTurn();
}

// Player doubles their bet and takes one more card
function playerDouble() {
    if (!state.canDouble || state.currentBet > state.balance) return;
    
    state.balance -= state.currentBet;
    state.currentBet *= 2;
    state.canDouble = false;
    
    playerHit();
    if (!state.gameOver) {
        playerStand();
    }
}

// Dealer's turn
function dealerTurn() {
    // Reveal dealer's hidden card
    updateUI(true);
    
    let dealerScore = calculateScore(state.dealerHand);
    
    // Dealer hits until 17 or higher
    while (dealerScore < config.dealerStandThreshold) {
        state.dealerHand.push(dealCard());
        dealerScore = calculateScore(state.dealerHand);
        updateUI(true);
    }
    
    // Determine winner
    determineWinner();
}

// Player gets blackjack
function playerBlackjack() {
    state.gameOver = true;
    const payout = Math.floor(state.currentBet * config.blackjackPayout);
    state.balance += state.currentBet + payout;
    
    showResult(
        "Blackjack!",
        "You got a Blackjack!",
        `You won $${payout}!`
    );
    
    updateUI(true);
}

// Player busts
function playerBust() {
    state.gameOver = true;
    showResult(
        "Bust!",
        "You went over 21!",
        `You lost $${state.currentBet}.`
    );
    updateUI(true);
}

// Determine the winner
function determineWinner() {
    const playerScore = calculateScore(state.playerHand);
    const dealerScore = calculateScore(state.dealerHand);
    let title, message, payout;
    
    if (dealerScore > 21) {
        // Dealer busts
        const winAmount = state.currentBet * config.standardPayout;
        state.balance += state.currentBet + winAmount;
        title = "Dealer Busts!";
        message = "Dealer went over 21!";
        payout = `You won $${winAmount}!`;
    } else if (playerScore > dealerScore) {
        // Player wins
        const winAmount = state.currentBet * config.standardPayout;
        state.balance += state.currentBet + winAmount;
        title = "You Win!";
        message = `Your ${playerScore} beats dealer's ${dealerScore}!`;
        payout = `You won $${winAmount}!`;
    } else if (playerScore < dealerScore) {
        // Dealer wins
        title = "You Lose!";
        message = `Dealer's ${dealerScore} beats your ${playerScore}!`;
        payout = `You lost $${state.currentBet}.`;
    } else {
        // Push (tie)
        state.balance += state.currentBet;
        title = "Push!";
        message = `It's a tie at ${playerScore}!`;
        payout = "Your bet has been returned.";
    }
    
    showResult(title, message, payout);
}

// Display a message in the message panel
function showMessage(msg, isError = false) {
    elements.message.textContent = msg;
    elements.message.className = 'message-panel ' + (isError ? 'lose-message' : '');
}

// Show result modal
function showResult(title, message, payout) {
    elements.resultTitle.textContent = title;
    elements.resultMessage.textContent = message;
    elements.resultPayout.textContent = payout;
    elements.resultModal.classList.add('show');
}

// Update the UI
function updateUI(showDealerCard = false) {
    // Update balance and bet
    elements.balance.textContent = state.balance;
    elements.currentBet.textContent = state.currentBet;
    
    // Update player hand and score
    elements.playerHand.innerHTML = '';
    state.playerHand.forEach(card => {
        elements.playerHand.appendChild(createCardElement(card));
    });
    elements.playerScore.textContent = calculateScore(state.playerHand);
    
    // Update dealer hand and score
    elements.dealerHand.innerHTML = '';
    if (state.dealerHand.length > 0) {
        // Show first card face down unless specified
        elements.dealerHand.appendChild(
            showDealerCard ? 
                createCardElement(state.dealerHand[0]) : 
                createCardBackElement()
        );
        
        // Show remaining cards
        for (let i = 1; i < state.dealerHand.length; i++) {
            elements.dealerHand.appendChild(createCardElement(state.dealerHand[i]));
        }
    }
    
    // Show dealer score only at end of game
    elements.dealerScore.textContent = showDealerCard ? 
        calculateScore(state.dealerHand) : 
        (state.dealerHand.length > 0 ? '?' : '0');
    
    // Enable/disable double button
    elements.doubleBtn.disabled = !state.canDouble || state.currentBet > state.balance;
    
    // Enable deal button if there's a bet and game isn't in progress
    elements.dealBtn.disabled = state.currentBet <= 0 || !state.gameOver && state.playerHand.length > 0;
}

// Create a card element
function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black'}`;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'card-value';
    valueEl.textContent = card.value;
    
    const suitEl = document.createElement('div');
    suitEl.className = 'card-suit';
    suitEl.innerHTML = getSuitSymbol(card.suit);
    
    cardEl.appendChild(valueEl);
    cardEl.appendChild(suitEl);
    
    return cardEl;
}

// Create a card back element
function createCardBackElement() {
    const cardEl = document.createElement('div');
    cardEl.className = 'card card-back';
    return cardEl;
}

// Get suit symbol
function getSuitSymbol(suit) {
    switch (suit) {
        case 'hearts': return '&hearts;';
        case 'diamonds': return '&diams;';
        case 'clubs': return '&clubs;';
        case 'spades': return '&spades;';
        default: return '';
    }
}

// Place a bet
function placeBet(amount) {
    amount = parseInt(amount);
    if (state.balance >= amount) {
        state.currentBet += amount;
        updateUI();
    } else {
        showMessage("You don't have enough balance!", true);
    }
}

// Clear the current bet
function clearBet() {
    state.currentBet = 0;
    updateUI();
}

// Reset the game
function resetGame() {
    state.playerHand = [];
    state.dealerHand = [];
    state.gameOver = true; // Allows new game to start
    updateUI();
    elements.actionButtons.style.display = 'none';
    showMessage("Place your bet to start a new game.");
}

// Set up event listeners
function setupEventListeners() {
    // Chip buttons
    elements.chipButtons.forEach(button => {
        button.addEventListener('click', () => placeBet(button.dataset.value));
    });
    
    // Clear bet button
    elements.clearBet.addEventListener('click', clearBet);
    
    // Deal button
    elements.dealBtn.addEventListener('click', startRound);
    
    // Game action buttons
    elements.hitBtn.addEventListener('click', playerHit);
    elements.standBtn.addEventListener('click', playerStand);
    elements.doubleBtn.addEventListener('click', playerDouble);
    
    // Rules modal
    elements.rulesBtn.addEventListener('click', () => {
        elements.rulesModal.classList.add('show');
    });
    
    elements.closeRules.addEventListener('click', () => {
        elements.rulesModal.classList.remove('show');
    });
    
    elements.closeModal.addEventListener('click', () => {
        elements.rulesModal.classList.remove('show');
    });
    
    // Result modal
    elements.newGameBtn.addEventListener('click', () => {
        elements.resultModal.classList.remove('show');
        resetGame();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === elements.rulesModal) {
            elements.rulesModal.classList.remove('show');
        }
        if (e.target === elements.resultModal) {
            elements.resultModal.classList.remove('show');
            resetGame();
        }
    });
}
// Add this with your other DOM elements


// Add this with your other event listeners

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
