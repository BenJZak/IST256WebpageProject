require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ist256_storefront";
const SESSION_SECRET = process.env.SESSION_SECRET || "ist256-demo-session-secret";
const PASSWORD_ITERATIONS = 120000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(function(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

const productSnapshotSchema = new mongoose.Schema({
  productID: String,
  description: String,
  category: String,
  unit: String,
  price: Number,
  weight: String,
  color: String
}, { _id: false });

const shopperSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  username: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  role: { type: String, enum: ["member", "admin"], default: "member" },
  passwordHash: { type: String, default: "" },
  passwordSalt: { type: String, default: "" },
  year: { type: String, default: "" },
  affiliation: { type: String, default: "" },
  phone: { type: String, default: "" },
  registeredAt: { type: String, default: function() { return new Date().toLocaleString(); } }
}, { versionKey: false });

const productSchema = new mongoose.Schema({
  productID: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  weight: { type: String, default: "" },
  color: { type: String, default: "" }
}, { versionKey: false });

const shoppingCartSchema = new mongoose.Schema({
  cartSessionID: { type: String, required: true, unique: true, trim: true },
  shopperEmail: { type: String, default: "", lowercase: true, trim: true },
  items: { type: [productSnapshotSchema], default: [] },
  status: { type: String, enum: ["active", "submitted", "cleared"], default: "active" },
  updatedAt: { type: String, default: function() { return new Date().toLocaleString(); } }
}, { versionKey: false });

const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  date: { type: String, default: function() { return new Date().toLocaleString(); } },
  status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
  customer: {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" }
  },
  options: {
    pickupMethod: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    billingName: { type: String, default: "" },
    billingAddress: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  cart: { type: [productSnapshotSchema], default: [] },
  total: { type: Number, default: 0 }
}, { versionKey: false });

const returnSchema = new mongoose.Schema({
  returnID: { type: String, required: true, unique: true, trim: true },
  orderID: { type: Number, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ["requested", "approved", "declined", "resolved"], default: "requested" },
  notes: { type: String, default: "" },
  createdAt: { type: String, default: function() { return new Date().toLocaleString(); } },
  resolvedAt: { type: String, default: "" }
}, { versionKey: false });

const Shopper = mongoose.model("Shopper", shopperSchema, "shopper");
const Product = mongoose.model("Product", productSchema, "products");
const ShoppingCart = mongoose.model("ShoppingCart", shoppingCartSchema, "shopping_cart");
const Order = mongoose.model("Order", orderSchema, "orders");
const ReturnRequest = mongoose.model("ReturnRequest", returnSchema, "returns");

const starterProducts = [
  {
    productID: "P1",
    description: "Example 1",
    category: "Apparel",
    unit: "Each",
    price: 10,
    weight: "",
    color: ""
  },
  {
    productID: "P2",
    description: "Example 2",
    category: "Event",
    unit: "Ticket",
    price: 20,
    weight: "",
    color: ""
  },
  {
    productID: "P3",
    description: "Example 3",
    category: "Accessories",
    unit: "Each",
    price: 30,
    weight: "",
    color: ""
  }
];

