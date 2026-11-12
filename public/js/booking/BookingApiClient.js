export class BookingApiClient {
  constructor({ publicFetch = globalThis.fetch, authenticatedFetch } = {}) {
    this.publicFetch = publicFetch;
    this.authenticatedFetch = authenticatedFetch;
  }

  async listRooms() {
    return this.requestJson(this.publicFetch, '/api/rooms');
  }

  async listAvailability() {
    return this.requestJson(this.publicFetch, '/api/availability');
  }

  async createBooking(booking) {
    return this.requestJson(this.authenticatedFetch, '/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
  }

  async requestJson(fetchFunction, url, options) {
    if (typeof fetchFunction !== 'function') throw new Error('Fetch dependency is not configured');
    const response = await fetchFunction(url, options);
    const data = await response.json();
    return { response, data };
  }
}

