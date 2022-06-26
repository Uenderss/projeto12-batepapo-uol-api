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
let db=null;
const porta = process.env.PORTA||5000;
const uri = process.env.URL_MONGO;

const client= new MongoClient(uri);

async function run(){
  try{
    await client.connect();
    db=client.db(process.env.MEUBANCO);
    console.log("conectando mongodb")
  }catch{
    console.log(err);
  }
}

run();
app.listen(porta,()=>{
    console.log(chalk.green.bold("servidor conectado a porta: "+porta));
});