function asyncHandler(handler) {
  return function(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function cleanDocument(document) {
  if (Array.isArray(document)) {
    return document.map(cleanDocument);
  }

  if (!document) {
    return document;
  }

  let data;

  if (document.toObject) {
    data = document.toObject();
  } else {
    data = Object.assign({}, document);
  }

  delete data._id;
  delete data.__v;
  delete data.passwordHash;
  delete data.passwordSalt;
  return data;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseID(value) {
  const id = Number(value);

  if (Number.isFinite(id)) {
    return id;
  }

  return null;
}

function escapeRegexValue(value) {
  const specialCharacters = new Set([".", "*", "+", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"]);
  specialCharacters.add(String.fromCharCode(63));
  let escapedValue = "";

  String(value).split("").forEach(function(character) {
    if (specialCharacters.has(character)) {
      escapedValue = escapedValue + "\\" + character;
      return;
    }

    escapedValue = escapedValue + character;
  });

  return escapedValue;
}

function getNowString() {
  return new Date().toLocaleString();
}

function createPasswordFields(password) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(
    String(password || ""),
    passwordSalt,
    PASSWORD_ITERATIONS,
    32,
    "sha256"
  ).toString("hex");

  return { passwordHash, passwordSalt };
}

function verifyPassword(password, shopper) {
  if (!shopper || !shopper.passwordHash || !shopper.passwordSalt) {
    return false;
  }

  const expectedHash = Buffer.from(shopper.passwordHash, "hex");
  const actualHash = crypto.pbkdf2Sync(
    String(password || ""),
    shopper.passwordSalt,
    PASSWORD_ITERATIONS,
    32,
    "sha256"
  );

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, actualHash);
}

function signToken(payload) {
  const tokenPayload = Object.assign({}, payload);
  tokenPayload.expiresAt = Date.now() + (1000 * 60 * 60 * 8);
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return encodedPayload + "." + signature;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");

  if (parts.length !== 2) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(parts[0])
    .digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(parts[1]);

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function getRequestUser(req) {
  const authHeader = req.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return verifyToken(authHeader.slice(7));
}

function requireAdmin(req, res) {
  const user = getRequestUser(req);

  if (!user) {
    res.status(401).json({ ok: false, message: "Please log in before using admin tools." });
    return false;
  }

  if (user.role !== "admin") {
    res.status(403).json({ ok: false, message: "Admin access is required." });
    return false;
  }

  return true;
}

function requireAuthenticated(req, res) {
  const user = getRequestUser(req);

  if (!user) {
    res.status(401).json({ ok: false, message: "Please log in first." });
    return null;
  }

  return user;
}

function requireMember(req, res) {
  const user = requireAuthenticated(req, res);

  if (!user) {
    return null;
  }

  if (user.role !== "member") {
    res.status(403).json({ ok: false, message: "A member account is required." });
    return null;
  }

  return user;
}

function requireEmailAccess(req, res, email) {
  const user = requireAuthenticated(req, res);

  if (!user) {
    return null;
  }

  if (user.role === "admin") {
    return user;
  }

  if (user.role === "member" && normalizeEmail(user.email) === normalizeEmail(email)) {
    return user;
  }

  res.status(403).json({ ok: false, message: "You can only access records for your own account." });
  return null;
}

function buildMemberUser(shopper) {
  const cleanShopper = cleanDocument(shopper);
  const userRole = cleanShopper.role || "member";

  return {
    role: userRole,
    id: cleanShopper.id,
    name: cleanShopper.name,
    email: cleanShopper.email,
    username: cleanShopper.username || "",
    phone: cleanShopper.phone,
    year: cleanShopper.year,
    affiliation: cleanShopper.affiliation,
    token: signToken({
      role: userRole,
      id: cleanShopper.id,
      email: cleanShopper.email,
      username: cleanShopper.username || ""
    })
  };
}

async function getNextNumber(model, fieldName, fallbackStart) {
  const highest = await model.findOne().sort({ [fieldName]: -1 }).lean();

  if (!highest || !Number(highest[fieldName])) {
    return fallbackStart;
  }

  return Number(highest[fieldName]) + 1;
}

async function generateProductID() {
  const products = await Product.find().select("productID").lean();
  let highestNum = 0;

  products.forEach(function(product) {
    const currentNum = parseInt(String(product.productID || "").replace(/^P/i, ""), 10);

    if (!isNaN(currentNum) && currentNum > highestNum) {
      highestNum = currentNum;
    }
  });

  return "P" + (highestNum + 1);
}

async function generateReturnID() {
  const returns = await ReturnRequest.find().select("returnID").lean();
  let highestNum = 0;

  returns.forEach(function(returnRequest) {
    const currentNum = parseInt(String(returnRequest.returnID || "").replace(/^R/i, ""), 10);

    if (!isNaN(currentNum) && currentNum > highestNum) {
      highestNum = currentNum;
    }
  });

  return "R" + (highestNum + 1);
}

function buildProductPayload(body, productID) {
  return {
    productID,
    description: String(body.description || "").trim(),
    category: String(body.category || "").trim(),
    unit: String(body.unit || "").trim(),
    price: Number(body.price),
    weight: String(body.weight || "").trim(),
    color: String(body.color || "").trim()
  };
}

function validateProductPayload(product) {
  if (product.category === "" || product.unit === "") {
    return "Category and unit are required";
  }

  if (isNaN(product.price) || product.price <= 0) {
    return "Price must be greater than 0";
  }

  return "";
}

function buildShopperPayload(body, existingShopper) {
  const source = existingShopper || {};
  const username = normalizeUsername(body.username);

  return {
    id: source.id || Date.now(),
    name: String(body.name || "").trim(),
    email: normalizeEmail(body.email),
    username: username || source.username || undefined,
    year: String(body.year || "").trim(),
    affiliation: String(body.affiliation || "").trim(),
    phone: String(body.phone || "").trim(),
    registeredAt: source.registeredAt || getNowString()
  };
}

function validatePasswordInput(password, passwordIsRequired) {
  const cleanPassword = String(password || "");

  if (passwordIsRequired && cleanPassword === "") {
    return "Password is required";
  }

  if (cleanPassword !== "" && cleanPassword.length < 6) {
    return "Password must be at least 6 characters";
  }

  return "";
}

function validateShopperPayload(shopper, options) {
  const settings = options || {};

  if (shopper.name === "" || shopper.email === "") {
    return "Name and email are required";
  }

  if (!isValidEmail(shopper.email)) {
    return "A valid email address is required";
  }

  if (settings.requireLoginFields && !shopper.username) {
    return "Username is required";
  }

  if (shopper.username && !/^[a-z0-9_.-]{3,30}$/.test(shopper.username)) {
    return "Username must be 3 to 30 characters and use letters, numbers, dots, dashes, or underscores";
  }

  if (shopper.year !== "" && Number(shopper.year) <= 0) {
    return "Year or age must be greater than 0";
  }

  return "";
}

function snapshotCartItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(function(item) {
    return {
      productID: String(item.productID || "").trim(),
      description: String(item.description || "").trim(),
      category: String(item.category || "").trim(),
      unit: String(item.unit || "").trim(),
      price: Number(item.price || 0),
      weight: String(item.weight || "").trim(),
      color: String(item.color || "").trim()
    };
  }).filter(function(item) {
    return item.productID !== "";
  });
}

async function autoRegisterShopperFromOrder(order) {
  const email = normalizeEmail(order.customer && order.customer.email);

  if (email === "") {
    return null;
  }

  const existingShopper = await Shopper.findOne({ email });

  if (existingShopper) {
    if (!existingShopper.phone && order.customer && order.customer.phone) {
      existingShopper.phone = String(order.customer.phone || "").trim();
      await existingShopper.save();
    }

    return null;
  }

  const shopper = new Shopper(buildShopperPayload({
    name: order.customer.fullName || email,
    email,
    phone: order.customer.phone || "",
    year: "",
    affiliation: "Checkout Customer"
  }));

  await shopper.save();
  return shopper;
}

async function seedProductsIfEmpty() {
  const productCount = await Product.countDocuments();

  if (productCount > 0) {
    return;
  }

  await Product.insertMany(starterProducts.map(function(product) {
    return buildProductPayload(product, String(product.productID || "").trim());
  }));
}

async function ensureAdminAccount() {
  const adminUsername = "admin";
  const adminEmail = "admin@club.portal";
  const adminCandidates = await Shopper.find({
    $or: [
      { username: adminUsername },
      { email: adminEmail },
      { role: "admin" }
    ]
  }).sort({ id: 1 });
  let admin = null;

  if (adminCandidates.length > 0) {
    admin = adminCandidates[0];
    const duplicateIDs = adminCandidates.slice(1).map(function(candidate) {
      return candidate._id;
    });

    if (duplicateIDs.length > 0) {
      await Shopper.deleteMany({ _id: { $in: duplicateIDs } });
    }
  }

  const adminPasswordFields = createPasswordFields("admin");

  if (!admin) {
    admin = new Shopper({
      id: await getNextNumber(Shopper, "id", 1),
      registeredAt: getNowString()
    });
  }

  admin.name = "Admin";
  admin.email = adminEmail;
  admin.username = adminUsername;
  admin.role = "admin";
  admin.affiliation = "Club Portal Staff";
  admin.phone = "";
  admin.year = "";
  admin.passwordHash = adminPasswordFields.passwordHash;
  admin.passwordSalt = adminPasswordFields.passwordSalt;
  await admin.save();
  return admin;
}

async function ensureDemoMemberAccount() {
  const demoUsername = "johndoe";
  const demoEmail = "johndoe@club.portal";
  const demoCandidates = await Shopper.find({
    $or: [
      { username: demoUsername },
      { email: demoEmail }
    ]
  }).sort({ id: 1 });
  let demoMember = null;

  if (demoCandidates.length > 0) {
    demoMember = demoCandidates[0];
    const duplicateIDs = demoCandidates.slice(1).map(function(candidate) {
      return candidate._id;
    });

    if (duplicateIDs.length > 0) {
      await Shopper.deleteMany({ _id: { $in: duplicateIDs } });
    }
  }

  const demoPasswordFields = createPasswordFields("Admin6");

  if (!demoMember) {
    demoMember = new Shopper({
      id: await getNextNumber(Shopper, "id", 1),
      registeredAt: getNowString()
    });
  }

  demoMember.name = "John Doe";
  demoMember.email = demoEmail;
  demoMember.username = demoUsername;
  demoMember.role = "member";
  demoMember.affiliation = "Demo Member";
  demoMember.phone = "555-123-4567";
  demoMember.year = "1";
  demoMember.passwordHash = demoPasswordFields.passwordHash;
  demoMember.passwordSalt = demoPasswordFields.passwordSalt;
  await demoMember.save();
  return demoMember;
}

async function getCollectionCounts() {
  const collections = await Promise.all([
    Shopper.countDocuments(),
    Product.countDocuments(),
    ShoppingCart.countDocuments(),
    Order.countDocuments(),
    ReturnRequest.countDocuments()
  ]);

  return {
    shopper: collections[0],
    products: collections[1],
    shopping_cart: collections[2],
    orders: collections[3],
    returns: collections[4]
  };
}

async function resetDemoDatabase() {
  await Promise.all([
    Shopper.deleteMany({
      role: { $ne: "admin" },
      username: { $ne: "johndoe" },
      email: { $ne: "johndoe@club.portal" }
    }),
    Product.deleteMany({}),
    ShoppingCart.deleteMany({}),
    Order.deleteMany({}),
    ReturnRequest.deleteMany({})
  ]);

  await ensureAdminAccount();
  await ensureDemoMemberAccount();
  await seedProductsIfEmpty();
}

app.get("/api/health", asyncHandler(async function(req, res) {
  res.json({
    ok: true,
    database: mongoose.connection.name,
    collections: await getCollectionCounts()
  });
}));

app.post("/api/admin/reset", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const confirmation = String(req.body.confirm || "").trim().toUpperCase();

  if (confirmation !== "RESET") {
    res.status(400).json({ ok: false, message: "Type RESET to confirm the demo database reset." });
    return;
  }

  await resetDemoDatabase();

  res.json({
    ok: true,
    message: "Demo data reset. Demo accounts and starter products were reloaded.",
    collections: await getCollectionCounts()
  });
}));

app.post(["/api/login", "/api/auth/login"], asyncHandler(async function(req, res) {
  const loginType = String(req.body.loginType || req.body.role || "").trim().toLowerCase();
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const loginName = normalizeUsername(req.body.username || req.body.email);
  const email = normalizeEmail(req.body.email || req.body.username);

  if (loginName === "" || password === "") {
    res.status(400).json({ ok: false, message: "Enter your username and password" });
    return;
  }

  const filters = [{ username: loginName }];

  if (isValidEmail(email)) {
    filters.push({ email });
  }

  const shopper = await Shopper.findOne({ $or: filters }).lean();

  if (!shopper || !verifyPassword(password, shopper)) {
    res.status(401).json({ ok: false, message: "Username or password is incorrect" });
    return;
  }

  if ((loginType === "admin" || username === "admin") && shopper.role !== "admin") {
    res.status(403).json({ ok: false, message: "Admin access is required" });
    return;
  }

  res.json({
    ok: true,
    user: buildMemberUser(shopper)
  });
}));

app.get(["/api/members", "/api/shoppers"], asyncHandler(async function(req, res) {
  const filter = {};

  if (req.query.email !== undefined) {
    const email = normalizeEmail(req.query.email);

    if (email === "") {
      res.json([]);
      return;
    }

    if (!requireEmailAccess(req, res, email)) {
      return;
    }

    filter.email = email;
  } else {
    if (!requireAdmin(req, res)) {
      return;
    }

    filter.role = { $ne: "admin" };
  }

  const shoppers = await Shopper.find(filter).sort({ registeredAt: -1 }).lean();
  res.json(cleanDocument(shoppers));
}));

app.post(["/api/members", "/api/shoppers"], asyncHandler(async function(req, res) {
  const shopperPayload = buildShopperPayload(req.body);
  const validationError = validateShopperPayload(shopperPayload, { requireLoginFields: true });
  const passwordError = validatePasswordInput(req.body.password, true);

  if (validationError) {
    res.status(400).json({ ok: false, message: validationError });
    return;
  }

  if (passwordError) {
    res.status(400).json({ ok: false, message: passwordError });
    return;
  }

  const existingByEmail = await Shopper.findOne({ email: shopperPayload.email });
  let existingByUsername = null;

  if (shopperPayload.username) {
    existingByUsername = await Shopper.findOne({ username: shopperPayload.username });
  }

  if (existingByUsername && (!existingByEmail || existingByUsername.id !== existingByEmail.id)) {
    res.status(409).json({ ok: false, message: "A shopper with this username already exists" });
    return;
  }

  if (existingByEmail && (existingByEmail.passwordHash || existingByEmail.username)) {
    res.status(409).json({ ok: false, message: "A shopper with this email already exists" });
    return;
  }

  if (existingByEmail) {
    const claimedPayload = Object.assign({}, shopperPayload);
    claimedPayload.id = existingByEmail.id;
    claimedPayload.role = "member";
    claimedPayload.registeredAt = existingByEmail.registeredAt || shopperPayload.registeredAt;
    Object.assign(claimedPayload, createPasswordFields(req.body.password));

    const claimedShopper = await Shopper.findOneAndUpdate(
      { id: existingByEmail.id },
      claimedPayload,
      { returnDocument: "after" }
    );
    const cleanClaimedShopper = cleanDocument(claimedShopper);
    const claimedResponse = Object.assign({ ok: true }, cleanClaimedShopper);
    claimedResponse.user = buildMemberUser(claimedShopper);
    res.status(201).json(claimedResponse);
    return;
  }

  const createPayload = Object.assign({}, shopperPayload);
  createPayload.role = "member";
  Object.assign(createPayload, createPasswordFields(req.body.password));

  const shopper = await Shopper.create(createPayload);
  const cleanShopper = cleanDocument(shopper);
  const createResponse = Object.assign({ ok: true }, cleanShopper);
  createResponse.user = buildMemberUser(shopper);
  res.status(201).json(createResponse);
}));

app.put(["/api/members/:id", "/api/shoppers/:id"], asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const id = parseID(req.params.id);

  if (id === null) {
    res.status(400).json({ ok: false, message: "Invalid shopper ID" });
    return;
  }

  const existingShopper = await Shopper.findOne({ id });

  if (!existingShopper) {
    res.status(404).json({ ok: false, message: "Shopper not found" });
    return;
  }

  const shopperPayload = buildShopperPayload(req.body, existingShopper);
  const passwordWasProvided = String(req.body.password || "") !== "";
  const validationError = validateShopperPayload(shopperPayload, {
    requireLoginFields: Boolean(shopperPayload.username || passwordWasProvided)
  });
  const passwordError = validatePasswordInput(req.body.password, false);

  if (validationError) {
    res.status(400).json({ ok: false, message: validationError });
    return;
  }

  if (passwordError) {
    res.status(400).json({ ok: false, message: passwordError });
    return;
  }

  const duplicateFilters = [{ email: shopperPayload.email }];

  if (shopperPayload.username) {
    duplicateFilters.push({ username: shopperPayload.username });
  }

  const duplicateShopper = await Shopper.findOne({
    $or: duplicateFilters,
    id: { $ne: id }
  });

  if (duplicateShopper) {
    let duplicateField = "username";

    if (duplicateShopper.email === shopperPayload.email) {
      duplicateField = "email";
    }

    res.status(409).json({ ok: false, message: "A shopper with this " + duplicateField + " already exists" });
    return;
  }

  const updatePayload = Object.assign({}, shopperPayload);
  updatePayload.role = existingShopper.role || "member";

  if (passwordWasProvided) {
    Object.assign(updatePayload, createPasswordFields(req.body.password));
  }

  const updatedShopper = await Shopper.findOneAndUpdate({ id }, updatePayload, { returnDocument: "after" });
  res.json({ ok: true, member: cleanDocument(updatedShopper), shopper: cleanDocument(updatedShopper) });
}));

