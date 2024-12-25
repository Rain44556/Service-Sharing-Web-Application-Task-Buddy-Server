const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



app.use(cors());
app.use(express.json());


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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  




  const servicesCollection = client.db('ServiceSharingDB').collection('services');
  const userCollection = client.db('usersDB').collection('users');

     //---------users api--------//
     app.post('/users', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    })

  //---------------services apis-----------//

  app.get('/services', async(req,res)=>{
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

    // const {serviceProviderEmail} = result;
    // const userInformation = await userCollection.findOne({email:serviceProviderEmail});
    // result.providerInformation = userInformation;
    
    res.send(result);
  });

  
  app.post('/services', async(req,res)=>{
    const body = req.body;
    const result = await servicesCollection.insertOne(body);
    res.send(result);
  });

  
  app.get('/service', async (req, res) => {
    const email = req.query.email;
    const query = { providerEmail: email };
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


  