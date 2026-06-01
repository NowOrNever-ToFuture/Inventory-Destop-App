import type { CategoryRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class GetAllCategoryUseCase extends RepositoryUseCase<CategoryRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.getAllAsync(...args)
  }
}