app.delete(["/api/members/:id", "/api/shoppers/:id"], asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const id = parseID(req.params.id);

  if (id === null) {
    res.status(400).json({ ok: false, message: "Invalid shopper ID" });
    return;
  }

  const deletedShopper = await Shopper.findOneAndDelete({ id });

  if (!deletedShopper) {
    res.status(404).json({ ok: false, message: "Shopper not found" });
    return;
  }

  res.json({ ok: true });
}));

app.get("/api/products", asyncHandler(async function(req, res) {
  const products = await Product.find().sort({ productID: 1 }).lean();
  res.json(cleanDocument(products));
}));

app.post("/api/products", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const productID = await generateProductID();
  const newProduct = buildProductPayload(req.body, productID);
  const validationError = validateProductPayload(newProduct);

  if (validationError) {
    res.status(400).json({ ok: false, message: validationError });
    return;
  }

  const product = await Product.create(newProduct);
  res.status(201).json(cleanDocument(product));
}));

app.put("/api/products/:productID", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const productID = String(req.params.productID || "").trim();
  const productPayload = buildProductPayload(req.body, productID);
  const validationError = validateProductPayload(productPayload);

  if (validationError) {
    res.status(400).json({ ok: false, message: validationError });
    return;
  }

  const updatedProduct = await Product.findOneAndUpdate(
    { productID: new RegExp("^" + escapeRegexValue(productID) + "$", "i") },
    productPayload,
    { returnDocument: "after" }
  );

  if (!updatedProduct) {
    res.status(404).json({ ok: false, message: "Product not found" });
    return;
  }

  res.json({ ok: true, product: cleanDocument(updatedProduct) });
}));

