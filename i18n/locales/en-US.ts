import { defineI18nLocale } from "#i18n";

export default defineI18nLocale(() => ({
  layouts: {
    default: {
      title: "Sample app",
      description: "Sample app",
      sidebar: {
        title: "Menu",
        description: "Navigation menu",
        toggle: "Toggle sidebar",
      },
    },
  },
  pages: {
    home: {
      title: "Home",
      description: "Application home page",
    },
    settings: {
      title: "Application settings",
      description: "Application settings",
      general: {
        title: "General settings",
        description: "General settings",
        tab: "General",
      },
      users: {
        title: "Users settings",
        description: "Users settings",
        tab: "Users",
        table: {
          filter: "Filter",
          search: "Search",
          sort: "Sort",
          username: "Username",
          fullname: "Full name",
          email: "Email",
          roles: "Roles",
          actions: {
            title: "Actions",
            edit: {
              label: "Edit",
              success: {
                title: "User updated",
                description: "User has been updated successfully",
              },
              error: {
                title: "User not updated",
                description: "User could not be updated",
              },
            },
            delete: {
              label: "Delete",
              success: {
                title: "User deleted",
                description: "User has been deleted successfully",
              },
              error: {
                title: "User not deleted",
                description: "User could not be deleted",
              },
            },
          },
        },
      },
    },
    about: {
      title: "About",
      description: "About this application",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      back: "Back to home",
      message: {
        400: "Bad request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Page not found",
        405: "Method not allowed",
        410: "No longer available",
        429: "Too many requests",
        500: "Internal server error",
      },
    },
  },
  components: {
    userMenu: {
      anonymous: {
        label: "Anonymous",
      },
      settings: {
        label: "Settings",
      },
      language: {
        label: "Language",
      },
      theme: {
        label: "Theme",
        value: {
          light: "Light",
          dark: "Dark",
        },
      },
      logIn: {
        label: "Log in",
      },
      logOut: {
        label: "Log out",
      },
    },
    users: {
      editModal: {
        title: "Edit user",
        description: "Edit user details",
        form: {
          username: {
            label: "Username",
          },
          fullname: {
            label: "Full name",
          },
          email: {
            label: "Email",
          },
          roles: {
            label: "Roles",
          },
          save: {
            label: "Save",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
      deleteModal: {
        title: "Delete user",
        description: "Delete user confirmation",
        form: {
          message: 'Are you sure you want to delete the user "{username}"?',
          delete: {
            label: "Delete",
          },
          cancel: {
            label: "Cancel",
          },
        },
      },
    },
  },
}));
