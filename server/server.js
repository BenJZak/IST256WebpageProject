const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ORDERS_FILE = path.join(__dirname, "orders.json");
const MEMBERS_FILE = path.join(__dirname, "members.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  const fileData = fs.readFileSync(filePath, "utf8");

  if (fileData.trim() === "") {
    return [];
  }

  return JSON.parse(fileData);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readOrders() {
  return readJson(ORDERS_FILE);
}

function writeOrders(data) {
  writeJson(ORDERS_FILE, data);
}

function readMembers() {
  return readJson(MEMBERS_FILE);
}

function writeMembers(data) {
  writeJson(MEMBERS_FILE, data);
}

function readProducts() {
  return readJson(PRODUCTS_FILE);
}

function writeProducts(data) {
  writeJson(PRODUCTS_FILE, data);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateProductID(products) {
  let highestNum = 0;

  products.forEach(function(product) {
    const productID = String(product.productID || "");
    const currentNum = parseInt(productID.replace(/^P/i, ""), 10);

    if (!isNaN(currentNum) && currentNum > highestNum) {
      highestNum = currentNum;
    }
  });

  return "P" + (highestNum + 1);
}

function buildProductPayload(body, products) {
  return {
    productID: generateProductID(products),
    description: String(body.description || "").trim(),
    category: String(body.category || "").trim(),
    unit: String(body.unit || "").trim(),
    price: Number(body.price),
    weight: String(body.weight || "").trim(),
    color: String(body.color || "").trim()
  };
}

function buildMemberPayload(body, existingMember) {
  const source = existingMember || {};

  return {
    id: source.id || Date.now(),
    name: String(body.name || "").trim(),
    email: normalizeEmail(body.email),
    year: String(body.year || "").trim(),
    affiliation: String(body.affiliation || "").trim(),
    phone: String(body.phone || "").trim(),
    registeredAt: source.registeredAt || new Date().toLocaleString()
  };
}

function isDuplicateMemberEmail(members, email, currentID) {
  return members.some(function(member) {
    return normalizeEmail(member.email) === email && member.id !== currentID;
  });
}

function memberEmailExists(members, email) {
  return members.some(function(member) {
    return normalizeEmail(member.email) === email;
  });
}

function autoRegisterMemberFromOrder(order) {
  if (!order.customer) {
    return null;
  }

  const email = normalizeEmail(order.customer.email);

  if (email === "") {
    return null;
  }

  const members = readMembers();

  if (memberEmailExists(members, email)) {
    return null;
  }

  const newMember = buildMemberPayload({
    name: order.customer.fullName || email,
    email: email,
    phone: order.customer.phone || "",
    year: "",
    affiliation: ""
  });

  members.push(newMember);
  writeMembers(members);
  return newMember;
}

app.get("/api/orders", function(req, res) {
  let data = readOrders();

  if (req.query.status) {
    data = data.filter(function(order) {
      return order.status === req.query.status;
    });
  }

  if (req.query.customerEmail !== undefined) {
    const customerEmail = String(req.query.customerEmail).trim().toLowerCase();

    if (customerEmail === "") {
      res.json([]);
      return;
    }

    data = data.filter(function(order) {
      if (!order.customer || !order.customer.email) {
        return false;
      }

      return String(order.customer.email).trim().toLowerCase() === customerEmail;
    });
  }

  res.json(data);
});

app.get("/api/orders/pending", function(req, res) {
  const data = readOrders();
  const pendingOrders = data.filter(function(order) {
    return order.status === "pending";
  });

  res.json(pendingOrders);
});

app.post("/api/orders", function(req, res) {
  const data = readOrders();
  const newOrder = req.body;
  const customerEmail = newOrder.customer ? normalizeEmail(newOrder.customer.email) : "";

  if (!Array.isArray(newOrder.cart) || newOrder.cart.length === 0) {
    res.status(400).json({ ok: false, message: "Cart must include at least one product" });
    return;
  }

  if (!newOrder.customer || String(newOrder.customer.fullName || "").trim() === "" || customerEmail === "") {
    res.status(400).json({ ok: false, message: "Customer name and email are required" });
    return;
  }

  newOrder.customer.email = customerEmail;

  newOrder.id = Date.now();
  newOrder.date = new Date().toLocaleString();
  newOrder.status = "pending";

  autoRegisterMemberFromOrder(newOrder);
  data.push(newOrder);
  writeOrders(data);
  res.json(newOrder);
});

app.put("/api/orders/:id", function(req, res) {
  const data = readOrders();
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

  writeOrders(data);
  res.json({ ok: true, order: updatedOrder });
});

app.get("/api/members", function(req, res) {
  let members = readMembers();

  if (req.query.email !== undefined) {
    const email = normalizeEmail(req.query.email);

    if (email === "") {
      res.json([]);
      return;
    }

    members = members.filter(function(member) {
      return normalizeEmail(member.email) === email;
    });
  }

  res.json(members);
});

app.post("/api/members", function(req, res) {
  const members = readMembers();
  const newMember = buildMemberPayload(req.body);

  if (newMember.name === "" || newMember.email === "") {
    res.status(400).json({ ok: false, message: "Name and email are required" });
    return;
  }

  if (isDuplicateMemberEmail(members, newMember.email, newMember.id)) {
    res.status(409).json({ ok: false, message: "A member with this email already exists" });
    return;
  }

  members.push(newMember);
  writeMembers(members);
  res.json(newMember);
});

app.put("/api/members/:id", function(req, res) {
  const members = readMembers();
  const id = parseInt(req.params.id);
  let updatedMember = null;

  for (let i = 0; i < members.length; i++) {
    if (members[i].id === id) {
      const nextMember = buildMemberPayload(req.body, members[i]);

      if (nextMember.name === "" || nextMember.email === "") {
        res.status(400).json({ ok: false, message: "Name and email are required" });
        return;
      }

      if (isDuplicateMemberEmail(members, nextMember.email, id)) {
        res.status(409).json({ ok: false, message: "A member with this email already exists" });
        return;
      }

      members[i] = nextMember;
      updatedMember = nextMember;
    }
  }

  if (updatedMember === null) {
    res.status(404).json({ ok: false, message: "Member not found" });
    return;
  }

  writeMembers(members);
  res.json({ ok: true, member: updatedMember });
});

app.delete("/api/members/:id", function(req, res) {
  const members = readMembers();
  const id = parseInt(req.params.id);
  const nextMembers = members.filter(function(member) {
    return member.id !== id;
  });

  if (nextMembers.length === members.length) {
    res.status(404).json({ ok: false, message: "Member not found" });
    return;
  }

  writeMembers(nextMembers);
  res.json({ ok: true });
});

app.get("/api/products", function(req, res) {
  res.json(readProducts());
});

app.post("/api/products", function(req, res) {
  const products = readProducts();
  const newProduct = buildProductPayload(req.body, products);

  if (newProduct.category === "" || newProduct.unit === "") {
    res.status(400).json({ ok: false, message: "Category and unit are required" });
    return;
  }

  if (isNaN(newProduct.price) || newProduct.price <= 0) {
    res.status(400).json({ ok: false, message: "Price must be greater than 0" });
    return;
  }

  products.push(newProduct);
  writeProducts(products);
  res.status(201).json(newProduct);
});

app.delete("/api/products/:productID", function(req, res) {
  const products = readProducts();
  const productID = String(req.params.productID || "").trim().toLowerCase();
  const nextProducts = products.filter(function(product) {
    return String(product.productID || "").trim().toLowerCase() !== productID;
  });

  if (nextProducts.length === products.length) {
    res.status(404).json({ ok: false, message: "Product not found" });
    return;
  }

  writeProducts(nextProducts);
  res.json({ ok: true });
});

app.listen(3001, function() {
  console.log("server running on http://localhost:3001");
});
