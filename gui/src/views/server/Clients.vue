<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router'
import PipyProxyService from '@/service/PipyProxyService';
const router = useRouter();
import store from "@/store";
const pipyProxyService = new PipyProxyService();

const clients = ref([]);
onMounted(() => {
	// clients.value = [{
	// 	name: "FA:E9:52:9B:EF:A6",
	// 	category: "ccc",
	// 	price: "111",
	// 	inventoryStatus: "INSTOCK",
	// },{
	// 	name: "FA:E9:52:9B:EF:A6",
	// 	category: "ccc",
	// 	price: "111",
	// 	inventoryStatus: "INSTOCK",
	// }];
	// loadTag();
	store.commit('account/setClient', null);
	pipyProxyService.clients()
		.then(res => {
			clients.value = res?.data;
			loadTag();
		})
		.catch(err => console.log('Request Failed', err)); 
});

const tags = ref([]);

const changeTag = () => {
	localStorage.setItem('tagList', JSON.stringify(tags.value));
}
const loadTag = () => {
	const tagJSON = !!localStorage.getItem('tagList')?JSON.parse(localStorage.getItem('tagList')):{};
	tags.value = tagJSON;
	clients.value.forEach((user)=>{
		if(!tags.value.hasOwnProperty(user)){
			tags.value[user] = [];
		}
	})
}
const network = (id) => {
	router.push(`/server/network/${id}`)
}
const hostinfo = (id) => {
	router.push(`/server/hostinfo/${id}`)
}
const testtool = (id) => {
	router.push(`/server/testtool/${id}`)
}
const hoverClient = ref();
const setHover = (key) =>{
	hoverClient.value = key;
}
</script>

<template>
			<DataView :value="clients">
					<template #list="slotProps">
							<div class="grid grid-nogutter">
									<div v-for="(item, index) in slotProps.items" :key="index" class="col-12 card">
											<div class="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
													<!-- <img class="w-9 sm:w-16rem xl:w-10rem shadow-2 block xl:block mx-auto border-round" :src="`https://primefaces.org/cdn/primevue/images/product/${item.image}`" :alt="item.name" /> -->
													<Avatar icon="pi pi-desktop" class="right-icon" size="xlarge"  />
													<div class="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
															<div class="flex flex-column align-items-center sm:align-items-start gap-3">
																	<div class="text-2xl font-bold text-900">{{ item }}</div>
																	<div class="flex align-items-center">
																			<ChipList  v-model:list="tags[item]" @change="changeTag"/>
																	</div>
															</div>
															<div class="flex flex-row align-items-center sm:align-items-end gap-3 sm:gap-2">
																	<Button @mouseenter="setHover('hostinfo'+index)" @click="hostinfo(item)" icon="pi pi-info" rounded :label="hoverClient == ('hostinfo'+index)?'Host Info':null"></Button>
																	<Button @mouseenter="setHover('network'+index)" @click="network(item)" icon="pi pi-globe" rounded :label="hoverClient == ('network'+index)?'Network':null"></Button>
																	<Button @mouseenter="setHover('testtool'+index)" @click="testtool(item)" icon="pi pi-wifi" rounded :label="hoverClient == ('testtool'+index)?'Test Tool':null"></Button>
															</div>
													</div>
											</div>
									</div>
							</div>
					</template>
			</DataView>
</template>

<style scoped lang="scss">
::v-deep(.p-dataview-content) {
  background-color: transparent !important;
}

</style>
