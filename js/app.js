/* ============================================
   Monster Collector — Main Application
   ============================================ */

const App = {
  currentPage: 'home',
  game: null,
  settings: {
    playerCount: 2,
    targetCards: 5,
    playerNames: ['玩家1', '玩家2', '玩家3']
  },
  logOpen: false,
  previousPlayer: -1,

  init() {
    Generator.init();
    this.bindNavigation();
    this.bindHomeSettings();
    this.initParticles();
    this.showPage('home');
  },

  // ============================
  // Navigation
  // ============================
  bindNavigation() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPage(el.dataset.page);
      });
    });
  },

  showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
      page.classList.add('active');
      this.currentPage = pageName;
    }

    // Show/hide nav
    const nav = document.getElementById('main-nav');
    if (pageName === 'home') {
      nav.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      const activeTab = document.querySelector(`.nav-tab[data-page="${pageName}"]`);
      if (activeTab) activeTab.classList.add('active');
    }

    // Init page-specific content
    if (pageName === 'gallery') this.initGallery();
    if (pageName === 'generator') this.initGenerator();
  },

  initParticles() {
    const container = document.getElementById('bg-particles');
    Animations.initParticles(container, 25);
  },

  // ============================
  // Home Settings
  // ============================
  bindHomeSettings() {
    // Player count
    document.getElementById('btn-players-minus').addEventListener('click', () => {
      this.settings.playerCount = Math.max(2, this.settings.playerCount - 1);
      this.updateSettingsDisplay();
    });
    document.getElementById('btn-players-plus').addEventListener('click', () => {
      this.settings.playerCount = Math.min(3, this.settings.playerCount + 1);
      this.updateSettingsDisplay();
    });

    // Target cards
    document.getElementById('btn-target-minus').addEventListener('click', () => {
      this.settings.targetCards = Math.max(3, this.settings.targetCards - 1);
      this.updateSettingsDisplay();
    });
    document.getElementById('btn-target-plus').addEventListener('click', () => {
      this.settings.targetCards = Math.min(10, this.settings.targetCards + 1);
      this.updateSettingsDisplay();
    });

    // Player name inputs
    for (let i = 1; i <= 3; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input) {
        input.addEventListener('input', () => {
          this.settings.playerNames[i - 1] = input.value || `玩家${i}`;
        });
      }
    }

    // Start game
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.startGame();
    });

    // Gallery & Generator buttons
    document.getElementById('btn-to-gallery').addEventListener('click', () => {
      this.showPage('gallery');
    });
    document.getElementById('btn-to-generator').addEventListener('click', () => {
      this.showPage('generator');
    });

    this.updateSettingsDisplay();
  },

  updateSettingsDisplay() {
    document.getElementById('val-players').textContent = this.settings.playerCount;
    document.getElementById('val-target').textContent = this.settings.targetCards;

    const counts = CARD_COUNTS[this.settings.playerCount];
    const totalMonsters = 7 * counts.monsterCopies;
    const totalSkills = 3 * counts.skillCopies;
    document.getElementById('val-deck-info').textContent =
      `${totalMonsters} 怪物 + ${totalSkills} 技能 = ${totalMonsters + totalSkills} 張（不發手牌）`;

    // Show/hide player 3 name input
    const p3Row = document.getElementById('player-name-3-row');
    if (p3Row) {
      if (this.settings.playerCount >= 3) {
        p3Row.classList.remove('hidden');
      } else {
        p3Row.classList.add('hidden');
      }
    }
  },

  // ============================
  // Gallery Page
  // ============================
  galleryInitialized: false,

  initGallery() {
    if (!this.galleryInitialized) {
      document.querySelectorAll('.gallery-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderGallery(tab.dataset.filter);
        });
      });
      this.galleryInitialized = true;
    }
    this.renderGallery('all');
  },

  renderGallery(filter) {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    let cards = [];
    if (filter === 'all' || filter === 'monster') {
      cards = cards.concat(CARD_DATA.monsters.map((m, i) => ({ ...m, type: 'monster', uid: i })));
    }
    if (filter === 'all' || filter === 'skill') {
      cards = cards.concat(CARD_DATA.skills.map((s, i) => ({ ...s, type: 'skill', uid: 100 + i })));
    }

    cards.forEach((cardData, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = 'center';

      const cardEl = renderCard(cardData, { size: '' });
      cardEl.style.setProperty('--card-width', '180px');
      cardEl.style.setProperty('--card-height', '252px');
      cardEl.querySelector('.card-name').style.fontSize = '0.8rem';

      // Click to preview large
      cardEl.addEventListener('click', () => {
        this.showCardPreview(cardData);
      });

      Animations.dealCard(cardEl, index);
      wrapper.appendChild(cardEl);

      const info = document.createElement('div');
      info.className = 'gallery-card-info';
      info.textContent = cardData.type === 'monster'
        ? `${cardData.nameEn} ${'★'.repeat(cardData.rarity)}`
        : cardData.nameEn;
      wrapper.appendChild(info);

      grid.appendChild(wrapper);
    });
  },

  showCardPreview(cardData) {
    const overlay = document.getElementById('card-preview');
    const container = document.getElementById('card-preview-card');
    container.innerHTML = '';

    const cardEl = renderCard(cardData, { size: 'lg' });
    cardEl.style.setProperty('--card-width', '280px');
    cardEl.style.setProperty('--card-height', '392px');
    cardEl.querySelector('.card-name').style.fontSize = '1rem';
    if (cardEl.querySelector('.card-rarity')) cardEl.querySelector('.card-rarity').style.fontSize = '0.8rem';
    cardEl.querySelector('.card-type-label').style.fontSize = '0.7rem';
    if (cardEl.querySelector('.card-effect')) cardEl.querySelector('.card-effect').style.fontSize = '0.75rem';
    if (cardEl.querySelector('.card-subtitle')) cardEl.querySelector('.card-subtitle').style.fontSize = '0.7rem';

    container.appendChild(cardEl);
    overlay.classList.add('active');

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    };
  },

  // ============================
  // Generator Page
  // ============================
  generatorInitialized: false,

  initGenerator() {
    if (this.generatorInitialized) return;
    this.generatorInitialized = true;

    const uploadArea = document.getElementById('gen-upload');
    const fileInput = document.getElementById('gen-file-input');
    const nameInput = document.getElementById('gen-name');
    const typeSelect = document.getElementById('gen-type');
    const raritySelect = document.getElementById('gen-rarity');
    const descInput = document.getElementById('gen-description');
    const generateBtn = document.getElementById('btn-generate-card');
    const exportBtn = document.getElementById('btn-export-card');

    let uploadedImage = null;

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--color-primary)';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) loadImage(fileInput.files[0]);
    });

    function loadImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          uploadedImage = img;
          uploadArea.innerHTML = `<img src="${e.target.result}" style="max-width:100%;max-height:200px;border-radius:8px;">`;
          updatePreview();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function updatePreview() {
      const cardData = {
        type: typeSelect.value,
        name: nameInput.value || '未命名',
        nameEn: nameInput.value || 'Unnamed',
        emoji: typeSelect.value === 'monster' ? '🐉' : '⚡',
        rarity: parseInt(raritySelect.value) || 1,
        description: descInput.value || ''
      };

      const dataUrl = await Generator.generateCardImage(cardData, uploadedImage);
      const preview = document.getElementById('gen-preview-image');
      preview.innerHTML = `<img src="${dataUrl}" style="max-height: 400px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">`;

      exportBtn.disabled = false;
      exportBtn.onclick = () => {
        Generator.exportCard(dataUrl, `monster-collector-${cardData.name}`);
      };
    }

    generateBtn.addEventListener('click', updatePreview);
    [nameInput, typeSelect, raritySelect, descInput].forEach(el => {
      el.addEventListener('input', updatePreview);
    });

    // Initial preview
    updatePreview();
  },

  // ============================
  // Game Logic
  // ============================
  startGame() {
    // Collect player names from inputs
    for (let i = 1; i <= 3; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input && input.value.trim()) {
        this.settings.playerNames[i - 1] = input.value.trim();
      }
    }

    this.previousPlayer = -1;

    this.game = new MonsterCollectorGame({
      playerCount: this.settings.playerCount,
      targetCards: this.settings.targetCards,
      playerNames: this.settings.playerNames.slice(0, this.settings.playerCount),
      onStateChange: (state) => this.onGameStateChange(state),
      onGameLog: (entry) => this.renderLogEntry(entry),
      onVictory: (playerIdx) => this.showVictoryScreen(playerIdx),
      onNeedTarget: (action, targets, callback) => this.showTargetSelector(action, targets, callback),
      onNeedStealChoice: (targetIdx, cards, callback) => this.showStealChoice(targetIdx, cards, callback)
    });

    this.showPage('game');
    // Show initial hand-off for player 1
    this.showHandoffScreen(this.game.state, true);
  },

  onGameStateChange(state) {
    if (!state) return;

    // Detect player change => show hand-off screen
    if (this.previousPlayer !== -1 && this.previousPlayer !== state.currentPlayer && !state.gameOver) {
      this.showHandoffScreen(state, false);
      return;
    }

    this.previousPlayer = state.currentPlayer;
    this.renderGameState(state);
  },

  // ============================
  // Hand-off Screen
  // ============================
  showHandoffScreen(state, isFirstTurn) {
    const player = state.players[state.currentPlayer];
    const playerColors = ['#f43f5e', '#3b82f6', '#22c55e'];
    const playerIcons = ['🔴', '🔵', '🟢'];

    // Remove existing handoff if any
    const existing = document.querySelector('.handoff-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'handoff-overlay';
    overlay.innerHTML = `
      <div class="handoff-content">
        <div class="handoff-icon">${playerIcons[state.currentPlayer]}</div>
        <div class="handoff-title" style="color:${playerColors[state.currentPlayer]}">
          ${player.name} 的回合
        </div>
        <div class="handoff-subtitle">
          ${isFirstTurn ? '遊戲開始！請準備好你的策略' : '請將裝置交給此玩家'}
        </div>
        <div class="handoff-stats">
          <div class="handoff-stat">
            <span class="stat-value">${player.hand.length}</span>
            <span class="stat-label">手牌</span>
          </div>
          <div class="handoff-stat">
            <span class="stat-value">${player.collection.length}/${this.settings.targetCards}</span>
            <span class="stat-label">收集進度</span>
          </div>
          <div class="handoff-stat">
            <span class="stat-value">${player.hasShield ? '✅' : '❌'}</span>
            <span class="stat-label">護盾</span>
          </div>
        </div>
        <button class="btn btn-gold btn-lg" id="btn-handoff-ready">
          👁️ 我準備好了
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-handoff-ready').addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        overlay.remove();
        this.previousPlayer = state.currentPlayer;
        this.renderGameState(state);
      }, 300);
    });
  },

  // ============================
  // Render Game State
  // ============================
  renderGameState(state) {
    if (!state) return;

    // Update turn indicator
    const turnEl = document.getElementById('turn-indicator');
    const playerColors = ['var(--color-player-1)', 'var(--color-player-2)', 'var(--color-player-3)'];
    turnEl.innerHTML = `
      <span class="player-dot" style="background:${playerColors[state.currentPlayer]}"></span>
      <span>${state.players[state.currentPlayer].name} 的回合</span>
      <span class="text-muted" style="font-size:0.8rem">第 ${state.turnNumber} 回合</span>
    `;

    // Render phase indicator
    this.renderPhaseIndicator(state.phase);

    // Render opponents
    this.renderOpponents(state);

    // Render center (deck + discard)
    this.renderCenter(state);

    // Render player station
    this.renderPlayerStation(state);

    // Render player hand
    this.renderPlayerHand(state);

    // Render action prompt
    this.renderActionPrompt(state);
  },

  renderPhaseIndicator(phase) {
    const phases = [
      { id: 'draw', label: '① 抽牌' },
      { id: 'action', label: '② 行動' },
      { id: 'discard', label: '③ 結束' }
    ];

    const container = document.getElementById('phase-indicator');
    container.innerHTML = phases.map(p => {
      const isActive = p.id === phase;
      const isDone = phases.findIndex(x => x.id === phase) > phases.findIndex(x => x.id === p.id);
      const cls = isActive ? 'active' : isDone ? 'completed' : '';
      return `
        <div class="phase-step ${cls}">
          <span class="step-dot"></span>
          ${p.label}
        </div>
      `;
    }).join('');
  },

  renderOpponents(state) {
    const container = document.getElementById('opponents-area');
    container.innerHTML = '';

    state.players.forEach((player, idx) => {
      if (idx === state.currentPlayer) return;

      const panel = document.createElement('div');
      panel.className = 'opponent-panel';

      const playerColors = ['var(--color-player-1)', 'var(--color-player-2)', 'var(--color-player-3)'];

      panel.innerHTML = `
        <div class="opponent-header">
          <div class="player-name">
            <span class="player-icon" style="background:${playerColors[idx]}">${player.name[0]}</span>
            ${player.name}
            ${player.hasShield ? '<span class="shield-indicator" style="position:static">🛡️</span>' : ''}
          </div>
          <div class="hand-count">🃏 ${player.hand.length}</div>
        </div>
        <div class="opponent-collection">
          ${player.collection.map(c => `
            <div class="collection-slot filled" style="width:50px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:0.6rem;background:rgba(107,33,168,0.2)">
              <span style="font-size:1.2rem">${c.emoji}</span>
              <span style="font-family:var(--font-chinese);color:var(--color-text-muted)">${c.name}</span>
            </div>
          `).join('')}
          ${Array(Math.max(0, this.settings.targetCards - player.collection.length)).fill(0).map((_, i) => `
            <div class="collection-slot" style="width:50px;height:70px">
              <span class="slot-number">${player.collection.length + i + 1}</span>
            </div>
          `).join('')}
        </div>
        <div style="font-size:0.75rem;color:var(--color-text-dim);font-family:var(--font-chinese)">
          收集進度: ${player.collection.length}/${this.settings.targetCards}
        </div>
      `;

      container.appendChild(panel);
    });
  },

  renderCenter(state) {
    // Deck
    const deckContainer = document.getElementById('deck-container');
    deckContainer.innerHTML = '';
    const deckStack = renderCardStack(state.deck.length);
    deckContainer.appendChild(deckStack);

    document.getElementById('deck-count').textContent = state.deck.length;

    // Make deck clickable for draw phase
    if (state.phase === 'draw') {
      deckContainer.style.cursor = 'pointer';
      deckContainer.classList.add('animate-pulse-glow');
      deckContainer.onclick = () => {
        deckContainer.classList.remove('animate-pulse-glow');
        deckContainer.onclick = null;
        const drawnCard = this.game.drawCard();
        if (drawnCard) {
          this.showDrawnCardToast(drawnCard);
        }
      };
    } else {
      deckContainer.style.cursor = 'default';
      deckContainer.classList.remove('animate-pulse-glow');
      deckContainer.onclick = null;
    }

    // Discard
    const discardContainer = document.getElementById('discard-container');
    discardContainer.innerHTML = '';

    if (state.discardPile.length > 0) {
      const topCard = state.discardPile[state.discardPile.length - 1];
      const discardStack = renderCardStack(state.discardPile.length, topCard);
      discardContainer.appendChild(discardStack);
    } else {
      discardContainer.innerHTML = `<div class="empty-discard">棄牌堆</div>`;
    }
  },

  showDrawnCardToast(card) {
    // Remove any existing toast
    const existing = document.querySelector('.drawn-card-toast');
    if (existing) existing.remove();

    const typeLabel = card.type === 'monster' ? '怪物卡' : '技能卡';
    const toast = document.createElement('div');
    toast.className = 'drawn-card-toast';
    toast.innerHTML = `
      <span class="toast-card-icon">${card.emoji}</span>
      <div class="toast-text">
        抽到了 <span class="toast-card-name">${card.name}</span>
        <div style="font-size:0.75rem;color:var(--color-text-dim)">${typeLabel}</div>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.4s ease';
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  },

  renderPlayerStation(state) {
    const player = state.players[state.currentPlayer];
    const container = document.getElementById('player-station-slots');
    container.innerHTML = '';

    const playerColors = ['var(--color-player-1)', 'var(--color-player-2)', 'var(--color-player-3)'];

    document.getElementById('player-station-name').innerHTML = `
      <span style="color:${playerColors[state.currentPlayer]}">●</span>
      ${player.name} 的收集站
      ${player.hasShield ? '<span class="shield-indicator" style="position:static;margin-left:8px">🛡️</span>' : ''}
    `;
    document.getElementById('player-station-progress').textContent =
      `${player.collection.length} / ${this.settings.targetCards}`;

    // Render filled slots
    player.collection.forEach((card) => {
      const slot = document.createElement('div');
      slot.className = 'collection-slot filled';
      slot.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;font-size:0.5rem">
          <span style="font-size:1.4rem">${card.emoji}</span>
          <span style="font-family:var(--font-chinese);color:var(--color-text-muted)">${card.name}</span>
        </div>
      `;
      container.appendChild(slot);
    });

    // Render empty slots
    const remaining = this.settings.targetCards - player.collection.length;
    for (let i = 0; i < remaining; i++) {
      const slot = document.createElement('div');
      slot.className = 'collection-slot';
      slot.innerHTML = `<span class="slot-number">${player.collection.length + i + 1}</span>`;
      container.appendChild(slot);
    }
  },

  renderPlayerHand(state) {
    const player = state.players[state.currentPlayer];
    const container = document.getElementById('player-hand');
    container.innerHTML = '';

    player.hand.forEach((cardData, index) => {
      const cardEl = renderCard(cardData);

      // Highlight playable cards based on phase
      if (state.phase === 'action') {
        cardEl.classList.add('card-glow');
        cardEl.addEventListener('click', () => this.handleCardClick(cardData));
      } else if (state.phase === 'discard' && player.hand.length > 7) {
        cardEl.classList.add('card-glow');
        cardEl.addEventListener('click', () => {
          this.game.discardCard(cardData.uid);
        });
      } else {
        cardEl.style.cursor = 'default';
      }

      Animations.dealCard(cardEl, index);
      container.appendChild(cardEl);
    });

    document.getElementById('hand-count').textContent = `手牌: ${player.hand.length}`;
  },

  handleCardClick(cardData) {
    if (this.game.state.phase !== 'action') return;

    if (cardData.type === 'monster') {
      this.showConfirmDialog(
        `放置 ${cardData.emoji} ${cardData.name} 到收集站？`,
        () => this.game.placeMonster(cardData.uid)
      );
    } else if (cardData.type === 'skill') {
      this.showConfirmDialog(
        `使用 ${cardData.emoji} ${cardData.name}？<br><span style="font-size:0.9rem;color:var(--color-text-muted)">${cardData.description}</span>`,
        () => this.game.useSkill(cardData.uid)
      );
    }
  },

  renderActionPrompt(state) {
    const container = document.getElementById('action-prompt');

    if (state.phase === 'draw') {
      container.innerHTML = `
        <div class="prompt-title">🎯 抽牌階段</div>
        <div style="font-family:var(--font-chinese);font-size:0.85rem;color:var(--color-text-muted)">
          點擊抽牌堆抽取 1 張牌
        </div>
      `;
    } else if (state.phase === 'action') {
      container.innerHTML = `
        <div class="prompt-title">⚔️ 行動階段</div>
        <div class="prompt-actions">
          <div style="font-family:var(--font-chinese);font-size:0.8rem;color:var(--color-text-muted);text-align:center;margin-bottom:4px">
            點擊手牌使用，或跳過
          </div>
          <button class="btn btn-sm btn-outline" id="btn-skip-action">跳過行動</button>
        </div>
      `;
      document.getElementById('btn-skip-action').addEventListener('click', () => {
        this.game.skipAction();
      });
    } else if (state.phase === 'discard') {
      const excess = state.players[state.currentPlayer].hand.length - 7;
      if (excess > 0) {
        container.innerHTML = `
          <div class="prompt-title">🗑️ 棄牌階段</div>
          <div style="font-family:var(--font-chinese);font-size:0.85rem;color:var(--color-text-muted)">
            需棄掉 ${excess} 張牌<br>點擊手牌選擇棄掉
          </div>
        `;
      } else {
        container.innerHTML = '';
      }
    } else if (state.phase === 'waiting') {
      container.innerHTML = `
        <div class="prompt-title">⏳ 等待選擇...</div>
      `;
    }
  },

  // ============================
  // Dialogs & Selectors
  // ============================
  showConfirmDialog(message, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    modal.innerHTML = `
      <h2 style="font-family:var(--font-chinese);font-size:1.2rem">${message}</h2>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px">
        <button class="btn btn-gold" id="modal-confirm">確認</button>
        <button class="btn btn-outline" id="modal-cancel">取消</button>
      </div>
    `;

    overlay.classList.add('active');

    document.getElementById('modal-confirm').addEventListener('click', () => {
      overlay.classList.remove('active');
      onConfirm();
    });

    document.getElementById('modal-cancel').addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  },

  showTargetSelector(action, targets, callback) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    const actionLabel = {
      steal: '⚡ 選擇搶奪目標',
      swap: '🔄 選擇交換對象'
    };

    const actionDesc = {
      steal: '選擇一位對手，偷走其收集站中的一張怪物卡',
      swap: '選擇一位對手，與其隨機交換一張手牌'
    };

    modal.innerHTML = `
      <h2 style="font-family:var(--font-chinese);font-size:1.3rem">${actionLabel[action]}</h2>
      <p style="font-family:var(--font-chinese);font-size:0.85rem;color:var(--color-text-muted);margin:8px 0 20px;text-align:center">${actionDesc[action]}</p>
      <div class="target-options">
        ${targets.map(t => `
          <div class="target-option" data-index="${t.index}">
            <div>
              <div class="target-name">${t.name}</div>
              <div class="target-info">
                收集站: ${t.collection.length} 張 | 手牌: ${t.hand.length} 張
                ${t.hasShield ? ' | 🛡️ 護盾啟動' : ''}
              </div>
            </div>
            <span style="font-size:1.5rem">→</span>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-sm btn-outline" id="modal-cancel-target">取消</button>
      </div>
    `;

    overlay.classList.add('active');

    modal.querySelectorAll('.target-option').forEach(opt => {
      opt.addEventListener('click', () => {
        overlay.classList.remove('active');
        callback(parseInt(opt.dataset.index));
      });
    });

    document.getElementById('modal-cancel-target').addEventListener('click', () => {
      overlay.classList.remove('active');
      // Re-enter action phase
      this.game.state.phase = 'action';
      this.renderGameState(this.game.state);
    });
  },

  showStealChoice(targetIdx, cards, callback) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    modal.innerHTML = `
      <h2 style="font-family:var(--font-chinese);font-size:1.3rem">選擇要偷走的怪物卡</h2>
      <p style="font-family:var(--font-chinese);font-size:0.85rem;color:var(--color-text-muted);margin:8px 0 20px;text-align:center">
        點擊選擇一張從對手收集站偷走
      </p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        ${cards.map((c, i) => `
          <div class="target-option" data-index="${i}" style="flex-direction:column;align-items:center;padding:16px;min-width:100px;cursor:pointer">
            <span style="font-size:2.5rem">${c.emoji}</span>
            <div class="target-name" style="margin-top:8px">${c.name}</div>
            <div style="font-size:0.7rem;color:var(--color-text-dim)">${c.nameEn}</div>
          </div>
        `).join('')}
      </div>
    `;

    overlay.classList.add('active');

    modal.querySelectorAll('.target-option').forEach(opt => {
      opt.addEventListener('click', () => {
        overlay.classList.remove('active');
        callback(parseInt(opt.dataset.index));
      });
    });
  },

  showVictoryScreen(playerIdx) {
    const player = this.game.state.players[playerIdx];
    const playerColors = ['#f43f5e', '#3b82f6', '#22c55e'];

    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    overlay.innerHTML = `
      <div class="victory-content">
        <div class="trophy">🏆</div>
        <h1>Victory!</h1>
        <div class="winner-name" style="color:${playerColors[playerIdx]}">
          ${player.name} 獲得了勝利！
        </div>
        <div style="font-family:var(--font-chinese);color:var(--color-text-muted);margin-bottom:16px">
          在第 ${this.game.state.turnNumber} 回合收集了 ${player.collection.length} 張怪物卡
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:32px">
          ${player.collection.map(c => `
            <div style="text-align:center">
              <span style="font-size:2rem">${c.emoji}</span>
              <div style="font-size:0.65rem;color:var(--color-text-muted);font-family:var(--font-chinese)">${c.name}</div>
            </div>
          `).join('')}
        </div>
        <div class="victory-actions">
          <button class="btn btn-gold btn-lg" id="btn-play-again">🔄 再來一局</button>
          <button class="btn btn-outline" id="btn-back-home">🏠 回到首頁</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    Animations.celebration(overlay);

    document.getElementById('btn-play-again').addEventListener('click', () => {
      overlay.remove();
      this.startGame();
    });

    document.getElementById('btn-back-home').addEventListener('click', () => {
      overlay.remove();
      this.showPage('home');
    });
  },

  // ============================
  // Game Log
  // ============================
  renderLogEntry(entry) {
    const logList = document.getElementById('game-log-list');
    if (!logList) return;

    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = entry.text;
    logList.prepend(div);

    // Keep only last 50
    while (logList.children.length > 50) {
      logList.removeChild(logList.lastChild);
    }
  },

  toggleLog() {
    this.logOpen = !this.logOpen;
    const log = document.getElementById('game-log');
    log.classList.toggle('open', this.logOpen);
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
