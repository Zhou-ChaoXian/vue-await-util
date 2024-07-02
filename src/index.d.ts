import type {
  ComputedRef,
  VNode,
  WatchSource,
  DefineSetupFnComponent,
  SlotsType,
  DeepReadonly,
  UnwrapNestedRefs,
  Ref,
  ShallowRef,
} from "vue";

declare const pendingStatus: unique symbol;
declare const resolveStatus: unique symbol;
declare const rejectStatus: unique symbol;

export type Status = typeof pendingStatus | typeof resolveStatus | typeof rejectStatus;

export declare function isPending(status: Status): boolean;

export declare function isResolve(status: Status): boolean;

export declare function isReject(status: Status): boolean;

export interface ResolveData<T, E = any> {
  first: boolean;
  status: Status;
  data: T;
  error: E;
}

export type ResolveDataRef<T, E = any> = ShallowRef<ResolveData<T, E>>;

export type ReadonlyResolveData<T, E = any> = ComputedRef<ResolveData<T, E>>;

export interface AwaitOptions<T, E = any> {
  resolve?: Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first: boolean) => void;
  onEnd?: (value: T) => void;
  onError?: (error: E) => void;
  onFinal?: (first: boolean) => void;
}

export declare function useAwait<T = any, E = any>(options: AwaitOptions<T, E>): ResolveDataRef<T>;

export type AwaitProps<T, U = any, E = any> = AwaitOptions<T, E> & {
  useResolve?: (resolve: ReadonlyResolveData<T, E>) => U;
};

export type AwaitSlot<T, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; }) => VNode | VNode[]; }>;

export declare const Await: new <T = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitProps<T, U, E>, {}, AwaitSlot<T, U, E>>>;

export interface AwaitStateOptions<T, Deps extends WatchSource[] = WatchSource[], Arg = any, E = any> {
  deps?: Deps;
  handle: (deps: WatchSourceArrayValue<Deps>, arg?: Arg) => Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first: boolean) => void;
  onEnd?: (value: T) => void;
  onError?: (error: E) => void;
  onFinal?: (first: boolean) => void;
}

export type SetResolve<T = any> = (resolve?: Promise<T> | T) => void;

export declare function useAwaitState<T = any, Deps extends WatchSource[] = WatchSource[], Arg = any, E = any>(options: AwaitStateOptions<T, Deps, Arg, E>): [ReadonlyResolveData<T, E>, SetResolve<Arg>];

export type AwaitStateProps<T, Deps extends WatchSource[] = WatchSource[], Arg = any, U = any, E = any> =
  AwaitStateOptions<T, Deps, Arg, E> & {
  useResolve?: (resolve: ReadonlyResolveData<T, E>, setResolve: SetResolve<Arg>) => U;
};

export type AwaitStateSlot<T, Arg = any, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; setResolve: SetResolve<Arg>; }) => VNode | VNode[]; }>;

export declare const AwaitState: new <T = any, Deps extends WatchSource[] = WatchSource[], Arg = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitStateProps<T, Deps, Arg, U, E>, {}, AwaitStateSlot<T, Arg, U, E>>>;

export interface ActionType<T extends string = string, P = any> {
  type: T;
  payload?: P;
}

export type Reducer<R = any, T extends string = string, P = any, D = any> = (action: ActionType<T, P> & { deps: D; }) => R | Promise<R>;

export type Reducers = Record<string, Reducer> | (() => Record<string, Reducer>);

export interface AwaitReducerOptions<T, Rs extends Reducers = Reducers, Deps = any, RsDeps extends Record<string, any> = Record<string, any>, Arg = any, E = any> {
  deps?: Deps;
  handle: (deps: Deps, arg?: Arg) => Promise<T>;
  reducersDeps?: RsDeps;
  reducers?: Rs;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first: boolean) => void;
  onEnd?: (value: T) => void;
  onError?: (error: E) => void;
  onFinal?: (first: boolean) => void;
}

export interface Dispatch<T extends string = string, P = any> {
  (action?: ActionType<T, P>): void;
}

type ReturnTypeOrSelf<T> = T extends (...args: any[]) => infer R ? R : T;

type ReducersKey<T> = ReturnTypeOrSelf<T> extends Record<string, any> ? {
  [K in keyof ReturnTypeOrSelf<T>]: ReturnTypeOrSelf<T>[K] extends Reducer ? K extends string ? K : never : never;
} : never;

type DispatchActions<T> = ReturnTypeOrSelf<T> extends Record<string, any> ? {
  [K in keyof ReturnTypeOrSelf<T>]: ReturnTypeOrSelf<T>[K] extends Reducer<infer R, infer T1, infer P, infer D> ? K extends string ? (payload?: P) => ActionType<K, P> : never : never;
} : never;

