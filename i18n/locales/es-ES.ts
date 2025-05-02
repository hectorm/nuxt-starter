import { defineI18nLocale } from "#i18n";

export default defineI18nLocale(() => ({
  layouts: {
    default: {
      title: "Aplicación de ejemplo",
      description: "Aplicación de ejemplo",
      sidebar: {
        title: "Menú",
        description: "Menú de navegación",
        toggle: "Alternar menú lateral",
      },
    },
  },
  pages: {
    home: {
      title: "Inicio",
      description: "Página de inicio de la aplicación",
    },
    settings: {
      title: "Configuración de la aplicación",
      description: "Configuración de la aplicación",
      general: {
        title: "Configuración general",
        description: "Configuración general",
        tab: "General",
      },
      users: {
        title: "Configuración de usuarios",
        description: "Configuración de usuarios",
        tab: "Usuarios",
        table: {
          filter: "Filtrar",
          search: "Buscar",
          sort: "Ordenar",
          username: "Usuario",
          fullname: "Nombre",
          email: "Email",
          roles: "Roles",
          actions: {
            title: "Acciones",
            edit: {
              label: "Editar",
              success: {
                title: "Usuario actualizado",
                description: "El usuario ha sido actualizado correctamente",
              },
              error: {
                title: "Usuario no actualizado",
                description: "El usuario no pudo ser actualizado",
              },
            },
            delete: {
              label: "Eliminar",
              success: {
                title: "Usuario eliminado",
                description: "El usuario ha sido eliminado correctamente",
              },
              error: {
                title: "Usuario no eliminado",
                description: "El usuario no pudo ser eliminado",
              },
            },
          },
        },
      },
    },
    about: {
      title: "Acerca de",
      description: "Acerca de esta aplicación",
    },
    error: {
      title: "Error",
      description: "Ocurrió un error",
      back: "Volver a inicio",
      message: {
        400: "Solicitud incorrecta",
        401: "No autorizado",
        403: "Prohibido",
        404: "Página no encontrada",
        405: "Método no permitido",
        410: "Ya no disponible",
        429: "Demasiadas solicitudes",
        500: "Error interno del servidor",
      },
    },
  },
  components: {
    userMenu: {
      anonymous: {
        label: "Anónimo",
      },
      settings: {
        label: "Configuración",
      },
      language: {
        label: "Idioma",
      },
      theme: {
        label: "Tema",
        value: {
          light: "Claro",
          dark: "Oscuro",
        },
      },
      logIn: {
        label: "Iniciar sesión",
      },
      logOut: {
        label: "Cerrar sesión",
      },
    },
    users: {
      editModal: {
        title: "Editar usuario",
        description: "Editar detalles del usuario",
        form: {
          username: {
            label: "Nombre de usuario",
          },
          fullname: {
            label: "Nombre completo",
          },
          email: {
            label: "Email",
          },
          roles: {
            label: "Roles",
          },
          save: {
            label: "Guardar",
          },
          cancel: {
            label: "Cancelar",
          },
        },
      },
      deleteModal: {
        title: "Eliminar usuario",
        description: "Confirmación de eliminación de usuario",
        form: {
          message: '¿Está seguro de que desea eliminar el usuario "{username}"?',
          delete: {
            label: "Eliminar",
          },
          cancel: {
            label: "Cancelar",
          },
        },
      },
    },
  },
}));
