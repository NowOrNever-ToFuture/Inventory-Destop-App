import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  ProductGetAllQueryDto,
  ProductGetAllResponseDto,
  ProductRequestDto,
  ProductResponseDto,
  ProductListQueryDto,
  ProductListResponseDto
} from '@shared/types/dtos/product.dto'

export const productApi = {
  getAll: (query?: ProductGetAllQueryDto): Promise<ProductGetAllResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_GET_ALL, query),

  getList: (query: ProductListQueryDto): Promise<ProductListResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_GET_LIST, query),

  getById: (id: string): Promise<ProductResponseDto | null> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_GET_BY_ID, id),

  create: (data: ProductRequestDto): Promise<ProductResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_CREATE, data),

  update: (id: string, data: ProductRequestDto): Promise<ProductResponseDto> =>
    ipcRenderer.invoke(IpcChannels.PRODUCT_UPDATE, id, data),

  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PRODUCT_DELETE, id)
}

export type ProductApi = typeof productApi
