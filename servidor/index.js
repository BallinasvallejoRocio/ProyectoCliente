const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(cors());
app.use(express.json());

let notificaciones = [];
let idNotificacion = 0;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente', 'index.html'));
});

// short-polling
app.get('/notificaciones', (req, res) => {
    res.status(200).json({
        success: true,
        notificaciones
    });
});

// long-polling
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

http.listen(3000, () => console.log('Servidor en ejecución en el puerto 3000'));

//Socket.IO
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado');
    });
});
