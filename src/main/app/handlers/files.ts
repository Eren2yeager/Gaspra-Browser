import { ipcMain, dialog, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export function registerFileHandlers() {
  ipcMain.handle('select-file', async (_, options = {}) => {
    console.log('select-file handler called with options:', options)
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: options.filters || [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
          { name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] }
        ],
        ...options
      })
      console.log('select-file dialog result:', result)
      
      if (!result.canceled && result.filePaths.length > 0) {
        // Copy file to user data directory to make it persistent
        const userDataPath = app.getPath('userData')
        const backgroundsDir = path.join(userDataPath, 'backgrounds')
        console.log('select-file userDataPath:', userDataPath)
        console.log('select-file backgroundsDir:', backgroundsDir)
        
        // Create backgrounds directory if it doesn't exist
        if (!fs.existsSync(backgroundsDir)) {
          console.log('select-file creating backgrounds directory')
          fs.mkdirSync(backgroundsDir, { recursive: true })
        }
        
        const originalPath = result.filePaths[0]
        const fileName = path.basename(originalPath)
        const destPath = path.join(backgroundsDir, fileName)
        console.log('select-file originalPath:', originalPath)
        console.log('select-file fileName:', fileName)
        console.log('select-file destPath:', destPath)
        
        // Copy the file
        fs.copyFileSync(originalPath, destPath)
        
        console.log('select-file returning success with destPath:', destPath)
        return { success: true, filePath: destPath }
      }
      
      console.log('select-file canceled')
      return { success: false, canceled: true }
    } catch (error: any) {
      console.error('Error selecting file:', error)
      return { success: false, error: error.message }
    }
  })
}
