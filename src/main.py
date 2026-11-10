##(รันทดสอบระบบ)
from smart_filter import SmartFilter

def main():
    sf = SmartFilter()

    saved_state = sf.load_filter_state()
    print("📋 State ที่บันทึกไว้:", saved_state)

    print("\n🔍 ค้นหาห้อง: Building 1 | ความจุ >= 8 คน | มี Projector")
    results = sf.filter_rooms(
        building="Building 1",
        min_capacity=8,
        required_amenities=["Projector"]
    )

    print(f"\n✅ พบทั้งหมด {len(results)} ห้อง:")
    for room in results:
        amenities = ", ".join(room["amenities"])
        status = "ว่าง" if room["is_available"] else "ไม่ว่าง"
        print(f"  • {room['name']} ({room['building']}) | ความจุ: {room['capacity']} คน | สถานะ: {status} | อุปกรณ์: {amenities}")

if __name__ == "__main__":
    main()