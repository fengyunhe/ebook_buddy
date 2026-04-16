import { Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron'

export function createContextMenuTemplate(onCapture: () => void, onCaptureMultiple: (count: number) => void, maxPages: number): MenuItemConstructorOptions[] {
  const menuItems: MenuItemConstructorOptions[] = [
    {
      label: 'Add Current Page',
      click: () => {
        console.log('Add to AI Chat clicked')
        onCapture()
      }
    }
  ]
  
  if (maxPages > 1) {
    menuItems.push({
      label: `Add ${maxPages} Pages (from current page)`,
      click: () => {
        console.log('Add multiple pages clicked:', maxPages)
        onCaptureMultiple(maxPages)
      }
    })
  }
  
  menuItems.push(
    { type: 'separator' },
    {
      label: 'Copy',
      role: 'copy'
    },
    {
      label: 'Select All',
      role: 'selectAll'
    }
  )
  
  return menuItems
}