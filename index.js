const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000
const app = express()

const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://coolinary-cafe.web.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
  }
app.use(cors(corsOptions))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kdbwfxu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  async function run() {
    try {
        const foodCollection = client.db('coolinaryDB').collection('food')

        app.post('/food', async(req, res)=>{
            const food = req.body
            console.log(food)
            const result = await foodCollection.insertOne(food)
            res.send(result)
        })
  
        // send data for all food pages 
        app.get('/allfood', async(req, res)=>{
            const filter = req.query.filter
            const sort = req.query.sort
            const search = req.query.search

            let query ={
              food_name : {$regex: search, $options: 'i'}
            }
            if(filter) query.category = filter
            let options ={}
            if(sort) options = {sort: {price:sort === 'asc'?1:-1 }}
            const result = await foodCollection.find(query, options).toArray()
            res.send(result)
        })





      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
  }
  run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('This is server side of Coolinary cafe')
})


app.listen(port, ()=>{
    console.log(`coolinay cafe server link http://localhost:${port}`)
})