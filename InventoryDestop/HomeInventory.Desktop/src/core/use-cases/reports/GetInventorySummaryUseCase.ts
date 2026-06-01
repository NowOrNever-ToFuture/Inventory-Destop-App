import type { ReportRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetInventorySummaryUseCase extends RepositoryUseCase<ReportRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getInventorySummaryAsync(...args)
  }
}
