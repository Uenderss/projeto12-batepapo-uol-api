import express from "express";
import cors from "cors";
import chalk from "chalk";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(5000,()=>{
    console.log(chalk.green.bold("servidor conectado"));
});
