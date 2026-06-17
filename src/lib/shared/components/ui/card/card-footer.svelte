<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="card-footer"
  class={cn(
    'px-8 group-data-[size=sm]/card:px-5 [.border-t]:pt-8 group-data-[size=sm]/card:[.border-t]:pt-5 flex items-center',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
