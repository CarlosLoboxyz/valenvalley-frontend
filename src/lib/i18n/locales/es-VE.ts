/**
 * Diccionario base (es-VE: español de Venezuela). Define el conjunto de claves; `en.ts`
 * debe tener exactamente las mismas, y el compilador lo verifica.
 *
 * Convenciones: tuteo; "ítems", "cotización", "proveedor"; las claves con plural
 * llevan los sufijos `.one` y `.other`.
 */
export const esVE = {
	// ── Comunes ──────────────────────────────────────────────────────
	'common.notSpecified': 'No especificado',
	'common.na': 'N/D',
	'common.unknown': 'Desconocido',
	'common.noneListed': 'Sin registro',
	'common.yes': 'Sí',
	'common.no': 'No',
	'common.close': 'Cerrar',
	'common.done': 'Listo',
	'common.items.one': '{count} ítem',
	'common.items.other': '{count} ítems',
	'common.years.one': '{count} año',
	'common.years.other': '{count} años',
	'common.noQualifyingSupplier': 'Sin proveedor calificado',

	// ── App ──────────────────────────────────────────────────────────
	'app.title': 'CuadraMás — Comparativa de proveedores',
	'app.description':
		'Comparativa B2B de proveedores en Alibaba con agrupado por familias, validación de listas de materiales y borradores de RFQ para aprobación humana.',
	'app.footer':
		'Comparativa de sourcing · Datos de proveedores en Alibaba. Verifica MOQ, especificaciones y antigüedad del proveedor antes de ordenar.',

	// ── Navegación ───────────────────────────────────────────────────
	'nav.workspace': 'ESPACIO DE TRABAJO',
	'nav.aria': 'Navegación del espacio de trabajo',
	'nav.overview': 'Resumen',
	'nav.products': 'Productos',
	'nav.suppliers': 'Proveedores',
	'nav.graphs': 'Gráficos',
	'nav.pipeline': 'Flujo y puntaje',
	'help.title': '¿Necesitas ayuda?',
	'help.body': 'Aprende a leer tu reporte de sourcing o ajusta los pesos del puntaje.',
	'help.cta': 'Abrir controles de puntaje',
	'profile.role': 'Equipo de compras',
	'profile.settings': 'Ajustes del flujo',

	// ── Barra superior ───────────────────────────────────────────────
	'topbar.materials': 'Materiales',
	'topbar.summary.one': '{count} ítem · {review} por validar',
	'topbar.summary.other': '{count} ítems · {review} por validar',
	'topbar.bell': 'Revisar ítems marcados ({count})',

	// ── Preferencias ─────────────────────────────────────────────────
	'prefs.theme.toLight': 'Cambiar a tema claro',
	'prefs.theme.toDark': 'Cambiar a tema oscuro',
	'prefs.locale.label': 'Idioma',

	// ── Encabezado de página ─────────────────────────────────────────
	'header.eyebrow': 'ANÁLISIS · {date}',
	'header.title.overview': 'Resumen de proveedores',
	'header.title.graphs': 'Gráficos de sourcing',
	'header.title.pipeline': 'Flujo y puntaje',
	'header.subtitle.overview': 'Tus resultados de sourcing, organizados en una sola vista.',
	'header.subtitle.graphs':
		'Compara los puntajes de recomendación y la cobertura por familias de producto.',
	'header.subtitle.pipeline':
		'Carga tu lista de materiales, ajusta el agrupado por familias y valida los resultados.',
	'header.json.title': 'Descargar final_recommendations.json',
	'header.excel': 'Excel (.xlsx)',
	'header.excel.title': 'Descargar final_recommendations.xlsx (4 hojas)',
	'header.export': 'Exportar reporte',

	// ── Pestañas ─────────────────────────────────────────────────────
	'tabs.aria': 'Vistas del dashboard',
	'tabs.overview': 'Resumen',
	'tabs.graphs': 'Gráficos',
	'tabs.pipeline': 'Flujo y puntaje',

	// ── Tarjetas de estadísticas ─────────────────────────────────────
	'stats.materials': 'Materiales analizados',
	'stats.materials.foot.one': 'En {count} familia de producto',
	'stats.materials.foot.other': 'En {count} familias de producto',
	'stats.review': 'Por validar',
	'stats.review.none': 'Sin alertas',
	'stats.review.some': 'Requieren revisión',
	'stats.ready': 'Listos para RFQ',
	'stats.ready.foot': 'Cotizables en un borrador de RFQ',
	'stats.score': 'Puntaje promedio',
	'stats.score.strong': 'Coincidencia fuerte',
	'stats.score.consider': 'Considerar para la preselección',
	'stats.score.review': 'Se recomienda revisar',

	// ── Banner de alertas ────────────────────────────────────────────
	'insight.all': 'Todas las recomendaciones requieren una revisión más detallada',
	'insight.some': '{count} de {total} recomendaciones requieren una revisión más detallada',
	'insight.body':
		'{count} ofertas principales están marcadas como «Precaución» o «Descalificado». Confirma el MOQ, la antigüedad del proveedor, la marca y las especificaciones del producto antes de ordenar.',
	'insight.cta': 'Revisar ítems marcados',

	// ── Niveles y filtros ────────────────────────────────────────────
	'tier.strong': 'Muy recomendado',
	'tier.consider': 'Considerar',
	'tier.caution': 'Precaución',
	'tier.disqualified': 'Descalificado',
	'filter.score.all': 'Todos los puntajes',
	'filter.score.strong': 'Muy recomendado (75+)',
	'filter.score.consider': 'Considerar (55+)',
	'filter.score.score50': 'Puntaje 50+',
	'filter.score.review': 'Requiere revisión',
	'filter.family.all': 'Todas las familias',
	'filter.supplier.all': 'Todos los proveedores',

	// ── Tabla de productos ───────────────────────────────────────────
	'table.title': 'Recomendaciones de productos',
	'table.subtitle':
		'Mejor oferta por producto solicitado · 75% puntaje del proveedor + 25% ajuste a la RFQ',
	'table.search.aria': 'Buscar productos o proveedores',
	'table.search.placeholder': 'Buscar productos…',
	'table.filter.score.aria': 'Filtrar por puntaje o estado de revisión',
	'table.filter.family.aria': 'Filtrar por familia de producto',
	'table.filter.supplier.aria': 'Filtrar por proveedor',
	'table.col.product': 'PRODUCTO',
	'table.col.qtyBudget': 'CANTIDAD / PRESUPUESTO',
	'table.col.supplier': 'PROVEEDOR RECOMENDADO · ALTERNATIVAS',
	'table.col.price': 'PRECIO LISTADO',
	'table.col.score': 'PUNTAJE',
	'table.col.status': 'ESTADO',
	'table.budget': 'Presupuesto {value}',
	'table.alternatives.one': '{count} alternativa · {listings} ofertas',
	'table.alternatives.other': '{count} alternativas · {listings} ofertas',
	'table.noAdditional': 'Sin ofertas adicionales',
	'table.detail.provider': 'Proveedor recomendado',
	'table.detail.moqTenureTa': 'MOQ · Antigüedad · Trade Assurance',
	'table.detail.scoreComponents': 'Componentes del puntaje',
	'table.detail.scoreValue': 'Proveedor {vendor} (75%) · Ajuste RFQ {rfq} (25%)',
	'table.detail.qtyBudget': 'Cantidad y presupuesto solicitados',
	'table.detail.listingPrice': 'Precio listado',
	'table.detail.flags': 'Alertas de revisión',
	'table.detail.flagsValue': 'Alertas: {flags} · Descalificados: {disqualified}',
	'table.detail.noWarnings': 'Esta recomendación no tiene alertas.',
	'table.detail.fullBreakdown': 'Desglose completo del puntaje',
	'table.ta.verified': 'TA verificado',
	'table.ta.none': 'Sin TA',
	'table.empty': 'Ningún producto coincide con tu búsqueda o con los filtros activos.',
	'table.range': 'Mostrando {from}–{to} de {total} productos',
	'table.rows': 'Filas',
	'table.rows.aria': 'Productos por página',
	'table.prev': 'Página anterior',
	'table.next': 'Página siguiente',
	'table.page': 'Página {page} de {pages}',
	'table.source': 'Fuente: {source}',

	'moq.unconfirmed': 'Sin confirmar',

	// ── Fuentes de datos ─────────────────────────────────────────────
	'source.consolidated': 'Alibaba · Proveedores consolidados',
	'source.uploaded': 'Lista cargada ({name}) · Agrupado sin consulta',
	'source.localValidation': 'Lista · Validación local',

	// ── Detalle del producto (modal) ─────────────────────────────────
	'modal.eyebrow': 'PRODUCTO #{pos} · {family} ({familyName})',
	'modal.subtitle': 'Detalle del puntaje combinado: proveedor (75%) + ajuste a la RFQ (25%)',
	'modal.close': 'Cerrar detalle',
	'modal.matchScore': 'Puntaje de coincidencia',
	'modal.breakdown.price': 'Precio',
	'modal.breakdown.moq': 'Ajuste MOQ',
	'modal.breakdown.ta': 'Trade Assur.',
	'modal.breakdown.years': 'Años',
	'modal.breakdown.rfq': 'Ajuste RFQ',
	'modal.line.supplier': 'Proveedor recomendado',
	'modal.line.others': 'Otras ofertas calificadas',
	'modal.line.others.one': '{count} alternativa',
	'modal.line.others.other': '{count} alternativas',
	'modal.line.none': 'Ninguna registrada',
	'modal.line.price': 'Precio listado',
	'modal.line.budget': 'Presupuesto objetivo',
	'modal.line.qtyMoq': 'Cantidad solicitada · MOQ',
	'modal.line.qtyMoqValue': '{qty} · MOQ {moq}',
	'modal.line.tenureCerts': 'Antigüedad · Certificaciones',

	// ── Consolidación de proveedores ─────────────────────────────────
	'consolidation.title': 'Oportunidades de consolidación',
	'consolidation.subtitle': 'Proveedores con varios ítems · posible consolidación de envíos',
	'consolidation.total.one': '{count} proveedor',
	'consolidation.total.other': '{count} proveedores',
	'consolidation.empty': 'Ningún proveedor con varios ítems coincide con los filtros actuales.',
	'consolidation.col.provider': 'PROVEEDOR',
	'consolidation.col.products': 'PRODUCTOS',
	'consolidation.col.avg': 'PUNTAJE PROM.',
	'common.itemsWord.one': 'ítem',
	'common.itemsWord.other': 'ítems',
	'consolidation.expanded': 'Productos asignados a este proveedor ({families})',
	'consolidation.inspect': 'Ver desglose del puntaje',
	'consolidation.note':
		'Expande un proveedor para ver sus posiciones de producto, familias y cantidades.',

	// ── Señales de calidad de datos ──────────────────────────────────
	'quality.title': 'Señales de calidad de datos',
	'quality.subtitle': 'Patrones entre las recomendaciones',
	'quality.moq.title': 'MOQ sin confirmar',
	'quality.moq.some': 'Falta en {count} de {total} recomendaciones',
	'quality.moq.none': 'Todas las recomendaciones incluyen un MOQ confirmado',
	'quality.brand.title': 'La marca no coincide',
	'quality.brand.some': 'Marca OEM genérica u objetivo sin verificar en {count} ofertas',
	'quality.brand.none': 'La marca objetivo está verificada en todas las ofertas',
	'quality.price.title': 'Precio por debajo del objetivo',
	'quality.price.some':
		'{count} ofertas por debajo del piso: puede indicar diferencias de especificación o de calidad',
	'quality.price.none': 'Todos los precios listados están alineados con el piso objetivo',
	'quality.tenure.title': 'Antigüedad del proveedor desconocida',
	'quality.tenure.some':
		'{count} proveedores sin años de actividad: confirma el perfil de la empresa',
	'quality.tenure.none': 'Antigüedad verificada en todas las recomendaciones principales',
	'quality.severity.HIGH': 'ALTA',
	'quality.severity.CHECK': 'REVISAR',

	// ── Gráficos ─────────────────────────────────────────────────────
	'graphs.eyebrow': 'ANÁLISIS',
	'graphs.title': 'Cobertura de productos y puntajes de recomendación',
	'graphs.body':
		'Explora la agrupación por familias de producto y haz clic en cualquier barra para ver el desglose del proveedor y de la RFQ.',
	'graphs.families.title': 'Familias de producto',
	'graphs.families.subtitle.one': '{count} producto agrupado por familia',
	'graphs.families.subtitle.other': '{count} productos agrupados por familia',
	'graphs.families.total.one': '{count} familia',
	'graphs.families.total.other': '{count} familias',
	'graphs.families.tooltip': '{id}: {query} (cohesión {cohesion}%)',
	'graphs.families.assigned': 'Productos asignados',
	'graphs.families.max': 'Máx. {count} ítems por familia',
	'graphs.scores.title': 'Puntajes de recomendación',
	'graphs.scores.subtitle':
		'Puntaje de la mejor oferta por producto · sobre 100 (haz clic en una barra para ver el detalle)',
	'graphs.scores.avg': 'PROM.',
	'graphs.scores.legendCaution': 'Precaución (<55)',
	'graphs.scores.legendConsider': 'Considerar / Muy recomendado (55+)',
	'graphs.scores.axis': 'Posición del producto',
	'graphs.scores.bar': '{product}: {score}/100',
	'graphs.scores.barAria': '{product}, puntaje {score}',

	// ── Flujo: ingesta, filtros y pesos ──────────────────────────────
	'pipeline.ingest.title': 'Ingesta y agrupado por familias',
	'pipeline.ingest.subtitle':
		'Agrupado automático de 5 vistas (sin LLM) para organizar tu lista de materiales',
	'pipeline.import.label': 'Importar lista (.xlsx, .csv o reporte JSON)',
	'pipeline.import.hint': 'Hoja de productos: filas con nombre, cantidad y unidad',
	'pipeline.import.button': 'Elegir archivo',
	'pipeline.granularity.label': 'Granularidad del agrupado',
	'pipeline.granularity.hint': 'Controla el umbral de familias (fina, equilibrada o amplia)',
	'pipeline.granularity.fine': 'Fina',
	'pipeline.granularity.balanced': 'Equilibrada',
	'pipeline.granularity.broad': 'Amplia',
	'pipeline.perFamily.label': 'Ítems por familia',
	'pipeline.perFamily.hint': 'Ofertas orgánicas por página: máx. {max}',
	'pipeline.validate': 'Validar lista',
	'pipeline.compare': 'Comparar proveedores',
	'pipeline.rfq': 'Generar borrador RFQ',
	'pipeline.reset': 'Restaurar muestra',
	'pipeline.filters.title': 'Filtros estrictos y puntaje ponderado',
	'pipeline.filters.subtitle':
		'Separa los descalificadores obligatorios del ranking ponderado de 0 a 100',
	'pipeline.filters.disqualified.one': '{count} descalificado',
	'pipeline.filters.disqualified.other': '{count} descalificados',
	'pipeline.ta.label': 'Exigir Trade Assurance',
	'pipeline.ta.hint': 'Descalifica a los proveedores sin Trade Assurance de Alibaba',
	'pipeline.moq.label': 'MOQ estricto',
	'pipeline.moq.hint':
		'Descalifica ofertas con MOQ sin confirmar o mayor que la cantidad objetivo',
	'pipeline.minPrice.label': 'Piso de precio mínimo estricto',
	'pipeline.minPrice.hint': 'Descalifica ofertas por debajo del precio mínimo del cliente',
	'pipeline.years.label': 'Años mínimos de actividad',
	'pipeline.years.hint': 'Umbral de antigüedad del proveedor (0 = sin filtro)',
	'pipeline.certs.label': 'Certificaciones requeridas',
	'pipeline.certs.hint': 'Separadas por coma (ej. CE, ISO9001, RoHS)',
	'pipeline.weights.title': 'Pesos del puntaje (0–100)',
	'pipeline.weights.subtitle': 'Puntaje del proveedor ({vendor}%) + ajuste a la RFQ ({rfq}%)',
	'pipeline.weight.price': 'Competitividad de precio ({value}%)',
	'pipeline.weight.moq': 'Ajuste de MOQ ({value}%)',
	'pipeline.weight.ta': 'Trade Assurance ({value}%)',
	'pipeline.weight.years': 'Años de actividad ({value}%)',
	'pipeline.weight.certs': 'Certificaciones ({value}%)',

	// ── Mensajes de estado y errores del flujo ───────────────────────
	'status.regrouped':
		'Se reagruparon {products} productos en {families} familias y se validaron sin conexión.',
	'status.validated': 'Se validaron {count} productos con las ofertas en caché.',
	'status.loadedReport': 'Se cargó el reporte «{name}» ({count} recomendaciones).',
	'status.parsedRows': 'Se leyeron {rows} filas de «{name}» y se agruparon en {families} familias.',
	'status.fetching': 'Consultando ofertas de Alibaba mediante la API del servidor…',
	'status.fetchDone': 'Consulta completa: {families} familias procesadas.',
	'status.restored': 'Se restauró el reporte de muestra de 20 productos.',
	'status.rfqReady':
		'Borrador de RFQ listo: {count} proveedores consolidados. Revísalo y apruébalo antes de enviarlo (no hay envío automático).',
	'status.rfqEmpty':
		'Aún no hay proveedores consolidados para el borrador de RFQ. Valida la lista primero.',
	'status.rawError': '{message}',
	'error.backendUnavailable':
		'El servicio de datos no está disponible. Verifica que el backend esté activo en BACKEND_URL.',
	'status.usingSample': 'Mostrando datos de ejemplo: el backend no está configurado o no responde.',
	'error.import.jsonShape':
		'El archivo JSON no coincide con la estructura de final_recommendations.json.',
	'error.import.noRows': 'No se encontraron filas de producto válidas en el libro de RFQ cargado.',
	'error.import.failed': 'No se pudo importar el archivo.',
	'error.fetch.http': 'La consulta falló (HTTP {status}).',
	'error.fetch.failed': 'La consulta falló. Verifica la API key en el archivo .env.',

	// ── Acceso ───────────────────────────────────────────────────────
	'auth.meta.title': 'Ingreso — CuadraMás',
	'auth.meta.description': 'Acceso a la plataforma de sourcing en Alibaba.',
	'auth.title': 'Ingreso',
	'auth.subtitle': 'Accede a tu plataforma de sourcing y carga tu lista de materiales.',
	'auth.email': 'Correo electrónico',
	'auth.email.placeholder': 'tu@empresa.com',
	'auth.password': 'Contraseña',
	'auth.submit': 'Iniciar sesión',
	'auth.firstTime': '¿Primera vez?',
	'auth.firstTime.link': 'Ir a la ingesta de materiales',

	// ── Ingesta de materiales ────────────────────────────────────────
	'ingest.meta.title': 'Carga de materiales — CuadraMás',
	'ingest.meta.description': 'Ingesta de la lista de materiales por archivo o entrada manual.',
	'ingest.title': 'Carga de materiales',
	'ingest.subtitle':
		'Sube tu lista en .csv o .xlsx, o escríbela a mano para continuar con la cotización.',
	'ingest.file.label': 'Carga por archivo',
	'ingest.dropzone.title': 'Arrastra tu archivo o haz clic para seleccionarlo',
	'ingest.dropzone.reading': 'Leyendo archivo…',
	'ingest.dropzone.hint': 'Formatos admitidos: .csv y .xlsx',
	'ingest.dropzone.aria': 'Seleccionar archivo .csv o .xlsx',
	'ingest.report.valid': 'Filas válidas',
	'ingest.report.errors': 'Errores detectados',
	'ingest.report.none': 'Sin errores.',
	'ingest.report.row': 'Fila {row}',
	'ingest.or': 'O escríbela',
	'ingest.manual.material': 'Material',
	'ingest.manual.materialPlaceholder': 'Ej. Tornillos 3/8"',
	'ingest.manual.qtyUnit': 'Cantidad y unidad',
	'ingest.manual.qtyUnitPlaceholder': '200 und',
	'ingest.manual.add': 'Agregar',
	'ingest.list.empty': 'Aún no agregaste materiales. Escríbelos arriba o carga un archivo.',
	'ingest.list.remove': 'Quitar {name}',
	'ingest.cta': 'Continuar con la lista cargada',
	'ingest.cta.counts': '({manual} manual + {file} de archivo)',
	'ingest.foot': 'Se cargaron {units} unidades en total (solo lista manual).',
	'ingest.missingColumn': 'Falta la columna obligatoria «{column}»',
	'ingest.emptyFile': 'El archivo está vacío',
	'ingest.readFailed': 'No se pudo leer el archivo',
	'ingest.onlyCsvXlsx': 'Solo se admiten archivos .csv o .xlsx',

	// ── Validaciones (mensajes de los esquemas Zod) ──────────────────
	'validation.email.required': 'El correo es obligatorio',
	'validation.email.invalid': 'Ingresa un correo válido',
	'validation.password.required': 'La contraseña es obligatoria',
	'validation.password.min': 'La contraseña debe tener al menos 6 caracteres',
	'validation.unit.invalid': 'Unidad inválida. Válidas: {units}',
	'validation.name.required': 'Falta el nombre del material',
	'validation.name.empty': 'El nombre del material no puede estar vacío',
	'validation.qty.number': 'La cantidad debe ser un número',
	'validation.qty.finite': 'La cantidad no puede ser infinita',
	'validation.qty.integer': 'La cantidad debe ser un entero',
	'validation.qty.positive': 'La cantidad debe ser mayor a 0',
	'validation.position.number': 'position debe ser un número',
	'validation.position.integer': 'position debe ser un entero',
	'validation.position.positive': 'position debe ser mayor a 0',
	'validation.minPrice.number': 'min price debe ser un número válido',
	'validation.minPrice.negative': 'min price no puede ser negativo',
	'validation.maxPrice.number': 'max price debe ser un número válido',
	'validation.maxPrice.negative': 'max price no puede ser negativo',
	'validation.manual.name': 'Escribe el nombre del material',
	'validation.manual.both': 'Escribe el material y su cantidad/unidad',

	// ── Unidades ─────────────────────────────────────────────────────
	'unit.pieces': 'piezas',
	'unit.packs': 'paquetes',
	'unit.kits': 'kits',
	'unit.sets': 'sets',
	'unit.pairs': 'pares',

	// ── Mensajes de dominio: motivos de descalificación ──────────────
	'flag.DQ_TRADE_ASSURANCE_REQUIRED': 'Falta Trade Assurance, que es obligatorio',
	'flag.DQ_MIN_YEARS': 'Antigüedad del proveedor ({years} años) por debajo del mínimo de {min} años',
	'flag.DQ_MIN_YEARS_UNKNOWN':
		'Antigüedad del proveedor desconocida; el mínimo exigido es de {min} años',
	'flag.DQ_PRICE_ABOVE_MAX': 'El precio listado ({price}) supera el presupuesto máximo ({max})',
	'flag.DQ_STRICT_MOQ':
		'No cumple el MOQ estricto (MOQ: {moq} frente a la cantidad objetivo de {qty})',
	'flag.DQ_STRICT_MOQ_UNCONFIRMED':
		'No cumple el MOQ estricto (MOQ sin confirmar frente a la cantidad objetivo de {qty})',
	'flag.DQ_MISSING_CERTS': 'Faltan certificaciones requeridas: {certs}',
	'flag.DQ_BELOW_MIN_PRICE_FLOOR':
		'El precio listado ({price}) está por debajo del piso de precio mínimo estricto ({min})',

	// ── Mensajes de dominio: alertas ─────────────────────────────────
	'flag.W_PRICE_NOT_LISTED': 'Precio no publicado en la tarjeta de búsqueda',
	'flag.W_BAIT_PRICE':
		'Posible precio señuelo (<25% de la mediana del grupo): verifica la cotización real por unidad',
	'flag.W_ABOVE_MEDIAN_PRICE': 'Precio por encima de la mediana de la familia',
	'flag.W_MOQ_UNCONFIRMED': 'MOQ sin confirmar en la oferta',
	'flag.W_MOQ_NEGOTIABLE':
		'El MOQ ({moq}) es hasta 1,5 veces la cantidad objetivo ({qty}); probablemente negociable',
	'flag.W_MOQ_EXCEEDS_QTY': 'El MOQ ({moq}) supera la cantidad objetivo ({qty})',
	'flag.W_UNIT_MISMATCH': 'Unidad distinta: la oferta usa {listingUnit} y la RFQ pide {rfqUnit}',
	'flag.W_NO_TRADE_ASSURANCE': 'No se detectó la insignia de Trade Assurance',
	'flag.W_TENURE_UNKNOWN': 'Antigüedad del proveedor desconocida: confirma el perfil de la empresa',
	'flag.W_NEW_SUPPLIER': 'Proveedor nuevo (menos de 2 años de actividad)',
	'flag.W_UNVERIFIED_CERTS': 'Certificaciones sin verificar: {certs}',
	'flag.W_BRAND_MISMATCH': 'La marca no coincide: {brand} no aparece explícitamente en la oferta',
	'flag.W_STRICT_BRAND_MISSING':
		'Se exigió una marca específica ({brand}) y no aparece en la oferta',
	'flag.W_BELOW_TARGET_FLOOR':
		'Precio listado por debajo del piso objetivo ({min}): verifica la especificación o el grado',
	'flag.W_NO_CANDIDATES':
		'Todos los candidatos fueron descartados por las reglas estrictas actuales',

	// ── Mensajes de dominio: ventajas ────────────────────────────────
	'flag.P_PRICE_COMPETITIVE': 'Precio muy competitivo dentro de la familia de producto',
	'flag.P_PRICE_BELOW_MEDIAN': 'Precio por debajo de la mediana de la familia',
	'flag.P_MOQ_FITS': 'El MOQ ({moq} {unit}) se ajusta a la cantidad objetivo ({qty})',
	'flag.P_TRADE_ASSURANCE': 'Protegido por Trade Assurance de Alibaba',
	'flag.P_YEARS_ACTIVE': '{years} años de actividad en Alibaba',
	'flag.P_CERTS_MATCH': 'Cumple todas las certificaciones requeridas ({certs})',
	'flag.P_COMPLIANCE_BADGES': 'Insignias de cumplimiento: {certs}',
	'flag.P_BRAND_MATCH': 'La marca coincide: {brand}',
	'flag.P_LOW_PRICE_QUOTE': 'Hay una cotización de precio unitario bajo',
	'flag.LEGACY_TEXT': '{text}'
} as const;

export type MessageKey = keyof typeof esVE;
