export default async function handler(req, res) {
  // מאפשר CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // בקשת OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // שולח את הבקשה ל-Apps Script
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbzJlHa2S9PRs12Wb3hJ-er95_mbaa5njzzeEVMT1_BWfB1bRYi9fmtL95Sx_83_klwO/exec",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}
