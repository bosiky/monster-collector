/* ============================================
   Monster Collector — Card Generator
   ============================================ */

const Generator = {
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  },

  /**
   * Generate a card image on canvas
   */
  async generateCardImage(cardData, userImage = null) {
    const W = 630;
    const H = 880;
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.ctx;

    // Background
    const bgColors = {
      monster: ['#1e0a3c', '#0f1b4d'],
      skill: ['#0a1e3c', '#0f3d4d'],
      station: ['#0a3c1e', '#1a4d0f']
    };
    const colors = bgColors[cardData.type] || bgColors.monster;
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    this.roundRect(ctx, 0, 0, W, H, 24);
    ctx.fill();

    // Border
    const borderColors = {
      monster: '#f59e0b',
      skill: '#94a3b8',
      station: '#34d399'
    };
    ctx.strokeStyle = borderColors[cardData.type] || borderColors.monster;
    ctx.lineWidth = 6;
    this.roundRect(ctx, 3, 3, W - 6, H - 6, 22);
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 16, 16, W - 32, H - 32, 16);
    ctx.stroke();

    // Header area
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.roundRect(ctx, 24, 24, W - 48, 60, 10);
    ctx.fill();

    // Card name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${cardData.emoji || ''} ${cardData.name || ''}`, 40, 54);

    // Rarity stars
    if (cardData.rarity) {
      const stars = '★'.repeat(cardData.rarity);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(stars, W - 40, 54);
      ctx.textAlign = 'left';
    }

    // Image area
    const imgX = 30, imgY = 96;
    const imgW = W - 60, imgH = 480;

    // Image background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.roundRect(ctx, imgX, imgY, imgW, imgH, 12);
    ctx.fill();

    // Image border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, imgX, imgY, imgW, imgH, 12);
    ctx.stroke();

    // Draw image
    if (userImage) {
      ctx.save();
      this.roundRect(ctx, imgX + 2, imgY + 2, imgW - 4, imgH - 4, 10);
      ctx.clip();
      
      // Cover fit
      const imgRatio = userImage.width / userImage.height;
      const boxRatio = imgW / imgH;
      let sx = 0, sy = 0, sw = userImage.width, sh = userImage.height;
      if (imgRatio > boxRatio) {
        sw = userImage.height * boxRatio;
        sx = (userImage.width - sw) / 2;
      } else {
        sh = userImage.width / boxRatio;
        sy = (userImage.height - sh) / 2;
      }
      ctx.drawImage(userImage, sx, sy, sw, sh, imgX + 2, imgY + 2, imgW - 4, imgH - 4);
      ctx.restore();
    } else {
      // Placeholder emoji
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cardData.emoji || '?', W / 2, imgY + imgH / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // Rarity glow on image border
    if (cardData.rarity >= 3) {
      ctx.strokeStyle = 'rgba(245,158,11,0.5)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(245,158,11,0.4)';
      ctx.shadowBlur = 15;
      this.roundRect(ctx, imgX, imgY, imgW, imgH, 12);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Info area background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.roundRect(ctx, 24, 595, W - 48, H - 620, 12);
    ctx.fill();

    // Type label
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '600 16px "Cinzel", serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(cardData.type === 'monster' ? 'MONSTER' : 'SKILL', 44, 630);

    // English subtitle or effect text
    if (cardData.type === 'monster') {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillText(cardData.nameEn || '', 44, 660);
      
      // Description
      if (cardData.description) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '16px "Noto Sans TC", sans-serif';
        ctx.fillText(cardData.description, 44, 695);
      }
    } else {
      // Skill description
      if (cardData.description) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '20px "Noto Sans TC", sans-serif';
        this.wrapText(ctx, cardData.description, 44, 660, W - 88, 28);
      }
    }

    // Bottom decorative line
    const lineGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, borderColors[cardData.type]);
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, H - 50);
    ctx.lineTo(W - 100, H - 50);
    ctx.stroke();

    // Game name
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText('MONSTER COLLECTOR', W / 2, H - 30);
    ctx.textAlign = 'left';

    return this.canvas.toDataURL('image/png');
  },

  /**
   * Generate card back image
   */
  async generateCardBack() {
    const W = 630, H = 880;
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.ctx;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0d0d24');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, 0, 0, W, H, 24);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    this.roundRect(ctx, 3, 3, W - 6, H - 6, 22);
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 20, 20, W - 40, H - 40, 16);
    ctx.stroke();

    // Center mandala pattern (simplified)
    const cx = W / 2, cy = H / 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * 80;
      const y1 = cy + Math.sin(angle) * 80;
      const x2 = cx + Math.cos(angle) * 200;
      const y2 = cy + Math.sin(angle) * 200;
      
      ctx.strokeStyle = 'rgba(245,158,11,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center circle
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 100, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(168,85,247,0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.stroke();

    // MC text
    ctx.fillStyle = 'rgba(245,158,11,0.8)';
    ctx.font = 'bold 48px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(245,158,11,0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText('MC', cx, cy);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    return this.canvas.toDataURL('image/png');
  },

  /**
   * Export card as downloadable image
   */
  exportCard(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename + '.png';
    link.href = dataUrl;
    link.click();
  },

  // --- Utilities ---
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';
    let cy = y;
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, x, cy);
        line = char;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, cy);
  }
};

window.Generator = Generator;
