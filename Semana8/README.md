# Semana 8: Animación

[Proyecto interactivo en codesandbox](https://z8nrm8.csb.app/).

[Vídeo demostrativo](https://youtu.be/p4-5je-ap8c).

## Descripción del proyecto

Este proyecto hace posible una simulación del deporte olímpico del tiro al plato. En ella, se generan platos aleatorios que avanzan describiendo una trayectoria parabólica. El objetivo es que el jugador dispare a los platos (y los rompa) antes de que estos toquen el suelo, en cuyo caso también se romperán.

## Aspectos técnicos

La simulación está desarrollada con Three.js para la parte gráfica y Ammo.js como motor físico. La escena incluye una cámara en perspectiva con controles de órbita, un plano como suelo y un sistema de luces con sombras. Cada plato se modela como un cilindro con cuerpo rígido en Ammo al que se le asigna una posición inicial aleatoria en el eje x, y unas posiciones fijas en los ejes z e y. Además, estos poseen una velocidad en los ejes x e y que genera una trayectoria parabólica bajo la gravedad.
Las balas se crean como esferas rápidas, usando detección continua de colisiones (CCD) para evitar que atraviesen los platos.

En cada frame se avanza la simulación física y se actualizan las transformaciones de los objetos Three.js. Cuando se detecta un impacto con suficiente impulso sobre un plato, este se elimina y se sustituye por varios fragmentos poligonales, cada uno con su propio cuerpo rígido y una pequeña velocidad adicional para simular el efecto de rotura.

## Controles de la simulación

Al pulsar tanto el clic derecho como el izquierdo del ratón, se puede disparar una bala. Si se mantiene el clic izquierdo, es posible rotar la escena. Por otra parte, al mantener el clic derecho es posible desplazarla. La rueda del ratón permite realizar un efecto de zoom.
Finalmente, al pulsar la tecla "espacio" se generará un nuevo plato. Todos ellos parten de la misma coordenada 'z'; sin embargo, se generan con una coordenada 'x' aleatoria, de forma que su posición sea impredecible para el jugador.

## Bibliografía

Para la realización del código se ha recurrido, principalmente, a los ejemplos incluidos en el enunciado de la práctica. Además, se han empleado herramientas de inteligencia artificial para descubrir funciones nuevas, como la fragmentación de polígonos.
