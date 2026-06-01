import type { ReportRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetImportSummaryUseCase extends RepositoryUseCase<ReportRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getImportSummaryAsync(...args)
  }
}
