/* ============================================
   Monster Collector — Game Engine
   ============================================ */

class MonsterCollectorGame {
  constructor(config) {
    this.playerCount = config.playerCount || 2;
    this.targetCards = config.targetCards || 12;
    this.maxHand = config.maxHand || 7;
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
    this.onMonsterAutoPlaced = config.onMonsterAutoPlaced || (() => {});

    this.state = null;
    this.init();
  }

  init() {
    const deck = shuffleDeck(createDeck(this.playerCount));

    // Assign random station cards to players
    const stations = CARD_DATA.stations ? [...CARD_DATA.stations] : [];
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
        extraDraw: false,
        stationCard: stations[i % stations.length] || null
      })),
      currentPlayer: 0,
      phase: 'draw',  // 'draw' | 'action' | 'discard' | 'waiting'
      turnNumber: 1,
      gameOver: false,
      winner: null,
      log: [],
      lastDrawnCard: null,
      luckyStarUsed: false,  // Only one lucky star per game
      drawsThisTurn: 0,      // Track draws this turn
      maxDrawsThisTurn: 1    // Normal = 1, lucky star = 2
    };

    this.addLog(`遊戲開始！${this.playerCount} 人對戰`);
    this.addLog(`目標：收集 ${this.targetCards} 張不重複的怪物卡`);
    this.addLog(`每位玩家從 0 張手牌開始，輪流抽牌`);
    this.addLog(`${this.currentPlayerName()} 的回合`);
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

  /** Return cards to deck and reshuffle */
  returnToDeck(...cards) {
    cards.forEach(c => this.state.deck.push(c));
    this.state.deck = shuffleDeck(this.state.deck);
  }

  // --- Core Actions ---

  /**
   * Phase 1: Draw a card from deck
   * Monster cards auto-place to collection (or return to deck if duplicate)
   * Skill cards go to hand for later use
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

    // Set up extra draw for this turn (from previous lucky star)
    if (this.state.drawsThisTurn === 0 && this.current.extraDraw) {
      this.state.maxDrawsThisTurn = 2;
      this.current.extraDraw = false;
      this.addLog(`⭐ ${this.currentPlayerName()} 幸運星效果啟動！本回合可抽 2 張牌`);
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
    this.state.lastDrawnCard = card;
    this.state.drawsThisTurn++;

    if (card.type === 'monster') {
      // Check for duplicate in collection
      const hasDuplicate = this.current.collection.some(c => c.id === card.id);
      
      if (hasDuplicate) {
        this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name}，但收集站已有相同怪物！卡牌回到牌堆`);
        this.returnToDeck(card);
      } else {
        // Auto place to collection
        this.current.collection.push(card);
        this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name}，自動放入收集站！(${this.current.collection.length}/${this.targetCards})`);
        
        // Lucky Star check (15% chance, once per game, only on successful monster placement)
        if (!this.state.luckyStarUsed && Math.random() < 0.15) {
          this.state.luckyStarUsed = true;
          this.current.extraDraw = true;
          this.addLog(`⭐🌟 幸運星降臨！${this.currentPlayerName()} 下回合可以抽取 2 張卡牌！`);
          this.onMonsterAutoPlaced(card, 'lucky');
        } else {
          this.onMonsterAutoPlaced(card, 'placed');
        }

        // Check win condition
        if (this.current.collection.length >= this.targetCards) {
          this.state.gameOver = true;
          this.state.winner = this.state.currentPlayer;
          this.addLog(`🏆 ${this.currentPlayerName()} 收集了 ${this.targetCards} 張怪物卡，獲勝！`);
          this.onVictory(this.state.currentPlayer);
          this.emitState();
          return card;
        }
      }

      // Check if more draws available
      if (this.state.drawsThisTurn < this.state.maxDrawsThisTurn) {
        // Stay in draw phase for extra draw
        this.addLog(`🃏 還可以再抽 ${this.state.maxDrawsThisTurn - this.state.drawsThisTurn} 張牌`);
        this.state.phase = 'draw';
      } else {
        this.state.phase = 'action';
      }
      if (!hasDuplicate) {
        // Already called onMonsterAutoPlaced above
      } else {
        this.onMonsterAutoPlaced(card, 'duplicate');
      }
      this.emitState();
      return card;
    } else {
      // Skill card: goes to hand
      this.current.hand.push(card);
      this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name} (技能卡)`);
      
      // Check if more draws available
      if (this.state.drawsThisTurn < this.state.maxDrawsThisTurn) {
        this.addLog(`🃏 還可以再抽 ${this.state.maxDrawsThisTurn - this.state.drawsThisTurn} 張牌`);
        this.state.phase = 'draw';
      } else {
        this.state.phase = 'action';
      }
      this.emitState();
      return card;
    }
  }

  /**
   * Phase 2: Use a skill card
   */
  useSkill(cardUid) {
    if (this.state.phase !== 'action') return false;

    const hand = this.current.hand;
    const cardIndex = hand.findIndex(c => c.uid === cardUid);
    if (cardIndex === -1) return false;

    const card = hand[cardIndex];
    if (card.type !== 'skill') return false;

    // Remove skill from hand
    hand.splice(cardIndex, 1);

    // Shield is special: auto-attach to station
    if (card.effect === 'shield') {
      return this.executeShield(card);
    }

    // Other skills: add to discard temporarily (will be moved as needed)
    this.state.discardPile.push(card);

    switch (card.effect) {
      case 'steal':
        return this.executeSteal(card);
      case 'bomb':
        return this.executeBomb(card);
      case 'freeze':
        return this.executeFreeze(card);
    }

    return false;
  }

  executeSteal(card) {
    const targets = this.state.players.filter((p, i) => 
      i !== this.state.currentPlayer && p.collection.length > 0
    );

    if (targets.length === 0) {
      this.addLog(`${this.currentPlayerName()} 使用了 🦹盜賊卡，但沒有可偷取的目標！`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return true;
    }

    this.state.phase = 'waiting';
    this.emitState();
    this.onNeedTarget('steal', targets, (targetIndex) => {
      this.resolveSteal(targetIndex, card);
    });
    return true;
  }

  resolveSteal(targetIndex, attackCard) {
    const target = this.state.players[targetIndex];
    
    // Check shield - both shield and attack card return to deck
    if (target.hasShield) {
      target.hasShield = false;
      // Remove attack card from discard pile, return both to deck
      const attackIdx = this.state.discardPile.findIndex(c => c.uid === attackCard.uid);
      if (attackIdx !== -1) this.state.discardPile.splice(attackIdx, 1);
      this.returnToDeck(attackCard);
      // Shield card already consumed when hasShield was set
      this.addLog(`${this.currentPlayerName()} 嘗試搶奪 ${target.name}，但被 🛡️護盾 擋住了！雙方卡牌回到牌堆`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return;
    }

    if (target.collection.length === 1) {
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
    
    // Check if current player already has this monster in collection
    const hasDup = this.current.collection.some(c => c.id === stolen.id);
    if (hasDup) {
      // Can't have duplicate - card goes to hand instead
      this.current.hand.push(stolen);
      this.addLog(`${this.currentPlayerName()} 從 ${target.name} 偷走了 ${stolen.emoji}${stolen.name}（收集站已有相同怪物，放入手牌）`);
    } else {
      this.current.collection.push(stolen);
      this.addLog(`${this.currentPlayerName()} 從 ${target.name} 偷走了 ${stolen.emoji}${stolen.name} 放入收集站！`);

      // Check win
      if (this.current.collection.length >= this.targetCards) {
        this.state.gameOver = true;
        this.state.winner = this.state.currentPlayer;
        this.addLog(`🏆 ${this.currentPlayerName()} 收集了 ${this.targetCards} 張怪物卡，獲勝！`);
        this.onVictory(this.state.currentPlayer);
        this.emitState();
        return;
      }
    }
    
    this.state.phase = 'discard';
    this.checkDiscard();
  }

  executeShield(card) {
    this.current.hasShield = true;
    // Store the shield card reference for later return to deck
    this.current._shieldCard = card;
    this.addLog(`${this.currentPlayerName()} 掛上了 🛡️防禦盾！收集站受到保護`);
    
    this.state.phase = 'discard';
    this.checkDiscard();
    return true;
  }

  executeBomb(card) {
    const bombPower = card.bombPower || 1;
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

    // Check shield - both shield and bomb return to deck
    if (target.hasShield) {
      target.hasShield = false;
      // Remove bomb from discard, return both to deck
      const bombIdx = this.state.discardPile.findIndex(c => c.uid === card.uid);
      if (bombIdx !== -1) this.state.discardPile.splice(bombIdx, 1);
      const returnCards = [card];
      if (target._shieldCard) {
        returnCards.push(target._shieldCard);
        target._shieldCard = null;
      }
      this.returnToDeck(...returnCards);
      this.addLog(`${this.currentPlayerName()} 使用 ${card.emoji}${card.name} 攻擊 ${target.name}，但被 🛡️護盾 擋住了！雙方卡牌回到牌堆`);
      this.state.phase = 'discard';
      this.checkDiscard();
      return;
    }

    // Destroy random cards - they go back to deck (shuffled), not discard
    const destroyCount = Math.min(bombPower, target.collection.length);
    const destroyed = [];
    for (let i = 0; i < destroyCount; i++) {
      const randomIdx = Math.floor(Math.random() * target.collection.length);
      const removedCard = target.collection.splice(randomIdx, 1)[0];
      destroyed.push(removedCard);
    }
    
    // Return destroyed cards to deck
    this.returnToDeck(...destroyed);

    this.addLog(`💥 ${this.currentPlayerName()} 使用 ${card.emoji}${card.name} 炸毀了 ${target.name} 收集站的 ${destroyed.map(c => `${c.emoji}${c.name}`).join('、')}！卡牌回到牌堆`);
    
    this._pendingBombPower = null;
    this._pendingBombCard = null;
    this.state.phase = 'discard';
    this.checkDiscard();
  }

  executeFreeze(card) {
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
    if (this.current.hand.length > this.maxHand) {
      this.state.phase = 'discard';
      this.addLog(`${this.currentPlayerName()} 手牌超過 ${this.maxHand} 張，需要棄牌`);
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

    if (hand.length <= this.maxHand) {
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

    this.state.lastDrawnCard = null;
    this.state.drawsThisTurn = 0;
    this.state.maxDrawsThisTurn = 1;
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
      // Only skill cards need manual action now (monsters auto-place)
      const skills = hand.filter(c => c.type === 'skill');
      if (skills.length > 0) {
        actions.push({ type: 'skill', label: '使用技能卡', cards: skills });
      }

      actions.push({ type: 'skip', label: '跳過' });
    }

    if (this.state.phase === 'discard') {
      actions.push({ type: 'discard', label: `棄牌 (需棄 ${this.current.hand.length - this.maxHand} 張)` });
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
