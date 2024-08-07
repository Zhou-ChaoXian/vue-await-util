## vue-await-util

> 处理组件中的 `promise`

### 📦 install

```shell
npm install vue-await-util
```

### ✨ 目录

1. [`useAwait`](#useawait)
2. [`useAwaitState`](#useawaitstate)
3. [`useAwaitReducer`](#useawaitreducer)
4. [`useAwaitWatch`](#useawaitwatch)
5. [`useAwaitWatchEffect`](#useawaitwatcheffect)
6. [`Await`](#await)
7. [`AwaitState`](#awaitstate)
8. [`AwaitReducer`](#awaitreducer)
9. [`AwaitWatch`](#awaitwatch) 🌷🌸🌺 ( ***推荐使用一下*** )
10. [`AwaitWatchEffect`](#awaitwatcheffect)
11. [`Action`](#action)
12. [`Host` `Tmpl` `Slotted`](#插槽)
13. [`Gen` `Yield` `Next`](#链式组件)
14. [`uniapp 小程序使用`](#小程序)

### useAwait

**props** (问号表示可选属性)

| `prop` (属性) |       `type` (类型)        | `description` (描述)    |
|:------------|:------------------------:|:----------------------|
| resolve     | Promise &#124; undefined | 需要处理的 `promise`       |
| init?       |           any            | 初始化的值                 |
| delay?      |          number          | 延迟，防止闪烁               |
| jumpFirst?  |         boolean          | 跳过首次请求                |
| onStart?    | (first: boolean) => void | promise 开始时执行         |
| onEnd?      |   (value: any) => void   | promise 正确结束时执行 then  |
| onError?    |   (error: any) => void   | promise 报错时执行 catch   |
| onFinal?    | (first: boolean) => void | promise 结束时执行 finally |

**return** (返回值是一个 `ref`)

| `prop` (属性) | `type` (类型) | `description` (描述) |
|:------------|:-----------:|:-------------------|
| first       |    bool     | 是否是第一次执行           |
| status      |   Status    | 当前状态               |
| data        |     any     | 结果                 |
| error       |     any     | 错误信息               |

```ts
declare const pendingStatus: unique symbol;
declare const resolveStatus: unique symbol;
declare const rejectStatus: unique symbol;

type Status = typeof pendingStatus | typeof resolveStatus | typeof rejectStatus;
```

**示例**

```vue

<script setup>
import {ref} from "vue";
import {useAwait, isPending} from "vue-await-util";
import {Skeleton, Spin, Button, Flex} from "ant-design-vue";

const count = ref(0);
const resolve = useAwait({
  resolve: handle(),
});

function add() {
  count.value += 1;
  resolve.value = handle();
}

async function handle() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "hello" + count.value;
}

</script>

<template>
  <Skeleton :loading="resolve.first">
    <Spin :spinning="isPending(resolve.status)">
      <Flex vertical justify="center" align="center" gap="middle">
        <h1>count - {{ count }}</h1>
        <h1>{{ resolve.data }}</h1>
        <Button @click="add">add</Button>
      </Flex>
    </Spin>
  </Skeleton>
</template>
```

### useAwaitState

***props*** (问号表示可选属性)

| `prop` (属性) |             `type` (类型)             | `description` (描述)    |
|:------------|:-----------------------------------:|:----------------------|
| deps?       |                Deps                 | 依赖数组                  |
| handle      | (deps: any[], arg?: any) => Promise | 处理依赖数组，生成 `promise`   |
| init?       |                 any                 | 初始化的值                 |
| delay?      |               number                | 延迟，防止闪烁               |
| jumpFirst?  |               boolean               | 跳过首次请求                |
| onStart?    |      (first: boolean) => void       | promise 开始时执行         |
| onEnd?      |        (value: any) => void         | promise 正确结束时执行 then  |
| onError?    |        (error: any) => void         | promise 报错时执行 catch   |
| onFinal?    |      (first: boolean) => void       | promise 结束时执行 finally |

**return** (返回值 [resolveData, setResolve])

```ts
import type {WatchSource} from "vue";

type Deps = WatchSource[];
type SetResolve = (resolve: Promise | any) => void;
```

**示例**

```vue

<script setup>
import {ref} from "vue";
import {useAwaitState, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

const [resolve, setResolve] = useAwaitState({
  deps: [count],
  handle: async ([count], arg) => {
    console.log(arg);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve("hello" + count);
  },
});

function add() {
  count.value += 1;
}

</script>

<template>
  <Skeleton :loading="resolve.first">
    <Spin :spinning="isPending(resolve.status)">
      <Flex vertical justify="center" align="center" gap="middle">
        <h1>count - {{ count }}</h1>
        <h1>{{ resolve.data }}</h1>
        <ButtonGroup>
          <Button @click="add">add</Button>
          <Button @click="setResolve">update</Button>
        </ButtonGroup>
      </Flex>
    </Spin>
  </Skeleton>
</template>
```

### useAwaitReducer

***props*** (问号表示可选属性)

| `prop` (属性)   |             `type` (类型)             | `description` (描述)    |
|:--------------|:-----------------------------------:|:----------------------|
| deps?         |                Deps                 | 依赖数组                  |
| handle        | (deps: any[], arg?: any) => Promise | 处理依赖数组，生成 `promise`   |
| reducersDeps? |         Record<string, any>         | reducers依赖            |
| reducers?     |              Reducers               | reducers              |
| init?         |                 any                 | 初始化的值                 |
| delay?        |               number                | 延迟，防止闪烁               |
| jumpFirst?    |               boolean               | 跳过首次请求                |
| onStart?      |      (first: boolean) => void       | promise 开始时执行         |
| onEnd?        |        (value: any) => void         | promise 正确结束时执行 then  |
| onError?      |        (error: any) => void         | promise 报错时执行 catch   |
| onFinal?      |      (first: boolean) => void       | promise 结束时执行 finally |

**return** (返回值 [resolveData, dispatch, actions])

```ts
type Reducer = (action: { type: string; payload?: any; deps: any[] }) => Promise<any> | any;
type Reducers = Record<string, Reducer> | (() => Record<string, Reducer>);

type Dispatch = (action?: { type: string; payload?: any; }) => void;
type Actions = Record<string, (payload?: any) => { type: string; payload?: any; }>;
```

***示例***

```vue

<script setup>
import {ref} from "vue";
import {isPending, useAwaitReducer} from "vue-await-util";
import {Skeleton, Spin, Button, ButtonGroup, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const [resolve, dispatch, actions] = useAwaitReducer({
  deps: [count],
  reducersDeps: {
    test1: [count],
    test2: [count],
  },
  handle: async ([count], arg) => {
    console.log("arg", arg);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "hello" + count;
  },
  reducers: {
    test1: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    test2: (action) => {
      console.log("test2", action);
    }
  }
});

</script>

<template>
  <Skeleton :loading="resolve.first">
    <Spin :spinning="isPending(resolve.status)">
      <Flex vertical justify="center" align="center" gap="middle">
        <h1>count - {{ count }}</h1>
        <h1>{{ resolve.data }}</h1>
        <ButtonGroup>
          <Button @click="add">add</Button>
          <Button @click="dispatch()">update</Button>
          <Button @click="dispatch({type: 'test1'})">test1</Button>
          <Button @click="dispatch(actions.test2('111'))">test2</Button>
        </ButtonGroup>
      </Flex>
    </Spin>
  </Skeleton>
</template>
```

### useAwaitWatch

***props*** (问号表示可选属性)

| `prop` (属性) |       `type` (类型)        | `description` (描述)    |
|:------------|:------------------------:|:----------------------|
| deps?       |           Deps           | 依赖数组                  |
| handle      |          Handle          | 处理依赖数组，生成 `promise`   |
| init?       |           any            | 初始化的值                 |
| delay?      |          number          | 延迟，防止闪烁               |
| jumpFirst?  |         boolean          | 跳过首次请求                |
| onStart?    | (first: boolean) => void | promise 开始时执行         |
| onEnd?      |   (value: any) => void   | promise 正确结束时执行 then  |
| onError?    |   (error: any) => void   | promise 报错时执行 catch   |
| onFinal?    | (first: boolean) => void | promise 结束时执行 finally |

**return** (返回值 [resolveData, watchOptions])

| `prop` (属性) | `type` (类型) | `description` (描述) |
|:------------|:-----------:|:-------------------|
| update      | () => void  | 强制刷新               |
| unWatch     | () => void  | 取消监听依赖的变化          |
| reWatch     | () => void  | 重新监听依赖的变化          |
| isWatching  |   boolean   | 是否正在监听             |

```ts
import type {WatchSource} from "vue";

type Deps = WatchSource[];
type OnCleanup = (cleanupFn: () => void) => void;
type Handle<T> = (newDesp: any[], oldDeps: any[], onCleanup: OnCleanup) => Promise<T>;
```

**示例**

```vue

<script setup>
import {ref} from "vue";
import {useAwaitWatch, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const [resolve, watchOptions] = useAwaitWatch({
  deps: [count],
  handle: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "hello" + count.value;
  }
});

</script>

<template>
  <Skeleton :loading="resolve.first">
    <Spin :spinning="isPending(resolve.status)">
      <Flex vertical justify="center" align="center" gap="middle">
        <h1>count - {{ count }}</h1>
        <h1>{{ resolve.data }}</h1>
        <ButtonGroup>
          <Button @click="add">add</Button>
          <Button @click="watchOptions.update">update</Button>
          <Button @click="watchOptions.unWatch" :disabled="!watchOptions.isWatching">unWatch</Button>
          <Button @click="watchOptions.reWatch" :disabled="watchOptions.isWatching">reWatch</Button>
        </ButtonGroup>
      </Flex>
    </Spin>
  </Skeleton>
</template>
```

### useAwaitWatchEffect

**props** (问号表示可选属性)

| `prop` (属性) |       `type` (类型)        | `description` (描述)    |
|:------------|:------------------------:|:----------------------|
| handle      |          Handle          | 生成 `promise`          |
| init?       |           any            | 初始化的值                 |
| delay?      |          number          | 延迟，防止闪烁               |
| onStart?    | (first: boolean) => void | promise 开始时执行         |
| onEnd?      |   (value: any) => void   | promise 正确结束时执行 then  |
| onError?    |   (error: any) => void   | promise 报错时执行 catch   |
| onFinal?    | (first: boolean) => void | promise 结束时执行 finally |

**return** (返回值 [resolveData, watchOptions] )

```ts
type OnCleanup = (cleanupFn: () => void) => void;
type Handle<T> = (onCleanup?: OnCleanup) => Promise<T>;
```

**示例**

```vue

<script setup>
import {ref} from "vue";
import {useAwaitWatchEffect, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const [resolve, watchOptions] = useAwaitWatchEffect({
  handle: async () => {
    const c = count.value;
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "hello" + c;
  }
});

</script>

<template>
  <Skeleton :loading="resolve.first">
    <Spin :spinning="isPending(resolve.status)">
      <Flex vertical justify="center" align="center" gap="middle">
        <h1>count - {{ count }}</h1>
        <h1>{{ resolve.data }}</h1>
        <ButtonGroup>
          <Button @click="add">add</Button>
          <Button @click="watchOptions.update">update</Button>
          <Button @click="watchOptions.unWatch" :disabled="!watchOptions.isWatching">unWatch</Button>
          <Button @click="watchOptions.reWatch" :disabled="watchOptions.isWatching">reWatch</Button>
        </ButtonGroup>
      </Flex>
    </Spin>
  </Skeleton>
</template>
```

### Await

> 封装 `useAwait`

**示例**

```vue

<script setup>
import {ref} from "vue";
import {Await, isPending} from "vue-await-util";
import {Skeleton, Spin, Button, Flex} from "ant-design-vue";

const count = ref(0);
const resolve = ref(handle());

function add() {
  count.value += 1;
  resolve.value = handle();
}

async function handle() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "hello" + count.value;
}

</script>

<template>
  <Await :resolve #default="{first, status, data}">
    <Skeleton :loading="first">
      <Spin :spinning="isPending(status)">
        <Flex vertical justify="center" align="center" gap="middle">
          <h1>count - {{ count }}</h1>
          <h1>{{ data }}</h1>
          <Button @click="add">add</Button>
        </Flex>
      </Spin>
    </Skeleton>
  </Await>
</template>
```

### AwaitState

> 封装 `useAwaitState`

```vue

<script setup>
import {ref} from "vue";
import {AwaitState, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const deps = [count];

async function handle([count], arg) {
  console.log(arg);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return Promise.resolve("hello" + count);
}

</script>

<template>
  <AwaitState :deps :handle #default="{first, status, data, setResolve}">
    <Skeleton :loading="first">
      <Spin :spinning="isPending(status)">
        <Flex vertical justify="center" align="center" gap="middle">
          <h1>count - {{ count }}</h1>
          <h1>{{ data }}</h1>
          <ButtonGroup>
            <Button @click="add">add</Button>
            <Button @click="setResolve">update</Button>
          </ButtonGroup>
        </Flex>
      </Spin>
    </Skeleton>
  </AwaitState>
</template>
```

### AwaitReducer

> 封装 `useAwaitReducer`

**示例**

```vue

<script setup>
import {ref} from "vue";
import {isPending, AwaitReducer} from "vue-await-util";
import {Skeleton, Spin, Button, ButtonGroup, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const props = {
  deps: [count],
  reducersDeps: {
    test1: [count],
    test2: [count],
  },
  handle: async ([count], arg) => {
    console.log("arg", arg);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "hello" + count;
  },
  reducers: {
    test1: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    test2: (action) => {
      console.log("test2", action);
    }
  }
};


</script>

<template>
  <AwaitReducer v-bind="props" #default="{first, status, data, dispatch, actions}">
    <Skeleton :loading="first">
      <Spin :spinning="isPending(status)">
        <Flex vertical justify="center" align="center" gap="middle">
          <h1>count - {{ count }}</h1>
          <h1>{{ data }}</h1>
          <ButtonGroup>
            <Button @click="add">add</Button>
            <Button @click="dispatch()">update</Button>
            <Button @click="dispatch({type: 'test1'})">test1</Button>
            <Button @click="dispatch(actions.test2('111'))">test2</Button>
          </ButtonGroup>
        </Flex>
      </Spin>
    </Skeleton>
  </AwaitReducer>
</template>
```

### AwaitWatch

> 封装 `useAwaitWatch`

**示例**

```vue

<script setup>
import {ref} from "vue";
import {AwaitWatch, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

const deps = [count];

async function handle() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "hello" + count.value;
}

</script>

<template>
  <AwaitWatch :deps :handle #default="{first, status, data, watchOptions}">
    <Skeleton :loading="first">
      <Spin :spinning="isPending(status)">
        <Flex vertical justify="center" align="center" gap="middle">
          <h1>count - {{ count }}</h1>
          <h1>{{ data }}</h1>
          <ButtonGroup>
            <Button @click="add">add</Button>
            <Button @click="watchOptions.update">update</Button>
            <Button @click="watchOptions.unWatch" :disabled="!watchOptions.isWatching">unWatch</Button>
            <Button @click="watchOptions.reWatch" :disabled="watchOptions.isWatching">reWatch</Button>
          </ButtonGroup>
        </Flex>
      </Spin>
    </Skeleton>
  </AwaitWatch>
</template>
```

### AwaitWatchEffect

> 封装 `AwaitWatchEffect`

**示例**

```vue

<script setup>
import {ref} from "vue";
import {AwaitWatchEffect, isPending} from "vue-await-util";
import {Skeleton, Spin, ButtonGroup, Button, Flex} from "ant-design-vue";

const count = ref(0);

function add() {
  count.value += 1;
}

async function handle() {
  const c = count.value;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return "hello" + c;
}

</script>

<template>
  <AwaitWatchEffect :handle #default="{first, status, data, watchOptions}">
    <Skeleton :loading="first">
      <Spin :spinning="isPending(status)">
        <Flex vertical justify="center" align="center" gap="middle">
          <h1>count - {{ count }}</h1>
          <h1>{{ data }}</h1>
          <ButtonGroup>
            <Button @click="add">add</Button>
            <Button @click="watchOptions.update">update</Button>
            <Button @click="watchOptions.unWatch" :disabled="!watchOptions.isWatching">unWatch</Button>
            <Button @click="watchOptions.reWatch" :disabled="watchOptions.isWatching">reWatch</Button>
          </ButtonGroup>
        </Flex>
      </Spin>
    </Skeleton>
  </AwaitWatchEffect>
</template>
```

### Action

> 封装状态和操作，仅供内部元素使用  
> 合理的嵌套 `Action`，写出更加 `hooks` 思想的代码

**示例**

```vue

<script setup>
import {ref, computed} from "vue";
import {Action} from "vue-await-util";

function useCountAction() {
  const count = ref(0);

  function add() {
    count.value += 1;
  }

  return {
    count,
    add,
  };
}

function useCalcCountAction({count}) {
  const calcCount = computed(() => count.value + 100);

  return {
    calcCount,
  };
}

</script>

<template>
  <Action :use-action="useCountAction" #default="{count, add}">
    <h1>{{ count.value }}</h1>
    <button @click="add">add</button>
    <Action :options="{count}" :use-action="useCalcCountAction" #default="{calcCount}">
      <h1>{{ calcCount.value }}</h1>
    </Action>
  </Action>
</template>
```

### 插槽

> 实现插槽思想的组件  
> `Host` 宿主  
> `Tmpl` 模板  
> `Slotted` 占位  
> ***`Host` 只渲染第一个子元素，第一个元素不能是 `Tmpl`，其他元素都是 `Tmpl` 组件***  
> `Tmpl` 和 `Slotted` 的 `name` 一一对应，默认是 `default`

**示例**

```vue

<script setup>
import {Host, Tmpl, Slotted} from "vue-await-util";

</script>

<template>
  <!-- Host 只会渲染第一个子元素，其他元素都是 Tmpl 组件 -->
  <!-- 注意：注释也算元素，不能放在 Host 第一个位置 -->
  <Host>
    <div>
      <h1>hello</h1>
      <!-- name 默认是 default，和 Tmpl 对应 -->
      <Slotted></Slotted>
      <Slotted name="item" value="你好"></Slotted>
    </div>
    <Tmpl>
      <h1>hi</h1>
    </Tmpl>
    <Tmpl name="item" #default="{value}">
      <h1>{{ value }}</h1>
    </Tmpl>
  </Host>
</template>
```

> `Tmpl` 中的 `Slotted`，和***上一层*** `Host` 的 `Tmpl` 对应

```vue

<script setup>
import {Host, Tmpl, Slotted} from "vue-await-util";

</script>

<template>
  <Host>
    <Host>
      <Host>
        <div>
          <h1>start</h1>
          <Slotted></Slotted>
          <h1>end</h1>
        </div>
        <Tmpl>
          <Slotted></Slotted>
          <h1>3</h1>
        </Tmpl>
      </Host>
      <Tmpl>
        <Slotted></Slotted>
        <h1>2</h1>
      </Tmpl>
    </Host>
    <Tmpl>
      <h1>1</h1>
    </Tmpl>
  </Host>
</template>
```

### 链式组件

> 组件嵌套层级太深，将其变成类似于 `Promise` 链式调用  
> `Gen` 生成器  
> `Yield` 下一步要渲染的元素  
> `Next` 渲染下一步元素  
> ***`Gen` 只渲染第一个子元素，第一个元素不能是 `Yield`，其他元素都是 `Yield` 组件***

```vue

<script setup>
import {Gen, Yield, Next} from "vue-await-util";

</script>

<template>
  <Gen>
    <div>
      <h1>hello</h1>
      <Next></Next>
    </div>
    <Yield>
      <h1>hi</h1>
      <Next name="james"></Next>
    </Yield>
    <Yield #default="{name}">
      <h1>你好 - {{ name }}</h1>
    </Yield>
  </Gen>
</template>
```

### 小程序

> ***直接导入的组件，小程序不能使用***  
> 小程序只能使用 `hook`，可用的组件在 `vue-await-util/dist/components` 目录下

```vue

<script setup>
import {useAwaitWatch} from "vue-await-util";
import AwaitWatch from "vue-await-util/dist/components/AwaitWatch.vue";

</script>

<template>
  <view></view>
</template>
```

## EOF