/* 醫囑模組 OrderPad — 掛進 er-system.html 的「醫囑」分頁
 * 單擊「醫囑」：檢視該病人已開立醫囑（唯讀）
 * 雙擊「醫囑」：進入開立畫面（藥囑＋醫囑同一個搜尋框）
 * 整合：<script src="order-pad.js"></script>，並在 renderTab() 加
 *   else if(S.tab==='醫囑'){OrderPad.render(p,tb)}
 * 資料皆為虛構示範，劑量僅供介面展示。
 */
(function(){
'use strict';
const TYPES={med:'藥品',lab:'檢驗',img:'影像',proc:'處置',nur:'護理',con:'會診'};
const BADGE={med:'藥',lab:'檢',img:'影',proc:'處',nur:'護',con:'會'};
const e=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hhmm=ts=>new Date(ts).toLocaleTimeString('zh-TW',{hour12:false,hour:'2-digit',minute:'2-digit'});

/* ---------- 目錄（m: 藥品預設 [劑量,單位,途徑,頻次]）---------- */
const D=[
 {t:'med',n:'Ceftriaxone 1 g',zh:'頭孢曲松',al:'rocephin cef cro 抗生素',m:['1','g','IV','Q24H'],flag:'w',fn:'Penicillin 過敏：低度交叉反應，請確認'},
 {t:'med',n:'Piperacillin/Tazobactam 4.5 g',zh:'tazocin 盤尼西林類',al:'tazo pip 抗生素',m:['4.5','g','IV','Q8H'],allergy:'penicillin',fn:'Penicillin 類藥物'},
 {t:'med',n:'Amoxicillin/Clavulanate 1.2 g',zh:'安滅菌 augmentin',al:'amox 抗生素',m:['1.2','g','IV','Q8H'],allergy:'penicillin',fn:'Penicillin 類藥物'},
 {t:'med',n:'Levofloxacin 750 mg',zh:'左氧氟沙星 cravit',al:'levo 抗生素',m:['750','mg','IV','Q24H'],renal:1,fn:'eGFR<50 需調整劑量'},
 {t:'med',n:'Azithromycin 500 mg',zh:'日舒 zithromax',al:'azi 抗生素',m:['500','mg','IV','Q24H']},
 {t:'med',n:'Normal Saline 0.9% 1000 mL',zh:'生理食鹽水',al:'ns n/s 輸液 fluid',m:['1000','mL','IV','ONCE']},
 {t:'med',n:"Lactated Ringer's 1000 mL",zh:'乳酸林格氏液',al:'lr ringer 輸液 fluid',m:['1000','mL','IV','ONCE']},
 {t:'med',n:'Acetaminophen 500 mg',zh:'乙醯胺酚 普拿疼',al:'apap panadol paracetamol 退燒 止痛',m:['500','mg','PO','Q6H PRN']},
 {t:'med',n:'Ketorolac 30 mg',zh:'凱托洛 toradol',al:'nsaid 止痛',m:['30','mg','IV','Q8H PRN'],renal:1,fn:'eGFR<50 避免 NSAID'},
 {t:'med',n:'Morphine 4 mg',zh:'嗎啡',al:'mor 止痛 麻醉',m:['4','mg','IV','Q4H PRN']},
 {t:'med',n:'Fentanyl 50 mcg',zh:'吩坦尼',al:'fent 止痛 麻醉',m:['50','mcg','IV','Q1H PRN']},
 {t:'med',n:'Ondansetron 4 mg',zh:'嗚丹西創 zofran',al:'止吐 nausea',m:['4','mg','IV','Q8H PRN']},
 {t:'med',n:'Metoclopramide 10 mg',zh:'滅吐靈 primperan',al:'止吐',m:['10','mg','IV','Q8H PRN']},
 {t:'med',n:'Nitroglycerin 0.6 mg SL',zh:'硝化甘油',al:'ntg nitro 胸痛',m:['0.6','mg','SL','Q5MIN x3']},
 {t:'med',n:'Aspirin 300 mg',zh:'阿斯匹靈',al:'asa 胸痛 抗血小板',m:['300','mg','PO','ONCE']},
 {t:'med',n:'Clopidogrel 300 mg',zh:'保栓通 plavix',al:'抗血小板 胸痛',m:['300','mg','PO','ONCE']},
 {t:'med',n:'Enoxaparin 60 mg',zh:'克塞 clexane',al:'lmwh 抗凝',m:['60','mg','SC','Q12H'],renal:1,fn:'eGFR<50 需減量/監測'},
 {t:'med',n:'Heparin 5000 U',zh:'肝素',al:'抗凝',m:['5000','U','IV','ONCE']},
 {t:'med',n:'Furosemide 20 mg',zh:'立瀉舒 lasix',al:'利尿',m:['20','mg','IV','ONCE']},
 {t:'med',n:'Salbutamol 2.5 mg Neb',zh:'沙丁胺醇 ventolin',al:'氣喘 吸入',m:['2.5','mg','NEB','Q4H PRN']},
 {t:'med',n:'Ipratropium 0.5 mg Neb',zh:'安舒疾 atrovent',al:'氣喘 吸入',m:['0.5','mg','NEB','Q6H PRN']},
 {t:'med',n:'Methylprednisolone 40 mg',zh:'美卓 solu-medrol',al:'steroid 類固醇 過敏',m:['40','mg','IV','Q12H']},
 {t:'med',n:'Epinephrine 0.3 mg IM',zh:'腎上腺素',al:'epi 過敏 anaphylaxis 休克',m:['0.3','mg','IM','ONCE']},
 {t:'med',n:'Diphenhydramine 50 mg',zh:'苯海拉明 benadryl',al:'過敏 抗組織胺',m:['50','mg','IV','ONCE']},
 {t:'med',n:'Dexamethasone 5 mg',zh:'地塞米松',al:'steroid 類固醇',m:['5','mg','IV','ONCE']},
 {t:'med',n:'Regular Insulin 6 U',zh:'胰島素',al:'insulin ri 血糖 dka',m:['6','U','IV','ONCE']},
 {t:'med',n:'50% Glucose 50 mL',zh:'葡萄糖',al:'d50 低血糖',m:['50','mL','IV','ONCE']},
 {t:'med',n:'Metformin 500 mg',zh:'庫魯化',al:'dm 糖尿病',m:['500','mg','PO','BID'],renal:1,fn:'eGFR<45 避免起始'},
 {t:'med',n:'Norepinephrine 4 mg/250 mL',zh:'去甲腎上腺素 levophed',al:'nor 升壓 休克 sepsis',m:['0.05','mcg/kg/min','IV','持續']},
 {t:'med',n:'Midazolam 2 mg',zh:'導眠靈 dormicum',al:'mdz 鎮靜 抽搐',m:['2','mg','IV','ONCE']},
 {t:'med',n:'Lorazepam 2 mg',zh:'安定文',al:'抽搐 seizure 鎮靜',m:['2','mg','IV','ONCE']},
 {t:'med',n:'Famotidine 20 mg',zh:'胃安 pepcid',al:'制酸 胃',m:['20','mg','IV','Q12H']},
 {t:'lab',n:'CBC + DC',zh:'全血球計數及分類',al:'血液 cbc wbc hb plt',tube:'EDTA 紫頭',k:'lab'},
 {t:'lab',n:'Glucose (POCT)',zh:'快速血糖',al:'dextrostix 血糖 sugar hgt',tube:'指尖',k:'bio'},
 {t:'lab',n:'BUN / Creatinine / eGFR',zh:'腎功能',al:'cr bun 腎',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'Electrolytes (Na/K/Cl)',zh:'電解質',al:'na k 鉀 鈉 lyte',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'Troponin I (hs)',zh:'心肌旋轉蛋白',al:'trop tni 胸痛 心肌梗塞 ami',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'CK-MB',zh:'心肌酵素',al:'ckmb 胸痛',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'BNP / NT-proBNP',zh:'腦利鈉肽',al:'心衰 hf 呼吸困難',tube:'EDTA 紫頭',k:'bio'},
 {t:'lab',n:'D-dimer',zh:'D-二聚體',al:'dd 肺栓塞 pe dvt',tube:'藍頭',k:'lab'},
 {t:'lab',n:'PT / aPTT / INR',zh:'凝血功能',al:'coag 凝血 inr',tube:'藍頭',k:'lab'},
 {t:'lab',n:'Lactate',zh:'乳酸',al:'lac 敗血症 sepsis 休克',tube:'血氣針',k:'bio'},
 {t:'lab',n:'ABG 動脈血液氣體',zh:'血氣分析',al:'abg 血氣 呼吸',tube:'血氣針',k:'bio'},
 {t:'lab',n:'Blood Culture x2',zh:'血液培養',al:'bc 敗血症 發燒 culture',tube:'血培養瓶 2 套',k:'scope'},
 {t:'lab',n:'Urine Routine + Culture',zh:'尿液常規及培養',al:'ua u/a 尿 uti',tube:'尿杯',k:'scope'},
 {t:'lab',n:'CRP',zh:'C反應蛋白',al:'發炎 發燒',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'Procalcitonin',zh:'降鈣素原',al:'pct 敗血症',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'Liver Function (AST/ALT/Bil)',zh:'肝功能',al:'lft got gpt 肝',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'Lipase / Amylase',zh:'脂肪酶',al:'胰臟 腹痛',tube:'生化 黃頭',k:'bio'},
 {t:'lab',n:'β-hCG',zh:'懷孕試驗',al:'preg 懷孕 hcg',tube:'尿 / 血',k:'bio'},
 {t:'lab',n:'COVID/Flu 快篩',zh:'新冠流感抗原',al:'rapid 發燒 咳嗽 pcr',tube:'鼻咽拭子',k:'scope'},
 {t:'lab',n:'Type & Screen',zh:'血型及抗體篩檢',al:'血庫 輸血 ts',tube:'EDTA 紫頭',k:'lab'},
 {t:'img',n:'Chest X-ray (portable)',zh:'胸部X光 床邊',al:'cxr 胸 肺 呼吸',k:'xr'},
 {t:'img',n:'KUB / Abdomen X-ray',zh:'腹部X光',al:'kub 腹痛 阻塞',k:'xr'},
 {t:'img',n:'CT Brain without contrast',zh:'腦部電腦斷層 平掃',al:'ct 腦 頭 中風 stroke 頭痛 暈',k:'ct'},
 {t:'img',n:'CT Chest/Abdomen/Pelvis with contrast',zh:'胸腹骨盆CT 增強',al:'ct 腹 胸 contrast 顯影劑',k:'ct',renal:1,fn:'顯影劑腎病變風險，請確認腎功能'},
 {t:'img',n:'CTPA (肺動脈)',zh:'肺栓塞CT',al:'ct pe 肺栓塞',k:'ct',renal:1,fn:'顯影劑腎病變風險，請確認腎功能'},
 {t:'img',n:'Abdominal Ultrasound',zh:'腹部超音波',al:'us 超音波 膽 腎',k:'xr'},
 {t:'img',n:'POCUS / FAST',zh:'急診超音波',al:'fast 外傷 pocus 床邊',k:'xr'},
 {t:'img',n:'12-lead ECG',zh:'12導程心電圖',al:'ekg ecg 心電圖 胸痛 心悸',k:'ekg'},
 {t:'img',n:'Echocardiography',zh:'心臟超音波',al:'echo 心衰',k:'xr'},
 {t:'proc',n:'IV Access (18G)',zh:'建立靜脈通路',al:'iv 點滴 留置針 line'},
 {t:'proc',n:'Foley Catheter 導尿',zh:'導尿管留置',al:'foley 尿管'},
 {t:'proc',n:'Nasogastric Tube',zh:'鼻胃管',al:'ngt levin 鼻胃'},
 {t:'proc',n:'Oxygen Therapy',zh:'氧氣治療',al:'o2 nasal cannula mask 氧氣 呼吸'},
 {t:'proc',n:'Endotracheal Intubation',zh:'氣管內管插管',al:'ett 插管'},
 {t:'proc',n:'Wound Suture 縫合',zh:'傷口縫合',al:'suture 外傷 傷口'},
 {t:'proc',n:'Cardioversion / Defibrillation',zh:'電擊',al:'dc shock 心律不整'},
 {t:'nur',n:'Vital Signs Q15MIN',zh:'生命徵象監測 每15分',al:'vs 測量 monitor'},
 {t:'nur',n:'Cardiac Monitor + SpO₂',zh:'心電監視',al:'monitor 監視 ecg'},
 {t:'nur',n:'I/O 輸出入量記錄',zh:'輸出入',al:'io intake output'},
 {t:'nur',n:'NPO 禁食',zh:'禁食',al:'npo 空腹'},
 {t:'nur',n:'Fall Precaution 防跌',zh:'預防跌倒',al:'跌倒 fall'},
 {t:'nur',n:'Isolation 隔離（飛沫）',zh:'飛沫隔離',al:'隔離 isolation covid 流感'},
 {t:'con',n:'Cardiology 心臟內科',zh:'心內會診',al:'cv 心臟 胸痛 consult'},
 {t:'con',n:'Neurology 神經內科',zh:'神內會診',al:'neuro 中風 consult'},
 {t:'con',n:'General Surgery 一般外科',zh:'外科會診',al:'gs 腹痛 consult'},
 {t:'con',n:'Orthopedics 骨科',zh:'骨科會診',al:'ortho 骨折 consult'},
 {t:'con',n:'ICU 加護病房',zh:'加護會診',al:'icu 重症 consult'},
];
D.forEach((d,i)=>{d.id=i;d.hay=(d.n+' '+d.zh+' '+(d.al||'')).toLowerCase()});
const byName=n=>D.find(d=>d.n===n);
const SETS=[
 {n:'敗血症 Bundle',ids:['Blood Culture x2','Lactate','CBC + DC','Procalcitonin','Ceftriaxone 1 g','Normal Saline 0.9% 1000 mL','Vital Signs Q15MIN']},
 {n:'胸痛 / ACS',ids:['12-lead ECG','Troponin I (hs)','CBC + DC','Electrolytes (Na/K/Cl)','Aspirin 300 mg','Cardiac Monitor + SpO₂','Chest X-ray (portable)']},
 {n:'急性中風',ids:['CT Brain without contrast','Glucose (POCT)','PT / aPTT / INR','12-lead ECG','Neurology 神經內科']},
 {n:'呼吸困難',ids:['Chest X-ray (portable)','ABG 動脈血液氣體','BNP / NT-proBNP','Salbutamol 2.5 mg Neb','Oxygen Therapy']},
 {n:'過敏性休克',ids:['Epinephrine 0.3 mg IM','Diphenhydramine 50 mg','Methylprednisolone 40 mg','Oxygen Therapy','Cardiac Monitor + SpO₂','IV Access (18G)']},
];
const ROUTES=['IV','PO','SC','IM','SL','NEB','TOP'];
const FREQS=['ONCE','STAT','Q4H','Q6H','Q8H','Q12H','Q24H','BID','TID','QID','Q4H PRN','Q6H PRN','Q8H PRN','Q5MIN x3','持續'];
const PRIS=['STAT','ASAP','Routine'];
const STATUS={wait:'待收件',run:'執行中',done:'已完成'};

/* ---------- 病人資料輔助 ---------- */
const allergies=p=>p.allergy||(p.allergy=/過敏/.test(p.cc||'')?['penicillin']:[]);
const egfr=p=>p.egfr??(p.egfr=(+p.age>=65?42:90));
const rnd=seed=>{let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};

function toOrder(d,o,by,ts,status){
  const detail=d.t==='med'?`${o.route} ${o.freq}${String(o.dose)!==String(d.m[0])?`（劑量 ${o.dose} ${o.unit}）`:''}`:d.t==='lab'?(d.tube||''):'';
  return {ts,t:d.t,name:d.n,zh:d.zh,detail,pri:o.pri,status,by,note:o.note||''};
}
function seedHistory(p){
  if(p.orders)return p.orders;
  const r=rnd(parseInt(String(p.id).replace(/\D/g,''),10)||7);
  const base=['Vital Signs Q15MIN','IV Access (18G)','CBC + DC','Glucose (POCT)','12-lead ECG','Normal Saline 0.9% 1000 mL','Acetaminophen 500 mg','Chest X-ray (portable)','BUN / Creatinine / eGFR','Cardiac Monitor + SpO₂'];
  const n=2+Math.floor(r()*4),pick=[];
  while(pick.length<n){const nm=base[Math.floor(r()*base.length)];if(!pick.includes(nm))pick.push(nm)}
  const now=Date.now();
  p.orders=pick.map((nm,i)=>{
    const d=byName(nm),ts=Math.min(now-60000,(p.arrive||now)+(i+1)*6*60000);
    const age=now-ts,st=age>40*60000?'done':age>12*60000?'run':'wait';
    const o={dose:d.m?.[0],unit:d.m?.[1],route:d.m?.[2],freq:d.m?.[3],pri:i<2?'STAT':'ASAP',note:''};
    return toOrder(d,o,p.doc||'—',ts,st);
  }).sort((a,b)=>b.ts-a.ts);
  return p.orders;
}

/* ---------- 樣式（沿用主頁 CSS 變數與 .fs/.btn/.search） ---------- */
const CSS=`
.op{display:flex;flex-direction:column;gap:6px;font-size:inherit}
.op .bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.op .bar .grow{flex:1}
.op .hint{font-size:12px;color:var(--muted)}
.op .hint b{color:var(--accent)}
.op .ttl{font-weight:700}
.op .bd{display:inline-block;min-width:26px;text-align:center;border-radius:4px;color:#fff;font-size:12px;padding:1px 4px;font-weight:600}
.op .bd.med{background:#7c3aed}.op .bd.lab{background:#0891b2}.op .bd.img{background:#4f46e5}.op .bd.proc{background:#c2410c}.op .bd.nur{background:#2f7d4f}.op .bd.con{background:#be185d}
.op table{width:100%;border-collapse:collapse;background:var(--panel);color:var(--ink)}
.op th{position:sticky;top:0;background:var(--accent-soft);text-align:left;padding:4px 8px;font-weight:600;border-bottom:1px solid var(--line);font-size:13px;z-index:1}
.op td{padding:4px 8px;border-bottom:1px solid var(--line);vertical-align:middle}
.op tbody tr{cursor:pointer}.op tbody tr:hover{background:var(--accent-soft)}.op tbody tr.sel{background:var(--sel)}
.op .st{border-radius:999px;padding:0 10px;font-size:12px;white-space:nowrap}
.op .st.wait{background:#fff04d;color:#3b3300}.op .st.run{background:#8bd55a;color:#12330a}.op .st.done{background:#8fe3ef;color:#08343b}
.op .pri-STAT{color:var(--danger);font-weight:700}.op .pri-ASAP{color:#b26a00;font-weight:600}
.op .dtl{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:6px 10px;font-size:13px}
.op .box{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:6px;overflow:auto}
.op .grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:8px}
@media(max-width:900px){.op .grid{grid-template-columns:1fr}}
.op .sw{position:relative}
.op .sw input{width:100%;font-size:16px;padding:7px 10px;border-radius:6px}
.op .chips{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}
.op .chips .chip{cursor:pointer}
.op .sets{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:5px;align-items:center}
.op .sets .btn{border-style:dashed}
.op ul.res{list-style:none;margin:0;padding:0;max-height:240px;overflow:auto}
.op ul.res li{display:flex;gap:8px;align-items:center;padding:4px 8px;border-bottom:1px solid var(--line);cursor:pointer}
.op ul.res li.sel,.op ul.res li:hover{background:var(--accent-soft)}
.op ul.res li.sel{outline:1px solid var(--accent);outline-offset:-1px}
.op ul.res .nm{flex:1;min-width:0}.op ul.res .nm small{display:block;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.op mark{background:#ffe58a;color:#000;border-radius:2px}
.op .fl{font-size:12px;border-radius:4px;padding:0 6px;white-space:nowrap}
.op .fl.d{background:#fde8e8;color:#b91c1c;font-weight:600}.op .fl.w{background:#fff4e0;color:#b45309}.op .fl.i{background:var(--accent-soft);color:var(--accent)}
.op .star{border:0;background:none;color:var(--muted);font-size:16px;padding:0 3px}.op .star.on{color:#f59e0b}
.op .alerts{display:grid;gap:3px;margin-bottom:5px}
.op .alert{border-radius:4px;padding:3px 8px;font-size:13px}.op .alert.d{background:#fde8e8;color:#b91c1c}.op .alert.w{background:#fff4e0;color:#b45309}.op .alert.i{background:var(--accent-soft);color:var(--ink)}
.op .ord{border-bottom:1px solid var(--line);padding:5px 8px;border-left:4px solid var(--accent)}
.op .ord.bad{background:#fde8e8;color:#7f1d1d}
.op .ord .top{display:flex;gap:6px;align-items:center}.op .ord .top b{flex:1}
.op .ord .x{border:0;background:none;color:var(--muted);font-size:18px;line-height:1}
.op .f{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;align-items:center}
.op .f input,.op .f select{border:1px solid var(--line);background:var(--panel);color:var(--ink);border-radius:4px;padding:1px 4px;font-size:13px}
.op .f input.dose{width:62px}.op .f input.note{flex:1;min-width:100px}
.op .empty{padding:14px;text-align:center;color:var(--muted)}
.op .cartbox{max-height:220px}.op .hbox{max-height:260px}
.opwin .hbox{max-height:none;flex:1;min-height:0}
.opwin table{font-size:15.5px}.opwin td{padding:8px 12px}.opwin th{padding:7px 12px;font-size:14px}
.opwin .dtl{font-size:15px;padding:10px 14px}.opwin .search{font-size:15px}
.opov{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.opwin{width:min(1500px,96vw);height:94vh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);border:2px solid var(--accent);border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5);overflow:hidden;font-size:15px}
.ophead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 14px;background:var(--top);color:var(--top-ink);font-size:15px}
.ophead .grow{flex:1}.ophead .k{font-size:12px;opacity:.7;margin-right:-6px}
.opwin>.op{flex:1;min-height:0;padding:10px 14px}
.opwin .grid{flex:1;min-height:0}
.opwin .fs{display:flex;flex-direction:column;min-height:0;margin:0}
.opwin .fs .box{flex:1;min-height:0}
.opwin ul.res,.opwin .cartbox{max-height:none}
.opwin .sw input{font-size:19px;padding:10px 14px}
.opwin ul.res li{padding:7px 10px;font-size:15.5px}
.opwin .ord{padding:8px 10px}.opwin .f input,.opwin .f select{font-size:14.5px;padding:3px 6px}
.opwin .chips .chip,.opwin .sets .btn{font-size:14px}
.op .msg{background:var(--accent);color:#fff;border-radius:4px;padding:3px 10px;font-size:13px}
`;
function css(){if(document.getElementById('op-css'))return;const s=document.createElement('style');s.id='op-css';s.textContent=CSS;document.head.appendChild(s)}

/* ---------- 狀態 ---------- */
const ST={pid:null,mode:'history',type:'all',q:'',sel:0,hsel:-1,hfilter:'all',hq:'',fav:new Set(['Normal Saline 0.9% 1000 mL','Acetaminophen 500 mg','12-lead ECG','CBC + DC','Glucose (POCT)']),recent:[],msg:''};
let P=null,root=null,shown=[],msgT=0;
const cart=()=>P._draft||(P._draft=[]);

function render(p,tb){
  css();
  if(ST.pid!==p.id){ST.pid=p.id;ST.mode='history';ST.q='';ST.sel=0;ST.hsel=-1;ST.hfilter='all';ST.hq=''}
  P=p;seedHistory(p);allergies(p);egfr(p);closeOv();
  tb.innerHTML='<div class="op"></div>';
  root=tb.firstChild;
  summaryView();
  if(ST.open){ST.open=false;openOv()} // 檢視／開立都用大視窗，不擠在下方小面板
}
function summaryView(){
  const n=P.orders.length;
  root.innerHTML=`<div class="bar"><span class="ttl">已開立醫囑 ${n} 筆</span><span class="hint">單擊「醫囑」開大視窗檢視　·　<b>雙擊</b>進入開立</span><span class="grow"></span><button class="btn" data-a="view">檢視已開立醫囑</button><button class="btn primary" data-a="enter">＋ 開立醫囑</button></div>`;
  root.onclick=ev=>{const a=ev.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='enter')enter();else{ST.mode='history';ST.open=true;refresh()}};
}
function closeOv(){const o=document.getElementById('op-ov');if(o)o.remove()}
function openOv(){
  const lv=P.lvl;
  const ov=document.createElement('div');ov.id='op-ov';ov.className='opov';
  ov.innerHTML=`<div class="opwin"><div class="ophead">
    <span class="tri l${lv}">${lv}</span><b>${e(P.name)}</b><span>${e(P.sex)}/${e(P.age)}歲</span>
    <span class="k">流水號</span>${e(P.id)}<span class="k">床號</span>${e(P.bed)}<span class="k">主訴</span>${e(P.cc)}
    ${allergies(P).length?`<span class="fl d">過敏：${e(allergies(P).join('、'))}</span>`:''}<span class="fl w">eGFR ${egfr(P)}</span>
    <span class="grow"></span><button class="btn" data-a="close">✕ 關閉（Esc）</button></div><div class="op"></div></div>`;
  ov.addEventListener('mousedown',ev=>{if(ev.target===ov)close()});
  ov.addEventListener('click',ev=>{if(ev.target.closest('.ophead [data-a="close"]'))close()});
  ov.addEventListener('keydown',ev=>{if(ev.key==='Escape')ST.mode==='entry'?back():close()});
  ov.tabIndex=-1;
  document.body.appendChild(ov);
  root=ov.querySelector('.op');
  if(ST.mode==='entry')entryView();else{historyView();ov.focus()}
}
function close(){closeOv();ST.mode='history';refresh()}
const refresh=()=>{const tb=document.getElementById('tb');if(tb&&P)render(P,tb)};

/* ---------- 已開立醫囑（單擊） ---------- */
function historyView(){
  const O=P.orders;
  const cnt=k=>k==='all'?O.length:O.filter(o=>o.t===k).length;
  root.innerHTML=`
  <div class="bar">
    <span class="ttl">已開立醫囑（${O.length}）</span>
    <span class="grow"></span>
    <span class="hint">單擊列看明細　·　<b>雙擊「醫囑」或雙擊列</b>進入開立畫面</span>
    <button class="btn primary" data-a="enter">＋ 開立醫囑</button>
  </div>
  <div class="bar">
    <div class="chips" style="margin:0">${['all',...Object.keys(TYPES)].map(k=>`<button class="chip ${ST.hfilter===k?'on':''}" data-hf="${k}">${k==='all'?'全部':TYPES[k]}<span class="n">${cnt(k)}</span></button>`).join('')}</div>
    <input class="search" id="hq" placeholder="篩選已開醫囑" value="${e(ST.hq)}" style="width:150px">
  </div>
  <div class="box hbox"><table><thead><tr><th>時間</th><th>類別</th><th>醫囑內容</th><th>優先</th><th>狀態</th><th>開立</th></tr></thead><tbody id="hb"></tbody></table></div>
  <div class="dtl" id="hd"></div>`;
  paintHistory();
  root.onclick=ev=>{
    const a=ev.target.closest('[data-a]');if(a&&a.dataset.a==='enter'){enter();return}
    const f=ev.target.closest('[data-hf]');if(f){ST.hfilter=f.dataset.hf;ST.hsel=-1;historyView();return}
    const tr=ev.target.closest('tr[data-i]');
    if(tr){
      const i=+tr.dataset.i;
      if(ev.detail>=2){const d=byName(P.orders[i].name);enter();if(d)addItem(d,true);return} // 雙擊列＝再開一次
      ST.hsel=i;paintHistory();
    }
  };
  root.querySelector('#hq').oninput=ev=>{ST.hq=ev.target.value;ST.hsel=-1;paintHistory()};
}
function histList(){
  const q=ST.hq.toLowerCase();
  return P.orders.map((o,i)=>({o,i})).filter(({o})=>(ST.hfilter==='all'||o.t===ST.hfilter)&&(!q||(o.name+o.zh+o.detail+TYPES[o.t]).toLowerCase().includes(q)));
}
function paintHistory(){
  const L=histList();
  root.querySelector('#hb').innerHTML=L.length?L.map(({o,i})=>`<tr data-i="${i}" class="${ST.hsel===i?'sel':''}">
    <td>${hhmm(o.ts)}</td><td><span class="bd ${o.t}">${BADGE[o.t]}</span> ${TYPES[o.t]}</td>
    <td><b>${e(o.name)}</b>${o.detail?` <small style="color:var(--muted)">${e(o.detail)}</small>`:''}</td>
    <td class="pri-${o.pri}">${o.pri}</td><td><span class="st ${o.status}">${STATUS[o.status]}</span></td><td>${e(o.by)}</td></tr>`).join('')
    :`<tr><td colspan="6" class="empty">${P.orders.length?'沒有符合的醫囑':'尚未開立任何醫囑。雙擊「醫囑」開始開立。'}</td></tr>`;
  const o=P.orders[ST.hsel];
  root.querySelector('#hd').innerHTML=o?`<b>${e(o.name)}</b>（${e(o.zh||'')}）　${e(o.detail)}　·　${TYPES[o.t]}　·　${o.pri}　·　${STATUS[o.status]}　·　${new Date(o.ts).toLocaleString('zh-TW',{hour12:false})}　·　${e(o.by)}${o.note?`　·　備註：${e(o.note)}`:''}`
    :'<span style="color:var(--muted)">點選一筆醫囑查看明細</span>';
}

/* ---------- 開立畫面（雙擊） ---------- */
function enter(){ST.mode='entry';ST.q='';ST.sel=0;ST.open=true;refresh()}
function back(){ST.mode='history';ST.open=true;refresh()}
function entryView(){
  root.innerHTML=`
  <div class="bar"><span class="ttl">開立醫囑</span><span class="grow"></span>
    <span class="hint">藥品／檢驗／影像／處置／護理／會診 同一個搜尋框　·　↑↓ 選擇 · Enter 加入 · Tab 切類別 · Esc 返回</span></div>
  <div class="grid">
   <fieldset class="fs"><legend>搜尋（藥囑＋醫囑）</legend>
    <div class="sw"><input class="search" id="q" autocomplete="off" placeholder="例：cef、血糖、cxr、ct 腦、ntg、胸痛" value="${e(ST.q)}"></div>
    <div class="chips" id="chips"></div>
    <div class="sets" id="sets"><span class="hint">套餐：</span>${SETS.map((s,i)=>`<button class="btn" data-s="${i}">＋ ${s.n}</button>`).join('')}</div>
    <div class="box"><ul class="res" id="res"></ul></div>
   </fieldset>
   <fieldset class="fs"><legend>醫囑籃</legend>
    <div class="alerts" id="alerts"></div>
    <div class="box cartbox" id="cart"></div>
    <div class="bar" style="margin-top:6px"><span id="msg" class="msg" style="display:none"></span><span class="grow"></span>
     <button class="btn" data-a="clear">清空</button><button class="btn primary" id="go" data-a="submit">簽署並送出</button></div>
   </fieldset>
  </div>`;
  root.onclick=entryClick;root.ondblclick=null;
  root.addEventListener('input',entryInput);root.addEventListener('change',entryInput);
  const q=root.querySelector('#q');
  q.oninput=ev=>{ST.q=ev.target.value;ST.sel=0;paintRes()};
  q.onkeydown=ev=>{
    ev.stopPropagation();
    if(ev.key==='ArrowDown'){ev.preventDefault();ST.sel=Math.min(shown.length-1,ST.sel+1);paintRes()}
    else if(ev.key==='ArrowUp'){ev.preventDefault();ST.sel=Math.max(0,ST.sel-1);paintRes()}
    else if(ev.key==='Enter'){ev.preventDefault();if(shown[ST.sel])addItem(shown[ST.sel])}
    else if(ev.key==='Escape'){if(ST.q){ST.q='';q.value='';ST.sel=0;paintRes()}else back()}
    else if(ev.key==='Tab'){ev.preventDefault();const ks=['all',...Object.keys(TYPES)],i=ks.indexOf(ST.type);ST.type=ks[(i+(ev.shiftKey?-1:1)+ks.length)%ks.length];ST.sel=0;paintRes()}
  };
  paintRes();paintCart();q.focus();
}
function search(){
  const toks=ST.q.toLowerCase().split(/\s+/).filter(Boolean);
  const list=D.filter(d=>toks.every(t=>d.hay.includes(t)));
  const sc=d=>{let s=0;const n=d.n.toLowerCase();toks.forEach(t=>{if(n.startsWith(t))s+=10;else if(n.includes(t))s+=5;else if(d.zh.includes(t))s+=4});if(ST.fav.has(d.n))s+=3;if(ST.recent.includes(d.n))s+=2;return s};
  return list.sort((a,b)=>sc(b)-sc(a));
}
function hl(t){let h=e(t);ST.q.toLowerCase().split(/\s+/).filter(Boolean).forEach(k=>{h=h.replace(new RegExp('('+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>')});return h}
function paintRes(){
  const all=search();
  const cnt={all:all.length};Object.keys(TYPES).forEach(k=>cnt[k]=all.filter(d=>d.t===k).length);
  root.querySelector('#chips').innerHTML=['all',...Object.keys(TYPES)].map(k=>`<button class="chip ${ST.type===k?'on':''}" data-k="${k}">${k==='all'?'全部':TYPES[k]}<span class="n">${cnt[k]}</span></button>`).join('');
  let list=ST.type==='all'?all:all.filter(d=>d.t===ST.type);
  const idle=!ST.q&&ST.type==='all';
  if(idle){const fv=list.filter(d=>ST.fav.has(d.n)||ST.recent.includes(d.n));list=fv.length?fv:list.slice(0,10)}
  shown=list.slice(0,60);if(ST.sel>=shown.length)ST.sel=Math.max(0,shown.length-1);
  const done=n=>P.orders.find(o=>o.name===n);
  root.querySelector('#res').innerHTML=(idle?'<li style="cursor:default;color:var(--muted);font-size:12px">★ 常用 / 最近（輸入以搜尋全部）</li>':'')+(shown.length?shown.map((d,i)=>{
    const inCart=cart().some(c=>c.d.id===d.id),ord=done(d.n);
    const sub=d.t==='med'?`${d.zh} · ${d.m.join(' ')}`:d.t==='lab'?`${d.zh} · ${d.tube}`:d.zh;
    const bad=d.allergy&&allergies(P).includes(d.allergy);
    return `<li data-i="${i}" class="${i===ST.sel?'sel':''}"><span class="bd ${d.t}">${BADGE[d.t]}</span><div class="nm"><b>${hl(d.n)}</b><small>${hl(sub)}</small></div>
     ${bad?'<span class="fl d">過敏</span>':d.flag?'<span class="fl w">注意</span>':''}${d.renal&&egfr(P)<50?'<span class="fl w">腎功能</span>':''}
     ${ord?`<span class="fl i">已開 ${hhmm(ord.ts)}</span>`:''}${inCart?'<span class="fl i">✓ 籃中</span>':''}
     <button class="star ${ST.fav.has(d.n)?'on':''}" data-f="${i}" title="常用">★</button></li>`}).join(''):'<li class="empty" style="cursor:default">找不到符合項目</li>');
  const s=root.querySelector('#res li.sel');if(s)s.scrollIntoView({block:'nearest'});
}
function addItem(d,quiet){
  const c=cart();
  if(c.some(x=>x.d.id===d.id)){flash('已在醫囑籃：'+d.n);return}
  const o={d,pri:d.t==='nur'?'Routine':'ASAP',note:''};
  if(d.t==='med')[o.dose,o.unit,o.route,o.freq]=d.m;
  c.push(o);ST.recent=[d.n,...ST.recent.filter(x=>x!==d.n)].slice(0,8);
  if(!quiet)flash('已加入：'+d.n);
  paintCart();if(root.querySelector('#res'))paintRes();
}
function check(){
  const al=[],c=cart(),A=allergies(P),ok=egfr(P);
  c.forEach(x=>{
    x.bad=false;
    if(x.d.allergy&&A.includes(x.d.allergy)){al.push({l:'d',m:`過敏衝突：${x.d.n} — ${x.d.fn}（病人過敏：${A.join('、')}）`});x.bad=true}
    else if(x.d.flag==='w'&&x.d.fn)al.push({l:'w',m:`${x.d.n}：${x.d.fn}`});
    if(x.d.renal&&ok<50)al.push({l:'w',m:`${x.d.n}：${x.d.fn}（eGFR ${ok}）`});
    const prev=P.orders.find(o=>o.name===x.d.n);
    if(prev)al.push({l:'i',m:`本次就診已於 ${hhmm(prev.ts)} 開立「${x.d.n}」（${STATUS[prev.status]}），請確認是否重複`});
  });
  const names=c.map(x=>x.d.n);
  if(names.some(n=>n.startsWith('Ceftriaxone'))&&!names.includes('Blood Culture x2')&&!P.orders.some(o=>o.name==='Blood Culture x2'))al.push({l:'w',m:'建議：開立抗生素前先採血液培養'});
  if(names.some(n=>/contrast|CTPA/.test(n))&&!names.some(n=>n.startsWith('BUN'))&&!P.orders.some(o=>o.name.startsWith('BUN')))al.push({l:'w',m:'建議：增強CT前確認腎功能 (BUN/Cr)'});
  return al;
}
function paintCart(){
  const c=cart(),al=check(),opt=(a,v)=>a.map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('');
  root.querySelector('#alerts').innerHTML=[...new Map(al.map(a=>[a.m,a])).values()].map(a=>`<div class="alert ${a.l}">${a.l==='d'?'⛔':a.l==='w'?'⚠':'ℹ'} ${e(a.m)}</div>`).join('');
  root.querySelector('#cart').innerHTML=c.length?c.map((x,i)=>{
    const d=x.d;
    return `<div class="ord ${x.bad?'bad':''}"><div class="top"><span class="bd ${d.t}">${BADGE[d.t]}</span><b>${e(d.n)}</b><button class="x" data-x="${i}" title="移除">×</button></div>
    <div class="f">${d.t==='med'?`<input class="dose" data-i="${i}" data-k="dose" value="${e(x.dose)}"><span>${e(x.unit)}</span><select data-i="${i}" data-k="route">${opt(ROUTES,x.route)}</select><select data-i="${i}" data-k="freq">${opt(FREQS,x.freq)}</select>`:''}
    ${d.tube?`<span class="hint">${e(d.tube)}</span>`:''}
    <select data-i="${i}" data-k="pri">${opt(PRIS,x.pri)}</select><input class="note" data-i="${i}" data-k="note" placeholder="備註" value="${e(x.note)}"></div></div>`}).join('')
    :'<div class="empty">尚未開立。搜尋後按 Enter 加入，或套用常用套餐。</div>';
  const go=root.querySelector('#go'),bad=c.some(x=>x.bad);
  go.disabled=!c.length||bad;go.textContent=bad?'請先處理過敏衝突':'簽署並送出';
}
function flash(m){const el=root&&root.querySelector('#msg');if(!el)return;el.textContent=m;el.style.display='';clearTimeout(msgT);msgT=setTimeout(()=>{el.style.display='none'},2200)}
function entryInput(ev){
  const t=ev.target;if(!t.dataset||t.dataset.k===undefined)return;
  const x=cart()[+t.dataset.i];if(x)x[t.dataset.k]=t.value;
}
function entryClick(ev){
  const T=ev.target;
  const a=T.closest('[data-a]');
  if(a){
    if(a.dataset.a==='back')return back();
    if(a.dataset.a==='clear'){P._draft=[];paintCart();paintRes();return}
    if(a.dataset.a==='submit')return submit();
  }
  const k=T.closest('[data-k].chip');if(k){ST.type=k.dataset.k;ST.sel=0;paintRes();root.querySelector('#q').focus();return}
  const s=T.closest('[data-s]');if(s){const set=SETS[+s.dataset.s];set.ids.forEach(n=>{const d=byName(n);if(d)addItem(d,true)});flash('已套用：'+set.n);return}
  const x=T.closest('[data-x]');if(x){cart().splice(+x.dataset.x,1);paintCart();paintRes();return}
  const st=T.closest('.star');if(st){const d=shown[+st.dataset.f];ST.fav.has(d.n)?ST.fav.delete(d.n):ST.fav.add(d.n);paintRes();return}
  const li=T.closest('#res li[data-i]');if(li){addItem(shown[+li.dataset.i]);root.querySelector('#q').focus()}
}
function submit(){
  const c=cart();if(!c.length||c.some(x=>x.bad))return;
  const now=Date.now();
  c.slice().reverse().forEach(x=>{
    P.orders.unshift(toOrder(x.d,x,P.doc||'—',now,'wait'));
    const k=x.d.t==='med'?'med':x.d.t==='proc'||x.d.t==='nur'?'proc':x.d.k;
    if(k&&P.st)P.st[k]='N';
  });
  const n=c.length,stat=c.filter(x=>x.pri==='STAT').length;
  P._draft=[];ST.mode='history';ST.hsel=0;ST.open=true;
  if(typeof renderList==='function')try{renderList()}catch(_){}
  refresh();
  const el=root.querySelector('.bar');if(el){const m=document.createElement('span');m.className='msg';m.textContent=`已簽署送出 ${n} 項${stat?`（STAT ${stat}）`:''}`;el.insertBefore(m,el.children[1])}
}

/* ---------- 單擊／雙擊「醫囑」 ---------- */
const isOrderBtn=t=>{
  const b=t&&t.closest&&t.closest('.fk[data-tab="醫囑"],.shortbar button');
  return b&&b.textContent.trim()==='醫囑'?b:null;
};
/* 用 click 的 detail 判斷連點：按鈕在第一下就被重繪，原生 dblclick 不一定送得到 */
document.addEventListener('click',ev=>{
  if(!isOrderBtn(ev.target))return;
  const dbl=ev.detail>=2;
  ST.mode=dbl?'entry':'history';ST.open=true;
  if(dbl){ST.q='';ST.sel=0}
  if(ev.target.closest('.shortbar')&&typeof S!=='undefined'&&S.sel){S.tab='醫囑';renderDetail()}
},true);

window.OrderPad={render,enter,back};
})();
