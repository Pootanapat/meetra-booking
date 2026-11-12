export class SystemController {
  health(_request, response) {
    return response.json({ status: 'ok' });
  }
}

