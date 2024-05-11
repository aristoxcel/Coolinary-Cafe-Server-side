const express = require('express')
const cors = require('cors')
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



app.get('/', (req, res)=>{
    res.send('This is server side of Coolinary cafe')
})


app.listen(port, ()=>{
    console.log(`coolinay cafe server link http://localhost:${port}`)
})