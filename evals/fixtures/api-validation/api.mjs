let handled = 0;

export function request(body) {
  handled += 1;
  return { status: 200, body: { id: body.id } };
}

export function handlerCount() {
  return handled;
}
