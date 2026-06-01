import type { SalesOrderRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetByIdSalesOrderUseCase extends RepositoryUseCase<SalesOrderRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getByIdAsync(...args)
  }
}