app.delete("/api/products/:productID", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const productID = String(req.params.productID || "").trim();
  const deletedProduct = await Product.findOneAndDelete({
    productID: new RegExp("^" + escapeRegexValue(productID) + "$", "i")
  });

  if (!deletedProduct) {
    res.status(404).json({ ok: false, message: "Product not found" });
    return;
  }

  res.json({ ok: true });
}));

app.get("/api/shopping-cart/:cartSessionID", asyncHandler(async function(req, res) {
  const requestUser = requireMember(req, res);

  if (!requestUser) {
    return;
  }

  const cartSessionID = String(req.params.cartSessionID || "").trim();

  if (cartSessionID === "") {
    res.status(400).json({ ok: false, message: "Cart session ID is required" });
    return;
  }

  let cart = await ShoppingCart.findOne({
    cartSessionID,
    shopperEmail: normalizeEmail(requestUser.email)
  }).lean();

  if (!cart) {
    cart = {
      cartSessionID,
      shopperEmail: "",
      items: [],
      status: "active",
      updatedAt: getNowString()
    };
  }

  res.json(cleanDocument(cart));
}));

app.put("/api/shopping-cart/:cartSessionID", asyncHandler(async function(req, res) {
  const requestUser = requireMember(req, res);

  if (!requestUser) {
    return;
  }

  const cartSessionID = String(req.params.cartSessionID || "").trim();

  if (cartSessionID === "") {
    res.status(400).json({ ok: false, message: "Cart session ID is required" });
    return;
  }

  const existingCart = await ShoppingCart.findOne({ cartSessionID }).lean();
  const requestEmail = normalizeEmail(requestUser.email);

  if (existingCart && existingCart.shopperEmail && normalizeEmail(existingCart.shopperEmail) !== requestEmail) {
    res.status(403).json({ ok: false, message: "You can only update your own cart." });
    return;
  }

  let cartStatus = "active";

  if (req.body.status === "submitted" || req.body.status === "cleared") {
    cartStatus = req.body.status;
  }

  const cartPayload = {
    cartSessionID,
    shopperEmail: requestEmail,
    items: snapshotCartItems(req.body.items),
    status: cartStatus,
    updatedAt: getNowString()
  };

  const cart = await ShoppingCart.findOneAndUpdate(
    { cartSessionID },
    cartPayload,
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );

  res.json(cleanDocument(cart));
}));

