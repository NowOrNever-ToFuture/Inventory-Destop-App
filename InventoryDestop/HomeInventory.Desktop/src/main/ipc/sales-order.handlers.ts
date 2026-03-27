import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  SalesOrderRequestDto,
  SalesOrderResponseDto
} from '@shared/types/dtos/sales-order.dto'
import { SalesOrderService } from '@main/services'

export function registerSalesOrderHandlers(ipcMain: IpcMain, db: Database): void {
  const salesOrderService = new SalesOrderService(db)

  ipcMain.handle(IpcChannels.SALES_ORDER_GET_ALL, async (): Promise<SalesOrderResponseDto[]> => {
    return salesOrderService.getAllAsync()
  })

  ipcMain.handle(
    IpcChannels.SALES_ORDER_GET_BY_ID,
    async (_event, id: string): Promise<SalesOrderResponseDto | null> => {
      return salesOrderService.getByIdAsync(id)
    }
  )

  ipcMain.handle(
    IpcChannels.SALES_ORDER_CREATE,
    async (_event, data: SalesOrderRequestDto): Promise<SalesOrderResponseDto> => {
      return salesOrderService.createAsync(data)
    }
  )
}
