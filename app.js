window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
        appId: "ec3c1a35-8b23-4922-8ac0-c24057ea59ef",
    });
});

const SUPABASE_URL = 'https://izmdeqtzezqhkgfcrqgl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eR7ts_4u-KFvH6p0BsTRfA_n2RmCCcQ';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔒 CONFIGURACIÓN DE PINES DE SEGURIDAD
const PIN_ANDY = "1020";
const PIN_VICTORIA = "3040";

let usuarioActivo = localStorage.getItem('debt_mate_user') || 'Familia';
let deudasGlobales = [];

// 💰 NUEVA FUNCIÓN: Traductor de formato de moneda (Ej: 20.345,23)
function formatearNumero(valor) {
    return Number(valor).toLocaleString('es-ES', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

function obtenerPrimeraFechaPago(diaPago) {
    const hoy = new Date();
    let mes = hoy.getMonth();
    let anio = hoy.getFullYear();
    if (hoy.getDate() > diaPago) {
        mes++;
        if (mes > 11) { mes = 0; anio++; }
    }
    let d = new Date(anio, mes, diaPago);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
}

function obtenerSiguienteMes(fechaAnteriorISO, diaPago) {
    const f = new Date(fechaAnteriorISO + "T00:00:00");
    let mes = f.getMonth() + 1; 
    let anio = f.getFullYear();
    if (mes > 11) { mes = 0; anio++; }
    let d = new Date(anio, mes, diaPago);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
}

function activarNotificaciones(usuario) {
    window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.User.addTag("perfil", usuario); 
        await OneSignal.Notifications.requestPermission(); 
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('OneSignalSDKWorker.js').catch(err => console.log(err));
    }

    const userButtons = document.querySelectorAll('.btn-user');
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const userGreeting = document.getElementById('user-greeting');
    const btnLogout = document.getElementById('btn-logout');
    
    const btnNewDebt = document.getElementById('btn-new-debt');
    const modalNewDebt = document.getElementById('modal-new-debt');
    const closeModal = document.getElementById('close-modal');
    const formNewDebt = document.getElementById('form-new-debt');
    
    const modalEditDebt = document.getElementById('modal-edit-debt');
    const closeEditModal = document.getElementById('close-edit-modal');
    const formEditDebt = document.getElementById('form-edit-debt');

    const btnHistorial = document.getElementById('btn-historial');
    const modalHistorial = document.getElementById('modal-historial');
    const closeHistorial = document.getElementById('close-historial');

    ['input-nombre', 'edit-nombre'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
    });

    if (localStorage.getItem('debt_mate_user')) {
        usuarioActivo = localStorage.getItem('debt_mate_user');
        userGreeting.textContent = `Hola, ${usuarioActivo}`;
        loginScreen.classList.remove('active');
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        dashboardScreen.classList.add('active');
        activarNotificaciones(usuarioActivo);
        await cargarDeudasDesdeSupabase();
    }

    // 🌟 SISTEMA DE CAJÓN DE SEGURIDAD
    userButtons.forEach(button => {
        button.addEventListener('click', () => {
            const usuarioSeleccionado = button.getAttribute('data-user');
            const drawer = document.getElementById(`drawer-${usuarioSeleccionado}`);
            const input = document.getElementById(`pin-${usuarioSeleccionado}`);
            
            document.querySelectorAll('.pin-drawer').forEach(d => {
                if (d !== drawer) {
                    d.classList.remove('active');
                    const otherInput = d.querySelector('.pin-input');
                    if(otherInput) otherInput.value = '';
                }
            });

            drawer.classList.toggle('active');
            
            if (drawer.classList.contains('active')) {
                setTimeout(() => input.focus(), 350);
            } else {
                input.value = '';
            }
        });
    });

    // 🌟 EVALUADOR AUTOMÁTICO DEL PIN AL 4TO DÍGITO
    document.querySelectorAll('.pin-input').forEach(input => {
        input.addEventListener('input', async (e) => {
            const usuario = input.id.split('-')[1]; 
            const lockIcon = document.getElementById(`lock-${usuario}`);
            const drawer = document.getElementById(`drawer-${usuario}`);
            const pinCorrecto = usuario === 'Andy' ? PIN_ANDY : PIN_VICTORIA;

            input.value = input.value.replace(/[^0-9]/g, '');

            if (input.value.length === 4) {
                input.blur(); 

                if (input.value === pinCorrecto) {
                    lockIcon.textContent = "🔓";
                    lockIcon.classList.add('success');
                    input.style.borderColor = "#2ECC71";
                    input.style.color = "#2ECC71";

                    setTimeout(async () => {
                        usuarioActivo = usuario;
                        localStorage.setItem('debt_mate_user', usuarioActivo);
                        userGreeting.textContent = `Hola, ${usuarioActivo}`;
                        loginScreen.classList.remove('active');
                        loginScreen.classList.add('hidden');
                        dashboardScreen.classList.remove('hidden');
                        dashboardScreen.classList.add('active');
                        activarNotificaciones(usuarioActivo);
                        await cargarDeudasDesdeSupabase();
                        
                        drawer.classList.remove('active');
                        input.value = '';
                        lockIcon.textContent = "🔒";
                        lockIcon.classList.remove('success');
                        input.style.borderColor = "";
                        input.style.color = "";
                    }, 600);

                } else {
                    lockIcon.textContent = "🛑";
                    drawer.classList.add('shake');
                    input.style.borderColor = "#E74C3C";
                    input.style.color = "#E74C3C";

                    setTimeout(() => {
                        drawer.classList.remove('shake');
                        input.value = '';
                        lockIcon.textContent = "🔒";
                        input.style.borderColor = "#0B2B5E";
                        input.style.color = "#0B2B5E";
                        input.focus(); 
                    }, 600);
                }
            }
        });
    });

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('debt_mate_user');
            dashboardScreen.classList.remove('active');
            dashboardScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            loginScreen.classList.add('active');
        });
    }

    if (btnNewDebt) { btnNewDebt.addEventListener('click', () => { modalNewDebt.classList.remove('hidden'); }); }
    if (closeModal) { closeModal.addEventListener('click', () => { modalNewDebt.classList.add('hidden'); }); }
    if (closeEditModal) { closeEditModal.addEventListener('click', () => { modalEditDebt.classList.add('hidden'); }); }
    if (btnHistorial) { btnHistorial.addEventListener('click', async () => { modalHistorial.classList.remove('hidden'); await cargarHistorial(); }); }
    if (closeHistorial) { closeHistorial.addEventListener('click', () => { modalHistorial.classList.add('hidden'); }); }

    if (formNewDebt) {
        formNewDebt.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const nombre = document.getElementById('input-nombre').value.toUpperCase();
            const montoOriginal = parseFloat(document.getElementById('input-monto-original').value);
            const saldoActual = parseFloat(document.getElementById('input-saldo-actual').value);
            const cuotasTotales = parseInt(document.getElementById('input-cuotas-totales').value);
            const cuotasPagadas = parseInt(document.getElementById('input-cuotas-pagadas').value);
            const valorCuota = parseFloat(document.getElementById('input-valor').value);
            const dia = parseInt(document.getElementById('input-dia').value);

            const fechaPrimera = obtenerPrimeraFechaPago(dia);

            const { error } = await supabaseClient
                .from('deudas')
                .insert([{ 
                    nombre_deuda: nombre, 
                    monto_inicial: montoOriginal, 
                    saldo_pendiente: saldoActual, 
                    cuotas_totales: cuotasTotales, 
                    cuotas_pagadas: cuotasPagadas,
                    valor_cuota: valorCuota, 
                    dia_pago: dia,
                    fecha_proximo_pago: fechaPrimera
                }]);

            if (error) {
                alert('Error al guardar: ' + error.message);
            } else {
                modalNewDebt.classList.add('hidden'); 
                formNewDebt.reset(); 
                await cargarDeudasDesdeSupabase(); 
            }
        });
    }

    if (formEditDebt) {
        formEditDebt.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const id = document.getElementById('edit-id').value;
            const nombre = document.getElementById('edit-nombre').value.toUpperCase();
            const montoOriginal = parseFloat(document.getElementById('edit-monto-original').value);
            const saldoActual = parseFloat(document.getElementById('edit-saldo-actual').value);
            const cuotasTotales = parseInt(document.getElementById('edit-cuotas-totales').value);
            const cuotasPagadas = parseInt(document.getElementById('edit-cuotas-pagadas').value);
            const valorCuota = parseFloat(document.getElementById('edit-valor').value);
            const dia = parseInt(document.getElementById('edit-dia').value);

            const nuevaFechaProximo = obtenerPrimeraFechaPago(dia);

            const { error } = await supabaseClient
                .from('deudas')
                .update({ 
                    nombre_deuda: nombre, 
                    monto_inicial: montoOriginal, 
                    saldo_pendiente: saldoActual, 
                    cuotas_totales: cuotasTotales, 
                    cuotas_pagadas: cuotasPagadas,
                    valor_cuota: valorCuota, 
                    dia_pago: dia,
                    fecha_proximo_pago: nuevaFechaProximo
                })
                .eq('id', id);

            if (error) {
                alert('Error al guardar cambios: ' + error.message);
            } else {
                modalEditDebt.classList.add('hidden'); 
                alert('Deuda corregida exitosamente.');
                await cargarDeudasDesdeSupabase(); 
            }
        });
    }
});