app.delete("/api/shopping-cart/:cartSessionID", asyncHandler(async function(req, res) {
  const requestUser = requireMember(req, res);

  if (!requestUser) {
    return;
  }

  const cartSessionID = String(req.params.cartSessionID || "").trim();
  const deletedCart = await ShoppingCart.findOneAndDelete({
    cartSessionID,
    shopperEmail: normalizeEmail(requestUser.email)
  });

  if (!deletedCart) {
    res.status(404).json({ ok: false, message: "Shopping cart not found" });
    return;
  }

  res.json({ ok: true });
}));

app.get("/api/orders", asyncHandler(async function(req, res) {
  const filter = {};
  let customerEmail = "";

  if (req.query.status) {
    filter.status = String(req.query.status).trim().toLowerCase();
  }

  if (req.query.customerEmail !== undefined) {
    customerEmail = normalizeEmail(req.query.customerEmail);

    if (customerEmail === "") {
      res.json([]);
      return;
    }

    if (!requireEmailAccess(req, res, customerEmail)) {
      return;
    }

    filter["customer.email"] = customerEmail;
  } else if (!requireAdmin(req, res)) {
    return;
  }

  const orders = await Order.find(filter).sort({ id: -1 }).lean();
  res.json(cleanDocument(orders));
}));

