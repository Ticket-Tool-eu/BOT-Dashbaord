const express = require('express')
const fs = require('fs')
const {join} = require('path')
const app = express()
const session = require("express-session")
const http = require('http')

module.exports = function (client) {
  const app = express();
  const session = require("express-session");
  const MemoryStore = require("memorystore")(session);
app.set("view engine", "ejs");
app.use(express.static('views'))

app.get("/support", (req, res) => {
    res.redirect('https://discord.gg/CKbxXW2')
})
app.get("/invite", (req,res) => {
    res.redirect('https://discord.com/api/oauth2/authorize?client_id=776880644990435338&permissions=8&scope=applications.commands%20bot')
})




app.get("/", (req, res) => {
  let image = client.user.avatarURL({ format: "png", dynamic: true, size: 64 })
  res.render("index.ejs", {
      client: client,
      image
  })
})


  

  var server = http.createServer(app);


    server.listen(80, () => console.log("http Server has Startet"));
}
