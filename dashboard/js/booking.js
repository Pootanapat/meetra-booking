
let selection=null,dragging=false;
const $=id=>document.getElementById(id);
const time=i=>{let n=420+i*30;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`};
const mins=t=>{let [h,m]=t.split(':').map(Number);return h*60+m};
const overlap=(a,b,c,d)=>mins(a)<mins(d)&&mins(b)>mins(c);
const past=(date,t)=>date<todayISO()||(date===todayISO()&&mins(t)<=new Date().getHours()*60+new Date().getMinutes());
function render(){
 let date=$('datePicker').value,query=$('searchRoom').value.toLowerCase(),cap=+$('capacityFilter').value;
 $('roomRows').innerHTML='';
 ROOMS.filter(r=>(r.name+r.id).toLowerCase().includes(query)&&r.capacity>=cap).forEach(r=>{
  let row=document.createElement('div');row.className='room-row';
  let info=document.createElement('div');info.className='room-info';info.innerHTML=`<div class="room-thumb">${r.icon}</div><div><b>${r.name} <span style="color:var(--purple)">${r.id}</span></b><small>♙ ${r.capacity} คน • ชั้น ${r.floor}</small></div>`;
  let slots=document.createElement('div');slots.className='slots';slots.dataset.room=r.id;
  for(let i=0;i<20;i++){let a=time(i),b=time(i+1),busy=getBookings().some(x=>x.roomId===r.id&&x.date===date&&overlap(a,b,x.start,x.end));let el=document.createElement('div');el.className='slot '+(busy?'booked':past(date,a)?'past':'available');el.dataset.index=i;el.title=a+' - '+b;slots.append(el)}
  row.append(info,slots);$('roomRows').append(row);
 });
 $('roomCount').textContent=ROOMS.length;$('todayCount').textContent=getBookings().filter(b=>b.date===todayISO()).length;
 $('availableCount').textContent=ROOMS.length-new Set(getBookings().filter(b=>b.date===date).map(b=>b.roomId)).size;
 drawNow();updateSelection();
}
function drawNow(){document.querySelectorAll('.now-line').forEach(x=>x.remove());if($('datePicker').value!==todayISO())return;let n=new Date().getHours()*60+new Date().getMinutes();if(n<420||n>1020)return;document.querySelectorAll('.slots').forEach(s=>{let l=document.createElement('div');l.className='now-line';l.style.left=`calc(8px + (100% - 16px) * ${(n-420)/600})`;s.append(l)})}
function choose(room,i){let a=time(i),b=time(i+1);if(past($('datePicker').value,a)||getBookings().some(x=>x.roomId===room&&x.date===$('datePicker').value&&overlap(a,b,x.start,x.end)))return;selection={room,start:i,end:i};dragging=true;render()}
function updateSelection(){if(!selection){$('selectionPanel').classList.remove('show');return}$('selectionPanel').classList.add('show');let lo=Math.min(selection.start,selection.end),hi=Math.max(selection.start,selection.end),a=time(lo),b=time(hi+1),bad=past($('datePicker').value,a)||getBookings().some(x=>x.roomId===selection.room&&x.date===$('datePicker').value&&overlap(a,b,x.start,x.end));let r=ROOMS.find(x=>x.id===selection.room);$('selectionTitle').textContent=r.name+' ('+r.id+')';$('selectionInfo').textContent=$('datePicker').value+' • '+a+' – '+b;$('selectionError').textContent=bad?'ช่วงเวลานี้ไม่ว่างหรือผ่านไปแล้ว':'';$('confirmBooking').disabled=bad;document.querySelectorAll(`.slots[data-room="${selection.room}"] .slot`).forEach(s=>{let i=+s.dataset.index;if(i>=lo&&i<=hi)s.classList.add(bad?'invalid':'selected')})}
document.addEventListener('mousedown',e=>{let s=e.target.closest('.slot.available');if(s)choose(s.closest('.slots').dataset.room,+s.dataset.index)});
document.addEventListener('mouseover',e=>{let s=e.target.closest('.slot');if(dragging&&s&&s.closest('.slots').dataset.room===selection.room){selection.end=+s.dataset.index;render()}});
document.addEventListener('mouseup',()=>dragging=false);
$('clearSelection').onclick=()=>{selection=null;render()};
$('confirmBooking').onclick=()=>{if(!selection)return;let u=getUser();if(!u){alert('กรุณาเข้าสู่ระบบก่อนจอง');location.href='login.html';return}let lo=Math.min(selection.start,selection.end),hi=Math.max(selection.start,selection.end),a=time(lo),b=time(hi+1),all=getBookings();if(past($('datePicker').value,a)||all.some(x=>x.roomId===selection.room&&x.date===$('datePicker').value&&overlap(a,b,x.start,x.end))){render();return}all.push({id:Date.now(),roomId:selection.room,date:$('datePicker').value,start:a,end:b,owner:u.name,status:'ยืนยันแล้ว'});saveBookings(all);selection=null;render();alert('บันทึกการจองเรียบร้อย')};
$('datePicker').value=todayISO();$('datePicker').onchange=render;$('searchRoom').oninput=render;$('capacityFilter').onchange=render;$('todayBtn').onclick=()=>{$('datePicker').value=todayISO();render()};
function shift(d){let x=new Date($('datePicker').value+'T12:00:00');x.setDate(x.getDate()+d);$('datePicker').value=x.toISOString().slice(0,10);render()}
$('prevDay').onclick=()=>shift(-1);$('nextDay').onclick=()=>shift(1);
for(let i=0;i<20;i++){let e=document.createElement('div');e.className='hour';e.textContent=i%2===0?time(i):'';$('timeHead').append(e)}
render();setInterval(drawNow,30000);
