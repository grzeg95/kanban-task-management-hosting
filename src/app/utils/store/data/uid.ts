export const uid = (ids?: Set<string>) => {

  const _uid = () => {

    let id = '';
    const length = 28;

    const letters = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789';

    while (id.length != length) {
      const letter = letters[Math.floor(Math.random() * letters.length)];
      id += letter;
    }

    return id;
  };

  let __id: string = _uid();

  if (!ids) {
    return __id;
  }

  while (ids.has(__id)) {
    __id = _uid();
  }

  return __id;
}

