// api/submitScore.js
import { ethers } from 'ethers';

const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CONTRACT_ABI = [
  "function submitScore(string memory _farcasterUsername, uint256 _fid, uint256 _score) external",
  "function getTotalScores() external view returns (uint256)",
  "event ScoreSubmitted(string farcasterUsername, uint256 indexed fid, uint256 score, uint256 timestamp)"
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const { farcasterUsername, score, fid } = req.body;

    if (!score || !farcasterUsername) {
      return res.status(400).json({ 
        success: false,
        message: "score ve farcasterUsername gerekli" 
      });
    }

    const numericScore = parseInt(score);
    const numericFid = parseInt(fid) || 0;

    if (isNaN(numericScore) || numericScore < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Geçersiz skor" 
      });
    }

    try {
      if (!CONTRACT_ADDRESS || !PRIVATE_KEY) {
        return res.status(500).json({ 
          success: false,
          message: "Blockchain config eksik" 
        });
      }

      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

      const tx = await contract.submitScore(
        farcasterUsername,
        numericFid,
        numericScore
      );

      console.log('✅ Transaction:', tx.hash);
      
      // Transaction onayını bekle
      const receipt = await tx.wait();
      console.log('✅ Confirmed in block:', receipt.blockNumber);

      return res.status(200).json({ 
        success: true,
        message: "Skor Base blockchain'e kaydedildi",
        data: {
          username: farcasterUsername,
          score: numericScore,
          fid: numericFid,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          explorer: `https://sepolia.basescan.org/tx/${tx.hash}`
        }
      });
      
    } catch (error) {
      console.error('Blockchain error:', error);
      return res.status(500).json({ 
        success: false,
        message: "Blockchain hatası: " + error.message
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    message: "Sadece POST" 
  });
}
