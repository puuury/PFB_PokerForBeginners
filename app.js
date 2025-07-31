// Constants for suits and values
const SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
const SUIT_SYMBOLS = {
    Hearts: "&#9829;", // ♥
    Diamonds: "&#9830;", // ♦
    Clubs: "&#9827;", // ♣
    Spades: "&#9824;" // ♠
};

// Card class
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        return `${this.value}${SUIT_SYMBOLS[this.suit]}`;
    }
}

// Deck class
class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let suit of SUITS) {
            for (let value of VALUES) {
                this.cards.push(new Card(suit, value));
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        if (this.cards.length === 0) {
            throw new Error("No cards left in the deck!");
        }
        return this.cards.pop();
    }

    getRemainingCards() {
        return this.cards.length;
    }
}

// Player class
class Player {
    constructor(name, chips = 1000) {
        this.name = name;
        this.chips = chips;
        this.hand = [];
        this.isActive = true;
        this.currentBet = 0;
    }

    addCard(card) {
        this.hand.push(card);
    }

    bet(amount) {
        if (amount > this.chips) {
            throw new Error(`${this.name} does not have enough chips to bet ${amount}!`);
        }
        this.chips -= amount;
        this.currentBet += amount;
        return amount;
    }

    fold() {
        this.isActive = false;
        this.hand = [];
        this.currentBet = 0;
    }

    resetForRound() {
        this.isActive = true;
        this.currentBet = 0;
        this.hand = [];
    }

    getHand() {
        return this.hand;
    }

    toString() {
        return `${this.name}: ${this.chips} chips, Bet: ${this.currentBet}, Hand: [${this.hand.map(card => card.toString()).join(", ")}]`;
    }
}

// Game class
class Game {
    constructor(gameType, numOpponents) {
        if (!["Holdem", "Omaha"].includes(gameType)) {
            throw new Error("Invalid game type! Choose 'Holdem' or 'Omaha'.");
        }
        if (numOpponents < 1 || numOpponents > 7) {
            throw new Error("Number of opponents must be between 1 and 7!");
        }
        this.gameType = gameType;
        this.players = [new Player("You")];
        for (let i = 1; i <= numOpponents; i++) {
            this.players.push(new Player(`Opponent ${i}`));
        }
        this.deck = new Deck();
        this.communityCards = [];
        this.pot = 0;
        this.currentRound = "preflop";
        this.currentBet = 0;
        this.smallBlind = 10;
        this.bigBlind = 20;
    }

    startGame() {
        this.deck.reset();
        this.deck.shuffle();
        this.pot = 0;
        this.communityCards = [];
        this.currentRound = "preflop";
        this.currentBet = this.bigBlind;
        for (let player of this.players) {
            player.resetForRound();
        }
        this.dealPlayerCards();
        this.startBlinds();
    }

    dealPlayerCards() {
        const cardsPerPlayer = this.gameType === "Holdem" ? 2 : 4;
        for (let player of this.players) {
            player.hand = [];
            for (let i = 0; i < cardsPerPlayer; i++) {
                player.addCard(this.deck.deal());
            }
        }
    }

    startBlinds() {
        if (this.players.length < 2) {
            throw new Error("At least two players are required for blinds!");
        }
        this.players[0].bet(this.smallBlind);
        this.pot += this.smallBlind;
        this.players[1].bet(this.bigBlind);
        this.pot += this.bigBlind;
    }

    playerAction(player, action, amount = 0) {
        if (!player.isActive) {
            throw new Error(`${player.name} is not active!`);
        }
        if (action === "fold") {
            player.fold();
        } else if (action === "call") {
            const callAmount = this.currentBet - player.currentBet;
            if (callAmount > 0) {
                this.pot += player.bet(callAmount);
            }
        } else if (action === "raise") {
            if (amount <= this.currentBet) {
                throw new Error("Raise amount must be higher than current bet!");
            }
            const raiseAmount = amount - player.currentBet;
            this.pot += player.bet(raiseAmount);
            this.currentBet = amount;
        } else {
            throw new Error("Invalid action! Choose 'call', 'raise', or 'fold'.");
        }
    }

    dealCommunityCards(round) {
        if (round === "flop") {
            this.communityCards = [this.deck.deal(), this.deck.deal(), this.deck.deal()];
            this.currentRound = "flop";
        } else if (round === "turn") {
            this.communityCards.push(this.deck.deal());
            this.currentRound = "turn";
        } else if (round === "river") {
            this.communityCards.push(this.deck.deal());
            this.currentRound = "river";
        } else {
            throw new Error("Invalid round! Choose 'flop', 'turn', or 'river'.");
        }
        this.currentBet = 0;
        for (let player of this.players) {
            player.currentBet = 0;
        }
    }

