export const providedCredentials = {
  usuario: {
    label: 'usuario principal',
    email: 'usuario1@playarena.com',
    password: 'User1234@',
    expectedProfile: 'usuario',
  },
  proprietario: {
    label: 'proprietario principal',
    email: 'adrianvinitccsixseven@gmail.com',
    password: 'Vinicius123@',
    expectedProfile: 'proprietario',
  },
  admin: {
    label: 'admin principal',
    email: 'admin@playarena.com',
    password: '123456',
    expectedProfile: 'admin',
  },
};

export const seededCredentials = {
  usuario: {
    label: 'usuario de teste Playwright',
    email: 'playwright.user@playarena.com',
    password: 'User1234@',
    expectedProfile: 'usuario',
  },
  proprietario: {
    label: 'proprietario de teste Playwright',
    email: 'playwright.owner@playarena.com',
    password: 'User1234@',
    expectedProfile: 'proprietario',
  },
  targetUser: {
    label: 'usuario alvo admin Playwright',
    email: 'playwright.target@playarena.com',
    password: 'User1234@',
    expectedProfile: 'usuario',
  },
  pendingOwner: {
    label: 'proprietario pendente Playwright',
    email: 'playwright.pending.owner@playarena.com',
    password: 'User1234@',
    expectedProfile: 'proprietario',
  },
};

export const testCourt = {
  name: 'Playwright Arena Visual',
  search: 'Playwright',
};
