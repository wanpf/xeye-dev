import{D as N,r as h,H as k,T as r,s as q,M,d as y,o as x,e as V,I as w,g as l,k as O,w as g,f as p,x as U,F as j}from"./index-8971ce3a.js";import{P as D}from"./PipyProxyService-a86ec14c.js";const F={key:0,class:"col-12",style:{"padding-left":"0px","padding-top":"0","padding-right":"0"}},R={class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},H=p("span",{class:"ml-2 font-medium"},"Download",-1),J={class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},z=p("span",{class:"ml-2 font-medium"},"Ping",-1),E={class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},Q=p("span",{class:"ml-2 font-medium"},"OS Query",-1),A={class:"bg-primary border-circle w-2rem h-2rem flex align-items-center justify-content-center"},G=p("span",{class:"ml-2 font-medium"},"DB Query",-1),K={style:{float:"right"}},X={__name:"Testtool",setup(L){const f=new D,c=N(),t=h("download"),S={download:"Typing the download address please.",ping:"Typing the ping IP address please.",os:"Typing the OS query please.",db:"Typing the sqllite query please."},I=h({hostname:"DESKTOP-5SI23LH",osName:"Microsoft Windows 10",osVersion:"10.0.19045  Build 19045",lastBootUptime:"2023/12/26, 10:27:09",cpuInfo:"Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",ipAddress:"192.168.122.242",mac:"52-54-00-B8-84-04"}),_=h(!0);k(()=>{var n,o;r.on("command",v),q.commit("account/setClient",(n=c.params)==null?void 0:n.id),f.info({id:(o=c.params)==null?void 0:o.id}).then(a=>{var s;I.value=a==null?void 0:a.data,_.value=((s=a==null?void 0:a.data)==null?void 0:s.systemProxy)=="on"}).catch(a=>console.log("Request Failed",a))}),M(()=>{r.off("command",v)});const B=()=>{var n;f.invoke({id:(n=c.params)==null?void 0:n.id,verb:_.value?"enable-proxy":"disable-proxy"}).then(o=>{}).catch(o=>{})},v=n=>{var a,s,u;let o=n.indexOf(" ");o!==-1&&n.substring(0,o),t.value=="os"?f.os({id:(a=c.params)==null?void 0:a.id,sql:n}).then(e=>{r.emit("response",JSON.stringify(e==null?void 0:e.data,null,"	"))}).catch(e=>{var d,i;r.emit("response",((i=(d=e==null?void 0:e.response)==null?void 0:d.data)==null?void 0:i.error)||e)}):t.value=="db"?f.query({id:(s=c.params)==null?void 0:s.id,sql:n}).then(e=>{r.emit("response",JSON.stringify(e==null?void 0:e.data,null,"	"))}).catch(e=>{var d,i;r.emit("response",((i=(d=e==null?void 0:e.response)==null?void 0:d.data)==null?void 0:i.error)||e)}):f.invoke({id:(u=c.params)==null?void 0:u.id,verb:t.value,target:n}).then(e=>{r.emit("response",JSON.stringify(e==null?void 0:e.data,null,"	"))}).catch(e=>{var d,i;r.emit("response",((i=(d=e==null?void 0:e.response)==null?void 0:d.data)==null?void 0:i.error)||e)})},P=h({icon:"pi pi-desktop"});return(n,o)=>{var b,T;const a=y("Breadcrumb"),s=y("RadioButton"),u=y("Chip"),e=y("font"),d=y("InputSwitch"),i=y("Terminal"),C=y("Card");return x(),V(j,null,[(b=w(c).params)!=null&&b.id?(x(),V("div",F,[l(a,{home:P.value,model:[{label:(T=w(c).params)==null?void 0:T.id}]},null,8,["home","model"])])):O("",!0),l(C,null,{title:g(()=>[l(u,{class:"pl-0 pr-3"},{default:g(()=>[p("span",R,[l(s,{modelValue:t.value,"onUpdate:modelValue":o[0]||(o[0]=m=>t.value=m),inputId:"cmdType2",name:"cmdType",value:"download"},null,8,["modelValue"])]),H]),_:1}),l(u,{class:"ml-2 pl-0 pr-3"},{default:g(()=>[p("span",J,[l(s,{modelValue:t.value,"onUpdate:modelValue":o[1]||(o[1]=m=>t.value=m),inputId:"cmdType1",name:"cmdType",value:"ping"},null,8,["modelValue"])]),z]),_:1}),l(u,{class:"ml-2 pl-0 pr-3"},{default:g(()=>[p("span",E,[l(s,{modelValue:t.value,"onUpdate:modelValue":o[2]||(o[2]=m=>t.value=m),inputId:"cmdType1",name:"cmdType",value:"os"},null,8,["modelValue"])]),Q]),_:1}),l(u,{class:"ml-2 pl-0 pr-3"},{default:g(()=>[p("span",A,[l(s,{modelValue:t.value,"onUpdate:modelValue":o[3]||(o[3]=m=>t.value=m),inputId:"cmdType1",name:"cmdType",value:"db"},null,8,["modelValue"])]),G]),_:1}),p("div",K,[l(e,{style:{"font-size":"1rem","vertical-align":"middle","padding-right":"10px"}},{default:g(()=>[U("System Proxy")]),_:1}),l(d,{onChange:B,style:{"vertical-align":"middle"},modelValue:_.value,"onUpdate:modelValue":o[4]||(o[4]=m=>_.value=m)},null,8,["modelValue"])])]),content:g(()=>[l(i,{welcomeMessage:S[t.value],prompt:t.value+" $","aria-label":"Test Tool",pt:{root:"bg-gray-900 text-white border-round",prompt:"text-gray-400 mr-2",command:"text-primary-300",response:"text-green-300"}},null,8,["welcomeMessage","prompt"])]),_:1})],64)}}};export{X as default};