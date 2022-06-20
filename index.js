const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const generateToken = require('./token');
const { checkMail, checkPwd } = require('./loginUtils');
const afterChecks = require('./talkerDataUtils');

const app = express();
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

function fetchTalkers() {
  return fs.readFile('./talker.json', 'utf-8')
    .then((data) => JSON.parse(data));
}

function updateTalkers(newTalker) {
  return fs.writeFile('./talker.json', JSON.stringify(newTalker));
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
  const checkedEmail = checkMail(email);
  if (email !== checkedEmail) return res.status(400).json({ message: checkedEmail });
  const checkedPwd = checkPwd(password);
  if (password !== checkedPwd) return res.status(400).json({ message: checkedPwd });
  const token = generateToken();
  res.status(200).json({ token });
});

app.post('/talker', async (req, res) => {
  try {
    const { name, age, talk } = req.body;
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'Token não encontrado' });
    if (token.length !== 16) return res.status(401).json({ message: 'Token inválido' });
    const finalcheck = afterChecks(name, age, talk);
    if (finalcheck) return res.status(finalcheck.status).json({ message: finalcheck.message });
    const fetched = await fetchTalkers();
    const newId = ((Object.keys(fetched)).length) + 1;
    const newTalker = { id: newId, name, age, talk };
    fetched.push(newTalker);
    await updateTalkers(fetched);
    return res.status(201).json(newTalker);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// aqui foi preciso alterar o if (talkindex = -1) que faria sentido 
// quando o index nao for encontrado para 0 ja que temos o +1 na hora
// de declarar o talkindex;

app.put('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, talk } = req.body;
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Token não encontrado' });
  if (token.length !== 16) return res.status(401).json({ message: 'Token inválido' });
  const finalcheck = afterChecks(name, age, talk);
  if (finalcheck) return res.status(finalcheck.status).json({ message: finalcheck.message });
  const fetched = await fetchTalkers();
  const numberID = Number(id);
  const talkIndex = fetched.filter((talker) => talker.id === numberID);
  if (!talkIndex) return res.status(404).json({ message: 'talk not found!' });
  fetched[numberID - 1] = { name, age, id: numberID, talk };
  await updateTalkers(fetched);
  res.status(200).json((await fetchTalkers())[numberID - 1]);
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

app.delete('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Token não encontrado' });
  if (token.length !== 16) return res.status(401).json({ message: 'Token inválido' });
  const fetched = await fetchTalkers();
  const talkIndex = fetched.find((talker) => talker.id === Number(id));
  if (!talkIndex) return res.status(404).json({ message: 'talk not found!' });
  const numberID = Number(id) - 1;
  fetched.splice(numberID, 1);
  await updateTalkers(fetched);
  res.status(204).end();
});

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});
