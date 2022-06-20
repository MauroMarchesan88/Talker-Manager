const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

function fetchTalkers() {
  return fs.readFile('./talker.json', 'utf-8')
    .then((data) => JSON.parse(data));
}

app.get('/talker', async (_req, res) => {
  try {
    const fetched = await fetchTalkers();
    return res.status(200).json(fetched);
  } catch (error) {
    return res.status(500).end();
  }
});

app.get('/talker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fetched = await fetchTalkers();
    const identified = fetched.find((talker) => talker.id === Number(id));
    if (!identified) return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });

    res.status(200).json(identified);
  } catch (error) {
    return res.status(500).end();
  }
});

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});
