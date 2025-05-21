const axios = require('axios');

async function getWeather(cidade) {
  const query = encodeURIComponent(cidade.trim());
  const url = `https://wttr.in/${query}?format=3`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'curl' // necessário para wttr.in
      },
      timeout: 5000
    });

    if (!data || data.toLowerCase().includes('unknown location')) {
      throw new Error('Cidade inválida');
    }

    return `🌤️ ${data}`;
  } catch (error) {
    console.error('Erro ao buscar clima:', error.message);
    throw new Error('Cidade inválida');
  }
}

module.exports = getWeather;
