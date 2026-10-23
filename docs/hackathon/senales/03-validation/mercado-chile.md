# Mercado Chile — TAM/SAM/SOM del problema «paga gym y no sostiene»

*Validación startup de «La Cita» (C1.a) · Hackatón Señales · Makana SpA · 12-oct-2026 · Protocolo de honestidad: [Data] con URL, [Estimate] con supuestos, [Assumption], [Opinion]. Todo dato >18 meses se marca. Aritmética bottom-up en cada cifra.*

---

## 1. El mercado fitness/gimnasios en Chile (tamaño y crecimiento)

**Base instalada (dato más duro disponible):**

- Chile tiene **2.089 gimnasios** y **~1,05 millones de socios/usuarios**; penetración del fitness **5,3%** — [Data, >18 meses (informe nov-2024)]: https://mercadofitness.com/se-publico-radiografia-sector-gimnasios-chile/ (Radiografía del Sector de Gimnasios en Chile 2024, Mercado Fitness). Es el único censo público del sector; la cifra sigue siendo la referencia de la industria en 2026.
- **Smart Fit Chile opera ~100 sedes en el país** (99 sedes según el portal de convenios de Caja Los Andes, 2026) — [Data (2026, <18 meses)]: https://masbeneficios.cajalosandes.cl/deporte-y-vida-sana-convenio — y cerró el **30-sep-2025 un crédito sindicado de US$120 millones para refinanciar deuda y financiar la apertura de nuevos gimnasios** — [Data (2025, <18 meses)]: https://latincounsel.com/?Noticias=Bofill_Mir_Leads_Smart_Fit_Chile_on__120_Million_Syndicated_Financing_to_Fuel_Expansion — la cadena más grande de Chile sigue expandiendo capacidad.
- A nivel grupo, Smart Fit planificó ~300 aperturas para 2025 en LatAm (~9%/año sobre una red de ~3.400 locales) — [Data, direccional, fuente secundaria]: https://betterbusinessenetwork.com/smart-fits-2025-expansion-blueprint-how-edgard-corona-plans-to-open-300-new-locations.html
- Contexto global de referencia: el mercado mundial de clubes de salud/fitness ~US$134 mil millones en 2025, CAGR ~9,2% — [Data, direccional]: https://straitsresearch.com/es/report/health-and-fitness-club-market . América del Sur: crecimiento «moderado» — no usar cifras globales como proxy del mercado chileno (anti-criterio del torneo: solo bottom-up).

**Crecimiento del mercado chileno (aritmética bottom-up a 3 años):**

[Assumption] La Radiografía 2024 no proyecta crecimiento de socios. Como proxy uso la expansión de capacidad low-cost (el 100% del crecimiento marginal de locales es de cadenas de alto volumen):

| Año | Socios gym Chile | Aritmética |
|---|---|---|
| 2024 (base) | 1.050.000 | [Data] Radiografía 2024 |
| 2027 | ≈ 1.230.000 | 1,05M × 1,055^3 (CAGR [Estimate] 5,5%/año, la mitad del ritmo de expansión de capacidad de la cadena líder, §1, porque apertura ≠ captación proporcional) |
| 2029 | ≈ 1.370.000 | 1,05M × 1,055^5 |

