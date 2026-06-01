import type { SupplierRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetByIdSupplierUseCase extends RepositoryUseCase<SupplierRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getByIdAsync(...args)
  }
}
