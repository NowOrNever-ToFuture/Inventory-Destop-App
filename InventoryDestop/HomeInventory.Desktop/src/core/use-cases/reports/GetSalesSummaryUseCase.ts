import type { ReportRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetSalesSummaryUseCase extends RepositoryUseCase<ReportRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getSalesSummaryAsync(...args)
  }
}