[Estimate] CAGR de socios 5,5%/año: conservador frente a los ~30 locales/año de una sola cadena ([Data] gestiónfit arriba), y prudente frente a una penetración nacional que parte baja (5,3% vs ~20% EE.UU. — [Data, >18 meses]: https://www.healthandfitness.org/81-million-americans-were-members-of-a-fitness-facility-in-2025-new-hfa-report-finds/ : 81M de estadounidenses socios en 2025 ≈ 24% de adultos).

**Ingreso por socio (para valorizar el mercado):**

- [Estimate] Mensualidad promedio ponderada CLP $32.000/mes: 70% del parque es low-cost/masivo a $25.000–$35.000 (rango de mercado Smart Fit Chile; el precio exacto no se publica en https://www.smartfit.cl/planes — ver Flags) + 30% medio/boutique a $45.000 (Bio Ritmo, estudios de pilates/barre). Ponderado: 0,7×$29.000 + 0,3×$45.000 ≈ **$33.800**; uso $32.000 redondeado a la baja.
- [Estimate] Tipo de cambio: USD/CLP $950 (oct-2026).

**Valor anual del mercado de mensualidades (TAM monetario del sector):**

```
2029: 1.370.000 socios × $32.000/mes × 12 = CLP $525.880 millones/año ≈ US$554M/año
```

## 2. El problema específico: socios que pagan sin sostener

**Frecuencia del problema (cifras globales como proxy — no existe churn publicado de gimnasios chilenos, ver Flags):**

- **50,5% de los nuevos socios abandona dentro de los primeros 6 meses** (IHRSA/Statista) — [Data, >18 meses]: https://pilotium.cc/en/blog/gym-member-retention-statistics-2026
- Retención anual promedio de membresía: 71,4% (≈28,6% de churn anual); churn mensual 4–4,8%; duración media de un nuevo socio: 4,7 meses — [Data, >18 meses]: misma fuente pilotium (recopila benchmarks IHRSA).
- El clásico **«67% de las membresías van sin usarse»** (IHRSA) — [Data, >18 meses, FUENTE ANTIGUA]: https://capitalcounselor.com/blog/gym-membership-statistics · https://elevaterope.com/blogs/elevate-rope/gym-membership-waste
- **⚠️ DATO QUE CONTRADICE EL NARRATIVO (declarado sin suavizar):** la Health & Fitness Association (ex-IHRSA) reporta que en EE.UU. 2025 la proporción de socios que **no usó ni una vez** su membresía cayó a **4,6%** (mínimo histórico), desde ~10% — [Data (2026, <18 meses)]: https://www.healthandfitness.org/81-million-americans-were-members-of-a-fitness-facility-in-2025-new-hfa-report-finds/ . Es decir: el «paga y NUNCA va» es hoy minoritario en EE.UU. **El perfil relevante de Camila no es «nunca va» (6 visitas/10 meses): es asistencia esporádica e insostenida** — y esa sí está masivamente documentada (50% de abandono a 6 meses arriba; visita media 1,5×/semana vs 2,1 pre-2019: https://capitalcounselor.com/blog/gym-membership-statistics ). Redefinimos el segmento como **«paga-sin-sostener»**, no «paga-nunca-va». El caso de Camila (fue 6 veces, sigue pagando) es exactamente la forma esporádica.
- **Apps de fitness (el canal sustituto) retienen ~3% de usuarios al día 30**; activación cae de 26% (día 1) a 10% (día 28) — [Data (2026, press-release, direccional, no peer-reviewed)]: https://usatoday.com/press-release/story/39808/fitness-refined-releases-2026-report-on-why-fitness-app-users-quit
- Sedentarismo/inactividad Chile: la ENS 2016–2017 clasificaba 88% como «sedentario» con una pregunta simple; con instrumento GPAQ la **inactividad física es 32%** y el sedentarismo (>8h sentado) 6% — [Data, >18 meses]: https://www.revistamedicadechile.cl/index.php/rmedica/article/view/8296 . No existe ENS posterior publicada con cifra comparable (ver Flags del análisis del caso).

## 3. TAM / SAM / SOM (3 años, aritmética mostrada)

**Definición del mercado de «La Cita»:** no vendemos gimnasios ni rutinas; vendemos la **logística de asistencia sostenida** a quien ya paga un gym. El dinero ya está sobre la mesa (la mensualidad); el producto evita que ese dinero se cancele.

### TAM 2029 — todos los socios de gym de Chile con el problema de sostenibilidad

```
TAM (personas) = 1.370.000 socios (2029, aritmética §1)
TAM (gasto en riesgo) = 1.370.000 × 50% con asistencia no sostenida (proxy IHRSA 50,5% a 6m)
                     × $32.000/mes × 12 ≈ CLP $263.000 millones/año ≈ US$277M/año
```
[Assumption] Aplico el 50% de no-sostenibilidad global como techo chileno; el problema estructural (decisión diaria en caliente, culpa, fresh start sin slot) es universal y el caso lo documenta en Chile.

### SAM 2029 — el segmento alcanzable por el canal del MVP (WhatsApp + calendario laboral)

Filtros bottom-up sobre el TAM:

| Filtro | % que pasa | Aritmética | Etiqueta |
|---|---|---|---|
| Socios 2029 | 1.370.000 | base | [Estimate] §1 |
| Con asistencia no sostenida | 50% → 685.000 | ×0,50 | [Data] IHRSA proxy |
| Urbanos en ciudades con oferta de cadena/boutique (RM, Valparaíso, Concepción, Viña) | 55% → 376.750 | ×0,55 | [Estimate] concentración urbana del parque de gyms y del empleo de oficina |
| Con empleo intensivo de calendario (knowledge workers: profesionales, técnicos, gerencia media) | 35% → 131.862 | ×0,35 | [Estimate] ver icp.md §2: profesionales+gerencia ≈ 22,6% del empleo (17,4% + 5,2%, [Data] INE) más técnicos de oficina con calendario |
| Dispuestos a usar un canal de mensajería/aceptar ayuda digital | 70% → 92.300 | ×0,70 | [Assumption] WhatsApp ~89,7% de usuarios de internet en Chile [Data]: https://adsize.io/geo/cl |

```
SAM 2029 ≈ 92.000 personas (gasto: 92.000 × $32.000 × 12 ≈ CLP $35.300M/año ≈ US$37M/año ya pagado en mensualidades)
```

### SOM 3 años — lo capturable con los canales del Stage A (orgánico + referral + 2–3 gyms boutique), sin paid media

[Assumption] Stage A = validar retención, no maximizar revenue. Captura deliberadamente conservadora:

| Año | Usuarios activos (mujeres y hombres ICP + cola larga) | Aritmética |
|---|---|---|
| 1 | 300 | Semillas por comunidades de amigas y RRHH de 2–3 empleadores; 25/mes [Estimate] |
| 2 | 1.500 | Referral amiga-a-amiga (k viral 0,3/mes) + 1–2 gyms boutique aliados [Estimate] |
| 3 | 4.500 | 4,9% del SAM: 300→1.500→4.500 (k 0,25 sostenido + B2B2C) [Estimate] |

```
SOM revenue año 3 (B2C): 4.500 activos × 8% conversión premium [Assumption, ancla apps 3–5%, ver unit-economics.md]
                        × $7.990/mes × 12 ≈ CLP $34,5M/año ≈ US$36Miles/año
SOM revenue año 3 (B2B2C): 4 gyms boutique × 400 socios × $500/socio/mes × 12 ≈ CLP $9,6M/año ≈ US$10Miles/año
SOM total año 3 ≈ US$46–70k/año (con uplift de precio o conversión: ver sensibilidad en unit-economics.md)
```

**Declaración sin suavizar:** el SOM a 3 años es una **línea de base pequeña a propósito**. En CLP ~$45–65M/año no hay startup: hay un experimento rentable que valida el KPI real del caso — **«que vuelva a entrenar y lo sostenga» (visitas sostenidas/semana a 90 días)** — con N suficiente para levantar una ronda pre-seed en Chile. La tesis no es el revenue del año 3; es que si el mecanismo sostiene asistencia donde las apps retienen 3%, el gym mismo paga por esa retención (B2B2C, ver unit-economics.md §escenario 2).

## 4. Willingness-to-pay del segmento

- **El sunk cost es la prueba de disposición a pagar más fuerte disponible:** el segmento YA paga $25.000–$45.000/mes por algo que no usa ([Estimate] rango de mensualidades §1). Pagar $7.990/mes por hacer que ese gasto funcione es el 18–25% de lo que ya está pagando de todos modos. [Opinion] El competidor a vencer no es otra app: es la inercia de seguir pagando sin resolver.
- [Data] Anclas de gasto en el problema: entrenador personal presencial en Santiago $15.000–$35.000/sesión (independiente; https://cronoshare.cl/salarios/entrenador-personal ), planes a domicilio $170.000/mes por 4 sesiones (https://academiademovimiento.cl/personal-trainer-a-domicilio/ ), entrenamiento online $40.000–$100.000/mes (misma fuente cronoshare). Apps de contenido 2026: Fitbod US$15,99/mes (US$95,99/año) ≈ $15.200/mes; Freeletics sin plan mensual: US$34,99/3 meses y US$74,99–94,99/12 meses ≈ $5.900–7.500/mes — [Data 2026]: https://ionikhealth.com/fitbod-alternatives · https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison . Un precio de $7.990 queda por debajo de Fitbod, muy por debajo del PT en toda modalidad y de la mensualidad boutique; comparable al bloque anual de Freeletics (ver la corrección honesta en unit-economics.md §1).

## 5. ¿Qué está en juego para el que paga (B2B2C)?

- Un gym pierde ~28,6% de sus socios al año (churn anual IHRSA, [Data, >18 meses]: https://pilotium.cc/en/blog/gym-member-retention-statistics-2026 ). Con la aritmética del §1: cada socio churneado cuesta al gym ~$32.000 × meses que deja de pagar + costo de reposición.
- [Opinion] El gym low-costo NO sufre con el socio ausente (su margen vive de mensualidades cobradas) — sufre cuando el socio **cancela por culpa** («pago y no voy»). La Cita ataca exactamente ese punto: quita la culpa para salvar la membresía. Para gyms boutique (sesiones agendadas, capacidad finita), la asistencia misma es el KPI.

---

## Flags

- **Yellow — Churn de gimnasios chilenos: gap de dato local.** La Radiografía 2024 no publica churn/deserción de socios en Chile. Todo el filtro «50% no sostiene a 6 meses» es proxy IHRSA (EE.UU., >18 meses). Antes de un pitch con inversionistas: medir con 2–3 gyms aliados (cohortes de asistencia reales).
- **Yellow — Contradicción de datos declarada:** «67% de membresías sin usar» (IHRSA, fuente antigua reciclada por blogs) vs 4,6% «nunca visita» medido por HFA en 2025 (https://www.healthandfitness.org/81-million-americans-were-members-of-a-fitness-facility-in-2025-new-hfa-report-finds/ ). Resolución adoptada: el segmento del caso es «asistencia esporádica/no sostenida» (50% a 6 meses), no «nunca va». Si el jurado o un inversionista cita el 4,6%, esa es la respuesta.
- **Yellow — Precio de mensualidad no verificado:** $32.000 promedio ponderado es [Estimate]; smartfit.cl/planes no publica montos (confirmado 12-oct-2026); referencia secundaria de usuario: plan Black 12 meses ≈ $369.000 ($30.750/mes) — https://www.reddit.com/r/Chilefit/comments/1qwlgru/smartfit_plan_black_12_meses_con_oferta/ . Antes del demo: confirmar precio real en sede o usar «tu mensualidad» sin cifra.
- **Yellow — Crecimiento del mercado es extrapolación propia:** el CAGR 5,5% de socios es [Estimate] mío (no existe proyección pública de socios en Chile); la expansión de Smart Fit (~100 sedes; crédito sindicado US$120M sep-2025) es el dato duro que lo ancla.
- **Yellow — Datos >18 meses:** Radiografía 2024, IHRSA 50%/71,4%, ENS 2016-17, D&M 2006, datos de ingreso por socio. Marcados inline.
- **Red — ninguna.** (El SOM pequeño es una decisión metodológica, no un hallazgo adverso.)
