import type { ProductRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class DeleteProductUseCase extends RepositoryUseCase<ProductRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.deleteAsync(...args)
  }
}
