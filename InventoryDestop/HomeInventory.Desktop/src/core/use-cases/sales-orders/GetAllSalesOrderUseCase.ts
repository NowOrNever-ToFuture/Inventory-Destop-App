import type { SalesOrderRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetAllSalesOrderUseCase extends RepositoryUseCase<SalesOrderRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getAllAsync(...args)
  }
}
