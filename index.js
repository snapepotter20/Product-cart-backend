const express = require("express");
const cors = require("cors");
require("./dB/config");
const User = require("./dB/User");
const Product = require("./dB/Product");

const Jwt = require("jsonwebtoken");
const jwtKey = "ecomm";

const app = express();

app.use(express.json());

const corsOptions = {
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));


app.use(cors());

app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) res.send({ result: "Something went wrong" });
    res.send({ result, auth: token });
  });
});

app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) res.send({ result: "Something went wrong" });
        res.send({ user, auth: token });
      });
    } else res.send({ result: "User not found" });
  } else res.send({ result: "User not found" });
});


const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please provide valid token" });
      } else next();
    });
  } else {
    res.status(403).send({ result: "Please add token to header" });
  }
};



app.post("/addProduct", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  const result = await product.save();
  res.send(result);
});

app.get("/products", verifyToken ,async (req, res) => {
  const products = await Product.find();
  if (products.length > 0) res.send(products);
  else res.send({ result: "No product found" });
});

app.delete("/product/:id",verifyToken, async (req, res) => {
  const productDeleted = await Product.deleteOne({ _id: req.params.id });
  res.send(productDeleted);
});

app.get("/product/:id", verifyToken,async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) res.send(result);
  else res.send({ result: "No Record Found" });
});

app.put("/product/:id", verifyToken,async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  res.send(result);
});

app.get("/search/:key", verifyToken , async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});


app.listen(5000);
