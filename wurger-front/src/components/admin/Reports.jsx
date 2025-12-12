import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Reports = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [dateRange, setDateRange] = useState({
        start: getLocalDateString(new Date(new Date().setDate(new Date().getDate() - 30))),
        end: getLocalDateString(new Date())
    });

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        try {
            const [salesRes, productsRes] = await Promise.all([
                fetch('http://localhost:8080/api/ventas'),
                fetch('http://localhost:8080/api/productos')
            ]);
            const salesData = await salesRes.json();
            const productsData = await productsRes.json();

            setSales(salesData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const getFilteredSales = () => {
        if (!Array.isArray(sales)) return [];
        return sales.filter(sale => {
            if (!sale || !sale.fecha) return false;
            const saleDate = new Date(sale.fecha);
            if (isNaN(saleDate.getTime())) return false;

            const [startYear, startMonth, startDay] = dateRange.start.split('-').map(Number);
            const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

            const [endYear, endMonth, endDay] = dateRange.end.split('-').map(Number);
            const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

            return saleDate >= startDate && saleDate <= endDate;
        });
    };

    const getTotalRevenue = () => {
        return getFilteredSales().reduce((sum, sale) => {
            const val = parseFloat(sale.totalVenta || sale.total);
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    };

    const getBestSellingProducts = () => {
        const productSales = {};
        const filtered = getFilteredSales();

        filtered.forEach(sale => {
            if (Array.isArray(sale.detalles)) {
                sale.detalles.forEach(detalle => {
                    if (!detalle || !detalle.producto) return;

                    const productId = detalle.producto.id;
                    const productName = detalle.producto.nombreProducto || detalle.producto.nombre || 'Desconocido';

                    if (productId) {
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                name: productName,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        const qty = parseInt(detalle.cantidad) || 0;
                        const sub = parseFloat(detalle.subtotal) || 0;
                        productSales[productId].quantity += qty;
                        productSales[productId].revenue += sub;
                    }
                });
            }
        });

        return Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    };

    const getSalesByStatus = () => {
        const statusCount = {};
        getFilteredSales().forEach(sale => {
            const status = sale.estado || 'Desconocido';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });
        return statusCount;
    };

    const formatCOP = (value) => {
        if (value === null || value === undefined || isNaN(value)) return '$ 0';
        const price = value < 1000 ? value * 1000 : value;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const downloadPDF = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();

            doc.setFontSize(22);
            doc.setTextColor(244, 123, 32);
            doc.text('Reporte de Ventas - Wurger', 15, 25);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 15, 35);

            doc.setFillColor(245, 245, 245);
            doc.rect(15, 45, 180, 20, 'F');
            doc.setFontSize(13);
            doc.setTextColor(40, 40, 40);
            doc.text(`Total Ventas: ${formatCOP(getTotalRevenue())}`, 20, 54);
            doc.text(`Número de Ventas: ${getFilteredSales().length}`, 20, 61);

            doc.setFontSize(16);
            doc.setTextColor(244, 123, 32);
            doc.text('Productos Más Vendidos', 15, 75);

            autoTable(doc, {
                startY: 80,
                head: [['Producto', 'Cantidad Vendida', 'Ingresos']],
                body: getBestSellingProducts().map(p => [
                    p.name,
                    p.quantity,
                    formatCOP(p.revenue)
                ]),
                theme: 'grid',
                headStyles: {
                    fillColor: [244, 123, 32],
                    textColor: [255, 255, 255],
                    fontSize: 11,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                }
            });

            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(16);
            doc.setTextColor(244, 123, 32);
            doc.text('Ventas por Estado', 15, finalY);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Estado', 'Cantidad']],
                body: Object.entries(getSalesByStatus()).map(([status, count]) => [status, count]),
                theme: 'grid',
                headStyles: {
                    fillColor: [244, 123, 32],
                    textColor: [255, 255, 255],
                    fontSize: 11,
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                }
            });

            doc.save(`reporte-ventas-wurger-${dateRange.start}.pdf`);

        } catch (error) {
            console.error('Error completo al generar PDF:', error);
            alert(`Error al generar el PDF: ${error.message}`);
        }
    };

    const downloadExcel = async () => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Ventas');

            try {
                const response = await fetch('/logo.png');
                const blob = await response.blob();
                const reader = new FileReader();
                const base64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.readAsDataURL(blob);
                });

                const logoId = workbook.addImage({
                    base64: base64,
                    extension: 'png',
                });
                worksheet.addImage(logoId, 'A1:B4');
            } catch (e) {
                console.warn('Logo not loaded');
            }

            worksheet.mergeCells('A6:F6');
            worksheet.getCell('A6').value = 'Reporte de Ventas - Wurger';
            worksheet.getCell('A6').font = { size: 16, bold: true, color: { argb: 'FFF47B20' } };
            worksheet.getCell('A6').alignment = { horizontal: 'center' };

            worksheet.mergeCells('A7:F7');
            worksheet.getCell('A7').value = `Período: ${dateRange.start} a ${dateRange.end}`;
            worksheet.getCell('A7').alignment = { horizontal: 'center' };
            worksheet.getCell('A7').font = { size: 11 };

            worksheet.getCell('A9').value = 'Total Ventas:';
            worksheet.getCell('A9').font = { bold: true };
            worksheet.getCell('B9').value = formatCOP(getTotalRevenue());
            worksheet.getCell('A10').value = 'Número de Ventas:';
            worksheet.getCell('A10').font = { bold: true };
            worksheet.getCell('B10').value = getFilteredSales().length;

            worksheet.getCell('A12').value = 'Productos Más Vendidos';
            worksheet.getCell('A12').font = { size: 14, bold: true, color: { argb: 'FFF47B20' } };

            worksheet.getRow(13).values = ['Producto', 'Cantidad', 'Ingresos'];
            worksheet.getRow(13).font = { bold: true };
            worksheet.getRow(13).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF47B20' }
            };
            worksheet.getRow(13).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            let currentRow = 14;
            getBestSellingProducts().forEach(p => {
                worksheet.getRow(currentRow).values = [p.name, p.quantity, formatCOP(p.revenue)];
                currentRow++;
            });

            worksheet.columns.forEach(column => {
                column.width = 25;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `reporte-ventas-wurger-${dateRange.start}.xlsx`);
        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('Error al generar el Excel. Por favor intenta de nuevo.');
        }
    };

    const downloadCSV = () => {
        const filtered = getFilteredSales();
        if (filtered.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Venta,Fecha,Cliente,Estado,Total,Productos\n";

        filtered.forEach(sale => {
            const productos = sale.detalles?.map(d =>
                `${d.cantidad}x ${d.producto?.nombreProducto || 'Producto'}`
            ).join('; ') || '';

            const row = [
                sale.id,
                new Date(sale.fecha).toLocaleDateString(),
                sale.usuario?.email || 'N/A',
                sale.estado,
                (sale.totalVenta || sale.total || 0),
                `"${productos}"`
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_ventas_${dateRange.start}_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredSales = getFilteredSales();
    const totalRevenue = getTotalRevenue();
    const bestSelling = getBestSellingProducts();
    const salesByStatus = getSalesByStatus();

    // Chart configurations - Enhanced with gradients and glow
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#f8f9fa' : '#2B2D42';
    const gridColor = isDarkMode ? 'rgba(255,159,28,0.1)' : 'rgba(0,0,0,0.08)';

    // Chart 1: Sales by Status (Doughnut) - Enhanced
    const statusChartData = {
        labels: Object.keys(salesByStatus),
        datasets: [{
            data: Object.values(salesByStatus),
            backgroundColor: [
                'rgba(16, 185, 129, 0.85)',   // Verde - Completada
                'rgba(245, 158, 11, 0.85)',   // Amarillo - Pendiente
                'rgba(59, 130, 246, 0.85)',   // Azul - En Proceso
                'rgba(239, 68, 68, 0.85)'     // Rojo - Cancelada
            ],
            borderColor: isDarkMode ? [
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(239, 68, 68, 1)'
            ] : [
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 3,
            hoverOffset: 15,
            hoverBorderWidth: 4
        }]
    };

    const statusChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: textColor,
                    padding: 20,
                    font: { size: 13, weight: '600', family: 'Outfit' },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            title: {
                display: true,
                text: 'Distribución de Pedidos por Estado',
                color: textColor,
                font: { size: 18, weight: 'bold', family: 'Outfit' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(20, 25, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: isDarkMode ? 'rgba(255, 159, 28, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                padding: 12,
                boxShadow: isDarkMode ? '0 0 20px rgba(255, 159, 28, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 }
            }
        }
    };

    // Chart 2: Best Selling Products (Bar) - Enhanced with gradient
    const productsChartData = {
        labels: bestSelling.map(p => p.name),
        datasets: [{
            label: 'Cantidad Vendida',
            data: bestSelling.map(p => p.quantity),
            backgroundColor: isDarkMode
                ? 'rgba(255, 159, 28, 0.85)'
                : 'rgba(255, 159, 28, 0.75)',
            borderColor: 'rgba(255, 159, 28, 1)',
            borderWidth: 2,
            borderRadius: 10,
            hoverBackgroundColor: 'rgba(255, 159, 28, 1)',
            hoverBorderWidth: 3
        }]
    };

    const productsChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Top 5 Productos Más Vendidos',
                color: textColor,
                font: { size: 18, weight: 'bold', family: 'Outfit' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(20, 25, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: isDarkMode ? 'rgba(255, 159, 28, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColor,
                    font: { size: 12, weight: '500' }
                },
                grid: {
                    color: gridColor,
                    drawBorder: false
                },
                border: { display: false }
            },
            y: {
                ticks: {
                    color: textColor,
                    font: { size: 12, weight: '600' }
                },
                grid: { display: false },
                border: { display: false }
            }
        }
    };

    // Chart 3: Sales Trend (Line) - Enhanced with gradient fill
    const getSalesTrend = () => {
        const monthlyData = {};
        const months = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            months.push(monthName);
            monthlyData[monthKey] = 0;
        }

        // Aggregate sales by month
        sales.forEach(sale => {
            if (!sale || !sale.fecha) return;
            const saleDate = new Date(sale.fecha);
            const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData.hasOwnProperty(monthKey)) {
                const val = parseFloat(sale.totalVenta || sale.total) || 0;
                monthlyData[monthKey] += val;
            }
        });

        return {
            labels: months,
            values: Object.values(monthlyData)
        };
    };

    const trendData = getSalesTrend();
    const trendChartData = {
        labels: trendData.labels,
        datasets: [{
            label: 'Ventas (COP)',
            data: trendData.values,
            fill: true,
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 350);
                if (isDarkMode) {
                    gradient.addColorStop(0, 'rgba(255, 159, 28, 0.4)');
                    gradient.addColorStop(1, 'rgba(255, 159, 28, 0.05)');
                } else {
                    gradient.addColorStop(0, 'rgba(255, 159, 28, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 159, 28, 0.02)');
                }
                return gradient;
            },
            borderColor: 'rgba(255, 159, 28, 1)',
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 159, 28, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointHoverBackgroundColor: 'rgba(255, 159, 28, 1)',
            pointHoverBorderWidth: 4,
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            shadowBlur: 10,
            shadowColor: isDarkMode ? 'rgba(255, 159, 28, 0.5)' : 'rgba(0, 0, 0, 0.2)'
        }]
    };

    const trendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
        },
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Tendencia de Ventas (Últimos 6 Meses)',
                color: textColor,
                font: { size: 18, weight: 'bold', family: 'Outfit' },
                padding: { bottom: 20 }
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(20, 25, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: isDarkMode ? 'rgba(255, 159, 28, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2,
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (context) => `Ventas: ${formatCOP(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColor,
                    font: { size: 12, weight: '500' }
                },
                grid: {
                    color: gridColor,
                    drawBorder: false
                },
                border: { display: false }
            },
            y: {
                ticks: {
                    color: textColor,
                    font: { size: 12, weight: '500' },
                    callback: (value) => formatCOP(value)
                },
                grid: {
                    color: gridColor,
                    drawBorder: false
                },
                border: { display: false }
            }
        }
    };

    return (
        <div className="container-fluid animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Reportes y Estadísticas</h2>
                <div className="btn-group shadow-sm">
                    <button className="btn btn-danger" onClick={downloadPDF}>
                        <i className="bi bi-file-pdf me-2"></i>PDF
                    </button>
                    <button className="btn btn-success" onClick={downloadExcel}>
                        <i className="bi bi-file-excel me-2"></i>Excel
                    </button>
                    <button className="btn btn-secondary" onClick={downloadCSV}>
                        <i className="bi bi-filetype-csv me-2"></i>CSV
                    </button>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-4 mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label className="form-label small text-muted">Fecha Inicio</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small text-muted">Fecha Fin</label>
                        <input
                            type="date"
                            className="form-control"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <div className="col-md-4">
                        <div className="text-muted small mb-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Filtrando datos por rango de fecha
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4 g-3">
                <div className="col-sm-6 col-xl-3">
                    <div className="glass-card h-100 p-4 text-white bg-primary bg-gradient" style={{ '--glass-bg': 'rgba(255,255,255,0.1)' }}>
                        <h6 className="mb-2 opacity-75 small text-uppercase fw-bold">Total Ventas</h6>
                        <h4 className="mb-0 fw-bold text-nowrap">{formatCOP(totalRevenue)}</h4>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="glass-card h-100 p-4 text-white bg-success bg-gradient" style={{ '--glass-bg': 'rgba(255,255,255,0.1)' }}>
                        <h6 className="mb-2 opacity-75 small text-uppercase fw-bold">Pedidos</h6>
                        <h4 className="mb-0 fw-bold">{filteredSales.length}</h4>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="glass-card h-100 p-4 text-white bg-info bg-gradient" style={{ '--glass-bg': 'rgba(255,255,255,0.1)' }}>
                        <h6 className="mb-2 opacity-75 small text-uppercase fw-bold">Productos</h6>
                        <h4 className="mb-0 fw-bold">{products.length}</h4>
                    </div>
                </div>
                <div className="col-sm-6 col-xl-3">
                    <div className="glass-card h-100 p-4 text-white bg-warning bg-gradient" style={{ '--glass-bg': 'rgba(255,255,255,0.1)' }}>
                        <h6 className="mb-2 opacity-75 small text-uppercase fw-bold">Promedio/Pedido</h6>
                        <h4 className="mb-0 fw-bold text-nowrap">{formatCOP(filteredSales.length > 0 ? (totalRevenue / filteredSales.length) : 0)}</h4>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="row mb-4 g-4">
                <div className="col-lg-8">
                    <div className="glass-panel p-4 rounded-4 h-100">
                        <div style={{ height: '350px' }}>
                            <Line data={trendChartData} options={trendChartOptions} />
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="glass-panel p-4 rounded-4 h-100">
                        <div style={{ height: '350px' }}>
                            <Doughnut data={statusChartData} options={statusChartOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12">
                    <div className="glass-panel p-4 rounded-4">
                        <div style={{ height: '350px' }}>
                            <Bar data={productsChartData} options={productsChartOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-6">
                    <div className="glass-panel p-4 rounded-4 h-100">
                        <h5 className="mb-3 fw-bold">Productos Más Vendidos</h5>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0 rounded-start">Producto</th>
                                        <th className="border-0 text-center">Cant.</th>
                                        <th className="border-0 rounded-end text-end">Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bestSelling.map((product, index) => (
                                        <tr key={index}>
                                            <td className="fw-medium">{product.name}</td>
                                            <td className="text-center">{product.quantity}</td>
                                            <td className="text-end">{formatCOP(product.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="glass-panel p-4 rounded-4 h-100">
                        <h5 className="mb-3 fw-bold">Pedidos por Estado</h5>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="border-0 rounded-start">Estado</th>
                                        <th className="border-0 text-center">Cant.</th>
                                        <th className="border-0 rounded-end text-end">% Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(salesByStatus).map(([status, count]) => (
                                        <tr key={status}>
                                            <td><span className="badge bg-secondary bg-opacity-10 text-body border">{status}</span></td>
                                            <td className="text-center">{count}</td>
                                            <td className="text-end fw-bold">{((count / filteredSales.length) * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
