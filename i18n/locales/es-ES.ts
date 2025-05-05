import { defineI18nLocale } from "#i18n";

export default defineI18nLocale(() => ({
  app: {
    name: "App",
  },
  layouts: {
    default: {
      title: "App",
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
      description: "Bienvenido a la página de inicio",
    },
    settings: {
      title: "Configuración de la aplicación",
      description: "Configurar los ajustes de la aplicación",
      general: {
        title: "Configuración general",
        description: "Ajustar preferencias generales",
        tab: "General",
      },
      users: {
        title: "Configuración de usuarios",
        description: "Gestionar usuarios y asignar roles",
        tab: "Usuarios",
        table: {
          filter: "Filtrar",
          search: "Buscar",
          sort: "Ordenar",
          username: "Usuario",
          fullname: "Nombre",
          email: "Email",
          roles: "Roles",
          groups: "Grupos",
          actions: {
            title: "Acciones",
            create: {
              label: "Crear",
              success: {
                title: "Usuario creado",
                description: "El usuario ha sido creado correctamente",
              },
              error: {
                title: "Usuario no creado",
                description: "Error al crear el usuario",
              },
            },
            update: {
              label: "Editar",
              success: {
                title: "Usuario actualizado",
                description: "El usuario ha sido actualizado correctamente",
              },
              error: {
                title: "Usuario no actualizado",
                description: "Error al actualizar el usuario",
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
                description: "Error al eliminar el usuario",
              },
            },
          },
        },
      },
      groups: {
        title: "Configuración de grupos",
        description: "Gestionar grupos y asignar roles",
        tab: "Grupos",
        table: {
          filter: "Filtrar",
          search: "Buscar",
          sort: "Ordenar",
          name: "Nombre",
          description: "Descripción",
          roles: "Roles",
          actions: {
            title: "Acciones",
            create: {
              label: "Crear",
              success: {
                title: "Grupo creado",
                description: "El grupo ha sido creado correctamente",
              },
              error: {
                title: "Grupo no creado",
                description: "Error al crear el grupo",
              },
            },
            update: {
              label: "Editar",
              success: {
                title: "Grupo actualizado",
                description: "El grupo ha sido actualizado correctamente",
              },
              error: {
                title: "Grupo no actualizado",
                description: "Error al actualizar el grupo",
              },
            },
            delete: {
              label: "Eliminar",
              success: {
                title: "Grupo eliminado",
                description: "El grupo ha sido eliminado correctamente",
              },
              error: {
                title: "Grupo no eliminado",
                description: "Error al eliminar el grupo",
              },
            },
          },
        },
      },
    },
    about: {
      title: "Acerca de",
      description: "Información sobre la aplicación",
    },
    error: {
      title: "Error",
      description: "Ocurrió un error",
      back: "Volver al inicio",
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
      upsertModal: {
        create: {
          title: "Crear usuario",
          description: "Proporcione los detalles para añadir un nuevo usuario",
        },
        update: {
          title: "Editar usuario",
          description: "Modifique los detalles de un usuario existente",
        },
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
          groups: {
            label: "Grupos",
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
        description: "Confirme la eliminación permanente de este usuario",
        form: {
          message: '¿Está seguro de que desea eliminar al usuario "{username}"?',
          delete: {
            label: "Eliminar",
          },
          cancel: {
            label: "Cancelar",
          },
        },
      },
    },
    groups: {
      upsertModal: {
        create: {
          title: "Crear grupo",
          description: "Proporcione los detalles para añadir un nuevo grupo",
        },
        update: {
          title: "Editar grupo",
          description: "Modifique los detalles de un grupo existente",
        },
        form: {
          name: {
            label: "Nombre",
          },
          description: {
            label: "Descripción",
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
        title: "Eliminar grupo",
        description: "Confirme la eliminación permanente de este grupo",
        form: {
          message: '¿Está seguro de que desea eliminar el grupo "{name}"?',
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
