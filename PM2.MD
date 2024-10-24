# Comandos Básicos de PM2

Iniciar una aplicación:
```
pm2 start nombre_del_script.js
```
Listar aplicaciones:
```
pm2 list
```
Ver el estado de una aplicación específica:
```
pm2 status nombre_o_id
```
Reiniciar una aplicación:
```
pm2 restart nombre_o_id
```
Detener una aplicación:
```
pm2 stop nombre_o_id
```
Eliminar una aplicación:
```
pm2 delete nombre_o_id
```
Guardar la configuración actual de procesos:
```
pm2 save
```
Cargar la configuración guardada:
```
pm2 resurrect
```
Monitorear el rendimiento de las aplicaciones:
```
pm2 monit
```
-----------------------------------
# Comandos Avanzados

Hacer un pull y reiniciar:
```
pm2 reload nombre_o_id
```
Ver los logs de una aplicación:
```
pm2 logs nombre_o_id
```
Ver los logs de error:
```
pm2 logs nombre_o_id --err
```
Ver los logs de salida:
```
pm2 logs nombre_o_id --out
```
Configurar el arranque al iniciar el sistema:
```
pm2 startup
```
Eliminar el script de inicio:
```
pm2 unstartup
```
Exportar la configuración de PM2:
```
pm2 ecosystem
```
----------------------------
# Otras opciones
Actualizar PM2:
```
pm2 update
```
Comprobar la versión de PM2:
```
pm2 -v
```
