import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  PurchaseOrderRequestDto,
  PurchaseOrderResponseDto
} from '@shared/types/dtos/purchase-order.dto'

export const purchaseOrderApi = {
  getAll: (): Promise<PurchaseOrderResponseDto[]> =>
    ipcRenderer.invoke(IpcChannels.PURCHASE_ORDER_GET_ALL),

  getById: (id: string): Promise<PurchaseOrderResponseDto | null> =>
    ipcRenderer.invoke(IpcChannels.PURCHASE_ORDER_GET_BY_ID, id),

  create: (data: PurchaseOrderRequestDto): Promise<PurchaseOrderResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PURCHASE_ORDER_CREATE, data),

  delete: (id: string): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.PURCHASE_ORDER_DELETE, id)
}

export type PurchaseOrderApi = typeof purchaseOrderApi
