<script setup>

import { ref, reactive, h, watch, computed, onMounted, onBeforeMount } from 'vue';
import * as echarts from 'echarts';
import PipyProxyService from '@/service/PipyProxyService';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import store from "@/store";
import dayjs from 'dayjs';
import { useRoute } from 'vue-router'
const route = useRoute();

const pipyProxyService = new PipyProxyService();
const docHeight = ref(document.documentElement.clientHeight - 46);
const dataSource = ref([]);

const detail = "";
const sortField = ref("request_time");
const sortOrder = ref(-1);
const table = "pipy";

const total = ref(0);
const current = ref(0);
const pageSize = ref(10);

let defaultStartDate = new Date();
defaultStartDate.setDate(defaultStartDate.getDate()-1)
// const range = ref([dayjs(defaultStartDate.toLocaleDateString()),null])
const range = ref([defaultStartDate,new Date()]);
const filters = ref(null);
const schemes = ref(['http', 'https']);
const groupBy = ref({ name: 'Host', code: 'host' });
const groupByOptions = ref([
    { name: 'Host', code: 'host' },
    { name: 'Client Ip', code: 'client_ip' },
    { name: 'Scheme', code: 'scheme' },
    { name: 'Status', code: 'response_code' },
    { name: 'Request Size', code: 'request_size' },
    { name: 'Response Size', code: 'response_size' },
    { name: 'User Agent', code: 'user_agent' },
]);

const getSql = (where) => {
	let _order = sortOrder?.value==-1?'desc':'asc';
	let sql = `Select * From ${table} ${where ||''} order by ${sortField.value || 'request_time'} ${_order} Limit ${pageSize.value} Offset ${current.value}`;
	return sql;
}

const getBitUnit = (value)=> {
	if(value>(1024 * 1024 * 1024)){
		return (value/(1024 * 1024 * 1024)).toFixed(2) + "GB";
	} else if(value>(1024 * 1024)){
		return (value/(1024 * 1024)).toFixed(2) + "MB";
	} else if(value>1024){
		return (value/1024).toFixed(2) + "KB";
	} else {
		return value*1 + "B";
	}
}


const renderLeftChart = (data) => {
	let _data = data || [];
	if(_data.length >= 0){
		let _all = {
			// make an record to fill the bottom 50%
			value: 0,
			itemStyle: {
				// stop the chart from rendering this piece
				color: 'none',
				decal: {
					symbol: 'none'
				}
			},
			label: {
				show: false
			}
		}
		data.forEach((item)=>{
			_all.value += item.value *1;
		});
		_data.push(_all);
	}
	
	const option = {
		tooltip: {
			trigger: 'item'
		},
		legend: {
			type: 'scroll',
			top: '5%',
			left: '0%',
			orient: 'vertical',
			// doesn't perfectly work with our tricks, disable it
			selectedMode: false
		},
		series: [
			{
				type: 'pie',
				radius: ['40%', '70%'],
				center: ['100%', '45%'],
				// adjust the start angle
				startAngle: 270,
				label: {
					show: true,
					formatter(param) {
						// correct the percentage
						return param.name + ' (' + param.percent * 2 + '%)';
					}
				},
				data: _data
			}
		]
	};
	var dom = document.getElementById('left-chart');
	var chart = echarts.init(dom);
	chart.setOption(option);
}

