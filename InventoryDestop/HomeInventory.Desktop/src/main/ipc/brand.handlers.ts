import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { BrandRequestDto, BrandResponseDto } from '@shared/types/dtos/brand.dto'
import { BrandUseCases } from '@core/use-cases'
import { SQLiteBrandRepository } from '@infrastructure/repositories'

export function registerBrandHandlers(ipcMain: IpcMain, db: Database): void {
  const brandService = new BrandUseCases(new SQLiteBrandRepository(db))

  ipcMain.handle(IpcChannels.BRAND_GET_ALL, async (): Promise<BrandResponseDto[]> => {
    return brandService.getAllAsync()
  })

  ipcMain.handle(
    IpcChannels.BRAND_CREATE,
    async (_event, data: BrandRequestDto): Promise<BrandResponseDto> => {
      return brandService.createAsync(data)
    }
  )

  ipcMain.handle(
    IpcChannels.BRAND_UPDATE,
    async (_event, id: string, data: BrandRequestDto): Promise<BrandResponseDto> => {
      return brandService.updateAsync(id, data)
    }
  )

  ipcMain.handle(IpcChannels.BRAND_DELETE, async (_event, id: string): Promise<void> => {
    await brandService.deleteAsync(id)
  })
}
