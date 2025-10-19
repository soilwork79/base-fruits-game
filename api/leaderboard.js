// api/leaderboard.js
import { ethers } from 'ethers';

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const CONTRACT_ABI = [
  "function getLatestScores(uint256 count) external view returns (tuple(string farcasterUsername, uint256 fid, uint256 score, uint256 timestamp, address submitter)[] memory)",
  "function getTotalScores() external view returns (uint256)"
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const limit = parseInt(req.query.limit) || 20;
    
    try {
      if (!CONTRACT_ADDRESS) {
        return res.status(500).json({ 
          success: false,
          message: "Contract config eksik" 
        });
      }

      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const scores = await contract.getLatestScores(limit);
      
      // Format data
      const formattedScores = scores.map((score, index) => ({
        rank: index + 1,
        farcasterUsername: score.farcasterUsername,
        fid: Number(score.fid),
        score: Number(score.score),
        timestamp: Number(score.timestamp)
      }));

      // Skora göre sırala (en yüksek önce)
      formattedScores.sort((a, b) => b.score - a.score);

      return res.status(200).json({
        success: true,
        count: formattedScores.length,
        leaderboard: formattedScores
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
