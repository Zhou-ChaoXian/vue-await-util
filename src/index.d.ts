import type {ShallowRef, VNode, WatchSource, DefineSetupFnComponent, SlotsType} from "vue";

export type Status = "pending" | "resolve" | "reject";

export type OnCleanup = (cleanupFn: () => void) => void;

export interface ResolveData<T> {
  first: boolean;
  status: Status;
  data: T;
  error: any;
}

export type ResolveDataRef<T> = ShallowRef<ResolveData<T>>;

export type UseResolve<T, U> = { useResolve?: (resolve: ResolveDataRef<T>) => U; };

export type UseWatchResolve<T, U> = { useResolve?: (resolve: ResolveDataRef<T>, watchOptions: WatchOptions) => U; };

export interface UseAwaitProps<T> {
  resolve?: Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: any) => void;
}

export type AwaitProps<T, U> = UseAwaitProps<T> & UseResolve<T, U>;

export interface UseAwaitWatchProps<T> {
  deps?: WatchSource[];
  handle: (value?: any[], oldValue?: any[], onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  jumpFirst?: boolean;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: any) => void;
}

export type AwaitWatchProps<T, U> = UseAwaitWatchProps<T> & UseWatchResolve<T, U>;

export interface UseAwaitWatchEffectProps<T> {
  handle: (onCleanup?: OnCleanup) => Promise<T>;
  init?: T;
  delay?: number;
  onStart?: (first?: boolean) => void;
  onEnd?: (first?: boolean) => void;
  onError?: (error?: any) => void;
}

export type AwaitWatchEffectProps<T, U> = UseAwaitWatchEffectProps<T> & UseWatchResolve<T, U>;

export interface ActionProps<A, O> {
  useAction: (options?: O) => A;
  options?: O;
}

export interface WatchOptions {
  update: () => void;
  unWatch: () => void;
  reWatch: () => void;
}

export declare function useAwait<T>(props: UseAwaitProps<T>): ResolveDataRef<T>;

export declare function useAwaitWatch<T>(props: UseAwaitWatchProps<T>): [ResolveDataRef<T>, WatchOptions];

export declare function useAwaitWatchEffect<T>(props: UseAwaitWatchEffectProps<T>): [ResolveDataRef<T>, WatchOptions];

export declare function isPending(status: Status): boolean;

export declare function isResolve(status: Status): boolean;

export declare function isReject(status: Status): boolean;

export type AwaitSlot<T, U> = SlotsType<{ default: (resolve: ResolveData<T> & { use: U; }) => VNode | VNode[]; }>;

export type AwaitWatchSlot<T, U> = SlotsType<{ default: (resolve: ResolveData<T> & { use: U; watchOptions: WatchOptions; }) => VNode | VNode[]; }>;

export type ActionSlot<A> = SlotsType<{ default: (action: A) => VNode | VNode[]; }>;

export type ProvisionSlot<P> = SlotsType<{ default: (props: P) => VNode | VNode[]; }>;

export declare const Await: new <T = any, U = any>() => InstanceType<DefineSetupFnComponent<AwaitProps<T, U>, {}, AwaitSlot<T, U>>>;

export declare const AwaitWatch: new <T = any, U = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchProps<T, U>, {}, AwaitWatchSlot<T, U>>>;

export declare const AwaitWatchEffect: new <T = any, U = any>() => InstanceType<DefineSetupFnComponent<AwaitWatchEffectProps<T, U>, {}, AwaitWatchSlot<T, U>>>;

export declare const Action: new <A = any, O = any>() => InstanceType<DefineSetupFnComponent<ActionProps<A, O>, {}, ActionSlot<A>>>;

export declare const Host: new () => InstanceType<DefineSetupFnComponent>;

export declare const Provision: new <P = Record<string, any>>() => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, ProvisionSlot<P>>>;

export declare const Slotted: new () => InstanceType<DefineSetupFnComponent<{ name?: string; }, {}, SlotsType<{ default?: () => VNode | VNode[]; }>>>;