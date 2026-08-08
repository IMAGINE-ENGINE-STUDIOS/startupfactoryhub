# Reservas de calendario: aparecer en Meetings, aceptar, notificar y enviar email

## Situación actual (verificada)

- Cuando alguien reserva desde el link público (`/book/:slug`), se crea una fila en `calendar_bookings` con estado `pending` y solo se envía un email de confirmación **al que reserva**. El anfitrión no recibe nada.
- La tabla `calendar_bookings` **no tiene ningún trigger**, así que no se genera notificación en el perfil.
- La pestaña **Meetings** del dashboard principal solo muestra Pitches y Mentorship. El componente `BookingsList` (que ya tiene botones Confirmar/Rechazar) está importado en `Dashboard.tsx` pero nunca se renderiza allí; sí aparece en los dashboards de mentor, advisor, investor, student y accelerator.

## Qué se va a hacer

### 1. Las reservas aparecen en la pestaña Meetings
Agregar un bloque "Meeting requests" en la pestaña Meetings del dashboard principal, arriba de Pitches/Mentorship, usando el `BookingsList` existente (mismo estilo de tarjetas del resto). Muestra las solicitudes pendientes con botones **Confirmar** y **Rechazar**, y las confirmadas con botón para unirse a la videollamada.

### 2. Notificación en el perfil
Al crear una reserva, el anfitrión recibe una notificación ("Nueva solicitud de reunión — {nombre} pidió {fecha/hora}") que aparece en la campana de notificaciones del perfil. Al confirmar o rechazar, si quien reservó tiene cuenta en la plataforma, también recibe su notificación.

### 3. Emails
- **Al anfitrión**, apenas llega la solicitud: email con datos del solicitante, fecha, duración, tema y enlace al dashboard para aceptar.
- **Al solicitante**: se mantiene el email actual de "reserva recibida" y el de "reserva confirmada" que ya se envía al confirmar; se agrega el email de "reserva rechazada" al declinar.

## Detalles técnicos

- Nueva Edge Function `notify-booking-request` (service role): recibe el `booking_id`, busca el email/nombre del anfitrión en `auth.users`/perfiles, inserta la fila en `notifications` y llama al envío de email reutilizando la plantilla de `send-booking-email` (nuevo tipo `host_new_request`). Se invoca desde `PublicBooking.tsx` justo después del insert, sin bloquear la confirmación en pantalla.
- `send-booking-email`: agregar los tipos `host_new_request` y `booking_declined` a la plantilla existente.
- Trigger `notify_booking_status_change` sobre `calendar_bookings` (AFTER UPDATE de `status`) que inserta la notificación para `booker_id` cuando existe.
- `useCalendarBookings.updateBookingStatus`: enviar también el email en el caso `cancelled` (declinado).
- `Dashboard.tsx`: renderizar `BookingsList` dentro del `TabsContent value="meetings"`; sin cambios en el diseño existente de Pitches/Mentorship.
