import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ProductManagement from '../components/admin/ProductManagement';
import OrderManagement from '../components/admin/OrderManagement';
import StockAlerts from '../components/admin/StockAlerts';
import Reports from '../components/admin/Reports';
import UserManagement from '../components/admin/UserManagement';
import PromotionsManagement from '../components/admin/PromotionsManagement';
import ExpensesManagement from '../components/admin/ExpensesManagement';
import CashRegister from '../components/admin/CashRegister';
import EmailCampaigns from '../components/admin/EmailCampaigns';

function Admin() {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [activeView, setActiveView] = useState('products');

    // Prevent back button after logout
    useEffect(() => {
        const handlePopState = () => {
            const storedUser = localStorage.getItem('usuario');
            if (!storedUser) {
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('usuario');

        // Use window.location.replace to avoid adding to history
        window.location.replace('/login');
    };

    const renderView = () => {
        switch (activeView) {
            case 'products': return <ProductManagement />;
            case 'orders': return <OrderManagement />;
            case 'caja': return <CashRegister />;
            case 'expenses': return <ExpensesManagement />;
            case 'stock': return <StockAlerts />;
            case 'reports': return <Reports />;
            case 'users': return <UserManagement />;
            case 'promotions': return <PromotionsManagement />;
            case 'campaigns': return <EmailCampaigns />;
            default: return <ProductManagement />;
        }
    };

    const menuItems = [
        { id: 'products', icon: 'bi-box-seam', label: 'Productos' },
        { id: 'orders', icon: 'bi-cart', label: 'Pedidos' },
        { id: 'caja', icon: 'bi-cash-coin', label: 'Caja POS' },
        { id: 'expenses', icon: 'bi-wallet2', label: 'Gastos' },
        { id: 'stock', icon: 'bi-exclamation-triangle', label: 'Stock' },
        { id: 'reports', icon: 'bi-bar-chart', label: 'Reportes' },
        { id: 'users', icon: 'bi-people', label: 'Usuarios' },
        { id: 'promotions', icon: 'bi-tag', label: 'Promociones' },
        { id: 'campaigns', icon: 'bi-envelope-paper', label: 'Campañas Correo' },
    ];

    return (
        <div className="d-flex min-vh-100">
            {/* Glassmorphism Sidebar */}
            <div className="p-3 d-none d-md-block" style={{ width: '280px', position: 'sticky', top: 0, height: '100vh', zIndex: 1000 }}>
                <div className="glass-panel h-100 rounded-4 p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-4">
                        <img src="/logo.png" alt="Wurger Admin" style={{ height: '45px', marginRight: '12px' }} />
                        <div>
                            <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-color)' }}>Wurger</h5>
                            <small className="text-muted">Admin Panel</small>
                        </div>
                    </div>

                    <nav className="nav nav-pills flex-column gap-2 mb-auto">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-link w-100 text-start d-flex align-items-center p-3 rounded-3 transition-all ${activeView === item.id ? 'active shadow-sm' : 'text-body'}`}
                                onClick={() => setActiveView(item.id)}
                                style={{
                                    background: activeView === item.id ? 'var(--primary-color)' : 'transparent',
                                    color: activeView === item.id ? 'white' : 'inherit'
                                }}
                            >
                                <i className={`bi ${item.icon} me-3 fs-5`}></i>
                                <span className="fw-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto pt-4 border-top border-secondary-subtle">
                        <button
                            className="btn w-100 mb-3 d-flex align-items-center justify-content-center p-2 rounded-3"
                            onClick={toggleTheme}
                            style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-color)' }}
                        >
                            {theme === 'light' ? <><i className="bi bi-moon-stars-fill me-2"></i> Oscuro</> : <><i className="bi bi-sun-fill me-2"></i> Claro</>}
                        </button>
                        <button
                            className="btn btn-outline-danger w-100 rounded-3"
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Salir
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 p-4 overflow-auto">
                {/* Mobile Header */}
                <header className="d-flex d-md-none justify-content-between align-items-center mb-4 glass-panel p-3 rounded-4">
                    <div className="d-flex align-items-center">
                        <img src="/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
                        <span className="fs-5 fw-bold text-primary">Admin</span>
                    </div>
                    <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i>
                    </button>
                </header>

                <div className="animate-fade-in">
                    {renderView()}
                </div>
            </div>
        </div>
    );
}

export default Admin;