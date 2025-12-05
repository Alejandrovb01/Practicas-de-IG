# Semana 8: Visualización de datos geográficos

[Proyecto interactivo en codesandbox](https://codesandbox.io/p/sandbox/5d6gp5).

[Vídeo demostrativo](https://youtu.be/3yp_Mevbf9U).

## Descripción del proyecto

Este proyecto permite visualizar la colonización de América desde 1492 (llegada de Colón) hasta 1775 (poco antes de la Revolución Americana) en un mapa con relieve. En el mapa, con el paso de los años, se dibujan polígonos que representan los territorios colonizados, de distintos colores según la potencia europea que los controló.
Una leyenda en la esquina inferior izquierda muestra el color de cada potencia, y un título arriba en el centro muestra qué territorio, potencia y fecha se está representando.

## Controles de la simulación

El mapa puede ser manipulado con el ratón para rotarlo (clic izquierdo), trasladarlo (clic derecho) y aumentarlo (rueda), mejorando así su visualización.

## Datos de la simulación

Los datos son leídos de un documento CSV que contiene los siguientes campos:
- year: año en que se ocupó el territorio.
- region: nombre del territorio ocupado.
- empire: potencia que ocupó el territorio en ese año.
- polygon: una serie de coordenadas que definen los vértices del polígono que representa la región conquistada. El formato de las coordenadas es latitud:longitud (usando ':' como separador).

## Bibliografía

El mapa de elevación se ha obtenido de la siguiente página:
- [Unreal PNG Heightmap](https://manticorp.github.io/unrealheightmap/#latitude/20.961439614096832/longitude/-97.03125/zoom/3/outputzoom/4/width/1639/height/2100)

Con las coordenadas obtenidas en la página anterior, se ha podido obtener el mapa visual de esta otra página:
- [geojson.io](https://geojson.io/#map=2.03/21.02/-105.95)

El dataset CSV fue generado con inteligencia artificial, lo que permitió incluir en él los eventos de la conquista más relevantes y las coordenadas geográficas con las que dibujar los polígonos.

Para la realización del código se ha recurrido, principalmente, a los ejemplos incluidos en el enunciado de la práctica. Además, se han empleado herramientas de inteligencia artificial para descubrir funciones nuevas, como la creación de polígonos, así como para agilizar la creación de animaciones.
