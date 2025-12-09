-- Migración: Agregar columna id_promocion a detalle_venta
-- Fecha: 2025-12-09
-- Descripción: Permite rastrear qué promoción se aplicó a cada detalle de venta

USE Wurger;

-- Agregar columna id_promocion (nullable porque no todas las ventas tienen promoción)
ALTER TABLE detalle_venta 
ADD COLUMN id_promocion INT NULL;

-- Agregar foreign key constraint
ALTER TABLE detalle_venta 
ADD CONSTRAINT fk_detalle_venta_promocion 
FOREIGN KEY (id_promocion) REFERENCES promocion(id_promocion)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Verificar que la columna se agregó correctamente
DESCRIBE detalle_venta;
