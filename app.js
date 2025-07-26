// Constants for suits and values
const SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

// Card class
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    // Returns a readable string representation of the card
    toString() {
        return `${this.value} of ${this.suit}`;
    }
}

// Deck class
class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    // Creates a fresh deck with 52 cards
    reset() {
        this.cards = [];
        for (let suit of SUITS) {
            for (let value of VALUES) {
                this.cards.push(new Card(suit, value));
            }
        }
    }

    // Shuffles the deck using Fisher-Yates algorithm
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // Deals one card from the top of the deck
    deal() {
        if (this.cards.length === 0) {
            throw new Error("No cards left in the deck!");
        }
        return this.cards.pop();
    }

    // Returns the number of cards left in the deck
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
        this.currentBet = 0; // Tracks the bet in the current round
    }

    // Adds a card to the player's hand
    addCard(card) {
        this.hand.push(card);
    }

    // Places a bet, reducing chips
    bet(amount) {
        if (amount > this.chips) {
            throw new Error(`${this.name} does not have enough chips to bet ${amount}!`);
        }
        this.chips -= amount;
        this.currentBet += amount;
        return amount;
    }

    // Folds the player out of the current round
    fold() {
        this.isActive = false;
        this.hand = [];
        this.currentBet = 0;
    }

    // Resets player for a new round
    resetForRound() {
        this.isActive = true;
        this.currentBet = 0;
        this.hand = [];
    }

    // Returns the player's current hand
    getHand() {
        return this.hand;
    }

    // Returns a readable string representation of the player
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
        this.currentBet = 0; // Tracks the highest bet in the round
        this.smallBlind = 10;
        this.bigBlind = 20;
    }

    // Starts the game by shuffling the deck, dealing cards, and collecting blinds
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

    // Deals cards to players based on game type
    dealPlayerCards() {
        const cardsPerPlayer = this.gameType === "Holdem" ? 2 : 4;
        for (let player of this.players) {
            player.hand = [];
            for (let i = 0; i < cardsPerPlayer; i++) {
                player.addCard(this.deck.deal());
            }
        }
    }

    // Collects small and big blinds
    startBlinds() {
        if (this.players.length < 2) {
            throw new Error("At least two players are required for blinds!");
        }
        // Small blind from first player
        this.players[0].bet(this.smallBlind);
        this.pot += this.smallBlind;
        // Big blind from second player
        this.players[1].bet(this.bigBlind);
        this.pot += this.bigBlind;
    }

    // Handles player actions (call, raise, fold)
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

    // Deals community cards for flop, turn, or river
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
        this.currentBet = 0; // Reset bet for new round
        for (let player of this.players) {
            player.currentBet = 0; // Reset player bets
        }
    }

    // Returns a readable string representation of the game state
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

// Test the Game class with betting
const game = new Game("Holdem", 2);
game.startGame();
console.log("After starting game:\n", game.toString());
game.playerAction(game.players[0], "call"); // You calls the big blind
game.playerAction(game.players[1], "call"); // Opponent 1 calls
game.playerAction(game.players[2], "raise", 50); // Opponent 2 raises to 50
console.log("After player actions:\n", game.toString());
game.dealCommunityCards("flop");
console.log("After flop:\n", game.toString());