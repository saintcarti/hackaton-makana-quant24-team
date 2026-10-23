# ICP — el segmento real que Camila representa

*Validación startup de «La Cita» (C1.a) · Hackatón Señales · 12-oct-2026 · Protocolo de honestidad activo. Camila es una persona sintética; el ICP es el segmento poblacional chileno real que ella tipifica.*

---

## 1. Definición del ICP

**Mujeres (y una cola larga de hombres) 25–45, urbanas, trabajadoras de oficina con sobreexigencia laboral («knowledge workers» con calendario), que pagan un gimnasio al que asisten esporádicamente o han dejado de asistir, llevan ≥2 intentos fallidos de «volver», y sienten culpa por no ir.**

Criterios de inclusión (todos deben cumplirse):

1. **Socio vigente de un gym** (pagando mensualidad) con asistencia <1×/semana sostenida.
2. **Empleo intensivo en calendario**: reuniones, proyectos, jefatura media o profesional — la semana la gobierna el calendario laboral.
3. **Ventana de ejercicio vespertina y dispersa** (19:00–21:00) o de madrugada ya probada y abandonada.
4. **Sin intención de darse de baja** («sigo pagando porque darme de baja se siente como rendirse»).
5. **Ya gastó en el problema**: mensualidad + apps/prote/zapatillas — el sunk cost existe y pesa.

Criterios de exclusión (anti-ICP):

- Entrenadores frecuentes (≥3×/semana estable): no tienen el problema.
- Quienes buscan «cambiar de gym» o comparar precios: otro problema (adquisición, no retención).
- Deportistas con meta competitiva: quieren periodización (QUÉ), no logística.
- Perfiles con dolor físico no evaluado: derivación R4 (kinesiólogo), no ICP del MVP.

## 2. Tamaño del segmento (aritmética bottom-up)

