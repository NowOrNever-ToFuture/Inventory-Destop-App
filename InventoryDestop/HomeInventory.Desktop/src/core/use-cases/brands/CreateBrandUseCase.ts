import type { BrandRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreateBrandUseCase extends RepositoryUseCase<BrandRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
