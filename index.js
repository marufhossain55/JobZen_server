const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
};
//-------token validate middlewares----------->
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log('tokennnnn', token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'unathorized access' });
    req.user = decoded;
    next();
  });
};
//------------------>
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
//<---------cookie-------->
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};
//<----------------->

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.va5jejf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollection = client.db('jobZen').collection('jobs');

    //get all jobs data from db----->
    app.get('/jobs', async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });
    //<------------->
    // <------ get single job from db using job id------->
    app.get('/job/:id', async (req, res) => {
      const id = req.params.id;
      query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });
    //<------ add jobs------->
    app.post('/addAJob', async (req, res) => {
      const addPostData = req.body;
      console.log(addPostData);
      const result = await jobsCollection.insertOne(addPostData);
      res.send(result);
    });

    //<-----get all jobs posted by specific user-------->
    app.get('/postedJob/:email', verifyToken, async (req, res) => {
      const userEmail = req.user.email;
      console.log('ashdjlkashda', userEmail);
      const email = req.params.email;
      if (userEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      // console.log(email);
      const query = { Contact_Email: email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });
    //<---------update specific data-------->
    app.put('/postedJob/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const jobData = req.body;
      query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { ...jobData } };
      const result = await jobsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //<--------delete a job data--------->
    app.delete('/postedJob/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });
    //<-------jwt---------->
    // jwt related api
    app.post('/jwt', async (req, res) => {
      const userPayload = req.body;
      console.log(userPayload);
      const token = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      res.cookie('token', token, cookieOptions).send({ success: true });
    });
    // clear cookies
    app.post('/clearCookies', (req, res) => {
      res
        .clearCookie('token', { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });
    //<----------------->
    //<----------------->
    //<----------------->
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//<------------------>
app.get('/', (req, res) => {
  res.send('JobZen CURD is running');
});
app.listen(port, () => {
  console.log(`JobZen CURD is running on port ${port}`);
});
