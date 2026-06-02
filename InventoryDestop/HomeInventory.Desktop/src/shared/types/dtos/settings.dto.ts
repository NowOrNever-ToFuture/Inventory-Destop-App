export interface AppSettingsDto {
  storeName: string
  dataPath: string
}

export interface AppSettingUpdateDto {
  key: keyof AppSettingsDto
  value: string
}
