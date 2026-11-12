// ข้อมูลห้องประชุมทั้ง 5 ห้องในระบบ KMITL Room Booking
const ROOMS = [
  {
    id: "101",
    name: "ห้องประชุม 101 (Smart Meeting Room)",
    icon: "🏢",
    capacity: 20,
    floor: "1",
    equipment: "Smart TV 75\", ระบบประชุมออนไลน์, ไวท์บอร์ด, Wi-Fi"
  },
  {
    id: "102",
    name: "ห้องประชุม 102 (Brainstorm Studio)",
    icon: "💡",
    capacity: 10,
    floor: "1",
    equipment: "กระจกเขียนได้รอบด้าน, โปรเจคเตอร์, ปลั๊กพ่วงรอบโต๊ะ"
  },
  {
    id: "201",
    name: "ห้องประชุม 201 (Executive Boardroom)",
    icon: "🏛️",
    capacity: 16,
    floor: "2",
    equipment: "ชุดไมค์ประชุมไร้สาย, จอ Interactive, ระบบเสียงรอบทิศทาง"
  },
  {
    id: "202",
    name: "ห้องประชุม 202 (Seminar Room)",
    icon: "🎓",
    capacity: 40,
    floor: "2",
    equipment: "โปรเจคเตอร์คู่, ไมโครโฟน 2 ตัว, โพเดียมบรรยาย"
  },
  {
    id: "301",
    name: "ห้องประชุม 301 (Co-Working Pod)",
    icon: "💻",
    capacity: 6,
    floor: "3",
    equipment: "จอมอนิเตอร์เสริม, สาย HDMI/Type-C, เครื่องปรับอากาศ"
  }
];

// ฟังก์ชันดึงข้อมูลการจองทั้งหมดจาก LocalStorage
function getBookings() {
  const possibleKeys = ["bookings", "kmitl_bookings", "meetra_bookings", "roomBookings"];
  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
  }

  // ค้นหาอัตโนมัติเผื่อหน้าจองบันทึกด้วยชื่อ key อื่นที่มีคำว่า book
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().includes("book")) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
  }
  return [];
}

// ฟังก์ชันบันทึกข้อมูลการจองลง LocalStorage
function saveBookings(bookings) {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

// จัดการสถานะผู้ใช้บนแถบด้านบนและด้านข้าง (ถ้ามีระบบ Login)
function syncUserUI() {
  try {
    const userRaw = localStorage.getItem("currentUser") || localStorage.getItem("user");
    if (!userRaw) return;
    const user = JSON.parse(userRaw);
    const name = user.name || user.username || user.email || "ผู้ใช้งาน";

    const avatarEl = document.getElementById("avatar");
    const labelEl = document.getElementById("userLabel");
    const loginBtn = document.getElementById("loginTop");
    const regBtn = document.getElementById("registerTop");
    const logoutBtn = document.getElementById("logoutTop");

    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (labelEl) labelEl.textContent = name;
    if (loginBtn) loginBtn.style.display = "none";
    if (regBtn) regBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } catch (e) {}
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("user");
  location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", syncUserUI);