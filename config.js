const mysql = require("mysql");
//Connect to Database
let connection = mysql.createConnection({
  host: "localhost",
  // user: "root",
  // password: "",
  // database: "sticker",
  // host: "az1-ss42.a2hosting.com",
  user: "sticke11_Hossam",
  password: ",4jKxS[=mfmg",
  database: "sticke11_sticker",
});

connection.connect(function (err) {
  //check connection to database
  if (err) throw err;
  console.log("connected to mysql host");
});

exports.mysql = mysql;
exports.connection = connection;
exports.port = process.env.PORT || 3001;
exports.origin = process.env.ORIGIN || `http://localhost:${exports.port}`;
