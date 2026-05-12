# INFORME.md — [Tu nombre]

> Completa este documento para cada bug encontrado.
> Una explicacion honesta y razonada vale mas que una correccion sin justificacion.


el nuevo repositorio github es:
https://github.com/moiznet/portal-contable
---

## REP-01

**Archivo y linea:**  

backend/src/auth/auth.service.ts:19 

**Descripcion del problema:**

*El login y la autenticacion no constanta contra la db solo hay un comentario que dice:
    "// Validacion simulada — en produccion seria contra la DB"

*solo esta quemado email !== 'admin@daem.es' || password !== 'test1234' y arroja un exception de error.

*No es claro que hash uso para el password

**Impacto:**
No funciona el login , no compara en la bd al intentar loguearse, no regresa barrer token para comprobacion de usuario activo 

**Correccion aplicada:**
    1. crear el loging que regrese el access_token.
        instale el  bcrypt para el hash aunque no dice cual es creo que bcrypt pero no sirve el hasque estaba no estaba completo asi que use bcrypt y guarde una nueva hash para  {
        "email": "admin@daem.es",
        "password": "test1234"
        }
        como: $2b$10$TYyjvbiOAINNqYwBDUgPyO2KcFA3zCAGSzLWHrrXNqNH7eAqwUILq
        ahora regresa un token valido con el cual se puede consultar las empresas en [/empresas](http://localhost:3000/empresas)


**Commit:**

commit: login con bcrypt funcionando y configuracion de gitignore

---

## REP-02

**Archivo y linea:**

backend/src/auth/auth.service.ts:56

**Descripcion del problema:**

Los tokens expirados o invalidos no son rechazados. 
Puedo acceder con cualquier token.



Es por que la firma (Donde genera el Token)
El error es cómo creas el token en el AuthService. hay que Revisa que tenga el expiresIn:

**Impacto:**
El impacto de no tener un expiresIn es crítico, especialmente en un entorno de producción. Si omites esa configuración, el token se genera sin fecha de caducidad (técnicamente, por defecto en la mayoría de configuraciones, el token podría durar para siempre o hasta que el servidor se reinicie si el secreto cambia).

Aquí te detallo los riesgos principales:

1. El Riesgo de Seguridad (Secuestro de Sesión)
Si un atacante logra obtener un token (por ejemplo, a través de un log, un descuido en el navegador o un ataque Man-in-the-Middle), ese token será válido permanentemente.

Con expiración: El atacante tiene una ventana de tiempo corta (ej. 1 hora) para actuar.

Sin expiración: El atacante tiene acceso de por vida a la cuenta del usuario, a menos que tú cambies el JWT_SECRET del servidor (lo que desconectaría a todos los usuarios del sistema).

**Correccion aplicada:**
    se agrego los siguientes parametros a la firma expiresIn que cuadra el tiempo de caducidad del token en este caso lo puse de una hora, tambien especifique donde esta la palabra secreta para ser cambiada en caso de seguridad.
    { 
      expiresIn: '1h', // Verifica que esto sea corto (1h, 30m, etc.)
      secret: process.env.JWT_SECRET 
       }

**Commit:**

security: implementar validacion de expiracion en JwtGuard y definir expiresIn

## REP-03

**Archivo y linea:**

/frontend

**Descripcion del problema:**

    al parecer es un cambio de color en un contenedor en el frontend, pero como faltan los archivos 
    
    frontend/index.html
    frontend/src/main.tsx
    frontend/src/App.tsx

    Esos son los archivos básicos necesarios para que Vite/React arranque y use ReactDOM para renderizar la app.

    y necesitaria un diseño o explicacion de cual es la visual o diseño requerido pues no se puede deducir con lo que hay

**Impacto:**

    Sin frontend/index.html no hay página HTML que Vite sirva, así que el navegador no carga nada.

    Sin frontend/src/main.tsx no hay entry point que importe React/ReactDOM y monte la aplicación.

    Sin frontend/src/App.tsx no hay componente raíz para renderizar la UI.

    Resultado: el frontend no arranca, el build de Vite falla y http://localhost:5173 no mostrará la aplicación.

**Correccion aplicada:**


    solicitar el frontend completo con los archivos completos, o solicitar el diseño o lo que se desea en el requerimiento por que es imposible adivinar

**Commit:**

---

## REP-04

**Archivo y linea:**

    /frontend

**Descripcion del problema:**

    Cuando hay un error al cargar las empresas, la pantalla queda en blanco sin ningun mensaje.

    pero como faltan los archivos 
    
    frontend/index.html
    frontend/src/main.tsx
    frontend/src/App.tsx

    Esos son los archivos básicos necesarios para que Vite/React arranque y use ReactDOM para renderizar la app.

    y necesitaria un diseño o explicacion de cual es la visual o diseño requerido pues no se puede deducir con lo que hay



**Impacto:**

    Sin frontend/index.html no hay página HTML que Vite sirva, así que el navegador no carga nada.

    Sin frontend/src/main.tsx no hay entry point que importe React/ReactDOM y monte la aplicación.

    Sin frontend/src/App.tsx no hay componente raíz para renderizar la UI.

    Resultado: el frontend no arranca, el build de Vite falla y http://localhost:5173 no mostrará la aplicación.

**Correccion aplicada:**

**Commit:**

---

## REP-05

**Archivo y linea:**

\backend\src\empresas\empresas.service.ts:19
\backend\src\empresas\empresas.service.ts:21
\backend\src\empresas\empresas.controller.ts:25
\backend\src\empresas\empresas.controller.ts:27
\backend\src\empresas\empresas.controller.ts:28

**Descripcion del problema:**

el endpoint de empresas es muy lento cuando hay muchas. El equipo tecnico sospecha que hay un problema de rendimiento en la query.

1. se esta realizando un filtro de empresas activas despues de la consulta de empresas, por consiguiente se esta demorando la consulta por que se vuelve a iterar todas las empresas para cumplir el filtro.

2.hace falta un paginador que traiga por paginas todas las empresas para que sea mas eficiente la carga

**Impacto:**

El impacto de tener la consulta como estaba antes era:

Se traía toda la tabla a memoria: La query SELECT ... FROM empresas ORDER BY nombre sin WHERE traía todas las empresas, incluyendo las inactivas.

Transferencia innecesaria de datos: Se enviaban miles de registros desde PostgreSQL al backend a través de la red, aunque luego se descartaban.

Filtrado en memoria ineficiente: Después de recibir todos los datos, Node.js hacía .filter(e => e.activa === true) en RAM, usando CPU y memoria del backend.

Escalabilidad terrible: Con 10,000 empresas:

Si 8,000 eran inactivas, igual se cargaban todas
El endpoint tardaba mucho más
Consumía mucha RAM
Si muchos usuarios lo llamaban simultáneamente, el servidor se saturaba
No aprovecha el motor SQL: PostgreSQL es muy optimizado para filtrar, pero el código lo hacía después de que los datos salieran de la BD.

Impacto adicional de no tener paginación
Sin paginación, cada llamada devuelve todos los registros activos de empresas.
Si hay muchas empresas, la respuesta puede ser enorme y lenta de generar.
Aumenta el uso de memoria en el backend y el tamaño de la carga en la red.
La UI recibe demasiados datos y puede tardar en renderizar o quedarse lenta.
Si muchos usuarios consultan al mismo tiempo, el servidor se sobrecarga más rápido.

**Correccion aplicada:**

En empresas.service.ts se agregó WHERE activa = true a la query de findAll().
Se eliminó el filtro en memoria .filter(e => e.activa === true) para que la BD haga el filtrado.
También se añadió paginación en la misma query con LIMIT $1 OFFSET $2, pasando [pageSize, offset].
Eso hace que la base de datos devuelva solo empresas activas y evita cargar toda la tabla en el backend.


AHORA SE CONSULTA ASI AL ENDPOINT:
http://localhost:3000/empresas?page=1&pageSize=20

(CON LOS PARAMETROS DE PAGINACION)

**Commit:**

perf: optimizar consulta de empresas con filtrado SQL y paginacion


---

## REP-06

**Archivo y linea:**

\backend\src\empresas\empresas.controller.ts:36

**Descripcion del problema:**

Revisando los logs, vemos que cuando falla el endpoint de empresas se expone el stack trace completo en la respuesta.

Es  porque en EmpresasController.findAll() se captura el error y se vuelve a lanzar un HttpException incluyendo error.stack en el campo detail.

**Impacto:**

Fuga de información sensible: el stack trace puede revelar rutas de archivos, nombres de funciones, librerías y estructura interna del servidor.
Facilita ataques: un atacante puede usar esos detalles para encontrar vulnerabilidades específicas, como puntos de inyección o rutas privadas.
Mala experiencia de usuario: el cliente recibe un error técnico no amigable en vez de un mensaje claro y seguro.
Incumple seguridad y buenas prácticas: las APIs no deben entregar detalles internos del servidor al cliente.

**Correccion aplicada:**

En EmpresasController.findAll() quitar el error.stack de la respuesta al cliente y dejar solo un mensaje genérico. como message: 'Error al obtener empresas'

ambién es buena idea:

mantener el stack trace solo en logs del servidor
no devolver detail: error.stack
usar HttpException solo para mensajes seguros al cliente

**Commit:**

security: ocultar stack trace en respuestas de error de empresas

---

## REP-07

**Archivo y linea:**

**Descripcion del problema:**

Hay un problema de seguridad en el login. El payload del token contiene informacion sensible.

En el payload que recibia la firma para generar el token llebab el password como propiedad

**Impacto:**

El JWT es legible para cualquiera: El contenido de un token no está cifrado, solo codificado (Base64). Cualquier persona con acceso al token (un atacante o incluso el usuario desde el navegador) puede ver el password con herramientas como jwt.io en un segundo.

Exposición al cracking offline: Si el atacante obtiene el hash, puede intentar descifrar la contraseña en su propia computadora usando fuerza bruta, sin que tu servidor detecte múltiples intentos de login.

Robo de identidad en otros sitios: Como mucha gente repite contraseñas, si el atacante obtiene la clave de tu sistema, automáticamente tiene acceso a las otras cuentas del usuario (correo, redes sociales, etc.).

**Correccion aplicada:**

se elimino la propiedad del payload y se cambio por el rol el rol si puede ir en el payload del JW

**Commit:**

se hizo en el primer commit
---

## Hallazgos propios (opcional)

<!-- Si encontraste bugs adicionales no listados en los reportes, documentalos aqui -->

### Hallazgo 1

**Archivo y linea:**

**Descripcion:**

**Correccion:**

---

## Reflexion final
el github es:
https://github.com/moiznet/portal-contable

**Que cambiarias si tuvieras mas tiempo:**

Haria de nuevo el front end desde 0 , despendiendo las necesidades del cliente.

haria de nuevo el frontend en react ya que faltan los archivos mas importantes por los cuales no se ejecuta el react

**Que regla del estandar de codigo fue mas dificil de cumplir y por que:**

el typado siempre es lo mas 

**Alguna decision tecnica que tomaste y quieras explicar:**

si decidi generar el hash del password de la base de datos por que el que estaba comenzaba como un bcrypt pero no tenia una longitud de 60  caracteres como es lo habitual tampoco era hash256 por que ese solo contiene numero y letras


el nuevo repositorio github es:
https://github.com/moiznet/portal-contable