const renderRightChart = (data) => {

	const valueData = [],categoryData = [];
	data.forEach((item)=>{
		categoryData.push(
			echarts.format.formatTime('yyyy-MM-dd\nhh:mm:ss', new Date(item.request_time), false)
		);
		valueData.push(item.response_time)
	})
	
	const option = {
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow'
			}
		},
		grid: {
			bottom: 90
		},
		dataZoom: [
			{
				top: 0,
				id: 'dataZoomX',
				type: 'slider',
				xAxisIndex: [0],
				filterMode: 'filter'
			},
			{
				id: 'dataZoomY',
				type: 'slider',
				yAxisIndex: [0],
				filterMode: 'empty'
			}
		],
		xAxis: {
			data: categoryData,
			silent: false,
			splitLine: {
				show: false
			},
			splitArea: {
				show: false
			}
		},
		yAxis: {
			splitArea: {
				show: false
			}
		},
		series: [
			{
				type: 'bar',
				data: valueData,
				// Set `large` for large data amount
				large: true
			}
		]
	};
	var dom = document.getElementById('right-chart');
	var chart = echarts.init(dom);
	chart.setOption(option);
	chart.on('datazoom', function (params,b) {
		if(params.dataZoomId == 'dataZoomX'){
			// const startVal = Math.floor(categoryData.length * (params.start/100))
			// const endVal = Math.floor(categoryData.length * (params.end/100))
			// startAccessTime.value = categoryData[startVal];
			// endAccessTime.value = categoryData[endVal];
			// if(!loading.value){
			// 	loading.value = true;
			// 	setTimeout(() => {
			// 		current.value = 1;
			// 		searchTable();
			// 	}, 1000);
			// }
		}
	});
}


const getCount = (where) => {
	let sql = `Select count(1) From ${table} ${where ||''} `;
	return sql
}
const getLeftSql = (where) => {
	let sql = `Select count(1) as value,${groupBy.value.code} as name From ${table} ${where ||''} group by ${groupBy.value.code}`;
	return sql
}
const getRightSql = (where) => {
	let sql = `Select response_time, request_time From ${table} ${where ||''} order by request_time asc`;
	return sql
}
const startAccessTime = ref();
const endAccessTime = ref();
const search = () => {
	searchTable();
	searchLeftChart()
}
const loading = ref(false);
const searchTable = () => {
	loading.value = false;
	store.commit('account/setClient', route.params?.id);
	pipyProxyService.query({
		id: route.params?.id,
		sql: getCount(appendWhere())
	})
		.then(res => {
			total.value = res?.data[0]['count(1)'];
		})
		.catch(err => console.log('Request Failed', err)); 
		
	pipyProxyService.query({
		id: route.params?.id,
		sql: getSql(appendWhere())
	})
		.then(res => {
			
			dataSource.value = res?.data;
			// dataSource.value.forEach((a)=>{
			// 	a.response_size = 100000
			// })
			setTimeout(()=>{
				loading.value = false;
			},1000)
		})
		.catch(err => console.log('Request Failed', err)); 
	
	if(current.value == 0){
		pipyProxyService.query({
			id: route.params?.id,
			sql: getRightSql(appendWhere())
		})
			.then(res => {
				renderRightChart(res?.data);
			})
			.catch(err => console.log('Request Failed', err)); 
	}
}
const searchLeftChart = () => {
	
		pipyProxyService.query({
			id: route.params?.id,
			sql: getLeftSql(appendWhere())
		})
		.then(res => {
			renderLeftChart(res?.data);
		})
		.catch(err => console.log('Request Failed', err)); 
}
const appendWhere = () => {
 
	let where = '';
	if(filters.value){
		const filters_ary = [];
		Object.keys(filters.value).forEach((col) => {
			let filters_str = "";
			if(filters.value[col] != null && col != "global"){
				if(filters.value[col].constraints){
					let cidx = 0;
					filters.value[col].constraints.forEach((constraint,cidx)=>{
						if(constraint.value != null){
							if(cidx > 0){
								filters_str += ` ${filters.value[col].operator} `
							}
							filters_str += appendWhereItem(col, constraint);
							cidx ++;
						}
					})
				} else if(filters.value[col].value != null) {
					filters_str += appendWhereItem(col, filters.value[col])
				}
				if(!!filters_str){
					filters_ary.push(filters_str);
				}
			}
		})
		
		
			if(filters_ary.length > 0){
				where = ' where (' + filters_ary.join(") and (") +")";
			}
	}
	
	if(!!range.value && range.value[0]){
		where += ((where=='')? ' where ': " and ")+` request_time > '${dayjs(range.value[0]).format('YYYY-MM-DD HH:mm:ss')}'`;
	}
	if(!!range.value && range.value[1]){
		where += ((where=='')? ' where ': " and ")+` request_time < '${dayjs(range.value[1]).format('YYYY-MM-DD HH:mm:ss')}'`;
	}
	return where;
}

