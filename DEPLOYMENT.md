# MediHub - Guía de Despliegue en Producción

## Requisitos Previos

- Node.js instalado
- PostgreSQL corriendo en localhost:5432
- Base de datos `medihub` creada

## Pasos para Despliegue

### 1. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias incluyendo `next-pwa` y `cross-env`.

### 2. Construir la Aplicación

```bash
npm run build
```

Este comando:
- Compila la aplicación para producción
- Optimiza el código
- Genera el Service Worker para PWA
- Crea archivos estáticos optimizados

**Nota**: Solo necesitas hacer build cuando cambies el código.

### 3. Iniciar el Servidor de Producción

```bash
npm start
```

O para forzar modo producción:

```bash
npm run start:prod
```

El servidor estará disponible en: `http://localhost:3000`

## Diferencias: Desarrollo vs Producción

### Modo Desarrollo (`npm run dev`)
- ❌ Más lento
- ❌ Archivos sin optimizar
- ❌ Hot reload (recarga automática)
- ✅ Mejor para desarrollo

### Modo Producción (`npm start`)
- ✅ **3-5x más rápido**
- ✅ Archivos optimizados y comprimidos
- ✅ PWA habilitado (funciona offline)
- ✅ Menor uso de memoria
- ✅ **RECOMENDADO para uso diario**

## Características PWA

Una vez en producción, la aplicación:

1. **Funciona Offline** - Después de la primera carga
2. **Es Instalable** - Puede instalarse como app de escritorio
3. **Actualiza Automáticamente** - Caché inteligente de recursos

### Instalar como App de Escritorio

1. Abre `http://localhost:3000` en Chrome/Edge
2. Busca el ícono de "Instalar" en la barra de direcciones
3. Click en "Instalar MediHub"
4. La app se abrirá en su propia ventana

## Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo

# Producción
npm run build            # Construir aplicación
npm run build:prod       # Construir con NODE_ENV=production
npm start                # Iniciar servidor de producción
npm run start:prod       # Iniciar con NODE_ENV=production

# Utilidades
npm run lint             # Verificar código
npm run typecheck        # Verificar tipos TypeScript
```

## Variables de Entorno

El sistema usa dos archivos:

- `.env` - Para desarrollo
- `.env.production` - Para producción

Ambos contienen las mismas credenciales actualmente.

## Solución de Problemas

### Error al hacer build

```bash
# Limpiar caché y reinstalar
rm -rf .next node_modules
npm install
npm run build
```

### Puerto 3000 ocupado

```bash
# Cambiar puerto en package.json
"start": "next start -p 3001"
```

### Base de datos no conecta

Verificar que PostgreSQL esté corriendo:
```bash
# En otra terminal
psql -U postgres -d medihub
```

## Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# 1. Detener el servidor (Ctrl+C)
# 2. Reconstruir
npm run build
# 3. Reiniciar
npm start
```

## Recomendación Final

**Para uso diario del sistema, usa siempre:**

```bash
npm run build  # Solo cuando cambies código
npm start      # Para iniciar el servidor
```

Esto te dará el mejor rendimiento y todas las características offline.
