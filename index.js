import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors'
// import { createRemoteJWKSet, jwtVerify } from 'jose';
const app = express()
const PORT = 8000;
app.use(cors())
app.use(express.json())


// Connect mongodb

const client = new MongoClient(process.env.MONGODB_URI);


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB()
// create Database Name
const db = mongoClient.db("youthfoundation");
//Create Mongodb Collection
const EventsCollection = db.collection("EventsCollection")

// Create Event and Send Data to Mongodb
app.post('/events',async(req,res)=>{
    const data = req.body
    const result = await EventsCollection.insertOne(data)
    res.send(result)
})

// Creating API for sending all data to users
app.get('/events',async(req,res)=>{
    const result = await EventsCollection.find().toArray()
    res.send(result)

})

// Creating API for sending Dynamic Single Event data to users
app.get('/events/:id', async(req,res)=>{
  const {id}= req.params
  console.log(id)
  // res.send({id})
  const result = await EventsCollection.findOne({_id: new ObjectId(id)})
  res.send(result)

})

//upcoming Events 
app.get("/events/upcoming", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const result = await EventsCollection
    .find({ date: { $gte: today } })
    .sort({ date: 1 })
    .toArray();

  res.send(result);
});
// Expired Events
app.get("/events/expired", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await EventsCollection
    .find({ date: { $lt: today } })
    .sort({ date: -1 })
    .toArray();

  res.send(result);
});






app.listen(PORT, () => {
  console.log(`The server is running at port ${PORT}`);
});