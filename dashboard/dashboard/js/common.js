const getBookings=()=>{
 const saved=localStorage.getItem('kmitlBookings');
 if(saved===null){
  const bookings=MOCK_BOOKINGS.map(booking=>({...booking}));
  saveBookings(bookings);
  return bookings;
 }
 return JSON.parse(saved);
};
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