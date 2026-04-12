const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = path.join(__dirname, "orders.json");

function read() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
  }

  const fileData = fs.readFileSync(FILE, "utf8");

  if (fileData.trim() === "") {
    return [];
  }

  return JSON.parse(fileData);
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

app.get("/api/orders", function(req, res) {
  const data = read();

  if (req.query.status) {
    res.json(data.filter(function(order) {
      return order.status === req.query.status;
    }));
    return;
  }

  res.json(data);
});

app.get("/api/orders/pending", function(req, res) {
  const data = read();
  const pendingOrders = data.filter(function(order) {
    return order.status === "pending";
  });

  res.json(pendingOrders);
});

app.post("/api/orders", function(req, res) {
  const data = read();
  const newOrder = req.body;

  newOrder.id = Date.now();
  newOrder.date = new Date().toLocaleString();
  newOrder.status = "pending";

  data.push(newOrder);
  write(data);
  res.json(newOrder);
});

app.put("/api/orders/:id", function(req, res) {
  const data = read();
  const id = parseInt(req.params.id);
  const status = req.body.status;
  let updatedOrder = null;

  if (status !== "pending" && status !== "approved" && status !== "declined") {
    res.status(400).json({ ok: false, message: "Invalid status" });
    return;
  }

  for (let i = 0; i < data.length; i++) {
    if (data[i].id === id) {
      data[i].status = status;
      updatedOrder = data[i];
    }
  }

  if (updatedOrder === null) {
    res.status(404).json({ ok: false, message: "Order not found" });
    return;
  }

  write(data);
  res.json({ ok: true, order: updatedOrder });
});

app.listen(3001, function() {
  console.log("server running on http://localhost:3001");
});
