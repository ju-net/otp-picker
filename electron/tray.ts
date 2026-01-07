import { Tray, Menu, nativeImage, app } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let tray: Tray | null = null

export function setupTray(onShow: () => void, onQuit: () => void) {
  // Create a simple icon using nativeImage
  // For production, you'd want to use actual icon files
  const iconSize = process.platform === 'darwin' ? 16 : 24
  const icon = nativeImage.createEmpty()

  // Create a simple template icon for macOS (black with transparency)
  // In production, replace with actual icon file
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, '../build/iconTemplate.png')
    : path.join(__dirname, '../build/icon.png')

  // Use a placeholder icon if the file doesn't exist
  let trayIcon: nativeImage
  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      // Create a simple colored square as fallback
      trayIcon = createFallbackIcon(iconSize)
    }
  } catch {
    trayIcon = createFallbackIcon(iconSize)
  }

  if (process.platform === 'darwin') {
    trayIcon.setTemplateImage(true)
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'OTP Pickerを開く',
      click: onShow,
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.isQuitting = true
        onQuit()
      },
    },
  ])

  tray.setToolTip('OTP Picker')
  tray.setContextMenu(contextMenu)

  // Click to show window on macOS
  tray.on('click', onShow)
}

function createFallbackIcon(size: number): nativeImage {
  // Create a simple 16x16 or 24x24 icon
  // This is a minimal PNG with a key symbol-like shape
  const canvas = Buffer.alloc(size * size * 4)

  // Simple filled circle
  const center = size / 2
  const radius = size / 2 - 1

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4
      const distance = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2))

      if (distance <= radius) {
        // RGBA - black with full opacity for template image
        canvas[index] = 0       // R
        canvas[index + 1] = 0   // G
        canvas[index + 2] = 0   // B
        canvas[index + 3] = 255 // A
      } else {
        // Transparent
        canvas[index] = 0
        canvas[index + 1] = 0
        canvas[index + 2] = 0
        canvas[index + 3] = 0
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}

export function getTray(): Tray | null {
  return tray
}
