# Unit Economics — escenarios B2C y B2B2C (Stage A: todo supuesto etiquetado)

*Validación startup de «La Cita» (C1.a) · Hackatón Señales · 12-oct-2026 · Protocolo de honestidad activo. En Stage A no hay evidencia propia: **todo** lo que sigue es [Assumption] o [Estimate] con supuestos explícitos; los anclajes [Data] son de mercado, no de tracción nuestra.*

**KPI del caso (éxito verbatim):** «que vuelva a entrenar y lo sostenga». Traducción económica de ese KPI: **visitas sostenidas por usuario activo a 90 días** (V/U90). El modelo entero depende de ese número y de si lo movemos vs el baseline de apps (3% día 30 — [Data, direccional]: https://usatoday.com/press-release/story/39808/fitness-refined-releases-2026-report-on-why-fitness-app-users-quit ). El resto es aritmética.

---

## 0. Supuestos compartidos (etiquetados)

| Supuesto | Valor | Etiqueta |
|---|---|---|
| Precio premium B2C | CLP $7.990/mes (≈US$8,4) | [Assumption] ancla §1 |
| Free: 1 cita/mes; Premium: cita semanal + re-agendado ilimitado + reencuadre de mensualidad | — | [Assumption] diseño freemium |
| Mensualidad gym del ICP | $30.750/mes | [Estimate] Smart Fit Black 12m ≈$369.000 (reddit r/Chilefit), sin cifra oficial |
| Costo GLM-5.3 (tono+parseo) | ~US$0,002–0,10/conversación activa/mes (llamadas de centavos) | [Estimate] API pay-per-use |
| Costo WhatsApp por usuario-activo/mes | ~8–16 mensajes bot × US$0,02 (tarifa servicio/utilidad Chile desde 01-oct-2026, **verificada**) + **1.000 mensajes de servicio gratis/mes por número** | [Data]: https://ekua.io/en/newsletters/whatsapp-pricing-october-2026 (Chile US$0,0200/mensaje; Peru 0,0300; Mexico 0,0085; primeros 1.000/mes gratis por número) |
| Costo variable por usuario premium/mes (mensajería+LLM+R2) | ≈ US$0,30 → uso **$300** (≈$19/msg × ~8–12 + LLM ~$100) | [Estimate] sobre tarifa verificada |
| Tipo de cambio | USD $950 | [Estimate] oct-2026 |

## 1. Pricing con ancla de competidores

| Ancla | Precio | Rol en el anclaje |
|---|---|---|
| Fitbod (contenido) | US$15,99/mes; US$95,99/año ≈ $15.200/mes [Data 2026] | techo de la categoría "app fitness premium" |
| Freeletics (contenido) | sin mensual: US$74,99–94,99/12m ≈ $5.900–7.500/mes [Data 2026] | piso de la categoría — y compite de cerca con nuestro precio |
| Jefit Elite | US$12,99/mes; US$69,99/año [Data 2026] | medio de la categoría |
| PT presencial Santiago | $15.000–$35.000/sesión ([Data] cronoshare.cl) | el "cita humana" a 2–4× el precio total de La Cita |
| PT online Chile | $40.000–$100.000/mes ([Data] cronoshare.cl) | techo del acompañamiento |
| StepBet | US$40/juego 6 semanas ≈ $6.300/mes | comparación "compromiso" sin culpa ni dinero en juego |

```
$7.990/mes = 52% de Fitbod · 107–135% del bloque anual de Freeletics por mes · 5–8% de una sesión de PT · 26% de su propia mensualidad del gym
```

**Corrección honesta (declarada):** el primer draft decía «por debajo de toda app de contenido» — **falso**: el plan anual de Freeletics sale ≈$5.900–7.500/mes, levemente BAJO nuestro $7.990. El posicionamiento correcto no es "más barato que las apps" (no siempre es cierto), sino **categoría distinta**: las apps de contenido venden QUÉ hacer (y retienen 3% al día 30); La Cita vende el CUÁNDO defendido — está anclada contra el PT ($15.000+/sesión, el mecanismo análogo humano), no contra apps de rutina. El argumento de precio que sí se sostiene: 26% de la mensualidad que YA paga, para salvar el 100% de esa mensualidad.

## 2. Escenario B2C (freemium, la persona paga)

**Conversión free→paid:** [Assumption] 8% (ancla: suscripciones anuales de salud/fitness retienen 33% (usatoday/Fitness Refined, direccional); conversión freemium de apps de bienestar 3–5% típica; tomamos 8% por el sunk cost ya pagado del segmento — es la variable más frágil del modelo, ver §5).

| Métrica | Valor | Aritmética |
|---|---|---|
| CAC orgánico (IG reel + SEO local «cómo volver al gym») | $0 dinero + 4 h/mes trabajo fundador = **$80.000/mes ($960.000/año) valorizados** a $20.000/h | [Estimate] costo de oportunidad, NO desembolso |
| CAC referral (amiga-a-amiga: 1 mes premium gratis para ambas si el referido se hace premium) | $4.794/premium efectivo | 2 × $7.990 por referido premium convertido [Assumption] k=0,3 |
| **CAC blended año 1 contable** (300 activos → 24 premium; 70% org + 30% referral) | **$44.794/premium** | 960.000/24 + 4.794 |
| CAC blended año 2+ (1.500 activos → 120 premium) | $12.794/premium | 960.000/120 + 4.794 — el costo orgánico fijo se diluye con escala |
| ARPU premium | $7.990/mes | precio |
| Costo variable | $300/mes (mensajería US$0,02/msg Chile verificada + LLM; los 1.000 mensajes/mes gratis por número cubren los primeros ~80–100 usuarios activos) | §0 |
| **Margen contributivo premium** | **$7.690/mes (96,1%)** | (7.990−300)/7.990 |
| Churn mensual premium | 7% | [Assumption] meta <churn de apps (46,8% a 90d premium: fitpocket) — el producto sostiene el hábito, el hábito sostiene la suscripción |
| Vida media | 14,3 meses | 1/0,07 |
| **LTV premium** | 7.690 × 14,3 ≈ **$110.000 (≈US$116)** | margen × vida |
| **LTV/CAC contable año 1** | **2,5×** | 110.000/44.794 — ⚠️ bajo el umbral 3× en la escala del año 1 |
| **LTV/CAC contable año 2** | **8,6×** | 110.000/12.794 |
| **LTV/CAC cash** (solo desembolsos, sin valorizar tiempo fundador) | 22,9× | 110.000/4.794 |
| Payback CAC año 1 contable | 5,8 meses | 44.794/7.690 |

**Hallazgo adverso (declarado sin suavizar):** en la escala del año 1 (300 activos) el B2C contable NO borra el umbral de 3× — el costo fijo de tiempo fundador repartido entre 24 premium es demasiado pesado. El modelo cruza 3× recién desde **~376 activos** (960.000/(36.700−4.794) ≈ 30 premium) y llega a 8,6× en la escala del año 2 del SOM. [Opinion] El año 1 del B2C es, contablemente, un experimento subvencionado por tiempo fundador; la tesis unit-economics válida es la del año 2+ o la vía B2B2C (§3) donde el CAC de adquisición lo absorbe el canal.

**Break-even B2C (usuarios y meses):** Stage A no tiene fixed costs (infra $0, §capital-y-stack.md); el costo real es el stipendio de oportunidad del fundador. Definimos break-even operativo como ingresos = costo del tiempo fundador + tools:

```
Usuarios premium necesarios = (gasto fundador $2.500.000/mes valorizado + $0 tools) / $7.690 margen
                            ≈ 325 premium/mes
Con conversión 8% → 4.063 usuarios activos free+premium
```
En el timeline del SOM (mercado-chile.md §3: 4.500 activos año 3), el break-even llega a finales del año 3. [Opinion] Solo B2C es un negocio lifestyle lento; el caso de inversión requiere B2B2C (§3) o capital.

## 3. Escenario B2B2C (quién paga en Chile)

Candidatos evaluados con honestidad sobre quién tiene el dolor Y la plata:

| Pagador potencial | ¿Tiene el dolor? | ¿Paga hoy? | Veredicto Stage A |
|---|---|---|---|
| **Smart Fit / cadenas low-cost** | NO el del socio ausente (margen vive del cobro mensual; el ausente es su mejor cliente) — sí el del cancelante por culpa | No hay antecedente público de que paguen por retención de socios | [Opinion] NO es el primer cheque. Su incentivo estructural es cobrar, no sostener asistencia. Puerta de entrada: patrocinio de demo (número de prueba) y conversación de datos, no contrato |
| **Gyms boutique** (pilates, barre, CrossFit boxes, estudios) | SÍ: sesiones agendadas, capacidad finita, la asistencia ES el producto; churn de culpa los mata | Sí pagan software de gestión (Mindbody/ClassPass ecosystem: https://co.mindbodyonline.com/careers/opportunities/4393407006 ) | **SÍ — target B2B2C #1**: cobrar por socio activo/mes (la asistencia sostenida es su revenue real) |
| **Empleadores (RRHH/bienestar)** | SÍ: salud laboral, ausentismo, productividad; el caso es literalmente una jefa de proyectos | SÍ: Chile tiene mercado de beneficios corporativos (Pluxee, Edenred, Workmed — 46–52 plataformas de wellness registradas 2026: revenuebase.ai) | **SÍ — target #2**: piloto «beneficio de bienestar focalizado» en 2–3 empleadores con ICP denso (constructoras, consultoras, bancos) |
| **Isapres/aseguradoras** | SÍ (prevención), pero ciclo de ventas 9–18m y compliance de salud | Sí, pero lento | NO en Stage A; sí en Serie A con datos de retención propios |
| **CAFs (prevención)** | Dolor regulado (Ley 16.744), no retención de socios | Proveedores focalizados | NO Stage A (mal encaje del mecanismo) |

**Modelo B2B2C (gym boutique):** $500/socio activo/mes por usar La Cita con sus socios (el gym lo ofrece como beneficio de retención: «tu trainer de logística»). **[Estimate: a validar en conversación con 2 gyms boutique; sin pricing comparable publicado en Chile — parche red team 12-oct: junto con el $2.500 del empleador, son los únicos números duros del modelo sin fuente. Anclaje de referencia: el software de gestión que ya pagan (Mindbody/ClassPass ecosystem) es el gasto comparable a desplazar]**

```
LTV gym boutique = 400 socios × 8% adoptan × $500 × 14m vida media del programa
CAC B2B = visitas de venta $150.000/gym (3 visitas × $20.000 + materiales)
LTV/CAC = (400×0,08×500×14) / 150.000 = 224.000/150.000 ≈ 1,5×  → no cierra solo con 1 gym chico
Pero: 1 gym de 400 con 32 premium-directos a $7.990 (cobro dual opcional) → 32×7.990×14 = $3,58M
```
[Opinion] B2B2C puro es marginal con gyms chicos; el play correcto es **B2B2C como canal de adquisición + B2C como monetización** (el gym regala/ subsidia el primer mes a sus socios de baja asistencia; esos socios convergen al premium B2C de $7.990). El gym gana retención, nosotros ganamos un CAC ≈ $0.

| Métrica B2B2C-híbrido | Valor | Aritmética |
|---|---|---|
| CAC por socio adquirido vía gym | ≈ $0 directo (el gym lo ofrece) + costo de servir al gym ($150.000/400) | [Estimate] |
| Conversión socio-gym → premium B2C | 8% (mismo supuesto) | [Assumption] |
| LTV híbrido | $110.000 (mismo B2C) | — |
| **LTV/CAC vía gym** | **>10×** (el CAC de adquisición lo absorbe el gym) | [Opinion] esta es la tesis de inversión real |
| Empleador: $2.500/socio/mes (wellness ticket) | 200 socios × $2.500 × 12 = $6M/año por empleador | [Estimate: a validar con 1 empleador; sin pricing comparable publicado en Chile — parche red team 12-oct: sin fuente, junto con el $500 del gym boutique] |

## 4. Break-even consolidado (escenario híbrido recomendado)

```
Fixed: US$0 (free tiers) + tiempo fundador $2,5M/mes valorizado
Revenue mes 12 [Estimate]: 300 activos × 8% × $7.990 + 2 gyms × $500×32 socios + 1 empleador × 200×$2.500×30%adopción
= 24×7.990 + 32.000 + 150.000 = 191.760 + 32.000 + 150.000 ≈ $374.000/mes
Break-even de tiempo fundador: $2.5M/mes → mes ~20–24 con 2 gyms + 1 empleador escalandose
```
[Assumption] La aritmética asume que el funnel B2B2C prende en el mes 6 (primer gym boutique cierra en 6–10 semanas de venta [Estimate]).

## 5. Sensibilidad ±30% en los 2 supuestos más frágiles

**Fragilidad #1: conversión free→paid (base 8%).** Es el supuesto sin evidencia propia más cargado del modelo (ancla de categoría 3–5%; el sunk cost justifica el uplift, no lo prueba).

**Fragilidad #2: churn mensual premium (base 7%).** Si el producto NO sostiene el hábito, el churn converge al de apps (46,8%/90d ≈ 19%/mes) y el modelo muere; si lo sostiene, baja a 5%.

| | Conversión −30% (5,6%) | Base | Conversión +30% (10,4%) |
|---|---|---|---|
| **Churn −30% (4,9%/mes → LTV $154.900)** | LTV/CAC 2,5× · BE 5.855 activos | 3,5× · BE 4.668 activos | 4,4× · BE 3.584 activos |
| **Churn base (7% → LTV $110.000)** | 1,8× · BE 5.855→8.335 activos | 2,5× · BE 4.063 activos | 3,1× · BE 3.163 activos |
| **Churn +30% (9,1% → LTV $83.400)** | 1,3× · BE 10.618 activos | 1,9× · BE 5.310 activos | 2,3× · BE 4.100 activos |

Lectura honesta: la lectura anterior («sobrevive en los 9 cuadrantes») **era inflada por un CAC mal calculado**; con el CAC contable corregido (incluye el costo de tiempo del fundador en la escala pequeña), el año 1 solo borra 3× en 4 de 9 cuadrantes, y en el peor cae a 1,3×. El patrón que sí se sostiene: **(a)** en todos los cuadrantes el payback de caja es <1 mes (el desembolso real por premium es solo el incentivo referral de $4.794) — la quiebra de caja es imposible en Stage A; **(b)** el CAC contable cae ~4× al escalar (960.000 fijos repartidos entre 120 premium del año 2: LTV/CAC 8,6×); **(c)** el cuadrante que mata la startup sigue siendo churn ≥15% (fuera de la gracia ±30% del supuesto base 7%×2,1) con conversión baja simultánea — si el churn converge al de apps (~19%/m), LTV cae a ~$40.000: 0,9× año 1 y 3,1× año 2 → el B2C deja de ser tesis de inversión y queda solo como negocio de fundador. Ese es exactamente el KPI del caso («y lo sostenga»): si a 90 días el producto no sostiene visitas, no hay pricing que salve el modelo. Por eso el MVP mide V/U90 como métrica norte (ver mvp-definition.md) y por eso el Stage A es un experimento de retención, no de revenue.

---

## Flags

- **Yellow — Hallazgo adverso del propio modelo (corregido a mitad de validación):** el cálculo inicial de CAC blended ($26.000, LTV/CAC 4,3×) estaba mal: repartía mal el costo orgánico entre activos y premium. Con el CAC contable corregido, el año 1 del B2C da 2,5× (bajo el umbral estándar 3×) y solo cruza 3× desde ~376 activos. Esto NO mata la tesis (el año 2 da 8,6× y el B2B2C absorbe el CAC), pero **el pitch no puede presentar 4,3× para el año 1**. Presentar: cash payback <1 mes + curva de dilución del CAC con escala + V/U90 como condición.
- **Yellow — Conversión 8% es el supuesto más frágil del modelo:** sin evidencia propia; ancla de categoría es 3–5%. Debe caer a 4% en el plan conservador de cualquier discusión con inversores (BE se mueve de 4.063 a ~8.125 activos).
- **Yellow — Churn 7% es aspiracional, no medido:** es la hipótesis central disfrazada de supuesto; si converge a la de apps (~19%/m), LTV cae a ~$40.000: LTV/CAC contable 0,9× (año 1) y 3,1× (año 2) → el modelo B2C deja de ser tesis de inversión. El MVP existe para medir ESTE número.
- **Yellow — Pricing WhatsApp verificado y favorable al piloto:** desde 01-oct-2026 el mensaje de servicio/utilidad en Chile cuesta US$0,02, pero los primeros 1.000 mensajes/mes por número son gratis — un piloto de <80 usuarios activos paga US$0 de mensajería (https://ekua.io/en/newsletters/whatsapp-pricing-october-2026 ). El costo variable de $300/usuario/mes asume estar ya fuera del bloque gratis.
- **Yellow — "CAC orgánico $0" es marketing:** contablemente son 4 h/mes del fundador ($960.000/año). Declarado en la tabla para no auto-engañarse; el payback de caja (<1 mes) es la métrica honesta de Stage A.
- **Red — ninguna** (el cuadrante letal de churn ≥15% está identificado y es la métrica norte del MVP).
