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

  async function processBet(betAmount, winMessage = 'Win! Nice.', loseMessage = 'Lose! Darn.') {
    if (playerChips < betAmount) {
      console.error('Not enough chips to bet');
      return;
    }
  
    playerChips -= betAmount;
    pot += betAmount;
    updateDisplay();
  
    try {
      const [card2] = await dealCards(1);
      displayCard(card2, 'card2');
  
      const card1Value = getCardValue('card1-image');
      const card2Value = getCardRank(card2.value);
      const card3Value = getCardValue('card3-image');
  
      if (card2Value === card1Value || card2Value === card3Value) {
        playerChips -= betAmount;
        pot += betAmount;
        resultElement.textContent = `${loseMessage} Same Card. Pay Double.`;
      } else if (card2Value > Math.min(card1Value, card3Value) && card2Value < Math.max(card1Value, card3Value)) {
        const winnings = Math.min(2 * betAmount, pot);
        playerChips += winnings;
        pot -= winnings;
        resultElement.textContent = winMessage;
      } else {
        resultElement.textContent = loseMessage;
      }
  
      updateDisplay();
      displayHandHistory();
      updateButtons();
      addHandHistory({
        result: resultElement.textContent,
        chips: playerChips,
        pot: pot,
        betAmount: betAmount,
      }, card1, card2, card3);
    } catch (error) {
      console.error('Deal cards failed', error);
    }
  }
  
  function getCardValue(elementId) {
    const element = document.getElementById(elementId).firstElementChild;
    return element ? getCardRank(element.getAttribute('data-value')) : null;
  }
  
  function updateButtons() {
    drawButton.disabled = playerChips <= 0;
    newGameButton.disabled = !drawButton.disabled;
    bet1Button.disabled = true;
    bet5Button.disabled = true;
    shootThePotButton.disabled = true;
  }
  
  function addHandHistory(hand, card1, card2, card3) {
    hand.card1 = card1;
    hand.card2 = card2;
    hand.card3 = card3;
    handHistory.push(hand);
    displayHandHistory();
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
    try {
      let response = await fetch(`https://deckofcardsapi.com/api/deck/${deck_id}/draw/?count=${count}`);
      let data = await response.json();
      if (data.remaining <= 3) {
        shuffleDeck();  // shuffle the deck if there are not enough cards
      }
      return data.cards;
    } catch (error) {
      console.error('Deal cards failed', error);
    }
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

        // Add event listener to Ace high and low buttons (attach once)
        ['high', 'low'].forEach(type => {
          const button = document.getElementById(`ace-${type}-button-1`);
          if (button) {
            button.onclick = async function() {
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
            };
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
      <td>${hand.card1 && hand.card1.image ? `<img class="hand-history-card" src="${hand.card1.image}" data-value="${hand.card1.value}">` : ''}</td>
      <td>${hand.card2 && hand.card2.image ? `<img class="hand-history-card" src="${hand.card2.image}" data-value="${hand.card2.value}">` : ''}</td>
      <td>${hand.card3 && hand.card3.image ? `<img class="hand-history-card" src="${hand.card3.image}" data-value="${hand.card3.value}">` : ''}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  handHistoryElement.appendChild(table);
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
});
