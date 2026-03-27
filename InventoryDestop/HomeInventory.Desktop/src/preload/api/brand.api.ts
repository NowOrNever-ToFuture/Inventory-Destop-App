import { ipcRenderer } from 'electron'
import { IpcChannels } from '@shared/contracts/ipc-channels'
import type { BrandRequestDto, BrandResponseDto } from '@shared/types/dtos/brand.dto'

export const brandApi = {
  getAll: (): Promise<BrandResponseDto[]> => ipcRenderer.invoke(IpcChannels.BRAND_GET_ALL),

  create: (data: BrandRequestDto): Promise<BrandResponseDto> =>
    ipcRenderer.invoke(IpcChannels.BRAND_CREATE, data),

  update: (id: string, data: BrandRequestDto): Promise<BrandResponseDto> =>
    ipcRenderer.invoke(IpcChannels.BRAND_UPDATE, id, data),

  delete: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.BRAND_DELETE, id)
}

export type BrandApi = typeof brandApi
