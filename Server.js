const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({limit: '50mb'}));

// YAHAN APNA MONGODB LINK PASTE KARO
mongoose.connect('PASTE_MONGODB_LINK_HERE');

// YAHAN APNI CLOUDINARY KEYS PASTE KARO
cloudinary.config({
  cloud_name: 'PASTE_CLOUD_NAME',
  api_key: 'PASTE_API_KEY',
  api_secret: 'PASTE_API_SECRET'
});

const Message = mongoose.model('Message', {
  from: String, to: String, text: String, image: String,
  time: { type: Date, default: Date.now }
});

io.on('connection', (socket) => {
  socket.on('getMessages', async ({me, friend}) => {
    const msgs = await Message.find({
      $or: [{from:me, to:friend}, {from:friend, to:me}]
    }).sort({time:1});
    socket.emit('loadMessages', msgs);
  });

  socket.on('sendMessage', async (data) => {
    let imageUrl = '';
    if(data.image){
      const uploaded = await cloudinary.uploader.upload(data.image);
      imageUrl = uploaded.secure_url;
    }
    const newMsg = new Message({...data, image: imageUrl});
    await newMsg.save();
    io.emit('receiveMessage', newMsg);
  });
});

server.listen(10000, () => console.log("Hi Server Live"));
