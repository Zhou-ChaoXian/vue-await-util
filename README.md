# vue-await-util

> 处理组件中的 `promise`

> ***推荐使用组件，因为组件有良好的边界，更利于开发维护***

### 目录

- [`useAwait`](#useawait)
- [`useAwaitWatch`](#useawaitwatch)
- [`useAwaitWatchEffect`](#useawaitwatcheffect)
- [`Await`](#await)
- [`AwaitWatch`](#awaitwatch) 🌷🌸🌺 ( ***使用最多*** )
- [`AwaitWatchEffect`](#awaitwatcheffect)
- [`Action`](#action)
- [`Host Provision Slotted`](#插槽)
- [`uniapp 小程序使用`](#小程序)

### useAwait

**props** (问号表示可选属性)

| `prop` (属性) |        `type` (类型)        | `description` (描述) |
|:------------|:-------------------------:|:-------------------|
| resolve     | Promise &#124; undefined  | 需要处理的 `promise`    |
| init?       |            any            | 初始化的值              |
| delay?      |          number           | 延迟，防止闪烁            |
| jumpFirst?  |          boolean          | 跳过首次请求             |
| onStart?    | (first?: boolean) => void | promise 开始时执行      |
| onEnd?      | (first?: boolean) => void | promise 结束时执行      |
| onError?    |   (error?: any) => void   | promise 报错时执行      |

**return** (返回值是一个 `ref`)

| `prop` (属性) |                `type` (类型)                 | `description` (描述) |
|:------------|:------------------------------------------:|:-------------------|
| first       |                    bool                    | 是否是第一次执行           |
| status      | "pending" &#124; "resolve" &#124; "reject" | 当前状态               |
| data        |                    any                     | 结果                 |
| error       |                    any                     | 错误信息               |

**示例**

```vue
<script setup>
import {ref} from "vue";
import {useAwait, isPending} from "vue-await-util";

const count = ref(0);

const resolveData = useAwait({
  resolve: Promise.resolve("hello" + count.value)
});

function add() {
  count.value += 1;
  resolveData.value = Promise.resolve("hello" + count.value);
}

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <h1 v-if="isPending(resolveData.status)">loading...</h1>
    <h1 v-else>{{ resolveData.data }}</h1>
  </div>
</template>
```

### useAwaitWatch

**props** (问号表示可选属性)

| `prop` (属性) |        `type` (类型)        | `description` (描述)  |
|:------------|:-------------------------:|:--------------------|
| deps?       |           Deps            | 依赖数组                |
| handle      |          Handle           | 处理依赖数组，生成 `promise` |
| init?       |            any            | 初始化的值               |
| delay?      |          number           | 延迟，防止闪烁             |
| jumpFirst?  |          boolean          | 跳过首次请求              |
| onStart?    | (first?: boolean) => void | promise 开始时执行       |
| onEnd?      | (first?: boolean) => void | promise 结束时执行       |
| onError?    |   (error?: any) => void   | promise 报错时执行       |

**return** (返回值 [resolveData, watchOptions] )

| `prop` (属性) |                `type` (类型)                 | `description` (描述) |
|:------------|:------------------------------------------:|:-------------------|
| first       |                    bool                    | 是否是第一次执行           |
| status      | "pending" &#124; "resolve" &#124; "reject" | 当前状态               |
| data        |                    any                     | 结果                 |
| error       |                    any                     | 错误信息               |

| `prop` (属性) | `type` (类型) | `description` (描述) |
|:------------|:-----------:|:-------------------|
| update      | () => void  | 强制刷新               |
| unWatch     | () => void  | 取消监听依赖的变化          |
| reWatch     | () => void  | 重新监听依赖的变化          |

```ts
import type {WatchSource} from "vue";

type Deps = WatchSource[];
type OnCleanup = (cleanupFn: () => void) => void;
type Handle<T> = (value?: any[], oldValue?: any[], onCleanup?: OnCleanup) => Promise<T>;
```

**示例**

```vue
<script setup>
import {ref} from "vue";
import {useAwaitWatch, isPending} from "vue-await-util";

const count = ref(0);

function add() {
  count.value += 1;
}

const [resolveData] = useAwaitWatch({
  deps: [count],
  handle: async () => {
    return "hello" + count.value;
  }
});

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <h1 v-if="isPending(resolveData.status)">loading...</h1>
    <h1 v-else>{{ resolveData.data }}</h1>
  </div>
</template>
```

### useAwaitWatchEffect

**props** (问号表示可选属性)

| `prop` (属性) |        `type` (类型)        | `description` (描述) |
|:------------|:-------------------------:|:-------------------|
| handle      |          Handle           | 生成 `promise`       |
| init?       |            any            | 初始化的值              |
| delay?      |          number           | 延迟，防止闪烁            |
| onStart?    | (first?: boolean) => void | promise 开始时执行      |
| onEnd?      | (first?: boolean) => void | promise 结束时执行      |
| onError?    |   (error?: any) => void   | promise 报错时执行      |

**return** (返回值 [resolveData, watchOptions] )

| `prop` (属性) |                `type` (类型)                 | `description` (描述) |
|:------------|:------------------------------------------:|:-------------------|
| first       |                    bool                    | 是否是第一次执行           |
| status      | "pending" &#124; "resolve" &#124; "reject" | 当前状态               |
| data        |                    any                     | 结果                 |
| error       |                    any                     | 错误信息               |

| `prop` (属性) | `type` (类型) | `description` (描述) |
|:------------|:-----------:|:-------------------|
| update      | () => void  | 强制刷新               |
| unWatch     | () => void  | 取消监听依赖的变化          |
| reWatch     | () => void  | 重新监听依赖的变化          |

```ts
type OnCleanup = (cleanupFn: () => void) => void;
type Handle<T> = (onCleanup?: OnCleanup) => Promise<T>;
```

**示例**

```vue
<script setup>
import {ref} from "vue";
import {useAwaitWatchEffect, isPending} from "vue-await-util";

const count = ref(0);

function add() {
  count.value += 1;
}

const [resolveData] = useAwaitWatchEffect({
  handle: async () => {
    return "hello" + count.value;
  }
});

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <h1 v-if="isPending(resolveData.status)">loading...</h1>
    <h1 v-else>{{ resolveData.data }}</h1>
  </div>
</template>
```

### Await

> 封装 `useAwait`

**示例**

```vue
<script setup>
import {ref} from "vue";
import {Await, isPending} from "vue-await-util";

const count = ref(0);
const promise = ref(Promise.resolve("hello" + count.value));

function add() {
  count.value += 1;
  promise.value = Promise.resolve("hello" + count.value);
}

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <Await :resolve="promise" #default="{status, data}">
      <h1 v-if="isPending(status)">loading...</h1>
      <h1 v-else>{{ data }}</h1>
    </Await>
  </div>
</template>
```

### AwaitWatch

> 封装 `useAwaitWatch`

**示例**

```vue
<script setup>
import {ref} from "vue";
import {AwaitWatch, isPending} from "vue-await-util";

const count = ref(0);

function add() {
  count.value += 1;
}

const deps = [count];

async function handle() {
  return "hello" + count.value;
}

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <AwaitWatch :deps :handle #default="{status, data}">
      <h1 v-if="isPending(status)">loading...</h1>
      <h1 v-else>{{ data }}</h1>
    </AwaitWatch>
  </div>
</template>
```

### AwaitWatchEffect

> 封装 `AwaitWatchEffect`

**示例**

```vue
<script setup>
import {ref} from "vue";
import {AwaitWatchEffect, isPending} from "vue-await-util";

const count = ref(0);

function add() {
  count.value += 1;
}

async function handle() {
  return "hello" + count.value;
}

</script>

<template>
  <div>
    <h1>count - {{ count }}</h1>
    <button @click="add">add</button>
    <AwaitWatchEffect :handle #default="{status, data}">
      <h1 v-if="isPending(status)">loading...</h1>
      <h1 v-else>{{ data }}</h1>
    </AwaitWatchEffect>
  </div>
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

**示例**

```vue
<script setup>
import {Host, Provision, Slotted} from "vue-await-util";

</script>

<template>
  <!-- Host 只会渲染第一个子元素，其他元素都是 Provision 组件 -->
  <!-- 注意：注释也算元素，不能放在 Host 第一个位置 -->
  <Host>
    <div>
      <h1>hello</h1>
      <!-- name 默认是 default，和 Provision 对应 -->
      <Slotted></Slotted>
      <Slotted name="item" value="你好"></Slotted>
    </div>
    <Provision>
      <h1>hi</h1>
    </Provision>
    <Provision name="item" #default="{value}">
      <h1>{{ value }}</h1>
    </Provision>
  </Host>
</template>
```

### 小程序

> ***直接导入的组件，小程序不能使用***

```vue
<script setup>
import {useAwait, useAwaitWatch, useAwaitWatchEffect} from "vue-await-util";
import Await from "vue-await-util/dist/components/Await.vue";
import AwaitWatch from "vue-await-util/dist/components/AwaitWatch.vue";
import AwaitWatchEffect from "vue-await-util/dist/components/AwaitWatchEffect.vue";

</script>

<template>
  <view></view>
</template>
```

## EOF