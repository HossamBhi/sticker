const express = require("express");
const fs = require("fs");
const multer = require("multer");
const tags = require("./websiteAPI/tags");
const packages = require("./websiteAPI/packages");
const config = require("./config");
const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const id = req.params.sticker_id;
    if (!id) return cb(null, "uploads/");
    // uplaod stickers
    const packDir = `uploads/${id}`;
    if (!fs.existsSync(packDir)) {
      fs.mkdirSync(packDir);
    }
    cb(null, packDir);
  },
  filename: function (req, file, cb) {
    const id = req.params.sticker_id;
    if (id) return cb(null, id + "_" + file.originalname);
    cb(null, new Date().getTime() + "_" + file.originalname);
  },
});
const upload = multer({
  storage,
  onError: function (err, next) {
    console.log("error", err);
    next(err);
  },
});
// const upload = multer({dest: "uploads/"});

app.use(express.json()); // parses incoming requests with JSON payloads

app.get("/", function (req, res) {
  const help = `
  <pre>
    Welcome to the Hossam Basha Readable API for Sticker project!

 </pre>
  `;
  res.send(help);
});

// ------------------------------------------ Tags -------------------------------------------
app.get("/tags", (req, res) => {
  tags.getAll().then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({
        error: "There was an error.",
      });
    }
  );
});
app.post("/tags", upload.single("image"), (req, res) => {
  const file = req.file ? req.file : { path: "" };
  const tag = req.body;
  tags.add({ ...tag, tag_image: file.path }).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
app.delete("/tags/:id", (req, res) => {
  const { id } = req.params;
  tags.remove(id).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
app.put("/tags/:id", upload.single("image"), (req, res) => {
  const file = req.file ? req.file : { path: false };
  const tag = req.body;
  tags.edit(req.params.id, { ...tag, tag_image: file.path }).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
// ------------------------------------------ packages -------------------------------------------
//  get all packages
app.get("/packages", (req, res) => {
  packages.getAll().then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({
        error: "There was an error.",
      });
    }
  );
});
// gat items by package id
app.get("/packages/:id", (req, res) => {
  const { id } = req.params;
  packages.getItemsByPackageId(id).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});

// delete package by id
app.delete("/packages/:id", (req, res) => {
  const { id } = req.params;
  packages.remove(id).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
// update package by id
app.put("/packages/:id", upload.single("image"), (req, res) => {
  const file = req.file ? req.file : { path: false };
  const pack = req.body;
  packages.edit(req.params.id, { ...pack, category_image: file.path }).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
// post new package
app.post("/packages", upload.single("image"), (req, res) => {
  const file = req.file ? req.file : { path: "" };
  const pack = req.body;
  packages.add({ ...pack, category_image: file.path }).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});
// post items on cateory by id
app.post("/packages/:sticker_id", upload.array("images"), (req, res) => {
  // TODO: handle images
  const id = req.params.sticker_id;
  packages.addItems(id, req.files).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});

// delete item by id
app.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  packages.removeItem(id).then(
    (data) => res.send(data),
    (error) => {
      console.error(error);
      res.status(500).send({ error: "There was an error." });
    }
  );
});

app.listen(config.port, () => {
  console.log("Server listening on port %s, Ctrl+C to stop", config.port);
});
