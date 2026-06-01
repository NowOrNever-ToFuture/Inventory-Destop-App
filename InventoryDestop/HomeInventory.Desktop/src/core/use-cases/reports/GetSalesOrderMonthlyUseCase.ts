import type { ReportRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetSalesOrderMonthlyUseCase extends RepositoryUseCase<ReportRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getSalesOrderMonthlyAsync(...args)
  }
}
