/* ============================================
   Monster Collector — Game Engine
   ============================================ */

class MonsterCollectorGame {
  constructor(config) {
    this.playerCount = config.playerCount || 2;
    this.targetCards = config.targetCards || 12;
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
      phase: 'draw',  // 'draw' | 'waiting'
      turnNumber: 1,
      gameOver: false,
      winner: null,
      log: [],
      lastDrawnCard: null,
      drawsThisTurn: 0,
      maxDrawsThisTurn: 1
    };

    this.addLog(`遊戲開始！${this.playerCount} 人對戰`);
    this.addLog(`目標：最快收集 ${this.targetCards} 張不重複的怪物卡`);
    this.addLog(`遊戲機制更新：所有技能卡抽到後立即自動使用！沒有手牌與棄牌區！`);
    this.addLog(`--- ${this.currentPlayerName()} 的回合 ---`);
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
    let reallCards = [];
    cards.forEach(c => {
      if(c) reallCards.push(c);
    });
    if (reallCards.length === 0) return;
    
    reallCards.forEach(c => this.state.deck.push(c));
    this.state.deck = shuffleDeck(this.state.deck);
  }

  // --- Core Actions ---

  /**
   * Phase 1: Draw a card from deck
   * Monster cards auto-place. Skill cards auto-trigger.
   */
  drawCard() {
    if (this.state.phase !== 'draw') return false;
    if (this.state.gameOver) return false;

    // Check freeze: skip draw this turn
    if (this.current.skipDraw) {
      this.current.skipDraw = false;
      this.addLog(`🥶 ${this.currentPlayerName()} 被靜止器影響，本回合無法抽牌！`);
      this.endTurn();
      return false;
    }

    // Set up extra draw for this turn (from previous lucky star)
    if (this.state.drawsThisTurn === 0 && this.current.extraDraw) {
      this.state.maxDrawsThisTurn = 2;
      this.current.extraDraw = false;
      this.addLog(`⭐ ${this.currentPlayerName()} 幸運星效果啟動！本回合可連續抽牌`);
    }

    if (this.state.deck.length === 0) {
      this.addLog('牌堆已空，無法抽牌！遊戲將以平局結束或跳過。');
      this.endTurn();
      return false;
    }

    const card = this.state.deck.pop();
    this.state.lastDrawnCard = card;
    this.state.drawsThisTurn++;

    if (card.type === 'monster') {
      const hasDuplicate = this.current.collection.some(c => c.id === card.id);
      
      if (hasDuplicate) {
        this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name}，但已有相同怪物！卡牌洗回牌堆`);
        this.returnToDeck(card);
        this.onMonsterAutoPlaced(card, 'duplicate');
        this.afterAction();
      } else {
        // Auto place to collection
        this.current.collection.push(card);
        
        // Lucky Star check (15% chance, no limit but cannot stack heavily)
        let eventType = 'placed';
        if (!this.current.extraDraw && Math.random() < 0.15) {
          this.current.extraDraw = true;
          eventType = 'lucky';
        }
        
        // Let UI handle the animation and potentially log/display lucky star
        this.onMonsterAutoPlaced(card, eventType);

        // Check win condition
        if (this.current.collection.length >= this.targetCards) {
          this.state.gameOver = true;
          this.state.winner = this.state.currentPlayer;
          this.addLog(`🏆 ${this.currentPlayerName()} 收集了 ${this.targetCards} 張怪物卡，獲勝！`);
          this.onVictory(this.state.currentPlayer);
          this.emitState();
          return card;
        }

        this.afterAction();
      }
      return card;
    } else {
      // Skill card handles immediately!
      this.addLog(`${this.currentPlayerName()} 抽到了 ${card.emoji} ${card.name} (技能卡)`);
      this.handleSkillDrawn(card);
      return card;
    }
  }

  handleSkillDrawn(card) {
    if (card.effect === 'shield') {
      this.current.hasShield = true;
      this.current._shieldCard = card;
      this.addLog(`${this.currentPlayerName()} 掛上了 🛡️防禦盾！收集站受到保護`);
      this.afterAction();
      return;
    }

    switch (card.effect) {
      case 'steal':
        this.executeSteal(card);
        break;
      case 'bomb':
        this.executeBomb(card);
        break;
      case 'freeze':
        this.executeFreeze(card);
        break;
    }
  }

  executeFreeze(card) {
    const nextPlayerIdx = (this.state.currentPlayer + 1) % this.playerCount;
    this.state.players[nextPlayerIdx].skipDraw = true;
    this.addLog(`🥶 ${this.currentPlayerName()} 使用了靜止器！${this.state.players[nextPlayerIdx].name} 下一回合無法抽牌`);
    this.returnToDeck(card);
    this.afterAction();
  }

  executeSteal(card) {
    const targets = this.state.players.filter((p, i) => 
      i !== this.state.currentPlayer && p.collection.length > 0
    );

    if (targets.length === 0) {
      this.addLog(`${this.currentPlayerName()} 使用了 🦹盜賊卡，但沒有目標！卡牌失效並洗回牌堆。`);
      this.returnToDeck(card);
      this.afterAction();
      return;
    }

    this.state.phase = 'waiting';
    this._pendingActionCard = card;
    this.emitState();
    this.onNeedTarget('steal', targets, (targetIndex) => {
      this.resolveSteal(targetIndex);
    });
  }

  resolveSteal(targetIndex) {
    const target = this.state.players[targetIndex];
    const attackCard = this._pendingActionCard;
    this._pendingActionCard = null;
    
    // Check shield - both shield and attack card return to deck
    if (target.hasShield) {
      target.hasShield = false;
      const shieldCard = target._shieldCard;
      target._shieldCard = null;
      
      this.returnToDeck(attackCard, shieldCard);
      this.addLog(`${this.currentPlayerName()} 嘗試對 ${target.name} 偷取，但被 🛡️護盾 擋住了！雙方卡牌抵銷洗回牌堆`);
      this.afterAction();
      return;
    }

    if (target.collection.length === 1) {
      this.resolveStealCard(targetIndex, 0, attackCard);
    } else {
      this.onNeedStealChoice(targetIndex, target.collection, (cardIdx) => {
        this.resolveStealCard(targetIndex, cardIdx, attackCard);
      });
    }
  }

  resolveStealCard(targetIndex, cardIdx, attackCard) {
    const target = this.state.players[targetIndex];
    const stolen = target.collection.splice(cardIdx, 1)[0];
    
    const hasDup = this.current.collection.some(c => c.id === stolen.id);
    if (hasDup) {
      // Goes back to deck since we have no hand
      this.returnToDeck(stolen);
      this.addLog(`${this.currentPlayerName()} 從 ${target.name} 偷走了 ${stolen.emoji}${stolen.name}（但收集站已有相同怪物，洗回牌堆）`);
    } else {
      this.current.collection.push(stolen);
      this.addLog(`${this.currentPlayerName()} 從 ${target.name} 偷走了 ${stolen.emoji}${stolen.name} 放入收集站！`);

      if (this.current.collection.length >= this.targetCards) {
        this.state.gameOver = true;
        this.state.winner = this.state.currentPlayer;
        this.addLog(`🏆 ${this.currentPlayerName()} 收集了 ${this.targetCards} 張怪物卡，獲勝！`);
        this.onVictory(this.state.currentPlayer);
        this.emitState();
        return;
      }
    }
    
    this.returnToDeck(attackCard);
    this.afterAction();
  }

  executeBomb(card) {
    const targets = this.state.players.filter((p, i) => 
      i !== this.state.currentPlayer && p.collection.length > 0
    );

    if (targets.length === 0) {
      this.addLog(`${this.currentPlayerName()} 使用了 ${card.emoji}${card.name}，但沒有目標！卡牌失效並洗回牌堆。`);
      this.returnToDeck(card);
      this.afterAction();
      return;
    }

    this.state.phase = 'waiting';
    this._pendingActionCard = card;
    this._pendingBombPower = card.bombPower || 1;
    this.emitState();
    this.onNeedTarget('bomb', targets, (targetIndex) => {
      this.resolveBomb(targetIndex);
    });
  }

  resolveBomb(targetIndex) {
    const target = this.state.players[targetIndex];
    const bombPower = this._pendingBombPower || 1;
    const attackCard = this._pendingActionCard;
    this._pendingActionCard = null;
    this._pendingBombPower = null;

    if (target.hasShield) {
      target.hasShield = false;
      const shieldCard = target._shieldCard;
      target._shieldCard = null;

      this.returnToDeck(attackCard, shieldCard);
      this.addLog(`${this.currentPlayerName()} 使用 ${attackCard.emoji}${attackCard.name} 攻擊 ${target.name}，但被 🛡️護盾 擋住了！雙方卡牌抵銷洗回牌堆`);
      this.afterAction();
      return;
    }

    const destroyCount = Math.min(bombPower, target.collection.length);
    const destroyed = [];
    for (let i = 0; i < destroyCount; i++) {
      const randomIdx = Math.floor(Math.random() * target.collection.length);
      const removedCard = target.collection.splice(randomIdx, 1)[0];
      destroyed.push(removedCard);
    }
    
    this.returnToDeck(...destroyed, attackCard);
    this.addLog(`💥 ${this.currentPlayerName()} 使用 ${attackCard.emoji}${attackCard.name} 炸毀了 ${target.name} 收集站的 ${destroyed.map(c => `${c.emoji}${c.name}`).join('、')}！所有相關卡牌洗回牌堆`);
    
    this.afterAction();
  }

  skipAction() {
    // Only used conceptually now if a player passes their turn or draw.
    if (this.state.phase !== 'draw') return false;
    this.addLog(`${this.currentPlayerName()} 跳過了此回合`);
    this.endTurn();
    return true;
  }

  afterAction() {
    if (this.state.drawsThisTurn < this.state.maxDrawsThisTurn) {
      this.state.phase = 'draw';
      // Auto-draw the next card to save clicks? No, they still need to click draw manually
    } else {
      this.endTurn();
    }
  }

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

  getAvailableActions() {
    const actions = [];
    if (this.state.phase === 'draw') {
      let turnPrompt = '';
      if(this.state.maxDrawsThisTurn > 1 && this.state.drawsThisTurn > 0) {
        turnPrompt = ` (第 ${this.state.drawsThisTurn + 1} 次抽牌)`
      }
      actions.push({ type: 'draw', label: `抽牌${turnPrompt}` });
      actions.push({ type: 'skip', label: '跳過' });
    }
    return actions;
  }

  getStats() {
    return {
      deckCount: this.state.deck.length,
      discardCount: 0,
      topDiscard: null,
      players: this.state.players.map(p => ({
        name: p.name,
        handCount: 0,
        collectionCount: p.collection.length,
        hasShield: p.hasShield
      }))
    };
  }

  serialize() {
    return JSON.stringify(this.state);
  }
}

window.MonsterCollectorGame = MonsterCollectorGame;