export declare function useAwaitReducer<T = any, Rs extends Reducers = Reducers, Deps = any, RsDeps extends Record<string, any> = Record<string, any>, Arg = any, E = any>(options: AwaitReducerOptions<T, Rs, Deps, RsDeps, Arg, E>): [ReadonlyResolveData<T, E>, Dispatch<ReducersKey<Rs>[keyof ReducersKey<Rs>]>, DispatchActions<Rs>];

export type AwaitReducerProps<T, Rs extends Reducers = Reducers, Deps = any, RsDeps extends Record<string, any> = Record<string, any>, Arg = any, U = any, E = any> =
  AwaitReducerOptions<T, Rs, Deps, RsDeps, Arg, E> & {
  useResolve?: (resolve: ReadonlyResolveData<T, E>, dispatch: Dispatch<ReducersKey<Rs>[keyof ReducersKey<Rs>]>, actions: DispatchActions<Rs>) => U;
};

export type AwaitReducerSlot<T, Rs extends Reducers = Reducers, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; dispatch: Dispatch<ReducersKey<Rs>[keyof ReducersKey<Rs>]>; actions: DispatchActions<Rs>; }) => VNode | VNode[]; }>;

export declare const AwaitReducer: new<T = any, Rs extends Reducers = Reducers, Deps = any, RsDeps extends Record<string, any> = Record<string, any>, Arg = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitReducerProps<T, Rs, Deps, RsDeps, Arg, U, E>, {}, AwaitReducerSlot<T, Rs, U, E>>>;

export type OnCleanup = (cleanupFn: () => void) => void;

export type WatchOptions = DeepReadonly<UnwrapNestedRefs<{
  update: () => void;
  unWatch: () => void;
  reWatch: () => void;
  isWatching: Ref<boolean>;
}>>;

type WatchSourceArrayValue<T> = {
  [P in keyof T]: T[P] extends WatchSource<infer V> ? V : never;
};

export interface AwaitWatchOptions<T, Deps extends WatchSource[] = WatchSource[], E = any> {
  deps?: Deps;
  handle: (newDeps: WatchSourceArrayValue<Deps>, oldDeps: WatchSourceArrayValue<Deps> | undefined, onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first: boolean) => void;
  onEnd?: (value: T) => void;
  onError?: (error: E) => void;
  onFinal?: (first: boolean) => void;
}

export declare function useAwaitWatch<T = any, Deps extends WatchSource[] = WatchSource[], E = any>(options: AwaitWatchOptions<T, Deps, E>): [ReadonlyResolveData<T, E>, WatchOptions];

export type AwaitWatchProps<T, Deps extends WatchSource[] = WatchSource[], U = any, E = any> =
  AwaitWatchOptions<T, Deps, E> & {
  useResolve?: (resolve: ReadonlyResolveData<T, E>, watchOptions: WatchOptions) => U;
};

export type AwaitWatchSlot<T, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; watchOptions: WatchOptions; }) => VNode | VNode[]; }>;

export declare const AwaitWatch: new <T = any, Deps extends WatchSource[] = WatchSource[], U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchProps<T, Deps, U, E>, {}, AwaitWatchSlot<T, U, E>>>;

export interface AwaitWatchEffectOptions<T, E = any> {
  handle: (onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  onStart?: (first: boolean) => void;
  onEnd?: (value: T) => void;
  onError?: (error: E) => void;
  onFinal?: (first: boolean) => void;
}

export declare function useAwaitWatchEffect<T = any, E = any>(options: AwaitWatchEffectOptions<T, E>): [ReadonlyResolveData<T, E>, WatchOptions];

export type AwaitWatchEffectProps<T, U = any, E = any> = AwaitWatchEffectOptions<T, E> & {
  useResolve?: (resolve: ReadonlyResolveData<T, E>, watchOptions: WatchOptions) => U;
};

export declare const AwaitWatchEffect: new <T = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchEffectProps<T, U, E>, {}, AwaitWatchSlot<T, U, E>>>;

export interface ActionProps<A = any, O = any> {
  useAction: (options?: O) => A;
  options?: O;
}

export type ActionSlot<A> = SlotsType<{ default: (action: A) => VNode | VNode[]; }>;

export declare const Action: new <A = any, O = any>() => InstanceType<DefineSetupFnComponent<ActionProps<A, O>, {}, ActionSlot<A>>>;

export declare const Host: new () => InstanceType<DefineSetupFnComponent>;

export type TmplSlot<P> = SlotsType<{ default: (props: P) => VNode | VNode[]; }>;

export declare const Tmpl: new <P extends Record<string, any> = Record<string, any>>() => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, TmplSlot<P>>>;

export declare const Slotted: new () => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, SlotsType<{ default?: () => VNode | VNode[]; }>>>;