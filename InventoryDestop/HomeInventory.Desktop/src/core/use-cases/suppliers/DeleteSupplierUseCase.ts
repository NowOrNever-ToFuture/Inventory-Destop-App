import type { SupplierRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class DeleteSupplierUseCase extends RepositoryUseCase<SupplierRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.deleteAsync(...args)
  }
}
