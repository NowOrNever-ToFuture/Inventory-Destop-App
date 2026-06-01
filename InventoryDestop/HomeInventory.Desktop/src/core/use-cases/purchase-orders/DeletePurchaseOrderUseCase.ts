import type { PurchaseOrderRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class DeletePurchaseOrderUseCase extends RepositoryUseCase<PurchaseOrderRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.deleteAsync(...args)
  }
}
