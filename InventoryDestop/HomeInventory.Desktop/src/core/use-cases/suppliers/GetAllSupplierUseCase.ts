import type { SupplierRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetAllSupplierUseCase extends RepositoryUseCase<SupplierRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getAllAsync(...args)
  }
}
