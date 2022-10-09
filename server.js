const crypto = require('crypto');
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const knex = require('knex');
const bcrypt = require('bcrypt');
const { v4 } = require('uuid');

const {
  SERVER_PORT,
  PAY_ENGINE_SECRET,
  PAY_ENGINE_ENDPOINT,
  DATABASE_MASTER_URL,
  PAY_ENGINE_PUBLIC,
} = dotenv.config().parsed;
const app = express();
app.use(express.json());

const pg = knex({
  client: 'pg',
  connection: DATABASE_MASTER_URL,
  searchPath: ['knex', 'public'],
});

const payengine = axios.create({
  baseURL: `${PAY_ENGINE_ENDPOINT}/api`,
  headers: {
    Authorization: `Basic ${PAY_ENGINE_SECRET}`,
  },
});

app.post('/api/login', async (req, res) => {
  try {
    const [{ password }] = await pg('users').where({ email: req.body.email }).select('password');
    if (!bcrypt.compareSync(req.body.password, password)) {
      throw new Error();
    }
    const token = crypto.randomBytes(64).toString('hex');
    await pg('users')
      .where({ email: req.body.email })
      .update({ authorization_token: token });

    res.send({ token });
  } catch (e) {
    res.status(400);
    res.send({ error: 'Wrong email or password' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    // Check if users exists
    const [{ count }] = await pg('users').where({ email: req.body.email }).count('*');
    if (count !== '0') {
      throw new Error('User already exists');
    }

    // Create new user
    const password = await bcrypt.hash(req.body.password, 2);
    const user = {
      ...req.body,
      id: v4(),
      password,
    };

    // Create a merchant in payengine
    const { data: { data } } = await payengine.post('/merchant', {
      external_id: user.id,
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
    });
    user.merchant_id = data.id;
    user.authorization_token = crypto.randomBytes(64).toString('hex');

    // Insert user in local database
    await pg.insert(user).into('users');

    res.send({ token: user.authorization_token });
    // res.send({ token, publicKey: PAY_ENGINE_PUBLIC, merchantId: user.merchant_id });
  } catch (e) {
    res.status(400);
    res.send({ error: e.message });
  }
});

app.get('/api/info', async (req, res) => {
  try {
    const token = req.headers.authorization.replace('Basic ', '');
    const [user] = await pg('users')
      .where({ authorization_token: token })
      .select('merchant_id', 'first_name', 'last_name');
    const hash = crypto.createHmac(
      'sha256',
      PAY_ENGINE_SECRET,
    ).update(user.merchant_id).digest('hex');
    res.send({
      merchantId: user.merchant_id,
      hash,
      publicKey: PAY_ENGINE_PUBLIC,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (e) {
    res.status(400);
    res.send({ error: e.message });
  }
});
app.listen(SERVER_PORT, () => {
  console.log(`Example app listening on port ${SERVER_PORT}`);
});
