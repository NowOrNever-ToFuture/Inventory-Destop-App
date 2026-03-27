import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  SalesOrderRequestDto,
  SalesOrderResponseDto
} from '@shared/types/dtos/sales-order.dto'

export const salesOrderApi = {
  getAll: (): Promise<SalesOrderResponseDto[]> =>
    ipcRenderer.invoke(IpcChannels.SALES_ORDER_GET_ALL),

  getById: (id: string): Promise<SalesOrderResponseDto | null> =>
    ipcRenderer.invoke(IpcChannels.SALES_ORDER_GET_BY_ID, id),

  create: (data: SalesOrderRequestDto): Promise<SalesOrderResponseDto> =>
    ipcRenderer.invoke(IpcChannels.SALES_ORDER_CREATE, data)
}

export type SalesOrderApi = typeof salesOrderApi
