// Mirror of supabase/functions/send-product-update/index.ts template (preview only)

const FEATURES = [
  {
    tag: 'RESOURCE MAP',
    title: '66 nuevos recursos globales',
    body: 'Incubadoras, VCs, transferencia tecnológica, grants y coworkings, categorizados por etapa: idea, MVP, validación, lanzamiento y crecimiento. El mapa ahora se centra automáticamente en tus recursos.',
    url: 'https://startupfactoryhub.com/resources',
  },
  {
    tag: 'WORLD ATLAS',
    title: 'Emergency Dashboard en tiempo real',
    body: 'Imágenes satelitales NOAA GOES y NASA GIBS, incendios activos (FIRMS), eventos naturales (EONET), centros de acopio verificados y consejos de seguridad por tipo de desastre.',
    url: 'https://startupfactoryhub.com/emergency',
  },
  {
    tag: 'INITIATIVE',
    title: 'Venezuela Rebuild Initiative',
    body: 'Dashboard dedicado, etiqueta especial en el perfil, filtro en Network y donaciones directas vía Stripe abiertas también a no usuarios.',
    url: 'https://startupfactoryhub.com/venezuela-rebuild',
  },
  {
    tag: 'GENIUS AI',
    title: 'Command Deck y modo pantalla completa',
    body: 'Todas las herramientas en un carrusel, historial, memoria y Genius Deck a pantalla completa. Planes: Free, Starter, Pro y Enterprise.',
    url: 'https://startupfactoryhub.com/dashboard',
  },
  {
    tag: 'LIGHTPAPER',
    title: 'Editor de documentos y PDF',
    body: 'Paginación dinámica ilimitada, edición real de texto (negrita, fuente, tamaño, color, alineación), selector multicromático y búsqueda lateral con resaltado.',
    url: 'https://startupfactoryhub.com/lightpaper',
  },
  {
    tag: 'TOOLS & PERKS',
    title: 'Perks en formato mosaico',
    body: 'Todos los beneficios y descuentos de partners ahora viven en la pestaña Tools, con enlaces de referido activos.',
    url: 'https://startupfactoryhub.com/dashboard?tab=tools',
  },
  {
    tag: 'CRM',
    title: 'Escáner de tarjetas de presentación',
    body: 'Toma una foto y la IA extrae automáticamente los datos de contacto directo a tu CRM.',
    url: 'https://startupfactoryhub.com/dashboard?tab=crm',
  },
  {
    tag: 'MARKETING',
    title: 'Anuncios automáticos y feeds RSS',
    body: 'Publicación automática de nuevas startups en LinkedIn y feeds RSS públicos (startups, blog, eventos) para tus propias automatizaciones.',
    url: 'https://startupfactoryhub.com/marketing',
  },
];

export function generateProductUpdateHtml(name = 'Founder') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novedades en Startup Factory Hub</title>
</head>
<body style="margin:0;padding:0;background:#060b16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060b16;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0b1220;border:1px solid rgba(16,185,129,0.18);border-radius:20px;overflow:hidden;">

  <tr><td style="background:linear-gradient(135deg,#0ea270 0%,#065f46 100%);padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.14);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;padding:6px 16px;border-radius:999px;">PRODUCT UPDATE</div>
    <h1 style="margin:18px 0 6px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">Lo nuevo en Startup Factory Hub</h1>
    <p style="margin:0;color:rgba(255,255,255,0.82);font-size:14px;">Una plataforma más rápida, más global y con más inteligencia</p>
  </td></tr>

  <tr><td style="padding:32px 32px 8px;">
    <p style="margin:0 0 8px;color:#e5e7eb;font-size:16px;line-height:1.6;">Hola ${name},</p>
    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.7;">Hemos lanzado una gran tanda de mejoras en el ecosistema. Este es el resumen de todo lo que ya puedes usar hoy.</p>
  </td></tr>

  ${FEATURES.map((f) => `
  <tr><td style="padding:12px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111a2c;border:1px solid rgba(16,185,129,0.16);border-radius:14px;">
      <tr><td style="padding:20px 22px;">
        <div style="color:#10b981;font-size:10px;font-weight:800;letter-spacing:1.4px;margin-bottom:8px;">${f.tag}</div>
        <div style="color:#f3f4f6;font-size:17px;font-weight:700;margin-bottom:8px;">${f.title}</div>
        <div style="color:#9ca3af;font-size:13.5px;line-height:1.7;">${f.body}</div>
        <div style="margin-top:14px;"><a href="${f.url}" style="color:#10b981;font-size:13px;font-weight:700;text-decoration:none;">Explorar &rarr;</a></div>
      </td></tr>
    </table>
  </td></tr>`).join('')}

  <tr><td style="padding:28px 32px 36px;text-align:center;">
    <a href="https://startupfactoryhub.com" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 38px;border-radius:999px;">Entrar a la plataforma</a>
  </td></tr>

  <tr><td style="background:#070d18;padding:26px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Startup Factory Hub &middot; Construyendo el ecosistema global de startups</p>
    <p style="margin:0;color:#4b5563;font-size:11px;">Recibes este correo porque tienes una cuenta activa en Startup Factory Hub.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
