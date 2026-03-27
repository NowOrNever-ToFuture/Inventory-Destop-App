import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { CategoryRequestDto, CategoryResponseDto } from '@shared/types/dtos/category.dto'

export const categoryApi = {
  getAll: (): Promise<CategoryResponseDto[]> => ipcRenderer.invoke(IpcChannels.CATEGORY_GET_ALL),

  create: (data: CategoryRequestDto): Promise<CategoryResponseDto> =>
    ipcRenderer.invoke(IpcChannels.CATEGORY_CREATE, data),

  update: (id: string, data: CategoryRequestDto): Promise<CategoryResponseDto> =>
    ipcRenderer.invoke(IpcChannels.CATEGORY_UPDATE, id, data),

  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.CATEGORY_DELETE, id)
}

export type CategoryApi = typeof categoryApi
