// api/leaderboard.js
// Not: Bu dosyayı api/ klasörüne ekleyin

// submitScore.js ile aynı veri yapısını paylaşmak için
// gerçek uygulamada veritabanı kullanın
let scores = [];

export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const limit = parseInt(req.query.limit) || 20;
    
    // En yüksek skorları al
    const topScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(limit, 100))
      .map((score, index) => ({
        rank: index + 1,
        playerName: score.playerName,
        score: score.score,
        timestamp: score.timestamp
      }));

    return res.status(200).json({
      success: true,
      count: topScores.length,
      leaderboard: topScores
    });
  }

  return res.status(405).json({ 
    success: false,
    message: "Sadece GET istekleri kabul edilir" 
  });
}
