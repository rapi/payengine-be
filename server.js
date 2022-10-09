import bcrypt from 'bcryptjs';
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { v4 } from 'uuid';
import knex from 'knex';

const {
  SERVER_PORT, PAY_ENGINE_SECRET, PAY_ENGINE_ENDPOINT, DATABASE_MASTER_URL,
} = dotenv.config().parsed;
const app = express();
app.use(express.json());

const pg = knex({
  client: 'pg',
  connection: DATABASE_MASTER_URL,
  searchPath: ['knex', 'public'],
});

const client = axios.create({
  baseURL: PAY_ENGINE_ENDPOINT,
  headers: {
    Authorization: `Basic ${PAY_ENGINE_SECRET}`,
  },
});

app.post('/api/signup', async (req, res) => {
  try {
    await pg.insert({
      ...req.body,
      id: v4(),
      password: bcrypt.hashSync(req.body.password, v4().replaceAll('-', '')),
    }).into('users');
  } catch (e) {
    res.status(400);
    res.send({ error: e.message });
  }

  // const response=await client.post("/api/merchant",{
  //     "external_id": "e2d84728-00a2-4b08-a213-2a3692e97ada",
  //     "email": "test@test.ro",
  //     "name": "Merchants Name"
  // })
  // console.log(response.data)
  // const merchant_id_hash = crypto.createHmac(
  //     "sha256",
  //     "YOUR_SECRET_KEY"
  // ).update("").digest("hex")
  // res.send(merchant_id_hash)
});

app.get('/api/info', async (req, res) => {
  res.send('info');
});

app.listen(SERVER_PORT, () => {
  console.log(`Example app listening on port ${SERVER_PORT}`);
});
