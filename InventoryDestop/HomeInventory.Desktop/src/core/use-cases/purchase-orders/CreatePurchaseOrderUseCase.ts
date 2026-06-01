import type { PurchaseOrderRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreatePurchaseOrderUseCase extends RepositoryUseCase<PurchaseOrderRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
