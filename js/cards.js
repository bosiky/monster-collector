/* ============================================
   Monster Collector — Card Definitions & Rendering
   ============================================ */

// Card art style: 'original' or 'handdrawn'
let currentCardStyle = localStorage.getItem('cardStyle') || 'original';

function setCardStyle(style) {
  currentCardStyle = style;
  localStorage.setItem('cardStyle', style);
}

function getCardStyle() {
  return currentCardStyle;
}

/**
 * Get the correct image path based on current card style
 */
function getCardImage(cardData) {
  if (currentCardStyle === 'handdrawn' && cardData.handdrawnImage) {
    return cardData.handdrawnImage;
  }
  return cardData.image;
}

const CARD_DATA = {
  monsters: [
    {
      id: 'seek',
      name: 'Seek',
      nameEn: 'Seek',
      emoji: '👁️',
      rarity: 3,
      image: 'assets/monsters/seek.png',
      handdrawnImage: 'assets/handdrawn/monsters/seek.png',
      color: '#8b5cf6',
      description: '在黑暗中潛行的獨眼追蹤者'
    },
    {
      id: 'job',
      name: 'Job',
      nameEn: 'Job (Jeb)',
      emoji: '😊',
      rarity: 1,
      image: 'assets/monsters/job.png',
      handdrawnImage: 'assets/handdrawn/monsters/job.png',
      color: '#f59e0b',
      description: '看似友善的方頭小傢伙'
    },
    {
      id: 'dark-moon',
      name: '黑暗月亮',
      nameEn: 'Dark Moon',
      emoji: '🌙',
      rarity: 3,
      image: 'assets/monsters/dark-moon.png',
      handdrawnImage: 'assets/handdrawn/monsters/dark-moon.png',
      color: '#6366f1',
      description: '邪惡微笑的暗夜月亮'
    },
    {
      id: 'ambush',
      name: 'Ambush',
      nameEn: 'Ambush',
      emoji: '👺',
      rarity: 2,
      image: 'assets/monsters/ambush.png',
      handdrawnImage: 'assets/handdrawn/monsters/ambush.png',
      color: '#ef4444',
      description: '突然出現的恐怖面具獵手'
    },
    {
      id: 'stickman',
      name: '火柴人',
      nameEn: 'Stickman',
      emoji: '🏃',
      rarity: 1,
      image: 'assets/monsters/stickman.png',
      handdrawnImage: 'assets/handdrawn/monsters/stickman.png',
      color: '#22c55e',
      description: '簡單卻神秘的線條生命體'
    },
    {
      id: '67',
      name: '67',
      nameEn: 'Entity 67',
      emoji: '🔢',
      rarity: 2,
      image: 'assets/monsters/67.png',
      handdrawnImage: 'assets/handdrawn/monsters/67.png',
      color: '#ec4899',
      description: '由數字構成的扭曲實體'
    },
    {
      id: 'rush',
      name: 'Rush',
      nameEn: 'Rush',
      emoji: '💨',
      rarity: 2,
      image: 'assets/monsters/rush.png',
      handdrawnImage: 'assets/handdrawn/monsters/rush.png',
      color: '#f97316',
      description: '高速衝刺的狂暴小怪物'
    },
    {
      id: 'ou-niu',
      name: '歐牛',
      nameEn: 'Ou Niu',
      emoji: '🐂',
      rarity: 2,
      image: 'assets/monsters/ou-niu.png',
      handdrawnImage: 'assets/handdrawn/monsters/ou-niu.png',
      color: '#7c3aed',
      description: '蠻力無窮的神話鬥牛'
    },
    {
      id: 'big-eye',
      name: '大眼怪',
      nameEn: 'Big Eye',
      emoji: '👀',
      rarity: 1,
      image: 'assets/monsters/big-eye.png',
      handdrawnImage: 'assets/handdrawn/monsters/big-eye.png',
      color: '#14b8a6',
      description: '一隻巨大眼球的植物型怪物'
    },
    {
      id: 'mushroom',
      name: '靈感菇',
      nameEn: 'Inspiration Shroom',
      emoji: '🍄',
      rarity: 2,
      image: 'assets/monsters/mushroom.png',
      handdrawnImage: 'assets/handdrawn/monsters/mushroom.png',
      color: '#a3e635',
      description: '散發靈感孢子的神秘蘑菇'
    },
    {
      id: 'block-boy',
      name: '方塊boy',
      nameEn: 'Block Boy',
      emoji: '🤖',
      rarity: 1,
      image: 'assets/monsters/block-boy.png',
      handdrawnImage: 'assets/handdrawn/monsters/block-boy.png',
      color: '#06b6d4',
      description: '方方正正的可愛像素人'
    },
    {
      id: 's-worm',
      name: 'S蚯蚓',
      nameEn: 'S-Worm',
      emoji: '🐛',
      rarity: 1,
      image: 'assets/monsters/s-worm.png',
      handdrawnImage: 'assets/handdrawn/monsters/s-worm.png',
      color: '#84cc16',
      description: 'S形身體的地底蠕動怪物'
    }
  ],
  skills: [
    {
      id: 'thief',
      name: '盜賊卡',
      nameEn: 'Thief',
      emoji: '🦹',
      color: '#a855f7',
      image: 'assets/skills/thief.png',
      handdrawnImage: 'assets/handdrawn/skills/thief.png',
      description: '從對手的收集站偷走1張怪物卡至你的手牌',
      effect: 'steal'
    },
    {
      id: 'defense-shield',
      name: '防禦盾',
      nameEn: 'Defense Shield',
      emoji: '🛡️',
      color: '#3b82f6',
      image: 'assets/skills/defense-shield.png',
      handdrawnImage: 'assets/handdrawn/skills/shield.png',
      description: '保護收集站，下次被搶奪/炸彈時無效化',
      effect: 'shield'
    },
    {
      id: 'tnt-1',
      name: 'TNT×1',
      nameEn: 'TNT ×1',
      emoji: '💣',
      color: '#f97316',
      image: 'assets/skills/tnt-1.png',
      handdrawnImage: 'assets/handdrawn/skills/tnt.png',
      description: '依炸彈數量炸毀1張怪物卡',
      effect: 'bomb',
      bombPower: 1
    },
    {
      id: 'tnt-3',
      name: 'TNT×3',
      nameEn: 'TNT ×3',
      emoji: '💥',
      color: '#ef4444',
      image: 'assets/skills/tnt-3.png',
      handdrawnImage: 'assets/handdrawn/skills/tnt.png',
      description: '依炸彈數量炸毀3張怪物卡',
      effect: 'bomb',
      bombPower: 3
    },
    {
      id: 'tnt-5',
      name: 'TNT×5',
      nameEn: 'TNT ×5',
      emoji: '🔥',
      color: '#dc2626',
      image: 'assets/skills/tnt-5.png',
      handdrawnImage: 'assets/handdrawn/skills/tnt.png',
      description: '依炸彈數量炸毀5張怪物卡',
      effect: 'bomb',
      bombPower: 5
    },
    {
      id: 'freezer',
      name: '靜止器',
      nameEn: 'Freezer',
      emoji: '🥶',
      color: '#0ea5e9',
      image: 'assets/skills/freezer.png',
      handdrawnImage: 'assets/handdrawn/skills/freezer.png',
      description: '下一回合不能抽卡一次',
      effect: 'freeze'
    }
  ],
  stations: [
    { id: 'station-1', name: '狗狗UFO', image: 'assets/stations/station-1.png', handdrawnImage: 'assets/handdrawn/stations/station-1.png' },
    { id: 'station-2', name: '貓貓UFO', image: 'assets/stations/station-2.png', handdrawnImage: 'assets/handdrawn/stations/station-2.png' },
    { id: 'station-3', name: '狗狗巴士', image: 'assets/stations/station-3.png', handdrawnImage: 'assets/handdrawn/stations/station-3.png' },
    { id: 'station-4', name: '貓貓巴士', image: 'assets/stations/station-4.png', handdrawnImage: 'assets/handdrawn/stations/station-4.png' }
  ]
};

