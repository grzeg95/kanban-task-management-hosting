function _id() {

  let id = '';
  const length = 28;

  const letters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789';

  while (id.length != length) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    id += letter;
  }

  return id;
}

export function id(ids?: Set<string>) {

  let __id: string = _id();

  if (!ids) {
    return __id;
  }

  while (ids.has(__id)) {
    __id = _id();
  }

  return __id;
}

