# Waymo, fusión, Web3 y NVIDIA · v6

Cuatro incorporaciones en geometría editable, con el recorrido de cámara y la música existentes:

- **Waymo:** ocho robotaxis blancos circulan a 21–25 unidades por segundo en las calles existentes. Tienen ventanas oscuras, sensores en los guardabarros, plataforma de techo, domo con anillo azul y el símbolo oficial en las puertas. Sus posiciones y orientaciones forman parte de la animación GLB, igual que en el MP4. El diseño en miniatura toma como referencia el I-PACE de las [fotos oficiales de Waymo](https://waymo.com/media-resources/) y su [descripción del sistema de sensores](https://waymo.com/blog/2020/03/designing-5th-generation-waymo-driver/). Source: Waymo.
- **Fusion power:** un reactor toroidal en un patio de construcción, junto al edificio de SpaceX. Diez bobinas de cobre se instalan entre 2,9 y 4,9 segundos; una última bobina queda suspendida de un puente grúa. El cartel frontal dice FUSION POWER / COMING SOON. Es una planta ficticia, sin atribuir una fecha de operación ni promesas a una empresa real.
- **NFT/Web3:** tres coleccionables de pixel art propio caen como dominós desde 1,85 segundos, el cartel WEB3 se desploma y las fichas doradas se desparraman. Aparece CLEARANCE al final. Es una metáfora del desplome especulativo, sin cifras ni marcas de proyectos concretos.
- **NVIDIA:** un centro de cómputo de 32 unidades de ancho ocupa el lugar del antiguo edificio Yahoo, con cuatro pisos escalonados, aletas de disipación, franjas verdes, ventiladores giratorios y un ojo gigante en el techo. La palabra NVIDIA queda bajo el borde del techo para entrar completa en el encuadre final. Los pisos se ensamblan entre 3,6 y 5,1 segundos; la corona aparece entre 4,9 y 5,55 segundos. Arquitectura ficticia inspirada en un procesador; los logos sí son los [vectores oficiales](https://www.nvidia.com/en-gb/about-nvidia/legal-info/logo-brand-usage/).

Yahoo se traslada al edificio este que antes no tenía marca. Fintoc conserva su sede y terraza; se agrega un fondo marfil detrás de su logo para mantener el contraste frente a la nueva fachada oscura de NVIDIA.

## Editar

`lib/tech-era.ts` contiene los cuatro conjuntos, sus posiciones, colores, rutas y tiempos. `lib/scene-config.ts` mantiene las dimensiones iniciales. Se conservan los identificadores internos `yahoo` y `office` para abrir proyectos previos: el primero ahora corresponde a NVIDIA y el segundo a Yahoo. Al cargar una configuración vieja, solo se migran el ancho y color originales de Yahoo; los valores personalizados se respetan.

Los SVG integrados, sus fuentes exactas y hashes están en `public/assets/tech-era-logo-sources.json`. Sus coordenadas originales se preservan y se extruyen como geometría, sin texturas rasterizadas de los logos.

## Verificación

El renderizador comprueba reproducción determinista al saltar en el tiempo, restauración de la escena tras editar títulos y exportar, las diez familias de texturas PBR y las pistas de animación de los 40 actores nuevos. Se verifican también la carga de configuraciones anteriores y la conservación de modificaciones personales.
