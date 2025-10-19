// api/signScore.js - Oyun skorunu doğrula ve imzala
import { ethers } from 'ethers';

const PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY; // Verifier wallet'ın private key'i

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { 
      playerAddress, 
      farcasterUsername, 
      fid, 
      score,
      gameData // Oyun verisi (opsiyonel: doğrulama için)
    } = req.body;

    // 1. Validasyon
    if (!playerAddress || !farcasterUsername || !score) {
      return res.status(400).json({ 
        success: false,
        message: "Eksik parametreler" 
      });
    }

    const numericScore = parseInt(score);
    const numericFid = parseInt(fid) || 0;

    if (isNaN(numericScore) || numericScore <= 0 || numericScore > 10000) {
      return res.status(400).json({ 
        success: false,
        message: "Geçersiz skor" 
      });
    }

    // 2. Oyun doğrulaması (opsiyonel)
    // Burada oyun verisini analiz edebilirsiniz:
    // - Oyun süresi çok kısa mı? (hile)
    // - Skor makul aralıkta mı?
    // - IP rate limiting
    // Örnek:
    // if (gameData.duration < 10) {
    //   return res.status(400).json({ success: false, message: "Hile şüphesi" });
    // }

    try {
      if (!PRIVATE_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Server config hatası" 
        });
      }

      // 3. Nonce oluştur (replay attack önleme)
      const nonce = Date.now();

      // 4. İmza oluştur
      const wallet = new ethers.Wallet(PRIVATE_KEY);
      
      // Contract'taki ile aynı mesaj
      const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'string', 'uint256', 'uint256', 'uint256'],
        [playerAddress, farcasterUsername, numericFid, numericScore, nonce]
      );

      const signature = await wallet.signMessage(ethers.getBytes(messageHash));

      console.log(`✅ İmza oluşturuldu: ${farcasterUsername} - ${numericScore}`);

      return res.status(200).json({ 
        success: true,
        message: "İmza oluşturuldu",
        data: {
          signature: signature,
          nonce: nonce,
          verifierAddress: wallet.address,
          // Kullanıcı bunları contract'a gönderecek
          params: {
            farcasterUsername,
            fid: numericFid,
            score: numericScore,
            nonce
          }
        }
      });
      
    } catch (error) {
      console.error('İmza hatası:', error);
      return res.status(500).json({ 
        success: false,
        message: "İmza oluşturma hatası: " + error.message
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    message: "Sadece POST" 
  });
}