app.get("/api/orders/pending", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const orders = await Order.find({ status: "pending" }).sort({ id: -1 }).lean();
  res.json(cleanDocument(orders));
}));

app.post("/api/orders", asyncHandler(async function(req, res) {
  const requestUser = requireMember(req, res);

  if (!requestUser) {
    return;
  }

  const cartItems = snapshotCartItems(req.body.cart);
  const customer = req.body.customer || {};
  const customerEmail = normalizeEmail(customer.email);

  if (cartItems.length === 0) {
    res.status(400).json({ ok: false, message: "Cart must include at least one product" });
    return;
  }

  if (String(customer.fullName || "").trim() === "" || customerEmail === "") {
    res.status(400).json({ ok: false, message: "Customer name and email are required" });
    return;
  }

  if (!isValidEmail(customerEmail)) {
    res.status(400).json({ ok: false, message: "A valid customer email is required" });
    return;
  }

  if (normalizeEmail(requestUser.email) !== customerEmail) {
    res.status(403).json({ ok: false, message: "Orders must use the signed-in member account." });
    return;
  }

  const order = await Order.create({
    id: await getNextNumber(Order, "id", Date.now()),
    date: getNowString(),
    status: "pending",
    customer: {
      fullName: String(customer.fullName || "").trim(),
      email: customerEmail,
      phone: String(customer.phone || "").trim()
    },
    options: {
      pickupMethod: String((req.body.options && req.body.options.pickupMethod) || "").trim(),
      paymentMethod: String((req.body.options && req.body.options.paymentMethod) || "").trim(),
      shippingAddress: String((req.body.options && req.body.options.shippingAddress) || "").trim(),
      billingName: String((req.body.options && req.body.options.billingName) || "").trim(),
      billingAddress: String((req.body.options && req.body.options.billingAddress) || "").trim(),
      notes: String((req.body.options && req.body.options.notes) || "").trim()
    },
    cart: cartItems,
    total: Number(req.body.total || 0)
  });

  await autoRegisterShopperFromOrder(order);

  if (req.body.cartSessionID) {
    await ShoppingCart.findOneAndUpdate(
      { cartSessionID: String(req.body.cartSessionID).trim() },
      { status: "submitted", shopperEmail: customerEmail, updatedAt: getNowString() }
    );
  }

  res.status(201).json(cleanDocument(order));
}));

