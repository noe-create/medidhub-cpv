# Guía de Instalación para Clientes - MediHub

## Para instalar MediHub en otras computadoras

### Paso 1: Abrir MediHub desde el navegador

1. Abre **Chrome** o **Edge** en la otra computadora
2. En la barra de direcciones escribe:
   ```
   http://192.168.3.89:3000
   ```
3. Presiona **Enter**
4. Verás MediHub funcionando

---

### Paso 2: Instalar como Aplicación (PWA)

#### En Chrome:
1. Busca el **ícono de instalar** en la barra de direcciones (a la derecha)
   - Parece un monitor con una flecha ⬇️
2. Click en el ícono
3. Click en **"Instalar"**
4. ¡Listo! MediHub se instalará como aplicación

#### En Edge:
1. Click en el menú **⋯** (tres puntos) arriba a la derecha
2. Selecciona **"Aplicaciones"**
3. Click en **"Instalar MediHub"**
4. ¡Listo!

---

### Paso 3: Usar MediHub

Después de instalar:

1. **Busca "MediHub"** en la barra de búsqueda de Windows
2. Aparecerá como una aplicación instalada
3. Click para abrir
4. ¡Funciona como cualquier programa!

---

## Ventajas de Instalar como PWA

✅ Aparece en la barra de búsqueda de Windows
✅ Ícono en el menú de inicio
✅ Se abre en su propia ventana (sin barra del navegador)
✅ Funciona offline después de primera carga
✅ Actualizaciones automáticas

---

## Importante

⚠️ **El servidor (tu PC con IP 192.168.3.89) debe estar encendido**

⚠️ **Todas las PCs deben estar en la misma red**

---

## Solución de Problemas

### No aparece el botón de instalar

**Solución:**
1. Asegúrate de estar usando Chrome o Edge
2. Visita la página primero: `http://192.168.3.89:3000`
3. Espera unos segundos
4. El botón debería aparecer

### No puedo acceder a la IP

**Solución:**
1. Verifica que ambas PCs estén en la misma red WiFi
2. En el servidor, ejecuta en PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "MediHub Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

---

## Resumen Rápido

```
1. Abre Chrome/Edge
2. Ve a: http://192.168.3.89:3000
3. Click en ícono de instalar
4. Click en "Instalar"
5. Busca "MediHub" en Windows
6. ¡Listo!
```
