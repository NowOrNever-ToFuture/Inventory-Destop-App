import type { CategoryRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class CreateCategoryUseCase extends RepositoryUseCase<CategoryRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.createAsync(...args)
  }
}
