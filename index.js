import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';
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
const JoinedEventCollection = db.collection("JoinedEventCollection")





/**
 * verification APi for authentic user
 */

const verifyToken= async(req,res,next)=>{ 
  const authHeader = req.headers.authorization
  console.log(authHeader)
  if (!authHeader){
    return res.status(401).send({msg:"unauthorized"});
  }
  const token = authHeader.split(" ")[1] 
  if(!token){
     return res.status(401).send({msg:"You have No Token to Access"});
  }

  // verify token 
  const JWKS =createRemoteJWKSet(new URL(`${process.env.NEXTJS_FRONTEND_URI}/api/auth/jwks`))
  
  try{
    const { payload } = await jwtVerify(token, JWKS)
    // console.log(token)
    next();
  } catch(error){
    console.log(error)
    return res.status(401).send({msg:"Your Token not match with server"});

  }

    


}

//Create API to show Event Card According to the user email
app.get('/events/joined/:email',verifyToken,async(req,res)=>{
  const {email}= req.params
  // console.log(email)
  const result = await JoinedEventCollection.find({userEmail:email}).toArray()
  res.send(result)

})






// Create Event and Send Data to Mongodb
app.post('/events',verifyToken,async(req,res)=>{
    const data = req.body
    const result = await EventsCollection.insertOne(data)
    res.send(result)
})

// Creating API for sending all data to users
app.get('/events',async(req,res)=>{
    const result = await EventsCollection.find().toArray()
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

// Creating API for sending Dynamic Single Event data to users
app.get('/events/:id', async(req,res)=>{
  const {id}= req.params
  // console.log(id)
  // res.send({id})
  const result = await EventsCollection.findOne({_id: new ObjectId(id)})
  res.send(result)
})

// Get Events by Email
app.get('/events/user/:email',async(req,res)=>{
  const {email}= req.params
  // console.log(email)
  const result = await EventsCollection.find({userEmail:email}).toArray()
  res.send(result)

})

// Delete Event by userEmail 
app.delete('/events/manage/:id',async(req,res)=>{
  const{id}=req.params
  const result = await EventsCollection.deleteOne({_id: new ObjectId(id)})
  // const result = await EventsCollection.findOne({_id:id})
  res.send(result)
  // console.log(id)

})


// update event here 
app.put('/events/manage/:id', async(req,res)=>{
  const {id}= req.params
  const {_id, ...data}= req.body

  try {
    const result = await EventsCollection.updateOne(
      {_id: new ObjectId(id)},
      {$set: data}
    )

    if (result.matchedCount === 0) {
      return res.status(404).send({message: "Destination not found"})
    }

    res.send(result)
  } catch (error) {
    res.status(400).send({
      message: "Could not update destination",
      error: String(error)
    })
  }
})

// Create Joined Event and Send Data to Mongodb
app.post('/events/joined',verifyToken,async(req,res)=>{
    const data = req.body
    const result = await JoinedEventCollection.insertOne(data)
    res.send(result)
})


app.listen(PORT, () => {
  console.log(`The server is running at port ${PORT}`);
});

export default app