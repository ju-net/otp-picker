import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app, shell } from 'electron'

let mainWindow: BrowserWindow | null = null
const RELEASES_URL = 'https://github.com/ju-net/otp-picker/releases/latest'

export function initAutoUpdater(window: BrowserWindow) {
  mainWindow = window

  // ログを有効化（詳細レベル）
  autoUpdater.logger = console
  autoUpdater.logger.transports = ['console']

  // 自動ダウンロードを無効化（ユーザーに確認してから）
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  console.log('=== Auto Updater Initialized ===')
  console.log('Current version:', app.getVersion())
  console.log('Platform:', process.platform)

  // アップデートが利用可能
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)

    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'アップデートが利用可能',
      message: `新しいバージョン ${info.version} が利用可能です。ダウンロードしますか？`,
      buttons: ['ダウンロード', '後で'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        console.log('Starting download...')
        autoUpdater.downloadUpdate().then(() => {
          console.log('Download started successfully')
        }).catch((err) => {
          console.error('Download failed to start:', err)
        })
        mainWindow?.webContents.send('update-status', {
          status: 'downloading',
          message: 'アップデートをダウンロード中...'
        })
      }
    })
  })

  // アップデートがない
  autoUpdater.on('update-not-available', () => {
    console.log('No update available')
  })

  // ダウンロード進捗
  autoUpdater.on('download-progress', (progress) => {
    console.log(`Download progress: ${progress.percent.toFixed(1)}%`)
    mainWindow?.webContents.send('update-status', {
      status: 'downloading',
      percent: progress.percent,
      message: `ダウンロード中... ${progress.percent.toFixed(0)}%`
    })
  })

  // ダウンロード完了
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)

    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'アップデート準備完了',
      message: `バージョン ${info.version} のインストール準備ができました。アプリを再起動してインストールしますか？`,
      buttons: ['今すぐ再起動', '後で'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  // エラー
  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error)
    mainWindow?.webContents.send('update-status', {
      status: 'error',
      message: 'アップデートに失敗しました'
    })

    // エラー時はダウンロードページを開くオプションを表示
    dialog.showMessageBox(mainWindow!, {
      type: 'error',
      title: 'アップデートエラー',
      message: '自動アップデートに失敗しました。\n\n手動でダウンロードページを開きますか？',
      detail: error.message,
      buttons: ['ダウンロードページを開く', '閉じる'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        shell.openExternal(RELEASES_URL)
      }
    })
  })
}

export function checkForUpdates() {
  // 開発モードではスキップ
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    console.log('Skipping update check in development mode')
    return
  }

  autoUpdater.checkForUpdates()
}

export function getAppVersion() {
  return app.getVersion()
}
