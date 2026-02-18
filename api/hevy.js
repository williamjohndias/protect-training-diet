module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'HEVY_API_KEY não configurado nas variáveis de ambiente do Vercel.' });
  }

  const endpoint = req.query.endpoint;
  if (!endpoint) return res.status(400).json({ error: 'Parâmetro endpoint obrigatório.' });

  const url = 'https://api.hevyapp.com' + endpoint;

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    };
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
