let deck_id;
let playerChips = 100;
let pot = 0;
let aceValue = null;
let handHistory = [];
let card1, card2, card3;
// Elements
let resultElement;
let drawButton;
let bet1Button, bet5Button;
let newGameButton;
let shootThePotButton;

document.addEventListener('DOMContentLoaded', function() {
  resultElement = document.getElementById('result');
  drawButton = document.getElementById('draw-button');
  bet1Button = document.getElementById('bet-1-button');
  bet5Button = document.getElementById('bet-5-button');
  newGameButton = document.getElementById('new-game-button');
  shootThePotButton = document.getElementById('shoot-the-pot-button');

  // Event listeners for Ace high or low buttons
  Array.from({ length: 2 }, (_, i) => i * 2 + 1).forEach(cardNumber => {
    ['high', 'low'].forEach(type => {
      const button = document.getElementById(`ace-${type}-button-1`);
      if (button) {
        button.addEventListener('click', function() {
          aceValue = (type === 'high') ? 14 : 1;
          displayAceButtons('1', 'none');
          if (playerChips >= pot && pot > 0) {
            shootThePotButton.disabled = false;
          }
        });
      } else {
        console.error(`Button with id ace-${type}-button-1 not found`);
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
50 Chips are distributed to the player, and the player puts one chip in the center of the table to form a pool or pot.`;

  rulesButton.addEventListener('click', function() {
    alert(rules);
  });

  // Draw button event listener
  drawButton.addEventListener('click', function() {
    resultElement.textContent = '';
    dealInitialCards();
    drawButton.disabled = true;
    if (pot > 0) {
      shootThePotButton.disabled = false;
    }
    bet1Button.disabled = false;
    bet5Button.disabled = false;
  });


  function processBet(betAmount, winMessage = 'Win! Nice.', loseMessage = 'Lose! Darn.') {
    let playerBet = betAmount;
    if (playerChips >= playerBet) {
      playerChips -= playerBet;  // decrease player's chips by the bet
      pot += playerBet;  // add the bet to the pot
      updateDisplay();
      dealCards(1).then(([card2]) => {
        displayCard(card2, 'card2');
        let card1Element = document.getElementById('card1-image').firstElementChild;
        let card3Element = document.getElementById('card3-image').firstElementChild;
        let card1Value = card1Element ? getCardRank(card1Element.getAttribute('data-value'), '1') : null;
        let card2Value = getCardRank(card2.value);
        let card3Value = card3Element ? getCardRank(card3Element.getAttribute('data-value'), '3') : null;
        // checking if card2Value equals to card1Value or card3Value
        if (card2Value === card1Value || card2Value === card3Value) {
          playerChips -= playerBet;  // decrease player's chips by the bet
          pot += playerBet;  // add the bet to the pot
          resultElement.textContent = loseMessage + ' Same Card. Pay Double.';
        } else if (card2Value > Math.min(card1Value, card3Value) && card2Value < Math.max(card1Value, card3Value)) {
          let winnings = 2 * playerBet;
          winnings = (pot < winnings) ? pot : winnings;  // checking if pot < winnings and return pot instead
          playerChips += winnings;  // adding back to player's chip
          pot -= winnings;
          resultElement.textContent = winMessage;
        } else {
          resultElement.textContent = loseMessage;
        }
        updateDisplay();
        displayHandHistory();
        drawButton.disabled = (playerChips > 0) ? false : true;
        newGameButton.disabled = !drawButton.disabled;
        bet1Button.disabled = true;
        bet5Button.disabled = true;
        shootThePotButton.disabled = true;
          handHistory.push({
            result: resultElement.textContent,
            chips: playerChips,
            pot: pot,
            betAmount: playerBet,
            card1: card1,
            card2: card2,
            card3: card3
          });
          displayHandHistory();
      });
    } else {
      console.error('Not enough chips to bet');
    }
  }

  bet1Button.addEventListener('click', function() {
    processBet(1);
    shootThePotButton.disabled = true;
  });

  bet5Button.addEventListener('click', function() {
    processBet(5);
    shootThePotButton.disabled = true;
  });

  shootThePotButton.addEventListener('click', function() {
    processBet(pot, 'Wow! Nice Shot!', 'Shoot!');
  });

  // New game button event listener
  newGameButton.addEventListener('click', function() {
    resultElement.textContent = '';
    playerChips = 100;
    pot = 0;
    updateDisplay();
    shuffleDeck();
    newGameButton.disabled = true;
    shootThePotButton.disabled = true;
    bet1Button.disabled = true;
    bet5Button.disabled = true;
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
    await dealInitialCards();
  } catch (error) {
    console.error('Shuffle deck failed', error);
  }
}
async function dealCards(count) {
  //console.log(`Dealing ${count} cards`);
  try {
    let response = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=${count}`);
    let data = await response.json();
    //console.log(`Fetched cards: ${JSON.stringify(data.cards)}`);
    // check if there are fewer than 3 cards remaining
    if (data.remaining <= 3) {
      shuffleDeck();  // shuffle the deck if there are not enough cards
    }
    return data.cards;
    ;
  } catch (error) {
    console.error('Deal cards failed', error);
  }
  displayHandHistory();
}
// Deal cards
async function dealInitialCards() {
  try {
    [card1] = await dealCards(1);
    displayCard(card1, 'card1');
    displayBackOfCard('card2');

    if (card1.value === 'ACE') {
      displayAceButtons('1', 'block');
      shootThePotButton.disabled = true;
      bet1Button.disabled = true;  
      bet5Button.disabled = true;  
      displayBackOfCard('card3'); 

      // Add event listener to Ace high and low buttons
      ['high', 'low'].forEach(type => {
        const button = document.getElementById(`ace-${type}-button-1`);
        if (button) {
          button.addEventListener('click', async function() {
            aceValue = (type === 'high') ? 14 : 1;
            displayAceButtons('1', 'none');
            if (playerChips >= pot && pot > 0) {
              shootThePotButton.disabled = false;
            }
            bet1Button.disabled = false;  // Enable the "Bet 1" button
            bet5Button.disabled = false;  // Enable the "Bet 5" button
        
            // Deal the third card
            [card3] = await dealCards(1);
            displayCard(card3, 'card3');
          });
        } else {
          console.error(`Button with id ace-${type}-button-1 not found`);
        }
      });
    } else {
      [card3] = await dealCards(1);
      displayCard(card3, 'card3');

      // Check for pair
      if (card1.value === card3.value) {
        playerChips += 2;
        updateDisplay();
        resultElement.textContent = 'Automatic Win! You got a pair. +2 chips.';
        bet1Button.disabled = true;
        bet5Button.disabled = true;
        shootThePotButton.disabled = true;
        setTimeout(function() {
          drawButton.disabled = false;
          resultElement.textContent = ''; // Clear the result message
          shuffleDeck();
          if (pot > 0) {
            shootThePotButton.disabled = false;
          }
        }, 2000);  // 2000 milliseconds = 2 seconds
      } else {
        // Enable the buttons if no pair is drawn and card 1 is not an Ace
        bet1Button.disabled = false;
        bet5Button.disabled = false;
        drawButton.disabled = true;
      }
    }
  } catch (error) {
    console.error('Deal initial cards failed', error);
  }
}

function displayHandHistory() {
  const handHistoryElement = document.getElementById('hand-history');
  handHistoryElement.innerHTML = ''; // Clear the previous hand history

  // Create table
  const table = document.createElement('table');

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Hand', 'Result', 'Chips', 'Bet', 'Pot', 'Card 1', 'Card 2', 'Card 3'].forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  handHistory.forEach((hand, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${hand.result}</td>
      <td>${hand.chips}</td>
      <td>${hand.betAmount}</td>
      <td>${hand.pot}</td>
      <td><img class="hand-history-card" src="${hand.card1.image}" data-value="${hand.card1.value}"></td>
      <td><img class="hand-history-card" src="${hand.card2.image}" data-value="${hand.card2.value}"></td>
      <td><img class="hand-history-card" src="${hand.card3.image}" data-value="${hand.card3.value}"></td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  handHistoryElement.appendChild(table);

 // const handHeight = handHistoryElement.firstChild.offsetHeight;

//  handHistoryElement.style.height = `${handHeight * 4}px`;
}

// Update chips and pot display
function updateDisplay() {
 // console.log(`Updating display: playerChips=${playerChips}, pot=${pot}`);
  document.getElementById('chips-count').textContent = playerChips;
  document.getElementById('pot-count').textContent = pot;
  bet1Button.disabled = (playerChips < 1);
  bet1Button.classList.toggle('disabled', bet1Button.disabled);
  bet5Button.disabled = (playerChips < 5);
  bet5Button.classList.toggle('disabled', bet5Button.disabled);
  shootThePotButton.disabled = (pot === 0);
  shootThePotButton.classList.toggle('disabled', shootThePotButton.disabled);
}


// Display card
function displayCard(card, elementId) {
  const cardElement = document.getElementById(`${elementId}-image`);
  while (cardElement.firstChild) {
    cardElement.removeChild(cardElement.firstChild);
  }
  if (card && card.image) {
    const img = document.createElement('img');
    img.src = card.image;
    img.setAttribute('data-value', card.value);
    cardElement.appendChild(img);
  } else {
    console.error('Invalid card data');
  }
}

// Display back of card
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

function bet(amount) {
  //console.log(`Betting ${amount} chips`);
  if (playerChips >= amount) {
    playerChips -= amount;
    pot += amount;
    //console.log(`Player now has ${playerChips} chips and pot is ${pot}`);
    updateDisplay();
  } else {
    console.error('Not enough chips to bet');
  }
}

// Get card rank
function getCardRank(value, position) {
  if (value === 'ACE') {
    return position === '3' ? 14 : aceValue; // use 14 for Ace card in position 3
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
