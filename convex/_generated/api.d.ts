/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as blogFooters from "../blogFooters.js";
import type * as blogValidators from "../blogValidators.js";
import type * as blogs from "../blogs.js";
import type * as cv from "../cv.js";
import type * as labs from "../labs.js";
import type * as projects from "../projects.js";
import type * as researchDocuments from "../researchDocuments.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  blogFooters: typeof blogFooters;
  blogValidators: typeof blogValidators;
  blogs: typeof blogs;
  cv: typeof cv;
  labs: typeof labs;
  projects: typeof projects;
  researchDocuments: typeof researchDocuments;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
