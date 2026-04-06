/* ============================================
   Monster Collector — Game Engine
   ============================================ */

class MonsterCollectorGame {
  constructor(config) {
    this.playerCount = config.playerCount || 2;
    this.targetCards = config.targetCards || 5;
    this.playerNames = config.playerNames || [];
    
    // Fill default names
    while (this.playerNames.length < this.playerCount) {
      this.playerNames.push(`P${this.playerNames.length + 1}`);
    }

    this.onStateChange = config.onStateChange || (() => {});
    this.onGameLog = config.onGameLog || (() => {});
    this.onVictory = config.onVictory || (() => {});
    this.onNeedTarget = config.onNeedTarget || (() => {});
    this.onNeedStealChoice = config.onNeedStealChoice || (() => {});

    this.state = null;
    this.init();
  }

  init() {
    const deck = shuffleDeck(createDeck(this.playerCount));

    // Assign random station cards to players
    const stations = CARD_DATA.stations ? [...CARD_DATA.stations] : [];
    // Shuffle stations
    for (let i = stations.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stations[i], stations[j]] = [stations[j], stations[i]];
    }

    this.state = {
      deck: deck,
      discardPile: [],
      players: Array.from({ length: this.playerCount }, (_, i) => ({
        index: i,
        name: this.playerNames[i],
        hand: [],
        collection: [],
        hasShield: false,
        skipDraw: false,
        stationCard: stations[i % stations.length] || null
      })),
      currentPlayer: 0,
      phase: 'draw',  // 'draw' | 'action' | 'discard' | 'waiting'
      turnNumber: 1,
      gameOver: false,
      winner: null,
      log: []
    };

