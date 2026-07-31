# Descubrimiento de exportación desde Sandía

Fecha: 2026-07-29
Fuente pública revisada: [sandia.la](https://www.sandia.la/)

## Resultado

`INCONCLUSIVE`

El sitio público confirma que Sandía es una aplicación de finanzas personales, pero no documenta de forma verificable exportación CSV, Excel, PDF, API ni descarga de reportes. No se accedió a una cuenta autenticada y no se intentó eludir controles.

## Lo que pudo verificarse legítimamente

- Home pública accesible.
- Páginas públicas de blog y changelog sin documentación visible de exportación.
- No se encontró documentación pública de API o formato de datos.
- Los enlaces públicos inspeccionados no demuestran una función de descarga.

Esto no prueba que la función no exista dentro de una cuenta.

## Revisión manual dentro de la cuenta propia

Sin compartir contraseña ni cookies, revisar y capturar:

1. Perfil, Configuración, Privacidad y Cuenta.
2. “Exportar”, “Descargar mis datos”, “Backup” o “Portabilidad”.
3. Movimientos: menú de acciones, filtros y descarga.
4. Reportes: CSV, XLSX/Excel o PDF.
5. Cuentas y categorías: descarga separada.
6. Ayuda/soporte: procedimiento para solicitar una copia de datos propios.
7. Si existe exportación:
   - formato;
   - codificación;
   - separador decimal y de columnas;
   - zona/formato de fecha;
   - headers;
   - identificadores externos;
   - cuentas, categorías, moneda y tipo;
   - forma de representar transferencias, anulaciones y saldos iniciales.
8. Guardar una muestra pequeña, sin publicarla, para diseñar fixtures sanitizados.

## Opciones legítimas, en orden

1. Exportación incorporada CSV/XLSX.
2. Descarga oficial de reportes.
3. Solicitud de portabilidad/copia de datos al soporte.
4. Copia manual propia a una plantilla de importación.
5. PDF solo como fuente asistida y revisada; no como importación automática silenciosa.

## Opciones excluidas

- robo o reutilización de cookies;
- bypass de autenticación/CAPTCHA;
- scraping agresivo;
- endpoints privados sin autorización;
- ingeniería inversa invasiva;
- datos de terceros.

## Decisión

No implementar un parser específico de Sandía hasta obtener un archivo exportado legítimamente y validar su semántica. El importador debe comenzar genérico, con mapeo manual y preview.