app.put("/api/orders/:id", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const id = parseID(req.params.id);
  const status = String(req.body.status || "").trim().toLowerCase();

  if (id === null) {
    res.status(400).json({ ok: false, message: "Invalid order ID" });
    return;
  }

  if (status !== "pending" && status !== "approved" && status !== "declined") {
    res.status(400).json({ ok: false, message: "Invalid status" });
    return;
  }

  const updatedOrder = await Order.findOneAndUpdate({ id }, { status }, { returnDocument: "after" });

  if (!updatedOrder) {
    res.status(404).json({ ok: false, message: "Order not found" });
    return;
  }

  res.json({ ok: true, order: cleanDocument(updatedOrder) });
}));

app.delete("/api/orders/:id", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const id = parseID(req.params.id);

  if (id === null) {
    res.status(400).json({ ok: false, message: "Invalid order ID" });
    return;
  }

  const deletedOrder = await Order.findOneAndDelete({ id });

  if (!deletedOrder) {
    res.status(404).json({ ok: false, message: "Order not found" });
    return;
  }

  res.json({ ok: true });
}));

app.get("/api/returns", asyncHandler(async function(req, res) {
  const filter = {};

  if (req.query.email !== undefined) {
    const email = normalizeEmail(req.query.email);

    if (email === "") {
      res.json([]);
      return;
    }

    if (!requireEmailAccess(req, res, email)) {
      return;
    }

    filter.email = email;
  } else if (!requireAdmin(req, res)) {
    return;
  }

  if (req.query.status) {
    filter.status = String(req.query.status).trim().toLowerCase();
  }

  const returns = await ReturnRequest.find(filter).sort({ returnID: -1 }).lean();
  res.json(cleanDocument(returns));
}));

