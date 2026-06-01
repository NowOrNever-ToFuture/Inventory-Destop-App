import type { ReportRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetTopImportedItemsUseCase extends RepositoryUseCase<ReportRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getTopImportedItemsAsync(...args)
  }
}
