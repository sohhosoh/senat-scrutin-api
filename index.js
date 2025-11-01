const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/api/scrutins", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Date requise (AAAA-MM-JJ)" });

  try {
    const year = date.split("-")[0];
    const url = `https://www.senat.fr/scrutin-public/${year}/`;

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const scrutins = [];

    $("table > tbody > tr").each((_, el) => {
      const cells = $(el).find("td");
      const num = $(cells[0]).text().trim();
      const titre = $(cells[1]).text().trim();
      const link = $(cells[1]).find("a").attr("href");
      const result = $(cells[2]).text().trim();

      if (num && titre) {
        scrutins.push({
          numero: num,
          titre,
          resultat: result,
          url: link ? `https://www.senat.fr${link}` : null,
          date: date // fixe à la date demandée
        });
      }
    });

    res.json({ scrutins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du scraping du site du Sénat" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API Sénat lancée sur le port ${port}`);
});