Población base (mujeres): Chile tiene ~8,3 millones de mujeres en edad de trabajar (15+) — [Estimate] a partir de INE ENE (~9,4M ocupados totales, ~46–47% mujeres: https://worldjobsdata.com/blog/chile-ai-jobs , [Data] INE 2025 vía fuente secundaria; cifra exacta por sexo del INE no la extraje — ver Flags).

| Paso | Filtro | % que pasa | Personas | Etiqueta |
|---|---|---|---|---|
| 1 | Mujeres 25–45 urbanas (RM + grandes ciudades) | — | ≈ 1.700.000 | [Estimate] ~40% de las mujeres 15+ en tramo 25–45; ~52% urbanas de Chile es 89% → redondeo 1,7M |
| 2 | Empleadas (tasa de empleo femenina ~45–50%) | 47% | ≈ 800.000 | [Data] INE: informality femenina 27,9% (Q1 2026, https://elciudadano.com/en/job-market-struggles-unemployment-rises-informality-grows-and-women-bear-the-brunt/04/29 ) |
| 3 | De oficina/calendario intensivo (profesionales + gerencia media + técnicas) | 35% | ≈ 280.000 | [Estimate] ver abajo — desglose INE no verificado en primaria (Flags) |
| 4 | Socias de gym (penetración 5,3% nacional; urbana/oficina sobrerrepresentada: 12–15%) | 13% | ≈ 36.000 | [Data] penetración nacional 5,3% (mercadofitness.com) escalada [Estimate] ×2,5 para el subgrupo urbano-empleo formal |
| 5 | Con asistencia no sostenida (50% de nuevos socios abandona a 6m) | 50% | ≈ 18.000 | [Data] IHRSA proxy (pilotium.cc) |

**Paso 3, justificación (35%):** [Estimate — ver Flags: el desglose exacto por categoría ocupacional del INE no se logró verificar en fuente primaria dentro del presupuesto de búsquedas; la URL inicial que lo citaba resultó muerta (404) y el reintento con ine.gob.cl confirma el crecimiento de «actividades profesionales» (+14,8% en 12m a dic-2025/feb-2026: http://www.ine.gob.cl/sala-de-prensa/prensa/general/noticia/2026/03/30/la-tasa-de-desocupaci%C3%B3n-nacional-fue-8-3-en-el-trimestre-diciembre-2025-febrero-2026 ) pero no publica el % del empleo por categoría]. Base del estimado: el estudio de la UDD sobre ESI (negocios.udd.cl) agrupa «directores, gerentes, profesionales, científicos e intelectuales» ≈ 15,2% del empleo privado + «técnicos y profesionales de nivel medio» ≈ 9,4%; sumado con el apoyo administrativo da ~25%, y el 35% final añade técnicos con calendario intensivo. Es el segundo supuesto más frágil de la cadena (después del 13% de penetración gym por subgrupo).

```
ICP núcleo (Chile) ≈ 18.000 mujeres en el punto exacto del dolor
ICP extendido (agregando hombres con el mismo perfil, ~40% del total) ≈ 30.000 personas
SAM operativo (misma aritmética, 2029, mercado crecido) ≈ 92.000 (ver mercado-chile.md §3)
```

[Opinion] 18–30k personas con un ARPU de $95.000/año (ver §5) da un mercado servible de CLP $1.700–2.900M/año (~US$1,8–3M/año) — pequeño para VC global, perfecto para (a) un negocio lifestyle, (b) una tesis B2B2C con gyms/empleadores que multiplica el TAM ×5–10, o (c) levantar pre-seed con evidencia de retención como activo principal. El pitch del Stage A no debe sobrevender el tamaño: debe vender el KPI (retención 90 días) y la tesis B2B2C.

## 3. Mapa del lenguaje (cómo habla el segmento — insumo directo para el copy del pitch)

Fuentes: citas literales del caso (Caso1.md) + frases típicas del perfil en redes foros chilenos (r/Gimnasio, r/Chilefit en reddit.com) + [Assumption] extensión conservadora. Nivel de evidencia: el caso es el corpus más limpio; lo demás es direccional.

**Frases que el segmento usa (y que La Cita debe usar de vuelta):**

| Frase del segmento | Qué significa en la práctica | Cómo la usa La Cita |
|---|---|---|
| «La pega me come» | el trabajo consume el slot; atribución externa que protege el ego | El copy NUNCA discute la atribución: «si hoy la pega te come, responde MUEVE» — valida y redirige |
| «Mañana parto» | fresh start verbal, sin cuándo/dónde | Se captura tal cual: el bot pregunta el domingo a las 20:00, antes del «23:55» |
| «Partir el lunes» | landmark temporal como plan completo | «El lunes ya está agendado» — el fresh start se convierte en invite, no en promesa |
| «Sigo pagando porque darme de baja se siente como rendirse» | sunk cost como identidad («soy alguien que va al gym») | «Ya lo pagaste — hoy recuperaste $11.660» — reencuadre del sunk cost como activo |
| «Sin volverse fanática» | miedo al extremo; quiere sostenibilidad, no transformación | 40 minutos, 3 máquinas — la cita es acotada por diseño |
| «Me da lata» | fricción/aversión chilena difusa, no pereza clínica | El sistema elimina decisiones: dos opciones de hora, dos taps |
| «La culpa me quita las ganas» | el fallo castiga el intento siguiente | Mover ≠ fallar; sin rachas, sin «te quedaste atrás» |

**Palabras vetadas en el producto (generan culpa o suenan a disciplina):** racha, deberías, compromiso (como exigencia), disciplina, meta corporal, peso, transformación, «no te rindas», challenge/reto.

**Palabras ancla del producto:** cita, agenda, mover, partir, recuperar (tu plata), tu ventana, sin explicaciones.

[Opinion] El copy del pitch debe leerse como una agenda de jefa de proyectos, no como una app de fitness: cero jerga fitness, cero $\Sigma$ de ejercicios; solo logística. «El gym no te necesita más motivado; necesita una hora en tu calendario».

## 4. Canales donde vive el segmento

| Canal | Evidencia de presencia | Uso en Stage A |
|---|---|---|
| **WhatsApp** | El caso: «vive con el celular en la mano: WhatsApp…»; Chile: ~89,7% de usuarios de internet lo usa [Data]: https://adsize.io/geo/cl | Canal del producto (recibe, no abre) |
| **Instagram/TikTok** | [Assumption] el segmento 25–45 femenino urbano con empleo de oficina está en IG Stories/reels de fitness «motivacional» que scrollea sin actuar | Orgánico: reels «la agenda de tu semana vs tu gym» |
| **Calendario laboral (Google Workspace/M365)** | Definición misma del ICP (jefaturas/profesionales) | El producto vive ahí: el invite es el mecanismo |
| **Comunidades de amigas/grupos WhatsApp de la pega** | El caso: «una amiga que la iba a acompañar» — la disposición social existe | Referral: «invita a tu amiga de la pega» (k [Estimate] 0,25–0,3) |
| **RRHH / beneficios corporativos** | Chile tiene un ecosistema de bienestar corporativo activo (Workmed, Pluxee, Edenred; 84 plataformas de wellness/coaching registradas en 2026: https://revenuebase.ai/companies/wellness-and-coaching-platforms/chile ) | B2B2C pilotos con 2–3 empleadores (ver unit-economics.md escenario 2) |
| **App del propio gym** | El caso: la abre y cierra sin ir | NO canal: es el prompt sin consecuencia que ya falló |

## 5. Qué ya gasta en el problema (sunk cost como prueba de disposición a pagar)

| Gasto | Monto (CLP/mes) | Fuente/etiqueta |
|---|---|---|
| Mensualidad gym low-cost (Smart Fit Chile) | $25.000–$36.900 (12m Black ≈ $369.000: $30.750/mes) | [Estimate] reddit.com/r/Chilefit + smartfit.cl sin cifra pública; ver Flags |
| Mensualidad boutique (Bio Ritmo, pilates reformer) | $45.000–$90.000 | [Estimate] rango de mercado |
| Apps de rutinas premium (si pagó 3, prob. pagó ≥1) | $10.000–$15.000 | [Estimate] Fitbod US$15,99 ≈ $15.200 |
| «Zapatillas nuevas en agosto» | amort. $8.000–$15.000 | [Estimate] $80.000–$150.000 por 6–12m |
| Delivery 21:50 (sushi) | $15.000–$25.000/semana | cita del caso (Mar: sushi 21:50) |
| Personal trainer (si escalara a la solución humana) | $60.000–$170.000 | [Data] cronoshare.cl + academiademovimiento.cl |

**Lectura de disposición a pagar:** el segmento YA destina ~$35.000–$60.000/mes a resolver (mal) este problema — mensualidad + apps + indumentaria. Pagar **$7.990/mes por hacer que eso funcione** es 13–23% del gasto existente en el problema. [Opinion] El willingness-to-pay no hay que crearlo: hay que redirigirlo. El pitch lo dice mejor: «Camila gasta $400.000/año en un gym al que no va; La Cita cuesta menos que dos de esos meses desperdiciados».

---

## Flags

- **Yellow — Desglose INE por categoría ocupacional NO verificado en fuente primaria:** la fuente inicial (inoticias.cl) resultó URL muerta (404) y el reintento en ine.gob.cl solo confirma el auge de «actividades profesionales» (+14,8% 12m, dic-2025/feb-2026) sin publicar % por categoría; el 35% de oficina/calendario se ancla en el estudio UDD/ESI (negocios.udd.cl, 15,2% directores-gerentes-profesionales + 9,4% técnicos). Tratar el paso 3 como [Estimate] puro ante el jurado. La aritmética §2 es robusta a ±30% en este paso (18k → 13–24k).
- **Yellow — Penetración de gym por subgrupo es extrapolación:** el 13% (5,3% × 2,5) para urbano-empleo formal es [Estimate]; no existe dato público chileno de penetración por NSE/ocupación. Es el supuesto más frágil de la cadena de tamaño (ver sensibilidad en unit-economics.md).
- **Yellow — Mapa de lenguaje:** el corpus duro es el propio caso (ficción informada); las frases de foros son direccional y culturalmente plausibles, no investigación de usuarios. Antes del launch: 10 entrevistas de discovery con el protocolo de preguntas del caso.
- **Yellow — Datos >18 meses:** penetración 5,3% (Radiografía 2024), IHRSA 50% a 6m, ENS 2016-17, INE informality Q1 2026 (<18 meses ✓).
- **Red — ninguna.**
