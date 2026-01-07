import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'

let mainWindow: BrowserWindow | null = null

export function initAutoUpdater(window: BrowserWindow) {
  mainWindow = window

  // ログを有効化
  autoUpdater.logger = console

  // 自動ダウンロードを無効化（ユーザーに確認してから）
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

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
        autoUpdater.downloadUpdate()
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
      message: 'アップデートの確認に失敗しました'
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
