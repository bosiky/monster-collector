/* ============================================
   Monster Collector — Network Manager (PeerJS)
   ============================================ */

class NetworkManager {
  constructor() {
    this.peer = null;
    this.connections = [];   // Host: list of client connections
    this.hostConnection = null; // Client: connection to host
    this.roomCode = '';
    this.role = null;        // 'host' | 'client'
    this.playerIndex = -1;   // This player's index (0=host, 1+=clients)
    this.playerName = '';
    this.playerNames = [];   // All player names in order

    // Callbacks
    this.onPlayerJoined = () => {};
    this.onPlayerLeft = () => {};
    this.onGameState = () => {};
    this.onAction = () => {};
    this.onNeedTarget = () => {};
    this.onNeedStealChoice = () => {};
    this.onVictory = () => {};
    this.onError = () => {};
    this.onConnected = () => {};
    this.onGameStarted = () => {};
    this.onWaiting = () => {};
    this.onLog = () => {};
  }

  /**
   * Generate a 6-char room code
   */
  _generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /**
   * Create a PeerJS peer instance
   */
  _createPeer(id) {
    return new Promise((resolve, reject) => {
      const peer = new Peer(id, {
        debug: 1
      });

      peer.on('open', (peerId) => {
        console.log('[Net] Peer opened:', peerId);
        resolve(peer);
      });

      peer.on('error', (err) => {
        console.error('[Net] Peer error:', err);
        if (err.type === 'unavailable-id') {
          reject(new Error('ROOM_EXISTS'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * HOST: Create a room and wait for players
   */
  async createRoom(hostName, maxPlayers = 2) {
    this.role = 'host';
    this.playerIndex = 0;
    this.playerName = hostName;
    this.playerNames = [hostName];
    this.maxPlayers = maxPlayers;

    // Try generating unique room code
    let retries = 3;
    while (retries > 0) {
      this.roomCode = this._generateRoomCode();
      const peerId = `mc-${this.roomCode}`;
      try {
        this.peer = await this._createPeer(peerId);
        break;
      } catch (err) {
        if (err.message === 'ROOM_EXISTS' && retries > 1) {
          retries--;
          continue;
        }
        throw err;
      }
    }

    // Listen for incoming connections
    this.peer.on('connection', (conn) => {
      this._handleHostConnection(conn);
    });

    return this.roomCode;
  }

  /**
   * HOST: Handle a new client connection
   */
  _handleHostConnection(conn) {
    if (this.connections.length >= this.maxPlayers - 1) {
      conn.on('open', () => {
        conn.send({ type: 'error', message: '房間已滿' });
        setTimeout(() => conn.close(), 500);
      });
      return;
    }

    conn.on('open', () => {
      console.log('[Net] Client connected:', conn.peer);
    });

    conn.on('data', (data) => {
      if (data.type === 'join') {
        // Register client
        const clientIndex = this.connections.length + 1;
        conn.playerIndex = clientIndex;
        conn.playerName = data.name || `玩家${clientIndex + 1}`;
        this.connections.push(conn);
        this.playerNames.push(conn.playerName);

        // Notify the client of their index
        conn.send({
          type: 'joined',
          playerIndex: clientIndex,
          playerNames: [...this.playerNames],
          roomCode: this.roomCode
        });

        // Notify all about the new player
        this.onPlayerJoined({
          index: clientIndex,
          name: conn.playerName,
          playerNames: [...this.playerNames],
          totalPlayers: this.connections.length + 1
        });

        // Update all existing clients with new player list
        this.connections.forEach(c => {
          if (c !== conn) {
            c.send({
              type: 'player-list',
              playerNames: [...this.playerNames]
            });
          }
        });
      }

      if (data.type === 'action') {
        this.onAction({
          playerIndex: conn.playerIndex,
          action: data.action,
          payload: data.payload
        });
      }
    });

    conn.on('close', () => {
      const idx = this.connections.indexOf(conn);
      if (idx !== -1) {
        this.connections.splice(idx, 1);
        this.onPlayerLeft({
          index: conn.playerIndex,
          name: conn.playerName
        });
      }
    });
  }

  /**
   * HOST: Broadcast personalized game state to each client
   */
  broadcastState(fullState) {
    this.connections.forEach(conn => {
      const sanitized = this._sanitizeStateForPlayer(fullState, conn.playerIndex);
      conn.send({
        type: 'game-state',
        state: sanitized
      });
    });
  }

  /**
   * HOST: Send a message to a specific client
   */
  sendToClient(playerIndex, message) {
    const conn = this.connections.find(c => c.playerIndex === playerIndex);
    if (conn) {
      conn.send(message);
    }
  }

  /**
   * HOST: Broadcast to all clients
   */
  broadcast(message) {
    this.connections.forEach(conn => {
      conn.send(message);
    });
  }

  /**
   * Sanitize game state for a specific player
   * - Only reveal that player's hand cards
   * - Other players: show hand count only
   */
  _sanitizeStateForPlayer(state, playerIndex) {
    return {
      deck: { count: state.deck.length },
      players: state.players.map((p, i) => {
        if (i === playerIndex) {
          // Full info for this player
          return { ...p };
        } else {
          // Hide hand details
          return {
            index: p.index,
            name: p.name,
            hand: { length: p.hand.length },
            collection: p.collection,
            hasShield: p.hasShield
          };
        }
      }),
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      turnNumber: state.turnNumber,
      gameOver: state.gameOver,
      winner: state.winner,
      myIndex: playerIndex
    };
  }

  /**
   * CLIENT: Join a room by code
   */
  async joinRoom(roomCode, playerName) {
    this.role = 'client';
    this.roomCode = roomCode.toUpperCase();
    this.playerName = playerName;

    // Create a random peer ID for the client
    const clientId = `mc-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    this.peer = await this._createPeer(clientId);

    return new Promise((resolve, reject) => {
      const hostId = `mc-${this.roomCode}`;
      const conn = this.peer.connect(hostId, { reliable: true });

      const timeout = setTimeout(() => {
        reject(new Error('連線逾時，請確認房間碼是否正確'));
      }, 10000);

      conn.on('open', () => {
        clearTimeout(timeout);
        this.hostConnection = conn;

        // Send join request
        conn.send({
          type: 'join',
          name: this.playerName
        });
      });

      conn.on('data', (data) => {
        this._handleClientMessage(data, resolve);
      });

      conn.on('close', () => {
        console.log('[Net] Disconnected from host');
        this.onError({ message: '與房主的連線中斷' });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error('連線失敗: ' + err.message));
      });
    });
  }

  /**
   * CLIENT: Handle messages from host
   */
  _handleClientMessage(data, resolveJoin) {
    switch (data.type) {
      case 'joined':
        this.playerIndex = data.playerIndex;
        this.playerNames = data.playerNames;
        if (resolveJoin) resolveJoin({ playerIndex: this.playerIndex, playerNames: this.playerNames });
        this.onConnected({ playerIndex: this.playerIndex, playerNames: this.playerNames });
        break;

      case 'player-list':
        this.playerNames = data.playerNames;
        this.onPlayerJoined({ playerNames: data.playerNames, totalPlayers: data.playerNames.length });
        break;

      case 'game-start':
        this.onGameStarted(data);
        break;

      case 'game-state':
        this.onGameState(data.state);
        break;

      case 'need-target':
        this.onNeedTarget(data.action, data.targets);
        break;

      case 'need-steal-choice':
        this.onNeedStealChoice(data.targetIndex, data.cards);
        break;

      case 'victory':
        this.onVictory(data.playerIndex);
        break;

      case 'log':
        this.onLog(data.entry);
        break;

      case 'waiting':
        this.onWaiting(data.message);
        break;

      case 'error':
        this.onError({ message: data.message });
        break;
    }
  }

  /**
   * CLIENT: Send an action to host
   */
  sendAction(action, payload = {}) {
    if (this.hostConnection) {
      this.hostConnection.send({
        type: 'action',
        action,
        payload
      });
    }
  }

  /**
   * Clean up connections
   */
  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections = [];
    this.hostConnection = null;
    this.role = null;
  }
}

window.NetworkManager = NetworkManager;
