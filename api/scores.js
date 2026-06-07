export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
      {
        headers: {
          "X-Auth-Token": "7b202a7eafec421fbfe1b5eb2d3749bb",
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "API error" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
