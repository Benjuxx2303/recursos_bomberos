import { Server } from 'socket.io';
import { verifyToken } from './auth.js';

let io;

export const initializeWebSocket = (server, corsOptions) => {
    io = new Server(server, {
        cors: {
            origin: corsOptions.origin,
            methods: corsOptions.methods,
            credentials: corsOptions.credentials,
            allowedHeaders: corsOptions.allowedHeaders
        },
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        pingTimeout: 30000,
        pingInterval: 10000,
        connectTimeout: 30000,
        allowEIO3: true
    });

    // Namespace principal
    const mainNamespace = io.of('/');

    mainNamespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            // console.log('\n=== Nueva conexión WebSocket ===');
            // console.log('Token recibido:', token ? 'Presente' : 'No presente');
            
            if (!token) {
                // console.log('Error: Token no proporcionado');
                return next(new Error('Autenticación requerida'));
            }

            const user = await verifyToken(token);
            // console.log('Verificación de token:', user ? 'Exitosa' : 'Fallida');
            
            if (!user) {
                // console.log('Error: Usuario no encontrado o token inválido');
                return next(new Error('Token inválido'));
            }
            
            socket.user = user;
            // console.log('Usuario autenticado:', user.id);
            next();
        } catch (error) {
            console.error('Error de autenticación WebSocket:', error);
            next(new Error('Error de autenticación'));
        }
    });

    mainNamespace.on('connection', (socket) => {
        // console.log(`\n=== Usuario conectado: ${socket.user.id} ===`);
        
        // Unir al usuario a su sala personal
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);
        // console.log(`Usuario unido a la sala: ${userRoom}`);
        
        // Enviar evento de conexión exitosa
        socket.emit('connected', { 
            message: 'Conexión establecida',
            userId: socket.user.id 
        });

        socket.on('disconnect', (reason) => {
            // console.log(`\n=== Usuario desconectado: ${socket.user.id} ===`);
            // console.log('Razón:', reason);
            socket.leave(userRoom);
        });

        socket.on('error', (error) => {
            console.error('Error de socket:', error);
        });
    });

    // Manejar errores del servidor io
    io.on('connect_error', (error) => {
        console.error('Error de conexión IO:', error);
    });

    return io;
};

export const emitNotification = async (userId, notification) => {
    try {
        // console.log('\n=== Emitiendo notificación ===');
        // console.log('Usuario:', userId);
        // console.log('Notificación:', notification);

        const mainNamespace = io.of('/');
        if (!mainNamespace) {
            throw new Error('WebSocket no inicializado');
        }

        const userRoom = `user:${userId}`;
        const sockets = await mainNamespace.in(userRoom).allSockets();
        // console.log(`Sockets en sala ${userRoom}:`, sockets.size);

        mainNamespace.to(userRoom).emit('notification', notification);
        // console.log('Notificación emitida exitosamente');
        
        return true;
    } catch (error) {
        console.error('Error al emitir notificación:', error);
        throw error;
    }
};