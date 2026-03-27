import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { SupplierRequestDto, SupplierResponseDto } from '@shared/types/dtos/supplier.dto'

export const supplierApi = {
  getAll: (): Promise<SupplierResponseDto[]> => ipcRenderer.invoke(IpcChannels.SUPPLIER_GET_ALL),

  create: (data: SupplierRequestDto): Promise<SupplierResponseDto> =>
    ipcRenderer.invoke(IpcChannels.SUPPLIER_CREATE, data),

  update: (id: string, data: SupplierRequestDto): Promise<SupplierResponseDto> =>
    ipcRenderer.invoke(IpcChannels.SUPPLIER_UPDATE, id, data),

  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.SUPPLIER_DELETE, id)
}

export type SupplierApi = typeof supplierApi
