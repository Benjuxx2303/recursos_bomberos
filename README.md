Guia para usar o testear la API:
1. Descargar el repositorio.
2. Abrir la carpeta "back" con Visual Studio Code
3. En Visual Studio Code, usar el comando "npm install". (Abrir la consola con Ctrl+Ñ)
4. Renombrar el archivo ".env.example" a ".env"
5. Editar las variables dentro del archivo ".env" para configurar el usuario, contraseña y nombre de la base de datos a usar.
6. Ejecutar la API  usando el siguiente comando en consola (dentro de la carpeta "back"): npm run dev
7. Para probar si la API se conectó correctamente con la base de datos y todo está funcionando correctamente, ir a la siguiente dirección: http://localhost:3000/ping

----------------------------------

Guia de uso de la API en una instancia EC2:
1. Conectar via SSH:
```
ssh -i "ruta-al-archivo-pem" ubuntu@<ipv4>
```

2. Iniciar XAMPP/LAMPP
```
sudo /opt/lampp/lampp start
```

3. Clonar el repositorio
```
git clone --branch dev https://github.com/Benjuxx2303/recursos_bomberos/
```

4. Verificar la rama del repositorio (debe ser dev)
```
cd recursos_bomberos
```
```
git branch
```

5. Actualizar el repositorio (si se esta en la rama correcta)
```
git pull 
```

5.2. Actualizar el repositorio
```
git pull origin dev
```

6. Volver a la raíz de la instancia
```
cd
```

7. Instalar las dependencias
```
cd recursos_bomberos/back/
```
```
npm install
```

8. Modificar la configuración del archivo dotenv
```
sudo nano recursos_bomberos/back/.env.example
```

9. Iniciar la API
```
cd recursos_bomberos/back/src/
```
```
npm run dev
```

----------------------------------

Matar procesos de node

1. Listar procesos
```
ps aux | grep node
```

2. Cerrar procesos de node
```
pkill node
```