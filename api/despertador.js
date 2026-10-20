export default async function handler(req, res) {
    // Tus credenciales públicas de Supabase
    const SUPABASE_URL = 'https://izmdeqtzezqhkgfcrqgl.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_eR7ts_4u-KFvH6p0BsTRfA_n2RmCCcQ';

    try {
        // Consulta ligera de solo lectura para resetear el reloj de 7 días de Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/deudas?select=id&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            res.status(200).json({ mensaje: '¡Supabase despertado exitosamente! ⏰' });
        } else {
            res.status(500).json({ error: 'Fallo al tocar la puerta de Supabase' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}