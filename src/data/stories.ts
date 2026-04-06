// src/data/stories.ts

export interface Story {
  slug: string;
  title: string;
  date: string;
  type: "CUENTO" | "REFLEXIÓN" | "RELATO";
  readingTime: string;
  excerpt: string;
  coverColor: string; // gradient for visual variety
  body: string[]; // paragraphs
}

export const stories: Story[] = [
  {
    slug: "el-aroma-de-mi-abuela",
    title: "el aroma de mi abuela",
    date: "24 de marzo, 2026",
    type: "CUENTO",
    readingTime: "4 min",
    excerpt:
      "Hay olores que te transportan a la infancia en un segundo. Para mí, es el de la canela recién molida en la cocina de mi abuela...",
    coverColor: "from-[#5C3D2E] to-[#3D2B1F]",
    body: [
      "Hay olores que no necesitan aviso. Llegan y ya. Te atrapan por la manga y te jalan hacia atrás, hacia un lugar concreto, hacia un momento exacto que creías olvidado.",
      "Para mí, ese olor es la canela. No la que viene en frasco de vidrio con etiqueta del super, sino la que mi abuela Cuca molía en su metate de piedra oscura los domingos por la mañana, con las manos llenas de saber y sin ninguna prisa.",
      "Yo tenía quizás siete años la primera vez que le pedí que me enseñara. Ella me miró con esos ojos que veían más de lo que decían, me pasó el trozo de raja y dijo: 'Primero, huélela. Antes de cocinar cualquier cosa, primero hay que conocerla.'",
      "Esa mañana no aprendí a moler. Aprendí a detenerme.",
      "Aprendí que cocinar no es un acto de prisa sino de presencia. Que los ingredientes hablan si tú te quedas quieta el tiempo suficiente para escucharlos. Que una cocina bien habitada huele a historia.",
      "Mi abuela ya no está. Pero cuando abro una raja de canela y la acerco a la nariz, ella aparece. Entera. Con su delantal de flores y sus manos expertas y esa calma que yo todavía estoy aprendiendo a tener.",
      "A veces cocinar es solo eso: un camino para volver a alguien.",
    ],
  },
  {
    slug: "la-mesa-del-martes",
    title: "la mesa del martes",
    date: "10 de marzo, 2026",
    type: "RELATO",
    readingTime: "5 min",
    excerpt:
      "Nadie recuerda exactamente cuándo empezó. Pero todos los martes, sin falta, aparecían. La mesa se llenaba sola...",
    coverColor: "from-[#4A3728] to-[#2E1F14]",
    body: [
      "Nadie recuerda exactamente cuándo empezó. Así suelen comenzar las mejores tradiciones: sin fecha de inicio, sin anuncio, sin ceremonia. Un día simplemente ya existe y todos actúan como si siempre hubiera sido así.",
      "El martes de la mesa empezó, creo, el invierno en que mi prima Valentina se separó. Ella llegó un martes a la una de la tarde con una bolsa enorme de chiles anchos y cara de quien necesita ocupar las manos. Yo tenía jitomates asándose y arroz en la olla. No hicieron falta palabras. Cocinamos juntas tres horas y comimos en silencio, pero bien.",
      "El martes siguiente llegó ella otra vez. Y trajo a su amiga Sofía. Y Sofía trajo pan dulce y una historia sobre su jefe que nos hizo reír hasta que se nos soltaron lágrimas de otro tipo.",
      "La mesa fue creciendo despacio. Nunca hubo invitaciones formales. Solo el rumor suave de que los martes se cocinaba en mi casa y que cualquiera que quisiera podía aparecer con algo o con nada.",
      "Aprendí más de cocina en esos martes que en cualquier recetario. Aprendí que el caldo de pollo sabe distinto cuando te lo cuentan mientras lo preparas. Que las tortillas a mano son un ritual, no una tarea. Que hay mucho que una olla compartida puede sanar.",
      "La mesa del martes sigue. Cambian las caras, cambian los platillos. Pero la regla es la misma: se viene con hambre, con ganas de escuchar y con algo que contar.",
      "Eso, creo, es lo que más me ha enseñado la cocina. Que no alimentamos solo cuerpos. Alimentamos la necesidad de pertenencia. Y eso no caduca nunca.",
    ],
  },
  {
    slug: "cuando-aprendi-a-dejar-quemar",
    title: "cuando aprendí a dejar quemar",
    date: "28 de febrero, 2026",
    type: "REFLEXIÓN",
    readingTime: "3 min",
    excerpt:
      "La primera vez que preparé un mole lo arruiné completamente. El chile se quemó, la cocina se llenó de humo y yo me senté en el piso a llorar...",
    coverColor: "from-[#6B4423] to-[#3D2B1F]",
    body: [
      "La primera vez que preparé un mole lo arruiné completamente.",
      "El chile se quemó —no un poco, sino con esa amargura definitiva que ya no tiene remedio—, la cocina se llenó de humo, y yo me senté en el piso con la cuchara en la mano y lloré. No solo por el mole. Por todo lo que ese fracaso representaba: el intento de reprodure algo de mi madre, de mi abuela, de una tradición que sentía que se me escapaba de las manos.",
      "Llamé a mi mamá. Le dije que el chile se había quemado. Hubo una pausa larga y luego una carcajada. 'Mija, a mí se me quemó el primero, el segundo y probablemente el tercero también. El mole no perdona a las que tienen prisa.'",
      "Esa noche no comí mole. Comí arroz con huevo y me fui a dormir con la promesa de intentarlo otra vez.",
      "Lo que aprendí no fue a no quemar el chile. Lo que aprendí fue que el fracaso en la cocina —como en la vida— no es un fin. Es una nota al margen que dice: aquí faltó paciencia, aquí faltó atención, aquí faltó respeto al proceso.",
      "El mole tardó tres intentos más. Cuando por fin quedó bien, no sentí orgullo de cocinera. Sentí algo más sosegado: el alivio de no haberme rendido en el piso.",
      "La cocina me ha enseñado eso más que ningún otro lugar: que las cosas que valen la pena requieren que te equivoques en serio antes de acertar.",
    ],
  },
  {
    slug: "mercado-de-san-juan",
    title: "el mercado que me cambió la forma de comprar",
    date: "14 de febrero, 2026",
    type: "RELATO",
    readingTime: "4 min",
    excerpt:
      "Entré al Mercado de San Juan por primera vez buscando queso manchego. Salí dos horas después con jamón ibérico, huitlacoche y una lección sobre la diferencia entre comprar y elegir...",
    coverColor: "from-[#3D2B1F] to-[#5C3D2E]",
    body: [
      "Entré al Mercado de San Juan por primera vez buscando queso manchego. Salí dos horas después con jamón ibérico, huitlacoche en temporada, tres tipos de aceitunas y una conversación sobre el origen del azafrán que no pedí pero que no cambiaría por nada.",
      "No encontré el manchego hasta que pregunté. Y cuando pregunté, el señor del puesto me preguntó de vuelta para qué lo quería. Le dije que para unas quesadillas. Me miró con esa paciencia amable de quien sabe más que tú y me dijo: 'Para eso mejor llévate el Chihuahua, funde mejor y tiene más carácter. El manchego guárdalo para cuando quieras comerlo solo, con una uva.'",
      "Nunca nadie en un supermercado me había dicho algo así.",
      "Esa mañana entendí la diferencia entre comprar y elegir. En el supermercado compras: tomas lo que hay, pones en el carrito, pagas. En el mercado eliges: el vendedor se convierte en cómplice, te orienta, te cuenta de dónde viene cada cosa, te pregunta qué vas a cocinar.",
      "Desde ese día cambié mi manera de abastecerme. No siempre se puede, no siempre hay tiempo, no siempre hay mercado cerca. Pero cuando puedo, eligo el lugar donde alguien sabe el nombre del rancho del que viene el queso.",
      "Porque eso también es cocinar bien: saber de dónde viene lo que pones en la mesa. Respetar el camino que recorrió cada ingrediente para llegar a tu olla.",
      "Y de vez en cuando, dejarse llevar por el huitlacoche en temporada aunque no fuera parte del plan.",
    ],
  },
  {
    slug: "espacio-y-sabor",
    title: "diseño una cocina como diseño un plato",
    date: "01 de febrero, 2026",
    type: "REFLEXIÓN",
    readingTime: "3 min",
    excerpt:
      "Llevo años diseñando espacios y años cocinando. Un día me di cuenta de que uso exactamente el mismo proceso para las dos cosas...",
    coverColor: "from-[#2E1F14] to-[#4A3728]",
    body: [
      "Llevo años diseñando espacios y años cocinando. Durante mucho tiempo los traté como mundos separados: el trabajo y el placer, la razón y el instinto.",
      "Un día —mientras ajustaba la distribución de una cocina en un proyecto y pensaba al mismo tiempo en cómo reequilibrar los sabores de un caldo— me di cuenta de que estaba usando exactamente el mismo proceso mental para las dos cosas.",
      "En arquitectura de interiores, todo parte de entender cómo se va a habitar el espacio. ¿Quién lo usa? ¿A qué horas? ¿Qué necesita sentir quien esté ahí? A partir de eso, cada decisión —materiales, luz, proporciones— tiene una razón que va más allá de lo visual.",
      "En la cocina pasa igual. Un buen plato no es solo una suma de ingredientes. Es una decisión sobre qué sensación quieres provocar. ¿Calor o frescura? ¿Contraste o armonía? ¿Algo familiar o algo que sorprende?",
      "El diseño y la cocina comparten una obsesión: el detalle que nadie nombra pero todos sienten. La junta de mosaico que hace que una pared se vea artesanal. La pizca de comino al final que hace que una sopa sepa a más.",
      "Desde que lo entendí así, dejé de separarlos. Mi forma de cocinar se volvió más consciente, más intencional. Y mi forma de diseñar se volvió más cálida, más habitada.",
      "Al final, lo que busco en los dos mundos es lo mismo: crear un lugar al que quieras volver.",
    ],
  },
];

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((s) => s.slug === slug);
}
