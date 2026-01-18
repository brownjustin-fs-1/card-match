// Card Match - TypeScript
// Rules:
// - 6 cards total (3 pairs)
// - Each attempt compares 2 cards
// - Max 3 attempts
// - Shuffle on new game
// - Match all pairs to win

enum CardValue {
  A = "A",
  B = "B",
  C = "C",
}

interface CardModel {
  id: string;
  value: CardValue;
  matched: boolean;
}

const MAX_ATTEMPTS: number = 3;
const FLIP_BACK_DELAY_MS: number = 750;

const boardEl = document.getElementById("board") as HTMLDivElement;
const attemptsLeftEl = document.getElementById("attemptsLeft") as HTMLSpanElement;
const statusTextEl = document.getElementById("statusText") as HTMLParagraphElement;
const restartBtn = document.getElementById("restartBtn") as HTMLButtonElement;

let deck: CardModel[] = [];
let attemptsLeft: number = MAX_ATTEMPTS;
let flippedIndexes: number[] = [];
let isBusy: boolean = false;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setStatus(text: string): void {
  statusTextEl.textContent = text;
}

function setAttemptsLeft(value: number): void {
  attemptsLeft = value;
  attemptsLeftEl.textContent = String(value);
}

function allMatched(): boolean {
  return deck.every((c) => c.matched);
}

function buildDeck(): CardModel[] {
  const values: CardValue[] = [CardValue.A, CardValue.B, CardValue.C];

  const cards: CardModel[] = values.flatMap((v, idx) => {
    return [
      { id: `${idx}-0-${crypto.randomUUID()}`, value: v, matched: false },
      { id: `${idx}-1-${crypto.randomUUID()}`, value: v, matched: false },
    ];
  });

  return shuffle(cards);
}

function render(): void {
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

    if (card.matched) cardBtn.classList.add("is-matched");

    cardBtn.addEventListener("click", onCardClick);
    boardEl.appendChild(cardBtn);
  });
}

function resetGame(): void {
  deck = buildDeck();
  flippedIndexes = [];
  isBusy = false;

  setAttemptsLeft(MAX_ATTEMPTS);
  setStatus("");
  render();
  disableAllCards(false);
}

restartBtn.addEventListener("click", resetGame);

function getCardButtonByIndex(index: number): HTMLButtonElement | null {
  return boardEl.querySelector(`button.card[data-index="${index}"]`);
}

function flipUp(index: number): void {
  const btn = getCardButtonByIndex(index);
  if (!btn) return;
  btn.classList.add("is-flipped");
}

function flipDown(index: number): void {
  const btn = getCardButtonByIndex(index);
  if (!btn) return;
  btn.classList.remove("is-flipped");
}

function disableAllCards(disabled: boolean): void {
  const buttons = boardEl.querySelectorAll("button.card");
  buttons.forEach((btn) => {
    (btn as HTMLButtonElement).disabled = disabled;
    btn.classList.toggle("is-disabled", disabled);
  });
}

function onCardClick(e: MouseEvent): void {
  if (isBusy) return;

  const target = e.currentTarget as HTMLButtonElement;
  const indexStr = target.dataset.index;
  if (!indexStr) return;

  const index = Number(indexStr);
  const card = deck[index];
  if (!card) return;

  if (card.matched) return;
  if (flippedIndexes.includes(index)) return;
  if (attemptsLeft <= 0) return;

  flipUp(index);
  flippedIndexes.push(index);

  if (flippedIndexes.length < 2) return;

  isBusy = true;

  const [aIdx, bIdx] = flippedIndexes;
  const a = deck[aIdx];
  const b = deck[bIdx];

  const isMatch: boolean = a.value === b.value;

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