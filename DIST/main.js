var CardValue;
(function (CardValue) {
  CardValue["A"] = "A";
  CardValue["B"] = "B";
  CardValue["C"] = "C";
})(CardValue || (CardValue = {}));
const MAX_ATTEMPTS = 3;
const FLIP_BACK_DELAY_MS = 750;
const boardEl = document.getElementById("board");
const attemptsLeftEl = document.getElementById("attemptsLeft");
const statusTextEl = document.getElementById("statusText");
const restartBtn = document.getElementById("restartBtn");
let deck = [];
let attemptsLeft = MAX_ATTEMPTS;
let flippedIndexes = [];
let isBusy = false;
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function setStatus(text) {
  statusTextEl.textContent = text;
}
function setAttemptsLeft(value) {
  attemptsLeft = value;
  attemptsLeftEl.textContent = String(value);
}
function allMatched() {
  return deck.every((c) => c.matched);
}
function buildDeck() {
  const values = [CardValue.A, CardValue.B, CardValue.C];
  const cards = values.flatMap((v, idx) => {
    return [
      { id: `${idx}-0-${crypto.randomUUID()}`, value: v, matched: false },
      { id: `${idx}-1-${crypto.randomUUID()}`, value: v, matched: false },
    ];
  });
  return shuffle(cards);
}
function render() {
  boardEl.innerHTML = "";
  deck.forEach((card, index) => {
    const cardBtn = document.createElement("button");
    cardBtn.type = "button";
    cardBtn.className = "card";
    cardBtn.setAttribute("aria-label", `Card ${index + 1}`);
    cardBtn.dataset.index = String(index);
    cardBtn.innerHTML = `
      <div class="card__inner">
        <div class="card__face card__front">${card.value}</div>
        <div class="card__face card__back" aria-hidden="true"></div>
      </div>
    `;
    if (card.matched)
      cardBtn.classList.add("is-matched");
    cardBtn.addEventListener("click", onCardClick);
    boardEl.appendChild(cardBtn);
  });
}
function resetGame() {
  deck = buildDeck();
  flippedIndexes = [];
  isBusy = false;
  setAttemptsLeft(MAX_ATTEMPTS);
  setStatus("");
  render();
  disableAllCards(false);
}
restartBtn.addEventListener("click", resetGame);
function getCardButtonByIndex(index) {
  return boardEl.querySelector(`button.card[data-index="${index}"]`);
}
function flipUp(index) {
  const btn = getCardButtonByIndex(index);
  if (!btn)
    return;
  btn.classList.add("is-flipped");
}
function flipDown(index) {
  const btn = getCardButtonByIndex(index);
  if (!btn)
    return;
  btn.classList.remove("is-flipped");
}
function disableAllCards(disabled) {
  const buttons = boardEl.querySelectorAll("button.card");
  buttons.forEach((btn) => {
    btn.disabled = disabled;
    btn.classList.toggle("is-disabled", disabled);
  });
}
function onCardClick(e) {
  if (isBusy)
    return;
  const target = e.currentTarget;
  const indexStr = target.dataset.index;
  if (!indexStr)
    return;
  const index = Number(indexStr);
  const card = deck[index];
  if (!card)
    return;
  if (card.matched)
    return;
  if (flippedIndexes.includes(index))
    return;
  if (attemptsLeft <= 0)
    return;
  flipUp(index);
  flippedIndexes.push(index);
  if (flippedIndexes.length < 2)
    return;
  isBusy = true;
  const [aIdx, bIdx] = flippedIndexes;
  const a = deck[aIdx];
  const b = deck[bIdx];
  const isMatch = a.value === b.value;
  if (isMatch) {
    a.matched = true;
    b.matched = true;
    const aBtn = getCardButtonByIndex(aIdx);
    const bBtn = getCardButtonByIndex(bIdx);
    aBtn?.classList.add("is-matched");
    bBtn?.classList.add("is-matched");
    flippedIndexes = [];
    isBusy = false;
    if (allMatched()) {
      setStatus("You Won!");
      disableAllCards(true);
    }
    return;
  }
  setAttemptsLeft(attemptsLeft - 1);
  window.setTimeout(() => {
    flipDown(aIdx);
    flipDown(bIdx);
    flippedIndexes = [];
    isBusy = false;
    if (attemptsLeft <= 0 && !allMatched()) {
      setStatus("Out of attempts!");
      disableAllCards(true);
    }
  }, FLIP_BACK_DELAY_MS);
}
resetGame();