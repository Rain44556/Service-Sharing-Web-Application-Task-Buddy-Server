const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://task-buddy-web-application.web.app',
    'https://task-buddy-web-application.firebaseapp.com'
    ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' });
  }

  // verify token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
      }
      req.user = decoded;
      next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0czr5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  


  const servicesCollection = client.db('ServiceSharingDB').collection('services');
  const userCollection = client.db('ServiceSharingDB').collection('users');
  const bookCollection = client.db('ServiceSharingDB').collection('booking');

    //---------Auth api--------//
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d'
      });
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" :"strict",
      })
      .send({ success: true})
    });

    app.post('/signout', (req, res)=>{
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" :"strict",
      })
      .send({success: true})
    })


     //---------users api--------//
     app.post('/users', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })

  //---------------services apis-----------//

  app.get('/allServices', async(req,res)=>{
    const cursor = servicesCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  app.get('/services/popular', async (req, res) => {
    const result = await servicesCollection.find().limit(6).toArray();
    res.send(result);
  })

  app.get('/services/:id', async(req,res)=>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await servicesCollection.findOne(query);
    
    res.send(result);
  });

  
  app.post('/services', async(req,res)=>{
    const body = req.body;
    const result = await servicesCollection.insertOne(body);
    res.send(result);
  });

  
  app.get('/userServices', verifyToken, async (req, res) => {
    const email = req.query.email;
    const query = { "serviceProvider.providerEmail" : email };
    const cursor =  servicesCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  })

  app.delete('/services/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await servicesCollection.deleteOne(query);
    res.send(result);
  })

  app.put('/services/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }
    const options = { upsert: true };
    const updatedData = req.body;
    const updatedService = {
      $set: {
        serviceName: updatedData.serviceName,
        serviceDescription: updatedData.serviceDescription,
        servicePrice: updatedData.servicePrice
      }
    }
    const result = await servicesCollection.updateOne(filter, updatedService, options);
    res.send(result);
  })


   //---------------booked service apis-----------//
  app.post('/bookedService', async (req,res)=>{
    const body = req.body;
    const result = await bookCollection.insertOne(body);
    res.send(result);
  })  

  app.get('/bookedService',  async (req, res) => {
    const email = req.query.email;
    const query = {  userEmail  : email };
    const cursor =  bookCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Task Buddy server is running')
  })
  
  app.listen(port, () => {
    console.log(`Task Buddy server is running on port : ${port}`)
  })


  