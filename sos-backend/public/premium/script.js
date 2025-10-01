document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const activatePremiumBtn = document.getElementById('activatePremiumBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const statusMessage = document.getElementById('statusMessage');

    // Obtener token de query params si viene desde la app
    const urlParamsApp = new URLSearchParams(window.location.search);
    const tokenFromApp = urlParamsApp.get('token');
    if (tokenFromApp) {
        localStorage.setItem('sos_delivery_token', tokenFromApp);
    }

    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('sos_delivery_token');
    if (!token) {
        // Redirigir al login si no hay token
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }

    // Configurar headers para las peticiones
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Función para mostrar/ocultar loading
    function setLoading(loading) {
        if (loading) {
            loadingOverlay.style.display = 'flex';
        } else {
            loadingOverlay.style.display = 'none';
        }
    }

    // Función para mostrar mensajes de estado
    function showMessage(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'error' : 'success';
        statusMessage.style.display = 'block';

        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    // Función para verificar el estado premium
    async function checkPremiumStatus() {
        try {
            const response = await fetch('/api/premium/status', { headers });
            const data = await response.json();

            if (data.isPremium) {
                // Usuario ya es premium, actualizar UI
                activatePremiumBtn.innerHTML = '<i class="fas fa-crown"></i> ¡Ya eres Premium!';
                activatePremiumBtn.disabled = true;

                // Mostrar fecha de expiración
                if (data.expiresAt) {
                    const expiryDate = new Date(data.expiresAt).toLocaleDateString();
                    document.getElementById('premiumExpiry').textContent = `Válido hasta: ${expiryDate}`;
                    document.getElementById('premiumExpiry').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error verificando estado premium:', error);
        }
    }

    // Manejar clic en el botón de activar premium
    async function handleActivatePremium() {
        try {
            setLoading(true);

            // 1. Crear preferencia de pago en el backend
            const response = await fetch('/api/premium/create-preference', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear la preferencia de pago');
            }

            // 2. Redirigir a MercadoPago
            if (data.init_point) {
                window.location.href = data.init_point;
            } else if (data.preferenceId) {
                // Alternativa si no hay init_point
                window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preferenceId}`;
            }

        } catch (error) {
            console.error('Error al activar premium:', error);
            showMessage(error.message || 'Error al procesar el pago. Intenta nuevamente.', true);
        } finally {
            setLoading(false);
        }
    }

    // Verificar estado premium al cargar la página
    checkPremiumStatus();

    // Agregar manejador de eventos al botón
    if (activatePremiumBtn) {
        activatePremiumBtn.addEventListener('click', handleActivatePremium);
    }

    // Verificar si hay un código de retorno de MercadoPago en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
        setLoading(true);
        fetch(`/api/premium/activate/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage('¡Pago exitoso! Tu cuenta ha sido actualizada a Premium.');
                checkPremiumStatus();
            } else {
                showMessage('Pago exitoso pero hubo un error activando tu cuenta.', true);
            }
        })
        .catch(err => {
            console.error(err);
            showMessage('Error activando tu cuenta premium.', true);
        })
        .finally(() => setLoading(false));
    }
    
});