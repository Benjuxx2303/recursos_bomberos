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
PARA UBUNTU 
ssh -i "ruta-al-archivo-pem" ubuntu@<ipv4>
PARA LINUX
ssh -i .\"ruta-al-archivo-pem" ec2-user@<ipv4>
```

2. Iniciar XAMPP/LAMPP (MySQL)
```
sudo /opt/lampp/lampp startmysql
```
2.2. Iniciar XAMPP/LAMPP (MySQL)
```
sudo /opt/lampp/lampp stopmysql
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

5.2. Actualizar el repositorio (otra rama)
```
git pull origin <rama>
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
----------------------------------

Abrir MySQL

```
sudo /opt/lampp/bin/mysql -u root -p
```

--------------------------------------------
# Deploy a instancia EC2 usando NGINX y Node

Introducción
Sigue la lista de comandos una vez conectado y configurado tu instancia como en el tutorial. Si te sirvio me apoyarias mucho dandole like y suscribiendote! Si tienes alguna sugerencia de algun tutorial dejala en los comentarios.

Descargas a instancia EC2 y clonacion repositorio
Conectarte a tu instancia
```
ssh -i "[nombrearhcivo].pem" ubuntu@[ip-estatica]
```

Actualizar repositorios mas recientes
```
sudo apt-get update -y
```
Instalacion NGNIX
```
sudo apt install nginx
```
Verificar la instalacion
```
curl localhost
```

Instalacion NodeJS y NPM version 12
```
sudo apt-get install nodejs npm -y
```

Instalacion NVM para instalar la version LTS de node o la version 20 del tutorial
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```
Activar NVM
```
. ~/.nvm/nvm.sh
```
Instalacion de version especifica de node con NVM
```
nvm install 20
```
Clonar repositorio
```
git clone [repo].git
```
Configuracion NGINX
Moverte a la carpeta sites-available
```
cd /etc/nginx/sites-available/
```
Archivo sampleapp
```

server {

        listen 80;
        listen [::]:80;
        server_name [public_static_ip];
        location / {
                proxy_pass http://localhost:[YOUR_PORT];
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }
}
```
Creacion archivo sampleapp para la configuracion
```
sudo nano sampleapp
```
Link del sampleapp a sites-enabled
```
sudo ln -s /etc/nginx/sites-available/sampleapp /etc/nginx/sites-enabled
```
Verificar errores en el archivo de configuracion
```
sudo nginx -t
```
Reload NGINX
```
sudo service nginx reload
```
Configuracion PM2
Descarga pm2
```
npm i -g pm2
```
Ejecuta los siguientes comandos en la ruta de tu proyecto node
```
pm2 start

pm2 start ./location/index.js

pm2 startup
```
