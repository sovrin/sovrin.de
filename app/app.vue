<script setup lang="ts">
// Pages crossfade in step with the wall (Site.vue). The leaving page keeps its
// width while the column changes under it, and its place on screen while the
// window moves to the new page's top, or back to where it was left (vue-router
// keeps that in history.state). Done here, as the new page lands, rather than
// by the router (router.options.ts), which would wait for the crossfade to end.
const target = () => history.state?.scroll?.top ?? 0
const freeze = (el: Element) => {
  const page = el as HTMLElement
  page.style.inlineSize = `${page.offsetWidth}px`
  page.style.translate = `0 ${target() - scrollY}px`
}
// On enter, not leave: only once the new page is in can the window reach a saved position.
const land = () => scrollTo(0, target())
</script>

<template>
  <Site>
    <NuxtPage :transition="{name: 'page', onBeforeLeave: freeze, onEnter: land}"/>
  </Site>
</template>
