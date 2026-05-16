/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_audited from "../_lib/audited.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as batches from "../batches.js";
import type * as buyer from "../buyer.js";
import type * as cooperatives from "../cooperatives.js";
import type * as farmers from "../farmers.js";
import type * as farms from "../farms.js";
import type * as http from "../http.js";
import type * as r2 from "../r2.js";
import type * as seed from "../seed.js";
import type * as transit from "../transit.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/audited": typeof _lib_audited;
  audit: typeof audit;
  auth: typeof auth;
  batches: typeof batches;
  buyer: typeof buyer;
  cooperatives: typeof cooperatives;
  farmers: typeof farmers;
  farms: typeof farms;
  http: typeof http;
  r2: typeof r2;
  seed: typeof seed;
  transit: typeof transit;
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
