/**
 * This file serves as documentation for all available API endpoints.
 * Each endpoint is listed with its method, path, and description.
 */

export const API_ENDPOINTS = {
  auth: {
    login: {
      method: 'POST',
      path: '/auth/login',
      description: 'User login with email or phone number',
      protected: false,
    },
    register: {
      method: 'POST',
      path: '/auth/register',
      description: 'User registration',
      protected: false,
    },
    registerAdmin: {
      method: 'POST',
      path: '/auth/register/admin',
      description: 'Admin registration',
      protected: false,
    },
    profile: {
      method: 'GET',
      path: '/auth/profile',
      description: 'Get user profile',
      protected: true,
    },
  },

  health: {
    check: {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint',
      protected: false,
    },
    devToken: {
      method: 'GET',
      path: '/health/dev-token',
      description: 'Get development token',
      protected: false,
    },
  },

  prestamos: {
    findByJunta: {
      method: 'GET',
      path: '/prestamos/junta/:juntaId',
      description: 'Get all prestamos for a junta',
      protected: true,
    },
    findPagosByJunta: {
      method: 'GET',
      path: '/prestamos/junta/:juntaId/pagos',
      description: 'Get all pagos for a junta',
      protected: true,
    },
    create: {
      method: 'POST',
      path: '/prestamos',
      description: 'Create a new prestamo',
      protected: true,
    },
    createPago: {
      method: 'POST',
      path: '/prestamos/:id/pagos',
      description: 'Create a new pago for a prestamo',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/prestamos/:id',
      description: 'Get a specific prestamo',
      protected: true,
    },
    update: {
      method: 'PUT',
      path: '/prestamos/:id',
      description: 'Update a prestamo',
      protected: true,
    },
    remove: {
      method: 'DELETE',
      path: '/prestamos/:id',
      description: 'Delete a prestamo',
      protected: true,
    },
    findByMember: {
      method: 'GET',
      path: '/prestamos/member/:memberId',
      description: 'Get all prestamos for a member',
      protected: true,
    },
  },

  juntas: {
    create: {
      method: 'POST',
      path: '/juntas',
      description: 'Create a new junta',
      protected: true,
    },
    findAll: {
      method: 'GET',
      path: '/juntas',
      description: 'Get all juntas',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/juntas/:id',
      description: 'Get a specific junta',
      protected: true,
    },
    deleteJunta: {
      method: 'DELETE',
      path: '/juntas/:id',
      description: 'Delete a junta',
      protected: true,
    },
    addMember: {
      method: 'POST',
      path: '/juntas/:id/members',
      description: 'Add a member to a junta',
      protected: true,
    },
  },

  users: {
    findAll: {
      method: 'GET',
      path: '/users',
      description: 'Get all users',
      protected: true,
    },
    findMe: {
      method: 'GET',
      path: '/users/me',
      description: 'Get current user profile',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/users/:id',
      description: 'Get user by ID',
      protected: true,
    },
    updateRole: {
      method: 'PUT',
      path: '/users/:id/role',
      description: 'Update user role',
      protected: true,
    },
    webhook: {
      method: 'POST',
      path: '/users/webhook',
      description: 'Clerk webhook endpoint',
      protected: false,
    },
  },

  multas: {
    create: {
      method: 'POST',
      path: '/multas',
      description: 'Create a new multa',
      protected: true,
    },
    findByJunta: {
      method: 'GET',
      path: '/multas/junta/:juntaId',
      description: 'Get all multas for a junta',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/multas/:id',
      description: 'Get a specific multa',
      protected: true,
    },
    update: {
      method: 'PUT',
      path: '/multas/:id',
      description: 'Update a multa',
      protected: true,
    },
    remove: {
      method: 'DELETE',
      path: '/multas/:id',
      description: 'Delete a multa',
      protected: true,
    },
  },

  agenda: {
    create: {
      method: 'POST',
      path: '/agenda',
      description: 'Create a new agenda item',
      protected: true,
    },
    findByJunta: {
      method: 'GET',
      path: '/agenda/junta/:juntaId',
      description: 'Get all agenda items for a junta',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/agenda/:id',
      description: 'Get a specific agenda item',
      protected: true,
    },
    update: {
      method: 'PUT',
      path: '/agenda/:id',
      description: 'Update an agenda item',
      protected: true,
    },
    remove: {
      method: 'DELETE',
      path: '/agenda/:id',
      description: 'Delete an agenda item',
      protected: true,
    },
  },

  acciones: {
    create: {
      method: 'POST',
      path: '/acciones',
      description: 'Create a new accion',
      protected: true,
    },
    findByJunta: {
      method: 'GET',
      path: '/acciones/junta/:juntaId',
      description: 'Get all acciones for a junta',
      protected: true,
    },
    findByUser: {
      method: 'GET',
      path: '/acciones/user',
      description: 'Get all acciones for current user',
      protected: true,
    },
    findOne: {
      method: 'GET',
      path: '/acciones/:id',
      description: 'Get a specific accion',
      protected: true,
    },
    update: {
      method: 'PUT',
      path: '/acciones/:id',
      description: 'Update an accion',
      protected: true,
    },
    remove: {
      method: 'DELETE',
      path: '/acciones/:id',
      description: 'Delete an accion',
      protected: true,
    },
  },

  members: {
    getJuntaMembers: {
      method: 'GET',
      path: '/members/junta/:juntaId',
      description: 'Get all members of a junta',
      protected: true,
    },
    getMemberByDni: {
      method: 'GET',
      path: '/members/dni/:documentNumber',
      description: 'Get member by DNI',
      protected: true,
    },
    getMemberPrestamos: {
      method: 'GET',
      path: '/members/dni/:documentNumber/prestamos',
      description: 'Get member prestamos by DNI',
      protected: true,
    },
    getMemberMultas: {
      method: 'GET',
      path: '/members/dni/:documentNumber/multas',
      description: 'Get member multas by DNI',
      protected: true,
    },
    getMemberAcciones: {
      method: 'GET',
      path: '/members/dni/:documentNumber/acciones',
      description: 'Get member acciones by DNI',
      protected: true,
    },
    getMemberPagos: {
      method: 'GET',
      path: '/members/dni/:documentNumber/pagos',
      description: 'Get member pagos by DNI',
      protected: true,
    },
    addMember: {
      method: 'POST',
      path: '/members/:juntaId/add/:documentNumber',
      description: 'Add member to junta',
      protected: true,
    },
    removeMember: {
      method: 'DELETE',
      path: '/members/:juntaId/:memberId',
      description: 'Remove member from junta',
      protected: true,
    },
  },

  capital: {
    createCapitalSocial: {
      method: 'POST',
      path: '/capital/social',
      description: 'Create capital social for a junta',
      protected: true,
    },
    getCapitalSocial: {
      method: 'GET',
      path: '/capital/social/junta/:juntaId',
      description: 'Get capital social for a junta',
      protected: true,
    },
    updateCapitalSocial: {
      method: 'PUT',
      path: '/capital/social/:id',
      description: 'Update capital social',
      protected: true,
    },
    createIngreso: {
      method: 'POST',
      path: '/capital/ingreso',
      description: 'Create a new ingreso',
      protected: true,
    },
    getIngresos: {
      method: 'GET',
      path: '/capital/ingreso/:capitalSocialId',
      description: 'Get all ingresos for a capital social',
      protected: true,
    },
    removeIngreso: {
      method: 'DELETE',
      path: '/capital/ingreso/:id',
      description: 'Delete an ingreso',
      protected: true,
    },
    createGasto: {
      method: 'POST',
      path: '/capital/gasto',
      description: 'Create a new gasto',
      protected: true,
    },
    getGastos: {
      method: 'GET',
      path: '/capital/gasto/:capitalSocialId',
      description: 'Get all gastos for a capital social',
      protected: true,
    },
    removeGasto: {
      method: 'DELETE',
      path: '/capital/gasto/:id',
      description: 'Delete a gasto',
      protected: true,
    },
  },
};
