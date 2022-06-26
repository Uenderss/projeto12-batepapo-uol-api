import express, {json} from "express";
import chalk from "chalk";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(json());
dotenv.config();

//banco de dados
const porta = process.env.PORTA||5000;
let db=null;
const urlBanco = process.env.URL_MONGO;
const client= new MongoClient(urlBanco);
const promise=client.connect();
promise.then(()=>{
  db=client.db(process.env.MEUBANCO);
  console.log(chalk.green("Mongo conectado"));
}).catch( e=> console.log("Falha na conexao do banco",e));

app.post('/participants',async(req,res)=>{
  const participants = req.body;
  console.log(participants);

})

app.get('/participants',async(req,res)=>{
  try{
    const participants = await db.collection('participants').find().toArray();
    res.send(participants);
  }catch (e){
    return res.status(500).send('erro',e);
  }
})
app.listen(porta,()=>{
    console.log(chalk.green.bold("servidor conectado a porta: "+porta));
});

