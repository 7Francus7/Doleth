# QA manual de PWA para Doleth V1

## Objetivo

Validar en Chrome estable que el candidato V1 se instala, protege la información
financiera, ofrece un offline honesto y actualiza el service worker sin perder
trabajo del usuario.

Esta prueba no autoriza integrar, desplegar a Production ni enviar formularios
financieros.

## Requisitos previos

- [ ] Usar Chrome estable, sin extensiones que alteren cache, red o cookies.
- [ ] Usar un perfil de Chrome dedicado a QA.
- [ ] Usar un Preview autorizado del SHA candidato.
- [ ] Confirmar que Preview está protegido por Vercel Authentication.
- [ ] Confirmar que la base del Preview es de QA y no Production.
- [ ] Usar datos ficticios sin información financiera real.
- [ ] No enviar formularios de cuentas, movimientos, pagos o inversiones.
- [ ] Mantener abierta la pestaña Console durante toda la ejecución.
- [ ] Activar `Preserve log` en Console y Network.
- [ ] Guardar evidencia sin cookies, contraseñas, tokens ni datos financieros.

Si la base, SHA u origen no pueden confirmarse, detener la ejecución.

## Datos de ejecución

| Campo | Valor |
|---|---|
| Fecha | |
| Persona | |
| Chrome version | |
| Sistema operativo | |
| Preview URL u origen QA estable | |
| Deployment ID | |
| SHA | |
| Vercel Authentication | |
| Base de datos QA confirmada | Sí / No |
| Hora de inicio | |
| Hora de cierre | |

## Registro de evidencia

| ID | Sección | Evidencia segura | Resultado |
|---|---|---|---|
| E-01 | Installability | | PASS / FAIL |
| E-02 | Offline real | | PASS / FAIL |
| E-03 | Cache Storage | | PASS / FAIL |
| E-04 | Update flow | | PASS / FAIL |
| E-05 | Logout y bfcache | | PASS / FAIL |
| E-06 | Consola | | PASS / FAIL |

No capturar pantallas que muestren importes, nombres de cuentas o credenciales.

## 1. Installability

### Pasos

1. [ ] Abrir el Preview autorizado.
2. [ ] Completar Vercel Authentication.
3. [ ] Iniciar sesión en Doleth con la credencial de QA.
4. [ ] Abrir DevTools → Application → Manifest.
5. [ ] Confirmar que Chrome no muestra errores de manifest ni de iconos.
6. [ ] Confirmar:
   - [ ] `name`: `Doleth`;
   - [ ] `short_name`: `Doleth`;
   - [ ] `display`: `standalone`;
   - [ ] `scope`: `/`;
   - [ ] `start_url`: `/ahora`;
   - [ ] idioma `es-AR`;
   - [ ] iconos PNG de 192×192 y 512×512;
   - [ ] icono maskable de 512×512.
7. [ ] Confirmar que DevTools ofrece instalación o que Chrome muestra el control
   de instalación.
8. [ ] Instalar la aplicación.
9. [ ] Cerrar la pestaña de navegador original.
10. [ ] Abrir Doleth desde el acceso de la aplicación instalada.
11. [ ] Confirmar que se abre sin barra de navegación normal de Chrome.
12. [ ] Confirmar `display-mode: standalone` en DevTools o con:

    ```js
    window.matchMedia("(display-mode: standalone)").matches
    ```

13. [ ] Confirmar que inicia en `/ahora`.
14. [ ] Recorrer sin escrituras:
    - [ ] `/ahora`;
    - [ ] `/movimientos`;
    - [ ] `/proximo`;
    - [ ] `/cambios`;
    - [ ] `/progreso`;
    - [ ] `/mi-realidad`;
    - [ ] `/actuar`;
    - [ ] `/cuentas`;
    - [ ] `/inversiones`.
15. [ ] Confirmar nombre e icono correctos en ventana, launcher y selector de
    aplicaciones.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## 2. Offline real

### Pasos

1. [ ] Con la PWA abierta y online, ir a DevTools → Application → Service
   Workers.
2. [ ] Confirmar:
   - [ ] service worker activado;
   - [ ] estado `activated and is running`;
   - [ ] scope `/`;
   - [ ] página controlada por el worker.
