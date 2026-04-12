
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "orders.json";

function read(){
  if(!fs.existsSync(FILE)){
    fs.writeFileSync(FILE,"[]");
  }
  return JSON.parse(fs.readFileSync(FILE));
}

function write(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

app.get("/api/orders",(req,res)=>{
  res.json(read());
});

app.post("/api/orders",(req,res)=>{
  const data = read();
  req.body.id = Date.now();
  data.push(req.body);
  write(data);
  res.json(req.body);
});

app.put("/api/orders/:id",(req,res)=>{
  const data = read();
  const id = parseInt(req.params.id);

  for(let i=0;i<data.length;i++){
    if(data[i].id === id){
      data[i].status = req.body.status;
    }
  }

  write(data);
  res.json({ok:true});
});

app.listen(3001,()=>{
  console.log("server running");
});
