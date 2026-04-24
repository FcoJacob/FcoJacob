import { ref, type Ref } from 'vue'
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server'

/**
 * SSR-safe wrapper around useConvexQuery.
 * Returns a ref that is undefined during SSR and populates on the client.
 */
export function useSafeConvexQuery<F extends FunctionReference<'query'>>(
  fn: F,
  args: FunctionArgs<F>,
): Ref<FunctionReturnType<F> | undefined> {
  if (import.meta.server) {
    return ref(undefined) as Ref<FunctionReturnType<F> | undefined>
  }
  const { data } = useConvexQuery(fn, args)
  return data as Ref<FunctionReturnType<F> | undefined>
}

/**
 * SSR-safe wrapper around useConvexMutation.
 */
export function useSafeConvexMutation<F extends FunctionReference<'mutation'>>(fn: F) {
  if (import.meta.server) {
    return {
      mutate: (() => Promise.resolve()) as unknown as (
        args: FunctionArgs<F>,
      ) => Promise<FunctionReturnType<F>>,
      isLoading: ref(false),
    }
  }
  return useConvexMutation(fn)
}
