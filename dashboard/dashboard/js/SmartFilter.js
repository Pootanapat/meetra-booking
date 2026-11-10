class SmartFilter {
    constructor({ container, rooms, onChange }) {
        this.container = container;
        this.rooms = rooms;
        this.onChange = onChange;
        this.controls = {};
        this.render();
    }

    render() {
        const form = document.createElement('div');
        form.className = 'smart-filter';
        form.setAttribute('role', 'search');

        this.controls.search = this.createSelectOrInput('input', {
            type: 'search',
            placeholder: 'ค้นหาชื่อห้องหรือหมายเลขห้อง',
            ariaLabel: 'ค้นหาห้องประชุม',
        });
        this.controls.capacity = this.createSelectOrInput('select', {
            ariaLabel: 'กรองตามความจุ',
        });
        this.addOption(this.controls.capacity, '', 'ทุกขนาดห้อง');
        [...new Set([30, 40, 80, ...this.rooms.map(room => room.capacity)])]
            .sort((first, second) => first - second)
            .forEach(capacity => {
                this.addOption(this.controls.capacity, String(capacity), `${capacity} คนขึ้นไป`);
            });

        this.controls.equipment = this.createSelectOrInput('select', {
            ariaLabel: 'กรองตามอุปกรณ์',
        });
        this.addOption(this.controls.equipment, '', 'ทุกอุปกรณ์');
        [...new Set(this.rooms.flatMap(room => room.equipmentItems || []))]
            .sort((first, second) => first.localeCompare(second, 'th'))
            .forEach(equipment => this.addOption(this.controls.equipment, equipment, equipment));

        this.controls.building = this.createSelectOrInput('select', {
            ariaLabel: 'กรองตามอาคาร',
        });
        this.addOption(this.controls.building, '', 'ทุกอาคาร');
        [...new Set(this.rooms.map(room => room.building).filter(Boolean))]
            .sort((first, second) => first.localeCompare(second, 'th'))
            .forEach(building => this.addOption(this.controls.building, building, building));

        Object.values(this.controls).forEach(control => {
            const eventName = control === this.controls.search ? 'input' : 'change';
            control.addEventListener(eventName, () => this.onChange());
            form.append(control);
        });

        this.count = document.createElement('span');
        this.count.className = 'smart-filter-count';
        this.count.setAttribute('aria-live', 'polite');
        form.append(this.count);

        this.resetButton = document.createElement('button');
        this.resetButton.type = 'button';
        this.resetButton.className = 'secondary smart-filter-reset';
        this.resetButton.textContent = 'ล้างตัวกรอง';
        this.resetButton.addEventListener('click', () => {
            Object.values(this.controls).forEach(control => {
                control.value = '';
            });
            this.onChange();
            this.controls.search.focus();
        });
        form.append(this.resetButton);

        this.container.replaceChildren(form);
    }

    createSelectOrInput(tagName, attributes) {
        const control = document.createElement(tagName);
        if (tagName === 'input') {
            control.type = attributes.type;
            control.placeholder = attributes.placeholder;
        }
        control.setAttribute('aria-label', attributes.ariaLabel);
        return control;
    }

    addOption(select, value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.append(option);
    }

    filterRooms(rooms = this.rooms) {
        const query = this.controls.search.value.trim().toLocaleLowerCase();
        const capacity = Number(this.controls.capacity.value || 0);
        const equipment = this.controls.equipment.value;
        const building = this.controls.building.value;

        return rooms.filter(room => {
            const matchesSearch = `${room.name} ${room.id} ${room.building}`
                .toLocaleLowerCase()
                .includes(query);
            const matchesEquipment = !equipment
                || (room.equipmentItems || []).includes(equipment);
            return matchesSearch
                && room.capacity >= capacity
                && matchesEquipment
                && (!building || room.building === building);
        });
    }

    updateCount(visible, total = this.rooms.length) {
        this.count.textContent = `แสดง ${visible} จาก ${total} ห้อง`;
    }
}
