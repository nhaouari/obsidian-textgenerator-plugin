import "@total-typescript/ts-reset";

import type * as three from "three";

declare global {
	type THREE = typeof three;
}