const appendWhereItem = (col, filter) => {
	switch (filter.matchMode){
		case FilterMatchMode.STARTS_WITH:
			return ` ${col} like '${filter.value}%' `
		case FilterMatchMode.ENDS_WITH:
			return ` ${col} like '%${filter.value}' `
		case FilterMatchMode.CONTAINS:
			return ` ${col} like '%${filter.value}%' `
		case FilterMatchMode.NOT_CONTAINS:
			return ` ${col} not like '%${filter.value}%' `
		case FilterMatchMode.LESS_THAN:
			return ` ${col} < '${filter.value}' `
		case FilterMatchMode.LESS_THAN_OR_EQUAL_TO:
			return ` ${col} <= '${filter.value}' `
		case FilterMatchMode.GREATER_THAN:
			return ` ${col} > '${filter.value}' `
		case FilterMatchMode.GREATER_THAN_OR_EQUAL_TO:
			return ` ${col} >= '${filter.value}' `
		default:
			return ` ${col} = '${filter.value}' `
	}
}


const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
				scheme: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
				response_code: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]},
        host: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        url: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        request_size: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
				response_size: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
				response_time: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
        client_ip: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
				user_agent: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
				
    //     representative: { value: null, matchMode: FilterMatchMode.IN },
    //     date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    //     activity: { value: [0, 50], matchMode: FilterMatchMode.BETWEEN },
    };
};

const clearFilter = () => {
    initFilters();
};

const searchPage = (e)=>{
	if(e){
		current.value = e.first;
		pageSize.value = e.rows;
		search();
	}
}
const searchSort = (e)=>{
	if(e){
		sortField.value = e.sortField;
		sortOrder.value = e.sortOrder;
		current.value = 0
		search();
	}
}
watch(filters,()=>{
	current.value = 0
	search();
},{
	deep: true
});
onBeforeMount(() => {
    initFilters();
});
onMounted(() => {
	search();
})
const home = ref({
    icon: 'pi pi-desktop'
});
</script>

