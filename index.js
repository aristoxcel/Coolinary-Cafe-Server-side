require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const app = express()


  app.use(
    cors({
        origin: ['http://localhost:5173', 'https://coolinary-cafe.web.app', 'https://coolinary-cafe.firebaseapp.com'],
        credentials: true,
    }),
)

app.use(express.json())
app.use(cookieParser())
const logger =(req, res, next)=>{
  console.log(req.method, req.url)
  next()
}
// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token
  console.log('token', token)
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }

      req.user = decoded
      next()
    })
  }
}

const cookeOption= {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}

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
        const feedbackCollection = client.db('coolinaryDB').collection('feedback')
        const orderCollection = client.db('coolinaryDB').collection('order')


        // jwt generate
        app.post('/jwt', async (req, res) => {
          
          try {
              const user = req.body
              const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                  expiresIn: '1d',
              })
              res
                  .cookie('token', token, cookeOption)
                  .send({
                      success: true
                  })
          } catch (error) {
              res.send({
                  status: true,
                  error: error.message,
              })
          }
      })
      

      app.post('/logout', async (req, res) => {
        const user = req.body
        console.log("logging out" , user)
        res
            .clearCookie('token', { ...cookeOption, maxAge: 0 })
            .send({ success: true })
    })
    

        app.post('/food', async(req, res)=>{
            const food = req.body
            console.log(food)
            const result = await foodCollection.insertOne(food)
            res.send(result)
        })

        app.get('/food', async(req, res)=>{
          const result = await foodCollection.find().toArray()
          res.send(result)
      })


      app.get('/top-food', async(req, res)=>{
   
        const result = await foodCollection.find().sort({ "count": -1 }).limit(6).toArray();

        res.send(result);
    })

        // single page details
        app.get('/details/:id', async(req, res)=>{
          const id = req.params.id
          const query = {_id: new ObjectId(id)}
          const result = await foodCollection.findOne(query)
          res.send(result)
        })

        // get data by user email
        app.get('/my-add-food/:email', logger, verifyToken, async(req, res)=>{
          const email = req.params.email
          if (req.user.email !== email) {
            return res.status(403).send({ message: 'forbidden access' })
          }

          const query = {cooker_email:email}
          const result = await foodCollection.find(query).toArray()
          res.send(result)
        })


            // delete a job data from db
    app.delete('/my-add-food/:id', async (req, res) => {
      const id = req.params.id
      // console.log(id)
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.deleteOne(query)
      res.send(result)
    })


        // update a job in db
        app.put('/food/:id',  async (req, res) => {
          const id = req.params.id
          const foodData = req.body

          const query = { _id: new ObjectId(id) }
          const options = { upsert: true }
          const updateDoc = {
            $set: {
              ...foodData,
            },
          }
          const result = await foodCollection.updateOne(query, updateDoc, options)
          res.send(result)
        })


            // Update food quantity
    app.patch('/foods/:id', async (req, res) => {
      const id = req.params.id

      const qty = req.body.quantity
      const oq = req.body.order_quantity
      const quantity = qty - oq
      const query = { _id: new ObjectId(id) }
      console.log(id)
      // const updateDoc = {
      //   $set: quantity,
      // }
      // const result = await foodCollection.updateOne(query, updateDoc)
      // res.send(result)
    })


        // ordered by user
        app.post('/order',  async(req, res)=>{
          const order = req.body

          const result = await orderCollection.insertOne(order)

          const query = { _id: new ObjectId(order.foodId) };
          console.log('tot', query)
          const update = { $inc: { quantity: - order.order_quantity } };
          const updateDoc = {$inc:{count:1}}
          const newResult = await foodCollection.updateOne(query, update)
          const newCount = await foodCollection.updateOne(query, updateDoc)
          res.send(result)
      })


             // get data by user email
             app.get('/order/:email',  verifyToken, async(req, res)=>{
              const email = req.params.email
              console.log(req.user.email)
              console.log(email)
              if (req.user.email  !== email) {
                return res.status(403).send({ message: 'forbidden access' })
              }
              const query = {email}
              // console.log(email, query)
              const result = await orderCollection.find(query).toArray()
              res.send(result)
            })


                // delete a job data from db
                app.delete('/order/:id', async (req, res) => {
                  const id = req.params.id
                  console.log(id)
                  const query = { _id: new ObjectId(id) }
                  const result = await orderCollection.deleteOne(query)
                  res.send(result)
                })

    

      
// feedback by user
        app.post('/feedback', async(req, res)=>{
          const feedback = req.body
          // console.log(feedback)
          const result = await feedbackCollection.insertOne(feedback)
          res.send(result)
      })
  

      // send data for gallery section used feedback db
      app.get('/feedback', async(req, res)=>{
        const result = await feedbackCollection.find().toArray()
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





      // await client.db("admin").command({ ping: 1 });
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