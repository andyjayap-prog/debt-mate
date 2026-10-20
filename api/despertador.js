export default async function handler(req, res) {
    // Solo aceptar solicitudes GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            ok: false,
            error: 'Método no permitido'
        });
    }

    // Misma configuración que utiliza Debt Mate
    const SUPABASE_URL =
        'https://izmdeqtzezqhkgfcrqgl.supabase.co';

    const SUPABASE_ANON_KEY =
        'sb_publishable_eR7ts_4u-KFvH6p0BsTRfA_n2RmCCcQ';

    try {
        // Consulta de solo lectura a la tabla de deudas
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/deudas?select=id&limit=1`,
            {
                method: 'GET',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
                },
                signal: AbortSignal.timeout(15000),
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            const detalle = await response.text();

            console.error(
                'Error de Supabase:',
                response.status,
                detalle
            );

            return res.status(502).json({
                ok: false,
                mensaje: 'La consulta a Supabase falló',
                estado: response.status
            });
        }

        console.log(
            'Consulta a Supabase completada:',
            new Date().toISOString()
        );

        return res.status(200).json({
            ok: true,
            mensaje: 'Conexión con Supabase correcta',
            fecha: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error de conexión:', error);

        return res.status(502).json({
            ok: false,
            mensaje: 'No se pudo conectar con Supabase'
        });
    }
}