import type { CategoryRepository } from '@core/repositories'
import { RepositoryUseCase } from '../shared/RepositoryUseCase'

export class UpdateCategoryUseCase extends RepositoryUseCase<CategoryRepository> {
  execute(...args: any[]): Promise<any> {
    return this.repository.updateAsync(...args)
  }
}
