<script setup>
import { ref,onMounted, onBeforeUnmount } from 'vue';
import TerminalService from "primevue/terminalservice";
import PipyProxyService from '@/service/PipyProxyService';
const pipyProxyService = new PipyProxyService();
import { useRoute } from 'vue-router'
import store from "@/store";
const route = useRoute();

const cmdType = ref('download');
const msg = {
	download: 'Typing the download address please.',
	ping: 'Typing the ping IP address please.',
	'os': 'Typing the OS query please.',
	'db': 'Typing the sqllite query please.',
}

const info = ref({
  "hostname": "DESKTOP-5SI23LH",
  "osName": "Microsoft Windows 10",
  "osVersion": "10.0.19045  Build 19045",
  "lastBootUptime": "2023/12/26, 10:27:09",
  "cpuInfo": "Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",
  "ipAddress": "192.168.122.242",
  "mac": "52-54-00-B8-84-04"
});
const systemProxy = ref(true);

onMounted(() => {
    TerminalService.on('command', commandHandler);
		store.commit('account/setClient', route.params?.id);
		pipyProxyService.info({
			id: route.params?.id
		})
			.then(res => {
				info.value = res?.data;
				systemProxy.value = res?.data?.systemProxy == 'on';
			})
			.catch(err => console.log('Request Failed', err)); 
})

onBeforeUnmount(() => {
    TerminalService.off('command', commandHandler);
})
const changeProxy = () => {
		pipyProxyService.invoke({
			id: route.params?.id,
			verb: systemProxy.value?"enable-proxy":"disable-proxy", 
		})
			.then(res => {
			})
			.catch(err => {
			}); 
}
const commandHandler = (text) => {
    let response;
    let argsIndex = text.indexOf(' ');
    let command = argsIndex !== -1 ? text.substring(0, argsIndex) : text;
		
		if(cmdType.value == 'os'){
			pipyProxyService.os({
				id: route.params?.id,
				sql: text
			})
				.then(res => {
					TerminalService.emit('response', JSON.stringify(res?.data,null,'\t'));
				})
				.catch(err => {
					TerminalService.emit('response', err?.response?.data?.error || err);
				}); 
			
		} else if(cmdType.value == 'db'){
			pipyProxyService.query({
				id: route.params?.id,
				sql: text
			})
				.then(res => {
					TerminalService.emit('response', JSON.stringify(res?.data,null,'\t'));
				})
				.catch(err => {
					TerminalService.emit('response', err?.response?.data?.error || err);
				}); 
			
		} else {
			pipyProxyService.invoke({
				id: route.params?.id,
				verb: cmdType.value, 
				target: text
			})
				.then(res => {
					TerminalService.emit('response', JSON.stringify(res?.data,null,'\t'));
				})
				.catch(err => {
					TerminalService.emit('response', err?.response?.data?.error || err);
				}); 
			
		}
    
}
const home = ref({
    icon: 'pi pi-desktop'
});
</script>

<template>

		<div class="col-12" v-if="route.params?.id" style="padding-left: 0px;padding-top: 0;padding-right: 0;">
			<Breadcrumb :home="home" :model="[{label:route.params?.id}]" />
		</div>
		<Card>
			
			<template #title>
				
				
				<Chip class="pl-0 pr-3">
						<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
							<RadioButton v-model="cmdType" inputId="cmdType2" name="cmdType" value="download" />
						</span>
						<span class="ml-2 font-medium">Download</span>
				</Chip>
				
				<Chip class="ml-2 pl-0 pr-3">
						<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
							<RadioButton v-model="cmdType" inputId="cmdType1" name="cmdType" value="ping" />
						</span>
						<span class="ml-2 font-medium">Ping</span>
				</Chip>
				
				<Chip class="ml-2 pl-0 pr-3">
						<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
							<RadioButton v-model="cmdType" inputId="cmdType1" name="cmdType" value="os" />
						</span>
						<span class="ml-2 font-medium">OS Query</span>
				</Chip>
				
				<Chip class="ml-2 pl-0 pr-3">
						<span class="bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center">
							<RadioButton v-model="cmdType" inputId="cmdType1" name="cmdType" value="db" />
						</span>
						<span class="ml-2 font-medium">DB Query</span>
				</Chip>
				<div style="float: right;">
					<font style="font-size: 1rem;vertical-align: middle;padding-right: 10px;">System Proxy</font>
					<InputSwitch @change="changeProxy" style="vertical-align: middle;" v-model="systemProxy" />
				</div>
		</template>
		<template #content>
			<Terminal
					:welcomeMessage="msg[cmdType]"
					:prompt="cmdType+' $'"
					aria-label="Test Tool"
					:pt="{
							root: 'bg-gray-900 text-white border-round',
							prompt: 'text-gray-400 mr-2',
							command: 'text-primary-300',
							response: 'text-green-300'
					}"
			/>
		</template>
	</Card>
</template>

<style scoped lang="scss">
	
</style>