    this.addLog(`遊戲開始！${this.playerCount} 人對戰`);
    this.addLog(`目標：收集 ${this.targetCards} 張怪物卡`);
    this.addLog(`每位玩家從 0 張手牌開始，輪流抽牌`);
    this.addLog(`${this.currentPlayerName()} 的回合`);
    // Note: we do NOT emitState() here - the app will handle the initial render
    // after showing the hand-off screen
  }

  // --- Helpers ---
  get current() {
    return this.state.players[this.state.currentPlayer];
  }

  currentPlayerName() {
    return this.current.name;
  }

  addLog(text) {
    this.state.log.unshift({
      text,
      turn: this.state.turnNumber,
      player: this.state.currentPlayer,
      timestamp: Date.now()
    });
    this.onGameLog(this.state.log[0]);
  }

  emitState() {
    this.onStateChange({ ...this.state });
  }

  // --- Core Actions ---

  /**
   * Phase 1: Draw a card from deck
   */
  drawCard() {
    if (this.state.phase !== 'draw') return false;
    if (this.state.gameOver) return false;

    // Check freeze: skip draw this turn
    if (this.current.skipDraw) {
      this.current.skipDraw = false;
      this.addLog(`🥶 ${this.currentPlayerName()} 被靜止器影響，本回合無法抽牌！`);
      this.state.phase = 'action';
      this.emitState();
      return false;
    }

    // Reshuffle discard if deck is empty
    if (this.state.deck.length === 0) {
      if (this.state.discardPile.length === 0) {
        this.addLog('牌堆已空，無法抽牌！');
        this.state.phase = 'action';
        this.emitState();
        return false;
      }
      this.state.deck = shuffleDeck(this.state.discardPile);
      this.state.discardPile = [];
      this.addLog('棄牌堆已重新洗牌成為新的抽牌堆');
    }

    const card = this.state.deck.pop();
    this.current.hand.push(card);

    const typeLabel = card.type === 'monster' ? '怪物卡' : '技能卡';
    this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name} (${typeLabel})`);

    this.state.phase = 'action';
    this.emitState();
    return card;
  }

  /**
   * Phase 2a: Place a monster card from hand to collection
   */
  placeMonster(cardUid) {
    if (this.state.phase !== 'action') return false;

    const hand = this.current.hand;
    const cardIndex = hand.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return false;

    const card = hand[cardIndex];
    if (card.type !== 'monster') return false;

    // Move from hand to collection
    hand.splice(cardIndex, 1);
    this.current.collection.push(card);

    this.addLog(`${this.currentPlayerName()} 將 ${card.emoji} ${card.name} 放入收集站 (${this.current.collection.length}/${this.targetCards})`);

    // Check win condition
    if (this.current.collection.length >= this.targetCards) {
      this.state.gameOver = true;
      this.state.winner = this.state.currentPlayer;
      this.addLog(`🏆 ${this.currentPlayerName()} 收集了 ${this.targetCards} 張怪物卡，獲勝！`);
      this.onVictory(this.state.currentPlayer);
      this.emitState();
      return true;
    }

    this.state.phase = 'discard';
    this.checkDiscard();
    return true;
  }

  /**
   * Phase 2b: Use a skill card
   */
  useSkill(cardUid) {
    if (this.state.phase !== 'action') return false;

    const hand = this.current.hand;
    const cardIndex = hand.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return false;

    const card = hand[cardIndex];
    if (card.type !== 'skill') return false;

    // Remove skill from hand, add to discard
    hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);

    switch (card.effect) {
      case 'steal':
        return this.executeSteal(card);
      case 'shield':
        return this.executeShield(card);
      case 'bomb':
        return this.executeBomb(card);
      case 'freeze':
        return this.executeFreeze(card);
    }

    return false;
  }

  executeSteal(card) {
    // Find opponents with cards in collection
    const targets = this.state.players.filter((p, i) => 
      i !== this.state.currentPlayer && p.collection.length > 0
    );

    if (targets.length === 0) {
      this.addLog(`${this.currentPlayerName()} 使用了 ⚡搶奪，但沒有可偷取的目標！`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return true;
    }

    // Need to select target
    this.state.phase = 'waiting';
    this.emitState();
    this.onNeedTarget('steal', targets, (targetIndex) => {
      this.resolveSteal(targetIndex);
    });
    return true;
  }

  resolveSteal(targetIndex) {
    const target = this.state.players[targetIndex];
    
    // Check shield
    if (target.hasShield) {
      target.hasShield = false;
      this.addLog(`${this.currentPlayerName()} 嘗試搶奪 ${target.name}，但被 🛡️護盾 擋住了！`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return;
    }

    // Need to choose which card to steal from target's collection
    if (target.collection.length === 1) {
      // Only one card, auto-select
      this.resolveStealCard(targetIndex, 0);
    } else {
      this.onNeedStealChoice(targetIndex, target.collection, (cardIdx) => {
        this.resolveStealCard(targetIndex, cardIdx);
      });
    }
  }

  resolveStealCard(targetIndex, cardIdx) {
    const target = this.state.players[targetIndex];
    const stolen = target.collection.splice(cardIdx, 1)[0];
    this.current.hand.push(stolen);
    
    this.addLog(`${this.currentPlayerName()} 從 ${target.name} 的收集站偷走了 ${stolen.emoji} ${stolen.name}！`);
    
    this.state.phase = 'discard';
    this.checkDiscard();
  }

  executeShield(card) {
    this.current.hasShield = true;
    this.addLog(`${this.currentPlayerName()} 啟動了 🛡️護盾！收集站受到保護`);
    
    this.state.phase = 'discard';
    this.checkDiscard();
    return true;
  }

  executeBomb(card) {
    const bombPower = card.bombPower || 1;
    // Find opponents with cards in collection
    const targets = this.state.players.filter((p, i) => 
      i !== this.state.currentPlayer && p.collection.length > 0
    );

    if (targets.length === 0) {
      this.addLog(`${this.currentPlayerName()} 使用了 ${card.emoji}${card.name}，但沒有可炸毀的目標！`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return true;
    }

    this.state.phase = 'waiting';
    this._pendingBombPower = bombPower;
    this._pendingBombCard = card;
    this.emitState();
    this.onNeedTarget('bomb', targets, (targetIndex) => {
      this.resolveBomb(targetIndex);
    });
    return true;
  }

  resolveBomb(targetIndex) {
    const target = this.state.players[targetIndex];
    const bombPower = this._pendingBombPower || 1;
    const card = this._pendingBombCard;

    // Check shield
    if (target.hasShield) {
      target.hasShield = false;
      this.addLog(`${this.currentPlayerName()} 使用 ${card.emoji}${card.name} 攻擊 ${target.name}，但被 🛡️護盾 擋住了！`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return;
    }

    // Destroy random cards from collection
    const destroyCount = Math.min(bombPower, target.collection.length);
    const destroyed = [];
    for (let i = 0; i < destroyCount; i++) {
      const randomIdx = Math.floor(Math.random() * target.collection.length);
      const removedCard = target.collection.splice(randomIdx, 1)[0];
      this.state.discardPile.push(removedCard);
      destroyed.push(`${removedCard.emoji}${removedCard.name}`);
    }

    this.addLog(`💥 ${this.currentPlayerName()} 使用 ${card.emoji}${card.name} 炸毀了 ${target.name} 收集站的 ${destroyed.join('、')}！`);
    
    this._pendingBombPower = null;
    this._pendingBombCard = null;
    this.state.phase = 'discard';
    this.checkDiscard();
  }

  executeFreeze(card) {
    // Self-freeze: skip draw next turn
    this.current.skipDraw = true;
    this.addLog(`🥶 ${this.currentPlayerName()} 使用了靜止器！下一回合無法抽牌`);
    
    this.state.phase = 'discard';
    this.checkDiscard();
    return true;
  }

  /**
   * Phase 2c: Skip action
   */
  skipAction() {
    if (this.state.phase !== 'action') return false;

    this.addLog(`${this.currentPlayerName()} 跳過了行動階段`);
    this.state.phase = 'discard';
    this.checkDiscard();
    return true;
  }

  /**
   * Phase 3: Check if discard is needed
   */
  checkDiscard() {
    const MAX_HAND = 7;
    if (this.current.hand.length > MAX_HAND) {
      this.state.phase = 'discard';
      this.addLog(`${this.currentPlayerName()} 手牌超過 ${MAX_HAND} 張，需要棄牌`);
      this.emitState();
    } else {
      this.endTurn();
    }
  }

  /**
   * Discard a card
   */
  discardCard(cardUid) {
    if (this.state.phase !== 'discard') return false;

    const hand = this.current.hand;
    const cardIndex = hand.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return false;

    const card = hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(card);

    this.addLog(`${this.currentPlayerName()} 棄掉了 ${card.emoji} ${card.name}`);

    if (hand.length <= 7) {
      this.endTurn();
    } else {
      this.emitState();
    }

    return true;
  }

  /**
   * End current turn and go to next player
   */
  endTurn() {
    if (this.state.gameOver) return;

    this.state.currentPlayer = (this.state.currentPlayer + 1) % this.playerCount;
    if (this.state.currentPlayer === 0) {
      this.state.turnNumber++;
    }
    this.state.phase = 'draw';

    this.addLog(`--- ${this.currentPlayerName()} 的回合 ---`);
    this.emitState();
  }

  /**
   * Get available actions for current player
   */
  getAvailableActions() {
    const actions = [];
    const hand = this.current.hand;

    if (this.state.phase === 'draw') {
      actions.push({ type: 'draw', label: '抽牌' });
    }

    if (this.state.phase === 'action') {
      // Check for monster cards
      const monsters = hand.filter(c => c.type === 'monster');
      if (monsters.length > 0) {
        actions.push({ type: 'place', label: '放置怪物卡', cards: monsters });
      }

      // Check for skill cards
      const skills = hand.filter(c => c.type === 'skill');
      if (skills.length > 0) {
        actions.push({ type: 'skill', label: '使用技能卡', cards: skills });
      }

      actions.push({ type: 'skip', label: '跳過' });
    }

    if (this.state.phase === 'discard') {
      actions.push({ type: 'discard', label: `棄牌 (需棄 ${this.current.hand.length - 7} 張)` });
    }

    return actions;
  }

  /**
   * Get game stats
   */
  getStats() {
    return {
      deckCount: this.state.deck.length,
      discardCount: this.state.discardPile.length,
      topDiscard: this.state.discardPile.length > 0 
        ? this.state.discardPile[this.state.discardPile.length - 1] 
        : null,
      players: this.state.players.map(p => ({
        name: p.name,
        handCount: p.hand.length,
        collectionCount: p.collection.length,
        hasShield: p.hasShield
      }))
    };
  }

  /**
   * Serialize game state (for save/load)
   */
  serialize() {
    return JSON.stringify(this.state);
  }
}

window.MonsterCollectorGame = MonsterCollectorGame;
