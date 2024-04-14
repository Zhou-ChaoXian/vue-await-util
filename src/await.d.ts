import type {Ref, VNode, WatchSource} from "vue";

export type Status = "pending" | "resolve" | "reject";

export type OnCleanup = (cleanupFn: () => void) => void;

export interface ResolveData<T> {
  status: Status;
  data: T;
  error: any;
  first: boolean;
}

export interface AwaitProps<T> {
  resolve: Promise<T>;
  init?: T;
  delay?: number;
  onStart?: (first?: boolean) => void;
  onEnd?: () => void;
  onError?: (error?: any) => void;
}

export interface AwaitWatchProps<T> {
  deps?: WatchSource[];
  handle: (value?: any[], oldValue?: any[], onCleanup?: OnCleanup) => Promise<T> | T;
  init?: T;
  delay?: number;
  onStart?: (first?: boolean) => void;
  onEnd?: () => void;
  onError?: (error?: any) => void;
}

export interface AwaitWatchEffectProps<T> {
  handle: (onCleanup?: OnCleanup) => Promise<T> | T;
  init?: T;
  delay?: number;
  onStart?: (first?: boolean) => void;
  onEnd?: () => void;
  onError?: (error?: any) => void;
}

export type ReturnResolveData<T> = Ref<Readonly<ResolveData<T>>>;

export declare function useAwait<T>(props: AwaitProps<T>): ReturnResolveData<T>;

export declare function useAwaitWatch<T>(props: AwaitWatchProps<T>): ReturnResolveData<T>;

export declare function useAwaitWatchEffect<T>(props: AwaitWatchEffectProps<T>): ReturnResolveData<T>;

export declare function isPending(status: Status): boolean;

export declare function isResolve(status: Status): boolean;

export declare function isReject(status: Status): boolean;

export type ResolveDataFn<T> = (resolveData: Readonly<ResolveData<T>>) => VNode | VNode[];

export declare const Await: new <T>() => {
  $props: AwaitProps<T>;
  $slots: {
    default: ResolveDataFn<T>;
  };
};

export declare const AwaitWatch: new <T>() => {
  $props: AwaitWatchProps<T>;
  $slots: {
    default: ResolveDataFn<T>;
  };
};

export declare const AwaitWatchEffect: new <T>() => {
  $props: AwaitWatchEffectProps<T>;
  $slots: {
    default: ResolveDataFn<T>;
  };
};