// api/submitScore.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { playerName, score } = req.body;

  if (!playerName || !score) {
    return res.status(400).json({ message: "Missing playerName or score" });
  }

  // Geçici örnek: Skoru logluyor (ileride veritabanına kaydedebilirsin)
  console.log(`New score received: ${playerName} - ${score}`);

  return res.status(200).json({ message: "Score submitted successfully" });
}
