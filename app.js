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
const port = process.env.PORT || 5000;
let db;
const urlBanco = process.env.URL_DATABASE;
const client = new MongoClient(urlBanco);
const promise = client.connect();
promise
  .then(() => {
    db = client.db(process.env.DATABASE);
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
    return console.log("Algo de errado não esta certo",e);
  }
});

app.get("/participants", async (req, res) => {
  try {
    res.send( await db.collection("participants").find().toArray());
  } catch (e) {
    return res.sendStatus(500);
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
  const {error}=messageSchema.validate(message);
  if(error){
    return res.status(422).send(error.details[0].message);
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
    res.send( await db.collection("messages").find({$or:[{to:"Todos"},{to:user},{from:user},{type:'message'}]}).limit(limit).toArray());
    
  } catch (e) {
    return res.sendStatus(500);
  }
});

app.post("/status",async(req,res)=>{
  const {user}=req.headers;
  try {
    const lista = await db.collection("participants").findOne({ name:user });
    if (!lista) {
      return res.sendStatus(404);
    } else {
      await db.collection("participants").updateOne({name:user},{$set:{lastStatus:Date.now()}})
      return res.sendStatus(200);
    }
  }catch(erro){
    res.status(500).send('Erro', erro)
  }
});


setInterval(async () => {
  
  const tempo = Date.now() - (10 * 1000);
  try {
    
    const removerParticipantes = await db.collection("participants").find({ lastStatus: { $lte: tempo } }).toArray();
    if (removerParticipantes.length > 0) {
      const messageInative = removerParticipantes.map(removerParticipante => {
        return {
          from: removerParticipante.name,
          to: 'Todos',
          text: 'sai da sala...',
          type: 'status',
          time: dayjs().format("HH:mm:ss")
        }
      });

      await db.collection("messages").insertMany(messageInative);
      await db.collection("participants").deleteMany({ lastStatus: { $lte: tempo } });
    }
  } catch (e) {
    console.log("erro ao remover usuario:",e);
 
  }
}, process.env.TIMEOUT);


app.listen(port, () => {
  console.log(chalk.green.bold("servidor conectado a port: " + port));
});
