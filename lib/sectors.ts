export interface Sector {
  id: string
  emoji: string
  label: string
  heroVariants: Array<{
    line1: string
    line2: string
    line3: string
    subtitle: string
    ctaPrimary: string
    productsTag: string
    productsTitle: string
    aboutTag: string
  }>
}

export const SECTORS: Sector[] = [
  {
    id: 'restaurante',
    emoji: '🍽️',
    label: 'Restaurante / Comida preparada',
    heroVariants: [
      { line1: 'El sabor que', line2: 'te hace volver', line3: 'cada día', subtitle: 'Comida casera hecha con amor, lista para disfrutar.', ctaPrimary: 'Pedir ahora', productsTag: 'Nuestro menú', productsTitle: 'Platos que enamoran', aboutTag: 'Nuestra cocina' },
      { line1: 'Donde cada plato', line2: 'cuenta una historia', line3: 'de sabor real', subtitle: 'Ingredientes frescos, recetas auténticas, sabor inigualable.', ctaPrimary: 'Ver el menú', productsTag: 'Lo que cocinamos', productsTitle: 'Especialidades del día', aboutTag: 'Nuestra historia' },
      { line1: 'La mesa que', line2: 'todos buscan', line3: 'en la ciudad', subtitle: 'Sabores que hacen feliz a tu familia.', ctaPrimary: 'Reservar mesa', productsTag: 'Menú del día', productsTitle: 'Nuestras delicias', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'alitas_pollo',
    emoji: '🍗',
    label: 'Alitas / Pollo / Fast food',
    heroVariants: [
      { line1: 'Las alitas que', line2: 'todos piden', line3: 'a domicilio hoy', subtitle: 'Crujientes por fuera, jugosas por dentro. Envío rápido a tu puerta.', ctaPrimary: 'Pedir ahora', productsTag: 'Nuestros combos', productsTitle: 'Lo que más piden', aboutTag: 'Nuestra receta' },
      { line1: 'Crujientes,', line2: 'irresistibles', line3: 'y a buen precio', subtitle: 'Las mejores alitas con salsas artesanales. ¡Pide ya!', ctaPrimary: 'Ordenar por WS', productsTag: 'Nuestro menú', productsTitle: 'Combos y porciones', aboutTag: 'Nuestra historia' },
      { line1: 'El pollo que', line2: 'engancha a todos', line3: 'desde el primer bite', subtitle: 'Sazón única, precios justos, delivery rápido.', ctaPrimary: 'Pedir delivery', productsTag: 'Nuestros sabores', productsTitle: 'Elige tu combo', aboutTag: 'Cómo lo hacemos' },
    ]
  },
  {
    id: 'venta_carnes',
    emoji: '🥩',
    label: 'Carnicería / Venta de carnes',
    heroVariants: [
      { line1: 'La carne más fresca', line2: 'de la ciudad', line3: 'directo a tu mesa', subtitle: 'Cortes premium seleccionados a diario. Calidad que se nota.', ctaPrimary: 'Ver cortes', productsTag: 'Nuestros cortes', productsTitle: 'Carnes premium', aboutTag: 'Nuestra carnicería' },
      { line1: 'Cortes de calidad', line2: 'al mejor precio', line3: 'sin intermediarios', subtitle: 'Carne fresca todos los días. Pide por WhatsApp y recoge.', ctaPrimary: 'Hacer pedido', productsTag: 'Lo que ofrecemos', productsTitle: 'Nuestros productos', aboutTag: 'Quiénes somos' },
      { line1: 'La mejor carne,', line2: 'siempre fresca', line3: 'para tu familia', subtitle: 'Seleccionamos los mejores cortes para que cocines lo mejor.', ctaPrimary: 'Pedir ahora', productsTag: 'Nuestros cortes', productsTitle: 'Elige tu corte', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'agricola',
    emoji: '🌽',
    label: 'Agrícola / Productos del campo',
    heroVariants: [
      { line1: 'Del campo', line2: 'a tu mesa', line3: 'sin intermediarios', subtitle: 'Productos frescos cosechados hoy, entregados mañana.', ctaPrimary: 'Ver productos', productsTag: 'Nuestras cosechas', productsTitle: 'Productos frescos', aboutTag: 'Nuestra finca' },
      { line1: 'Lo más fresco', line2: 'que da la tierra', line3: 'a precio justo', subtitle: 'Cosechamos con cuidado para que llegue lo mejor a tu hogar.', ctaPrimary: 'Hacer pedido', productsTag: 'Lo que cultivamos', productsTitle: 'Directo del campo', aboutTag: 'Quiénes somos' },
      { line1: 'Alimentos sanos,', line2: 'naturales', line3: 'de nuestra tierra', subtitle: 'Sin químicos, sin intermediarios. Puro campo ecuatoriano.', ctaPrimary: 'Contactar', productsTag: 'Nuestra cosecha', productsTitle: 'Productos naturales', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'mascotas',
    emoji: '🐾',
    label: 'Mascotas / Veterinaria / Pet shop',
    heroVariants: [
      { line1: 'Todo para', line2: 'tu mejor amigo', line3: 'en un solo lugar', subtitle: 'Alimentos, accesorios y cuidado para que tu mascota sea feliz.', ctaPrimary: 'Ver productos', productsTag: 'Para tu mascota', productsTitle: 'Lo que necesitan', aboutTag: 'Nuestra tienda' },
      { line1: 'Porque ellos', line2: 'se lo merecen', line3: 'todo y más', subtitle: 'Productos de calidad y atención veterinaria para tu mascota.', ctaPrimary: 'Pedir ahora', productsTag: 'Nuestros servicios', productsTitle: 'Cuidado premium', aboutTag: 'Quiénes somos' },
      { line1: 'La felicidad', line2: 'de tu mascota', line3: 'es nuestra misión', subtitle: 'Atención personalizada y los mejores productos del mercado.', ctaPrimary: 'Contactar', productsTag: 'Lo que ofrecemos', productsTitle: 'Para peludos felices', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'ropa_moda',
    emoji: '👗',
    label: 'Ropa / Moda / Boutique',
    heroVariants: [
      { line1: 'La moda que', line2: 'te hace brillar', line3: 'cada día', subtitle: 'Ropa de calidad con estilo propio. Encuentra tu look perfecto.', ctaPrimary: 'Ver colección', productsTag: 'Nuestra colección', productsTitle: 'Looks que enamoran', aboutTag: 'Nuestra boutique' },
      { line1: 'Tu estilo,', line2: 'tu identidad', line3: 'a tu precio', subtitle: 'Moda actual para mujeres que saben lo que quieren.', ctaPrimary: 'Ver catálogo', productsTag: 'Nueva colección', productsTitle: 'Prendas del momento', aboutTag: 'Nuestra historia' },
      { line1: 'Viste con', line2: 'confianza y estilo', line3: 'sin gastar de más', subtitle: 'Tendencias actuales a precios accesibles para todas.', ctaPrimary: 'Comprar ahora', productsTag: 'Lo más nuevo', productsTitle: 'Colección actual', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'zapatos',
    emoji: '👟',
    label: 'Zapatos / Calzado',
    heroVariants: [
      { line1: 'Camina con', line2: 'estilo y confort', line3: 'cada paso', subtitle: 'Calzado de calidad para cada ocasión y cada personalidad.', ctaPrimary: 'Ver catálogo', productsTag: 'Nuestra colección', productsTitle: 'Zapatos para ti', aboutTag: 'Nuestra tienda' },
      { line1: 'El zapato que', line2: 'estabas buscando', line3: 'al mejor precio', subtitle: 'Variedad, calidad y comodidad en cada par.', ctaPrimary: 'Ver modelos', productsTag: 'Nuestros estilos', productsTitle: 'Encuentra tu par', aboutTag: 'Nuestra historia' },
      { line1: 'Pisa fuerte,', line2: 'pisa con estilo', line3: 'pisa diferente', subtitle: 'Modelos exclusivos que combinan con tu personalidad.', ctaPrimary: 'Ver colección', productsTag: 'Lo más pedido', productsTitle: 'Modelos destacados', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'belleza_spa',
    emoji: '💅',
    label: 'Salón / Spa / Belleza',
    heroVariants: [
      { line1: 'Donde tu belleza', line2: 'cobra vida', line3: 'con cada visita', subtitle: 'Tratamientos profesionales para que salgas sintiéndote única.', ctaPrimary: 'Agendar cita', productsTag: 'Nuestros servicios', productsTitle: 'Para verte increíble', aboutTag: 'Nuestro salón' },
      { line1: 'Porque mereces', line2: 'sentirte bella', line3: 'cada día', subtitle: 'Profesionales apasionadas por hacerte lucir espectacular.', ctaPrimary: 'Reservar ahora', productsTag: 'Lo que ofrecemos', productsTitle: 'Servicios de belleza', aboutTag: 'Nuestra historia' },
      { line1: 'Tu versión', line2: 'más bella', line3: 'te espera aquí', subtitle: 'Servicios de belleza de alta calidad con atención personalizada.', ctaPrimary: 'Pedir cita', productsTag: 'Nuestros tratamientos', productsTitle: 'Cuídate con nosotras', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'tecnologia',
    emoji: '💻',
    label: 'Tecnología / Reparación / Computadoras',
    heroVariants: [
      { line1: 'Tu tecnología', line2: 'en buenas manos', line3: 'garantía incluida', subtitle: 'Reparación rápida y confiable de equipos electrónicos.', ctaPrimary: 'Solicitar servicio', productsTag: 'Nuestros servicios', productsTitle: 'Lo que reparamos', aboutTag: 'Nuestro taller' },
      { line1: 'Soluciones tech', line2: 'rápidas y confiables', line3: 'al mejor precio', subtitle: 'Expertos en reparación y venta de equipos tecnológicos.', ctaPrimary: 'Contactar ahora', productsTag: 'Lo que hacemos', productsTitle: 'Servicios técnicos', aboutTag: 'Quiénes somos' },
      { line1: 'Tu equipo falla,', line2: 'nosotros lo salvamos', line3: 'hoy mismo', subtitle: 'Diagnóstico gratuito y reparación con garantía.', ctaPrimary: 'Pedir diagnóstico', productsTag: 'Nuestros servicios', productsTitle: 'Reparación express', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'panaderia_pasteleria',
    emoji: '🎂',
    label: 'Panadería / Pastelería / Repostería',
    heroVariants: [
      { line1: 'Dulces momentos', line2: 'hechos a mano', line3: 'para ti y los tuyos', subtitle: 'Pasteles y panes artesanales que endulzan cada celebración.', ctaPrimary: 'Hacer pedido', productsTag: 'Nuestros productos', productsTitle: 'Delicias del día', aboutTag: 'Nuestra panadería' },
      { line1: 'El sabor dulce', line2: 'que te hace feliz', line3: 'en cada bocado', subtitle: 'Repostería artesanal elaborada con amor e ingredientes frescos.', ctaPrimary: 'Pedir ahora', productsTag: 'Lo que horneamos', productsTitle: 'Nuestras creaciones', aboutTag: 'Nuestra historia' },
      { line1: 'Tortas y pasteles', line2: 'que enamoran', line3: 'desde el primer sabor', subtitle: 'Personalizamos cada pedido para que tu celebración sea única.', ctaPrimary: 'Encargar mi torta', productsTag: 'Nuestras tortas', productsTitle: 'Para cada ocasión', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'servicios_profesionales',
    emoji: '🏢',
    label: 'Servicios profesionales / Consultoría',
    heroVariants: [
      { line1: 'Soluciones que', line2: 'hacen crecer', line3: 'tu negocio', subtitle: 'Asesoría profesional para llevar tu empresa al siguiente nivel.', ctaPrimary: 'Agendar consulta', productsTag: 'Nuestros servicios', productsTitle: 'Cómo te ayudamos', aboutTag: 'Quiénes somos' },
      { line1: 'Expertos que', line2: 'resuelven', line3: 'lo que necesitas', subtitle: 'Años de experiencia al servicio del crecimiento de tu empresa.', ctaPrimary: 'Contactar ahora', productsTag: 'Lo que hacemos', productsTitle: 'Nuestros servicios', aboutTag: 'Nuestra empresa' },
      { line1: 'Tu éxito', line2: 'es nuestro objetivo', line3: 'desde el día uno', subtitle: 'Trabajamos contigo para alcanzar las metas de tu negocio.', ctaPrimary: 'Hablar con un experto', productsTag: 'Servicios', productsTitle: 'Cómo trabajamos', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'gym_fitness',
    emoji: '💪',
    label: 'Gimnasio / Fitness / Entrenamiento',
    heroVariants: [
      { line1: 'El gym que', line2: 'transforma tu cuerpo', line3: 'y tu mente', subtitle: 'Entrenamiento personalizado para alcanzar tus metas reales.', ctaPrimary: 'Comenzar ahora', productsTag: 'Nuestros planes', productsTitle: 'Elige tu programa', aboutTag: 'Nuestro gimnasio' },
      { line1: 'Tu mejor versión', line2: 'te espera aquí', line3: 'empieza hoy', subtitle: 'Equipos modernos, entrenadores certificados, resultados reales.', ctaPrimary: 'Inscribirme', productsTag: 'Nuestros servicios', productsTitle: 'Planes y membresías', aboutTag: 'Quiénes somos' },
      { line1: 'Entrena fuerte,', line2: 'vive mejor', line3: 'con nosotros', subtitle: 'Comunidad motivadora y entrenadores que te dan resultados.', ctaPrimary: 'Ver planes', productsTag: 'Nuestros programas', productsTitle: 'Transforma tu vida', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'ferreteria',
    emoji: '🔨',
    label: 'Ferretería / Materiales de construcción',
    heroVariants: [
      { line1: 'Todo lo que', line2: 'tu obra necesita', line3: 'en un solo lugar', subtitle: 'Materiales de construcción y herramientas al mejor precio del mercado.', ctaPrimary: 'Ver productos', productsTag: 'Nuestros productos', productsTitle: 'Para tu construcción', aboutTag: 'Nuestra ferretería' },
      { line1: 'Construye más,', line2: 'gasta menos', line3: 'sin sacrificar calidad', subtitle: 'La ferretería de confianza con todo para tus proyectos.', ctaPrimary: 'Cotizar ahora', productsTag: 'Lo que ofrecemos', productsTitle: 'Materiales y herramientas', aboutTag: 'Quiénes somos' },
      { line1: 'Tu proyecto', line2: 'merece los mejores', line3: 'materiales', subtitle: 'Asesoría gratuita y precios competitivos para profesionales y particulares.', ctaPrimary: 'Pedir cotización', productsTag: 'Nuestro catálogo', productsTitle: 'Para cada obra', aboutTag: 'Nuestra historia' },
    ]
  },
  {
    id: 'farmacia',
    emoji: '💊',
    label: 'Farmacia / Productos de salud',
    heroVariants: [
      { line1: 'Tu salud', line2: 'en buenas manos', line3: 'cerca de ti', subtitle: 'Medicamentos, vitaminas y productos de salud con atención personalizada.', ctaPrimary: 'Consultar ahora', productsTag: 'Nuestros productos', productsTitle: 'Para tu bienestar', aboutTag: 'Nuestra farmacia' },
      { line1: 'Cuidamos', line2: 'tu bienestar', line3: 'cada día', subtitle: 'Farmacia de barrio con los mejores precios y atención de calidad.', ctaPrimary: 'Pedir medicamentos', productsTag: 'Lo que ofrecemos', productsTitle: 'Salud y bienestar', aboutTag: 'Quiénes somos' },
    ]
  },
  {
    id: 'otro',
    emoji: '✨',
    label: 'Otro tipo de negocio',
    heroVariants: [
      { line1: 'El negocio que', line2: 'estabas buscando', line3: 'ahora en línea', subtitle: 'Calidad, confianza y atención personalizada para cada cliente.', ctaPrimary: 'Contáctanos', productsTag: 'Lo que ofrecemos', productsTitle: 'Nuestros productos', aboutTag: 'Quiénes somos' },
      { line1: 'Calidad y servicio', line2: 'que te sorprenden', line3: 'desde el primer día', subtitle: 'Nos dedicamos a darte lo mejor con atención personalizada.', ctaPrimary: 'Ver más', productsTag: 'Nuestros servicios', productsTitle: 'Lo que hacemos', aboutTag: 'Nuestra historia' },
    ]
  },
]

// Get a random variant for a sector
export function getSectorHero(sectorId: string): Sector['heroVariants'][0] {
  const sector = SECTORS.find(s => s.id === sectorId)
  if (!sector) return SECTORS[SECTORS.length - 1].heroVariants[0]
  const variants = sector.heroVariants
  return variants[Math.floor(Math.random() * variants.length)]
}

// Get sector by id
export function getSector(sectorId: string): Sector | undefined {
  return SECTORS.find(s => s.id === sectorId)
}
