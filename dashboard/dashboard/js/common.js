const ROOMS=[
{id:'701',name:'บุนนาค',capacity:100,floor:7,equipment:'โปรเจกเตอร์ • ไมโครโฟน • จอแสดงผล',icon:'🏢'},
{id:'702',name:'ชงโค',capacity:30,floor:7,equipment:'จอแสดงผล • กระดานไวท์บอร์ด',icon:'🏛️'},
{id:'703',name:'พิกุล',capacity:35,floor:7,equipment:'โปรเจกเตอร์ • ไมโครโฟน',icon:'🏢'},
{id:'704',name:'ราชพฤกษ์',capacity:40,floor:7,equipment:'จอแสดงผล • ไมโครโฟน • Wi-Fi',icon:'🏛️'},
{id:'706',name:'บัวหลวง',capacity:25,floor:7,equipment:'จอแสดงผล • กระดานไวท์บอร์ด',icon:'🏢'}
];
const getBookings=()=>JSON.parse(localStorage.getItem('kmitlBookings')||'[]');
const saveBookings=x=>localStorage.setItem('kmitlBookings',JSON.stringify(x));
const getUser=()=>JSON.parse(localStorage.getItem('kmitlCurrentUser')||'null');
const todayISO=()=>{let d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const fmtTime=t=>t;
function updateUserUI(){
 const u=getUser(), label=document.getElementById('userLabel'), avatar=document.getElementById('avatar');
 if(label) label.textContent=u?u.name:'ผู้เยี่ยมชม';
 if(avatar) avatar.textContent=u?u.name.charAt(0):'G';
 const login=document.getElementById('loginTop'),reg=document.getElementById('registerTop'),logout=document.getElementById('logoutTop');
 if(login)login.style.display=u?'none':'';
 if(reg)reg.style.display=u?'none':'';
 if(logout)logout.style.display=u?'':'none';
}
function logout(){localStorage.removeItem('kmitlCurrentUser');location.href='index.html'}
document.addEventListener('DOMContentLoaded',updateUserUI);