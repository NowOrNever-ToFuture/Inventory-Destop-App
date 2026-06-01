import type { ProductRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreateProductUseCase extends RepositoryUseCase<ProductRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
