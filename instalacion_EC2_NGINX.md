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
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
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
