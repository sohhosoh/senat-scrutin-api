const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/api/scrutins", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date requise (format AAAA-MM-JJ)" });
  }

  try {
    const year = date.split("-")[0];
    const url = `https://www.senat.fr/scrutin-public/${year}/`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml",
      },
      maxRedirects: 5,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const scrutins = [];

    $("table > tbody > tr").each((_, el) => {
      const cells = $(el).find("td");
      if (cells.length >= 3) {
        const numero = $(cells[0]).text().trim();
        const titre = $(cells[1]).text().trim();
        const urlPart = $(cells[1]).find("a").attr("href");
        const resultat = $(cells[2]).text().trim();

        scrutins.push({
          numero,
          date,
          titre,
          resultat,
          url: urlPart ? `https://www.senat.fr${urlPart}` : null,
        });
      }
    });

    res.json({ scrutins });
  } catch (error) {
    console.error("Erreur scraping Sénat:", error.message);
    res.status(500).json({
      error: "Erreur lors du scraping du site du Sénat",
      details: error.message,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Sénat en écoute sur le port ${port}`);
});