3. [ ] Abrir DevTools → Network y seleccionar `Offline`.
4. [ ] Refrescar una ruta privada.
5. [ ] Confirmar la pantalla `Estás sin conexión`.
6. [ ] Confirmar que la pantalla explica que Doleth no guarda páginas
   financieras offline.
7. [ ] Confirmar ausencia de:
   - [ ] importes;
   - [ ] nombres o saldos de cuentas;
   - [ ] movimientos;
   - [ ] pagos;
   - [ ] inversiones;
   - [ ] exportaciones;
   - [ ] datos de sesión.
8. [ ] Intentar navegar a `/ahora`, `/movimientos` y `/proximo`.
9. [ ] Confirmar que todas las navegaciones fallidas muestran el mismo fallback
   honesto y no una copia antigua.
10. [ ] Confirmar que no aparece ninguna acción capaz de guardar datos offline.
11. [ ] Volver Network a `No throttling`.
12. [ ] Elegir `Reintentar`.
13. [ ] Confirmar recuperación de `/ahora` con información actual.
14. [ ] Confirmar que el banner offline desaparece.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## 3. Cache Storage

### Estado esperado

El worker actual usa el cache `doleth-shell-v1`. Puede contener:

- `/offline.html`;
- `/brand/doleth-mark.svg`;
- iconos de aplicación 192 y 512;
- assets solicitados bajo `/brand/`;
- assets solicitados bajo `/_next/static/`.

### Pasos

1. [ ] Abrir DevTools → Application → Cache Storage.
2. [ ] Registrar el nombre exacto del cache:

    ```text
    ________________________________________________
    ```

3. [ ] Abrir cada entrada y confirmar que pertenece al offline shell, marca o
   assets estáticos.
4. [ ] Confirmar ausencia de HTML o respuestas para:
   - [ ] `/ahora`;
   - [ ] `/movimientos`;
   - [ ] `/proximo`;
   - [ ] `/cuentas`;
   - [ ] `/inversiones`;
   - [ ] `/mi-realidad`;
   - [ ] `/api/`;
   - [ ] exportaciones;
   - [ ] JSON financiero;
   - [ ] Server Actions;
   - [ ] requests `POST`.
5. [ ] Buscar nombres de rutas privadas dentro de las claves del cache.
6. [ ] Inspeccionar el body de `/offline.html` y confirmar que no contiene
   datos financieros.
7. [ ] Confirmar que Cookies, IndexedDB y Cache Storage no contienen una copia
   de respuestas financieras creada por el service worker.

No eliminar caches todavía si se ejecutará la prueba de actualización.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## 4. Actualización del service worker

### Preparación de versiones

El update de un service worker sólo puede probarse dentro del mismo origen y
scope. Dos URLs distintas de Vercel Preview son orígenes distintos y no sirven
por sí solas para esta prueba.

Usar una de estas opciones:

- un dominio QA estable que apunte primero a A y después a B;
- un único origen local donde se ejecuten secuencialmente dos builds
  productivos controlados.

La versión B sólo puede cambiar:

- el identificador de versión del service worker; o
- un asset inocuo y verificable.

No cambiar lógica financiera, esquema, variables, datos ni formularios.

| Campo | Versión A | Versión B |
|---|---|---|
| Origen compartido | | |
| Deployment/build | | |
| SHA | | |
| Versión del cache | | |
| Diff inocuo revisado por | | |

### Pasos

1. [ ] Servir la versión A en el origen QA estable.
2. [ ] Abrir `/movimientos/nuevo`.
3. [ ] Escribir datos ficticios suficientes para crear un borrador.
4. [ ] No guardar ni enviar el formulario.
5. [ ] Publicar o activar la versión B sobre el mismo origen.
6. [ ] En DevTools → Application → Service Workers, elegir `Update` si Chrome
   todavía no detectó B.
7. [ ] Confirmar que B queda `installed` y `waiting`.
8. [ ] Mientras la ruta de formulario siga abierta, confirmar que Doleth no
   muestra el aviso de actualización ni recarga automáticamente.
9. [ ] Navegar de forma controlada a `/ahora`, sin guardar.
10. [ ] Confirmar el aviso `Hay una versión nueva`.
11. [ ] Elegir `Más tarde`.
12. [ ] Confirmar que la página no recarga.
13. [ ] Volver al formulario y confirmar que Doleth informa que existe un
    movimiento sin guardar.
14. [ ] Restaurar el borrador y confirmar que los campos ficticios siguen
    intactos.
