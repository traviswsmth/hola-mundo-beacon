const supabase = require('./supabase');

/**
 * Registra un log con timestamp en Supabase.
 * No lanza excepciones para no romper la respuesta al cliente.
 * @param {string} message - Mensaje del log
 * @param {import('express').Request} req - Request de Express (opcional, para extraer metadata)
 * @returns {Promise<{success: boolean, id?: number, error?: string}>}
 */
async function logEvent(message, req = null) {
  const timestamp = new Date().toISOString();
  const endpoint = req ? req.originalUrl || req.path : null;
  const ip = req ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress) : null;
  const userAgent = req ? req.headers['user-agent'] : null;

  const payload = {
    message,
    endpoint,
    ip,
    user_agent: userAgent,
    timestamp, // timestamptz en Supabase; si no se envía, usa default now()
  };

  // Si Supabase no está configurado, solo loguear en consola (modo dev)
  if (!supabase) {
    console.log(`[LOG MOCK] ${timestamp} | ${message} | endpoint=${endpoint} ip=${ip}`);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await supabase.from('logs').insert(payload).select('id').single();

    if (error) {
      console.error('[Logger] Error al insertar en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Logger] Log insertado id=${data?.id} timestamp=${timestamp}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Logger] Excepción:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { logEvent };
