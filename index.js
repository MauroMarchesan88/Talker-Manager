const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const generateToken = require('./token');

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

// post login nao podia usar funcao anonima, causava erro de lint, 
// tentei usar chamar uma funcao login declarando ela antes, tentei passar para arrow, 
// mas a unica solução foi usar async que poderia aplicar no token,
// porem nao e preciso e portanto nao foi inserido o await na hora de gerar o token.

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'missing fields' });
  const token = generateToken();
  res.status(200).json({ token });
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
