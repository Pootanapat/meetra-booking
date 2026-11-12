export class RoomFilterPolicy {
  getBuilding(location) {
    return String(location ?? '').replace(/^ชั้น\s*\d+\s*/u, '').trim();
  }

  getEquipmentOptions(rooms) {
    return [...new Set(rooms.flatMap(room =>
      String(room.equipment ?? '').split(',').map(value => value.trim()).filter(Boolean)
    ))].sort((first, second) => first.localeCompare(second, 'th'));
  }

  getBuildingOptions(rooms) {
    return [...new Set(rooms.map(room => this.getBuilding(room.location)).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second, 'th'));
  }

  filter(rooms, { query = '', capacity = 'all', equipment = 'all', building = 'all' } = {}) {
    const normalizedQuery = query.trim().toLowerCase();
    return rooms.filter(room => {
      const searchableText = `${room.name} ${room.location} ${room.description} ${room.equipment}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesCapacity = capacity === 'all' ||
        (capacity === 'small' && room.capacity <= 15) ||
        (capacity === 'large' && room.capacity > 15);
      const matchesEquipment = equipment === 'all' || String(room.equipment ?? '')
        .split(',').map(value => value.trim()).includes(equipment);
      const matchesBuilding = building === 'all' || this.getBuilding(room.location) === building;
      return matchesQuery && matchesCapacity && matchesEquipment && matchesBuilding;
    });
  }
}

