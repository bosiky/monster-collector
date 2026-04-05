/* ============================================
   Monster Collector — Animations
   ============================================ */

const Animations = {
  /**
   * Create floating particles in background
   */
  initParticles(container, count = 30) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (6 + Math.random() * 6) + 's';
      particle.style.width = (2 + Math.random() * 4) + 'px';
      particle.style.height = particle.style.width;

      const colors = ['#a855f7', '#f59e0b', '#3b82f6', '#22c55e', '#ef4444'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];

      container.appendChild(particle);
    }
  },

  /**
   * Card deal animation
   */
  dealCard(cardEl, index) {
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'translateY(-60px) rotateZ(10deg) scale(0.5)';
    
    setTimeout(() => {
      cardEl.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      cardEl.style.opacity = '1';
      cardEl.style.transform = 'translateY(0) rotateZ(0) scale(1)';
      
      setTimeout(() => {
        cardEl.style.transition = '';
      }, 600);
    }, index * 120);
  },

  /**
   * Card draw animation from deck
   */
  async drawCard(cardEl, deckEl) {
    return new Promise(resolve => {
      if (deckEl) {
        const deckRect = deckEl.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const dx = deckRect.left - cardRect.left;
        const dy = deckRect.top - cardRect.top;
        
        cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
        cardEl.style.opacity = '0';
      } else {
        cardEl.style.transform = 'translateY(-40px) scale(0.5)';
        cardEl.style.opacity = '0';
      }

      requestAnimationFrame(() => {
        cardEl.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        cardEl.style.transform = 'translateY(0) scale(1)';
        cardEl.style.opacity = '1';

        setTimeout(() => {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
          resolve();
        }, 550);
      });
    });
  },

  /**
   * Card collect animation (hand -> station)
   */
  async collectCard(cardEl, targetSlotEl) {
    return new Promise(resolve => {
      const cardRect = cardEl.getBoundingClientRect();
      const slotRect = targetSlotEl.getBoundingClientRect();
      const dx = slotRect.left - cardRect.left + (slotRect.width - cardRect.width) / 2;
      const dy = slotRect.top - cardRect.top + (slotRect.height - cardRect.height) / 2;

      cardEl.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
      cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
      cardEl.style.zIndex = '100';

      setTimeout(() => {
        cardEl.style.opacity = '0';
        setTimeout(() => {
          resolve();
        }, 200);
      }, 400);
    });
  },

  /**
   * Card steal flash effect
   */
  async stealEffect(sourceEl, targetEl) {
    return new Promise(resolve => {
      // Flash on source
      if (sourceEl) {
        sourceEl.style.transition = 'all 0.3s ease';
        sourceEl.style.boxShadow = '0 0 40px rgba(239,68,68,0.8)';
        sourceEl.style.filter = 'brightness(1.5)';
        
        setTimeout(() => {
          sourceEl.style.boxShadow = '';
          sourceEl.style.filter = '';
          sourceEl.style.transition = '';
        }, 600);
      }

      // Lightning flash overlay
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed; inset: 0; 
        background: rgba(239,68,68,0.15);
        z-index: 9999; pointer-events: none;
        animation: flash-out 0.3s ease forwards;
      `;
      document.body.appendChild(flash);

      setTimeout(() => {
        flash.remove();
        resolve();
      }, 400);
    });
  },

  /**
   * Shield activation effect
   */
  async shieldEffect(playerStationEl) {
    return new Promise(resolve => {
      const shield = document.createElement('div');
      shield.style.cssText = `
        position: absolute; inset: -4px;
        border: 3px solid #3b82f6;
        border-radius: 20px;
        box-shadow: 0 0 30px rgba(59,130,246,0.5), inset 0 0 20px rgba(59,130,246,0.2);
        animation: shield-activate 0.8s ease;
        pointer-events: none;
        z-index: 50;
      `;
      
      if (playerStationEl) {
        playerStationEl.style.position = 'relative';
        playerStationEl.appendChild(shield);
      }

      setTimeout(() => {
        resolve();
      }, 800);
    });
  },

  /**
   * Victory celebration
   */
  celebration(container) {
    const emojis = ['🎉', '🏆', '⭐', '✨', '💎', '🎊', '🌟', '👑'];
    
    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}%;
        top: -50px;
        font-size: ${1 + Math.random() * 2}rem;
        z-index: 10000;
        pointer-events: none;
        animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
        animation-delay: ${Math.random() * 2}s;
      `;
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 6000);
    }
  },

  /**
   * Shake element (e.g., when shield blocks steal)
   */
  async shake(el) {
    return new Promise(resolve => {
      el.style.animation = 'shake 0.5s ease';
      setTimeout(() => {
        el.style.animation = '';
        resolve();
      }, 500);
    });
  },

  /**
   * Flash text notification
   */
  showNotification(text, type = 'info') {
    const notif = document.createElement('div');
    const colors = {
      info: '#3b82f6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444'
    };
    
    notif.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      padding: 12px 24px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 12px;
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 600;
      font-size: 1rem;
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      text-align: center;
    `;
    notif.textContent = text;
    document.body.appendChild(notif);

    requestAnimationFrame(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => notif.remove(), 300);
    }, 2500);
  }
};

// Add dynamic keyframes
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes flash-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes shield-activate {
    0% { opacity: 0; transform: scale(1.2); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0.7; transform: scale(1); }
  }
  @keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(styleSheet);

window.Animations = Animations;