app.post("/api/returns", asyncHandler(async function(req, res) {
  const requestUser = requireMember(req, res);

  if (!requestUser) {
    return;
  }

  const orderID = parseID(req.body.orderID);
  const email = normalizeEmail(req.body.email);
  const reason = String(req.body.reason || "").trim();

  if (orderID === null || email === "" || reason === "") {
    res.status(400).json({ ok: false, message: "Order ID, email, and reason are required" });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ ok: false, message: "A valid email address is required" });
    return;
  }

  if (normalizeEmail(requestUser.email) !== email) {
    res.status(403).json({ ok: false, message: "Returns must use the signed-in member account." });
    return;
  }

  const order = await Order.findOne({ id: orderID }).lean();

  if (!order) {
    res.status(404).json({ ok: false, message: "Order not found for this return request" });
    return;
  }

  if (normalizeEmail(order.customer && order.customer.email) !== email) {
    res.status(400).json({ ok: false, message: "Return email must match the order email" });
    return;
  }

  const returnRequest = await ReturnRequest.create({
    returnID: await generateReturnID(),
    orderID,
    email,
    reason,
    status: "requested",
    notes: String(req.body.notes || "").trim(),
    createdAt: getNowString(),
    resolvedAt: ""
  });

  res.status(201).json(cleanDocument(returnRequest));
}));

app.put("/api/returns/:returnID", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const returnID = String(req.params.returnID || "").trim();
  const status = String(req.body.status || "").trim().toLowerCase();
  const allowedStatuses = ["requested", "approved", "declined", "resolved"];

  if (returnID === "") {
    res.status(400).json({ ok: false, message: "Return ID is required" });
    return;
  }

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({ ok: false, message: "Invalid return status" });
    return;
  }

  const update = {
    status,
    notes: String(req.body.notes || "").trim()
  };

  if (status === "resolved" || status === "approved" || status === "declined") {
    update.resolvedAt = getNowString();
  }

  const updatedReturn = await ReturnRequest.findOneAndUpdate({ returnID }, update, { returnDocument: "after" });

  if (!updatedReturn) {
    res.status(404).json({ ok: false, message: "Return request not found" });
    return;
  }

  res.json({ ok: true, returnRequest: cleanDocument(updatedReturn) });
}));

app.delete("/api/returns/:returnID", asyncHandler(async function(req, res) {
  if (!requireAdmin(req, res)) {
    return;
  }

  const returnID = String(req.params.returnID || "").trim();
  const deletedReturn = await ReturnRequest.findOneAndDelete({ returnID });

  if (!deletedReturn) {
    res.status(404).json({ ok: false, message: "Return request not found" });
    return;
  }

  res.json({ ok: true });
}));

app.use(function(error, req, res, next) {
  console.error(error);

  if (error && error.code === 11000) {
    res.status(409).json({ ok: false, message: "A record with that unique value already exists" });
    return;
  }

  res.status(500).json({ ok: false, message: "Server error" });
});

async function startServer() {
  await mongoose.connect(MONGODB_URI);
  await seedProductsIfEmpty();
  await ensureAdminAccount();
  await ensureDemoMemberAccount();

  app.listen(PORT, function() {
    console.log("server running on http://localhost:" + PORT);
    console.log("mongodb connected to " + mongoose.connection.name);
  });
}

startServer().catch(function(error) {
  console.error("Server failed to start", error);
  process.exit(1);
});
