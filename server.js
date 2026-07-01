const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const Room = require('./models/Room'); // ← yeh missing tha

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'https://real-time-collab-client.vercel.app'],
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://real-time-collab-client.vercel.app'],
    methods: ['GET', 'POST']
}));
app.use(express.json());

const roomRoutes = require('./routes/room');
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Collab Platform Server chal raha hai!' });
});

const roomUsers = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Room join — saved code bhi bhejo
    socket.on('join-room', async ({ roomCode, username }) => {
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.username = username;

        if (!roomUsers[roomCode]) roomUsers[roomCode] = [];
        roomUsers[roomCode].push({ id: socket.id, username });

        io.to(roomCode).emit('users-updated', roomUsers[roomCode]);
        socket.to(roomCode).emit('user-joined', { username });

        // MongoDB se saved code lo — sirf is user ko bhejo
        try {
            const room = await Room.findOne({ roomCode });
            if (room && room.content) {
                socket.emit('load-code', room.content); // ← yeh missing tha
            }
        } catch (err) {
            console.log('Room fetch error:', err);
        }

        console.log(`${username} joined room ${roomCode}`);
    });

    // Chat message
    socket.on('send-message', ({ roomCode, message, username }) => {
        io.to(roomCode).emit('receive-message', {
            username,
            message,
            time: new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        });
    });

    // Code change — save + broadcast
    socket.on('code-change', ({ roomCode, code }) => {
        socket.to(roomCode).emit('code-updated', code);

        Room.findOneAndUpdate(
            { roomCode },
            { content: code },
            { new: true }
        ).catch(err => console.log('Code save error:', err));
    });

    // Disconnect
    socket.on('disconnect', () => {
        const { roomCode, username } = socket;
        if (roomCode && roomUsers[roomCode]) {
            roomUsers[roomCode] = roomUsers[roomCode].filter(u => u.id !== socket.id);
            io.to(roomCode).emit('users-updated', roomUsers[roomCode]);
            socket.to(roomCode).emit('user-left', { username });
        }
        console.log('User disconnected:', socket.id);
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected!');
        httpServer.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => console.log('MongoDB error:', err));
