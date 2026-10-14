import { crearServidor } from './infraestructura/configuracion/servidor';
import { variablesEntorno } from './infraestructura/configuracion/variables_entorno';

const app = crearServidor();

app.listen(variablesEntorno.puerto, () => {
  console.log(`Servidor Aura-Dent escuchando en http://localhost:${variablesEntorno.puerto}`);
});
