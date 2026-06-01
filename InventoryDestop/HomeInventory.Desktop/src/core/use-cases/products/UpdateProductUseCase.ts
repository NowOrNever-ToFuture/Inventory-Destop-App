import type { ProductRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class UpdateProductUseCase extends RepositoryUseCase<ProductRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.updateAsync(...args)
  }
}
