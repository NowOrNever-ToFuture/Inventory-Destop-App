import type { SupplierRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class UpdateSupplierUseCase extends RepositoryUseCase<SupplierRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.updateAsync(...args)
  }
}
