const express = require('express')
const crypto = require('crypto');
const axios = require('axios');
const dotenv = require('dotenv')
const {SERVER_PORT,PAY_ENGINE_SECRET,PAY_ENGINE_ENDPOINT,DATABASE_MASTER_URL}=dotenv.config().parsed
const app = express()

const pg = require('knex')({
    client: 'pg',
    connection: DATABASE_MASTER_URL,
    searchPath: ['knex', 'public'],
});
const client=axios.create({
    baseURL:PAY_ENGINE_ENDPOINT,
    headers:{
        Authorization:`Basic ${PAY_ENGINE_SECRET}`
    }
})

app.get('/new-merchant', async (req, res) => {
    const response=await client.post("/api/merchant",{
        "external_id": "e2d84728-00a2-4b08-a213-2a3692e97ada",
        "email": "test@test.ro",
        "name": "Merchants Name"
    })
    console.log(response.data)
    const merchant_id_hash = crypto.createHmac(
        "sha256",
        "YOUR_SECRET_KEY"
    ).update("").digest("hex")
    res.send(merchant_id_hash)
})

app.listen(SERVER_PORT, () => {
    console.log(`Example app listening on port ${SERVER_PORT}`)
})