    evaluateHand(player) {
        const hand = player.getHand().concat(this.communityCards);
        const values = hand.map(card => card.value);
        const suits = hand.map(card => card.suit);
        const valueCounts = {};
        const suitCounts = {};

        for (let value of values) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
        for (let suit of suits) {
            suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        }

        const valueOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

        for (let suit in suitCounts) {
            if (suitCounts[suit] >= 5) {
                const flushCards = hand.filter(card => card.suit === suit);
                const flushValues = flushCards.map(card => card.value).sort((a, b) => valueOrder.indexOf(b) - valueOrder.indexOf(a));
                return { rank: "Flush", value: flushValues[0] };
            }
        }

        const uniqueValues = [...new Set(values)].sort((a, b) => valueOrder.indexOf(a) - valueOrder.indexOf(b));
        for (let i = 0; i <= uniqueValues.length - 5; i++) {
            const slice = uniqueValues.slice(i, i + 5);
            if (slice.length === 5) {
                const indices = slice.map(v => valueOrder.indexOf(v));
                if (Math.max(...indices) - Math.min(...indices) === 4 && new Set(indices).size === 5) {
                    return { rank: "Straight", value: slice[slice.length - 1] };
                }
            }
        }
        if (uniqueValues.includes("Ace") && uniqueValues.includes("2") && uniqueValues.includes("3") && 
            uniqueValues.includes("4") && uniqueValues.includes("5")) {
            return { rank: "Straight", value: "5" };
        }

        for (let value in valueCounts) {
            if (valueCounts[value] >= 3) {
                return { rank: "Three of a Kind", value: value };
            }
        }

        for (let value in valueCounts) {
            if (valueCounts[value] >= 2) {
                return { rank: "Pair", value: value };
            }
        }

        let highCard = values[0];
        for (let value of values) {
            if (valueOrder.indexOf(value) > valueOrder.indexOf(highCard)) {
                highCard = value;
            }
        }
        return { rank: "High Card", value: highCard };
    }

    determineWinner() {
        if (this.currentRound !== "river") {
            throw new Error("Winner can only be determined after the river!");
        }
        let winner = null;
        let bestHand = null;
        const rankOrder = ["High Card", "Pair", "Three of a Kind", "Straight", "Flush"];

        for (let player of this.players) {
            if (player.isActive) {
                const handResult = this.evaluateHand(player);
                if (!bestHand || rankOrder.indexOf(handResult.rank) > rankOrder.indexOf(bestHand.rank)) {
                    winner = player;
                    bestHand = handResult;
                } else if (handResult.rank === bestHand.rank) {
                    const valueOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
                    if (valueOrder.indexOf(handResult.value) > valueOrder.indexOf(bestHand.value)) {
                        winner = player;
                        bestHand = handResult;
                    }
                }
            }
        }
        return winner ? `${winner.name} wins with ${bestHand.rank} (${bestHand.value})!` : "No winner!";
    }

    toString() {
        let result = `Game Type: ${this.gameType}\n`;
        result += `Pot: ${this.pot} chips\n`;
        result += `Current Bet: ${this.currentBet} chips\n`;
        result += `Community Cards: [${this.communityCards.map(card => card.toString()).join(", ")}]\n`;
        result += `Current Round: ${this.currentRound}\n`;
        result += "Players:\n";
        for (let player of this.players) {
            result += `  ${player.toString()}\n`;
        }
        return result;
    }
}

// UI Interaction
let game;

function startGame() {
    const gameType = document.getElementById("gameType").value;
    const numOpponents = parseInt(document.getElementById("numOpponents").value);
    game = new Game(gameType, numOpponents);
    game.startGame();
    updateGameState();
    document.querySelector(".game-setup").style.display = "none";
    document.querySelector(".game-state").style.display = "block";
}

function playerAction(action, amount) {
    game.playerAction(game.players[0], action, parseInt(amount));
    updateGameState();
}

function promptRaise() {
    const amount = prompt("Enter raise amount:");
    if (amount) {
        playerAction("raise", amount);
    }
}

function nextRound() {
    if (game.currentRound === "preflop") {
        game.dealCommunityCards("flop");
    } else if (game.currentRound === "flop") {
        game.dealCommunityCards("turn");
    } else if (game.currentRound === "turn") {
        game.dealCommunityCards("river");
        alert(game.determineWinner());
    }
    updateGameState();
}

function updateGameState() {
    document.getElementById("gameTypeDisplay").textContent = game.gameType;
    document.getElementById("potDisplay").textContent = game.pot;
    const communityCardsDisplay = document.getElementById("communityCardsDisplay");
    communityCardsDisplay.innerHTML = "";
    game.communityCards.forEach(card => {
        const cardDiv = document.createElement("div");
        cardDiv.className = `card ${card.suit.toLowerCase()}`;
        cardDiv.innerHTML = card.toString(); // Use innerHTML to render HTML entities
        communityCardsDisplay.appendChild(cardDiv);
    });
    document.getElementById("currentRoundDisplay").textContent = game.currentRound;
    const playersDisplay = document.getElementById("playersDisplay");
    playersDisplay.innerHTML = "";
    game.players.forEach(player => {
        const playerDiv = document.createElement("div");
        playerDiv.innerHTML = `<strong>${player.name}:</strong> ${player.chips} chips, Bet: ${player.currentBet}<br>`;
        const handDiv = document.createElement("div");
        player.hand.forEach(card => {
            const cardDiv = document.createElement("div");
            cardDiv.className = `card ${card.suit.toLowerCase()}`;
            cardDiv.innerHTML = card.toString(); // Use innerHTML to render HTML entities
            handDiv.appendChild(cardDiv);
        });
        playerDiv.appendChild(handDiv);
        playersDisplay.appendChild(playerDiv);
    });
}