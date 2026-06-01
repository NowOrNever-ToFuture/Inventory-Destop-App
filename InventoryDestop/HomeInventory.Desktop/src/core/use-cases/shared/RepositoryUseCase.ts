export abstract class RepositoryUseCase<TRepository extends Record<string, any>> {
  constructor(protected readonly repository: TRepository) {}
}
