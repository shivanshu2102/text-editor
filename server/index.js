const express = require('express');
const app = express();
const cors = require ('cors');
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    cors: {
        origin: "http://127.0.0.1:5500",   // Your client url
        methods: ["GET", "POST"]
    }
});
users = [] ; 
app.get('/', (req, res)=> {
    res.send("Server is running.");
});

io.on('connection', socket => { 
    const connectedUserId = socket.id;
    users.push(socket.id);
    io.emit('update-user-list', users);
    console.log(`${socket.id} connected`);
   

    socket.on('disconnect', () => {
        let index = users.indexOf(socket.id);
        io.emit('user-disconnected', connectedUserId);
        if (index !== -1) {
          users.splice(index, 1);
        }
        io.emit('update-user-list', users);
       
        
    });

    socket.on('text-edited', (text) => {
        // console.log(text);
        socket.broadcast.emit('receive-changes', text);
    });
    // Handle typing event
socket.on('typing', () => {
   
    const userName = socket.id ; 
   
    socket.broadcast.emit('user-typing', userName); 
});
socket.on('highlight-text', (highlightData) => {
    io.emit('highlight-text', highlightData);
});
//cursor code--------------------------------------------
// Store cursor positions
// Handle mouse movement events from clients
socket.on('mouse-move', (data) => {
    // Broadcast mouse movement data to all connected clients
    io.emit('mouse-move', data);
});

//lock status
let documentLock = {
    locked: false,
    lockHolder: null,
};

socket.on('request-lock', (data) => {
    if (!documentLock.locked) {
        documentLock.locked = true;
        documentLock.lockHolder = data.userId;
        socket.emit('lock-status', { locked: true, lockHolder: data.userId });
    } else {
        socket.emit('lock-status', { locked: true, lockHolder: documentLock.lockHolder });
    }
});
socket.on('release-lock', (data) => {
    if (documentLock.lockHolder === data.userId) {
        documentLock.locked = false;
        documentLock.lockHolder = null;
        // Notify all users that the document is now unlocked
        io.emit('lock-status', { locked: false, lockHolder: null });
    }
});





//--------------------------------------------------------


    io.emit('user-connected', connectedUserId);
});


httpServer.listen(5000, () => {
    console.log('listening on *:5000');
});