// Card counts per player count
const CARD_COUNTS = {
  2: { monsterCopies: 2, skillCopies: 2 },
  3: { monsterCopies: 2, skillCopies: 2 }
};

/**
 * Create the full deck based on player count
 */
function createDeck(playerCount) {
  const counts = CARD_COUNTS[playerCount];
  const deck = [];
  let uid = 0;

  // Add monster cards
  CARD_DATA.monsters.forEach(monster => {
    for (let i = 0; i < counts.monsterCopies; i++) {
      deck.push({
        uid: uid++,
        type: 'monster',
        ...monster,
        copyIndex: i
      });
    }
  });

  // Add skill cards
  CARD_DATA.skills.forEach(skill => {
    for (let i = 0; i < counts.skillCopies; i++) {
      deck.push({
        uid: uid++,
        type: 'skill',
        ...skill,
        copyIndex: i
      });
    }
  });

  return deck;
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Render a single card DOM element
 */
function renderCard(cardData, options = {}) {
  const {
    faceDown = false,
    size = '',       // '', 'lg', 'sm', 'xs'
    clickable = true,
    showImage = true,
    animationClass = '',
    animationDelay = 0
  } = options;

  const card = document.createElement('div');
  card.className = `card type-${cardData.type}`;
  if (size) card.classList.add(`card-${size}`);
  if (faceDown) card.classList.add('flipped');
  if (!clickable) card.style.cursor = 'default';
  if (cardData.rarity) card.classList.add(`rarity-${cardData.rarity}`);
  if (animationClass) {
    card.classList.add(animationClass);
    card.style.animationDelay = `${animationDelay}ms`;
  }

  card.dataset.uid = cardData.uid;
  card.dataset.type = cardData.type;
  card.dataset.id = cardData.id;

  // Front face
  const front = document.createElement('div');
  front.className = 'card-front';

  // Header
  const header = document.createElement('div');
  header.className = 'card-header';

  const name = document.createElement('span');
  name.className = 'card-name';
  name.textContent = `${cardData.emoji} ${cardData.name}`;

  header.appendChild(name);

  if (cardData.rarity) {
    const rarity = document.createElement('span');
    rarity.className = 'card-rarity';
    rarity.textContent = '★'.repeat(cardData.rarity);
    header.appendChild(rarity);
  }

  front.appendChild(header);

  // Image
  const imageContainer = document.createElement('div');
  imageContainer.className = 'card-image';

  const cardImageSrc = getCardImage(cardData);
  if (showImage && cardImageSrc) {
    const img = document.createElement('img');
    img.src = cardImageSrc;
    img.alt = cardData.name;
    img.loading = 'lazy';
    img.onerror = () => {
      img.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'card-image-placeholder';
      placeholder.textContent = cardData.emoji;
      imageContainer.appendChild(placeholder);
    };
    imageContainer.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'card-image-placeholder';
    placeholder.textContent = cardData.emoji;
    imageContainer.appendChild(placeholder);
  }

  front.appendChild(imageContainer);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const typeLabel = document.createElement('div');
  typeLabel.className = 'card-type-label';
  typeLabel.textContent = cardData.type === 'monster' ? 'MONSTER' : 'SKILL';
  footer.appendChild(typeLabel);

  if (cardData.type === 'monster') {
    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = cardData.nameEn;
    footer.appendChild(subtitle);
  } else {
    const effect = document.createElement('div');
    effect.className = 'card-effect';
    effect.textContent = cardData.description;
    footer.appendChild(effect);
  }

  front.appendChild(footer);

  // Back face
  const back = document.createElement('div');
  back.className = 'card-back';

  const backFace = document.createElement('div');
  backFace.className = 'card-back-face';

  const backPattern = document.createElement('div');
  backPattern.className = 'card-back-pattern';
  backFace.appendChild(backPattern);

  back.appendChild(backFace);

  // Assemble
  const inner = document.createElement('div');
  inner.className = 'card-inner';
  inner.appendChild(front);
  inner.appendChild(back);

  card.appendChild(inner);

  return card;
}

/**
 * Render a collection station card
 */
function renderStationCard(playerIndex, playerName, targetCount) {
  const colors = ['var(--color-player-1)', 'var(--color-player-2)', 'var(--color-player-3)'];
  const card = document.createElement('div');
  card.className = 'card type-station card-lg';
  card.style.cursor = 'default';

  const front = document.createElement('div');
  front.className = 'card-front';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `<span class="card-name">🏠 收集站 ${playerName}</span>`;
  front.appendChild(header);

  const body = document.createElement('div');
  body.className = 'card-image';
  body.style.display = 'flex';
  body.style.flexWrap = 'wrap';
  body.style.justifyContent = 'center';
  body.style.alignItems = 'center';
  body.style.gap = '4px';
  body.style.padding = '8px';
  body.style.background = 'rgba(0,0,0,0.3)';

  for (let i = 0; i < targetCount; i++) {
    const slot = document.createElement('div');
    slot.className = 'collection-slot';
    slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
    body.appendChild(slot);
  }

  front.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  footer.innerHTML = `
    <div class="card-type-label">COLLECTION STATION</div>
    <div class="card-effect">目標: 收集 ${targetCount} 張</div>
  `;
  front.appendChild(footer);

  const inner = document.createElement('div');
  inner.className = 'card-inner';
  inner.appendChild(front);

  card.appendChild(inner);
  return card;
}

/**
 * Render a card stack (deck / discard pile)
 */
function renderCardStack(count, topCard = null) {
  const container = document.createElement('div');
  container.className = 'card-stack';
  container.style.setProperty('--card-width', '140px');
  container.style.setProperty('--card-height', '196px');

  if (count > 2) {
    const shadow1 = document.createElement('div');
    shadow1.className = 'stack-shadow';
    container.appendChild(shadow1);
  }
  if (count > 1) {
    const shadow2 = document.createElement('div');
    shadow2.className = 'stack-shadow';
    container.appendChild(shadow2);
  }

  if (topCard) {
    const cardEl = renderCard(topCard, { clickable: false });
    cardEl.style.position = 'relative';
    container.appendChild(cardEl);
  } else if (count > 0) {
    // Face-down card
    const faceDown = document.createElement('div');
    faceDown.className = 'card';
    faceDown.style.width = '100%';
    faceDown.style.height = '100%';
    faceDown.style.position = 'relative';
    faceDown.innerHTML = `
      <div class="card-inner" style="transform: rotateY(180deg)">
        <div class="card-front"></div>
        <div class="card-back">
          <div class="card-back-face">
            <div class="card-back-pattern"></div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(faceDown);
  }

  if (count > 0) {
    const countBadge = document.createElement('div');
    countBadge.className = 'stack-count';
    countBadge.textContent = count;
    container.appendChild(countBadge);
  }

  return container;
}

// Export for use
window.CARD_DATA = CARD_DATA;
window.CARD_COUNTS = CARD_COUNTS;
window.createDeck = createDeck;
window.shuffleDeck = shuffleDeck;
window.renderCard = renderCard;
window.renderStationCard = renderStationCard;
window.renderCardStack = renderCardStack;
window.setCardStyle = setCardStyle;
window.getCardStyle = getCardStyle;
window.getCardImage = getCardImage;
window.currentCardStyle = currentCardStyle;