15. [ ] Volver a una ruta que no sea formulario y volver a solicitar/detectar
    B si el aviso fue descartado para esa sesión.
16. [ ] Elegir la acción inmediata `Actualizar`.
17. [ ] Confirmar una sola recarga después de `controllerchange`.
18. [ ] Volver al formulario.
19. [ ] Confirmar el aviso de borrador y restaurarlo.
20. [ ] Confirmar que el contenido ficticio reaparece completo.
21. [ ] En DevTools, confirmar que el controller activo corresponde a B.
22. [ ] En Cache Storage, confirmar que el cache de A fue eliminado y sólo
    queda la versión vigente.
23. [ ] Refrescar dos veces y confirmar ausencia de:
    - [ ] loop de instalación;
    - [ ] loop de recarga;
    - [ ] aviso repetido sin una nueva versión;
    - [ ] pérdida del borrador.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## 5. Logout, Back y bfcache

### Pasos

1. [ ] Iniciar sesión con la credencial de QA.
2. [ ] Abrir `/ahora`.
3. [ ] Confirmar en Network que la respuesta usa `private, no-store`.
4. [ ] Abrir el menú `Más`.
5. [ ] Elegir `Cerrar sesión`.
6. [ ] Confirmar llegada a `/ingresar`.
7. [ ] Usar el botón Atrás de Chrome.
8. [ ] Confirmar que no aparece contenido privado utilizable.
9. [ ] Si Chrome muestra una imagen transitoria, confirmar que desaparece sin
   permitir interacción y registrar el caso como defecto.
10. [ ] Refrescar.
11. [ ] Confirmar que permanece o vuelve a `/ingresar`.
12. [ ] Escribir directamente `/ahora` en la barra.
13. [ ] Confirmar redirección a `/ingresar`.
14. [ ] Repetir con `/movimientos` y `/cuentas`.
15. [ ] Confirmar que ninguna respuesta privada queda disponible desde Cache
   Storage.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## 6. Consola y red

Mantener esta sección activa durante todas las pruebas.

### Confirmaciones

- [ ] 0 errores React.
- [ ] 0 errores de hidratación.
- [ ] 0 violaciones CSP.
- [ ] 0 errores al registrar o activar el service worker.
- [ ] 0 loops de actualización.
- [ ] 0 assets con 404.
- [ ] 0 requests 5xx.
- [ ] 0 requests financieros mutantes no planificados.
- [ ] 0 cookies, tokens o contraseñas en Console.
- [ ] 0 importes, nombres de cuentas o payloads financieros en Console.
- [ ] 0 respuestas privadas servidas desde el cache del service worker.

### Resultado

- Resultado: `PASS` / `FAIL`
- Evidencia:
- Observaciones:

## Registro de defectos

| ID | Severidad | Paso | Resultado observado | Resultado esperado | Evidencia |
|---|---|---|---|---|---|
| | Bloqueante / Alta / Media / Baja | | | | |

Un defecto es bloqueante para V1 si:

- expone información financiera offline o después de logout;
- permite una escritura sin intención;
- pierde un borrador durante el update flow;
- produce un loop de actualización;
- impide instalar o abrir la PWA;
- usa un SHA, base u origen distinto del autorizado.

## Resultado final

| Sección | Resultado |
|---|---|
| Installability | PASS / FAIL |
| Offline real | PASS / FAIL |
| Cache Storage | PASS / FAIL |
| Actualización del service worker | PASS / FAIL |
| Logout, Back y bfcache | PASS / FAIL |
| Consola y red | PASS / FAIL |

### Veredicto manual

```text
PWA_V1_MANUAL_PASS
PWA_V1_MANUAL_FAIL
```

Seleccionar una sola opción:

```text
_______________________________________________
```

Firma de la persona:

```text
_______________________________________________
```

## Después de la prueba

Si todo pasa:

1. Completar evidencias y resultados.
2. Actualizar el freeze a `V1_READY`.
3. Revisar que C7 siga íntegro.
4. Integrar sólo con autorización explícita.
5. Solicitar autorización independiente para Production.

Si aparece un defecto:

1. No actualizar el freeze.
2. No integrar.
3. Registrar pasos y evidencia segura.
4. Corregir únicamente el defecto observado.
5. Repetir la sección afectada y cualquier flujo relacionado.
