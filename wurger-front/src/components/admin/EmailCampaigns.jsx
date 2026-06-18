import { useState, useEffect, useRef } from 'react';

const EmailCampaigns = () => {
    const [recipients, setRecipients] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [selectedPromo, setSelectedPromo] = useState('');
    const [subject, setSubject] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingTargets, setFetchingTargets] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Fetch promotions when loading
    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/promociones');
            if (response.ok) {
                const data = await response.json();
                setPromotions(data);
            }
        } catch (error) {
            console.error('Error fetching promotions:', error);
        }
    };

    const loadRegisteredClients = async () => {
        setFetchingTargets(true);
        setFeedback({ type: '', text: '' });
        try {
            const response = await fetch('http://localhost:8080/api/campanas/destinatarios');
            if (!response.ok) throw new Error('Error al consultar clientes con pedidos');
            const data = await response.json();
            
            // Merge into current list, avoiding duplicates by email
            setRecipients(prev => {
                const existingEmails = new Set(prev.map(r => r.email.toLowerCase()));
                const newTargets = data
                    .filter(item => !existingEmails.has(item.email.toLowerCase()))
                    .map(item => ({
                        ...item,
                        source: 'Registrado'
                    }));
                
                const merged = [...prev, ...newTargets];
                setFeedback({
                    type: 'success',
                    text: `Se cargaron ${newTargets.length} clientes registrados nuevos con pedidos.`
                });
                return merged;
            });
        } catch (error) {
            setFeedback({ type: 'danger', text: error.message });
        } finally {
            setFetchingTargets(false);
        }
    };

    const handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFeedback({ type: '', text: '' });
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/);
                const imported = [];
                let duplicates = 0;

                const existingEmails = new Set(recipients.map(r => r.email.toLowerCase()));

                lines.forEach((line, idx) => {
                    if (!line.trim()) return; // skip empty line
                    const parts = line.split(',');
                    const email = parts[0]?.trim();
                    const nombre = parts[1]?.trim() || 'Cliente';

                    if (email && email.includes('@')) {
                        if (!existingEmails.has(email.toLowerCase())) {
                            imported.push({ email, nombre, source: 'CSV / Archivo' });
                            existingEmails.add(email.toLowerCase());
                        } else {
                            duplicates++;
                        }
                    }
                });

                if (imported.length > 0) {
                    setRecipients(prev => [...prev, ...imported]);
                    setFeedback({
                        type: 'success',
                        text: `Se importaron con éxito ${imported.length} destinatarios del archivo CSV.${duplicates > 0 ? ` Se omitieron ${duplicates} duplicados.` : ''}`
                    });
                } else {
                    setFeedback({
                        type: 'warning',
                        text: 'No se encontraron correos nuevos válidos en el archivo.'
                    });
                }
            } catch (err) {
                setFeedback({ type: 'danger', text: 'Error al procesar el archivo CSV.' });
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // clear input
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const removeRecipient = (emailToRemove) => {
        setRecipients(prev => prev.filter(r => r.email !== emailToRemove));
    };

    const clearAllRecipients = () => {
        setRecipients([]);
        setFeedback({ type: 'info', text: 'Lista de destinatarios limpiada.' });
    };

    const handleSendCampaign = async (e) => {
        e.preventDefault();
        if (recipients.length === 0) {
            setFeedback({ type: 'danger', text: 'Debes añadir al menos un destinatario.' });
            return;
        }

        setLoading(true);
        setFeedback({ type: '', text: '' });

        const payload = {
            destinatarios: recipients.map(({ email, nombre }) => ({ email, nombre })),
            asunto: subject,
            titulo: title,
            mensaje: message,
            idPromocion: selectedPromo ? parseInt(selectedPromo) : null
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

        try {
            const response = await fetch('http://localhost:8080/api/campanas/enviar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const respText = await response.text();
                setFeedback({
                    type: 'success',
                    text: `🎉 ¡Campaña enviada con éxito! ${respText}`
                });
                // Clear fields
                setSubject('');
                setTitle('');
                setMessage('');
                setSelectedPromo('');
            } else {
                const errText = await response.text();
                throw new Error(errText || 'Error al enviar la campaña.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                setFeedback({ 
                    type: 'danger', 
                    text: '⚠️ La petición al servidor excedió el tiempo límite de 8 segundos. Es posible que el servidor intente mandar los correos de forma síncrona y la conexión SMTP esté bloqueada.' 
                });
            } else {
                setFeedback({ type: 'danger', text: 'Error al enviar: ' + error.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid animate-fade-in">
            <div className="d-flex align-items-center mb-4 gap-3">
                <div className="rounded-4 bg-primary bg-opacity-10 text-primary d-flex justify-content-center align-items-center" style={{ width: 52, height: 52 }}>
                    <i className="bi bi-envelope-paper-fill fs-3"></i>
                </div>
                <div>
                    <h2 className="mb-0 fw-bold">Campañas y Envío Masivo</h2>
                    <small className="text-muted">Carga clientes y despacha correos promocionales con estilo premium.</small>
                </div>
            </div>

            {feedback.text && (
                <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-4 border-0 shadow-sm mb-4`} role="alert">
                    <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill' : feedback.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
                    {feedback.text}
                    <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })} aria-label="Close"></button>
                </div>
            )}

            <div className="row g-4">
                {/* Panel Izquierdo: Gestión de Destinatarios */}
                <div className="col-lg-6">
                    <div className="glass-panel rounded-4 p-4 h-100 d-flex flex-column border border-white border-opacity-10 shadow-sm">
                        <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center text-body">
                            <span><i className="bi bi-people-fill text-primary me-2"></i>Destinatarios ({recipients.length})</span>
                            {recipients.length > 0 && (
                                <button className="btn btn-sm btn-outline-danger border-0 rounded-pill" onClick={clearAllRecipients}>
                                    <i className="bi bi-trash-fill me-1"></i> Limpiar Todo
                                </button>
                            )}
                        </h5>

                        {/* Botones de Carga */}
                        <div className="d-flex gap-3 mb-4 flex-wrap">
                            <button 
                                className="btn btn-primary rounded-pill flex-grow-1 px-3 d-flex align-items-center justify-content-center gap-2"
                                onClick={loadRegisteredClients}
                                disabled={fetchingTargets}
                            >
                                {fetchingTargets ? (
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                ) : (
                                    <i className="bi bi-database-fill-down"></i>
                                )}
                                <span>Cargar con Pedidos</span>
                            </button>

                            <button 
                                className="btn btn-outline-secondary rounded-pill flex-grow-1 px-3 d-flex align-items-center justify-content-center gap-2"
                                onClick={triggerFileInput}
                            >
                                <i className="bi bi-file-earmark-spreadsheet"></i>
                                <span>Importar CSV</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept=".csv,.txt" 
                                onChange={handleCsvUpload} 
                            />
                        </div>

                        {/* Tabla de Destinatarios */}
                        <div className="flex-grow-1 overflow-auto rounded-3 border border-secondary-subtle" style={{ maxHeight: '420px', minHeight: '300px' }}>
                            {recipients.length === 0 ? (
                                <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted p-5 bg-light bg-opacity-25">
                                    <i className="bi bi-envelope-open fs-1 mb-3 opacity-50 text-primary"></i>
                                    <p className="mb-1 fw-semibold">No hay destinatarios cargados</p>
                                    <small className="text-center">Carga clientes registrados con pedidos o importa un CSV para empezar.</small>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light sticky-top" style={{ zIndex: 1 }}>
                                            <tr>
                                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Nombre</th>
                                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Email</th>
                                                <th className="border-0 px-4 py-3 text-muted small text-uppercase">Origen</th>
                                                <th className="border-0 px-4 py-3 text-muted small text-uppercase text-end"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recipients.map((r, idx) => (
                                                <tr key={r.email + '-' + idx}>
                                                    <td className="px-4 py-2.5 fw-medium text-body">{r.nombre}</td>
                                                    <td className="px-4 py-2.5 text-muted small">{r.email}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`badge rounded-pill ${r.source === 'Registrado' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'}`}>
                                                            {r.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-end">
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger border-0 p-1"
                                                            onClick={() => removeRecipient(r.email)}
                                                            title="Eliminar de la campaña"
                                                        >
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho: Formulario de Campaña */}
                <div className="col-lg-6">
                    <form onSubmit={handleSendCampaign} className="glass-panel rounded-4 p-4 h-100 d-flex flex-column border border-white border-opacity-10 shadow-sm">
                        <h5 className="fw-bold mb-4 text-body">
                            <i className="bi bi-envelope-check-fill text-primary me-2"></i>Contenido del Correo
                        </h5>

                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1.5">Adjuntar Promoción</label>
                            <select 
                                className="form-select" 
                                value={selectedPromo} 
                                onChange={(e) => setSelectedPromo(e.target.value)}
                            >
                                <option value="">Ninguna promoción (Solo texto)</option>
                                {promotions.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} ({p.tipoDescuento === 'PORCENTAJE' ? `${p.descuento}%` : `$${p.descuento.toLocaleString()} COP`} - {p.producto?.nombreProducto || 'General'})
                                    </option>
                                ))}
                            </select>
                            <div className="form-text small text-muted">
                                Al seleccionar una promoción, se incluirá un recuadro premium resaltado con los detalles del descuento y la imagen del producto.
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1.5">Asunto del Correo *</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ej: ¡Una oferta de Wurger que no podrás rechazar! 🍔"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label small fw-semibold text-muted mb-1.5">Título del Mensaje *</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ej: ¡Prepárate para el fin de semana de sabor!"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="mb-3 flex-grow-1 d-flex flex-column">
                            <label className="form-label small fw-semibold text-muted mb-1.5">Mensaje o Descripción *</label>
                            <textarea 
                                className="form-control flex-grow-1" 
                                rows="6" 
                                placeholder="Escribe el cuerpo del correo de la campaña promocional..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={{ minHeight: '120px' }}
                                required
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary rounded-pill w-100 py-3 shadow-md mt-4 fw-bold hover-scale d-flex align-items-center justify-content-center gap-2"
                            disabled={loading || recipients.length === 0}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                                <i className="bi bi-send-fill"></i>
                            )}
                            <span>Enviar Campaña Masiva</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EmailCampaigns;
