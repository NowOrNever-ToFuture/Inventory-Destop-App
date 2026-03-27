import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  PurchaseOrderRequestDto,
  PurchaseOrderResponseDto
} from '@shared/types/dtos/purchase-order.dto'
import { PurchaseOrderService } from '@main/services'

export function registerPurchaseOrderHandlers(ipcMain: IpcMain, db: Database): void {
  const purchaseOrderService = new PurchaseOrderService(db)

  ipcMain.handle(
    IpcChannels.PURCHASE_ORDER_GET_ALL,
    async (): Promise<PurchaseOrderResponseDto[]> => {
      return purchaseOrderService.getAllAsync()
    }
  )

  ipcMain.handle(
    IpcChannels.PURCHASE_ORDER_GET_BY_ID,
    async (_event, id: string): Promise<PurchaseOrderResponseDto | null> => {
      return purchaseOrderService.getByIdAsync(id)
    }
  )

  ipcMain.handle(
    IpcChannels.PURCHASE_ORDER_CREATE,
    async (_event, data: PurchaseOrderRequestDto): Promise<PurchaseOrderResponseDto> => {
      return purchaseOrderService.createAsync(data)
    }
  )
}
