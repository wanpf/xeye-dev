<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { removeAuthorization, AUTH_TYPE } from "@/service/common/request";
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import { getMenu } from './menu';
import PipySvg from "@/assets/img/pipy-white.png";
import store from "@/store";
import { isAdmin } from "@/service/common/authority-utils";
import { useConfirm } from "primevue/useconfirm";
const confirm = useConfirm();
const model = computed(() => {
	return getMenu(isAdmin())
});
const desktopPath = computed(() => {
	return isAdmin()?'/server/clients':'/client/hostinfo'
});
const clientPath = computed(() => {
	return store.getters["account/client"]?('/'+store.getters["account/client"]):null
});

const { layoutConfig, onMenuToggle } = useLayout();

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
//====
const logout = () => {
    confirm.require({
        message: 'Are you sure you want to exit?',
        header: 'Logout',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
					removeAuthorization(AUTH_TYPE.BASIC);
					store.commit('account/setUser', null);
          router.push('/login');
        },
        reject: () => {
            
        }
    });
};
</script>

<template>
	<Menubar class="app-top-bar" :model="model">
			<template #start>
				<Avatar :image="PipySvg" class="logo" size="large"/>
			</template>
			<template #item="{ item, props, hasSubmenu, root }">
					<router-link v-if="item.route && !!clientPath && item.cond == 'client'" v-slot="{ href, navigate }" :to="item.route+clientPath" custom>
							<a v-ripple :href="href" v-bind="props.action" @click="navigate">
									<span :class="item.icon" />
									<span class="ml-2">{{ item.label }}</span>
							</a>
					</router-link>
					<router-link v-else-if="item.route && !item.cond" v-slot="{ href, navigate }" :to="item.route" custom>
							<a v-ripple :href="href" v-bind="props.action" @click="navigate">
									<span :class="item.icon" />
									<span class="ml-2">{{ item.label }}</span>
							</a>
					</router-link>
					<a v-else-if="!item.route" v-ripple :href="item.url" :target="item.target" v-bind="props.action">
							<span :class="item.icon" />
							<span class="ml-2">{{ item.label }}</span>
							<span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
					</a>
			</template>
			<template #end>
					<div class="flex align-items-center gap-2">
						<a @click="logout">
							<Avatar icon="pi pi-power-off" class="right-icon" size="large"  />
						</a>
					</div>
			</template>
	</Menubar>
	<ConfirmDialog></ConfirmDialog>
    <!-- <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>SAKAI</span>
        </router-link>

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <button @click="onTopBarMenuButton()" class="p-link layout-topbar-button">
                <i class="pi pi-calendar"></i>
                <span>Calendar</span>
            </button>
            <button @click="onTopBarMenuButton()" class="p-link layout-topbar-button">
                <i class="pi pi-user"></i>
                <span>Profile</span>
            </button>
            <button @click="onSettingsClick()" class="p-link layout-topbar-button">
                <i class="pi pi-cog"></i>
                <span>Settings</span>
            </button>
        </div>
    </div> -->
</template>

<style lang="scss" scoped></style>
