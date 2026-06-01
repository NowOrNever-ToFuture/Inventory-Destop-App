import type { IpcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { CategoryRequestDto, CategoryResponseDto } from '@shared/types/dtos/category.dto'
import { CategoryUseCases } from '@core/use-cases'
import { SQLiteCategoryRepository } from '@infrastructure/repositories'

export function registerCategoryHandlers(ipcMain: IpcMain, db: Database): void {
  const categoryService = new CategoryUseCases(new SQLiteCategoryRepository(db))

  ipcMain.handle(IpcChannels.CATEGORY_GET_ALL, async (): Promise<CategoryResponseDto[]> => {
    return categoryService.getAllAsync()
  })

  ipcMain.handle(
    IpcChannels.CATEGORY_CREATE,
    async (_event, data: CategoryRequestDto): Promise<CategoryResponseDto> => {
      return categoryService.createAsync(data)
    }
  )

  ipcMain.handle(
    IpcChannels.CATEGORY_UPDATE,
    async (_event, id: string, data: CategoryRequestDto): Promise<CategoryResponseDto> => {
      return categoryService.updateAsync(id, data)
    }
  )

  ipcMain.handle(IpcChannels.CATEGORY_DELETE, async (_event, id: string): Promise<void> => {
    await categoryService.deleteAsync(id)
  })
}
