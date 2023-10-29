// Variables
let deck_id;
let playerChips = 50;
let pot = 0;
let aceValue = null;
// Elements
let resultElement;
let drawButton;
let betButton;
let newGameButton;
document.addEventListener('DOMContentLoaded', function() {
  resultElement = document.getElementById('result');
  drawButton = document.getElementById('draw-button');
  betButton = document.getElementById('bet-button');
  newGameButton = document.getElementById('new-game-button');
  // Event listeners for Ace high or low buttons
  Array.from({ length: 2 }, (_, i) => i * 2 + 1).forEach(cardNumber => {
    ['high', 'low'].forEach(type => {
      const button = document.getElementById(`ace-${type}-button-${cardNumber}`);
      if (button) {
        button.addEventListener('click', function() {
          aceValue = (type === 'high') ? 14 : 1;
          displayAceButtons(cardNumber, 'none');
        });
      } else {
        console.error(`Button with id ace-${type}-button-${cardNumber} not found`);
      }
    });
  });
  // Shuffle deck
  shuffleDeck();
  // Event listener for rules button
  let rulesButton = document.getElementById('rules-button');
  let rules = `Rank of Cards
A (high), K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2, A (low).

Object of the Game
The goal is to be the player with the most chips at the end of the game.

The Ante
50 Chips are distributed to the player, and the player puts one chip in the center of the table to form a pool or pot.


The Betting
The player may bet up to the entire pot or any portion of the number of chips in the pot, but they must always bet a minimum of one chip. When the player has placed a bet, the dealer turns up the top card from the pack and places it between the two cards already face up. If the card ranks between the two cards already face up, the player wins and takes back the amount of his bet plus an equivalent amount from the pot. If the third card is not between the face-up cards, the player loses his bet, and it is added to the pot. If the card turned up is the same as either of the two face up cards, the player must re-pay their initial bet. If the two face-up cards are the same, the player wins two chips and, again, no third card is turned up. 

"Acey-Deucey" (ace, 2) is the best combination, and a player tends to bet the whole pot, if they can. This is because the only way an ace-deuce combination can lose is if the third card turned up is also an ace or a deuce.

After the first player has finished, the dealer clears away the cards and places them face down in a pile. The next player then places a bet, and the dealer repeats the same procedure until all the players, including the dealer, have had a turn.

If at any time, the pot has no more chips in it (because a player has "bet the pot" and won), each player again puts in one chip to restore the pot.

When every player has had a turn to bet, the deal passes to the player on the dealer's left, and the game continues.`;
  rulesButton.addEventListener('click', function() {
    alert(rules);
  });
  // Draw button event listener
  drawButton.addEventListener('click', function() {
    resultElement.textContent = '';
    dealInitialCards();
    betButton.disabled = false;
    drawButton.disabled = true;
  });
  // Bet button event listener
  betButton.addEventListener('click', function() {
    let playerBet = getBet(pot);
    pot += playerBet;
    updateDisplay();
    dealCards(1).then(([card2]) => {
      displayCard(card2, 'card2');
      let card1Element = document.getElementById('card1-image').firstElementChild;
      let card3Element = document.getElementById('card3-image').firstElementChild;
      let card1Value = card1Element ? getCardRank(card1Element.getAttribute('data-value'), '1') : null;
      let card2Value = getCardRank(card2.value);
      let card3Value = card3Element ? getCardRank(card3Element.getAttribute('data-value'), '3') : null;
      console.log('Card1 value attribute:', card1Value);
      console.log('Card3 value attribute:', card3Value);
      console.log('Card1 value:', card1Value);
      console.log('Card2 value:', card2Value);
      console.log('Card3 value:', card3Value);
      // checking if card2Value equals to card1Value or card3Value
      if (card2Value === card1Value || card2Value === card3Value) {
        playerChips -= playerBet;  // decrease player's chips by the bet
        pot += playerBet;  // add the bet to the pot
        resultElement.textContent = 'Lose! Darn. Same Card. Pay Double.';
      } else if (card2Value > Math.min(card1Value, card3Value) && card2Value < Math.max(card1Value, card3Value)) {
        let winnings = 2 * playerBet;
        winnings = (pot < winnings) ? pot : winnings;  // checking if pot < winnings and return pot instead
        playerChips += winnings;  // adding back to player's chip
        pot -= winnings;
        resultElement.textContent = 'Win! Nice.';
      } else {
        resultElement.textContent = 'Lose! Darn.';
      }
      updateDisplay();
      drawButton.disabled = (playerChips > 0) ? false : true;
      newGameButton.disabled = !drawButton.disabled;
    });
    betButton.disabled = true;
  });
  // New game button event listener
  newGameButton.addEventListener('click', function() {
    resultElement.textContent = '';
    playerChips = 50;
    pot = 0;
    updateDisplay();
    shuffleDeck();
    newGameButton.disabled = true;
  });
  // Listen for page loaded event
  document.addEventListener('DOMContentLoaded', (event) => {
    resultElement.textContent = '';
    shuffleDeck();
  });
});
// Shuffle deck function
async function shuffleDeck() {
  try {
    let response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
    let data = await response.json();
    deck_id = data.deck_id;
    document.getElementById('bet-button').disabled = false;
    await dealInitialCards();
  } catch (error) {
    console.error('Shuffle deck failed', error);
  }
}
// Deal cards
async function dealCards(count) {
  try {
    let response = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=${count}`);
    let data = await response.json();
    // check if there are fewer than 3 cards remaining
    if (data.remaining <= 3) {
      shuffleDeck();  // shuffle the deck if there are not enough cards
    }
    return data.cards;
  } catch (error) {
    console.error('Deal cards failed', error);
  }
}
// Deal the first and third cards
async function dealInitialCards() {
  try {
    let [card1, card3] = await dealCards(2);
    displayCard(card1, 'card1');
    displayCard(card3, 'card3');
    displayBackOfCard('card2');
    if (card1.value === card3.value) {
      playerChips += 2;
      updateDisplay();
      resultElement.textContent = 'Automatic Win! You got a pair. +2 chips.';
      betButton.disabled = true;
      setTimeout(function() {
        drawButton.disabled = false;
        resultElement.textContent = ''; // Clear the result message
        shuffleDeck();
      }, 2000);  // 2000 milliseconds = 2 seconds
      return;
    }
    if (card1.value === 'ACE') {
      displayAceButtons('1', 'block');
    } else if (card3.value === 'ACE') {
      displayAceButtons('3', 'block');
    }
  } catch (error) {
    console.error('Deal initial cards failed', error);
  }
}
// Get player bet
function getBet(potSize) {
  let bet = document.getElementById('bet-input').value;
  // validation
  bet = Math.max(1, Math.min(bet, potSize, playerChips));
  playerChips -= bet;
  return bet;
}
// Update chips and pot display
function updateDisplay() {
  document.getElementById('chips-count').textContent = playerChips;
  document.getElementById('pot-count').textContent = pot;
}
// Display card
function displayCard(card, elementId) {
  if (card && card.image) {
    let cardElement = document.getElementById(`${elementId}-image`);
    cardElement.innerHTML = '';
    let img = document.createElement('img');
    img.src = card.image;
    // Change 'data-value' attribute to the actual card value
    img.setAttribute('data-value', card.value);
    cardElement.appendChild(img);
  } else {
    console.error('Invalid card data');
  }
}
function displayBackOfCard(elementId) {
  let cardElement = document.getElementById(`${elementId}-image`);
  cardElement.innerHTML = '';
  let img = document.createElement('img');
  img.src = 'https://deckofcardsapi.com/static/img/back.png';
  cardElement.appendChild(img);
}
// Display Ace high or low buttons
function displayAceButtons(cardNumber, displayStyle) {
  ['high', 'low'].forEach(type => {
    let buttonId = `ace-${type}-button-${cardNumber}`;
    let buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
      buttonElement.style.display = displayStyle;
    } else {
      console.log(`Button with ID ${buttonId} not found`);
    }
  });
}
// Get card rank
function getCardRank(value) {
  if (value === 'ACE') {
    return aceValue; // use the value stored in aceValue for Ace card
  } else if (value === 'JACK') {
    return 11;
  } else if (value === 'QUEEN') {
    return 12;
  } else if (value === 'KING') {
    return 13;
  } else {
    return parseInt(value, 10);
  }
}