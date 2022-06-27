import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import dayjs from "dayjs";
import joi from "joi";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

//banco de dados
const porta = process.env.PORTA || 5000;
let db = null;
const urlBanco = process.env.URL_MONGO;
const client = new MongoClient(urlBanco);
const promise = client.connect();
promise
  .then(() => {
    db = client.db(process.env.MEUBANCO);
    console.log(chalk.green("Mongo conectado"));
  })
  .catch((e) => console.log("Falha na conexao do banco", e));

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const nameSchema = joi.object({ name: joi.string().required() });
  const { erro } = nameSchema.validate(name);
  if (erro) {
    return res.sendStatus(422);
  }

  try {
    const lista = await db.collection("participants").findOne({ name });
    if (lista) {
      return res.sendStatus(409);
    } else {
      await db
        .collection("participants")
        .insertOne({ name, lastStatus: Date.now() });
      await db
        .collection("messages")
        .insertOne({
          from: name,
          to: "Todos",
          text: "entra na sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        });
        res.sendStatus(201);
    }
  } catch (e) {
    return console.log("Algo de errado não esta certo");
  }
});

app.get("/participants", async (req, res) => {
  try {
    res.send( await db.collection("participants").find().toArray());
  } catch (e) {
    return res.status(500).send("erro", e);
  }
});

app.post("/messages", async(req,res)=>{
  const {user}= req.headers;
  const message=req.body;
  const {to,text,type}=message;
  
  const messageSchema=joi.object({
    to:joi.string().min(1).required(),
    text:joi.string().required(),
    type:joi.string().valid('message').valid('private_message').valid("status").required()
  })
  if(messageSchema.validate(message).error){
    return res.status(422).send(messageSchema.validate(message).error.details[0].message);
  }
  try{
   await db.collection("messages").insertOne({
    to,
    text,
    type,
    from:user,
    time:dayjs().format('HH:mm:ss')
   });
   res.sendStatus(201);
  }catch{
    return res.status(422).send("Usuario não cadastrado");
  }
  
});

app.get("/messages", async (req, res) => {
  let limit=parseInt(req.body.limit);
  const {user} = req.headers;
 
  try {
    res.send( await db.collection("messages").find({$or:[{to:"Todos"},{to:user},{from:user},{type:'message'}]}).limit(limit).sort(-1).toArray());
    
  } catch (e) {
    return res.status(500).send("erro", e);
  }
});

app.listen(porta, () => {
  console.log(chalk.green.bold("servidor conectado a porta: " + porta));
});
