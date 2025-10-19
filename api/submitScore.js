// api/submitScore.js
let scores = []; // Geçici veri saklama (production'da veritabanı kullanın)

export default async function handler(req, res) {
  // CORS ayarları - Farcaster frame'lerden erişim için
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { playerName, score, fid } = req.body;

    // Validasyon
    if (!playerName || !score) {
      return res.status(400).json({ 
        success: false,
        message: "playerName ve score gerekli" 
      });
    }

    // Skor tipini kontrol et
    const numericScore = parseInt(score);
    if (isNaN(numericScore) || numericScore < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Geçersiz skor değeri" 
      });
    }

    // Yeni skor ekle
    const newScore = {
      playerName: playerName.substring(0, 50), // Max 50 karakter
      score: numericScore,
      fid: fid || null,
      timestamp: new Date().toISOString()
    };

    scores.push(newScore);

    // Skorları sıralı tut (en yüksek 100 skoru sakla)
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 100);

    console.log(`✅ Yeni skor: ${playerName} - ${numericScore}`);

    return res.status(200).json({ 
      success: true,
      message: "Skor başarıyla kaydedildi",
      rank: scores.findIndex(s => 
        s.playerName === playerName && 
        s.score === numericScore && 
        s.timestamp === newScore.timestamp
      ) + 1
    });
  }

  return res.status(405).json({ 
    success: false,
    message: "Sadece POST istekleri kabul edilir" 
  });
}
