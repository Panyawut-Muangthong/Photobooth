// High quality aesthetic sample photos created via canvas/svg data URLs
// Provides instant photobooth test images so user can test filters, borders, and exports immediately

export function generateSamplePhoto(theme: 'pose1' | 'pose2' | 'pose3' | 'pose4'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const themes = {
    pose1: {
      bgGrad1: '#FFD1DC',
      bgGrad2: '#FFE4E1',
      title: 'Peace Pose ✌️',
      sub: 'Seoul Hongdae',
      accent: '#FF6B8B',
      avatarEmoji: '✌️😁'
    },
    pose2: {
      bgGrad1: '#D4E2D4',
      bgGrad2: '#FAF3E0',
      title: 'Heart Cheek 🫶',
      sub: 'Cafe Yeonnam',
      accent: '#65B741',
      avatarEmoji: '🫶😊'
    },
    pose3: {
      bgGrad1: '#C5DFF8',
      bgGrad2: '#EBF4F6',
      title: 'Wink Snap ✨',
      sub: 'Golden Hour',
      accent: '#4A90E2',
      avatarEmoji: '😉✨'
    },
    pose4: {
      bgGrad1: '#FEE180',
      bgGrad2: '#F8F9D2',
      title: 'Besties Laugh 🎀',
      sub: 'Studio Lensbooth',
      accent: '#F39C12',
      avatarEmoji: '🥰🌸'
    }
  };

  const current = themes[theme];

  // Draw smooth gradient background
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, current.bgGrad1);
  grad.addColorStop(1, current.bgGrad2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Soft decorative circles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(400, 300, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(400, 300, 170, 0, Math.PI * 2);
  ctx.fill();

  // Emoji avatar face
  ctx.font = '100px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(current.avatarEmoji, 400, 270);

  // Stylized title
  ctx.font = 'bold 36px "DM Sans", sans-serif';
  ctx.fillStyle = '#2C3E50';
  ctx.fillText(current.title, 400, 410);

  // Subtitle
  ctx.font = '600 20px "Space Mono", monospace';
  ctx.fillStyle = '#7F8C8D';
  ctx.fillText(`• ${current.sub} •`, 400, 460);

  // Film frame markers
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(20, 20, 8, 40);
  ctx.fillRect(772, 20, 8, 40);
  ctx.fillRect(20, 540, 8, 40);
  ctx.fillRect(772, 540, 8, 40);

  return canvas.toDataURL('image/jpeg', 0.95);
}
