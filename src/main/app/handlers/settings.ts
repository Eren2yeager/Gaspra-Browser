import { dialog, ipcMain } from 'electron'
import { dbOperations } from '../../db'

export function registerSettingsHandlers(getMainWindow: () => any) {
  ipcMain.handle('get-settings', () => {
    try {
      const settings = dbOperations.getSettings()
      return { success: true, settings }
    } catch (error: any) {
      console.error('Error getting settings:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-setting', (_event, key: string, value: any) => {
    try {
      dbOperations.updateSetting(key as any, value)
      if (key === 'hardwareAcceleration') {
        const win = getMainWindow()
        if (win) {
          dialog.showMessageBox(win, {
            type: 'info',
            title: 'Restart Required',
            message: 'Hardware acceleration setting has changed. Please restart the browser for the changes to take effect.',
            buttons: ['OK']
          })
        }
      }
      return { success: true }
    } catch (error: any) {
      console.error('Error updating setting:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-settings', (_event, partialSettings: any) => {
    try {
      dbOperations.updateSettings(partialSettings)
      return { success: true }
    } catch (error: any) {
      console.error('Error updating settings:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('reset-settings', () => {
    try {
      dbOperations.resetSettings()
      return { success: true }
    } catch (error: any) {
      console.error('Error resetting settings:', error)
      return { success: false, error: error.message }
    }
  })
}
