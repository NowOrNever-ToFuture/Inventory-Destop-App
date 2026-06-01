import type { BrandRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetByIdBrandUseCase extends RepositoryUseCase<BrandRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getByIdAsync(...args)
  }
}
