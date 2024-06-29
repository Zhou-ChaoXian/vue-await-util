import type {
  ShallowRef,
  VNode,
  WatchSource,
  DefineSetupFnComponent,
  SlotsType,
  DeepReadonly,
  UnwrapNestedRefs,
  Ref,
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

export interface AwaitOptions<T, E = any> {
  resolve?: Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: E) => void;
}

export declare function useAwait<T = any, E = any>(options: AwaitOptions<T, E>): ResolveDataRef<T>;

export type AwaitProps<T, U = any, E = any> = AwaitOptions<T, E> & {
  useResolve: (resolve: Readonly<ResolveDataRef<T, E>>) => U;
};

export type AwaitSlot<T, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; }) => VNode | VNode[]; }>;

export declare const Await: new <T = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitProps<T, U, E>, {}, AwaitSlot<T, U, E>>>;

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
  handle: (value?: WatchSourceArrayValue<Deps>, oldValue?: WatchSourceArrayValue<Deps> | undefined, onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: E) => void;
}

export declare function useAwaitWatch<T = any, E = any>(options: AwaitWatchOptions<T, E>): [ResolveDataRef<T, E>, WatchOptions];

export type AwaitWatchProps<T, U = any, E = any> = AwaitWatchOptions<T, E> & {
  useResolve: (resolve: Readonly<ResolveDataRef<T, E>>, watchOptions: WatchOptions) => U;
};

export type AwaitWatchSlot<T, U = any, E = any> = SlotsType<{ default: (resolve: ResolveData<T, E> & { use: U; watchOptions: WatchOptions; }) => VNode | VNode[]; }>;

export declare const AwaitWatch: new <T = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchProps<T, U, E>, {}, AwaitWatchSlot<T, U, E>>>;

export interface AwaitWatchEffectOptions<T, E = any> {
  handle: (onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: E) => void;
}

export declare function useAwaitWatchEffect<T = any, E = any>(options: AwaitWatchEffectOptions<T, E>): [ResolveDataRef<T, E>, WatchOptions];

export type AwaitWatchEffectProps<T, U = any, E = any> = AwaitWatchEffectOptions<T, E> & {
  useResolve: (resolve: Readonly<ResolveDataRef<T, E>>, watchOptions: WatchOptions) => U;
};

export declare const AwaitWatchEffect: new <T = any, U = any, E = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchEffectProps<T, U, E>, {}, AwaitWatchSlot<T, U, E>>>;

export interface ActionProps<A, O = any> {
  useAction: (options?: O) => A;
  options?: O;
}

export type ActionSlot<A> = SlotsType<{ default: (action: A) => VNode | VNode[]; }>;

export declare const Action: new <A = any, O = any>() => InstanceType<DefineSetupFnComponent<ActionProps<A, O>, {}, ActionSlot<A>>>;

export declare const Host: new () => InstanceType<DefineSetupFnComponent>;

export type TmplSlot<P> = SlotsType<{ default: (props: P) => VNode | VNode[]; }>;

export declare const Tmpl: new <P extends Record<string, any> = Record<string, any>>() => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, TmplSlot<P>>>;

export declare const Slotted: new () => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, SlotsType<{ default?: () => VNode | VNode[]; }>>>;