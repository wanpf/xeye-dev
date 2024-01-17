<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';

const { layoutConfig } = useLayout();

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'pipy-white.png' : 'pipy.svg'}`;
});
</script>

<template>
    <div class="layout-footer">
        <img :src="logoUrl" alt="Logo" height="20" class="mr-2" />
        By
        <span class="font-medium ml-2">Pipy proxy</span>
    </div>
</template>
<style lang="scss" scoped></style>