<template>
    <div class="grid">
			
				<div class="col-12" v-if="route.params?.id" style="padding-bottom: 0;">
					<Breadcrumb :home="home" :model="[{label:route.params?.id}]" />
				</div>
				<div class="col-12 lg:col-6 xl:col-6">
					<Card>
						<template #content>
							<div style="width: 100%;height: 360px;" id="right-chart"></div>
						</template>
					</Card>
				</div>
        <div class="col-12 lg:col-6 xl:col-6">
					<Card>
						<template #title>
							<Dropdown @change="searchLeftChart()" v-model="groupBy" :options="groupByOptions" optionLabel="name" placeholder="Select" />
						</template>
						<template #content>
							<div style="width: 100%;height: 315px;" id="left-chart"></div>
						</template>
					</Card>
				</div>
        <div class="col-12">
					<Card class="nopd">
						<template #content>
                <DataTable
									@sort="searchSort"
									@filter="searchFilter"
									:value="dataSource"
									v-model:sortField="sortField"
									v-model:sortOrder="sortOrder"
									dataKey="id"
									:rowHover="true"
									v-model:filters="filters"
									filterDisplay="menu"
									:loading="loading"
									responsiveLayout="scroll"
									:globalFilterFields="['scheme', 'response_code', 'host', 'url', 'request_size', 'response_size', 'response_time', 'client_ip', 'user_agent']"
                >
                    <template #header>
                        <div class="flex justify-content-between flex-column sm:flex-row">
													<span class="p-input-icon-left mb-2">
															<Calendar @hide="search()" style="width: 330px;" showIcon v-model="range" showTime hourFormat="24" selectionMode="range" :manualInput="false" />
													    <!-- <InputText v-model="filters['global'].value" placeholder="Keyword Search" style="width: 100%" /> -->
													</span>
													<Button type="button" icon="pi pi-filter-slash" label="Clear" class="p-button-outlined mb-2" @click="clearFilter()" />
                        </div>
                    </template>
                    <template #empty> No customers found. </template>
										<Column :showFilterOperator="false" :showFilterMatchModes="false"   field="scheme" header="Scheme" style="min-width: 3rem">
												<template #body="{ data }">
													<Tag :severity="data.scheme == 'https'?'success':'info'" :value="data.scheme"></Tag>
												</template>
												<template #filter="{ filterModel }">
													<Dropdown v-model="filterModel.value" :options="schemes" placeholder="Any" class="p-column-filter" :showClear="true">
													    <template #value="slotProps">
													        <span :class="'customer-badge status-' + slotProps.value" v-if="slotProps.value">{{ slotProps.value }}</span>
													        <span v-else>{{ slotProps.placeholder }}</span>
													    </template>
													    <template #option="slotProps">
													        <span :class="'customer-badge status-' + slotProps.option">{{ slotProps.option }}</span>
													    </template>
													</Dropdown>
												</template>
										</Column>
										<Column sortable field="response_code" header="Status" style="min-width: 3rem">
												<template #body="{ data }">
														<Tag v-if="data.response_code>0" :severity="['','','success','warning','danger','danger'][data.response_code.substr(0,1)]" :value="data.response_code"></Tag>
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column sortable field="host" header="Host" style="min-width: 12rem">
												<template #body="{ data }">
													{{data.host}}
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column sortable field="url" header="Url" style="min-width: 16rem;max-width: 24rem;word-break: break-all;">
												<template #body="{ data }">
													{{data.url}}
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column sortable field="request_time" header="Request Time" style="min-width: 6rem">
												<template #body="{ data }">
													{{data.request_time}}
												</template>
										</Column>
										<Column :filterMatchModeOptions="[
											{ label: 'Greater Than', value: 'gte' },
											{ label: 'Less Than', value: 'lte' },
										]"  sortable field="request_size" header="Request Size" style="min-width: 5rem">
												<template #body="{ data }">
													<b>{{getBitUnit(data.request_size)}}</b>
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column :filterMatchModeOptions="[
											{ label: 'Greater Than', value: 'gte' },
											{ label: 'Less Than', value: 'lte' },
										]"  sortable field="response_time" header="Response Time" style="min-width: 6rem">
												<template #body="{ data }">
													{{data.response_time}}ms
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column :filterMatchModeOptions="[
											{ label: 'Greater Than', value: 'gte' },
											{ label: 'Less Than', value: 'lte' },
										]" sortable field="response_size" header="Response Size" style="min-width: 5rem">
												<template #body="{ data }">
													<b>{{getBitUnit(data.response_size)}}</b>
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column sortable field="client_ip" header="Client IP" style="min-width: 10rem">
												<template #body="{ data }">
													{{data.client_ip}}
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
										<Column sortable field="user_agent" header="User Agent" style="min-width: 12rem">
												<template #body="{ data }">
													{{decodeURI(data.user_agent)}}
												</template>
												<template #filter="{ filterModel }">
														<InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Search" />
												</template>
										</Column>
                </DataTable>
								<Paginator 
									:rowsPerPageOptions="[10, 20, 50]"
									@page="searchPage"
									:totalRecords="total"
									v-model:first="current"
									v-model:rows="pageSize"
									currentPageReportTemplate="{first} to {last} of {totalRecords}"
								></Paginator>
						</template>
					</Card>
        </div>
    </div>
</template>

<style scoped lang="scss">
::v-deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

::v-deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}
</style>
