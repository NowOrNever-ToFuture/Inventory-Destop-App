import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { SupplierRequestDto, SupplierResponseDto } from '@shared/types/dtos/supplier.dto'
import { SupplierService } from '@main/services'

export function registerSupplierHandlers(ipcMain: IpcMain, db: Database): void {
  const supplierService = new SupplierService(db)

  ipcMain.handle(IpcChannels.SUPPLIER_GET_ALL, async (): Promise<SupplierResponseDto[]> => {
    return supplierService.getAllAsync()
  })

  ipcMain.handle(
    IpcChannels.SUPPLIER_CREATE,
    async (_event, data: SupplierRequestDto): Promise<SupplierResponseDto> => {
      return supplierService.createAsync(data)
    }
  )

  ipcMain.handle(
    IpcChannels.SUPPLIER_UPDATE,
    async (_event, id: string, data: SupplierRequestDto): Promise<SupplierResponseDto> => {
      return supplierService.updateAsync(id, data)
    }
  )

  ipcMain.handle(IpcChannels.SUPPLIER_DELETE, async (_event, id: string): Promise<void> => {
    await supplierService.deleteAsync(id)
  })
}
