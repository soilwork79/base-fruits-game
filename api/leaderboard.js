// api/leaderboard.js - Sadece okuma, cache ile hızlı
import { ethers } from 'ethers';

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function getLatestScores(uint256 count) external view returns (tuple(address player, string farcasterUsername, uint256 fid, uint256 score, uint256 timestamp)[] memory)",
  "function getTotalScores() external view returns (uint256)"
];

// Basit cache (5 dakika)
let cachedData = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const now = Date.now();
    
    // Cache kontrolü
    if (cachedData && (now - cacheTime) < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        cached: true,
        ...cachedData
      });
    }
    
    try {
      if (!CONTRACT_ADDRESS) {
        return res.status(500).json({ 
          success: false,
          message: "Contract config eksik" 
        });
      }

      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Tüm skorları al
      const totalScores = await contract.getTotalScores();
      const scores = await contract.getLatestScores(Number(totalScores));
      
      // Format ve sırala
      const formattedScores = scores.map(score => ({
        walletAddress: score.player,
        farcasterUsername: score.farcasterUsername,
        fid: Number(score.fid),
        score: Number(score.score),
        timestamp: Number(score.timestamp)
      }));

      // Skora göre sırala (en yüksek önce)
      formattedScores.sort((a, b) => b.score - a.score);
      
      // Top N'i al
      const topScores = formattedScores.slice(0, limit);
      
      // Rank ekle
      const leaderboard = topScores.map((score, index) => ({
        rank: index + 1,
        ...score
      }));

      // Cache'e kaydet
      cachedData = {
        count: leaderboard.length,
        totalScores: Number(totalScores),
        leaderboard: leaderboard
      };
      cacheTime = now;

      return res.status(200).json({
        success: true,
        cached: false,
        ...cachedData
      });
      
    } catch (error) {
      console.error('Blockchain error:', error);
      return res.status(500).json({ 
        success: false,
        message: "Leaderboard okuma hatası: " + error.message
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    message: "Sadece GET" 
  });
}
