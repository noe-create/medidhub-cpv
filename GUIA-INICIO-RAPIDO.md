# Guía de Uso - MediHub

## Inicio Rápido 🚀

### Opción 1: Doble Click (RECOMENDADO)

1. **Asegúrate que PostgreSQL esté corriendo**
2. **Doble click en** `Iniciar-MediHub.bat`
3. **¡Listo!** MediHub se abrirá automáticamente

### Opción 2: Línea de Comandos

```bash
npm start
```

Luego abre: `http://localhost:3000`

---

## Archivos Importantes

### `Iniciar-MediHub.bat` ⭐
**Doble click para iniciar MediHub**

Este script:
- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Inicia el servidor de producción
- ✅ Abre el navegador automáticamente
- ✅ Muestra el estado del sistema

### `Detener-MediHub.bat` 🛑
**Doble click para detener MediHub**

Detiene el servidor de forma segura.

---

## Crear Acceso Directo en Escritorio

1. **Click derecho** en `Iniciar-MediHub.bat`
2. Seleccionar **"Enviar a" → "Escritorio (crear acceso directo)"**
3. **Renombrar** el acceso directo a "MediHub"
4. **Click derecho** en el acceso directo → **Propiedades**
5. Click en **"Cambiar icono"**
6. Navegar a: `public\icon-512x512.png`
7. **Aceptar**

Ahora tienes un ícono de MediHub en tu escritorio. ¡Doble click para abrir!

---

## Requisitos Previos

### 1. PostgreSQL
Debe estar instalado y corriendo en `localhost:5432`

**Verificar si está corriendo:**
```bash
# En PowerShell
Get-Process postgres
```

**Iniciar PostgreSQL:**
- Buscar "PostgreSQL" en el menú de inicio
- O usar pgAdmin

### 2. Node.js
Ya instalado (usado para desarrollo)

### 3. Build de Producción
Debe haberse ejecutado al menos una vez:
```bash
npm run build
```

---

## Solución de Problemas

### Error: "PostgreSQL no está corriendo"

**Solución:**
1. Abrir pgAdmin
2. O iniciar PostgreSQL desde Servicios de Windows
3. Volver a ejecutar `Iniciar-MediHub.bat`

### Error: "Puerto 3000 ocupado"

**Solución:**
1. Ejecutar `Detener-MediHub.bat`
2. O cerrar todas las ventanas de Node.js
3. Volver a ejecutar `Iniciar-MediHub.bat`

### El navegador no se abre automáticamente

**Solución:**
Abrir manualmente: `http://localhost:3000`

---

## Uso Diario

### Para Iniciar MediHub
```
1. Doble click en "Iniciar-MediHub.bat"
2. Esperar 8 segundos
3. MediHub se abre automáticamente
```

### Para Cerrar MediHub
```
Opción A: Doble click en "Detener-MediHub.bat"
Opción B: Cerrar la ventana negra del servidor
```

---

## Características

✅ **Inicio automático** - Sin comandos
✅ **Verificación de PostgreSQL** - Detecta si está corriendo
✅ **Apertura automática** - Abre el navegador
✅ **Indicadores visuales** - Muestra el progreso
✅ **Fácil de usar** - Solo doble click

---

## Notas Importantes

> **⚠️ NO CERRAR** la ventana negra mientras uses MediHub

> **✅ RECOMENDACIÓN**: Crear acceso directo en escritorio

> **📌 PUERTO**: El sistema corre en `http://localhost:3000`

---

## Próximos Pasos

1. ✅ Crear acceso directo en escritorio
2. ✅ Probar inicio con doble click
3. ✅ Verificar que todo funcione
4. ✅ ¡Empezar a usar MediHub!