window.toggleSettings = function(id) {
    const menus = document.querySelectorAll('.settings-menu');
    menus.forEach(menu => {
        if(menu.id !== 'menu-' + id) menu.classList.remove('active');
    });
    const menuActual = document.getElementById('menu-' + id);
    menuActual.classList.toggle('active');
};

window.abrirModalEditar = function(id) {
    const deuda = deudasGlobales.find(d => d.id == id);
    if (!deuda) return;
    
    document.getElementById('edit-id').value = deuda.id;
    document.getElementById('edit-nombre').value = deuda.nombre_deuda;
    document.getElementById('edit-monto-original').value = deuda.monto_inicial;
    document.getElementById('edit-saldo-actual').value = deuda.saldo_pendiente;
    document.getElementById('edit-cuotas-totales').value = deuda.cuotas_totales;
    document.getElementById('edit-cuotas-pagadas').value = deuda.cuotas_pagadas;
    document.getElementById('edit-valor').value = deuda.valor_cuota;
    document.getElementById('edit-dia').value = deuda.dia_pago;

    document.getElementById('menu-' + id).classList.remove('active');
    document.getElementById('modal-edit-debt').classList.remove('hidden');
};

window.eliminarDeuda = async function(id) {
    const deuda = deudasGlobales.find(d => d.id == id);
    if (!deuda) return;

    const confirmar = confirm(`¿ESTÁS SEGURO? 🗑️\nEstás a punto de borrar la deuda "${deuda.nombre_deuda}" de la aplicación.\n\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    document.getElementById('menu-' + id).classList.remove('active');

    const { error } = await supabaseClient.from('deudas').delete().eq('id', id);
    if (error) {
        alert("Error al eliminar: " + error.message);
    } else {
        await cargarDeudasDesdeSupabase();
    }
};

window.registrarPago = async function(idDeuda) {
    const deuda = deudasGlobales.find(d => d.id == idDeuda);
    if (!deuda) return;

    const confirmar = confirm(`¿Confirmas el pago de $${formatearNumero(deuda.valor_cuota)} para la deuda "${deuda.nombre_deuda}"?`);
    if (!confirmar) return; 

    let nuevoSaldo = deuda.saldo_pendiente - deuda.valor_cuota;
    if (nuevoSaldo < 0) nuevoSaldo = 0; 
    let nuevasCuotasPagadas = (deuda.cuotas_pagadas || 0) + 1;
    let nuevaFechaProximo = obtenerSiguienteMes(deuda.fecha_proximo_pago || obtenerPrimeraFechaPago(deuda.dia_pago), deuda.dia_pago);

    const { error: errorPago } = await supabaseClient
        .from('deudas')
        .update({ 
            saldo_pendiente: nuevoSaldo,
            cuotas_pagadas: nuevasCuotasPagadas,
            fecha_proximo_pago: nuevaFechaProximo
        })
        .eq('id', idDeuda); 

    if (errorPago) {
        alert('Error al procesar el pago: ' + errorPago.message);
        return;
    }

    await supabaseClient
        .from('historial_pagos')
        .insert([{ nombre_deuda: deuda.nombre_deuda, monto_pagado: deuda.valor_cuota, pagado_por: usuarioActivo }]);

    alert(`¡Pago registrado! 🎉 La alerta ha sido desactivada por este mes.`);
    await cargarDeudasDesdeSupabase(); 
};

async function cargarDeudasDesdeSupabase() {
    const totalDebtAmount = document.getElementById('total-debt-amount');
    const debtList = document.getElementById('debt-list');
    const alertStatus = document.getElementById('alert-status');

    const { data: deudas, error } = await supabaseClient
        .from('deudas')
        .select('*')
        .order('id', { ascending: true });

    if (error) { return; }

    deudasGlobales = deudas; 

    if (!deudas || deudas.length === 0) {
        totalDebtAmount.textContent = "$ 0,00";
        debtList.innerHTML = '<p style="color: #666; text-align: center;">No hay deudas registradas aún.</p>';
        alertStatus.textContent = "● Al día";
        alertStatus.style.backgroundColor = "rgba(46, 204, 113, 0.2)";
        alertStatus.style.color = "#2ECC71";
        return;
    }

    let sumaTotal = 0;
    let hayAlertas = false;
    debtList.innerHTML = '';

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    deudas.forEach(deuda => {
        sumaTotal += Number(deuda.saldo_pendiente);

        let cuotasTotales = deuda.cuotas_totales;
        let cuotasPagadas = deuda.cuotas_pagadas || 0;
        let cuotasRestantes = cuotasTotales - cuotasPagadas;

        let fechaProximoISO = deuda.fecha_proximo_pago || obtenerPrimeraFechaPago(deuda.dia_pago);
        let fechaProximoObj = new Date(fechaProximoISO + "T00:00:00");
        let diasRestantes = Math.ceil((fechaProximoObj - hoy) / (1000 * 60 * 60 * 24));

        let claseTarjeta = "debt-card";
        let estadoPagoHtml = "";
        let disabledBtn = "";
        let styleBtn = "";

        if (cuotasRestantes <= 0) {
            estadoPagoHtml = `<br><span style="color: #2ECC71; font-weight: bold;">✅ ¡Deuda pagada en su totalidad!</span>`;
            disabledBtn = "disabled";
            styleBtn = "background-color: #EEEEEE; color: #999999; border: none; cursor: not-allowed;";
        } else {
            if (diasRestantes < 0) {
                claseTarjeta = "debt-card warning";
                estadoPagoHtml = `<br><strong style="color: #E74C3C; font-size: 13px;">🚨 ¡Atrasado! Debió pagarse el ${fechaProximoObj.getDate()} de ${fechaProximoObj.toLocaleString('es-ES', {month:'short'})}</strong>`;
                hayAlertas = true;
            } else if (diasRestantes <= 3) {
                claseTarjeta = "debt-card warning";
                estadoPagoHtml = `<br><strong style="color: #E74C3C; font-size: 13px;">⚠️ ¡Vence pronto! (${fechaProximoObj.getDate()} de ${fechaProximoObj.toLocaleString('es-ES', {month:'short'})})</strong>`;
                hayAlertas = true;
            } else {
                estadoPagoHtml = `<br><span style="color: #2ECC71; font-size: 13px; font-weight: bold;">✅ Al día (Siguiente cobro: ${fechaProximoObj.getDate()} de ${fechaProximoObj.toLocaleString('es-ES', {month:'short'})})</span>`;
            }
        }

        let fechaFinText = "";
        if (cuotasRestantes > 0) {
            let fFin = new Date(fechaProximoObj);
            fFin.setMonth(fFin.getMonth() + cuotasRestantes - 1);
            fechaFinText = `<br><span style="color: #666; font-size: 12px;">🏁 Terminas en: <strong>${fFin.toLocaleString('es-ES', {month:'long', year:'numeric'})}</strong></span>`;
        }

        debtList.innerHTML += `
            <div class="${claseTarjeta}">
                <div style="position: absolute; top: 15px; right: 15px;">
                    <button onclick="toggleSettings('${deuda.id}')" style="background:none; border:none; font-size:18px; cursor:pointer; color: #999;">⚙️</button>
                    <div id="menu-${deuda.id}" class="settings-menu">
                        <button onclick="abrirModalEditar('${deuda.id}')" style="color: var(--primary-blue);">✏️ Editar</button>
                        <button onclick="eliminarDeuda('${deuda.id}')" style="color: #E74C3C;">🗑️ Eliminar</button>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; padding-right: 30px;">
                    <strong style="color: #0B2B5E; font-size: 16px;">${deuda.nombre_deuda}</strong>
                    <span style="background: rgba(11, 43, 94, 0.1); color: var(--primary-blue); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                        Cuotas: ${cuotasPagadas} de ${cuotasTotales}
                    </span>
                </div>
                <span style="color: #666666; font-size: 14px;">Saldo actual: $ ${formatearNumero(deuda.saldo_pendiente)}</span>
                <span style="color: #B0B0B0; font-size: 11px; display: block;">(Monto original: $ ${formatearNumero(deuda.monto_inicial)})</span>
                ${estadoPagoHtml}
                ${fechaFinText}
                <button class="btn-pay" style="${styleBtn}" ${disabledBtn} onclick="registrarPago('${deuda.id}')">
                    ✅ Pagar Cuota ($${formatearNumero(deuda.valor_cuota)})
                </button>
            </div>
        `;
    });

    totalDebtAmount.textContent = `$ ${formatearNumero(sumaTotal)}`;
    
    if (hayAlertas) {
        alertStatus.textContent = "● Pagos cercanos";
        alertStatus.style.backgroundColor = "rgba(231, 76, 60, 0.2)";
        alertStatus.style.color = "#E74C3C";
    } else {
        alertStatus.textContent = "● Al día";
        alertStatus.style.backgroundColor = "rgba(46, 204, 113, 0.2)";
        alertStatus.style.color = "#2ECC71";
    }
}

async function cargarHistorial() {
    const listaHistorial = document.getElementById('lista-historial');
    listaHistorial.innerHTML = '<p style="text-align: center; color: #666;">Cargando...</p>';
    const { data: pagos, error } = await supabaseClient.from('historial_pagos').select('*').order('fecha', { ascending: false });

    if (error) { listaHistorial.innerHTML = '<p style="color: red;">Error al cargar.</p>'; return; }
    if (!pagos || pagos.length === 0) { listaHistorial.innerHTML = '<p style="text-align: center; color: #666; margin-top: 15px;">Aún no hay pagos.</p>'; return; }

    listaHistorial.innerHTML = '';
    pagos.forEach(pago => {
        const fechaForm = new Date(pago.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const nombrePagador = pago.pagado_por ? pago.pagado_por : 'Familia';

        listaHistorial.innerHTML += `
            <div class="historial-item">
                <div>
                    <strong style="color: #1A1A1A;">${pago.nombre_deuda}</strong><br>
                    <span class="historial-fecha">${fechaForm}</span><br>
                    <span style="color: var(--primary-blue); font-size: 12px; font-weight: bold;">👤 Pagado por: ${nombrePagador}</span>
                </div>
                <div class="historial-monto">+$${formatearNumero(pago.monto_pagado)}</div>
            </div>`;
    });
}