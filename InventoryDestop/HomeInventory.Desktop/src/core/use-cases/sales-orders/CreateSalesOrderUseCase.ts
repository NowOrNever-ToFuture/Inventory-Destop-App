import type { SalesOrderRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreateSalesOrderUseCase extends RepositoryUseCase<SalesOrderRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
