// Punto de entrada de Storybook y tests para /mi-realidad/cierre.
//
// Los fixtures viven acá y NO en `index.ts`: un barrel productivo que reexporta
// fixtures los arrastra a la ruta por transitividad, y datos ficticios en una
// pantalla que habla de dinero real son una mentira lista para desplegarse.
// Ninguna ruta de `src/app` debe importar este archivo.

export * from "./fixtures";
