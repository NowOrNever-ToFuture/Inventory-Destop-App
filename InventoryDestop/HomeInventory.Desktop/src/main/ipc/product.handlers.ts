import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type {
  ProductGetAllQueryDto,
  ProductGetAllResponseDto,
  ProductListQueryDto,
  ProductListResponseDto,
  ProductRequestDto,
  ProductResponseDto
} from '@shared/types/dtos/product.dto'
import { ProductUseCases } from '@core/use-cases'
import { SQLiteProductRepository } from '@infrastructure/repositories'

export function registerProductHandlers(ipcMain: IpcMain, db: Database): void {
  const productService = new ProductUseCases(new SQLiteProductRepository(db))

  ipcMain.handle(
    IpcChannels.PRODUCT_GET_ALL,
    async (_event, query?: ProductGetAllQueryDto): Promise<ProductGetAllResponseDto> => {
      return productService.getAllAsync(query)
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCT_GET_LIST,
    async (_event, query?: ProductListQueryDto): Promise<ProductListResponseDto> => {
      return productService.getAllAsync(query)
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCT_GET_BY_ID,
    async (_event, id: string): Promise<ProductResponseDto | null> => {
      return productService.getByIdAsync(id)
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCT_CREATE,
    async (_event, data: ProductRequestDto): Promise<ProductResponseDto> => {
      return productService.createAsync(data)
    }
  )

  ipcMain.handle(
    IpcChannels.PRODUCT_UPDATE,
    async (_event, id: string, data: ProductRequestDto): Promise<ProductResponseDto> => {
      return productService.updateAsync(id, data)
    }
  )

  ipcMain.handle(IpcChannels.PRODUCT_DELETE, async (_event, id: string): Promise<void> => {
    await productService.deleteAsync(id)
  })
}
