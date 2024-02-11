const express = require('express');
const morgan = require('morgan');
const { Server: SocketServer } = require('socket.io');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
  }
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

let notificaciones = [];
let idNotificacion = 0;

// Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  socket.setMaxListeners(50);
  
  socket.emit('conexionExitosa', 'Nuevo Cliente Conectado');

  socket.on('message', (msg) => {
    socket.broadcast.emit('message', { body: msg.body, user: msg.user });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente', 'index.html'));
});

//short-polling
app.get('/notificaciones', (req, res) => {
    res.status(200).json({
        success: true,
        notificaciones
    });
});

//long-polling
app.get('/notificaciones/update', (req, res) => {
    const idNotificacion = parseInt(req.query.idNotificacion, 10);
    const notificacionesNuevas = notificaciones.filter(notificacion => notificacion.id > idNotificacion);

    if (notificacionesNuevas.length > 0) {
        res.status(200).json({
            success: true,
            notificaciones: notificacionesNuevas
        });
    } else {
        setTimeout(() => {
            res.status(200).json({
                success: true,
                notificaciones: []
            });
        }, 5000);
    }
});

app.post('/notificaciones', (req, res) => {
    const cuerpo = req.body.cuerpo;
    idNotificacion++;
    const nuevaNotificacion = { id: idNotificacion, cuerpo };
    notificaciones.push(nuevaNotificacion);

    io.emit('nuevaNotificacion', nuevaNotificacion);

    res.status(201).json({
        success: true,
        notificacion: nuevaNotificacion
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
